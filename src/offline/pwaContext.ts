import { createContext } from 'react';

export const PwaContext = createContext<{
  ready: boolean;
  message: string;
  install: (() => Promise<void>) | null;
}>({ ready: false, message: '', install: null });
