// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

function renderAt(path: string) {
  window.history.pushState({}, '', `/huntingseasons${path}`);
  return render(<App />);
}

describe('lazy-loaded routes', () => {
  it('laddar jakttidssidan på direktnavigering', async () => {
    renderAt('/jakttider');

    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/huntingseasons/jakttider');
  });

  it('laddar soltider först när användaren navigerar dit', async () => {
    renderAt('/jakttider');
    await screen.findByRole('heading', { name: 'Jakttider' });

    fireEvent.click(screen.getByRole('link', { name: 'Soltider' }));

    expect(await screen.findByRole('heading', { name: 'Soltider' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/huntingseasons/soltider');
  });

  it('kan öppna den lazy-laddade soltidsrouten direkt', async () => {
    renderAt('/soltider');

    expect(await screen.findByRole('heading', { name: 'Soltider' })).toBeInTheDocument();
  });

  it('omdirigerar en okänd route till den lazy-laddade jakttidssidan', async () => {
    renderAt('/saknas');

    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/huntingseasons/jakttider'));
  });
});
