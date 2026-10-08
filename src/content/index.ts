import inventar from "../../content/grapheme.json";
import woerter from "../../content/woerter.json";
import bilder from "../../content/bilder.json";
import schablonen from "../../content/schablonen.json";
import sperrliste from "../../content/sperrliste.json";
import type { BildEintrag, GraphemInfo, Inhalte, Schablone, WortEintrag } from "./typen";

export const inhalte: Inhalte = {
  inventar: inventar as GraphemInfo[],
  woerter: woerter as WortEintrag[],
  bilder: bilder as BildEintrag[],
  schablonen: schablonen as Schablone[],
  sperrliste: sperrliste as string[],
};

export type * from "./typen";
