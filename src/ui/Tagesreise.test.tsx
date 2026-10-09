// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tagesreise } from "./Tagesreise";
import { aktualisiereSpy, datenMit } from "./test-hilfen";

// Feste Test-Inhalte statt der mitgelieferten Wortliste, damit Zahlen und 🔒-Zustand stabil bleiben.
vi.mock("../content", async () => ({ inhalte: (await import("../generator/test-inhalte")).testInhalte }));

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
    await userEvent.click(screen.getByRole("button", { name: /Für heute aufhören/ }));
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

  it("▶ Weiter hebt die Pause wirklich auf", async () => {
    const start = datenMit(["m", "i", "a"]);
    render(<Tagesreise daten={start} aktualisiere={aktualisiereSpy(start).fn} onEnde={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(screen.getByText(/die Zeit läuft gerade nicht/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Weiter/ }));
    expect(screen.getByRole("button", { name: /Pause/ })).toBeInTheDocument();
    expect(screen.queryByText(/die Zeit läuft gerade nicht/)).toBeNull();
  });

  it("vorzeitiges Beenden behält Bewertungen, Sterne und Wiederholungen aus dem Aufwärmen", async () => {
    const start = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(start);
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
    const erstes = document.querySelector(".lesetext")!.textContent;
    await userEvent.keyboard("{Backspace}");
    for (let i = 0; i < 4; i++) await userEvent.keyboard(" ");
    await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
    await userEvent.click(screen.getByRole("button", { name: /Für heute aufhören/ }));
    expect(spy.daten.sitzungen[0]).toMatchObject({ richtig: 4, fehlversuche: 1 });
    expect(spy.daten.spielstand.sterne).toBe(4);
    expect(spy.daten.wiederholungen.map((w) => w.text)).toEqual([erstes]);
  });

  describe("Sitzung beenden fragt nach", () => {
    it("Weiterlesen schließt die Frage und bleibt auf dem Blatt", async () => {
      const start = datenMit(["m", "i", "a"]);
      const onEnde = vi.fn();
      render(<Tagesreise daten={start} aktualisiere={aktualisiereSpy(start).fn} onEnde={onEnde} />);
      for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
      await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Blatt zu Ende/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: /Weiterlesen/ }));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByText("Leseblatt 1")).toBeInTheDocument();
      expect(onEnde).not.toHaveBeenCalled();
    });

    it("solange die Frage offen ist, bewertet die Leertaste im Aufwärmen nichts", async () => {
      const start = datenMit(["m", "i", "a"]);
      const spy = aktualisiereSpy(start);
      render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
      await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
      await userEvent.keyboard("{Backspace}");
      expect(spy.daten.spielstand.sterne).toBe(0);
      expect(spy.daten.wiederholungen).toEqual([]);
    });

    it("Ziel erreicht: Aufhören führt zum Abschluss mit Sticker", async () => {
      const basis = datenMit(["m", "i", "a"]);
      const iso = new Date().toISOString();
      const start = {
        ...basis,
        sitzungen: [{ id: "frueher", start: iso, ende: iso, aktiveSekunden: 600, richtig: 50, fehlversuche: 0, gezeigteElemente: [] }],
      };
      const spy = aktualisiereSpy(start);
      const onEnde = vi.fn();
      render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={onEnde} />);
      await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
      expect(screen.getByText(/Smiley für heute/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: /Für heute aufhören/ }));
      expect(onEnde).not.toHaveBeenCalled();
      expect(screen.getByText("Geschafft! 🎉")).toBeInTheDocument();
      expect(spy.daten.spielstand.stickerAlben).toEqual([["🐶"]]);
    });
  });

  it("Buchstaben auf dem Blatt zählen nicht zur Lesemenge", async () => {
    const start = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(start);
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
    for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
    const zeilen = [...document.querySelectorAll(".zeile")];
    const ohneBuchstaben = zeilen.filter((z) => !z.classList.contains("buchstaben"))
      .reduce((n, z) => n + z.querySelectorAll(":scope > .element").length, 0);
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(spy.daten.sitzungen[0].richtig).toBe(8 + ohneBuchstaben);
  });

  describe("Zeiterfassung", () => {
    afterEach(() => {
      vi.useRealTimers();
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    });

    const ziel600 = () => {
      const basis = datenMit(["m", "i", "a"]);
      const iso = new Date().toISOString();
      return {
        ...basis,
        sitzungen: [{ id: "frueher", start: iso, ende: iso, aktiveSekunden: 600, richtig: 50, fehlversuche: 0, gezeigteElemente: [] }],
      };
    };

    it("auf dem Abschluss-Bildschirm läuft keine Lesezeit mehr", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const start = ziel600();
      const spy = aktualisiereSpy(start);
      render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
      for (let i = 0; i < 8; i++) await user.keyboard(" ");
      await user.click(screen.getByRole("button", { name: /Blatt fertig/ }));
      expect(screen.getByText("Geschafft! 🎉")).toBeInTheDocument();
      const vorher = spy.daten.sitzungen[1].aktiveSekunden;
      for (let i = 0; i < 5; i++) {
        await act(async () => { vi.advanceTimersByTime(10_000); });
        await user.click(document.body);
      }
      expect(spy.daten.sitzungen[1].aktiveSekunden).toBe(vorher);
    });

    it("während der Rückfrage läuft keine Lesezeit, auch nicht beim Tippen im Pop-up", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const start = datenMit(["m", "i", "a"]);
      const spy = aktualisiereSpy(start);
      render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
      await user.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
      const vorher = spy.daten.sitzungen[0].aktiveSekunden;
      for (let i = 0; i < 5; i++) {
        await act(async () => { vi.advanceTimersByTime(10_000); });
        await user.click(screen.getByRole("dialog"));
      }
      expect(spy.daten.sitzungen[0].aktiveSekunden).toBe(vorher);
      await user.click(screen.getByRole("button", { name: /Weiterlesen/ }));
      await act(async () => { vi.advanceTimersByTime(5_000); });
      expect(spy.daten.sitzungen[0].aktiveSekunden).toBeGreaterThan(vorher);
    });

    it("wird die App verdeckt, pausiert die Zeit sofort", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const start = datenMit(["m", "i", "a"]);
      const spy = aktualisiereSpy(start);
      render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
      await act(async () => { vi.advanceTimersByTime(5_000); });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      act(() => { document.dispatchEvent(new Event("visibilitychange")); });
      const vorher = spy.daten.sitzungen[0].aktiveSekunden;
      await act(async () => { vi.advanceTimersByTime(30_000); });
      expect(spy.daten.sitzungen[0].aktiveSekunden).toBe(vorher);
      expect(screen.getByText(/die Zeit läuft gerade nicht/)).toBeInTheDocument();
    });
  });

  it("zeigt den Tagesfortschritt als Balken statt Minuten", () => {
    const start = datenMit(["m", "i", "a"]);
    render(<Tagesreise daten={start} aktualisiere={aktualisiereSpy(start).fn} onEnde={() => {}} />);
    expect(screen.getByRole("progressbar", { name: "Tagesziel" })).toBeInTheDocument();
    expect(screen.queryByText(/\/ 10 min/)).toBeNull();
  });
});
