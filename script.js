console.log("RANGECA NOTIFICATIONS V1");

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://wqlowlqlvujutearzcdi.supabase.co";
const SUPABASE_KEY = "sb_publishable_uDrkmlCqmXuU73vn1OLKVw_24tvyedg";

// ==========================================
// VARIABLES NOTIFICATIONS
// ==========================================

const NOTIFICATION_HEURE_PAR_DEFAUT = "18:00";

let timersNotifications = [];


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

        console.error(
            "Erreur Supabase :",
            erreur
        );

    }

}


// ==========================================
// SAUVEGARDER UNE TÂCHE DANS SUPABASE
// ==========================================

async function sauvegarderTacheSupabase(
    texte,
    categorie,
    date,
    heure = NOTIFICATION_HEURE_PAR_DEFAUT
) {

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

                    heure_notification: date
                        ? heure + ":00"
                        : null,

                    notification_envoyee: false

                })

            }
        );


        if (!reponse.ok) {

            const erreur = await reponse.text();

            console.error(
                "Erreur sauvegarde Supabase :",
                erreur
            );

            return false;

        }


        console.log(
            "✅ Tâche sauvegardée dans Supabase"
        );

        return true;

    } catch (erreur) {

        console.error(
            "Erreur de connexion à Supabase :",
            erreur
        );

        return false;

    }

}


// ==========================================
// NOTIFICATIONS
// ==========================================

async function activerNotifications() {

    if (!("Notification" in window)) {

        alert(
            "Les notifications ne sont pas prises en charge sur cet appareil."
        );

        return;

    }


    try {

        const permission =
            await Notification.requestPermission();

        const bouton =
            document.getElementById(
                "boutonNotifications"
            );


        if (permission === "granted") {

            bouton.textContent = "Activées";

            localStorage.setItem(
                "rangeca_notifications",
                "activees"
            );

            alert(
                "🔔 Notifications activées !"
            );

            await enregistrerServiceWorker();

            programmerToutesLesNotifications();


        } else {

            bouton.textContent = "Bloquées";

            localStorage.setItem(
                "rangeca_notifications",
                "bloquees"
            );

            alert(
                "Les notifications sont bloquées dans ton navigateur."
            );

        }

    } catch (erreur) {

        console.error(
            "Erreur notifications :",
            erreur
        );

        alert(
            "Impossible d'activer les notifications."
        );

    }

}


// ==========================================
// ENREGISTRER LE SERVICE WORKER
// ==========================================

async function enregistrerServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        console.warn(
            "Service Worker non disponible."
        );

        return null;

    }


    try {

        const registration =
            await navigator.serviceWorker.register(
                "./service-worker.js?v=2"
            );

        console.log(
            "✅ Service Worker enregistré"
        );

        await navigator.serviceWorker.ready;

        return registration;

    } catch (erreur) {

        console.error(
            "Erreur Service Worker :",
            erreur
        );

        return null;

    }

}


// ==========================================
// VÉRIFIER L'ÉTAT DES NOTIFICATIONS
// ==========================================

function mettreAJourBoutonNotifications() {

    const bouton =
        document.getElementById(
            "boutonNotifications"
        );


    if (!bouton) {
        return;
    }


    if (!("Notification" in window)) {

        bouton.textContent = "Indisponibles";

        return;

    }


    if (Notification.permission === "granted") {

        bouton.textContent = "Activées";

        return;

    }


    if (Notification.permission === "denied") {

        bouton.textContent = "Bloquées";

        return;

    }


    bouton.textContent = "Activer";

}


// ==========================================
// EXTRAIRE L'HEURE D'UNE TÂCHE
// ==========================================

function determinerHeure(texte) {

    const t = texte.toLowerCase();


    // Exemple : 14h30
    const heureMinutes =
        t.match(/(?:à|a|vers)?\s*(\d{1,2})h(\d{1,2})/);

    if (heureMinutes) {

        const heure =
            parseInt(
                heureMinutes[1],
                10
            );

        const minutes =
            parseInt(
                heureMinutes[2],
                10
            );


        if (
            heure >= 0 &&
            heure <= 23 &&
            minutes >= 0 &&
            minutes <= 59
        ) {

            return (
                String(heure).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0")
            );

        }

    }


    // Exemple : 14h
    const heureSimple =
        t.match(/(?:à|a|vers)?\s*(\d{1,2})h\b/);

    if (heureSimple) {

        const heure =
            parseInt(
                heureSimple[1],
                10
            );


        if (
            heure >= 0 &&
            heure <= 23
        ) {

            return (
                String(heure).padStart(2, "0") +
                ":00"
            );

        }

    }


    return NOTIFICATION_HEURE_PAR_DEFAUT;

}


