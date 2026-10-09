// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EndeDialog } from "./EndeDialog";

const basis = { zielMinuten: 10, woerter: 23, blattOffen: false, onWeiter: () => {}, onAufhoeren: () => {} };

describe("EndeDialog", () => {
  it("fasst Zeit und Wörter zusammen und nennt die Restzeit bis zum Smiley", () => {
    render(<EndeDialog {...basis} sekunden={6 * 60 + 20} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/6 Minuten gelesen/)).toBeInTheDocument();
    expect(screen.getByText(/23 Wörter/)).toBeInTheDocument();
    expect(screen.getByText(/Noch 4 Minuten lesen/)).toBeInTheDocument();
    expect(screen.getByText(/Willst du wirklich aufhören/)).toBeInTheDocument();
  });

  it("rundet die Restzeit auf und schreibt eine Minute in der Einzahl", () => {
    render(<EndeDialog {...basis} sekunden={9 * 60 + 30} />);
    expect(screen.getByText(/Noch 1 Minute lesen/)).toBeInTheDocument();
  });

  it("unter einer Minute heißt es nicht „0 Minuten gelesen“", () => {
    render(<EndeDialog {...basis} sekunden={20} />);
    expect(screen.queryByText(/0 Minuten gelesen/)).toBeNull();
    expect(screen.getByText(/Noch 10 Minuten lesen/)).toBeInTheDocument();
  });

  it("Ziel erreicht: Smiley ist verdient, keine Restzeit", () => {
    render(<EndeDialog {...basis} sekunden={10 * 60} />);
    expect(screen.getByText(/Smiley für heute/)).toBeInTheDocument();
    expect(screen.queryByText(/Noch \d+ Minute/)).toBeNull();
  });

  it("mitten im Blatt: Hinweis, dass die Wörter erst mit dem fertigen Blatt zählen", () => {
    render(<EndeDialog {...basis} sekunden={60} blattOffen />);
    expect(screen.getByText(/Blatt zu Ende/)).toBeInTheDocument();
  });

  it("Weiterlesen ist vorausgewählt; Escape liest weiter", async () => {
    const onWeiter = vi.fn();
    render(<EndeDialog {...basis} sekunden={60} onWeiter={onWeiter} />);
    expect(screen.getByRole("button", { name: /Weiterlesen/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onWeiter).toHaveBeenCalledTimes(1);
  });

  it("die beiden Knöpfe lösen ihre Aktion aus", async () => {
    const onWeiter = vi.fn();
    const onAufhoeren = vi.fn();
    render(<EndeDialog {...basis} sekunden={60} onWeiter={onWeiter} onAufhoeren={onAufhoeren} />);
    await userEvent.click(screen.getByRole("button", { name: /Weiterlesen/ }));
    await userEvent.click(screen.getByRole("button", { name: /aufhören/i }));
    expect(onWeiter).toHaveBeenCalledTimes(1);
    expect(onAufhoeren).toHaveBeenCalledTimes(1);
  });
});
