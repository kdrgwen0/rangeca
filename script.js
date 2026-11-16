
"use strict";

/* =====================================
   RANGEÇA 2.1 — SCRIPT PRINCIPAL
   Sauvegarde locale automatique
   ===================================== */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "rangeca_taches";
const SETTINGS_KEY = "rangeca_parametres";
const DELETED_KEY = "rangeca_taches_supprimees";

const categories = {
  ecole: "📚 École",
  achats: "🛒 Achats",
  maison: "🏠 Maison",
  sport: "⚽ Sport",
  loisirs: "🎮 Loisirs",
  rendezvous: "📌 Rendez-vous",
  autre: "📦 Autres"
};

let taches = [];
let pageActuelle = "accueil";

let parametres = {
  nom: "",
  theme: "sombre",
  notifications: false,
  rappels: false,
  heureRappel: "18:00"
};

/* UTILITAIRES */

function creerId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function dateLocale() {
  const d = new Date();
  const annee = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function normaliserTache(t) {
  return {
    ...t,
    id: String(t.id || creerId()),
    nom: String(t.nom || t.titre || "Tâche sans nom"),
    categorie: categories[t.categorie] ? t.categorie : "autre",
    priorite: ["basse", "normale", "haute", "urgente"].includes(t.priorite)
      ? t.priorite : "normale",
    date: t.date || "",
    heure: t.heure || "",
    description: t.description || "",
    terminee: Boolean(t.terminee),
    rappel: Boolean(t.rappel),
    creeLe: t.creeLe || new Date().toISOString()
  };
}

/* CHARGEMENT ET SAUVEGARDE */

function chargerDonnees() {
  try {
    const sauvegarde = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(sauvegarde)) {
      taches = sauvegarde.map(normaliserTache);
    }
  } catch (e) {
    console.error("Erreur de chargement des tâches :", e);
  }

  try {
    const reglages = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (reglages && typeof reglages === "object") {
      parametres = { ...parametres, ...reglages };
    }
  } catch (e) {
    console.error("Erreur de chargement des paramètres :", e);
  }

  $("nomUtilisateur").value = parametres.nom || "";
  $("themeApplication").value = parametres.theme || "sombre";
  $("rappelGlobal").checked = Boolean(parametres.rappels);
  $("heureRappel").value = parametres.heureRappel || "18:00";

  appliquerTheme();
}

function sauvegarder(synchroniserEnLigne = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taches));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(parametres));
  } catch (e) {
    console.error(e);
    notifier("Erreur de sauvegarde des données.");
  }
}

function appliquerTheme() {
  document.body.classList.toggle("light", parametres.theme === "clair");
}

/* MESSAGES */

function notifier(message) {
  const conteneur = $("toastContainer");
  const toast = document.createElement("div");

  toast.className = "toast";
  toast.textContent = message;
  conteneur.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

/* NAVIGATION */

function ouvrirPage(nom) {
  const pages = {
    accueil: "pageAccueil",
    toutes: "pageToutes",
    aujourdhui: "pageAujourdhui",
    terminees: "pageTerminees",
    parametres: "pageParametres"
  };

  if (!pages[nom]) return;

  pageActuelle = nom;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  $(pages[nom]).classList.add("active");

  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === nom);
  });

  const titres = {
    accueil: `Bonjour${parametres.nom ? " " + parametres.nom : ""} 👋`,
    toutes: "Toutes mes tâches",
    aujourdhui: "Aujourd'hui 📅",
    terminees: "Tâches terminées",
    parametres: "Paramètres ⚙️"
  };

  $("titrePage").textContent = titres[nom];
  $("sidebar").classList.remove("ouverte");

  actualiser();
}

/* AJOUT */

function ajouterTache(e) {
  e.preventDefault();

  const nom = $("titreTache").value.trim();

  if (!nom) {
    notifier("Écris le nom de ta tâche !");
    $("titreTache").focus();
    return;
  }

  const nouvelleTache = normaliserTache({
    id: creerId(),
    nom,
    categorie: $("categorieTache").value,
    priorite: $("prioriteTache").value,
    date: $("dateTache").value,
    heure: $("heureTache").value,
    description: $("descriptionTache").value.trim(),
    rappel: $("rappelTache").checked,
    terminee: false,
    creeLe: new Date().toISOString()
  });

  taches.unshift(nouvelleTache);

  sauvegarder();
  $("formTache").reset();

  actualiser();
  notifier("Tâche ajoutée avec succès ! ✨");
}

/* AFFICHAGE */

function formaterDate(date) {
  if (!date) return "";

  const [a, m, j] = date.split("-").map(Number);
  if (!a || !m || !j) return date;

  return new Intl.DateTimeFormat("fr-FR").format(
    new Date(a, m - 1, j)
  );
}

