// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { SolarIcon } from './SolarIcon';

describe('SolarIcon', () => {
  it.each(['dawn', 'sunrise', 'sunset', 'dusk'] as const)('använder rätt PNG för %s', (phase) => {
    const { unmount } = render(<SolarIcon phase={phase} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining(`solar-${phase}.png`));
    unmount();
  });
});
