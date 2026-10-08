// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Aufwaermen } from "./Aufwaermen";

const elemente = [{ typ: "silbe" as const, text: "mi" }, { typ: "wort" as const, text: "Mama" }];

describe("Aufwärmen", () => {
  it("Leertaste = richtig, Backspace = nochmal (einmal ans Ende)", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={elemente} onFertig={onFertig} />);
    expect(screen.getByText("mi")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(screen.getByText("Mama")).toBeInTheDocument();
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByText("Mama")).toBeInTheDocument(); // kommt zurück
    await userEvent.keyboard("{Enter}");
    expect(onFertig).toHaveBeenCalledWith({
      ergebnisse: [
        { text: "mi", typ: "silbe", richtig: true },
        { text: "Mama", typ: "wort", richtig: false },
      ],
      sterne: 2,
    });
  });

  it("zweites Nochmal schiebt nicht erneut ans Ende", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={[elemente[0]]} onFertig={onFertig} />);
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("{Backspace}");
    expect(onFertig).toHaveBeenCalledWith({ ergebnisse: [{ text: "mi", typ: "silbe", richtig: false }], sterne: 0 });
  });

  it("Knöpfe funktionieren wie Tasten", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={[elemente[0]]} onFertig={onFertig} />);
    await userEvent.click(screen.getByRole("button", { name: /Richtig/ }));
    expect(onFertig).toHaveBeenCalledTimes(1);
  });

  it("gedrückt gehaltene Taste bewertet nur ein Element", async () => {
    const onFertig = vi.fn();
    const drei = [...elemente, { typ: "silbe" as const, text: "am" }];
    render(<Aufwaermen elemente={drei} onFertig={onFertig} />);
    await userEvent.keyboard("[Space>6/]");
    expect(screen.getByText("Noch 2")).toBeInTheDocument();
  });
});
