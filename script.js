"use strict";

/* =====================================
   RANGEÇA — SCRIPT PRINCIPAL
   Avec synchronisation Supabase
   ===================================== */

const $ = (id) => document.getElementById(id);

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

let parametres = {
    nom: "",
    theme: "sombre",
    notifications: false,
    rappels: false,
    heureRappel: "18:00"
};

let pageActuelle = "accueil";
let recherche = "";

let synchronisationEnCours = false;
let synchronisationDemandee = false;
let temporisateurSync = null;


/* =====================================
   INITIALISATION ET SAUVEGARDE
   ===================================== */

function chargerDonnees() {
    try {
        const sauvegarde = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(sauvegarde)) taches = sauvegarde;
    } catch (e) {
        console.error("Erreur de chargement des tâches", e);
    }

    try {
        const reglages = JSON.parse(localStorage.getItem(SETTINGS_KEY));

        if (reglages && typeof reglages === "object") {
            parametres = { ...parametres, ...reglages };
        }
    } catch (e) {
        console.error("Erreur de chargement des paramètres", e);
    }

    taches = taches.map(t => ({
        ...t,
        id: String(t.id || creerId()),
        nom: String(t.nom || t.titre || "Tâche sans nom"),
        categorie: categories[t.categorie] ? t.categorie : "autre",
        priorite: t.priorite || "normale",
        terminee: Boolean(t.terminee),
        date: t.date || "",
        heure: t.heure || "",
        description: t.description || "",
        rappel: Boolean(t.rappel)
    }));
}

function sauvegarder(synchroniserEnLigne = true) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(taches));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parametres));
    } catch (e) {
        notifier("Impossible de sauvegarder les données.");
        console.error(e);
    }

    if (synchroniserEnLigne) {
        programmerSynchronisation();
    }
}

function creerId() {
    return window.crypto?.randomUUID?.() ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
}


/* =====================================
   SUPABASE — SYNCHRONISATION
   ===================================== */

function afficherStatutSupabase(message) {
    const element = $("statutSupabase");
    if (element) element.textContent = message;
}

async function obtenirUtilisateur() {
    if (typeof supabaseClient === "undefined") return null;

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Erreur utilisateur Supabase :", error);
        return null;
    }

    return data.user || null;
}

function lireSuppressionsLocales() {
    try {
        const donnees = JSON.parse(localStorage.getItem(DELETED_KEY));
        return Array.isArray(donnees) ? donnees : [];
    } catch {
        return [];
    }
}

function enregistrerSuppressionLocale(id) {
    const suppressions = lireSuppressionsLocales();

    if (!suppressions.includes(id)) {
        suppressions.push(id);
    }

    localStorage.setItem(DELETED_KEY, JSON.stringify(suppressions));
}

function supprimerSuppressionLocale(id) {
    const suppressions = lireSuppressionsLocales()
        .filter(element => element !== id);

    localStorage.setItem(DELETED_KEY, JSON.stringify(suppressions));
}

