export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      void registration.update();
      window.setInterval(() => void registration.update(), 30 * 60 * 1000);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('pgdunk:update-available', { detail: registration }));
          }
        });
      });
    }).catch((error) => console.warn('Service worker indisponible', error));
  });
}

export function activatePwaUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting) {
    window.location.reload();
    return;
  }

  let hasReloaded = false;
  const reload = () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  window.setTimeout(reload, 2500);
}
