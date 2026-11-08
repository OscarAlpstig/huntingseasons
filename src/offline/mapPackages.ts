import { storage } from './storage';

export const MAX_PACKAGE_BYTES = 45 * 1024 * 1024;
export const MAX_PACKAGE_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_TILES = 2000;
export const OFFLINE_ATTRIBUTION = '<a href="https://openfreemap.org">OpenFreeMap</a> | © <a href="https://openmaptiles.org">OpenMapTiles</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface MapPackage {
  kind: 'map';
  version: 1;
  id: string;
  name: string;
  source: 'OpenFreeMap';
  bounds: [number, number, number, number]; // west, south, east, north
  minZoom: number;
  maxZoom: number;
  createdAt: string;
  savedAt: number;
  bytes: number;
  tiles: Record<string, Uint8Array>;
}

export interface PackageListing {
  name: string;
  url: string;
  bytes: number;
  bounds: [number, number, number, number];
  minZoom: number;
  maxZoom: number;
}

export function tileCoordinate(lat: number, lon: number, zoom: number): [number, number] {
  const count = 2 ** zoom;
  const radians = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  return [Math.floor((lon + 180) / 360 * count), Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * count)];
}

export function requiredTileKeys(bounds: MapPackage['bounds'], minZoom: number, maxZoom: number) {
  const keys: string[] = [];
  for (let z = minZoom; z <= maxZoom; z += 1) {
    const [left, top] = tileCoordinate(bounds[3], bounds[0], z);
    const [right, bottom] = tileCoordinate(bounds[1], bounds[2], z);
    for (let x = left; x <= right; x += 1) for (let y = top; y <= bottom; y += 1) {
      keys.push(`${z}/${x}/${y}`);
      if (keys.length > MAX_TILES) throw new Error('Kartområdet är för stort. Välj ett mindre område.');
    }
  }
  return keys;
}

export function parseMapPackage(text: string): MapPackage {
  if (text.length > MAX_PACKAGE_FILE_BYTES) throw new Error('Kartpaketet är för stort.');
  const value = JSON.parse(text);
  if (value.version !== 1 || value.source !== 'OpenFreeMap' || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100 || !/^[a-z0-9-]{1,80}$/.test(value.id)) throw new Error('Kartpaketets format stöds inte.');
  const bounds = value.bounds;
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every((v: unknown) => typeof v === 'number' && Number.isFinite(v)) || bounds[0] < -180 || bounds[2] > 180 || bounds[1] < -85 || bounds[3] > 85 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) throw new Error('Kartområdets gränser är ogiltiga.');
  if (!Number.isInteger(value.minZoom) || !Number.isInteger(value.maxZoom) || value.minZoom < 0 || value.maxZoom > 16 || value.minZoom > value.maxZoom || !value.tiles || typeof value.tiles !== 'object') throw new Error('Kartpaketets detaljnivå är ogiltig.');
  const keys = requiredTileKeys(bounds as MapPackage['bounds'], value.minZoom, value.maxZoom);
  if (Object.keys(value.tiles).length !== keys.length) throw new Error('Kartpaketet är ofullständigt.');
  const tiles: Record<string, Uint8Array> = {};
  let bytes = 0;
  for (const key of keys) {
    if (typeof value.tiles[key] !== 'string') throw new Error('Kartpaketet är ofullständigt.');
    const binary = atob(value.tiles[key]);
    bytes += binary.length;
    if (bytes > MAX_PACKAGE_BYTES) throw new Error('Kartpaketet överstiger 45 MB.');
    if (!binary.length) throw new Error('Kartpaketet innehåller en tom kartruta.');
    tiles[key] = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  return { kind: 'map', version: 1, id: value.id, name: value.name, source: 'OpenFreeMap', bounds: bounds as MapPackage['bounds'], minZoom: value.minZoom, maxZoom: value.maxZoom, createdAt: typeof value.createdAt === 'string' ? value.createdAt : '', savedAt: Date.now(), bytes, tiles };
}

export async function saveMapPackage(mapPackage: MapPackage) {
  const estimate = await navigator.storage?.estimate?.();
  if (estimate?.quota && estimate.usage !== undefined && estimate.quota - estimate.usage < mapPackage.bytes * 1.3) throw new Error('Det finns inte tillräckligt med lagringsutrymme. Ta bort ett sparat område.');
  // Single atomic transaction: partial imports/downloads never become saved areas.
  await storage.put(`map:${mapPackage.id}`, mapPackage);
}

export async function listMapPackages() { return (await storage.all<MapPackage | { kind: string }>()).filter((entry): entry is MapPackage => entry.kind === 'map'); }
export async function deleteMapPackage(id: string) { await storage.remove(`map:${id}`); }

export async function downloadMapPackage(url: string, signal: AbortSignal, onProgress: (bytes: number) => void) {
  const target = new URL(url, window.location.href);
  const base = new URL(`${import.meta.env.BASE_URL}offline-maps/`, window.location.origin);
  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) throw new Error('Endast appens förberedda kartpaket kan laddas ned här.');
  const response = await fetch(target, { signal });
  if (!response.ok || !response.body) throw new Error('Kartpaketet kunde inte laddas ned. Försök igen med internet.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_PACKAGE_FILE_BYTES) throw new Error('Kartpaketet är för stort.');
      chunks.push(value);
      onProgress(bytes);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  if (signal.aborted) throw new DOMException('Avbruten', 'AbortError');
  return parseMapPackage(new TextDecoder().decode(all));
}
