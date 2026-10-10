import { mkdir, copyFile } from 'node:fs/promises';

// GitHub Pages serves files rather than falling back to the SPA entry point.
// Every public client route needs an index file for direct visits and refreshes.
const routes = ['jaktplanering'];
const outputDirectory = new URL('../dist/', import.meta.url);

for (const route of routes) {
  const routeDirectory = new URL(`${route}/`, outputDirectory);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(new URL('index.html', outputDirectory), new URL('index.html', routeDirectory));
}
