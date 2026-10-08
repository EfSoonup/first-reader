// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KinderStart } from "./KinderStart";
import { aktualisiereSpy, datenMit } from "./test-hilfen";

const leer = () => ({ onLos: vi.fn(), onAlbum: vi.fn(), onEltern: vi.fn() });

describe("KinderStart", () => {
  it("ohne Buchstaben: Hinweis statt Los-Knopf", () => {
    const d = datenMit([]);
    render(<KinderStart daten={d} aktualisiere={vi.fn()} {...leer()} />);
    expect(screen.getByText("Hier gibt's bald was zu lesen!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Los geht/ })).toBeNull();
  });

  it("mit M, I, A: Los-Knopf startet die Tagesreise", async () => {
    const cb = leer();
    render(<KinderStart daten={datenMit(["m", "i", "a"])} aktualisiere={vi.fn()} {...cb} />);
    await userEvent.click(screen.getByRole("button", { name: /Los geht/ }));
    expect(cb.onLos).toHaveBeenCalled();
  });

  it("zeigt die Buchstaben-Feier und erledigt sie", async () => {
    const d = datenMit(["m", "i", "a"]);
    const mitFeier = { ...d, spielstand: { ...d.spielstand, offeneFeier: ["i"] } };
    const spy = aktualisiereSpy(mitFeier);
    render(<KinderStart daten={mitFeier} aktualisiere={spy.fn} {...leer()} />);
    expect(screen.getByText(/Neu freigeschaltet/)).toBeInTheDocument();
    expect(screen.getByText(/Jetzt kannst du 4 Wörter mit I lesen/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Juhu!" }));
    expect(spy.daten.spielstand.offeneFeier).toEqual([]);
  });
});
