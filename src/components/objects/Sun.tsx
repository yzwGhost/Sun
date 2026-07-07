import { Corona } from "./Corona";
import { Photosphere } from "./Photosphere";

type SunProps = {
  interiorMode: boolean;
};

export function Sun({ interiorMode }: SunProps) {
  return (
    <group>
      <Photosphere opacity={interiorMode ? 0.22 : 1} />
      <Corona opacity={interiorMode ? 0.7 : 1} />
    </group>
  );
}
