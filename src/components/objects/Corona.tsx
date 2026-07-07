import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, Mesh, ShaderMaterial, Vector3 } from "three";
import interiorVertexShader from "../../shaders/interiorLayer.vert?raw";
import coronaFragmentShader from "../../shaders/corona.frag?raw";

type CoronaUniforms = {
  uTime: { value: number };
  uOpacity: { value: number };
  uInnerRadius: { value: number };
  uOuterRadius: { value: number };
  uCameraLocal: { value: Vector3 };
  uCoreColor: { value: Color };
  uEdgeColor: { value: Color };
};

type CoronaProps = {
  opacity?: number;
};

const INNER_RADIUS = 1.12;
const OUTER_RADIUS = 1.62;

export function Corona({ opacity = 1 }: CoronaProps) {
  const { camera } = useThree();
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo<CoronaUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uInnerRadius: { value: INNER_RADIUS },
      uOuterRadius: { value: OUTER_RADIUS },
      uCameraLocal: { value: new Vector3() },
      uCoreColor: { value: new Color("#fff6d0") },
      uEdgeColor: { value: new Color("#ff7f3a") },
    }),
    [],
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = elapsed;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }

    if (meshRef.current && materialRef.current) {
      const cameraLocal = meshRef.current.worldToLocal(camera.position.clone());
      materialRef.current.uniforms.uCameraLocal.value.copy(cameraLocal);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={6}>
      <sphereGeometry args={[OUTER_RADIUS, 192, 192]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={interiorVertexShader}
        fragmentShader={coronaFragmentShader}
        uniforms={uniforms}
        side={BackSide}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
