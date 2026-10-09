import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/andika";
import "@fontsource/andika/700.css";
import "./styles.css";
import App from "./App";
import { bitteUmDauerhaftenSpeicher } from "./storage/storage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Installierbare App (PWA): offline nutzbar, und vom Home-Bildschirm gestartet löscht Safari die Daten nicht nach 7 Tagen.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
void bitteUmDauerhaftenSpeicher(navigator.storage, window.matchMedia("(display-mode: standalone)").matches);
