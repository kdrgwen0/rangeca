console.log("RANGECA NOUVEAU SCRIPT");

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://wqlowlqlvujutearzcdi.supabase.co";
const SUPABASE_KEY = "sb_publishable_uDrkmlCqmXuU73vn1OLKVw_24tvyedg";

// ==========================================
// TEST SUPABASE
// ==========================================

async function testerSupabase() {
    try {
        const reponse = await fetch(
            `${SUPABASE_URL}/rest/v1/taches?select=*`,
            {
                headers: {
                    "apikey": SUPABASE_KEY
                }
            }
        );

        const texte = await reponse.text();

        console.log("STATUT SUPABASE :", reponse.status);
        console.log("REPONSE SUPABASE :", texte);

    } catch (erreur) {
        console.error("Erreur Supabase :", erreur);
    }
}

// ==========================================
// SAUVEGARDER UNE TÂCHE DANS SUPABASE
// ==========================================

async function sauvegarderTacheSupabase(texte, categorie, date) {
    try {
        const reponse = await fetch(
            `${SUPABASE_URL}/rest/v1/taches`,
            {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    texte: texte,
                    categorie: categorie,
                    date_tache: date || null,
                    heure_notification: date ? "18:00:00" : null,
                    notification_envoyee: false
                })
            }
        );

        if (!reponse.ok) {
            const erreur = await reponse.text();
            console.error("Erreur sauvegarde Supabase :", erreur);
            return false;
        }

        console.log("✅ Tâche sauvegardée dans Supabase");
        return true;

    } catch (erreur) {
        console.error("Erreur de connexion à Supabase :", erreur);
        return false;
    }
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function activerNotifications() {
    if (!("Notification" in window)) {
        alert("Les notifications ne sont pas prises en charge sur cet appareil.");
        return;
    }

    const permission = await Notification.requestPermission();

    const bouton = document.getElementById("boutonNotifications");

    if (permission === "granted") {
        bouton.textContent = "Activées";
        alert("🔔 Notifications activées !");
    } else {
        bouton.textContent = "Bloquées";
        alert("Les notifications sont bloquées dans ton navigateur.");
    }
}

// ==========================================
// PARAMÈTRES
// ==========================================