// ==========================================
// CRÉER UN IDENTIFIANT UNIQUE DE TÂCHE
// ==========================================

function obtenirIdNotification(tache) {

    return (
        tache.texte +
        "|" +
        (tache.date || "") +
        "|" +
        (tache.heure || NOTIFICATION_HEURE_PAR_DEFAUT)
    );

}


// ==========================================
// VÉRIFIER SI LA NOTIFICATION A DÉJÀ ÉTÉ ENVOYÉE
// ==========================================

function notificationDejaEnvoyee(id) {

    const liste =
        JSON.parse(
            localStorage.getItem(
                "rangeca_notifications_envoyees"
            ) || "[]"
        );


    return liste.includes(id);

}


// ==========================================
// MARQUER UNE NOTIFICATION COMME ENVOYÉE
// ==========================================

function marquerNotificationEnvoyee(id) {

    const liste =
        JSON.parse(
            localStorage.getItem(
                "rangeca_notifications_envoyees"
            ) || "[]"
        );


    if (!liste.includes(id)) {

        liste.push(id);

    }


    localStorage.setItem(
        "rangeca_notifications_envoyees",
        JSON.stringify(liste)
    );

}


// ==========================================
// ENVOYER UNE NOTIFICATION
// ==========================================

async function envoyerNotification(tache) {

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {

        return;

    }


    const id =
        obtenirIdNotification(tache);


    if (notificationDejaEnvoyee(id)) {

        return;

    }


    try {

        const registration =
            await navigator.serviceWorker.ready;


        await registration.showNotification(
            "🧹 RangeÇa",
            {

                body:
                    "⏰ " +
                    tache.texte,

                icon:
                    "./logorc.png",

                badge:
                    "./logorc.png",

                tag:
                    "rangeca-" +
                    id,

                requireInteraction:
                    false

            }
        );


        marquerNotificationEnvoyee(id);

        console.log(
            "🔔 Notification envoyée :",
            tache.texte
        );

    } catch (erreur) {

        console.error(
            "Erreur notification :",
            erreur
        );

    }

}


// ==========================================
// PROGRAMMER UNE NOTIFICATION
// ==========================================

function programmerNotification(tache) {

    if (!tache.date) {
        return;
    }


    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {

        return;

    }


    const heure =
        tache.heure ||
        NOTIFICATION_HEURE_PAR_DEFAUT;


    const dateNotification =
        new Date(
            `${tache.date}T${heure}:00`
        );


    const maintenant =
        new Date();


    const difference =
        dateNotification.getTime() -
        maintenant.getTime();


    if (difference <= 0) {

        return;

    }


    const id =
        obtenirIdNotification(tache);


    if (notificationDejaEnvoyee(id)) {

        return;

    }


    console.log(
        "⏰ Notification programmée pour :",
        dateNotification.toLocaleString("fr-FR"),
        "→",
        tache.texte
    );


    const timer =
        setTimeout(
            () => {

                envoyerNotification(tache);

            },
            difference
        );


    timersNotifications.push(timer);

}


// ==========================================
// PROGRAMMER TOUTES LES NOTIFICATIONS
// ==========================================

function programmerToutesLesNotifications() {

    // Annuler les anciens timers
    timersNotifications.forEach(
        timer => clearTimeout(timer)
    );

    timersNotifications = [];


    const taches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {

        return;

    }


    taches.forEach(
        tache => {

            if (!tache.terminee) {

                programmerNotification(
                    tache
                );

            }

        }
    );

}


// ==========================================
// PARAMÈTRES
// ==========================================

