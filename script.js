```javascript
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

        const donnees = await reponse.json();

        console.log("Supabase :", donnees);

    } catch (erreur) {

        console.error(
            "Erreur Supabase :",
            erreur
        );

    }
}


// ==========================================
// NOTIFICATIONS
// ==========================================

async function activerNotifications() {

    if (!("Notification" in window)) {

        alert(
            "❌ Les notifications ne sont pas disponibles sur cet appareil."
        );

        return;
    }

    const permission =
        await Notification.requestPermission();

    const bouton =
        document.getElementById(
            "boutonNotifications"
        );

    if (permission === "granted") {

        bouton.textContent =
            "✅ Notifications activées";

        bouton.disabled = true;

        new Notification(
            "🧹 RangeÇa",
            {
                body:
                    "Les notifications sont maintenant activées !"
            }
        );

    } else if (permission === "denied") {

        bouton.textContent =
            "❌ Notifications refusées";
    }
}


// ==========================================
// PARAMÈTRES
// ==========================================

function ouvrirParametres() {

    const menu =
        document.getElementById(
            "menuParametres"
        );

    menu.classList.toggle("ouvert");
}


// ==========================================
// CLASSIFICATION
// ==========================================

function determinerCategorie(texte) {

    const t =
        texte.toLowerCase();


    // Achats

    if (
        t.includes("acheter") ||
        t.includes("achat") ||
        t.includes("courses") ||
        t.includes("lait") ||
        t.includes("chaussures")
    ) {

        return "🛒 Achats";
    }


    // École

    if (
        t.includes("devoir") ||
        t.includes("contrôle") ||
        t.includes("controle") ||
        t.includes("cours") ||
        t.includes("maths") ||
        t.includes("anglais") ||
        t.includes("svt") ||
        t.includes("école") ||
        t.includes("ecole")
    ) {

        return "📚 École";
    }


    // Loisirs

    if (
        t.includes("jouer") ||
        t.includes("gta") ||
        t.includes("jeu") ||
        t.includes("gaming")
    ) {

        return "🎮 Loisirs";
    }


    // Maison

    if (
        t.includes("ménage") ||
        t.includes("menage") ||
        t.includes("ranger") ||
        t.includes("nettoyer") ||
        t.includes("maison")
    ) {

        return "🏠 Maison";
    }


    // Sport

    if (
        t.includes("sport") ||
        t.includes("foot") ||
        t.includes("football") ||
        t.includes("muscu") ||
        t.includes("entraînement") ||
        t.includes("entrainement")
    ) {

        return "⚽ Sport";
    }


    // Rendez-vous

    if (
        t.includes("rendez-vous") ||
        t.includes("rendez vous") ||
        t.includes("rdv") ||
        t.includes("médecin") ||
        t.includes("medecin") ||
        t.includes("dentiste")
    ) {

        return "📅 Rendez-vous";
    }


    return "📦 Autre";
}


// ==========================================
// DÉTECTION DE DATE
// ==========================================

function determinerDate(texte) {

    const t =
        texte.toLowerCase();

    const maintenant =
        new Date();


    // Aujourd'hui

    if (
        t.includes("aujourd'hui") ||
        t.includes("aujourd’hui")
    ) {

        return maintenant
            .toISOString()
            .split("T")[0];
    }


    // Demain

    if (t.includes("demain")) {

        const date =
            new Date(maintenant);

        date.setDate(
            date.getDate() + 1
        );

        return date
            .toISOString()
            .split("T")[0];
    }


    // Après-demain

    if (
        t.includes("après-demain") ||
        t.includes("apres-demain")
    ) {

        const date =
            new Date(maintenant);

        date.setDate(
            date.getDate() + 2
        );

        return date
            .toISOString()
            .split("T")[0];
    }


    // Dans X jours

    const jours =
        t.match(
            /dans\s+(\d+)\s+jours?/
        );

    if (jours) {

        const nombre =
            parseInt(jours[1]);

        const date =
            new Date(maintenant);

        date.setDate(
            date.getDate() + nombre
        );

        return date
            .toISOString()
            .split("T")[0];
    }


    // Dans X semaines

    const semaines =
        t.match(
            /dans\s+(\d+)\s+semaines?/
        );

    if (semaines) {

        const nombre =
            parseInt(semaines[1]);

        const date =
            new Date(maintenant);

        date.setDate(
            date.getDate() +
            nombre * 7
        );

        return date
            .toISOString()
            .split("T")[0];
    }


    // Jours de la semaine

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

        if (t.includes(jour)) {

            const date =
                new Date(maintenant);

            const jourActuel =
                date.getDay();

            const jourVoulu =
                joursSemaine[jour];

            let difference =
                jourVoulu -
                jourActuel;

            if (difference <= 0) {

                difference += 7;
            }

            date.setDate(
                date.getDate() +
                difference
            );

            return date
                .toISOString()
                .split("T")[0];
        }
    }


    // Dates comme : 25 septembre

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
                dateTexte[1]
            );

        const moisNom =
            dateTexte[2];

        let annee =
            maintenant.getFullYear();

        let date =
            new Date(
                annee,
                mois[moisNom],
                jour
            );


        if (date < maintenant) {

            date =
                new Date(
                    annee + 1,
                    mois[moisNom],
                    jour
                );
        }


        return date
            .toISOString()
            .split("T")[0];
    }


    return null;
}


// ==========================================
// SAUVEGARDER UNE TÂCHE DANS SUPABASE
// ==========================================

async function sauvegarderTacheSupabase(
    texte,
    categorie,
    date
) {

    try {

        const reponse =
            await fetch(
                `${SUPABASE_URL}/rest/v1/taches`,
                {

                    method: "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"

                    },

                    body:
                        JSON.stringify({

                            texte:
                                texte,

                            categorie:
                                categorie,

                            date_tache:
                                date,

                            heure_notification:
                                date
                                    ? "18:00:00"
                                    : null,

                            notification_envoyee:
                                false

                        })
                }
            );


        if (!reponse.ok) {

            const erreur =
                await reponse.text();

            console.error(
                "Erreur Supabase :",
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
// RANGER LES INFORMATIONS
// ==========================================

function ranger() {

    const textarea =
        document.getElementById(
            "texte"
        );

    const texte =
        textarea.value.trim();


    if (!texte) {

        alert(
            "Écris quelque chose à ranger !"
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


    const resultat =
        document.getElementById(
            "resultat"
        );


    resultat.innerHTML = "";


    const categories = {};


    lignes.forEach(ligne => {

        const categorie =
            determinerCategorie(
                ligne
            );

        const date =
            determinerDate(
                ligne
            );


        if (!categories[categorie]) {

            categories[categorie] = [];
        }


        categories[categorie].push({

            texte:
                ligne,

            date:
                date

        });


        sauvegarderTacheSupabase(
            ligne,
            categorie,
            date
        );

    });


    // ==========================================
    // AFFICHAGE
    // ==========================================

    Object.keys(categories)
        .forEach(categorie => {

            const bloc =
                document.createElement(
                    "div"
                );

            bloc.className =
                "categorie";


            const titre =
                document.createElement(
                    "h3"
                );

            titre.textContent =
                categorie;


            bloc.appendChild(
                titre
            );


            categories[categorie]
                .forEach(tache => {

                    const ligne =
                        document.createElement(
                            "div"
                        );

                    ligne.className =
                        "tache";


                    const checkbox =
                        document.createElement(
                            "input"
                        );

                    checkbox.type =
                        "checkbox";


                    const texteTache =
                        document.createElement(
                            "span"
                        );

                    texteTache.textContent =
                        tache.texte;


                    if (tache.date) {

                        const dateAffichee =
                            document.createElement(
                                "small"
                            );

                        const date =
                            new Date(
                                tache.date
                            );

                        dateAffichee.textContent =
                            " 📅 " +
                            date.toLocaleDateString(
                                "fr-FR"
                            );

                        texteTache.appendChild(
                            dateAffichee
                        );
                    }


                    checkbox.addEventListener(
                        "change",
                        function () {

                            if (
                                checkbox.checked
                            ) {

                                texteTache.style.textDecoration =
                                    "line-through";

                                texteTache.style.opacity =
                                    "0.5";

                            } else {

                                texteTache.style.textDecoration =
                                    "none";

                                texteTache.style.opacity =
                                    "1";
                            }

                        }
                    );


                    ligne.appendChild(
                        checkbox
                    );

                    ligne.appendChild(
                        texteTache
                    );

                    bloc.appendChild(
                        ligne
                    );

                });


            resultat.appendChild(
                bloc
            );

        });


    textarea.value = "";
}


// ==========================================
// TEST AU DÉMARRAGE
// ==========================================

testerSupabase();
```