async function envoyerSuppressionsEnAttente(userId) {
    const suppressions = lireSuppressionsLocales();

    for (const id of suppressions) {
        const { error } = await supabaseClient
            .from("taches")
            .update({
                supprimee: true,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)
            .eq("id", id);

        if (error) {
            console.error("Erreur de suppression cloud :", error);
            continue;
        }

        supprimerSuppressionLocale(id);
    }
}

async function envoyerTachesCloud(userId, liste = taches) {
    if (!liste.length) return;

    const lignes = liste.map(tache => ({
        user_id: userId,
        id: String(tache.id),
        donnees: tache,
        updated_at: new Date().toISOString(),
        supprimee: false
    }));

    const { error } = await supabaseClient
        .from("taches")
        .upsert(lignes, {
            onConflict: "user_id,id"
        });

    if (error) {
        console.error("Erreur d'enregistrement Supabase :", error);
        throw error;
    }
}

async function synchroniser() {
    if (synchronisationEnCours) {
        synchronisationDemandee = true;
        return;
    }

    if (typeof supabaseClient === "undefined") {
        afficherStatutSupabase("Supabase n'est pas disponible.");
        return;
    }

    synchronisationEnCours = true;
    synchronisationDemandee = false;

    try {
        afficherStatutSupabase("Synchronisation en cours...");

        const user = await obtenirUtilisateur();

        if (!user) {
            afficherStatutSupabase("Connecte-toi pour synchroniser tes tâches.");
            return;
        }

        // Appliquer les suppressions effectuées hors connexion
        await envoyerSuppressionsEnAttente(user.id);

        // Récupérer les tâches du compte
        let { data: lignes, error } = await supabaseClient
            .from("taches")
            .select("id, donnees, supprimee, updated_at")
            .eq("user_id", user.id);

        if (error) throw error;

        lignes = lignes || [];

        const identifiantsCloud = new Set(
            lignes.map(ligne => String(ligne.id))
        );

        // Première connexion : importer les tâches locales
        // Les nouvelles tâches locales absentes du cloud sont également ajoutées.
        const tachesLocalesAEnvoyer = taches.filter(tache =>
            !identifiantsCloud.has(String(tache.id))
        );

        if (tachesLocalesAEnvoyer.length) {
            await envoyerTachesCloud(user.id, tachesLocalesAEnvoyer);

            const resultat = await supabaseClient
                .from("taches")
                .select("id, donnees, supprimee, updated_at")
                .eq("user_id", user.id);

            if (resultat.error) throw resultat.error;

            lignes = resultat.data || [];
        }

        // Récupérer uniquement les tâches non supprimées
        const tachesCloud = lignes
            .filter(ligne => !ligne.supprimee && ligne.donnees)
            .map(ligne => ({
                ...ligne.donnees,
                id: String(ligne.id)
            }));

        taches = tachesCloud.map(t => ({
            ...t,
            id: String(t.id),
            nom: String(t.nom || t.titre || "Tâche sans nom"),
            categorie: categories[t.categorie] ? t.categorie : "autre",
            priorite: t.priorite || "normale",
            terminee: Boolean(t.terminee),
            date: t.date || "",
            heure: t.heure || "",
            description: t.description || "",
            rappel: Boolean(t.rappel)
        }));

        sauvegarder(false);
        actualiser();

        afficherStatutSupabase(
            "Synchronisation réussie ! ☁️ " +
            taches.length + " tâche(s) synchronisée(s)."
        );

    } catch (error) {
        console.error("Erreur de synchronisation :", error);

        afficherStatutSupabase(
            "Erreur de synchronisation : " + error.message
        );

    } finally {
        synchronisationEnCours = false;

        if (synchronisationDemandee) {
            synchronisationDemandee = false;
            programmerSynchronisation();
        }
    }
}

function programmerSynchronisation() {
    clearTimeout(temporisateurSync);

    temporisateurSync = setTimeout(async () => {
        const user = await obtenirUtilisateur();

        if (!user) return;

        try {
            await envoyerSuppressionsEnAttente(user.id);
            await envoyerTachesCloud(user.id);
            afficherStatutSupabase("Tâches enregistrées dans le cloud ☁️");
        } catch (error) {
            console.error("Sauvegarde cloud impossible :", error);
            afficherStatutSupabase("Erreur de sauvegarde cloud.");
        }
    }, 700);
}

async function supprimerTacheCloud(id) {
    enregistrerSuppressionLocale(id);

    const user = await obtenirUtilisateur();

    if (!user) return;

    const { error } = await supabaseClient
        .from("taches")
        .update({
            supprimee: true,
            updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("id", String(id));

    if (error) {
        console.error("Erreur de suppression cloud :", error);
        afficherStatutSupabase("Suppression en attente de synchronisation.");
    } else {
        supprimerSuppressionLocale(id);
    }
}

// Réagir aux connexions et déconnexions
if (typeof supabaseClient !== "undefined") {
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            setTimeout(() => synchroniser(), 0);
        }

        if (event === "SIGNED_OUT") {
            afficherStatutSupabase("Déconnecté : tâches conservées sur cet appareil.");
        }
    });
}


/* =====================================
   MESSAGES
   ===================================== */

