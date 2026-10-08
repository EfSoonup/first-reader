// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFEKT_PRAEFIX, SPEICHER_SCHLUESSEL } from "../storage/storage";
import { useAppDaten } from "./useAppDaten";

describe("useAppDaten", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("überschreibt kaputte Daten nicht, wenn sie nicht beiseitegelegt werden konnten", () => {
    localStorage.setItem(SPEICHER_SCHLUESSEL, "{kaputt");
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith(DEFEKT_PRAEFIX)) throw new Error("QuotaExceededError");
      original.call(this, k, v);
    });
    const { result } = renderHook(() => useAppDaten());
    act(() => result.current.aktualisiere((d) => ({ ...d, einstellungen: { tageszielMinuten: 12 } })));
    expect(localStorage.getItem(SPEICHER_SCHLUESSEL)).toBe("{kaputt");
    expect(result.current.schreibschutz).toBe(true);

    act(() => result.current.freigeben());
    expect(result.current.schreibschutz).toBe(false);
    expect(JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL)!).einstellungen.tageszielMinuten).toBe(12);
  });
});
