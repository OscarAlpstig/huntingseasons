# Verifiering av däggdjursjakttider 2026-08-13

Primärkälla: [Svenska Jägareförbundet – Jakttider](https://jagareforbundet.se/jakt/jakttider/)

Sekundär kontrollkälla vid områdes- och solregler:
[Jaktförordning (1987:905), gällande lydelse](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/jaktforordning-1987905_sfs-1987-905/)

Jägareförbundets ordinarie länsfilter kontrollerades maskinellt för alla 21 län.
Sidan för den pågående översynen 2026–2032 användes inte.

## Kontrollerade arter

| Art | Länsfilter kontrollerade | Resultat |
|---|---:|---|
| Björn | 21 | Licensjaktsram i sju län; kräver aktuellt beslut |
| Bäver | 21 | Två verifierade länsgrupper |
| Dovhjort | 21 | Fem rikstäckande perioder |
| Fälthare | 21 | Rikstäckande period |
| Grävling | 21 | Rikstäckande period |
| Iller | 21 | Rikstäckande period |
| Kronhjort | 21 | Skötselområde/oregistrerad mark samt Skånes kronhjortsområden |
| Mink | 21 | Endast skyddsjakt visades |
| Mård | 21 | Två verifierade länsgrupper |
| Rådjur | 21 | Fyra rikstäckande perioder |
| Rödräv | 21 | Fyra länsgrupper och kommunalt undantag i Älvdalen |
| Skogshare | 21 | Två verifierade länsgrupper |
| Vessla | 21 | Endast skyddsjakt visades |
| Vildkanin | 21 | Endast skyddsjakt visades |
| Vildsvin | 21 | Två rikstäckande perioder |
| Älg | 21 | Nord/syd samt kommun- och delområden; årliga länsbeslut krävs |

Artfiltret innehöll även Bisam, Lodjur, Mårdhund och Vikare, men den ordinarie
jakttidssidan gav ingen aktuell jakttidsrad för något län. De lagras därför inte
som aktiva jaktperioder. Detta är avsiktligt och skiljer sig från att anta en
rikstäckande period.

## Skillnader mot tidigare `daggdjur.json`

- Länsnamn i fri text har ersatts av ISO 3166-2-ID:n.
- `nextYear` har tagits bort; årsskifte härleds från månad och dag.
- Bäver har slagits ihop till de två faktiska länsgrupperna, 1 oktober–10 maj
  respektive 1 oktober–15 maj.
- Dovhjortens fem identiska nationella regler lagras en gång vardera.
- Rådjur ändrades från ett fåtal län till verifierade rikstäckande perioder.
- Vildsvin ändrades från länsvisa specialrader till två rikstäckande perioder;
  skyddet för sugga med små kultingar och hundbegränsningen bevarades.
- Fälthare-dubbletten togs bort och perioden gjordes rikstäckande.
- Grävling och iller ändrades från endast Södermanland till hela landet.
- Mård delades i de två verifierade länsgrupperna.
- Rödräv delades i fyra länsgrupper. Älvdalens kommun lagras som kommunalt
  undantag och gäller inte hela Dalarnas län.
- Skogshare delades i de två verifierade länsgrupperna.
- Kronhjort modelleras nu separat inom/utanför kronhjortsskötselområde och
  inom/utanför Skånes kronhjortsområde. Jaktform och djurkategori är strukturerade.
- Björn, Vessla och Älg lades till eftersom den ordinarie sidan visade aktuella rader.
- Mufflonfår och den syntetiska arten `Hare` togs bort eftersom de inte fanns som
  aktuella arter/regler på den ordinarie sidan.
- Mårdhund togs bort som aktiv period eftersom artfiltret inte gav någon aktuell
  jakttidsrad i något av de 21 länen.
- Mink och Vildkanin behölls endast som uttrycklig skyddsjakt, i enlighet med sidan.
- Tid på dygnet, djurkategorier och smyg-/vaktjakt har flyttats från enbart fri
  text till strukturerade fält där källan medger det.

## Regler som kräver aktuell lokal kontroll

- **Björn:** perioden är en licensjaktsram. Tilldelning och beslut kan begränsa
  jakten och måste kontrolleras före jakt.
- **Älg:** Jägareförbundet varnar uttryckligen för lokala variationer.
  Länsstyrelsens årliga beslut är avgörande. Den nationella ramen och kända
  begränsade områden lagras, men presenteras med kontrollvarning.
- **Kronhjort i Skånes kronhjortsområden:** Länsstyrelsen beslutar en eller flera
  perioder inom den lagrade ramen 8 oktober–31 januari.
