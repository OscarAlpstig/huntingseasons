// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import PageErrorBoundary from './PageErrorBoundary';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('behåller navigation och hjälp om en sida kraschar', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  function FailedPage(): never { throw new TypeError('Failed to fetch dynamically imported module'); }
  render(<MemoryRouter><nav aria-label="Huvudnavigation">Navigation</nav><PageErrorBoundary><FailedPage /></PageErrorBoundary><footer>Offlineguide</footer></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Sidan kunde inte laddas' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Huvudnavigation' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hämta senaste versionen' })).toBeEnabled();
  expect(screen.getByText('Offlineguide')).toBeInTheDocument();
});
