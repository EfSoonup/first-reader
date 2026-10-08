import { useState } from "react";
import { Elternbereich } from "./ui/eltern/Elternbereich";
import { KinderStart } from "./ui/KinderStart";
import { StickerAlbum } from "./ui/StickerAlbum";
import { Tagesreise } from "./ui/Tagesreise";
import { useAppDaten } from "./ui/useAppDaten";

type Ansicht = "start" | "reise" | "eltern" | "album";

export default function App() {
  const { daten, aktualisiere, fehler, schreibschutz, freigeben } = useAppDaten();
  const [ansicht, setAnsicht] = useState<Ansicht>("start");
  const zurStart = () => setAnsicht("start");

  if (ansicht === "eltern") return <Elternbereich daten={daten} aktualisiere={aktualisiere} fehler={fehler} onZurueck={zurStart}
      schreibschutz={schreibschutz} onFreigeben={freigeben} />;
  if (ansicht === "album") return <StickerAlbum daten={daten} onZurueck={zurStart} />;
  if (ansicht === "reise") return <Tagesreise daten={daten} aktualisiere={aktualisiere} onEnde={zurStart} />;
  return (
    <KinderStart daten={daten} aktualisiere={aktualisiere}
      onLos={() => setAnsicht("reise")} onAlbum={() => setAnsicht("album")} onEltern={() => setAnsicht("eltern")} />
  );
}