function creerCarte(tache) {
  const carte = document.createElement("article");
  carte.className = "task-card";

  if (tache.terminee) carte.classList.add("task-done");

  const contenu = document.createElement("div");
  contenu.className = "task-content";

  const titre = document.createElement("h3");
  titre.textContent = tache.nom;

  const infos = document.createElement("div");
  infos.className = "task-infos";

  const categorie = document.createElement("span");
  categorie.textContent = categories[tache.categorie] || categories.autre;

  const priorite = document.createElement("span");
  priorite.className = `priority priority-${tache.priorite}`;
  priorite.textContent = {
    basse: "Basse",
    normale: "Normale",
    haute: "Haute",
    urgente: "Urgente"
  }[tache.priorite];

  infos.append(categorie, priorite);

  if (tache.date) {
    const date = document.createElement("span");
    date.textContent = "📅 " + formaterDate(tache.date);
    infos.appendChild(date);
  }

  if (tache.heure) {
    const heure = document.createElement("span");
    heure.textContent = "🕒 " + tache.heure;
    infos.appendChild(heure);
  }

  contenu.append(titre, infos);

  if (tache.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = tache.description;
    contenu.appendChild(description);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const boutons = [
    [tache.terminee ? "↩" : "✓", "terminer",
      tache.terminee ? "Remettre à faire" : "Terminer"],
    ["✏️", "modifier", "Modifier"],
    ["🗑️", "supprimer", "Supprimer"]
  ];

  boutons.forEach(([texte, action, titreBouton]) => {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "task-action";
    bouton.textContent = texte;
    bouton.title = titreBouton;
    bouton.dataset.action = action;
    bouton.dataset.id = tache.id;
    actions.appendChild(bouton);
  });

  carte.append(contenu, actions);
  return carte;
}

function afficherListe(element, liste, message) {
  element.replaceChildren();

  if (!liste.length) {
    const vide = document.createElement("div");
    vide.className = "empty-state";

    const emoji = document.createElement("span");
    emoji.textContent = "✨";

    const titre = document.createElement("h3");
    titre.textContent = message;

    vide.append(emoji, titre);
    element.appendChild(vide);
    return;
  }

  liste.forEach(tache => {
    element.appendChild(creerCarte(tache));
  });
}

/* STATISTIQUES ET ACTUALISATION */

function actualiserStats() {
  const total = taches.length;
  const terminees = taches.filter(t => t.terminee).length;
  const actives = total - terminees;
  const progression = total
    ? Math.round((terminees / total) * 100)
    : 0;

  $("statTotal").textContent = total;
  $("statActives").textContent = actives;
  $("statTerminees").textContent = terminees;
  $("statProgression").textContent = progression + "%";
}

function afficherAccueil() {
  const recentes = taches
    .filter(t => !t.terminee)
    .slice(0, 5);

  afficherListe($("resultat"), recentes, "Tout est propre ici !");
}

function afficherToutes() {
  let liste = [...taches];

  const categorie = $("filtreCategorie").value;
  const statut = $("filtreStatut").value;
  const tri = $("triTaches").value;
  const terme = $("rechercheTache").value.toLowerCase().trim();

  if (categorie !== "toutes") {
    liste = liste.filter(t => t.categorie === categorie);
  }

  if (statut === "actives") {
    liste = liste.filter(t => !t.terminee);
  }

  if (statut === "terminees") {
    liste = liste.filter(t => t.terminee);
  }

  if (terme) {
    liste = liste.filter(t =>
      t.nom.toLowerCase().includes(terme) ||
      t.description.toLowerCase().includes(terme)
    );
  }

  if (tri === "recentes") {
    liste.sort((a, b) => new Date(b.creeLe) - new Date(a.creeLe));
  }

  if (tri === "anciennes") {
    liste.sort((a, b) => new Date(a.creeLe) - new Date(b.creeLe));
  }

  if (tri === "priorite") {
    const ordre = { urgente: 4, haute: 3, normale: 2, basse: 1 };
    liste.sort((a, b) => ordre[b.priorite] - ordre[a.priorite]);
  }

  if (tri === "date") {
    liste.sort((a, b) =>
      (a.date || "9999-12-31").localeCompare(b.date || "9999-12-31")
    );
  }

  afficherListe($("listeToutes"), liste, "Aucune tâche trouvée.");
}

function afficherAujourdhui() {
  const aujourdHui = dateLocale();

  const liste = taches.filter(t =>
    !t.terminee && t.date === aujourdHui
  );

  afficherListe($("listeAujourdhui"), liste, "Rien de prévu aujourd'hui !");
}

function afficherTerminees() {
  const liste = taches.filter(t => t.terminee);

  afficherListe($("listeTerminees"), liste, "Aucune tâche terminée pour le moment.");
}

function actualiser() {
  actualiserStats();
  afficherAccueil();
  afficherToutes();
  afficherAujourdhui();
  afficherTerminees();
}

/* ACTIONS SUR LES TÂCHES */

function traiterAction(action, id) {
  const tache = taches.find(t => t.id === id);
  if (!tache) return;

  if (action === "terminer") {
    tache.terminee = !tache.terminee;
    sauvegarder();

    notifier(tache.terminee
      ? "Tâche terminée ! 🎉"
      : "Tâche remise à faire.");
  }

  if (action === "supprimer") {
    if (!confirm("Supprimer cette tâche ?")) return;

    taches = taches.filter(t => t.id !== id);

    try {
      const suppressions = JSON.parse(
        localStorage.getItem(DELETED_KEY) || "[]"
      );
      suppressions.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(suppressions)]));
    } catch (e) {
      console.error(e);
    }

    sauvegarder();
    notifier("Tâche supprimée.");
  }

  if (action === "modifier") {
    ouvrirModification(tache);
    return;
  }

  actualiser();
}

