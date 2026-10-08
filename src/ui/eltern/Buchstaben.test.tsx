// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Buchstaben } from "./Buchstaben";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

describe("Buchstaben verwalten", () => {
  it("schaltet einen Buchstaben per Klick frei", async () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Buchstaben daten={datenMit([])} aktualisiere={spy.fn} />);
    await userEvent.click(screen.getByRole("button", { name: /^M m/ }));
    expect(spy.daten.freischaltungen.map((f) => f.graphem)).toEqual(["m"]);
  });

  it("zeigt bekannte Buchstaben als gedrückt und warnt bei fehlendem Vokal", () => {
    render(<Buchstaben daten={datenMit(["m"])} aktualisiere={() => {}} />);
    expect(screen.getByRole("button", { name: /^M m/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Vokal");
  });
});
