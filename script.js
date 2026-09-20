let taches = JSON.parse(localStorage.getItem("tachesRangeCa")) || [];


// =========================
// AJOUTER DES TÂCHES
// =========================

function ranger() {

    let texte = document.getElementById("texte").value;

    let lignes = texte.split("\n");

    lignes.forEach(function(ligne) {

        ligne = ligne.trim();

        if (ligne === "") {
            return;
        }

        let mot = ligne.toLowerCase();

        let categorie = "autre";


        // =========================
        // 🛒 ACHATS
        // =========================

        if (
            mot.includes("acheter") ||
            mot.includes("achète") ||
            mot.includes("courses") ||
            mot.includes("magasin") ||
            mot.includes("commander") ||
            mot.includes("commande") ||
            mot.includes("shopping") ||
            mot.includes("payer")
        ) {

            categorie = "achats";

        }


        // =========================
        // 📚 ÉCOLE
        // =========================

        else if (
            mot.includes("devoir") ||
            mot.includes("contrôle") ||
            mot.includes("controle") ||
            mot.includes("ds ") ||
            mot.includes("révision") ||
            mot.includes("revision") ||
            mot.includes("cours") ||
            mot.includes("maths") ||
            mot.includes("anglais") ||
            mot.includes("français") ||
            mot.includes("francais") ||
            mot.includes("histoire") ||
            mot.includes("géographie") ||
            mot.includes("geographie") ||
            mot.includes("svt") ||
            mot.includes("physique") ||
            mot.includes("chimie") ||
            mot.includes("espagnol") ||
            mot.includes("allemand") ||
            mot.includes("exercice") ||
            mot.includes("exposé") ||
            mot.includes("expose")
        ) {

            categorie = "ecole";

        }


        // =========================
        // 🎮 LOISIRS
        // =========================

        else if (
            mot.includes("jouer") ||
            mot.includes("jeu") ||
            mot.includes("gaming") ||
            mot.includes("gta") ||
            mot.includes("valorant") ||
            mot.includes("fortnite") ||
            mot.includes("minecraft") ||
            mot.includes("playstation") ||
            mot.includes("ps5") ||
            mot.includes("film") ||
            mot.includes("cinéma") ||
            mot.includes("cinema") ||
            mot.includes("netflix") ||
            mot.includes("youtube") ||
            mot.includes("musique") ||
            mot.includes("série") ||
            mot.includes("serie")
        ) {

            categorie = "loisirs";

        }


        // =========================
        // 🏠 MAISON
        // =========================

        else if (
            mot.includes("ménage") ||
            mot.includes("menage") ||
            mot.includes("ranger") ||
            mot.includes("chambre") ||
            mot.includes("linge") ||
            mot.includes("vaisselle") ||
            mot.includes("nettoyer") ||
            mot.includes("nettoyage") ||
            mot.includes("aspirateur") ||
            mot.includes("poubelle")
        ) {

            categorie = "maison";

        }


        // =========================
        // ⚽ SPORT
        // =========================

        else if (
            mot.includes("sport") ||
            mot.includes("football") ||
            mot.includes("foot") ||
            mot.includes("basket") ||
            mot.includes("tennis") ||
            mot.includes("courir") ||
            mot.includes("course à pied") ||
            mot.includes("entraînement") ||
            mot.includes("entrainement") ||
            mot.includes("muscu") ||
            mot.includes("gym")
        ) {

            categorie = "sport";

        }


        // =========================
        // 📅 RENDEZ-VOUS
        // =========================

        else if (
            mot.includes("rendez-vous") ||
            mot.includes("rendez vous") ||
            mot.includes("médecin") ||
            mot.includes("medecin") ||
            mot.includes("dentiste") ||
            mot.includes("docteur") ||
            mot.includes("rdv")
        ) {

            categorie = "rendezvous";

        }


        // =========================
        // DATE
        // =========================

        let date = detecterDate(mot);


        // =========================
        // CRÉER LA TÂCHE
        // =========================

        taches.push({

            texte: ligne,

            categorie: categorie,

            date: date,

            terminee: false

        });

    });


    document.getElementById("texte").value = "";


    sauvegarder();

    afficherTaches();

}



