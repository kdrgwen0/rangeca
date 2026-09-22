```javascript
const CACHE_NAME = "rangeca-v4";

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

    self.clients.claim();

});


// ==========================================
// REQUÊTES
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

            for (const client of listeClients) {

                if ("focus" in client) {

                    return client.focus();

                }

            }

            if (clients.openWindow) {

                return clients.openWindow("./");

            }

        })

    );

});
```
