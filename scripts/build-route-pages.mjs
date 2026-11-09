import { mkdir, copyFile, writeFile } from 'node:fs/promises';

// GitHub Pages serves files rather than falling back to the SPA entry point.
// Every public client route needs an index file for direct visits and refreshes.
const routes = ['jaktplanering', 'installera'];
const outputDirectory = new URL('../dist/', import.meta.url);
// Deliberately outside precache: recovery needs an actual network freshness check.
await writeFile(new URL('version.json', outputDirectory), JSON.stringify({ build: process.env.GITHUB_SHA || new Date().toISOString() }));

for (const route of routes) {
  const routeDirectory = new URL(`${route}/`, outputDirectory);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(new URL('index.html', outputDirectory), new URL('index.html', routeDirectory));
}
