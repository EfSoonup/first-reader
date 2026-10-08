// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Einstellungen } from "./Einstellungen";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

describe("Einstellungen", () => {
  it("ändert das Tagesziel", () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Einstellungen daten={datenMit([])} aktualisiere={spy.fn} />);
    fireEvent.change(screen.getByLabelText(/Tagesziel/), { target: { value: "15" } });
    expect(spy.daten.einstellungen.tageszielMinuten).toBe(15);
  });

  it("ignoriert ungültige Werte", () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Einstellungen daten={datenMit([])} aktualisiere={spy.fn} />);
    fireEvent.change(screen.getByLabelText(/Tagesziel/), { target: { value: "0" } });
    expect(spy.daten.einstellungen.tageszielMinuten).toBe(10);
  });
});
