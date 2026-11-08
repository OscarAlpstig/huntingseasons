import { useEffect, useRef, useState } from 'react';
import { deleteMapPackage, downloadMapPackage, listMapPackages, MAX_PACKAGE_FILE_BYTES, parseMapPackage, saveMapPackage, type MapPackage, type PackageListing } from './mapPackages';

const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} MB`;

export default function OfflineMaps({ onSelect, onPreview, selectedId }: { onSelect: (pack: MapPackage | null) => void; onPreview?: (bounds: MapPackage['bounds']) => void; selectedId?: string }) {
  const [packages, setPackages] = useState<MapPackage[]>([]);
  const [catalog, setCatalog] = useState<PackageListing[]>([]);
  const [selected, setSelected] = useState('');
  const [maxZoom, setMaxZoom] = useState(14);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const refresh = () => listMapPackages().then((packs) => { if (mounted.current) setPackages(packs); });

  useEffect(() => {
    mounted.current = true;
    void refresh().catch(() => setMessage('Sparade kartområden kunde inte läsas. Lagringen kan vara begränsad.'));
    const abort = new AbortController();
    void fetch(`${import.meta.env.BASE_URL}offline-maps/catalog.json`, { signal: abort.signal }).then((response) => response.ok ? response.json() : []).then((list: PackageListing[]) => {
      if (Array.isArray(list) && mounted.current) { setCatalog(list); setSelected(list[0]?.url ?? ''); }
    }).catch(() => undefined);
    return () => { mounted.current = false; abort.abort(); controller.current?.abort(); };
  }, []);

  const persist = async (pack: MapPackage, signal: AbortSignal) => {
    if (signal.aborted || !mounted.current) return;
    setSaving(true);
    await saveMapPackage(pack);
    if (!mounted.current) return;
    await refresh(); onSelect(pack);
    setMessage(`${pack.name} är sparad offline. Kartan kan ha en enklare stil än Terräng.`);
    void navigator.storage?.persist?.().catch(() => false);
  };

  const run = async (action: (signal: AbortSignal) => Promise<MapPackage>, limitZoom?: number) => {
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setSaving(false); setProgress(0); setMessage('');
    try {
      const pack = await action(abort.signal);
      const zoom = Math.max(pack.minZoom, Math.min(pack.maxZoom, limitZoom ?? pack.maxZoom));
      const tiles = Object.fromEntries(Object.entries(pack.tiles).filter(([key]) => Number(key.split('/')[0]) <= zoom));
      await persist({ ...pack, maxZoom: zoom, tiles, bytes: Object.values(tiles).reduce((sum, tile) => sum + tile.byteLength, 0) }, abort.signal);
    }
    catch { if (mounted.current) setMessage(abort.signal.aborted ? 'Nedladdningen avbröts. Inget nytt område sparades.' : 'Området kunde inte sparas. Kontrollera internet, filformat och ledigt utrymme.'); }
    finally { if (mounted.current) { setBusy(false); setSaving(false); } }
  };

  const listing = catalog.find((item) => item.url === selected);
  return <details className="offline-maps">
    <summary>Spara karta offline</summary>
    <p>Välj ett förberett område eller importera ett eget .hsmap-paket. Endast dessa kartor sparas; Terräng och Standardkarta kräver internet.</p>
    {catalog.length > 0 && <>
      <label>Område<select aria-label="Område att spara" disabled={busy} value={selected} onChange={(event) => setSelected(event.target.value)}>
        {catalog.map((item) => <option key={item.url} value={item.url}>{item.name}</option>)}
      </select></label>
      {listing && <>
        <p>Cirka {sizeLabel(listing.bytes)} att hämta. Avgränsat område, inte hela Sverige.</p>
        <label>Detaljnivå att spara<select aria-label="Detaljnivå att spara" value={Math.max(listing.minZoom, Math.min(maxZoom, listing.maxZoom))} disabled={busy} onChange={(event) => setMaxZoom(Number(event.target.value))}>
          {Array.from({ length: listing.maxZoom - listing.minZoom + 1 }, (_, i) => listing.minZoom + i).map((zoom) => <option key={zoom} value={zoom}>Zoom {zoom}{zoom === listing.maxZoom ? ' (mest detaljer)' : ''}</option>)}
        </select></label>
        <button disabled={busy} onClick={() => onPreview?.(listing.bounds)}>Visa området på kartan</button>
      </>}
      <button disabled={busy || !listing} onClick={() => { if (listing) void run((signal) => downloadMapPackage(`${import.meta.env.BASE_URL}offline-maps/${listing.url}`, signal, setProgress), maxZoom); }}>Spara området</button>
    </>}
    <label>Importera eget kartpaket<input type="file" accept=".hsmap,application/json" disabled={busy} onChange={(event) => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      if (file.size > MAX_PACKAGE_FILE_BYTES) { setMessage('Kartpaketet är för stort. Högst 64 MB filstorlek tillåts.'); return; }
      void run(async () => parseMapPackage(await file.text()));
    }} /></label>
    {busy && <div role="status">{saving ? 'Sparar kartområdet…' : `Hämtar och kontrollerar… ${sizeLabel(progress)}`} <button disabled={saving} onClick={() => controller.current?.abort()}>Avbryt</button></div>}
    {message && <p role="status">{message}</p>}
    {packages.length > 0 && <ul>{packages.map((pack) => <li key={pack.id}>
      <strong>{pack.name}</strong> · {sizeLabel(pack.bytes)} · sparad {new Date(pack.savedAt).toLocaleDateString('sv-SE')}
      <div><button disabled={busy} onClick={() => onSelect(pack)} aria-pressed={selectedId === pack.id}>Visa</button>
        <button disabled={busy} onClick={() => { void deleteMapPackage(pack.id).then(() => { if (selectedId === pack.id) onSelect(null); return refresh(); }).catch(() => setMessage('Området kunde inte tas bort. Försök igen.')); }}>Ta bort</button></div>
    </li>)}</ul>}
    <p>Webbläsaren kan rensa kartor vid lagringsbrist. Öppna appen utan internet före turen och kontrollera täckningen.</p>
  </details>;
}
