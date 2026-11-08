# Installation och offline

Implementationen följer Målräknarens `vite-plugin-pwa`-upplägg, med uttrycklig
godkännandeknapp för nya appversioner. Ingen backend eller API-hemlighet behövs.

## Användaren

Installationsguiden öppnas via **Installera** i huvudmenyn och finns längst ned
på båda sidorna under **Installera appen och använd offline**. Guiden ingår i appcachen. På iPhone används Safari → Dela →
Lägg till på hemskärmen (Öppna som webbapp om valet finns). På Android används
Chrome → ⋮ → Lägg till på startskärmen/Installera app. En inbyggd installationsknapp
visas när webbläsaren erbjuder installation.

Vänta på **Appen är redo offline** även när appen öppnats från hemskärmen.
Välj jaktplats, uppdatera prognosen och spara ett kartområde före avfärd.
Kontrollera sedan med nätverket avstängt och en omladdning. Installationen i sig
innebär inte att prognos och kartor finns sparade. GPS kan fungera offline men
är inte garanterad. Privat surfning och lagringsbrist kan begränsa offline-läget.

## Vad sparas?

- Workbox precachar appens HTML, samtliga lazy chunks, CSS, ikoner och jaktdata
  som är inbyggd i JavaScript. Sol- och måntider räknas lokalt. Externa webbfonts
  är inte nödvändiga; appen har systemfont som fallback offline.
- Cacheprefix och service worker-scope är `huntingseasons-app` respektive
  `/huntingseasons/`. Navigationsfallback gäller bara appens basadress.
  Rotlänkar använder avslutande snedstreck så de inte lämnar SW-scope.
- Gamla appfiler rensas av Workbox inom appens egen precache. Andra projekts
  cacher lämnas orörda. Appuppdateringar laddar inte om någon flik utan
  godkännande i den fliken och raderar inte IndexedDB-data.
- Prognoser sparas per exakt förfrågad koordinat (sex decimaler) i IndexedDB
  `huntingseasons-offline-v1`. En nätverksförfrågan avgör om prognosen är färsk,
  inte enbart `navigator.onLine`. Nätverksfel eller timeout ger sparad prognos
  för samma plats, hämtningstid och varning. Vid utgången serie visas ingen
  vindkon. Det går att försöka igen manuellt eller vid återanslutning.
- Platsinställning och län sparas lokalt; ingen positionshistorik eller
  synkronisering tillkommer. Prognos- och kartanrop online fungerar som tidigare.
- Kartpaket sparas i en atomisk IndexedDB-transaktion efter kontroll av
  format, zoom, täckning, fullständighet och storlek. Avbrutna hämtningar
  blir inte färdiga kartområden. Uppskattat ledigt utrymme kontrolleras där
  browsern stöder API:t. Enheten kan fortfarande neka skrivning eller rensa data.

## Offlinekartor och licenser

OSM:s publika rasterserver förbjuder områdesnedladdning/offlinebruk.
OpenTopoMap har inte verifierats för sådan hämtning. **Ingen av dessa källor
förhämtas eller runtime-cachas av vår service worker.**

Offlinepaket använder OpenFreeMap/OpenMapTiles-vektordata. Enligt villkoren
kontrollerade 2026-11-09 tillåts högst 3 000 tiles eller 50 MB per nedladdning,
högst fyra parallella anrop och en egen User-Agent som identifierar appen.
Vi använder striktare gränser: 2 000 tiles, 45 MB kartdata, 64 MB paketfil,
två parallella anrop och radie högst 3 km.

Webbläsaren kan inte tillförlitligt skicka en egen User-Agent. Därför görs
**paketframställningen med Node**, inte genom direkt nedladdning från OFM i
frontend. Appen kan ladda ned förberedda paket från den egna Pages-hostingen
eller importera samma filer. Nedladdning från andra värdar avvisas. Katalogen
och kartpaketen ingår inte i appens obligatoriska precache.

