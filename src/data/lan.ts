export const ALL_COUNTIES = 'Alla län' as const;

export interface Lan {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
  aliases: readonly string[];
}

export const LAN_DATA: readonly Lan[] = [
  { id: 'Blekinge', displayName: 'Blekinge', lat: 56.1677, lon: 14.8563, aliases: ['Blekinge län'] },
  { id: 'Dalarna', displayName: 'Dalarna', lat: 61.0914, lon: 14.6664, aliases: ['Dalarnas län'] },
  { id: 'Gotland', displayName: 'Gotland', lat: 57.4684, lon: 18.4867, aliases: ['Gotlands län'] },
  { id: 'Gävleborg', displayName: 'Gävleborg', lat: 60.6749, lon: 16.1463, aliases: ['Gävleborgs län'] },
  { id: 'Halland', displayName: 'Halland', lat: 56.6745, lon: 12.8578, aliases: ['Hallands län'] },
  { id: 'Jämtland', displayName: 'Jämtland', lat: 63.1792, lon: 14.6357, aliases: ['Jämtlands län'] },
  { id: 'Jönköping', displayName: 'Jönköping', lat: 57.7826, lon: 14.1618, aliases: ['Jönköpings län'] },
  { id: 'Kalmar', displayName: 'Kalmar', lat: 56.6616, lon: 16.3616, aliases: ['Kalmar län'] },
  { id: 'Kronoberg', displayName: 'Kronoberg', lat: 56.8809, lon: 14.8059, aliases: ['Kronobergs län'] },
  { id: 'Norrbotten', displayName: 'Norrbotten', lat: 67.8558, lon: 20.2253, aliases: ['Norrbottens län'] },
  { id: 'Skåne', displayName: 'Skåne', lat: 55.9903, lon: 13.5958, aliases: ['Skåne län'] },
  { id: 'Stockholm', displayName: 'Stockholm', lat: 59.3293, lon: 18.0686, aliases: ['Stockholms län'] },
  { id: 'Södermanland', displayName: 'Södermanland', lat: 59, lon: 16.5, aliases: ['Södermanlands län'] },
  { id: 'Uppsala', displayName: 'Uppsala', lat: 59.8586, lon: 17.6389, aliases: ['Uppsala län'] },
  { id: 'Värmland', displayName: 'Värmland', lat: 59.3793, lon: 13.5036, aliases: ['Värmlands län'] },
  { id: 'Västerbotten', displayName: 'Västerbotten', lat: 64.7507, lon: 20.9528, aliases: ['Västerbottens län'] },
  { id: 'Västernorrland', displayName: 'Västernorrland', lat: 62.3908, lon: 17.3069, aliases: ['Västernorrlands län'] },
  { id: 'Västmanland', displayName: 'Västmanland', lat: 59.6162, lon: 16.5528, aliases: ['Västmanlands län'] },
  { id: 'Västra Götaland', displayName: 'Västra Götaland', lat: 58.2528, lon: 13.0596, aliases: ['Västra Götalands län', 'Västra götaland', 'Västragötaland'] },
  { id: 'Örebro', displayName: 'Örebro', lat: 59.2741, lon: 15.2066, aliases: ['Örebro län'] },
  { id: 'Östergötland', displayName: 'Östergötland', lat: 58.4108, lon: 15.6214, aliases: ['Östergötlands län'] },
];

const normalizeKey = (name: string) => name.trim().toLocaleLowerCase('sv-SE');

const LAN_BY_NAME = new Map<string, Lan>();
for (const lan of LAN_DATA) {
  for (const name of [lan.id, lan.displayName, ...lan.aliases]) {
    LAN_BY_NAME.set(normalizeKey(name), lan);
  }
}

export function normalizeLanName(name: string): string | null {
  if (normalizeKey(name) === normalizeKey(ALL_COUNTIES)) return ALL_COUNTIES;
  return LAN_BY_NAME.get(normalizeKey(name))?.id ?? null;
}

export function getLanCoordinates(name: string): Pick<Lan, 'lat' | 'lon'> | null {
  const canonicalName = normalizeLanName(name);
  if (!canonicalName || canonicalName === ALL_COUNTIES) return null;
  const lan = LAN_BY_NAME.get(normalizeKey(canonicalName));
  return lan ? { lat: lan.lat, lon: lan.lon } : null;
}

export function findNearestLan(latitude: number, longitude: number): string {
  let nearest = LAN_DATA[0];
  let shortestDistance = Infinity;

  for (const lan of LAN_DATA) {
    const distance = (latitude - lan.lat) ** 2 + (longitude - lan.lon) ** 2;
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = lan;
    }
  }

  return nearest.id;
}
