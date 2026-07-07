import { Bloom, EffectComposer } from "@react-three/postprocessing";

export function SolarEffects() {
  return (
    <EffectComposer>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.08}
        luminanceSmoothing={0.28}
        intensity={2.35}
        radius={0.8}
      />
    </EffectComposer>
  );
}
