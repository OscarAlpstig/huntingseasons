import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Run in Node, never in the browser: OFM requires an app-specific User-Agent.
// Terms: https://openfreemap.org/quick_start/ (checked 2026-11-09).
// Our limits are below the provider's 3,000 tiles / 50 MB / 4 parallel requests.
const flags = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, args) => {
  if (arg.startsWith('--')) pairs.push([arg.slice(2), args[index + 1]]);
  return pairs;
}, []));
const lat = Number(flags.lat), lon = Number(flags.lon), radius = Number(flags.radius ?? 1);
const maxZoom = Number(flags.zoom ?? 14), minZoom = 10;
if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radius) || Math.abs(lat) > 80 || Math.abs(lon) > 170 || radius < 0.1 || radius > 3 || !Number.isInteger(maxZoom) || maxZoom < 10 || maxZoom > 16) throw new Error('Ange --lat, --lon, --radius (0.1–3 km) och --zoom (10–16).');
const name = flags.name ?? 'Jaktområde';
const id = `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-|-$/g, '')}-${lat.toFixed(3).replace('.', '-')}-${lon.toFixed(3).replace('.', '-')}`;
const output = resolve(flags.output ?? 'public/offline-maps');
const latitudeDelta = radius / 111.32;
const longitudeDelta = radius / (111.32 * Math.cos(lat * Math.PI / 180));
const bounds = [lon - longitudeDelta, lat - latitudeDelta, lon + longitudeDelta, lat + latitudeDelta];
const coordinate = (latitude, longitude, z) => [Math.floor((longitude + 180) / 360 * 2 ** z), Math.floor((1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * 2 ** z)];
const keys = [];
for (let z = minZoom; z <= maxZoom; z++) {
  const [left, top] = coordinate(bounds[3], bounds[0], z);
  const [right, bottom] = coordinate(bounds[1], bounds[2], z);
  for (let x = left; x <= right; x++) for (let y = top; y <= bottom; y++) keys.push(`${z}/${x}/${y}`);
}
if (keys.length > 2000) throw new Error('För många tiles. Minska område eller zoom.');
const headers = { 'User-Agent': 'HuntingSeasons-OfflinePack/1.0 (+https://github.com/OscarAlpstig/huntingseasons)' };
const metadata = await fetch('https://tiles.openfreemap.org/planet/latest', { headers, signal: AbortSignal.timeout(20000) });
if (!metadata.ok) throw new Error('Tile-konfigurationen kunde inte hämtas.');
const tileJson = await metadata.json();
const template = tileJson.tiles?.[0];
if (typeof template !== 'string' || !template.startsWith('https://tiles.openfreemap.org/')) throw new Error('Oväntad kartkälla.');
if (maxZoom > tileJson.maxzoom) throw new Error(`Källan stöder högst zoom ${tileJson.maxzoom}.`);
const tiles = {};
let bytes = 0, next = 0;
const abort = new AbortController();
try {
  await Promise.all(Array.from({ length: 2 }, async () => {
    while (next < keys.length) {
      const key = keys[next++];
      const [z, x, y] = key.split('/');
      const url = template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
      const response = await fetch(url, { headers, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]) });
      if (!response.ok) throw new Error(`Kartruta saknas: ${key}`);
      const data = Buffer.from(await response.arrayBuffer());
      bytes += data.length;
      if (bytes > 45 * 1024 * 1024) throw new Error('Paketet överstiger 45 MB.');
      tiles[key] = data.toString('base64');
    }
  }));
} catch (error) { abort.abort(); throw error; }
const pack = { version: 1, id, name, source: 'OpenFreeMap', createdAt: new Date().toISOString(), bounds, minZoom, maxZoom, tiles };
const json = JSON.stringify(pack);
if (Buffer.byteLength(json) > 64 * 1024 * 1024) throw new Error('Paketfilen är för stor.');
await mkdir(output, { recursive: true });
const filename = `${id}.hsmap`;
await writeFile(join(output, filename), json, { flag: 'wx' });
let catalog = [];
try { catalog = JSON.parse(await readFile(join(output, 'catalog.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
catalog.push({ name, url: filename, bytes: Buffer.byteLength(json), bounds, minZoom, maxZoom });
await writeFile(join(output, 'catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`${keys.length} tiles, ${(bytes / 1024 / 1024).toFixed(2)} MB. Sparat i ${join(output, filename)}`);
