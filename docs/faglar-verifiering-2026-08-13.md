# Verifiering av fågeljakttider 2026-08-13

Primär källa: [Svenska Jägareförbundets ordinarie sida Jakttider](https://jagareforbundet.se/jakt/jakttider/).
Varje art nedan kontrollerades med sidans detaljvisning för samtliga 21 län.
Förslag i översynen av jakttider 2026–2032 har inte använts.

## Kontrollerade arter

Björktrast, Bläsand, Bläsgås, Dalripa, Ejder, Fasan, Fiskmås, Fjällripa,
Grågås, Gråtrut, Gräsand, Havstrut, Järpe, Kaja, Kanadagås, Knipa, Korp,
Kricka, Kråka, Morkulla, Nötskrika, Orre, Rapphöna, Ringduva, Råka,
Sjöorre, Skata, Småskrake, Storskarv, Storskrake, Sångsvan, Sädgås,
Tjäder, Trana, Vigg och Vitkindad gås — **21 län kontrollerade per art**.

Ejder, Havstrut och Småskrake behålls i artregistret men saknar en gällande
jaktperiod i datat. Ejderns informationsfält återger källans besked att jakten
tills vidare har upphört. Tomma platshållarrader från källan behandlas inte som
allmän jakt året runt.

## Geografiska specialfall

- Gränsälvsområdet i Norrbottens län modelleras som `delAvLan` när perioden
  endast gäller detta område.
- Perioder ovanför lappmarksgränsen modelleras som `delAvLan`.
- Ripjakten i Älvdalens kommun modelleras som `kommun`, inte som hela Dalarna.
- Identiska länsregler grupperas i en gemensam `lan`-post; rikstäckande regler
  använder `helaLandet`.

När endast län är valt visar UI:t dessa regler som lokala undantag och uppmanar
användaren att kontrollera om den exakta jaktplatsen omfattas.

## Skillnader mot tidigare fågeldata

Den gamla filen innehöll bara Gräsand och två manuellt skrivna perioder. Den
angav felaktigt en skyddsperiod 1 mars–31 april (31 april är inte ett giltigt
datum), fria länsnamn, `nextYear` och regeln "Endast med tillstånd".

Den verifierade filen innehåller nu källans 36 fågelarter och 68 strukturerade
perioder. Gräsandens ordinarie länsvariationer, soltidsbegränsning och
gränsälvsundantag ersätter de två gamla posterna. Datum över årsskifte avgörs
automatiskt utan `nextYear`.