function notifier(message) {
    const conteneur = $("toastContainer");
    if (!conteneur) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    conteneur.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
}


/* =====================================
   NAVIGATION
   ===================================== */

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
        btn.classList.remove("active");
    });

    const bouton = document.querySelector(`[data-page="${nom}"]`);
    if (bouton) bouton.classList.add("active");

    const titres = {
        accueil: `Bonjour${parametres.nom ? " " + parametres.nom : ""} 👋`,
        toutes: "Toutes mes tâches",
        aujourdhui: "Aujourd'hui 📅",
        terminees: "Tâches terminées",
        parametres: "Paramètres ⚙️"
    };

    $("titrePage").textContent = titres[nom];

    $("sidebar")?.classList.remove("ouverte");

    actualiser();
}

function afficherCategorie(categorie) {
    recherche = "";

    ouvrirPage("toutes");

    $("filtreCategorie").value = categorie;
    $("rechercheTache").value = "";

    afficherToutes();
}


/* =====================================
   AJOUT DE TÂCHES
   ===================================== */

function ajouterTache(e) {
    e.preventDefault();

    const nom = $("titreTache").value.trim();

    if (!nom) {
        notifier("Écris le nom de ta tâche !");
        $("titreTache").focus();
        return;
    }

    const nouvelleTache = {
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
    };

    taches.unshift(nouvelleTache);

    sauvegarder();
    $("formTache").reset();

    actualiser();
    notifier("Tâche ajoutée avec succès ! ✨");
}


/* =====================================
   AFFICHAGE DES TÂCHES
   ===================================== */

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
    priorite.className = "priority priority-" + tache.priorite;
    priorite.textContent = {
        basse: "Basse",
        normale: "Normale",
        haute: "Haute",
        urgente: "Urgente"
    }[tache.priorite] || "Normale";

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
        ["✓", "terminer", tache.terminee ? "Remettre à faire" : "Terminer"],
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

function formaterDate(date) {
    if (!date) return "";

    const [annee, mois, jour] = date.split("-").map(Number);

    if (!annee || !mois || !jour) return date;

    return new Intl.DateTimeFormat("fr-FR").format(
        new Date(annee, mois - 1, jour)
    );
}


/* =====================================
   ACTIONS SUR LES TÂCHES
   ===================================== */

function traiterAction(action, id) {
    const tache = taches.find(t => t.id === id);
    if (!tache) return;

    if (action === "terminer") {
        tache.terminee = !tache.terminee;
        notifier(tache.terminee ? "Tâche terminée ! 🎉" : "Tâche remise à faire.");
    }

    if (action === "supprimer") {
        if (!confirm("Supprimer cette tâche ?")) return;

        taches = taches.filter(t => t.id !== id);
        supprimerTacheCloud(id);

        notifier("Tâche supprimée.");
    }

    if (action === "modifier") {
        ouvrirModification(tache);
        return;
    }

    sauvegarder();
    actualiser();
}


/* =====================================
   MODIFICATION
   ===================================== */

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


/* =====================================
   RECHERCHE ET FILTRES
   ===================================== */