// =========================
// DÉTECTER UNE DATE
// =========================

function detecterDate(texte) {

    let maintenant = new Date();


    // =========================
    // AUJOURD'HUI
    // =========================

    if (
        texte.includes("aujourd'hui") ||
        texte.includes("aujourd’hui")
    ) {

        return formaterDate(maintenant);

    }


    // =========================
    // DEMAIN
    // =========================

    if (texte.includes("demain")) {

        let date = new Date(maintenant);

        date.setDate(date.getDate() + 1);

        return formaterDate(date);

    }


    // =========================
    // APRÈS-DEMAIN
    // =========================

    if (
        texte.includes("après-demain") ||
        texte.includes("apres-demain")
    ) {

        let date = new Date(maintenant);

        date.setDate(date.getDate() + 2);

        return formaterDate(date);

    }


    // =========================
    // CE SOIR
    // =========================

    if (texte.includes("ce soir")) {

        return formaterDate(maintenant) + " — ce soir";

    }


    // =========================
    // DANS X JOURS
    // =========================

    let joursDans =
        texte.match(/dans\s+(\d+)\s+jours?/);


    if (joursDans) {

        let nombre = parseInt(joursDans[1]);

        let date = new Date(maintenant);

        date.setDate(date.getDate() + nombre);

        return formaterDate(date);

    }


    // =========================
    // DANS X SEMAINES
    // =========================

    let semainesDans =
        texte.match(/dans\s+(\d+)\s+semaines?/);


    if (semainesDans) {

        let nombre = parseInt(semainesDans[1]);

        let date = new Date(maintenant);

        date.setDate(
            date.getDate() + nombre * 7
        );

        return formaterDate(date);

    }


    // =========================
    // JOURS DE LA SEMAINE
    // =========================

    let jours = [

        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi"

    ];


    for (let i = 0; i < jours.length; i++) {

        if (texte.includes(jours[i])) {

            let jourActuel =
                maintenant.getDay();


            let joursAvant =
                (i - jourActuel + 7) % 7;


            // "prochain" = semaine suivante

            if (
                texte.includes("prochain") ||
                texte.includes("prochaine")
            ) {

                if (joursAvant === 0) {

                    joursAvant = 7;

                } else {

                    joursAvant += 7;

                }

            }


            let date =
                new Date(maintenant);


            date.setDate(
                date.getDate() + joursAvant
            );


            return formaterDate(date);

        }

    }


    // =========================
    // DATE "25 SEPTEMBRE"
    // =========================

    let mois = {

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


    for (let nomMois in mois) {

        let recherche = texte.match(

            new RegExp(
                "(\\d{1,2})\\s+" + nomMois
            )

        );


        if (recherche) {

            let jour =
                parseInt(recherche[1]);


            let numeroMois =
                mois[nomMois];


            let annee =
                maintenant.getFullYear();


            let date = new Date(

                annee,

                numeroMois,

                jour

            );


            // Si la date est déjà passée,
            // on considère l'année prochaine.

            if (date < maintenant) {

                date.setFullYear(
                    annee + 1
                );

            }


            return formaterDate(date);

        }

    }


    return "";

}



// =========================
// FORMATER UNE DATE
// =========================

function formaterDate(date) {

    let options = {

        weekday: "long",

        day: "numeric",

        month: "long"

    };


    let resultat =
        date.toLocaleDateString(
            "fr-FR",
            options
        );


    return resultat.charAt(0).toUpperCase()
        + resultat.slice(1);

}



// =========================
// AFFICHER LES TÂCHES
// =========================

function afficherTaches() {

    let resultat = "";


    let achats =
        taches.filter(
            tache =>
                tache.categorie === "achats"
        );


    let ecole =
        taches.filter(
            tache =>
                tache.categorie === "ecole"
        );


    let loisirs =
        taches.filter(
            tache =>
                tache.categorie === "loisirs"
        );


    let maison =
        taches.filter(
            tache =>
                tache.categorie === "maison"
        );


    let sport =
        taches.filter(
            tache =>
                tache.categorie === "sport"
        );


    let rendezvous =
        taches.filter(
            tache =>
                tache.categorie === "rendezvous"
        );


    let autres =
        taches.filter(
            tache =>
                tache.categorie === "autre"
        );


    afficherCategorie(
        "🛒 Achats",
        achats
    );


    afficherCategorie(
        "📚 École",
        ecole
    );


    afficherCategorie(
        "🎮 Loisirs",
        loisirs
    );


    afficherCategorie(
        "🏠 Maison",
        maison
    );


    afficherCategorie(
        "⚽ Sport",
        sport
    );


    afficherCategorie(
        "📅 Rendez-vous",
        rendezvous
    );


    afficherCategorie(
        "📦 Autre",
        autres
    );



    function afficherCategorie(
        titre,
        liste
    ) {

        if (liste.length === 0) {

            return;

        }


        resultat +=
            `<h2>${titre}</h2>`;


        liste.forEach(
            function(tache) {

                let index =
                    taches.indexOf(tache);


                resultat += `

                    <div class="tache">

                        <input
                            type="checkbox"

                            ${tache.terminee
                                ? "checked"
                                : ""}

                            onchange="
                                terminerTache(${index})
                            "
                        >


                        <div class="contenu-tache">

                            <span class="${
                                tache.terminee
                                    ? "terminee"
                                    : ""
                            }">

                                ${tache.texte}

                            </span>


                            ${
                                tache.date

                                ? `

                                    <small
                                        class="date-tache"
                                    >

                                        📅 ${tache.date}

                                    </small>

                                `

                                : ""

                            }

                        </div>


                        <button
                            class="modifier"
                            onclick="
                                modifierTache(${index})
                            "
                        >

                            ✏️

                        </button>


                        <button
                            class="supprimer"
                            onclick="
                                supprimerTache(${index})
                            "
                        >

                            🗑️

                        </button>

                    </div>

                `;

            }
        );

    }


    document.getElementById(
        "resultat"
    ).innerHTML =

        resultat ||

        `
            <p class="empty">
                Aucune tâche pour le moment...
            </p>
        `;

}



// =========================
// TERMINER UNE TÂCHE
// =========================

function terminerTache(index) {

    taches[index].terminee =
        !taches[index].terminee;


    sauvegarder();

    afficherTaches();

}



// =========================
// SUPPRIMER UNE TÂCHE
// =========================

function supprimerTache(index) {

    taches.splice(index, 1);


    sauvegarder();

    afficherTaches();

}



// =========================
// MODIFIER UNE TÂCHE
// =========================

function modifierTache(index) {

    let nouveauTexte = prompt(

        "✏️ Modifie ta tâche :",

        taches[index].texte

    );


    if (nouveauTexte === null) {

        return;

    }


    nouveauTexte =
        nouveauTexte.trim();


    if (nouveauTexte === "") {

        return;

    }


    taches[index].texte =
        nouveauTexte;


    // Recalcul de la date

    taches[index].date =
        detecterDate(
            nouveauTexte.toLowerCase()
        );


    sauvegarder();

    afficherTaches();

}



// =========================
// SAUVEGARDER
// =========================

function sauvegarder() {

    localStorage.setItem(

        "tachesRangeCa",

        JSON.stringify(taches)

    );

}



// =========================
// CHARGER LES TÂCHES
// =========================

afficherTaches();



// =========================
// SERVICE WORKER
// =========================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker.register(
                "./service-worker.js"
            )

            .then(function() {

                console.log(
                    "RangeÇa fonctionne hors connexion !"
                );

            })

            .catch(function(error) {

                console.log(
                    "Erreur service worker :",
                    error
                );

            });

        }
    );

}
