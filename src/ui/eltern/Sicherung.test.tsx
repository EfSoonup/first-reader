// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sicherung } from "./Sicherung";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

const datei = (inhalt: string) => new File([inhalt], "sicherung.json", { type: "application/json" });

describe("Sicherung", () => {
  it("lehnt ungültige Dateien ab und ändert nichts", async () => {
    const spy = aktualisiereSpy(datenMit(["m"]));
    render(<Sicherung daten={datenMit(["m"])} aktualisiere={spy.fn} bestaetige={() => true} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei("{kaputt"));
    expect(await screen.findByRole("alert")).toHaveTextContent("keine gültige JSON-Datei");
    expect(spy.fn).not.toHaveBeenCalled();
  });

  it("ersetzt die Daten nach Bestätigung", async () => {
    const neu = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(datenMit([]));
    const bestaetige = vi.fn(() => true);
    render(<Sicherung daten={datenMit([])} aktualisiere={spy.fn} bestaetige={bestaetige} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei(JSON.stringify(neu)));
    expect(await screen.findByText(/importiert/)).toBeInTheDocument();
    expect(bestaetige).toHaveBeenCalled();
    expect(spy.daten).toEqual(neu);
  });

  it("bricht ab, wenn nicht bestätigt wird", async () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Sicherung daten={datenMit([])} aktualisiere={spy.fn} bestaetige={() => false} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei(JSON.stringify(datenMit(["m"]))));
    await screen.findByText(/abgebrochen/);
    expect(spy.fn).not.toHaveBeenCalled();
  });
});
