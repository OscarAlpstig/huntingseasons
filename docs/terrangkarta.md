# Terrängkarta

Kartfunktionen kompletterar den befintliga sidan **Vind & vittring** på
`/huntingseasons/jaktplanering/`. Leaflet 1.9.4 används direkt, precis som
tidigare. React Leaflet behövs inte och inga nya dependencies har tillkommit.

## Baskartor och attribution

`src/components/TerrainMap/baseLayers.ts` innehåller konfigurationen:

- **Terräng (standard):** `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`,
  underdomäner a/b/c. Native zoom är högst 17; vid zoom 18–19 förstoras
  befintliga tiles och ingen ytterligare terrängdetalj tillkommer.
- **Standardkarta:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, zoom 19.

Ingen tjänst kräver en hemlig API-nyckel. Leaflet visar det aktiva lagrets
attribution permanent i kartan, även på mobil:

- Kartdata: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- Terrängdata: SRTM.
- Kartstil: © [OpenTopoMap](https://opentopomap.org),
  [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Se [OpenTopoMaps användningsinformation](https://wiki.opentopomap.org/about)
och [OSM:s tile-policy](https://operations.osmfoundation.org/policies/tiles/).
Vi laddar bara synliga tiles vid normal kartanvändning, använder webbläsarens
HTTP-cache och erbjuder ingen massnedladdning eller offlinefunktion.
Tiles är externa tjänster utan garanterad tillgänglighet. Vid tile-fel visas
en enkel uppmaning att byta baskarta; väder, markörer och resten av appen fungerar
vidare. Kartinnehållets detaljrikedom och aktualitet varierar mellan områden.
Kartan är inte en källa till juridiskt giltiga fastighets- eller jaktgränser.

## Komponenter och livscykel

- `TerrainMap.tsx`: en kartinstans per monterad vy, baskartebyte, lagerkontroll,
  responsiv storlek och UI. `ResizeObserver` håller Leaflets storlek uppdaterad.
- `baseLayers.ts`: tile-URL:er, zoomnivåer och attribution.
- `useGeolocation.ts`: browserposition endast efter tryck på positionsknappen;
  hanterar nekad åtkomst, saknat stöd, timeout och otillgänglig position.
  Sena svar ignoreras efter avmontering. Ingen positionshistorik sparas.
- `markers.ts`: vald, flyttbar platsmarkör.
- `overlays.ts`: gränssnitt för egna lager, oberoende av baskartan.
- `scentLayer.ts`: befintlig illustrativ vittring, valbar i lagerkontrollen.
- `WeatherMapPanel.tsx`: väderhämtning och prognos-UI; äger inte kartinstansen.

På mobil visas kartan först och får cirka 65 % av skärmhöjden (380–620 px).
Lagerkontrollen och positionsknappen ligger utanför Leaflets canvas så att de
fortsätter fungera även när tiles inte laddas. Vanliga vektorlager använder
Canvas; vittringen använder separat SVG-rendering för animationen.

## Lägg till ett eget lager

Skicka en memoiserad lista med `MapOverlay` till `TerrainMap.overlays`.
Varje definition har ett stabilt `id`, en svensk `label` och
`create(map): L.Layer`. Den visas automatiskt som en kryssruta under **Egna lager**.
Lagret skapas när det aktiveras och tas bort när det döljs eller kartan lämnas.
Lyssnare/resurser som tillförs av lagret måste städas när lagret tas bort.
Lagerdata ska uppdateras via stabila definitioner, inte genom att skapa om kartan.

Exempel med jaktområde som redan är laddat GeoJSON:

```tsx
const overlays = useMemo<MapOverlay[]>(() => [{
  id: 'hunting-area',
  label: 'Jaktområde',
  create: () => L.geoJSON(areaData, {
    style: { color: '#e9893d', weight: 2, fillOpacity: 0.12 },
  }),
}], [areaData]);
```

GeoJSON använder `[longitud, latitud]`, medan Leaflets vanliga punktkoordinater
använder `[latitud, longitud]`. Validera polygonerna och datans användningsrätt.
Om en fil senare läggs under `public/maps/`, hämta den vid behov med
`fetch(`${import.meta.env.BASE_URL}maps/jaktomrade.geojson`)`.
Undvik att ladda hela Sveriges geometrier vid sidstart. Vid många objekt:
ladda per område/viewport, förenkla geometrier och använd Canvas för punkter
(`L.circleMarker` via `pointToLayer`) eller klustring för många DOM-markörer.
Skapa separata definitioner för pass, observationer, spår, län eller solinformation.

## GitHub Pages och kontroller

Vites base är fortsatt `/huntingseasons/`. Tiles har externa HTTPS-adresser,
markören är en lokal `divIcon`, och inga egna assets använder rotabsoluta paths.
`npm run build` skapar även `dist/jaktplanering/index.html` via
`scripts/build-route-pages.mjs`, så direktlänkar och refresh fungerar på Pages.
Det befintliga GitHub Actions-flödet kör samma byggkommando och publicerar `dist`.

Kör `npm test`, `npm run lint` och `npm run build`. Testerna kontrollerar
baskartekonfiguration och attribution, rendering, stabil kartinstans,
tile-fel, egna lager samt geolocation inklusive sena svar.
Ingen test hämtar riktiga tiles eller verklig användarposition.
