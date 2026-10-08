// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Protokoll } from "./Protokoll";
import { datenMit } from "../test-hilfen";

describe("Protokoll", () => {
  it("zeigt eine Zeile pro Tag mit Minuten, Elementen, Fehlversuchen und Ziel", () => {
    const iso = new Date(2026, 9, 7, 10).toISOString();
    const daten = {
      ...datenMit(["m"]),
      sitzungen: [{ id: "a", start: iso, ende: iso, aktiveSekunden: 660, richtig: 87, fehlversuche: 3, gezeigteElemente: [] }],
    };
    render(<Protokoll daten={daten} />);
    const zeile = screen.getByRole("row", { name: /07\.10\.2026/ });
    expect(within(zeile).getByText("11")).toBeInTheDocument();
    expect(within(zeile).getByText("87")).toBeInTheDocument();
    expect(within(zeile).getByText("3")).toBeInTheDocument();
    expect(within(zeile).getByText("✅")).toBeInTheDocument();
  });

  it("zeigt einen Hinweis ohne Sitzungen", () => {
    render(<Protokoll daten={datenMit([])} />);
    expect(screen.getByText(/Noch keine Lesezeiten/)).toBeInTheDocument();
  });
});
