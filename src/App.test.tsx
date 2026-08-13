// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

  it('har integrerat soltider på jakttidssidan', async () => {
    renderAt('/jakttider');
    await screen.findByRole('heading', { name: 'Jakttider' });
    expect(screen.queryByRole('link', { name: 'Soltider' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sol- och måntider för vald dag')).toBeInTheDocument();
  });

  it('omdirigerar den gamla soltidsrouten till jakttider', async () => {
    renderAt('/soltider');
    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/huntingseasons/jakttider'));
  });

  it('omdirigerar en okänd route till den lazy-laddade jakttidssidan', async () => {
    renderAt('/saknas');

    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/huntingseasons/jakttider'));
  });
});
