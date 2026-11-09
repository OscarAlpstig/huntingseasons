import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useConnection } from './connection';
import { PwaContext } from './pwaContext';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function OfflineSupport({ children }: { children: ReactNode }) {
  const online = useConnection();
  const [installedCache, setInstalledCache] = useState(false);
  const [message, setMessage] = useState('');
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const approvedReload = useRef(false);
  const reloadIfApproved = () => {
    if (approvedReload.current) { approvedReload.current = false; window.location.reload(); }
  };
  const { offlineReady: [offlineReady], needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onNeedReload: reloadIfApproved,
    onRegisteredSW(_url, registration) {
      if (registration?.active && 'caches' in window) {
        void caches.keys().then(async (names) => {
          for (const name of names.filter((name) => name.startsWith('huntingseasons-app-'))) {
            const cache = await caches.open(name);
            if (await cache.match(`${import.meta.env.BASE_URL}index.html`, { ignoreSearch: true })) { setInstalledCache(true); return; }
          }
        }).catch(() => setInstalledCache(false));
      }
    },
    onRegisterError() { setMessage('Offline-läget kunde inte förberedas. Öppna appen igen med internet och försök på nytt.'); },
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Also covers an update installed by another tab / registration instance.
    navigator.serviceWorker.addEventListener('controllerchange', reloadIfApproved);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', reloadIfApproved);
  }, []);

  useEffect(() => {
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed); };
  }, []);

  useEffect(() => {
    if (online && 'serviceWorker' in navigator) void navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL).then((registration) => registration?.update()).catch(() => undefined);
  }, [online]);

  const ready = offlineReady || installedCache;
  return <PwaContext.Provider value={{ ready, message, install: installPrompt ? async () => {
    try { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
    catch { setMessage('Använd webbläsarens meny för att installera appen.'); }
  } : null }}>
    {children}
    {!online && <span className="offline-indicator" role="status">Offline · sparat innehåll används</span>}
    {needRefresh && <div className="offline-update" role="status">Ny version finns. <button onClick={() => {
      approvedReload.current = true;
      void updateServiceWorker(true).catch(() => { approvedReload.current = false; setMessage('Uppdateringen kunde inte startas. Försök igen senare.'); });
    }}>Uppdatera appen</button></div>}
  </PwaContext.Provider>;
}
