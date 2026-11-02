
"use strict";

/* =====================================
   RANGEÇA — AUTHENTIFICATION
   ===================================== */

const SUPABASE_URL = "https://gmcrlwknxfhxwhocpojk.supabase.co";

const SUPABASE_KEY = "sb_publishable_dHTFA1Vq5WwTH_1qgz9BSw_Bat4DQPl";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const authRedirect = window.location.origin + window.location.pathname;

const authMessage = document.getElementById("authMessage");
const authForm = document.getElementById("authForm");
const loggedAccount = document.getElementById("loggedAccount");
const resetPasswordBox = document.getElementById("resetPasswordBox");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

function afficherMessageCompte(message) {
    authMessage.textContent = message;
}

function afficherCompte(user) {
    if (user) {
        authForm.classList.add("hidden");
        loggedAccount.classList.remove("hidden");
        connectedEmail.textContent = user.email || "";
    } else {
        authForm.classList.remove("hidden");
        loggedAccount.classList.add("hidden");
        connectedEmail.textContent = "";
    }
}

const connectedEmail = document.getElementById("connectedEmail");


/* =====================================
   INSCRIPTION
   ===================================== */

document.getElementById("signupButton").addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        afficherMessageCompte("Entre ton adresse e-mail et ton mot de passe.");
        return;
    }

    if (password.length < 8) {
        afficherMessageCompte("Le mot de passe doit contenir au moins 8 caractères.");
        return;
    }

    const bouton = document.getElementById("signupButton");
    bouton.disabled = true;
    bouton.textContent = "Création en cours...";

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: authRedirect
            }
        });

        if (error) throw error;

        if (data.session) {
            afficherMessageCompte("Compte créé ! Bienvenue sur RangeÇa 🎉");
        } else {
            afficherMessageCompte(
                "Compte créé ! Vérifie tes e-mails pour confirmer ton adresse."
            );
        }

    } catch (error) {
        afficherMessageCompte("Erreur : " + error.message);
    } finally {
        bouton.disabled = false;
        bouton.textContent = "Créer mon compte";
    }
});


/* =====================================
   CONNEXION
   ===================================== */

document.getElementById("loginButton").addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        afficherMessageCompte("Entre ton e-mail et ton mot de passe.");
        return;
    }

    const bouton = document.getElementById("loginButton");
    bouton.disabled = true;
    bouton.textContent = "Connexion...";

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        afficherMessageCompte("Connexion réussie !");

    } catch (error) {
        afficherMessageCompte("Erreur : " + error.message);
    } finally {
        bouton.disabled = false;
        bouton.textContent = "Se connecter";
    }
});


/* =====================================
   MOT DE PASSE OUBLIÉ
   ===================================== */

document.getElementById("forgotButton").addEventListener("click", async () => {
    const email = authEmail.value.trim();

    if (!email) {
        afficherMessageCompte("Entre ton adresse e-mail avant de continuer.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: authRedirect
        });

        if (error) throw error;

        afficherMessageCompte(
            "Si cette adresse correspond à un compte, un e-mail de récupération sera envoyé."
        );

    } catch (error) {
        afficherMessageCompte("Erreur : " + error.message);
    }
});


/* =====================================
   RÉINITIALISATION DU MOT DE PASSE
   ===================================== */

supabaseClient.auth.onAuthStateChange((event, session) => {

    if (event === "PASSWORD_RECOVERY") {
        authForm.classList.add("hidden");
        loggedAccount.classList.add("hidden");
        resetPasswordBox.classList.remove("hidden");

        afficherMessageCompte("Choisis ton nouveau mot de passe.");
        return;
    }

    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        afficherCompte(session?.user || null);
    }

    if (event === "SIGNED_OUT") {
        afficherCompte(null);
        afficherMessageCompte("Tu es déconnecté.");
    }
});


document.getElementById("savePasswordButton").addEventListener("click", async () => {
    const password = document.getElementById("newPassword").value;

    if (password.length < 8) {
        afficherMessageCompte("Choisis au moins 8 caractères.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password
        });

        if (error) throw error;

        resetPasswordBox.classList.add("hidden");
        document.getElementById("newPassword").value = "";

        afficherMessageCompte("Mot de passe modifié avec succès !");

        const { data } = await supabaseClient.auth.getSession();
        afficherCompte(data.session?.user || null);

    } catch (error) {
        afficherMessageCompte("Erreur : " + error.message);
    }
});


/* =====================================
   DÉCONNEXION
   ===================================== */

document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        afficherMessageCompte("Déconnexion réussie.");

    } catch (error) {
        afficherMessageCompte("Erreur : " + error.message);
    }
});
