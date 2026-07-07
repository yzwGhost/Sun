import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, ShaderMaterial } from "three";
import interiorVertexShader from "../../shaders/interiorLayer.vert?raw";
import convectionFragmentShader from "../../shaders/convectionZone.frag?raw";
import coreFragmentShader from "../../shaders/coreLayer.frag?raw";
import radiativeFragmentShader from "../../shaders/radiativeZone.frag?raw";

type LayerUniforms = {
  uTime: { value: number };
  uOpacity: { value: number };
};

export function SolarInterior() {
  const coreMaterialRef = useRef<ShaderMaterial>(null);
  const radiativeMaterialRef = useRef<ShaderMaterial>(null);
  const convectionMaterialRef = useRef<ShaderMaterial>(null);

  const coreUniforms = useMemo<LayerUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
    }),
    [],
  );

  const radiativeUniforms = useMemo<LayerUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.28 },
    }),
    [],
  );

  const convectionUniforms = useMemo<LayerUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.22 },
    }),
    [],
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uTime.value = elapsed;
    }

    if (radiativeMaterialRef.current) {
      radiativeMaterialRef.current.uniforms.uTime.value = elapsed;
    }

    if (convectionMaterialRef.current) {
      convectionMaterialRef.current.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <group renderOrder={10}>
      <mesh renderOrder={10}>
        <sphereGeometry args={[0.28, 192, 192]} />
        <shaderMaterial
          ref={coreMaterialRef}
          vertexShader={interiorVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh renderOrder={9}>
        <sphereGeometry args={[0.68, 192, 192]} />
        <shaderMaterial
          ref={radiativeMaterialRef}
          vertexShader={interiorVertexShader}
          fragmentShader={radiativeFragmentShader}
          uniforms={radiativeUniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh renderOrder={8}>
        <sphereGeometry args={[0.98, 192, 192]} />
        <shaderMaterial
          ref={convectionMaterialRef}
          vertexShader={interiorVertexShader}
          fragmentShader={convectionFragmentShader}
          uniforms={convectionUniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
