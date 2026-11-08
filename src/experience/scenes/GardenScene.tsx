import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CameraRig, Motes, SkyDome, Stars } from "../common";
import { Diya } from "../Diya";
import { FairyLights, Marigolds, type FlowerSpot, type Strand } from "../decor";
import { grassTexture, paperLanternTexture, stoneTexture } from "../textures";

const SANDSTONE = "#8a6a52";

// Pointed (Mughal) arch spanning the bay between two pillars, along z; built once and shared.
let archGeo: THREE.TubeGeometry | null = null;
function getArchGeo() {
  if (!archGeo) {
    const pts: THREE.Vector3[] = [];
    // two lancet arcs meeting at a point; springs at z = ±1.25 (y 0), apex at y 0.95
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const z = -1.25 + 1.25 * t;
      pts.push(new THREE.Vector3(0, 0.95 * Math.pow(Math.sin((t * Math.PI) / 2), 0.8), z));
    }
    for (let k = 15; k >= 0; k--) {
      const t = k / 16;
      pts.push(new THREE.Vector3(0, 0.95 * Math.pow(Math.sin((t * Math.PI) / 2), 0.8), 1.25 - 1.25 * t));
    }
    archGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 48, 0.08, 6, false);
  }
  return archGeo;
}

// Bulging paper lantern body.
let lanternGeo: THREE.LatheGeometry | null = null;
function getLanternGeo() {
  if (!lanternGeo) {
    const prof = [[0.09, -0.21], [0.15, -0.16], [0.185, -0.06], [0.19, 0.03], [0.17, 0.13], [0.11, 0.2]];
    lanternGeo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 16);
  }
  return lanternGeo;
}

function Lantern({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const geo = useMemo(getLanternGeo, []);
  const map = useMemo(paperLanternTexture, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    if (ref.current) { ref.current.rotation.z = Math.sin(t * 0.7) * 0.035; ref.current.rotation.y = t * 0.1; }
    if (light.current) light.current.intensity = 3 * (0.9 + Math.sin(t * 8.3) * 0.04 + Math.sin(t * 19.1) * 0.03);
  });
  return (
    <group ref={ref}>
      <mesh position-y={0.25}><cylinderGeometry args={[0.006, 0.006, 0.5]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh geometry={geo} dispose={null}>
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={1.15} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.22}><cylinderGeometry args={[0.07, 0.12, 0.05, 12]} /><meshStandardMaterial color="#8a6420" metalness={0.85} roughness={0.35} /></mesh>
      <mesh position-y={-0.23}><cylinderGeometry args={[0.1, 0.06, 0.04, 12]} /><meshStandardMaterial color="#8a6420" metalness={0.85} roughness={0.35} /></mesh>
      {/* silk tassel */}
      <mesh position-y={-0.33}><coneGeometry args={[0.035, 0.16, 6]} /><meshStandardMaterial color="#9c1c2a" roughness={0.9} /></mesh>
      <pointLight ref={light} color="#ff9a4a" intensity={3} distance={6} decay={2} />
    </group>
  );
}

function Pavilion({ z, side }: { z: number; side: 1 | -1 }) {
  // Grounded colonnade bay: two pillars, a cusped arch beam and a hanging lantern.
  const x = side * 2.9;
  const hx = -side * 1.0;
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 1.4]}>
          <mesh position-y={0.15} castShadow><boxGeometry args={[0.6, 0.3, 0.6]} /><meshStandardMaterial color={SANDSTONE} roughness={0.85} /></mesh>
          <mesh position-y={1.75} castShadow><cylinderGeometry args={[0.18, 0.22, 2.9, 16]} /><meshStandardMaterial color={SANDSTONE} roughness={0.8} /></mesh>
          <mesh position-y={3.3}><boxGeometry args={[0.55, 0.2, 0.55]} /><meshStandardMaterial color={SANDSTONE} roughness={0.85} /></mesh>
        </group>
      ))}
      <mesh position-y={3.6}><boxGeometry args={[0.7, 0.4, 3.6]} /><meshStandardMaterial color={SANDSTONE} roughness={0.85} /></mesh>
      <mesh position-y={2.45} geometry={getArchGeo()} dispose={null}><meshStandardMaterial color="#7a5c46" roughness={0.85} /></mesh>
      {/* lantern hanging from the beam on a cord */}
      <mesh position={[hx / 2, 3.45, 0]}><boxGeometry args={[1.1, 0.06, 0.06]} /><meshStandardMaterial color="#3a2a1a" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[hx, 3.2, 0]}><cylinderGeometry args={[0.006, 0.006, 0.5]} /><meshStandardMaterial color="#222" /></mesh>
      <group position={[hx, 2.7, 0]}><Lantern seed={z * 1.3 + side} /></group>
    </group>
  );
}