function ouvrirParametres() {

    const menu =
        document.getElementById(
            "menuParametres"
        );


    if (!menu) {
        return;
    }


    if (
        menu.style.display === "block"
    ) {

        menu.style.display = "none";

    } else {

        menu.style.display = "block";

    }

}


// ==========================================
// CATÉGORIES
// ==========================================

function determinerCategorie(texte) {

    const t =
        texte.toLowerCase();


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

    const resultat =
        new Date(date);

    resultat.setDate(
        resultat.getDate() + nombre
    );

    return resultat;

}


function formaterDate(date) {

    const annee =
        date.getFullYear();

    const mois =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const jour =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        `${annee}-${mois}-${jour}`
    );

}


function determinerDate(texte) {

    const t =
        texte.toLowerCase();

    const aujourdHui =
        new Date();


    if (
        t.includes("après-demain") ||
        t.includes("apres-demain")
    ) {

        return formaterDate(
            ajouterJours(
                aujourdHui,
                2
            )
        );

    }


    if (t.includes("demain")) {

        return formaterDate(
            ajouterJours(
                aujourdHui,
                1
            )
        );

    }


    if (
        t.includes("aujourd'hui") ||
        t.includes("aujourd’hui")
    ) {

        return formaterDate(
            aujourdHui
        );

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


    for (
        const jourNom in jours
    ) {

        if (
            t.includes(jourNom)
        ) {

            const date =
                new Date(
                    aujourdHui
                );

            const jourActuel =
                date.getDay();

            let difference =
                jours[jourNom] -
                jourActuel;


            if (difference <= 0) {

                difference += 7;

            }


            return formaterDate(
                ajouterJours(
                    aujourdHui,
                    difference
                )
            );

        }

    }


    const correspondanceJours =
        t.match(
            /dans\s+(\d+)\s+jours?/
        );


    if (correspondanceJours) {

        const nombre =
            parseInt(
                correspondanceJours[1],
                10
            );


        return formaterDate(
            ajouterJours(
                aujourdHui,
                nombre
            )
        );

    }


    const correspondanceSemaines =
        t.match(
            /dans\s+(\d+)\s+semaines?/
        );


    if (correspondanceSemaines) {

        const nombre =
            parseInt(
                correspondanceSemaines[1],
                10
            );


        return formaterDate(
            ajouterJours(
                aujourdHui,
                nombre * 7
            )
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


    const correspondanceDate =
        t.match(
            /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/
        );


    if (correspondanceDate) {

        const jour =
            parseInt(
                correspondanceDate[1],
                10
            );

        const moisNom =
            correspondanceDate[2];


        let annee =
            aujourdHui.getFullYear();


        const date =
            new Date(
                annee,
                mois[moisNom],
                jour
            );


        if (
            date < aujourdHui
        ) {

            annee++;

        }


        const vraieDate =
            new Date(
                annee,
                mois[moisNom],
                jour
            );


        return formaterDate(
            vraieDate
        );

    }


    return null;

}


// ==========================================
// SUPPRIMER UNE TÂCHE
// ==========================================

function supprimerTache(index) {

    const taches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    taches.splice(
        index,
        1
    );


    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );


    afficherTaches();

    programmerToutesLesNotifications();

}


// ==========================================
// MODIFIER UNE TÂCHE
// ==========================================

function modifierTache(index) {

    const taches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    const nouvelleValeur =
        prompt(
            "Modifier la tâche :",
            taches[index].texte
        );


    if (
        nouvelleValeur === null
    ) {

        return;

    }


    if (
        nouvelleValeur.trim() === ""
    ) {

        return;

    }


    taches[index].texte =
        nouvelleValeur.trim();


    taches[index].categorie =
        determinerCategorie(
            nouvelleValeur
        );


    taches[index].date =
        determinerDate(
            nouvelleValeur
        );


    taches[index].heure =
        determinerHeure(
            nouvelleValeur
        );


    // Une tâche modifiée doit pouvoir
    // déclencher une nouvelle notification
    taches[index].terminee = false;


    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );


    afficherTaches();

    programmerToutesLesNotifications();

}


// ==========================================
// COCHER / DÉCOCHER
// ==========================================

function changerEtatTache(index) {

    const taches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    taches[index].terminee =
        !taches[index].terminee;


    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(taches)
    );


    afficherTaches();

    programmerToutesLesNotifications();

}


