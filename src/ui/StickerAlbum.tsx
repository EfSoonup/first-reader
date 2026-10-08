import { ALBUM_GROESSE, STICKER_MOTIVE } from "../progress/belohnungen";
import type { AppDaten } from "../progress/typen";

export function StickerAlbum({ daten, onZurueck }: { daten: AppDaten; onZurueck(): void }) {
  const alben = daten.spielstand.stickerAlben.length > 0 ? daten.spielstand.stickerAlben : [[]];
  return (
    <main className="seite">
      <button onClick={onZurueck}>← Zurück</button>
      {alben.map((album, i) => (
        <section key={i}>
          <h2>Album {i + 1}: {STICKER_MOTIVE[i % STICKER_MOTIVE.length].name}</h2>
          <div className="album">
            {Array.from({ length: ALBUM_GROESSE }, (_, j) => (
              <span key={j} className={album[j] ? "sticker" : "sticker leer"}>{album[j] ?? "?"}</span>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