/* MODIFICATION */

function ouvrirModification(tache) {
  $("modifierId").value = tache.id;
  $("modifierTitre").value = tache.nom;
  $("modifierCategorie").value = tache.categorie;
  $("modifierPriorite").value = tache.priorite;
  $("modifierDate").value = tache.date;
  $("modifierHeure").value = tache.heure;
  $("modifierDescription").value = tache.description;

  $("modalModification").hidden = false;
  $("modifierTitre").focus();
}

function fermerModification() {
  $("modalModification").hidden = true;
}

function enregistrerModification(e) {
  e.preventDefault();

  const id = $("modifierId").value;
  const tache = taches.find(t => t.id === id);

  if (!tache) return;

  const nom = $("modifierTitre").value.trim();

  if (!nom) {
    notifier("Le nom ne peut pas être vide.");
    return;
  }

  tache.nom = nom;
  tache.categorie = $("modifierCategorie").value;
  tache.priorite = $("modifierPriorite").value;
  tache.date = $("modifierDate").value;
  tache.heure = $("modifierHeure").value;
  tache.description = $("modifierDescription").value.trim();

  sauvegarder();
  fermerModification();
  actualiser();

  notifier("Modifications enregistrées !");
}

/* PROFIL ET APPARENCE */

function sauvegarderProfil() {
  parametres.nom = $("nomUtilisateur").value.trim();
  sauvegarder();

  if (pageActuelle === "accueil") {
    $("titrePage").textContent =
      `Bonjour${parametres.nom ? " " + parametres.nom : ""} 👋`;
  }

  notifier("Profil enregistré !");
}

function changerTheme() {
  parametres.theme = $("themeApplication").value;
  sauvegarder();
  appliquerTheme();
  notifier("Thème modifié !");
}

/* NOTIFICATIONS ET RAPPELS */

async function activerNotifications() {
  if (!("Notification" in window)) {
    notifier("Ton navigateur ne prend pas en charge les notifications.");
    return;
  }

  if (!window.isSecureContext) {
    notifier("Les notifications nécessitent une connexion HTTPS.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      parametres.notifications = true;
      sauvegarder();

      $("statutNotifications").textContent =
        "Notifications autorisées sur cet appareil.";

      new Notification("RangeÇa 🧹", {
        body: "Les notifications sont activées !"
      });

      notifier("Notifications activées !");
    } else {
      parametres.notifications = false;
      sauvegarder();

      $("statutNotifications").textContent =
        "Autorisation des notifications refusée.";
    }
  } catch (e) {
    console.error(e);
    notifier("Impossible d'activer les notifications.");
  }
}

function sauvegarderRappels() {
  parametres.rappels = $("rappelGlobal").checked;
  parametres.heureRappel = $("heureRappel").value || "18:00";

  sauvegarder();
  notifier("Préférences de rappel enregistrées.");
}

/* EXPORT ET IMPORT */