// ==========================================
// AFFICHER LES TÂCHES
// ==========================================

function afficherTaches() {

    const resultat =
        document.getElementById(
            "resultat"
        );


    if (!resultat) {
        return;
    }


    const taches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    if (
        taches.length === 0
    ) {

        resultat.innerHTML = `

            <p class="empty">
                Ton classement apparaîtra ici...
            </p>

        `;

        return;

    }


    const categories = {};


    taches.forEach(
        (tache, index) => {

            if (
                !categories[
                    tache.categorie.nom
                ]
            ) {

                categories[
                    tache.categorie.nom
                ] = {

                    emoji:
                        tache.categorie.emoji,

                    taches: []

                };

            }


            categories[
                tache.categorie.nom
            ].taches.push({

                ...tache,

                index: index

            });

        }
    );


    let html = "";


    for (
        const nomCategorie in categories
    ) {

        const categorie =
            categories[
                nomCategorie
            ];


        html += `

            <div class="categorie">

                <h3>
                    ${categorie.emoji}
                    ${nomCategorie}
                </h3>

        `;


        categorie.taches.forEach(
            tache => {

                const classeTerminee =
                    tache.terminee
                        ? "tache-terminee"
                        : "";


                let dateHTML = "";


                if (
                    tache.date
                ) {

                    const date =
                        new Date(
                            tache.date +
                            "T00:00:00"
                        );


                    dateHTML = `

                        <span class="date-tache">

                            📅
                            ${date.toLocaleDateString(
                                "fr-FR",
                                {
                                    day: "numeric",
                                    month: "long"
                                }
                            )}

                            ${
                                tache.heure
                                    ? " à " +
                                      tache.heure
                                    : ""
                            }

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

            }
        );


        html += `

            </div>

        `;

    }


    resultat.innerHTML =
        html;

}


// ==========================================
// RANGER LES INFORMATIONS
// ==========================================

async function ranger() {

    const textarea =
        document.getElementById(
            "texte"
        );


    if (!textarea) {
        return;
    }


    const texte =
        textarea.value.trim();


    if (!texte) {

        alert(
            "Écris au moins une chose à ranger 🙂"
        );

        return;

    }


    const lignes =
        texte
            .split("\n")
            .map(
                ligne =>
                    ligne.trim()
            )
            .filter(
                ligne =>
                    ligne !== ""
            );


    const anciennesTaches =
        JSON.parse(
            localStorage.getItem(
                "rangeca_taches"
            ) || "[]"
        );


    for (
        const ligne of lignes
    ) {

        const categorie =
            determinerCategorie(
                ligne
            );


        const date =
            determinerDate(
                ligne
            );


        const heure =
            determinerHeure(
                ligne
            );


        const nouvelleTache = {

            texte:
                ligne,

            categorie:
                categorie,

            date:
                date,

            heure:
                date
                    ? heure
                    : null,

            terminee:
                false

        };


        anciennesTaches.push(
            nouvelleTache
        );


        await sauvegarderTacheSupabase(
            ligne,
            categorie.nom,
            date,
            heure
        );

    }


    localStorage.setItem(
        "rangeca_taches",
        JSON.stringify(
            anciennesTaches
        )
    );


    textarea.value = "";


    afficherTaches();

    programmerToutesLesNotifications();

}


// ==========================================
// CHARGEMENT
// ==========================================

window.addEventListener(
    "load",
    async () => {

        afficherTaches();


        mettreAJourBoutonNotifications();


        // Enregistrement du Service Worker
        await enregistrerServiceWorker();


        // Test Supabase
        testerSupabase();


        // Reprogrammer les notifications
        // si elles sont déjà autorisées
        programmerToutesLesNotifications();

    }
);


// ==========================================
// SERVICE WORKER
// ==========================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        async () => {

            try {

                const registration =
                    await navigator.serviceWorker.register(
                        "./service-worker.js?v=2"
                    );


                console.log(
                    "✅ Service Worker enregistré"
                );


                await registration.update();

            } catch (erreur) {

                console.error(
                    "Erreur Service Worker :",
                    erreur
                );

            }

        }
    );

}
