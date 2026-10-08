import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Testing Library räumt nur bei `globals: true` automatisch auf.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});

// Node ≥ 25 bringt ein eigenes, ohne `--localstorage-file` unbrauchbares `localStorage` mit,
// das jsdoms Speicher verdeckt. In jsdom-Tests den echten jsdom-Speicher verwenden.
const jsdomFenster = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomFenster) {
  Object.defineProperty(globalThis, "localStorage", { value: jsdomFenster.localStorage, configurable: true });
}
