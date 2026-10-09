// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LeseblattAnsicht } from "./LeseblattAnsicht";

describe("Leseblatt", () => {
  it("zeigt Zeilen, Bildsätze mit Bild und meldet 'Blatt fertig'", async () => {
    const onFertig = vi.fn();
    const blatt = {
      zeilen: [
        { art: "silben" as const, stern: false, elemente: [{ typ: "silbe" as const, text: "mi" }, { typ: "silbe" as const, text: "ma" }] },
        { art: "saetze" as const, stern: true, elemente: [{
          typ: "satz" as const, text: "Mia im 🚂",
          teile: [{ art: "text" as const, text: "Mia" }, { art: "text" as const, text: "im" }, { art: "bild" as const, emoji: "🚂", wort: "Zug" }],
        }] },
      ],
    };
    render(<LeseblattAnsicht blatt={blatt} nummer={1} onFertig={onFertig} />);
    expect(screen.getByText("Leseblatt 1")).toBeInTheDocument();
    expect(screen.getByText("ma")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Zug" })).toHaveTextContent("🚂");
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(onFertig).toHaveBeenCalled();
  });

  it("eine Zeile antippen markiert sie als gelesen, nochmal tippen hebt das auf", async () => {
    const blatt = { zeilen: [{ art: "silben" as const, stern: false, elemente: [{ typ: "silbe" as const, text: "mi" }] }] };
    render(<LeseblattAnsicht blatt={blatt} nummer={1} onFertig={() => {}} />);
    const zeile = screen.getByRole("button", { name: /mi/ });
    expect(zeile).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByText("mi"));
    expect(zeile).toHaveAttribute("aria-pressed", "true");
    expect(zeile).toHaveClass("gelesen");
    await userEvent.click(zeile);
    expect(zeile).toHaveAttribute("aria-pressed", "false");
  });

  it("teilt Zeilen, die nicht in die Breite passen, gleichmäßig auf", () => {
    // Jede Silbe 100 px breit, 350 px Zeile minus 100 px Stern-Spalte: zwei Silben pro Zeile.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(350);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width: 100 } as DOMRect);
    const silben = ["ma", "mi", "mo", "la", "li", "lo", "sa", "so"].map((text) => ({ typ: "silbe" as const, text }));
    const blatt = { zeilen: [{ art: "silben" as const, stern: false, elemente: silben }] };
    render(<LeseblattAnsicht blatt={blatt} nummer={1} onFertig={() => {}} />);
    expect(screen.getAllByRole("button", { pressed: false }).map((z) => z.textContent))
      .toEqual(["mami", "mola", "lilo", "saso"]);
    vi.restoreAllMocks();
  });
});
