export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]} intensity={18} color="#ffb347" />
    </>
  );
}
