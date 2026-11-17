import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no viewport scrolling; browser QA verifies the real behavior.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
afterEach(() => cleanup());
