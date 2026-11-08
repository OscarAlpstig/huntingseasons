import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteMapPackage, downloadMapPackage, listMapPackages, parseMapPackage, requiredTileKeys, saveMapPackage } from './mapPackages';

const bounds: [number, number, number, number] = [16, 58, 16.01, 58.01];
function fixture() {
  const keys = requiredTileKeys(bounds, 10, 11);
  return { version: 1, id: 'test-area', name: 'Testområde', source: 'OpenFreeMap', bounds, minZoom: 10, maxZoom: 11, tiles: Object.fromEntries(keys.map((key) => [key, 'CAA='])) };
}
beforeEach(() => { vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('navigator', {}); });
afterEach(() => vi.unstubAllGlobals());

describe('offlinekartpaket', () => {
  it('sparar bara fullständiga paket och kan läsa och ta bort området', async () => {
    const pack = parseMapPackage(JSON.stringify(fixture()));
    await saveMapPackage(pack);
    expect((await listMapPackages())[0].tiles).toEqual(pack.tiles);
    await deleteMapPackage(pack.id);
    expect(await listMapPackages()).toEqual([]);
  });

  it('avvisar saknade tiles, stora områden, fel källa och ogiltiga koordinater', () => {
    const incomplete = fixture(); delete incomplete.tiles[Object.keys(incomplete.tiles)[0]];
    expect(() => parseMapPackage(JSON.stringify(incomplete))).toThrow('ofullständigt');
    expect(() => requiredTileKeys([-100, -60, 100, 60], 10, 16)).toThrow('för stort');
    expect(() => parseMapPackage(JSON.stringify({ ...fixture(), source: 'OpenStreetMap' }))).toThrow('format');
    expect(() => parseMapPackage(JSON.stringify({ ...fixture(), bounds: [20, 60, 10, 50] }))).toThrow('gränser');
  });

  it('lämnar inte ett färdigt område vid otillräckligt utrymme', async () => {
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 10, usage: 9 }) } });
    await expect(saveMapPackage(parseMapPackage(JSON.stringify(fixture())))).rejects.toThrow('lagringsutrymme');
    expect(await listMapPackages()).toEqual([]);
  });

  it('tillåter inte förhämtning från publika tileservrar', async () => {
    vi.stubGlobal('window', { location: { href: 'https://example.org/huntingseasons/', origin: 'https://example.org' } });
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    for (const host of ['https://tile.openstreetmap.org/1/1/1.png', 'https://a.tile.opentopomap.org/1/1/1.png']) {
      await expect(downloadMapPackage(host, new AbortController().signal, vi.fn())).rejects.toThrow('förberedda');
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
});