function afficherToutes() {
    let liste = [...taches];

    const categorie = $("filtreCategorie").value;
    const statut = $("filtreStatut").value;
    const tri = $("triTaches").value;

    if (categorie !== "toutes") {
        liste = liste.filter(t => t.categorie === categorie);
    }

    if (statut === "actives") {
        liste = liste.filter(t => !t.terminee);
    }

    if (statut === "terminees") {
        liste = liste.filter(t => t.terminee);
    }

    const terme = $("rechercheTache").value.toLowerCase().trim();

    if (terme) {
        liste = liste.filter(t =>
            t.nom.toLowerCase().includes(terme) ||
            t.description.toLowerCase().includes(terme)
        );
    }

    if (tri === "recentes") {
        liste.sort((a, b) => new Date(b.creeLe || 0) - new Date(a.creeLe || 0));
    }

    if (tri === "anciennes") {
        liste.sort((a, b) => new Date(a.creeLe || 0) - new Date(b.creeLe || 0));
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


/* =====================================
   AUJOURD'HUI ET TERMINÉES
   ===================================== */

function afficherAujourdhui() {
    const aujourdHui = new Date();

    const date = [
        aujourdHui.getFullYear(),
        String(aujourdHui.getMonth() + 1).padStart(2, "0"),
        String(aujourdHui.getDate()).padStart(2, "0")
    ].join("-");

    const liste = taches.filter(t => !t.terminee && t.date === date);

    afficherListe($("listeAujourdhui"), liste, "Rien de prévu aujourd'hui !");
}

function afficherTerminees() {
    afficherListe(
        $("listeTerminees"),
        taches.filter(t => t.terminee),
        "Aucune tâche terminée pour le moment."
    );
}


/* =====================================
   STATISTIQUES
   ===================================== */

function afficherStatistiques() {
    const total = taches.length;
    const terminees = taches.filter(t => t.terminee).length;
    const actives = total - terminees;
    const progression = total ? Math.round(terminees / total * 100) : 0;

    $("statTotal").textContent = total;
    $("statActives").textContent = actives;
    $("statTerminees").textContent = terminees;
    $("statProgression").textContent = progression + "%";
}

function actualiser() {
    afficherStatistiques();

    afficherListe(
        $("resultat"),
        taches.filter(t => !t.terminee).slice(0, 5),
        "Tout est propre ici !"
    );

    afficherToutes();
    afficherAujourdhui();
    afficherTerminees();
}


/* =====================================
   PARAMÈTRES
   ===================================== */

function afficherParametres() {
    $("nomUtilisateur").value = parametres.nom;
    $("themeApplication").value = parametres.theme;
    $("rappelGlobal").checked = parametres.rappels;
    $("heureRappel").value = parametres.heureRappel;

    appliquerTheme();
    mettreAJourNotifications();
}

function sauvegarderProfil() {
    parametres.nom = $("nomUtilisateur").value.trim();
    sauvegarder();

    notifier("Profil enregistré !");

    $("titrePage").textContent =
        `Bonjour${parametres.nom ? " " + parametres.nom : ""} 👋`;
}

function appliquerTheme() {
    document.body.dataset.theme = parametres.theme;
}

function changerTheme() {
    parametres.theme = $("themeApplication").value;
    sauvegarder();
    appliquerTheme();
    notifier("Thème modifié !");
}


/* =====================================
   NOTIFICATIONS PUSH
   ===================================== */

function convertirCleVapid(cle) {
    const padding = "=".repeat((4 - cle.length % 4) % 4);
    const base64 = (cle + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const brut = atob(base64);

    return Uint8Array.from(
        brut,
        caractere => caractere.charCodeAt(0)
    );
}

async function activerNotifications() {
    if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
    ) {
        notifier("Ton navigateur ne prend pas en charge les notifications push.");
        return;
    }

    if (typeof supabaseClient === "undefined") {
        notifier("Connexion à Supabase indisponible.");
        return;
    }

    try {
        const user = await obtenirUtilisateur();

        if (!user) {
            notifier("Connecte-toi pour activer les notifications.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            notifier("Autorisation de notification refusée.");
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription =
            await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertirCleVapid(
                    "BHVSj77WCtgklIsspdrPbRP0VyxjKMjt8MMJ_5M9YXWQedRQdqc_Z2oOe3EJpyCvFLE5JiXiL0qR_DxiLDCHpmQ"
                )
            });
        }

        const p256dh = subscription.getKey("p256dh");
        const auth = subscription.getKey("auth");

        if (!p256dh || !auth) {
            throw new Error("Clés de l'abonnement introuvables.");
        }

        const encoder = bytes =>
            btoa(String.fromCharCode(...new Uint8Array(bytes)));

        const abonnement = {
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: encoder(p256dh),
            auth: encoder(auth)
        };

        const { data: existant, error: erreurLecture } =
            await supabaseClient
                .from("push_subscriptions")
                .select("id")
                .eq("endpoint", abonnement.endpoint)
                .maybeSingle();

        if (erreurLecture) throw erreurLecture;

        if (!existant) {
            const { error } = await supabaseClient
                .from("push_subscriptions")
                .insert(abonnement);

            if (error) throw error;
        }

        parametres.notifications = true;
        sauvegarder();
        mettreAJourNotifications();

        notifier("Notifications push activées ! 🔔");

    } catch (erreur) {
        console.error("Erreur notifications push :", erreur);
        notifier("Erreur : " + erreur.message);
    }
}

function mettreAJourNotifications() {
    $("statutNotifications").textContent =
        parametres.notifications
            ? "Notifications autorisées."
            : "Notifications non activées.";
}

function verifierRappels() {
    if (!parametres.notifications || !parametres.rappels) return;

    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const maintenant = new Date();

    const heureActuelle =
        String(maintenant.getHours()).padStart(2, "0") + ":" +
        String(maintenant.getMinutes()).padStart(2, "0");

    if (heureActuelle !== parametres.heureRappel) return;

    const cle = maintenant.toISOString().slice(0, 10);

    if (localStorage.getItem("rangeca_dernier_rappel") === cle) return;

    const demain = new Date(maintenant);
    demain.setDate(demain.getDate() + 1);

    const dateDemain = [
        demain.getFullYear(),
        String(demain.getMonth() + 1).padStart(2, "0"),
        String(demain.getDate()).padStart(2, "0")
    ].join("-");

    const rappels = taches.filter(t =>
        !t.terminee && t.rappel && t.date === dateDemain
    );

    if (rappels.length) {
        new Notification("RangeÇa : rappels de demain 📅", {
            body: `${rappels.length} tâche(s) prévue(s) demain.`
        });
    }

    localStorage.setItem("rangeca_dernier_rappel", cle);
}

function enregistrerReglagesRappels() {
    parametres.rappels = $("rappelGlobal").checked;
    parametres.heureRappel = $("heureRappel").value || "18:00";

    sauvegarder();
    notifier("Réglages des rappels enregistrés !");
}


/* =====================================
   IMPORT / EXPORT
   ===================================== */

function exporterDonnees() {
    const contenu = JSON.stringify(taches, null, 2);

    const fichier = new Blob([contenu], {
        type: "application/json"
    });

    const url = URL.createObjectURL(fichier);
    const lien = document.createElement("a");

    lien.href = url;
    lien.download = "rangeca-sauvegarde.json";
    lien.click();

    URL.revokeObjectURL(url);
    notifier("Export terminé !");
}

function importerDonnees(fichier) {
    if (!fichier) return;

    const lecteur = new FileReader();

    lecteur.onload = () => {
        try {
            const donnees = JSON.parse(lecteur.result);

            if (!Array.isArray(donnees)) {
                throw new Error("Format invalide");
            }

            const importer = donnees.map(t => ({
                id: creerId(),
                nom: String(t.nom || t.titre || "").trim(),
                categorie: categories[t.categorie] ? t.categorie : "autre",
                priorite: ["basse", "normale", "haute", "urgente"].includes(t.priorite)
                    ? t.priorite : "normale",
                date: t.date || "",
                heure: t.heure || "",
                description: String(t.description || ""),
                rappel: Boolean(t.rappel),
                terminee: Boolean(t.terminee),
                creeLe: new Date().toISOString()
            })).filter(t => t.nom);

            taches = [...importer, ...taches];

            sauvegarder();
            actualiser();

            notifier(`${importer.length} tâche(s) importée(s) !`);

        } catch (e) {
            notifier("Fichier invalide ou illisible.");
            console.error(e);
        }

        $("importerFichier").value = "";
    };

    lecteur.readAsText(fichier);
}

function reinitialiserDonnees() {
    if (!confirm("Attention : supprimer toutes tes tâches et tes paramètres ?")) return;

    if (!confirm("Dernière confirmation : cette action est définitive.")) return;

    const anciennesTaches = [...taches];

    anciennesTaches.forEach(t => enregistrerSuppressionLocale(t.id));

    taches = [];

    parametres = {
        nom: "",
        theme: "sombre",
        notifications: false,
        rappels: false,
        heureRappel: "18:00"
    };

    sauvegarder();

    const userPromise = obtenirUtilisateur().then(async user => {
        if (user) await envoyerSuppressionsEnAttente(user.id);
    }).catch(console.error);

    afficherParametres();
    ouvrirPage("accueil");

    notifier("Données réinitialisées.");
}


/* =====================================
   MENU MOBILE
   ===================================== */

function basculerMenu() {
    $("sidebar").classList.toggle("ouverte");
}


/* =====================================
   ÉVÉNEMENTS DES BOUTONS
   ===================================== */

function initialiserEvenements() {

    // Navigation
    document.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
            ouvrirPage(btn.dataset.page);
        });
    });

    // Catégories
    document.querySelectorAll("[data-category]").forEach(btn => {
        btn.addEventListener("click", () => {
            afficherCategorie(btn.dataset.category);
        });
    });

    $("ouvrirParametres").addEventListener("click", () => ouvrirPage("parametres"));
    $("ouvrirParametresTop").addEventListener("click", () => ouvrirPage("parametres"));

    $("voirToutes").addEventListener("click", () => ouvrirPage("toutes"));

    $("heroAjouter").addEventListener("click", () => {
        $("zoneAjout").scrollIntoView({ behavior: "smooth" });
        $("titreTache").focus();
    });

    $("menuMobile").addEventListener("click", basculerMenu);

    // Formulaires
    $("formTache").addEventListener("submit", ajouterTache);
    $("formModification").addEventListener("submit", enregistrerModification);

    // Actions sur les tâches
    document.addEventListener("click", e => {
        const bouton = e.target.closest("[data-action]");

        if (bouton) {
            traiterAction(bouton.dataset.action, bouton.dataset.id);
        }
    });

    // Modification
    $("fermerModification").addEventListener("click", fermerModification);

    $("modalModification").addEventListener("click", e => {
        if (e.target === $("modalModification")) fermerModification();
    });

    // Recherche et filtres
    $("rechercheTache").addEventListener("input", afficherToutes);
    $("filtreCategorie").addEventListener("change", afficherToutes);
    $("filtreStatut").addEventListener("change", afficherToutes);
    $("triTaches").addEventListener("change", afficherToutes);

    // Tâches terminées
    $("viderTerminees").addEventListener("click", () => {
        if (!confirm("Supprimer toutes les tâches terminées ?")) return;

        const supprimees = taches.filter(t => t.terminee);

        supprimees.forEach(t => enregistrerSuppressionLocale(t.id));

        taches = taches.filter(t => !t.terminee);

        sauvegarder();

        obtenirUtilisateur().then(async user => {
            if (user) await envoyerSuppressionsEnAttente(user.id);
        }).catch(console.error);

        actualiser();
        notifier("Tâches terminées supprimées.");
    });

    // Profil et réglages
    $("sauvegarderProfil").addEventListener("click", sauvegarderProfil);
    $("themeApplication").addEventListener("change", changerTheme);

    $("rappelGlobal").addEventListener("change", enregistrerReglagesRappels);
    $("heureRappel").addEventListener("change", enregistrerReglagesRappels);

    // Notifications
    $("activerNotifications").addEventListener("click", activerNotifications);

    $("notificationBtn").addEventListener("click", () => {
        ouvrirPage("parametres");
        $("statutNotifications").scrollIntoView({ behavior: "smooth" });
    });

    // Données
    $("exporterDonnees").addEventListener("click", exporterDonnees);

    $("importerDonneesBtn").addEventListener("click", () => {
        $("importerFichier").click();
    });

    $("importerFichier").addEventListener("change", e => {
        importerDonnees(e.target.files[0]);
    });

    $("reinitialiserDonnees").addEventListener("click", reinitialiserDonnees);

    // Synchronisation manuelle
    $("synchroniserBtn").addEventListener("click", synchroniser);
}


/* =====================================
   DÉMARRAGE
   ===================================== */

function demarrerApplication() {
    chargerDonnees();
    initialiserEvenements();
    afficherParametres();
    actualiser();
    ouvrirPage("accueil");

    // Vérification périodique des rappels
    setInterval(verifierRappels, 30000);

    // Vérifier si un utilisateur est déjà connecté
    setTimeout(() => synchroniser(), 500);
}

demarrerApplication();
