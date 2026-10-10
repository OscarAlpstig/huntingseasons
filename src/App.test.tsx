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
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/huntingseasons/');
  });

  it('har integrerat soltider på jakttidssidan', async () => {
    renderAt('/');
    await screen.findByRole('heading', { name: 'Jakttider' });
    expect(screen.queryByRole('link', { name: 'Soltider' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sol- och måntider för vald dag')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vind & vittring' })).not.toBeInTheDocument();
  });

  it('visar vind och vittring på en egen planeringsroute', async () => {
    renderAt('/jaktplanering');

    expect(await screen.findByRole('heading', { name: 'Vind & vittring' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vind & vittring' })).toHaveClass('active');
    expect(screen.queryByRole('heading', { name: 'Jakttider' })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/huntingseasons/jaktplanering');
  });

  it('omdirigerar den gamla soltidsrouten till basrouten', async () => {
    renderAt('/soltider');
    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/huntingseasons'));
  });

  it('omdirigerar en okänd route till den lazy-laddade jakttidssidan', async () => {
    renderAt('/saknas');

    expect(await screen.findByRole('heading', { name: 'Jakttider' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/huntingseasons'));
  });
});
