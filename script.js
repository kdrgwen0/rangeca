```javascript
console.log("RANGECA NOTIFICATIONS V2");


// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://wqlowlqlvujutearzcdi.supabase.co";

const SUPABASE_KEY = "sb_publishable_uDrkmlCqmXuU73vn1OLKVw_24tvyedg";


// ==========================================
// NOTIFICATIONS
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
                method: "GET",

                headers: {
                    "apikey": SUPABASE_KEY
                }
            }
        );

        if (!reponse.ok) {
            throw new Error(`Erreur HTTP ${reponse.status}`);
        }

        const donnees = await reponse.json();

        console.log("✅ Supabase fonctionne :", donnees);

    } catch (erreur) {

        console.error(
            "❌ Erreur Supabase :",
            erreur
        );

    }

}


// ==========================================
// SAUVEGARDE SUPABASE
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
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Prefer": "return=minimal"
                },

                body: JSON.stringify({

                    texte: texte,

                    categorie: categorie,

                    date_tache: date || null,

                    heure_notification:
                        date
                            ? `${heure}:00`
                            : null,

                    notification_envoyee: false

                })
            }
        );


        if (!reponse.ok) {

            const erreurTexte = await reponse.text();

            throw new Error(
                `HTTP ${reponse.status} : ${erreurTexte}`
            );

        }


        console.log(
            "✅ Tâche sauvegardée dans Supabase :",
            texte
        );


    } catch (erreur) {

        console.error(
            "❌ Impossible de sauvegarder dans Supabase :",
            erreur
        );

    }

}


// ==========================================
// NOTIFICATIONS — ACTIVATION
// ==========================================

async function activerNotifications() {

    if (!("Notification" in window)) {

        alert(
            "❌ Ton navigateur ne prend pas en charge les notifications."
        );

        return;
    }


    try {

        const permission =
            await Notification.requestPermission();


        const bouton =
            document.getElementById("boutonNotifications");


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


        } else if (permission === "denied") {

            bouton.textContent = "Bloquées";

            localStorage.setItem(
                "rangeca_notifications",
                "bloquees"
            );


            alert(
                "⚠️ Les notifications sont bloquées dans ton navigateur."
            );


        } else {

            bouton.textContent = "Activer";

        }


    } catch (erreur) {

        console.error(
            "❌ Erreur notifications :",
            erreur
        );

    }

}


// ==========================================
// BOUTON NOTIFICATIONS
// ==========================================

function mettreAJourBoutonNotifications() {

    const bouton =
        document.getElementById("boutonNotifications");


    if (!bouton) return;


    if (!("Notification" in window)) {

        bouton.textContent = "Indisponibles";

        return;

    }


    if (Notification.permission === "granted") {

        bouton.textContent = "Activées";

    } else if (Notification.permission === "denied") {

        bouton.textContent = "Bloquées";

    } else {

        bouton.textContent = "Activer";

    }

}


// ==========================================
// DÉTECTION DE L'HEURE
// ==========================================

function determinerHeure(texte) {

    const t = texte.toLowerCase();


    // Exemple :
    // 23h36
    // à 23h36
    // vers 23h36

    const heureMinutes =
        t.match(
            /(?:à|a|vers)?\s*(\d{1,2})h(\d{1,2})/
        );


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


    // Exemple :
    // 23h
    // à 23h

    const heureSimple =
        t.match(
            /(?:à|a|vers)?\s*(\d{1,2})h\b/
        );


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
// ID NOTIFICATION
// ==========================================

function obtenirIdNotification(tache) {

    return (
        tache.texte +
        "|" +
        (tache.date || "") +
        "|" +
        (
            tache.heure ||
            NOTIFICATION_HEURE_PAR_DEFAUT
        )
    );

}


// ==========================================
// NOTIFICATION DÉJÀ ENVOYÉE
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
// MARQUER NOTIFICATION COMME ENVOYÉE
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

        console.log(
            "⚠️ Notifications non autorisées."
        );

        return;

    }


    const id =
        obtenirIdNotification(tache);


    if (
        notificationDejaEnvoyee(id)
    ) {

        console.log(
            "ℹ️ Notification déjà envoyée :",
            tache.texte
        );

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
            "❌ Erreur lors de l'envoi de la notification :",
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

        console.log(
            "⏭️ Notification ignorée car l'heure est passée :",
            tache.texte
        );

        return;

    }


    const id =
        obtenirIdNotification(tache);


    if (
        notificationDejaEnvoyee(id)
    ) {

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

                programmerNotification(tache);

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


    if (!menu) return;


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
        t.includes("courses") ||
        t.includes("lait") ||
        t.includes("chaussures") ||
        t.includes("achat")
    ) {

        return {
            nom: "Achats",
            emoji: "🛒"
        };

    }


    if (
        t.includes("cours") ||
        t.includes("contrôle") ||
        t.includes("controle") ||
        t.includes("devoir") ||
        t.includes("maths") ||
        t.includes("anglais") ||
        t.includes("français") ||
        t.includes("francais") ||
        t.includes("svt") ||
        t.includes("ses") ||
        t.includes("physique")
    ) {

        return {
            nom: "École",
            emoji: "📚"
        };

    }


    if (
        t.includes("jouer") ||
        t.includes("gta") ||
        t.includes("valorant") ||
        t.includes("jeu") ||
        t.includes("gaming") ||
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
        t.includes("ranger") ||
        t.includes("ménage") ||
        t.includes("menage") ||
        t.includes("nettoyer") ||
        t.includes("chambre") ||
        t.includes("maison")
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
        t.includes("courir") ||
        t.includes("muscu") ||
        t.includes("entraînement") ||
        t.includes("entrainement")
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
        t.includes("dentiste") ||
        t.includes("médecin") ||
        t.includes("medecin")
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
// DÉTECTION DE DATE
// ==========================================

function determinerDate(texte) {

    const t =
        texte.toLowerCase();


    const aujourdHui =
        new Date();


    // ------------------------------------------
    // Aujourd'hui
    // ------------------------------------------

    if (
        t.includes("aujourd'hui") ||
        t.includes("aujourd’hui")
    ) {

        return formatDate(
            aujourdHui
        );

    }


    // ------------------------------------------
    // Demain
    // ------------------------------------------

    if (
        t.includes("demain")
    ) {

        const date =
            new Date(
                aujourdHui
            );


        date.setDate(
            date.getDate() + 1
        );


        return formatDate(date);

    }


    // ------------------------------------------
    // Après-demain
    // ------------------------------------------

    if (
        t.includes("après-demain") ||
        t.includes("apres-demain") ||
        t.includes("après demain") ||
        t.includes("apres demain")
    ) {

        const date =
            new Date(
                aujourdHui
            );


        date.setDate(
            date.getDate() + 2
        );


        return formatDate(date);

    }


    // ------------------------------------------
    // Dans X jours
    // ------------------------------------------

    const dansJours =
        t.match(
            /dans\s+(\d+)\s+jours?/
        );


    if (dansJours) {

        const nombre =
            parseInt(
                dansJours[1],
                10
            );


        const date =
            new Date(
                aujourdHui
            );


        date.setDate(
            date.getDate() + nombre
        );


        return formatDate(date);

    }


    // ------------------------------------------
    // Dans X semaines
    // ------------------------------------------

    const dansSemaines =
        t.match(
            /dans\s+(\d+)\s+semaines?/
        );


    if (dansSemaines) {

        const nombre =
            parseInt(
                dansSemaines[1],
                10
            );


        const date =
            new Date(
                aujourdHui
            );


        date.setDate(
            date.getDate() +
            nombre * 7
        );


        return formatDate(date);

    }


    // ------------------------------------------
    // Jours de la semaine
    // ------------------------------------------

    const joursSemaine = {

        dimanche: 0,
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6

    };


    for (
        const jour in joursSemaine
    ) {

        if (
            t.includes(jour)
        ) {

            const date =
                new Date(
                    aujourdHui
                );


            const jourActuel =
                date.getDay();


            let difference =
                joursSemaine[jour] -
                jourActuel;


            if (difference <= 0) {

                difference += 7;

            }


            date.setDate(
                date.getDate() +
                difference
            );


            return formatDate(date);

        }

    }


    // ------------------------------------------
    // Dates françaises simples
    // Exemple : 25 septembre
    // ------------------------------------------

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


    const dateTexte =
        t.match(
            /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/
        );


    if (dateTexte) {

        const jour =
            parseInt(
                dateTexte[1],
                10
            );


        const moisNom =
            dateTexte[2];


        const moisNumero =
            mois[moisNom];


        const date =
            new Date(
                aujourdHui.getFullYear(),
                moisNumero,
                jour
            );


        if (
            date < aujourdHui
        ) {

            date.setFullYear(
                date.getFullYear() + 1
            );

        }


        return formatDate(date);

    }


    return null;

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {

    const annee =
        date.getFullYear();


    const mois =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const jour =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${annee}-${mois}-${jour}`
    );

}


