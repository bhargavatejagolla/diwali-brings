import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, Motes } from "../common";
import { Diya } from "../Diya";
import { FairyLights, type Strand } from "../decor";
import { woodTexture } from "../textures";

const BACK_STRANDS: Strand[] = [
  { from: [-6, 3.0, -4], to: [0, 3.1, -4.5], sag: 0.6, bulbs: 28 },
  { from: [0, 3.1, -4.5], to: [6, 3.0, -4], sag: 0.6, bulbs: 28 },
  { from: [-5, 2.2, -5.5], to: [5, 2.2, -5.5], sag: 0.9, bulbs: 40 },
];

function Petals({ count = 60 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 8, y: Math.random() * 5, z: -Math.random() * 4,
    s: 0.6 + Math.random() * 0.4, r: Math.random() * 6, v: 0.15 + Math.random() * 0.2,
  })), [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  // Petal shape built once (scaling inside onUpdate would compound on every re-render).
  const geo = useMemo(() => new THREE.CircleGeometry(0.06, 8).scale(1, 1.7, 1), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(({ clock }, d) => {
    const im = ref.current; if (!im) return;
    const dt = Math.min(d, 0.05);
    data.forEach((p, i) => {
      p.y -= p.v * dt; p.r += dt * 0.8;
      if (p.y < -0.2) p.y = 5;
      o.position.set(p.x + Math.sin(clock.elapsedTime * 0.5 + i) * 0.3, p.y, p.z);
      o.rotation.set(p.r, p.r * 0.7, p.r * 0.3); o.scale.setScalar(p.s); o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#e2557d" roughness={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export function LetterScene() {
  const wood = useMemo(() => woodTexture(4), []);
  return (
    <>
      <color attach="background" args={["#0a0607"]} />
      <fog attach="fog" args={["#0a0607", 3, 12]} />
      <ambientLight intensity={0.04} />
      <CameraRig pos={[0, 1.2, 4]} look={[0, 0.8, 0]} parallax={0.35} speed={0.7} />
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[30, 30]} /><meshStandardMaterial map={wood} color="#c8a890" roughness={0.38} metalness={0.05} /></mesh>
      <Diya position={[-2.2, 0, 0.6]} scale={1.1} light lightIntensity={3} />
      <Diya position={[2.4, 0, -0.6]} scale={0.9} light seed={4} lightIntensity={2} />
      <FairyLights strands={BACK_STRANDS} size={0.2} />
      <Petals />
      <Motes count={60} area={[8, 3, 5]} center={[0, 1.5, -1]} size={0.05} />
    </>
  );
}
