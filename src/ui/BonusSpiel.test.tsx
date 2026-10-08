// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BonusSpiel } from "./BonusSpiel";

const runden = [
  { wort: "Oma", optionen: [{ emoji: "👵", richtig: true }, { emoji: "🚂", richtig: false }, { emoji: "🍎", richtig: false }] },
  { wort: "Lama", optionen: [{ emoji: "🌊", richtig: false }, { emoji: "🦙", richtig: true }, { emoji: "🍎", richtig: false }] },
];

describe("Bonusspiel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("falsche Wahl erlaubt neuen Versuch, richtige führt weiter", () => {
    const onFertig = vi.fn();
    render(<BonusSpiel runden={runden} onFertig={onFertig} />);
    expect(screen.getByText("Oma")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 🚂" }));
    expect(screen.getByText("Oma")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 👵" }));
    act(() => { vi.advanceTimersByTime(800); });
    expect(screen.getByText("Lama")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 🦙" }));
    act(() => { vi.advanceTimersByTime(800); });
    expect(onFertig).toHaveBeenCalledWith(2);
  });
});
