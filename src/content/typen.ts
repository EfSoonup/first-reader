export type GraphemTyp = "vokal" | "konsonant";
export interface GraphemInfo {
  g: string;                 // klein geschrieben: "m", "sch", "ei"
  typ: GraphemTyp;
  anfang?: false;            // darf nicht am Silben-/Wortanfang stehen (ck, ß, ng, nk, ch)
  ende?: false;              // darf nicht am Wortende stehen (qu)
  nurWortanfang?: true;      // nur am Wortanfang ein Graphem (st, sp)
  silbe?: false;             // nicht für generierte Silben/Pseudowörter (c, x, y)
}
export interface WortEintrag { text: string; typ: "wort" | "name"; emoji?: string; kategorie?: string; zerlegung?: string[] }
export interface BildEintrag { emoji: string; wort: string; kategorie: string; etiketten: string[] }
export interface Schablone { id: string; teile: string[] }   // "[Name]", "[Ort-im]" … oder feste Wörter
export interface Inhalte { inventar: GraphemInfo[]; woerter: WortEintrag[]; bilder: BildEintrag[]; schablonen: Schablone[]; sperrliste: string[] }
