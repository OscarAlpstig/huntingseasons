import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useConnection } from './connection';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function OfflineSupport() {
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
  return <section className="offline-support" aria-label="Installation och offline">
    {!online && <span className="offline-indicator" role="status">Offline · sparat innehåll används</span>}
    {needRefresh && <div className="offline-update" role="status">Ny version finns. <button onClick={() => {
      approvedReload.current = true;
      void updateServiceWorker(true).catch(() => { approvedReload.current = false; setMessage('Uppdateringen kunde inte startas. Försök igen senare.'); });
    }}>Uppdatera appen</button></div>}
    <details id="offline-guide">
      <summary>Installera appen och använd offline</summary>
      <p role="status">{ready ? 'Appen är redo offline på den här enheten.' : 'Offline-läget förbereds när du öppnar produktionsversionen med internet. Vänta tills appen är redo innan du kopplar ned.'}</p>
      {message && <p role="alert">{message}</p>}
      {installPrompt && <button onClick={() => { void installPrompt.prompt().then(() => installPrompt.userChoice).then(() => setInstallPrompt(null)).catch(() => setMessage('Använd webbläsarens meny för att installera appen.')); }}>Installera Jaktsäsong</button>}
      <h2>iPhone</h2>
      <p>Öppna appen i Safari med internet. Tryck på Dela, välj <strong>Lägg till på hemskärmen</strong> och sedan <strong>Lägg till</strong>. Aktivera <strong>Öppna som webbapp</strong> om valet visas. Dela kan ligga i menyn beroende på Safari-version.</p>
      <h2>Android</h2>
      <p>Öppna appen i Chrome. Tryck på <strong>⋮</strong> och välj <strong>Lägg till på startskärmen → Installera</strong> eller <strong>Installera app</strong>. Följ anvisningarna.</p>
      <h2>Förbered en tur</h2>
      <ol><li>Öppna även appen från hemskärmen med internet och kontrollera att den är redo offline.</li>
        <li>Välj jaktplats och uppdatera prognosen. Kontrollera att den kan sparas.</li>
        <li>Under Kartlager kan du spara ett tillgängligt kartområde eller importera ett eget paket. Välj sedan Sparad karta.</li>
        <li>Stäng av nätverket och kontrollera båda sidorna, även efter omladdning.</li></ol>
      <p>Jakttider, sol- och måntider beräknas lokalt. Väder kräver internet för uppdatering; sparade prognoser visar hämtningstid och när de har löpt ut. GPS kan fungera offline men är inte garanterat tillgänglig. Du kan alltid välja en plats på kartan.</p>
      <p>Kartor finns bara inom sparat område och detaljnivå. OSM och OpenTopoMap laddas inte ned för offlinebruk. Installerad app och sparad prognos innebär inte att kartor är sparade.</p>
      <h2>Lagring och uppdateringar</h2>
      <p>Innehållet sparas på den här enheten. Ta bort kartområden under Kartlager och spara dem igen för att uppdatera dem. Ingen automatisk positionshistorik sparas. Webbläsaren kan rensa data vid lagringsbrist; privat surfning kan begränsa lagringen. Kontrollera alltid offline-läget före turen.</p>
      <p>När en ny appversion finns visas en uppdateringsknapp. Tryck när det passar att ladda om appen. Sparade kartor och prognoser raderas inte av appuppdateringen.</p>
    </details>
  </section>;
}