function ouvrirParametres() {
    const menu = document.getElementById("menuParametres");

    if (!menu) {
        return;
    }

    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

// ==========================================
// CATÉGORIES
// ==========================================

function determinerCategorie(texte) {
    const t = texte.toLowerCase();

    if (
        t.includes("acheter") ||
        t.includes("achat") ||
        t.includes("courses") ||
        t.includes("lait") ||
        t.includes("chaussures") ||
        t.includes("magasin")
    ) {
        return {
            nom: "Achats",
            emoji: "🛒"
        };
    }

    if (
        t.includes("devoir") ||
        t.includes("contrôle") ||
        t.includes("controle") ||
        t.includes("cours") ||
        t.includes("réviser") ||
        t.includes("reviser") ||
        t.includes("maths") ||
        t.includes("anglais") ||
        t.includes("français") ||
        t.includes("francais") ||
        t.includes("physique") ||
        t.includes("svt") ||
        t.includes("ses") ||
        t.includes("nsi") ||
        t.includes("dm")
    ) {
        return {
            nom: "École",
            emoji: "📚"
        };
    }

    if (
        t.includes("gta") ||
        t.includes("valorant") ||
        t.includes("jouer") ||
        t.includes("jeu") ||
        t.includes("playstation") ||
        t.includes("ps5") ||
        t.includes("film") ||
        t.includes("série") ||
        t.includes("serie")
    ) {
        return {
            nom: "Loisirs",
            emoji: "🎮"
        };
    }

    if (
        t.includes("ménage") ||
        t.includes("menage") ||
        t.includes("ranger") ||
        t.includes("nettoyer") ||
        t.includes("maison") ||
        t.includes("linge") ||
        t.includes("vaisselle")
    ) {
        return {
            nom: "Maison",
            emoji: "🏠"
        };
    }

    if (
        t.includes("sport") ||
        t.includes("foot") ||
        t.includes("football") ||
        t.includes("muscu") ||
        t.includes("courir") ||
        t.includes("vélo") ||
        t.includes("velo") ||
        t.includes("gym")
    ) {
        return {
            nom: "Sport",
            emoji: "⚽"
        };
    }

    if (
        t.includes("rendez-vous") ||
        t.includes("rendez vous") ||
        t.includes("rdv") ||
        t.includes("médecin") ||
        t.includes("medecin") ||
        t.includes("dentiste") ||
        t.includes("coiffeur")
    ) {
        return {
            nom: "Rendez-vous",
            emoji: "📅"
        };
    }

    return {
        nom: "Autre",
        emoji: "📦"
    };
}

// ==========================================
// DATES
// ==========================================

function ajouterJours(date, nombre) {
    const resultat = new Date(date);
    resultat.setDate(resultat.getDate() + nombre);
    return resultat;
}

function formaterDate(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");

    return `${annee}-${mois}-${jour}`;
}

function determinerDate(texte) {
    const t = texte.toLowerCase();
    const aujourdHui = new Date();

    if (t.includes("après-demain") || t.includes("apres-demain")) {
        return formaterDate(ajouterJours(aujourdHui, 2));
    }

    if (t.includes("demain")) {
        return formaterDate(ajouterJours(aujourdHui, 1));
    }

    if (t.includes("aujourd'hui") || t.includes("aujourd’hui")) {
        return formaterDate(aujourdHui);
    }

    const jours = {
        dimanche: 0,
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6
    };

    for (const jourNom in jours) {
        if (t.includes(jourNom)) {
            const date = new Date(aujourdHui);
            const jourActuel = date.getDay();
            let difference = jours[jourNom] - jourActuel;

            if (difference <= 0) {
                difference += 7;
            }

            return formaterDate(ajouterJours(aujourdHui, difference));
        }
    }

    const correspondanceJours = t.match(/dans\s+(\d+)\s+jours?/);

    if (correspondanceJours) {
        const nombre = parseInt(correspondanceJours[1], 10);

        return formaterDate(
            ajouterJours(aujourdHui, nombre)
        );
    }

    const correspondanceSemaines = t.match(/dans\s+(\d+)\s+semaines?/);

    if (correspondanceSemaines) {
        const nombre = parseInt(correspondanceSemaines[1], 10);

        return formaterDate(
            ajouterJours(aujourdHui, nombre * 7)
        );
    }

    const mois = {
        janvier: 0,
        février: 1,
        fevrier: 1,
        mars: 2,
        avril: 3,
        mai: 4,
        juin: 5,
        juillet: 6,
        août: 7,
        aout: 7,
        septembre: 8,
        octobre: 9,
        novembre: 10,
        décembre: 11,
        decembre: 11
    };

    const correspondanceDate = t.match(
        /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/
    );

    if (correspondanceDate) {
        const jour = parseInt(correspondanceDate[1], 10);
        const moisNom = correspondanceDate[2];

        let annee = aujourdHui.getFullYear();
        const date = new Date(annee, mois[moisNom], jour);

        if (date < aujourdHui) {
            annee++;
        }

        const vraieDate = new Date(
            annee,
            mois[moisNom],
            jour
        );

        return formaterDate(vraieDate);
    }

    return null;
}

// ==========================================
// SUPPRIMER UNE TÂCHE
// ==========================================

function supprimerTache(index) {
    const taches = JSON.parse(
        localStorage.getItem("rangeca_taches") || "[]"
    );

    taches.splice(index, 1);

    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );

    afficherTaches();
}

// ==========================================
// MODIFIER UNE TÂCHE
// ==========================================

function modifierTache(index) {
    const taches = JSON.parse(
        localStorage.getItem("rangeca_taches") || "[]"
    );

    const nouvelleValeur = prompt(
        "Modifier la tâche :",
        taches[index].texte
    );

    if (nouvelleValeur === null) {
        return;
    }

    if (nouvelleValeur.trim() === "") {
        return;
    }

    taches[index].texte = nouvelleValeur.trim();
    taches[index].categorie = determinerCategorie(
        nouvelleValeur
    );
    taches[index].date = determinerDate(
        nouvelleValeur
    );

    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );

    afficherTaches();
}

