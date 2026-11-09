import { useContext } from 'react';
import { PwaContext } from '../offline/pwaContext';

export default function InstallationPage() {
  const { ready, message, install } = useContext(PwaContext);
  return (
    <div className="simple-page installation-page">
      <h1>Installera</h1>
      <p>Installera Hunting Seasons på hemskärmen och förbered appen för offlinebruk.</p>
      <p role="status">{ready ? 'Appen är redo offline på den här enheten.' : 'Offline-läget förbereds när du öppnar produktionsversionen med internet. Vänta tills appen är redo innan du kopplar ned.'}</p>
      {message && <p role="alert">{message}</p>}
      {install && <button className="today-button" onClick={() => void install()}>Installera Hunting Seasons</button>}
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

    </div>
  );
}