function Palace() {
  const c = "#1c1420";
  return (
    <group position={[0, 0, -34]}>
      <mesh position-y={3}><boxGeometry args={[18, 6, 3]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
      <mesh position-y={7.2}><sphereGeometry args={[3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
      <mesh position-y={6}><cylinderGeometry args={[3, 3, 1.4, 32]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
      {[-7.5, 7.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position-y={5}><cylinderGeometry args={[0.5, 0.6, 10, 12]} /><meshStandardMaterial color={c} /></mesh>
          <mesh position-y={10.4}><sphereGeometry args={[0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} /></mesh>
        </group>
      ))}
      {/* warm windows */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-6.4 + i * 1.6, 2.4, 1.51]}><planeGeometry args={[0.5, 1.1]} /><meshBasicMaterial color="#ffb060" toneMapped={false} /></mesh>
      ))}
      <pointLight position={[0, 3, 4]} intensity={30} distance={20} color="#ffa050" />
    </group>
  );
}

export function GardenScene({ discovered }: { discovered: boolean }) {
  const stone = useMemo(() => stoneTexture(4), []);
  const t0 = useRef(0);
  const pos = useRef<[number, number, number]>([0, 1.7, 16]);
  const look = useRef<[number, number, number]>([0, 1.8, 8]);
  useFrame((_, d) => {
    t0.current += Math.min(d, 0.05);
    const z = Math.max(discovered ? -10 : 0, 16 - t0.current * 1.2);
    pos.current[2] = z; look.current[2] = z - 8;
  });
  const grassMap = useMemo(() => grassTexture(60), []);
  // Marigold beds lining both sides of the path, with leafy plants under the blooms.
  const flowers = useMemo<FlowerSpot[]>(() => Array.from({ length: 520 }, () => {
    const side = Math.random() < 0.5 ? -1 : 1;
    return { x: side * (1.55 + Math.random() * 1.3), z: 12 - Math.random() * 30, s: 0.06 + Math.random() * 0.05 };
  }), []);
  // Fairy lights draped from pavilion to pavilion along both colonnades, plus a few across the path.
  const strands = useMemo<Strand[]>(() => {
    const zs = [10, 4, -2, -8, -14];
    const out: Strand[] = [];
    for (const side of [-1, 1]) for (let k = 0; k < zs.length - 1; k++) {
      out.push({ from: [side * 2.55, 3.4, zs[k] - 1.4], to: [side * 2.55, 3.4, zs[k + 1] + 1.4], sag: 0.35, bulbs: 14 });
    }
    for (const z of zs) out.push({ from: [-2.55, 3.85, z], to: [2.55, 3.85, z], sag: 0.55, bulbs: 22 });
    return out;
  }, []);
  return (
    <>
      <SkyDome top="#03051a" horizon="#0b0c1c" glow="#1e1424" />
      <Stars count={1600} />
      <fog attach="fog" args={["#0b0c1c", 8, 42]} />
      <ambientLight intensity={0.05} />
      <hemisphereLight args={["#3c4a80", "#100a08", 0.25]} />
      <directionalLight position={[-10, 14, -8]} intensity={0.25} color="#8aa0ff" />
      <CameraRig pos={pos.current} look={look.current} speed={0.9} parallax={0.4} />
      {/* dew-damp stone path that catches the lantern light */}
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[2.6, 60]} /><meshStandardMaterial map={stone} roughness={0.42} metalness={0.15} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}><planeGeometry args={[400, 400]} /><meshStandardMaterial map={grassMap} roughness={1} /></mesh>
      <Marigolds spots={flowers} leaves />
      <FairyLights strands={strands} size={0.14} />
      {[10, 4, -2, -8, -14].map((z) => <Pavilion key={z + "l"} z={z} side={-1} />)}
      {[10, 4, -2, -8, -14].map((z) => <Pavilion key={z + "r"} z={z} side={1} />)}
      {Array.from({ length: 14 }, (_, i) => [-1, 1].map((s) => (
        <Diya key={i + "-" + s} position={[s * 1.4, 0, 12 - i * 2.2]} scale={0.35} seed={i + s} />
      )))}
      <Palace />
      <Motes count={160} area={[12, 4, 30]} center={[0, 2, -2]} size={0.07} />
    </>
  );
}

