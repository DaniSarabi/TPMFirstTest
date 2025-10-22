// This is a basic service worker.
// It's required for the app to be installable (PWA).
// For now, it just has the basic event listeners.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // You can add caching strategies here later.
});

self.addEventListener('fetch', (event) => {
  // For now, we'll just let the network handle all requests.
  event.respondWith(fetch(event.request));
});
