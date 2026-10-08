import { describe, expect, it } from "vitest";
import { addiereSterne, ALBUM_GROESSE, STICKER_MOTIVE, vergebeTagesSticker } from "./belohnungen";
import { leereDaten } from "./typen";

const start = () => leereDaten(new Date(2026, 9, 8)).spielstand;

describe("Belohnungen", () => {
  it("jedes Motiv hat 30 verschiedene Sticker", () => {
    for (const motiv of STICKER_MOTIVE) {
      expect(motiv.sticker).toHaveLength(ALBUM_GROESSE);
      expect(new Set(motiv.sticker).size).toBe(ALBUM_GROESSE);
    }
  });

  it("addiert Sterne", () => {
    expect(addiereSterne(start(), 5).sterne).toBe(5);
  });

  it("vergibt höchstens einen Sticker pro Tag", () => {
    const erst = vergebeTagesSticker(start(), "2026-10-08");
    expect(erst.sticker).toBe(STICKER_MOTIVE[0].sticker[0]);
    const nochmal = vergebeTagesSticker(erst.spielstand, "2026-10-08");
    expect(nochmal.sticker).toBeNull();
    expect(nochmal.spielstand).toBe(erst.spielstand);
  });

  it("beginnt nach 30 Stickern ein neues Album mit anderem Motiv", () => {
    let sp = start();
    for (let tag = 1; tag <= ALBUM_GROESSE + 1; tag++) {
      sp = vergebeTagesSticker(sp, `tag-${tag}`).spielstand;
    }
    expect(sp.stickerAlben).toHaveLength(2);
    expect(sp.stickerAlben[0]).toHaveLength(30);
    expect(sp.stickerAlben[1]).toEqual([STICKER_MOTIVE[1].sticker[0]]);
  });
});