// ==========================================
// COCHER / DÉCOCHER
// ==========================================

function changerEtatTache(index) {
    const taches = JSON.parse(
        localStorage.getItem("rangeca_taches") || "[]"
    );

    taches[index].terminee = !taches[index].terminee;

    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );

    afficherTaches();
}

// ==========================================
// AFFICHER LES TÂCHES
// ==========================================

function afficherTaches() {
    const resultat = document.getElementById("resultat");

    if (!resultat) {
        return;
    }

    const taches = JSON.parse(
        localStorage.getItem("rangeca_taches") || "[]"
    );

    if (taches.length === 0) {
        resultat.innerHTML = `
            <p class="empty">
                Ton classement apparaîtra ici...
            </p>
        `;

        return;
    }

    const categories = {};

    taches.forEach((tache, index) => {
        if (!categories[tache.categorie.nom]) {
            categories[tache.categorie.nom] = {
                emoji: tache.categorie.emoji,
                taches: []
            };
        }

        categories[tache.categorie.nom].taches.push({
            ...tache,
            index: index
        });
    });

    let html = "";

    for (const nomCategorie in categories) {
        const categorie = categories[nomCategorie];

        html += `
            <div class="categorie">
                <h3>
                    ${categorie.emoji} ${nomCategorie}
                </h3>
        `;

        categorie.taches.forEach(tache => {
            const classeTerminee = tache.terminee
                ? "tache-terminee"
                : "";

            let dateHTML = "";

            if (tache.date) {
                const date = new Date(
                    tache.date + "T00:00:00"
                );

                dateHTML = `
                    <span class="date-tache">
                        📅 ${date.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long"
                        })}
                    </span>
                `;
            }

            html += `
                <div class="tache ${classeTerminee}">
                    <input
                        type="checkbox"
                        ${tache.terminee ? "checked" : ""}
                        onchange="changerEtatTache(${tache.index})"
                    >

                    <div class="contenu-tache">
                        <span class="texte-tache">
                            ${tache.texte}
                        </span>

                        ${dateHTML}
                    </div>

                    <button
                        onclick="modifierTache(${tache.index})"
                        title="Modifier"
                    >
                        ✏️
                    </button>

                    <button
                        onclick="supprimerTache(${tache.index})"
                        title="Supprimer"
                    >
                        🗑️
                    </button>
                </div>
            `;
        });

        html += `
            </div>
        `;
    }

    resultat.innerHTML = html;
}

// ==========================================
// RANGER LES INFORMATIONS
// ==========================================

async function ranger() {
    const textarea = document.getElementById("texte");

    if (!textarea) {
        return;
    }

    const texte = textarea.value.trim();

    if (!texte) {
        alert("Écris au moins une chose à ranger 🙂");
        return;
    }

    const lignes = texte
        .split("\n")
        .map(ligne => ligne.trim())
        .filter(ligne => ligne !== "");

    const anciennesTaches = JSON.parse(
        localStorage.getItem("rangeca_taches") || "[]"
    );

    for (const ligne of lignes) {
        const categorie = determinerCategorie(ligne);
        const date = determinerDate(ligne);

        const nouvelleTache = {
            texte: ligne,
            categorie: categorie,
            date: date,
            terminee: false
        };

        anciennesTaches.push(nouvelleTache);

        await sauvegarderTacheSupabase(
            ligne,
            categorie.nom,
            date
        );
    }

    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(anciennesTaches)
    );

    textarea.value = "";

    afficherTaches();
}

// ==========================================
// CHARGEMENT
// ==========================================

window.addEventListener("load", () => {
    afficherTaches();

    // Test Supabase au chargement
    testerSupabase();
});

// ==========================================
// SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("✅ Service Worker enregistré");
            })
            .catch(erreur => {
                console.error(
                    "Erreur Service Worker :",
                    erreur
                );
            });
    });
}
