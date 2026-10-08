import type { Spielstand } from "./typen";

export const ALBUM_GROESSE = 30;

export const STICKER_MOTIVE: readonly { name: string; sticker: readonly string[] }[] = [
  { name: "Tiere", sticker: [..."🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦉🐴🦄🐝🐞🦋🐢🐙🐬🐳"] },
  { name: "Leckeres", sticker: [..."🍎🍐🍊🍋🍌🍉🍇🍓🫐🍒🍑🥭🍍🥥🥝🍅🥕🌽🥦🥒🍄🥨🧀🥚🥞🍕🍦🍩🍪🧁"] },
  {
    name: "Abenteuer",
    sticker: ["🚀", "🛸", "🌍", "🌙", "⭐", "🌈", "☀️", "⛅", "❄️", "🌊", "🌋", "🏰", "🚂", "🚗", "🚕",
      "🚌", "🚒", "🚑", "🚜", "🚲", "🛴", "⛵", "🚁", "✈️", "🎈", "🎁", "🎨", "🎸", "🥁", "⚽"],
  },
];

export function addiereSterne(sp: Spielstand, anzahl: number): Spielstand {
  return { ...sp, sterne: sp.sterne + anzahl };
}

export function vergebeTagesSticker(sp: Spielstand, tag: string): { spielstand: Spielstand; sticker: string | null } {
  if (sp.letzterStickerTag === tag) return { spielstand: sp, sticker: null };
  const alben = sp.stickerAlben.map((a) => [...a]);
  let aktuell = alben.at(-1);
  if (!aktuell || aktuell.length >= ALBUM_GROESSE) {
    aktuell = [];
    alben.push(aktuell);
  }
  const motiv = STICKER_MOTIVE[(alben.length - 1) % STICKER_MOTIVE.length];
  const sticker = motiv.sticker[aktuell.length];
  aktuell.push(sticker);
  return { spielstand: { ...sp, stickerAlben: alben, letzterStickerTag: tag }, sticker };
}
