// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tagesreise } from "./Tagesreise";
import { aktualisiereSpy, datenMit } from "./test-hilfen";

describe("Tagesreise", () => {
  it("Aufwärmen → Leseblatt → weiteres Blatt, solange das Ziel offen ist; Sitzung wird gespeichert", async () => {
    const start = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(start);
    const onEnde = vi.fn();
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={onEnde} />);
    for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
    expect(screen.getByText("Leseblatt 1")).toBeInTheDocument();
    expect(spy.daten.spielstand.sterne).toBe(8);
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(screen.getByText("Leseblatt 2")).toBeInTheDocument();
    expect(spy.daten.spielstand.sterne).toBe(13);
    await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
    expect(onEnde).toHaveBeenCalled();
    expect(spy.daten.sitzungen).toHaveLength(1);
    expect(spy.daten.sitzungen[0].richtig).toBeGreaterThan(8);
  });

  it("Ziel schon erreicht: nach einem Blatt Abschluss mit Sticker und 🔒-Hinweis", async () => {
    const basis = datenMit(["m", "i", "a"]);
    const iso = new Date().toISOString();
    const start = {
      ...basis,
      sitzungen: [{ id: "frueher", start: iso, ende: iso, aktiveSekunden: 600, richtig: 50, fehlversuche: 0, gezeigteElemente: [] }],
    };
    const spy = aktualisiereSpy(start);
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
    for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(screen.getByText("Geschafft! 🎉")).toBeInTheDocument();
    expect(screen.getByText(/Bald freigeschaltet/)).toBeInTheDocument();
    expect(spy.daten.spielstand.stickerAlben).toEqual([["🐶"]]);
  });
});
