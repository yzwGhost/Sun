import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DeepSpaceBackground } from "./DeepSpaceBackground";
import { SceneLighting } from "./SceneLighting";
import { Sun } from "../objects/Sun";
import { SolarInterior } from "../objects/SolarInterior";
import { SolarEffects } from "../postprocessing/SolarEffects";

type SolarCanvasProps = {
  interiorMode: boolean;
};

export function SolarCanvas({ interiorMode }: SolarCanvasProps) {
  return (
    <div className="canvas-shell">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#010204"]} />
        <fog attach="fog" args={["#010204", 8, 22]} />
        <SceneLighting />
        <DeepSpaceBackground />
        <Sun interiorMode={interiorMode} />
        {interiorMode ? <SolarInterior /> : null}
        <OrbitControls
          enablePan={false}
          minDistance={2.75}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={0.35}
        />
        <SolarEffects />
      </Canvas>
    </div>
  );
}
