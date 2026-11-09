// Called only after the user explicitly requests a reload. Keep IndexedDB,
// saved map packages, forecasts and other projects' workers/caches untouched.
export async function recoverApp() {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const response = await fetch(new URL('version.json', base), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Den senaste versionen kunde inte hämtas. Försök igen med internetanslutning.');
  const version = await response.json() as { build: string };
  if (typeof version.build !== 'string' || !version.build) throw new Error('Versionen kunde inte kontrolleras. Försök igen senare.');
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration(base.href);
    if (registration?.scope === base.href) {
      await registration.update();
      // update() can finish before the replacement worker has installed.
      const installing = registration.installing;
      if (installing) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { installing.removeEventListener('statechange', changed); reject(new Error('Uppdateringen tar längre tid än väntat. Försök igen.')); }, 15000);
        const changed = () => {
          if (installing.state === 'installed' || installing.state === 'activated') { clearTimeout(timer); installing.removeEventListener('statechange', changed); resolve(); }
          else if (installing.state === 'redundant') { clearTimeout(timer); installing.removeEventListener('statechange', changed); reject(new Error('Appen kunde inte uppdateras. Försök igen senare.')); }
        };
        installing.addEventListener('statechange', changed); changed();
      });
      if (registration.waiting) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('controllerchange', changed); reject(new Error('Uppdateringen kunde inte slutföras. Försök igen.')); }, 10000);
        const changed = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); resolve(); };
        navigator.serviceWorker.addEventListener('controllerchange', changed);
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  }
  const url = new URL(window.location.href);
  url.searchParams.set('app-version', version.build);
  window.location.replace(url.href);
}
