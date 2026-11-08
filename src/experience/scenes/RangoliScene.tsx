import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, Motes } from "../common";
import { Diya } from "../Diya";
import { FairyLights, Marigolds, garlandSpots, type Strand } from "../decor";
import { rangoliTexture, stoneTexture } from "../textures";

const BACK_STRANDS: Strand[] = [
  { from: [-9, 3.2, -7], to: [-2, 3.2, -8], sag: 0.8, bulbs: 26 },
  { from: [-2, 3.2, -8], to: [5, 3.2, -8], sag: 0.8, bulbs: 26 },
  { from: [5, 3.2, -8], to: [10, 3.2, -5], sag: 0.7, bulbs: 22 },
];

// Ring radii (world units) matching the rangoli texture rings, inner to outer.
export const RING_RADII = [0.36, 0.9, 1.42, 1.98, 2.5];

export function RangoliScene({ wish }: { wish: number }) {
  const tex = useMemo(rangoliTexture, []);
  const floor = useMemo(() => stoneTexture(12), []);
  const garland = useMemo(() => [...garlandSpots(3.45, 140, 0, 0, 0.075), ...garlandSpots(3.62, 110, 0, 0, 0.06)], []);
  const halo = useRef<THREE.Mesh>(null);
  const reveal = useRef(0);
  const angle = useRef(0);
  const camPos = useRef<[number, number, number]>([0, 4.2, 4.6]);
  useFrame(({ clock }, d) => {
    reveal.current = Math.min(1, reveal.current + d * 0.35);
    angle.current = Math.sin(clock.elapsedTime * 0.08) * 0.6;
    const r = 4.8;
    camPos.current[0] = Math.sin(angle.current) * r;
    camPos.current[2] = Math.cos(angle.current) * r;
    if (halo.current) {
      const target = RING_RADII[wish];
      const s = halo.current.scale.x + (target - halo.current.scale.x) * Math.min(1, d * 3);
      halo.current.scale.set(s, s, 1);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(clock.elapsedTime * 2) * 0.12;
    }
  });
  const ringDiyas = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.cos(a) * 3.05, 0, Math.sin(a) * 3.05] as [number, number, number];
  }), []);
  return (
    <>
      <color attach="background" args={["#07060c"]} />
      <fog attach="fog" args={["#07060c", 6, 20]} />
      <ambientLight intensity={0.06} />
      <spotLight position={[0, 6, 0]} angle={0.7} penumbra={0.8} intensity={14} color="#ffd9a0" distance={14} />
      <CameraRig pos={camPos.current} look={[0, 0, 0]} speed={0.8} parallax={0.6} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={1.2} roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.005}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={floor} color="#6a5a4c" roughness={0.9} />
      </mesh>
      <mesh ref={halo} rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.96, 1, 128]} />
        <meshBasicMaterial color="#ffcf7a" transparent opacity={0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {ringDiyas.map((p, i) => <Diya key={i} position={p} scale={0.55} seed={i} light={i % 3 === 0} lightIntensity={1.2} />)}
      <Marigolds spots={garland} />
      <FairyLights strands={BACK_STRANDS} size={0.45} />
      <Motes count={70} area={[8, 3, 8]} center={[0, 1.4, 0]} color="#ffcf7a" size={0.05} />
    </>
  );
}
