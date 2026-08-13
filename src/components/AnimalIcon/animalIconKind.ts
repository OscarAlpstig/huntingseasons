export type IconKind = 'duck' | 'goose' | 'swan' | 'bird' | 'grouse' | 'crane' | 'cormorant' | 'deer' | 'moose' | 'fox' | 'bear' | 'beaver' | 'hare' | 'badger' | 'mustelid' | 'boar';

const groups: Record<IconKind, string[]> = {
  duck: ['Bläsand', 'Ejder', 'Gräsand', 'Knipa', 'Kricka', 'Sjöorre', 'Småskrake', 'Storskrake', 'Vigg'],
  goose: ['Bläsgås', 'Grågås', 'Kanadagås', 'Sädgås', 'Vitkindad gås'],
  swan: ['Sångsvan'],
  grouse: ['Dalripa', 'Fasan', 'Fjällripa', 'Järpe', 'Orre', 'Rapphöna', 'Tjäder'],
  crane: ['Trana'],
  cormorant: ['Storskarv'],
  bird: ['Björktrast', 'Fiskmås', 'Gråtrut', 'Havstrut', 'Kaja', 'Korp', 'Kråka', 'Morkulla', 'Nötskrika', 'Ringduva', 'Råka', 'Skata'],
  deer: ['Dovhjort', 'Kronhjort', 'Rådjur'],
  moose: ['Älg'],
  fox: ['Rödräv'],
  bear: ['Björn'],
  beaver: ['Bäver'],
  hare: ['Fälthare', 'Skogshare', 'Vildkanin'],
  badger: ['Grävling'],
  mustelid: ['Iller', 'Mink', 'Mård', 'Vessla'],
  boar: ['Vildsvin'],
};

export function getAnimalIconKind(species: string): IconKind {
  return (Object.entries(groups).find(([, speciesNames]) => speciesNames.includes(species))?.[0] as IconKind | undefined) ?? 'bird';
}