function exporterDonnees() {
  const donnees = {
    version: "2.1",
    exportDate: new Date().toISOString(),
    taches,
    parametres
  };

  const blob = new Blob(
    [JSON.stringify(donnees, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");

  lien.href = url;
  lien.download = "rangeca-sauvegarde.json";
  lien.click();

  URL.revokeObjectURL(url);
  notifier("Sauvegarde exportée !");
}

function importerDonnees(e) {
  const fichier = e.target.files[0];
  if (!fichier) return;

  const lecteur = new FileReader();

  lecteur.onload = () => {
    try {
      const donnees = JSON.parse(lecteur.result);

      const liste = Array.isArray(donnees)
        ? donnees
        : donnees.taches;

      if (!Array.isArray(liste)) {
        throw new Error("Format invalide");
      }

      if (!confirm("Importer cette sauvegarde ? Les tâches actuelles seront remplacées.")) {
        e.target.value = "";
        return;
      }

      taches = liste.map(normaliserTache);

      if (donnees.parametres) {
        parametres = { ...parametres, ...donnees.parametres };
      }

      sauvegarder();
      chargerDonnees();
      actualiser();

      notifier("Sauvegarde importée avec succès !");
    } catch (erreur) {
      console.error(erreur);
      notifier("Fichier invalide ou impossible à importer.");
    }

    e.target.value = "";
  };

  lecteur.readAsText(fichier);
}

/* SUPPRESSION DES DONNÉES */

function viderTerminees() {
  if (!taches.some(t => t.terminee)) {
    notifier("Aucune tâche terminée à supprimer.");
    return;
  }

  if (!confirm("Supprimer toutes les tâches terminées ?")) return;

  taches.filter(t => t.terminee).forEach(t => {
    try {
      const ids = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
      ids.push(t.id);
      localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)]));
    } catch (e) {
      console.error(e);
    }
  });

  taches = taches.filter(t => !t.terminee);

  sauvegarder();
  actualiser();
  notifier("Tâches terminées supprimées.");
}

function reinitialiserDonnees() {
  if (!confirm("Attention : supprimer toutes tes tâches et paramètres locaux ? Exporte une sauvegarde avant si nécessaire.")) {
    return;
  }

  taches = [];
  parametres = {
    nom: "",
    theme: "sombre",
    notifications: false,
    rappels: false,
    heureRappel: "18:00"
  };

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(DELETED_KEY);

  chargerDonnees();
  actualiser();
  ouvrirPage("accueil");

  notifier("Données locales réinitialisées.");
}

/* ÉVÉNEMENTS : NAVIGATION */

document.querySelectorAll(".menu-item").forEach(bouton => {
  bouton.addEventListener("click", () => {
    ouvrirPage(bouton.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(bouton => {
  bouton.addEventListener("click", () => {
    ouvrirPage(bouton.dataset.go);
  });
});

$("heroAjouter").addEventListener("click", () => {
  $("titreTache").focus();
  $("zoneAjout").scrollIntoView({ behavior: "smooth" });
});

$("quickSettings").addEventListener("click", () => {
  ouvrirPage("parametres");
});

$("mobileMenu").addEventListener("click", () => {
  $("sidebar").classList.toggle("ouverte");
});

/* ÉVÉNEMENTS : FORMULAIRES */

$("formTache").addEventListener("submit", ajouterTache);
$("formModification").addEventListener("submit", enregistrerModification);

$("fermerModification").addEventListener("click", fermerModification);

$("modalModification").addEventListener("click", e => {
  if (e.target === $("modalModification")) {
    fermerModification();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") fermerModification();
});

/* ÉVÉNEMENTS : CARTES */

document.addEventListener("click", e => {
  const bouton = e.target.closest("[data-action]");

  if (!bouton) return;

  traiterAction(bouton.dataset.action, bouton.dataset.id);
});

/* ÉVÉNEMENTS : FILTRES */

["rechercheTache", "filtreCategorie", "filtreStatut", "triTaches"]
  .forEach(id => {
    $(id).addEventListener(
      id === "rechercheTache" ? "input" : "change",
      afficherToutes
    );
  });

/* ÉVÉNEMENTS : PARAMÈTRES */

$("sauvegarderProfil").addEventListener("click", sauvegarderProfil);
$("themeApplication").addEventListener("change", changerTheme);
$("activerNotifications").addEventListener("click", activerNotifications);
$("sauvegarderRappels").addEventListener("click", sauvegarderRappels);

$("exporterDonnees").addEventListener("click", exporterDonnees);

$("importerDonneesBtn").addEventListener("click", () => {
  $("importerFichier").click();
});

$("importerFichier").addEventListener("change", importerDonnees);
$("viderTerminees").addEventListener("click", viderTerminees);
$("reinitialiserDonnees").addEventListener("click", reinitialiserDonnees);

/* INITIALISATION */

function initialiser() {
  chargerDonnees();
  actualiser();
  ouvrirPage("accueil");

  if ("Notification" in window &&
      Notification.permission === "granted") {
    $("statutNotifications").textContent =
      "Notifications autorisées sur cet appareil.";
  }

  console.log("RangeÇa 2.1 est prêt !");
}

initialiser();
