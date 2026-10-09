import { configDefaults, defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

// Strenge Content-Security-Policy, nur im Build: Vites Dev-Server braucht Inline-Skripte.
// Kommt später ein Backend (z. B. Supabase) dazu, dessen Origin bei connect-src ergänzen.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function csp(): Plugin {
  return {
    name: "csp-meta",
    apply: "build",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" },
    ],
  };
}

export default defineConfig({
  // Relative Pfade: läuft unter jedem Unterpfad (GitHub Pages: /first-reader/) und bei jedem Hoster
  base: "./",
  plugins: [react(), csp()],
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    // Arbeitskopien paralleler Claude-Sessions nicht mittesten
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