// ==========================================
// STOCKAGE LOCAL
// ==========================================

const CLE_TACHES =
    "rangeca_taches";


// ==========================================
// SUPPRIMER UNE TÂCHE
// ==========================================

function supprimerTache(index) {

    const taches =
        JSON.parse(
            localStorage.getItem(
                CLE_TACHES
            ) || "[]"
        );


    taches.splice(
        index,
        1
    );


    localStorage.setItem(
        CLE_TACHES,
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
                CLE_TACHES
            ) || "[]"
        );


    const tache =
        taches[index];


    const nouvelleValeur =
        prompt(
            "✏️ Modifier la tâche :",
            tache.texte
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


    tache.texte =
        nouvelleValeur.trim();


    tache.categorie =
        determinerCategorie(
            nouvelleValeur
        );


    tache.date =
        determinerDate(
            nouvelleValeur
        );


    tache.heure =
        determinerHeure(
            nouvelleValeur
        );


    tache.terminee =
        false;


    localStorage.setItem(
        CLE_TACHES,
        JSON.stringify(taches)
    );


    afficherTaches();

    programmerToutesLesNotifications();

}


// ==========================================
// CHANGER ÉTAT TÂCHE
// ==========================================

function changerEtatTache(index) {

    const taches =
        JSON.parse(
            localStorage.getItem(
                CLE_TACHES
            ) || "[]"
        );


    taches[index].terminee =
        !taches[index].terminee;


    localStorage.setItem(
        CLE_TACHES,
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


    if (!resultat) return;


    const taches =
        JSON.parse(
            localStorage.getItem(
                CLE_TACHES
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


    resultat.innerHTML = "";


    taches.forEach(
        (tache, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "tache";


            if (
                tache.terminee
            ) {

                div.classList.add(
                    "terminee"
                );

            }


            let dateAffichage = "";


            if (
                tache.date
            ) {

                const date =
                    new Date(
                        `${tache.date}T00:00:00`
                    );


                dateAffichage =
                    date.toLocaleDateString(
                        "fr-FR",
                        {
                            weekday: "long",
                            day: "numeric",
                            month: "long"
                        }
                    );


                if (
                    tache.heure
                ) {

                    dateAffichage +=
                        ` à ${tache.heure}`;

                }

            }


            div.innerHTML = `

                <div class="tache-gauche">

                    <input
                        type="checkbox"
                        ${tache.terminee ? "checked" : ""}
                        onchange="changerEtatTache(${index})"
                    >

                    <div>

                        <div class="tache-texte">
                            ${echapperHTML(tache.texte)}
                        </div>

                        <div class="tache-infos">

                            ${tache.categorie.emoji}
                            ${tache.categorie.nom}

                            ${
                                dateAffichage
                                    ? ` • 📅 ${dateAffichage}`
                                    : ""
                            }

                        </div>

                    </div>

                </div>


                <div class="tache-actions">

                    <button
                        onclick="modifierTache(${index})"
                        title="Modifier"
                    >
                        ✏️
                    </button>

                    <button
                        onclick="supprimerTache(${index})"
                        title="Supprimer"
                    >
                        🗑️
                    </button>

                </div>

            `;


            resultat.appendChild(
                div
            );

        }
    );

}


// ==========================================
// PROTECTION HTML
// ==========================================

function echapperHTML(texte) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texte;


    return div.innerHTML;

}


// ==========================================
// RANGER LES INFORMATIONS
// ==========================================

async function ranger() {

    const textarea =
        document.getElementById(
            "texte"
        );


    if (!textarea) return;


    const contenu =
        textarea.value.trim();


    if (!contenu) {

        alert(
            "✏️ Écris quelque chose à ranger !"
        );

        return;

    }


    const lignes =
        contenu
            .split("\n")
            .map(
                ligne => ligne.trim()
            )
            .filter(
                ligne => ligne !== ""
            );


    const taches =
        JSON.parse(
            localStorage.getItem(
                CLE_TACHES
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
                heure,

            terminee:
                false

        };


        taches.push(
            nouvelleTache
        );


        // Sauvegarde Supabase

        await sauvegarderTacheSupabase(
            ligne,
            categorie.nom,
            date,
            heure
        );

    }


    localStorage.setItem(
        CLE_TACHES,
        JSON.stringify(taches)
    );


    textarea.value = "";


    afficherTaches();


    programmerToutesLesNotifications();


    console.log(
        "✅ Informations rangées :",
        lignes
    );

}


// ==========================================
// SERVICE WORKER
// ==========================================

async function enregistrerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {

        console.error(
            "❌ Les Service Workers ne sont pas disponibles."
        );

        return null;

    }


    try {

        const registration =
            await navigator.serviceWorker.register(
                "./service-worker.js?v=5",
                {
                    scope: "./"
                }
            );


        console.log(
            "✅ RangeÇa : Service Worker enregistré",
            registration
        );


        await registration.update();


        return registration;


    } catch (erreur) {

        console.error(
            "❌ RangeÇa : impossible d'enregistrer le Service Worker",
            erreur
        );


        return null;

    }

}


// ==========================================
// INITIALISATION
// ==========================================

window.addEventListener(
    "load",
    async () => {

        console.log(
            "🚀 RangeÇa démarre..."
        );


        afficherTaches();


        mettreAJourBoutonNotifications();


        await enregistrerServiceWorker();


        await testerSupabase();


        programmerToutesLesNotifications();

    }
);
```
