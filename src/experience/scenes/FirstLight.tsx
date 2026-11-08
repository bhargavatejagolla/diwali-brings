import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { audio } from "../audio";
import { CameraRig, Motes } from "../common";
import { Diya } from "../Diya";
import { FairyLights, Marigolds, garlandSpots, type Strand } from "../decor";
import { rangoliTexture, stoneTexture } from "../textures";

// Fairy lights draped across the courtyard wall behind the rangoli.
const BACK_STRANDS: Strand[] = [-9, -3, 3].map((x) => ({ from: [x, 3.4, -9], to: [x + 6, 3.4, -9], sag: 0.7, bulbs: 26 }));

export function FirstLight({ awake }: { awake: boolean }) {
  const lit = useRef(0);
  const sinceAwake = useRef(0);
  const tex = useMemo(rangoliTexture, []);
  const floor = useMemo(() => stoneTexture(12), []);
  const garland = useMemo(() => [...garlandSpots(3.45, 150, 0, 0, 0.075), ...garlandSpots(3.62, 110, 0, 0, 0.06)], []);
  const ring = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3, r = 5 + (i % 3) * 1.6;
    return [Math.cos(a) * r, 0, Math.sin(a) * r - 3] as [number, number, number];
  }), []);
  // Once the first diya is lit, the flame passes from lamp to lamp, nearest first.
  const order = useMemo(() => ring.map((p, i) => ({ i, d: Math.hypot(p[0], p[2]) })).sort((a, b) => a.d - b.d).map((o) => o.i), [ring]);
  const ringLit = useMemo(() => ring.map(() => ({ current: 0 })), [ring]);
  const chimed = useRef<boolean[]>([]);
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    lit.current += ((awake ? 1 : 0.06) - lit.current) * (1 - Math.exp(-(awake ? 0.9 : 3) * dt));
    sinceAwake.current = awake ? sinceAwake.current + dt : 0;
    order.forEach((idx, rank) => {
      const on = awake && sinceAwake.current > 1.2 + rank * 0.45;
      const l = ringLit[idx];
      if (on && !chimed.current[rank]) { chimed.current[rank] = true; audio.chime(392 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19][rank % 9] / 12)); }
      if (!awake) chimed.current[rank] = false;
      l.current += ((on ? 1 : 0) - l.current) * (1 - Math.exp(-(on ? 2.2 : 3) * dt));
    });
  });
  return (
    <>
      <color attach="background" args={["#060408"]} />
      <fog attach="fog" args={["#060408", 4, 18]} />
      <ambientLight intensity={0.03} />
      <hemisphereLight args={["#2a2440", "#120a06", 0.08]} />
      <CameraRig pos={awake ? [0.4, 1.1, 2.4] : [0.2, 1.5, 3.4]} look={[0.2, 0.25, 0]} speed={0.6} parallax={0.25} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={floor} color="#7a6a5a" roughness={0.9} />
      </mesh>
      <Diya position={[-0.2, 0, 0]} scale={1.3} lit={lit} light lightIntensity={2.2} />
      {ring.map((p, i) => <Diya key={i} position={p} scale={0.9} lit={ringLit[i]} seed={i * 1.7} light={i % 3 === 0} lightIntensity={1.4} />)}
      <Marigolds spots={garland} />
      <FairyLights strands={BACK_STRANDS} size={0.45} />
      <Motes count={90} area={[10, 3, 8]} center={[0, 1.5, -2]} size={0.06} />
    </>
  );
}
