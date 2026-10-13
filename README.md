# Huntingseasons

En webbapplikation för svenska jakttider och soltider, byggd med React, TypeScript och Vite.

Terrängkartan på **Vind & vittring** använder Leaflet med OpenTopoMap och
OpenStreetMap. Se [kartdokumentationen](docs/terrangkarta.md) för attribution,
lagerstruktur, GeoJSON och GitHub Pages.

## Kom igång

### Förutsättningar

- [Node.js](https://nodejs.org/) (version 18 eller senare)
- npm (följer med Node.js)

### Installation

```bash
npm install
```

### Starta utvecklingsservern

```bash
npm run dev
```

Applikationen öppnas på [http://localhost:5173](http://localhost:5173). Ändringar i koden reflekteras direkt tack vare Vites Hot Module Replacement (HMR).

### Övriga kommandon

| Kommando | Beskrivning |
|---|---|
| `npm run build` | Bygger applikationen för produktion (output i `dist/`) |
| `npm run preview` | Förhandsgranskar produktionsbygget lokalt |
| `npm run lint` | Kör ESLint på hela projektet |
| `npm test` | Kör automatiserade tester och datavalidering |

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Datamodell för jakttider

Sveriges län definieras centralt i `src/data/lan.ts`. Logiken använder stabila
ISO 3166-2-ID:n, exempelvis `SE-AB` för Stockholms län. Namn och äldre alias
används bara vid visning och migrering av sparade inställningar.

Jakttidsfilerna innehåller källmetadata och en lista av arter med strukturerade
perioder. Varje period har start/slut som månad och dag, geografiska områden och
kan dessutom ange djurkategorier, jaktformer samt begränsning efter soltid.

`nextYear` används inte. Om slutets månad/dag ligger före startens månad/dag
tolkas perioden automatiskt som en period över årsskiftet.

### Geografier

- `helaLandet` gäller utan 21 länsdubbletter.
- `lan` innehåller en grupp ISO-ID:n.
- `kommun` beskriver namngivna kommuner inom ett län.
- `delAvLan` bevarar en geografisk del som inte kan uttryckas som en hel kommun.
- Kronhjort har separata typer för kronhjortsskötselområde, kronhjortsområde
  och mark utanför dessa områden.

När användaren endast har valt län visas mer precisa regler som lokala undantag.
UI:t påstår då inte att regeln gäller i hela länet, utan ber användaren
kontrollera den exakta jaktplatsen.

### Uppdatera jakttider

1. Kontrollera den ordinarie sidan [Svenska Jägareförbundet – Jakttider](https://jagareforbundet.se/jakt/jakttider/)
   för samtliga 21 län. Använd inte förslag från pågående översyner som gällande data.
2. Uppdatera `verifiedDate` och berörda perioder.
3. Återanvänd `helaLandet` eller länsgrupper när regeln är identisk.
4. Bevara kommunala och andra lokala avgränsningar; förenkla dem inte till län.
5. Kör `npm test`, `npm run lint` och `npm run build`.

Datavalideringen kontrollerar datum, län-ID:n, områdestyper, djurkategorier,
jaktformer och identiska dubbletter.

Verifieringsprotokoll finns för både [däggdjur](docs/daggdjur-verifiering-2026-08-13.md)
och [fåglar](docs/faglar-verifiering-2026-08-13.md).

## Färgskala

| Användning                | Färg (HEX) | Beskrivning                                              | Exempel |
|---------------------------|:----------:|----------------------------------------------------------|:-------:|
| Bakgrundsfärg             | `#556B2F`  | Mörk, dämpad grön för lugn bakgrund                      | <span style="background:#556B2F;border:1px solid #264D26;padding:0.2em 1em;">&nbsp;</span> |
| Huvudtext                 | `#C6D870`  | Ljusgrönvit för hög kontrast och läsbarhet               | <span style="color:#C6D870;font-weight:bold;">Exempeltext</span> |
| Sekundär text/etiketter   | `#EFF5D2`  | Ljusare grön för rubriker och etiketter                  | <span style="color:#EFF5D2;">Exempeltext</span> |
| Positiva indikatorer      | `#8FA31E`  | Klar grön för att visa godkända/ökning                   | <span style="color:#8FA31E;">Exempeltext</span> |
| Neutral status            | `#264D26`  | Mörkare grön för neutrala element                        | <span style="background:#264D26;border:1px solid #A7C7A7;padding:0.2em 1em;">&nbsp;</span> |
| Negativa indikatorer      | `#6B8E23`  | Ockragrön för varning eller minskning, ändå naturlig      | <span style="color:#6B8E23;">Exempeltext</span> |
| Knappar/brytare           | `#896A58`  | En mättad, djupare grön för klickbara element            | <span style="background:#896A58;color:#E6F2E6;padding:0.2em 1em;">Knapp</span> |
