export const ALL_COUNTIES = 'ALL' as const;

export interface County {
  id: string;
  name: string;
  officialName: string;
  lat: number;
  lon: number;
  aliases: readonly string[];
}

export const COUNTIES: readonly County[] = [
  { id: 'SE-K', name: 'Blekinge', officialName: 'Blekinge län', lat: 56.1677, lon: 14.8563, aliases: [] },
  { id: 'SE-W', name: 'Dalarna', officialName: 'Dalarnas län', lat: 61.0914, lon: 14.6664, aliases: [] },
  { id: 'SE-I', name: 'Gotland', officialName: 'Gotlands län', lat: 57.4684, lon: 18.4867, aliases: [] },
  { id: 'SE-X', name: 'Gävleborg', officialName: 'Gävleborgs län', lat: 60.6749, lon: 16.1463, aliases: [] },
  { id: 'SE-N', name: 'Halland', officialName: 'Hallands län', lat: 56.6745, lon: 12.8578, aliases: [] },
  { id: 'SE-Z', name: 'Jämtland', officialName: 'Jämtlands län', lat: 63.1792, lon: 14.6357, aliases: [] },
  { id: 'SE-F', name: 'Jönköping', officialName: 'Jönköpings län', lat: 57.7826, lon: 14.1618, aliases: [] },
  { id: 'SE-H', name: 'Kalmar', officialName: 'Kalmar län', lat: 56.6616, lon: 16.3616, aliases: [] },
  { id: 'SE-G', name: 'Kronoberg', officialName: 'Kronobergs län', lat: 56.8809, lon: 14.8059, aliases: [] },
  { id: 'SE-BD', name: 'Norrbotten', officialName: 'Norrbottens län', lat: 67.8558, lon: 20.2253, aliases: [] },
  { id: 'SE-M', name: 'Skåne', officialName: 'Skåne län', lat: 55.9903, lon: 13.5958, aliases: [] },
  { id: 'SE-AB', name: 'Stockholm', officialName: 'Stockholms län', lat: 59.3293, lon: 18.0686, aliases: [] },
  { id: 'SE-D', name: 'Södermanland', officialName: 'Södermanlands län', lat: 59, lon: 16.5, aliases: [] },
  { id: 'SE-C', name: 'Uppsala', officialName: 'Uppsala län', lat: 59.8586, lon: 17.6389, aliases: [] },
  { id: 'SE-S', name: 'Värmland', officialName: 'Värmlands län', lat: 59.3793, lon: 13.5036, aliases: [] },
  { id: 'SE-AC', name: 'Västerbotten', officialName: 'Västerbottens län', lat: 64.7507, lon: 20.9528, aliases: [] },
  { id: 'SE-Y', name: 'Västernorrland', officialName: 'Västernorrlands län', lat: 62.3908, lon: 17.3069, aliases: [] },
  { id: 'SE-U', name: 'Västmanland', officialName: 'Västmanlands län', lat: 59.6162, lon: 16.5528, aliases: [] },
  { id: 'SE-O', name: 'Västra Götaland', officialName: 'Västra Götalands län', lat: 58.2528, lon: 13.0596, aliases: ['Västra götaland', 'Västragötaland'] },
  { id: 'SE-T', name: 'Örebro', officialName: 'Örebro län', lat: 59.2741, lon: 15.2066, aliases: [] },
  { id: 'SE-E', name: 'Östergötland', officialName: 'Östergötlands län', lat: 58.4108, lon: 15.6214, aliases: [] },
];

/** Bakåtkompatibelt exportnamn för komponenter som ännu använder LAN_DATA. */
export const LAN_DATA = COUNTIES;

const normalizeKey = (name: string) => name.trim().toLocaleLowerCase('sv-SE');
const COUNTY_BY_NAME = new Map<string, County>();
for (const county of COUNTIES) {
  for (const name of [county.id, county.name, county.officialName, ...county.aliases]) {
    COUNTY_BY_NAME.set(normalizeKey(name), county);
  }
}

export function normalizeLanName(name: string): string | null {
  const key = normalizeKey(name);
  if (key === normalizeKey(ALL_COUNTIES) || key === normalizeKey('Alla län')) return ALL_COUNTIES;
  return COUNTY_BY_NAME.get(key)?.id ?? null;
}

export function getCounty(id: string): County | null {
  const normalized = normalizeLanName(id);
  return normalized && normalized !== ALL_COUNTIES ? COUNTY_BY_NAME.get(normalizeKey(normalized)) ?? null : null;
}

export function getCountyDisplayName(id: string): string {
  return id === ALL_COUNTIES ? 'Alla län' : getCounty(id)?.officialName ?? id;
}

export function getLanCoordinates(name: string): Pick<County, 'lat' | 'lon'> | null {
  const county = getCounty(name);
  return county ? { lat: county.lat, lon: county.lon } : null;
}

export function findNearestLan(latitude: number, longitude: number): string {
  let nearest = COUNTIES[0];
  let shortestDistance = Infinity;
  for (const county of COUNTIES) {
    const distance = (latitude - county.lat) ** 2 + (longitude - county.lon) ** 2;
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = county;
    }
  }
  return nearest.id;
}
