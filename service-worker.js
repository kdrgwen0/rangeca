const CACHE_NAME = "rangeca-v6";

const fichiers = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./logorc.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(fichiers))
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cachesExistants => {
                return Promise.all(
                    cachesExistants
                        .filter(nom => nom !== CACHE_NAME)
                        .map(nom => caches.delete(nom))
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Réception des notifications push
self.addEventListener("push", event => {
    let donnees = {};

    try {
        donnees = event.data ? event.data.json() : {};
    } catch (error) {
        donnees = {
            body: event.data ? event.data.text() : ""
        };
    }

    const titre = donnees.title || "RangeÇa 🧹";

    const options = {
        body: donnees.body || "Tu as une tâche à ne pas oublier !",
        icon: "./logorc.png",
        badge: "./logorc.png",
        data: {
            url: donnees.url || "./"
        }
    };

    event.waitUntil(
        self.registration.showNotification(titre, options)
    );
});

// Clic sur une notification
self.addEventListener("notificationclick", event => {
    event.notification.close();

    const url = event.notification.data?.url || "./";

    event.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(clients => {

            for (const client of clients) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }

        })
    );
});
