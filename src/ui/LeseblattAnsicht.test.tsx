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
});
