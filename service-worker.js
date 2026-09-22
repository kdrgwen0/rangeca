```javascript
const CACHE_NAME = "rangeca-v3";

const fichiers = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./logorc.png"
];

// ==========================================
// INSTALLATION
// ==========================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(fichiers))
    );

    // Active immédiatement la nouvelle version
    self.skipWaiting();
});


// ==========================================
// ACTIVATION
// ==========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(nomsCaches => {

            return Promise.all(

                nomsCaches
                    .filter(nom => nom !== CACHE_NAME)
                    .map(nom => caches.delete(nom))

            );

        })

    );

    // Prend immédiatement le contrôle des pages
    self.clients.claim();
});


// ==========================================
// CACHE / REQUÊTES
// ==========================================

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => {

                return response || fetch(event.request);

            })

    );

});


// ==========================================
// CLIC SUR UNE NOTIFICATION
// ==========================================

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(

        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        })
        .then(listeClients => {

            // Si RangeÇa est déjà ouvert,
            // on remet la fenêtre au premier plan
            for (const client of listeClients) {

                if ("focus" in client) {
                    return client.focus();
                }

            }

            // Sinon on ouvre RangeÇa
            if (clients.openWindow) {

                return clients.openWindow("./");

            }

        })

    );

});
```
