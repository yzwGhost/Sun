import { useState } from "react";
import { SolarCanvas } from "./components/scene/SolarCanvas";
import { ModeToggle } from "./components/ui/ModeToggle";
import { StageLabel } from "./components/ui/StageLabel";

export default function App() {
  const [interiorMode, setInteriorMode] = useState(false);

  return (
    <main className="app-shell">
      <SolarCanvas interiorMode={interiorMode} />
      <StageLabel interiorMode={interiorMode} />
      <ModeToggle
        interiorMode={interiorMode}
        onToggle={() => setInteriorMode((current) => !current)}
      />
    </main>
  );
}
