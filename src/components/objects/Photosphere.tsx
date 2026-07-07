import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, Group, ShaderMaterial } from "three";
import photosphereFragmentShader from "../../shaders/photosphere.frag?raw";
import photosphereVertexShader from "../../shaders/photosphere.vert?raw";

const SOLAR_ROTATION_PERIOD_DAYS = 27.0;
const SIMULATION_DAYS_PER_SECOND = 0.9;

type PhotosphereUniforms = {
  uTime: { value: number };
  uRotationAngle: { value: number };
  uRotationPeriodDays: { value: number };
  uDisplacementStrength: { value: number };
  uGranulationScale: { value: number };
  uOpacity: { value: number };
  uBaseColor: { value: Color };
  uHighlightColor: { value: Color };
  uShadowColor: { value: Color };
  uRimColor: { value: Color };
};

type PhotosphereProps = {
  opacity?: number;
};

export function Photosphere({ opacity = 1 }: PhotosphereProps) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo<PhotosphereUniforms>(
    () => ({
      uTime: { value: 0 },
      uRotationAngle: { value: 0 },
      uRotationPeriodDays: { value: SOLAR_ROTATION_PERIOD_DAYS },
      uDisplacementStrength: { value: 0.08 },
      uGranulationScale: { value: 5.75 },
      uOpacity: { value: opacity },
      uBaseColor: { value: new Color("#ffb347") },
      uHighlightColor: { value: new Color("#fff1a8") },
      uShadowColor: { value: new Color("#b85b18") },
      uRimColor: { value: new Color("#ffd27a") },
    }),
    [],
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const simulatedDays = elapsed * SIMULATION_DAYS_PER_SECOND;
    const rotationAngle =
      (simulatedDays / SOLAR_ROTATION_PERIOD_DAYS) * Math.PI * 2.0;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = elapsed;
      materialRef.current.uniforms.uRotationAngle.value = rotationAngle;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = rotationAngle;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.08, 320, 320]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={photosphereVertexShader}
          fragmentShader={photosphereFragmentShader}
          uniforms={uniforms}
          transparent={opacity < 1}
          depthWrite={opacity >= 1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
