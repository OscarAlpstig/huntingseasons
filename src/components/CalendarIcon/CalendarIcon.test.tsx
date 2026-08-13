// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, it } from 'vitest';
import { CalendarIcon } from './CalendarIcon';

it('renderar ImageGen-kalenderikonen dekorativt', () => {
  render(<CalendarIcon />);
  expect(screen.getByRole('presentation')).toHaveAttribute('src', expect.stringContaining('ui-calendar.png'));
});
