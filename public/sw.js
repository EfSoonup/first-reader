// Service Worker für Offline-Betrieb auf dem Tablet.
// Seite: erst Netz (Updates kommen sofort an), offline aus dem Cache.
// Dateien unter assets/ tragen einen Hash im Namen und ändern sich nie: erst Cache.
const CACHE = "lesestart-v1";
const ASSET_MUSTER = /(?:src|href)="\.?\/?(assets\/[^"]+)"/g;

const assetsIn = (html) => [...html.matchAll(ASSET_MUSTER)].map((t) => t[1]);

/**
 * Skripte und Styles früherer Versionen entfernen, damit der Cache nicht endlos wächst.
 * Schriften bleiben: Sie stehen nur im CSS, nicht im HTML, und ändern sich praktisch nie.
 */
async function raeumeAuf(cache, html) {
  const aktuell = new Set(assetsIn(html).map((d) => new URL(d, self.registration.scope).href));
  for (const anfrage of await cache.keys()) {
    const veraltet = /\/assets\/[^/]+\.(js|css)$/.test(new URL(anfrage.url).pathname) && !aktuell.has(anfrage.url);
    if (veraltet) await cache.delete(anfrage);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const antwort = await fetch("./", { cache: "no-cache" });
      const html = await antwort.clone().text();
      await cache.put("./", antwort);
      // Skripte und Styles der aktuellen Version gleich mitnehmen, damit schon der nächste Start offline klappt.
      await cache.addAll(["manifest.webmanifest", "icon-192.png", ...assetsIn(html)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET" || new URL(anfrage.url).origin !== self.location.origin) return;

  if (anfrage.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const antwort = await fetch(anfrage);
          if (antwort.ok) {
            await cache.put("./", antwort.clone());
            event.waitUntil(antwort.clone().text().then((html) => raeumeAuf(cache, html)));
          }
          return antwort;
        } catch {
          return (await cache.match("./")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const treffer = await cache.match(anfrage);
      if (treffer) return treffer;
      const antwort = await fetch(anfrage);
      if (antwort.ok) await cache.put(anfrage, antwort.clone());
      return antwort;
    })(),
  );
});
