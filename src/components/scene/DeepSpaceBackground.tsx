import { Stars } from "@react-three/drei";

export function DeepSpaceBackground() {
  return (
    <>
      <Stars
        radius={120}
        depth={50}
        count={5000}
        factor={4.5}
        saturation={0}
        fade
        speed={0.25}
      />
      <mesh scale={18}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#03050a" side={1} transparent opacity={0.18} />
      </mesh>
    </>
  );
}