I appen väljer användaren område ur katalogen, kan förhandsvisa det på kartan
och välja högsta detaljnivå att spara. Hela paketfilen hämtas fortfarande från
Pages; den lägre detaljnivån minskar den lokala lagringen, inte nedladdningsstorleken.

Attributionen finns även offline: OpenFreeMap, © OpenMapTiles och © OpenStreetMap
contributors, med länkar. Den lokala Canvas-renderingen kräver inga externa
stilar, sprites eller typsnitt. Den visar marktyper, vatten, byggnader,
vägar/stigar och ortnamn men saknar OpenTopoMaps höjdkurvor och fullständiga
etiketter. Över paketets högsta zoom förstoras befintlig detalj. Utanför sparad
täckning eller under lägsta zoom visas en varning.

### Skapa ett eget område

```sh
npm run maps:prepare -- --lat 58.9959 --lon 16.2058 --radius 1 --zoom 14 --name Katrineholm
```

`radius` är halva bredden/höjden på ett ungefärligt kvadratiskt område i kilometer.
Zoom 10 till vald högsta zoom ingår (maximalt 16, om källan stöder det).
Verktyget identifierar sig som `HuntingSeasons-OfflinePack/1.0`, hämtar bara
områdets tiles och skriver först efter komplett hämtning. Befintliga paketfiler
skrivs inte över. Filen `.hsmap` och en katalogpost skapas i `public/offline-maps/`.
För annan utmatning, använd `--output /absolut/sökväg`. Läs aktuella källvillkor
innan nya paket skapas; undvik upprepade onödiga nedladdningar.

Ett demoområde runt centrala Stockholm (cirka 2 × 2 km, zoom 10–14, 16 tiles)
finns med för test. Kartdata är cirka 2,8 MB, filen cirka 3,7 MB med base64.
För att dela fler områden: skapa dem, lägg filerna och katalogen i samma mapp
och publicera appen. Alternativt dela en `.hsmap` för import på enheten.
Godtyckligt områdesval och nedladdning direkt från kartan stöds alltså inte
ännu; det skulle kräva en annan tillåten webbläsarkälla eller en separat tjänst
som framställer paket. Kartor ersätter inte juridiskt giltiga gränser.

## Utveckling och verifiering

```sh
npm test
npm run lint
npm run build
npm run test:offline
npm run preview -- --host 127.0.0.1 --port 4175
```

Service worker är inte aktiverad i Vites vanliga dev-server. Testa därför på
`http://127.0.0.1:4175/huntingseasons/` med preview, eller på HTTPS efter deployment.
Första besök offline utan att appen har sparats kan inte fungera.

Playwright-testerna använder en vanlig statisk server med Pages-basadress,
sparade testprofiler och kontrollerat väder. De verifierar kallstart offline
efter stängd browser, båda sidornas refresh, verklig Canvas-rendering av
kartpaketet, väderfallback/utgången/saknad prognos, återanslutning,
uppdateringsgodkännande och att andra projekts cacher inte raderas.
Enhetstester täcker lagring, nätverksfallback, fel plats, paketfullständighet,
lagringsbrist och förbud mot förhämtning från OSM/OpenTopoMap.
Ingen verklig användarposition hämtas i testerna. Verifiering på fysisk iPhone
och Android rekommenderas före publicering, särskilt installation och
webbläsarens lagringspolicy.

Nya beroenden: `vite-plugin-pwa` (build), `pbf` och `@mapbox/vector-tile`
(liten lokal vektorrenderare), `fake-indexeddb` och `@playwright/test` (tester).

## Källor

- [OpenFreeMap offlinevillkor och attribution](https://openfreemap.org/quick_start/)
- [OpenFreeMap information och attribution](https://openfreemap.org/)
- [OSM tile-policy](https://operations.osmfoundation.org/policies/tiles/)
- [Apple: webbapp på iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [Google: webbappar på Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid)
