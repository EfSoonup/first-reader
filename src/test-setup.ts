import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Testing Library räumt nur bei `globals: true` automatisch auf.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
