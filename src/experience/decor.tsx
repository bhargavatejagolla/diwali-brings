import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TwinklePoints } from "./common";

// Shared set dressing. Geometry is built once per module and shared by every instance.

let marigoldGeo: THREE.BufferGeometry | null = null;
/** Ruffled, slightly flattened flower head: a sphere pushed in and out by many petal frills. */
function getMarigoldGeo() {
  if (marigoldGeo) return marigoldGeo;
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const a = Math.atan2(v.z, v.x), b = Math.acos(v.y);
    const frill = 1 + 0.1 * Math.sin(a * 14 + b * 9) * Math.sin(b * 12) + 0.05 * Math.sin(a * 31 + b * 23);
    v.multiplyScalar(frill);
    v.y *= v.y < 0 ? 0.45 : 0.8; // flat underside, domed top
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  marigoldGeo = g;
  return g;
}

let leafGeo: THREE.BufferGeometry | null = null;
function getLeafGeo() {
  if (!leafGeo) {
    const g = new THREE.DodecahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 0.8 + Math.random() * 0.35;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    leafGeo = g;
  }
  return leafGeo;
}

const MARIGOLD_TONES: [number, number, number][] = [[1, 0.55, 0.05], [1, 0.42, 0.02], [1, 0.72, 0.1], [0.95, 0.32, 0.03], [0.85, 0.12, 0.08]];

export type FlowerSpot = { x: number; y?: number; z: number; s: number };

/** Marigold (genda) flower heads at the given spots, in mixed saffron, orange and gold. */
export function Marigolds({ spots, leaves = false }: { spots: FlowerSpot[]; leaves?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(getMarigoldGeo, []);
  const lgeo = useMemo(getLeafGeo, []);
  useEffect(() => {
    const im = ref.current; if (!im) return;
    const o = new THREE.Object3D(), c = new THREE.Color();
    spots.forEach((f, i) => {
      o.position.set(f.x, (f.y ?? 0) + f.s * 0.45, f.z);
      o.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * 6.28, (Math.random() - 0.5) * 0.5);
      o.scale.setScalar(f.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      c.setRGB(...MARIGOLD_TONES[Math.floor(Math.random() * MARIGOLD_TONES.length)]); im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    const lm = leafRef.current; if (!lm) return;
    spots.forEach((f, i) => {
      o.position.set(f.x + (Math.random() - 0.5) * f.s, (f.y ?? 0) + f.s * 0.2, f.z + (Math.random() - 0.5) * f.s);
      o.rotation.set(0, Math.random() * 6.28, 0);
      o.scale.setScalar(f.s * (1.4 + Math.random() * 0.6)); o.updateMatrix(); lm.setMatrixAt(i, o.matrix);
      c.setRGB(0.05 + Math.random() * 0.04, 0.16 + Math.random() * 0.1, 0.04); lm.setColorAt(i, c);
    });
    lm.instanceMatrix.needsUpdate = true;
    if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={ref} args={[geo, undefined, spots.length]} dispose={null}>
        {/* a faint warm emissive keeps petals saffron instead of muddy brown in low lamp light */}
        <meshStandardMaterial roughness={0.75} emissive="#ff5a00" emissiveIntensity={0.12} />
      </instancedMesh>
      {leaves && (
        <instancedMesh ref={leafRef} args={[lgeo, undefined, spots.length]} dispose={null}>
          <meshStandardMaterial roughness={0.85} flatShading />
        </instancedMesh>
      )}
    </>
  );
}

/** Spots for a loose garland laid on the floor along a circle of radius r around (cx, cz). */
export function garlandSpots(r: number, count: number, cx = 0, cz = 0, size = 0.07, jitter = 0.06): FlowerSpot[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.02;
    const rr = r + (Math.random() - 0.5) * jitter;
    return { x: cx + Math.cos(a) * rr, z: cz + Math.sin(a) * rr, s: size * (0.8 + Math.random() * 0.4) };
  });
}

const BULB_TINTS: [number, number, number][] = [[2.2, 1.35, 0.5], [2.2, 1.35, 0.5], [2.2, 1.1, 0.4], [2.0, 0.55, 0.7], [2.1, 0.7, 0.3]];

export type Strand = { from: [number, number, number]; to: [number, number, number]; sag?: number; bulbs?: number };

/** Strings of tiny warm fairy-light bulbs draped between points, sagging like real wire. */
export function FairyLights({ strands, size = 0.5, tints = BULB_TINTS }: { strands: Strand[]; size?: number; tints?: [number, number, number][] }) {
  const data = useMemo(() => {
    const p: number[] = [], c: number[] = [], s: number[] = [];
    for (const st of strands) {
      const n = st.bulbs ?? 24, sag = st.sag ?? 0.6;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        p.push(
          st.from[0] + (st.to[0] - st.from[0]) * t,
          st.from[1] + (st.to[1] - st.from[1]) * t - sag * 4 * t * (1 - t),
          st.from[2] + (st.to[2] - st.from[2]) * t,
        );
        c.push(...tints[Math.floor(Math.random() * tints.length)]);
        s.push(size * (0.85 + Math.random() * 0.3));
      }
    }
    return { p: new Float32Array(p), c: new Float32Array(c), s: new Float32Array(s) };
  }, [strands, size, tints]);
  return <TwinklePoints positions={data.p} colors={data.c} sizes={data.s} speed={1.6} maxPx={7} />;
}
