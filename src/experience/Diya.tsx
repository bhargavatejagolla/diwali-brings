import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clayBump, clayTexture } from "./textures";

const flameVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const flameFrag = /* glsl */ `
uniform float uTime; uniform float uSeed; uniform float uLit;
varying vec2 vUv;
float hash(float n){ return fract(sin(n)*43758.5453); }
float noise(float x){ float i=floor(x); float f=fract(x); return mix(hash(i),hash(i+1.),f*f*(3.-2.*f)); }
void main(){
  float y = vUv.y;
  float t = uTime*1.0 + uSeed;
  float sway = (noise(t*2.3)-0.5)*0.12*y*y + (noise(t*7.0+y*4.)-0.5)*0.03*y;
  float x = vUv.x - 0.5 - sway;
  float w = 0.30 * pow(max(0.0, sin(3.14159*pow(clamp(y,0.,1.),0.62))),0.9) * (1.0 - 0.12*noise(t*5.));
  float d = abs(x) / max(w, 0.0001);
  float body = (1.0 - smoothstep(0.55, 1.0, d)) * smoothstep(0.0, 0.02, y) * (1.0 - smoothstep(0.75, 1.0, y));
  float core = (1.0 - smoothstep(0.0, 0.55, d)) * (1.0 - smoothstep(0.15, 0.62, y)) * smoothstep(0.04, 0.16, y);
  float base = (1.0 - smoothstep(0.05, 0.24, y)) * (1.0 - smoothstep(0.3, 1.0, d));
  vec3 col = vec3(1.0, 0.42, 0.08) * body;
  col = mix(col, vec3(1.0, 0.82, 0.48), core);
  col += vec3(0.15, 0.3, 1.0) * base * 0.7;
  float a = max(body, base*0.5) * uLit;
  gl_FragColor = vec4(col * 1.6 * uLit, a);
}`;

// One flame quad shared by every diya, with its pivot at the base of the flame.
// Built once: transforming geometry inside onUpdate re-applies on every re-render and
// makes flames creep upward off their wicks.
let flameGeo: THREE.PlaneGeometry | null = null;
function getFlameGeo() {
  if (!flameGeo) flameGeo = new THREE.PlaneGeometry(0.16, 0.42).translate(0, 0.21, 0);
  return flameGeo;
}
const tmpWorld = new THREE.Vector3();

export function Flame({ seed = 0, lit = 1, scale = 1 }: { seed?: number; lit?: number | { current: number }; scale?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(getFlameGeo, []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSeed: { value: seed * 13.1 }, uLit: { value: 1 } }), [seed]);
  useFrame(({ clock, camera }) => {
    if (!mat.current || !mesh.current) return;
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    const l = typeof lit === "number" ? lit : lit.current;
    mat.current.uniforms.uLit.value = l;
    mesh.current.scale.setScalar(scale * (0.3 + 0.7 * l));
    mesh.current.visible = l > 0.01;
    // cylindrical billboard: rotate around Y to face camera
    mesh.current.getWorldPosition(tmpWorld);
    mesh.current.rotation.y = Math.atan2(camera.position.x - tmpWorld.x, camera.position.z - tmpWorld.z);
  });
  return (
    <mesh ref={mesh} position={[0, 0.02, 0]} geometry={geo} dispose={null}>
      <shaderMaterial ref={mat} vertexShader={flameVert} fragmentShader={flameFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

const profile = [
  [0.0, 0.0], [0.18, 0.0], [0.26, 0.02], [0.33, 0.07], [0.37, 0.13], [0.38, 0.16],
  [0.35, 0.165], [0.32, 0.12], [0.26, 0.07], [0.15, 0.045], [0.0, 0.045],
].map(([x, y]) => new THREE.Vector2(x, y));

let diyaGeo: THREE.LatheGeometry | null = null;
function getDiyaGeo() {
  if (diyaGeo) return diyaGeo;
  const g = new THREE.LatheGeometry(profile, 64);
  // Hand-made irregularity + pinch a spout toward +x
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
    const a = Math.atan2(z, x);
    const spout = Math.pow(Math.max(0, Math.cos(a)), 12) * 0.16 * (y / 0.165);
    const wob = 1 + Math.sin(a * 5 + 1.3) * 0.012 + Math.sin(a * 11) * 0.006;
    const r = Math.hypot(x, z) * wob + spout;
    p.setXYZ(i, Math.cos(a) * r, y + (spout > 0 ? spout * 0.25 : 0), Math.sin(a) * r * 0.92);
  }
  g.computeVertexNormals();
  diyaGeo = g;
  return g;
}

export function Diya({
  position = [0, 0, 0], scale = 1, lit = 1, light = false, seed = 0, lightIntensity = 3,
}: {
  position?: [number, number, number]; scale?: number; lit?: number | { current: number };
  light?: boolean; seed?: number; lightIntensity?: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const geo = useMemo(getDiyaGeo, []);
  const map = useMemo(clayTexture, []);
  const bump = useMemo(clayBump, []);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime + seed;
    const l = typeof lit === "number" ? lit : lit.current;
    lightRef.current.intensity = lightIntensity * l * (0.86 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23.7) * 0.04 + Math.sin(t * 3.1) * 0.05);
  });
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo} dispose={null} castShadow receiveShadow>
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.6} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* oil */}
      <mesh position={[0, 0.125, 0]} rotation-x={-Math.PI / 2} scale={[1, 0.92, 1]}>
        <circleGeometry args={[0.31, 48]} />
        <meshStandardMaterial color="#3a2408" roughness={0.08} metalness={0.3} />
      </mesh>
      {/* cotton wick resting on the spout */}
      <mesh position={[0.36, 0.18, 0]} rotation-z={-0.9}>
        <cylinderGeometry args={[0.012, 0.016, 0.16, 8]} />
        <meshStandardMaterial color="#e8dcc0" roughness={1} />
      </mesh>
      <group position={[0.42, 0.19, 0]}>
        <Flame seed={seed} lit={lit} />
        {light && <pointLight ref={lightRef} color="#ff9a4a" distance={6} decay={2} castShadow={false} position={[0, 0.15, 0]} />}
      </group>
    </group>
  );
}
