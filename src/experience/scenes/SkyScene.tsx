import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FireworksSim, MAX_PARTICLES, PALETTE, ambientShot, nextShell, type BurstKind, type ColorName, type RGB, type Shell } from "@/lib/fireworks";
import { audio } from "../audio";
import { CameraRig, SkyDome, Stars, TwinklePoints } from "../common";
import { lanternTexture, smokeTexture, softGlowTexture } from "../textures";

const vert = /* glsl */ `
attribute float aSize; attribute float aAlpha; attribute float aHeat; attribute vec3 aColor;
varying vec3 vColor; varying float vAlpha; varying float vHeat;
uniform float uPixel;
void main(){
  vColor = aColor; vAlpha = aAlpha; vHeat = aHeat;
  vec4 mv = modelViewMatrix * vec4(position,1.);
  gl_PointSize = clamp(aSize * uPixel * (150. / max(0.1, -mv.z)), 1.0, 64.0);
  gl_Position = projectionMatrix * mv;
}`;
// Stars are born white-hot and cool into their colour.
const frag = /* glsl */ `
varying vec3 vColor; varying float vAlpha; varying float vHeat;
void main(){
  vec2 c = gl_PointCoord - .5; float d = length(c);
  float core = 1.0 - smoothstep(.0, .5, d); core *= core;
  vec3 col = mix(vColor, vec3(1.0, 0.96, 0.88), vHeat * 0.75);
  gl_FragColor = vec4(col * (core*1.8 + (1.0 - smoothstep(.0,.12,d))*1.4), core * vAlpha);
}`;

/** Omitted kind/colour/size are picked at random, never repeating the previous shell's shape or colour. */
export type SkyApi = { launch: (x: number, y: number, kind?: BurstKind, color?: ColorName, z?: number, size?: number) => void; clear: () => void };

const GLOW_POOL = 10;
const SMOKE_POOL = 16;
const SMOKE_LIFE = 8; // seconds a smoke cloud lingers after its burst
const WIND = 0.45; // gentle breeze carrying smoke to the right

export function SkyScene({ apiRef, flash, ambient = true }: { apiRef: React.MutableRefObject<SkyApi | null>; flash: React.MutableRefObject<number>; ambient?: boolean }) {
  const sim = useMemo(() => new FireworksSim(MAX_PARTICLES), []);
  const { gl, camera, size } = useThree();
  const flashLight = useRef<THREE.PointLight>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sim.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(sim.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(sim.max), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(sim.max), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aHeat", new THREE.BufferAttribute(new Float32Array(sim.max), 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, -20), 200);
    return g;
  }, [sim]);
  const uniforms = useMemo(() => ({ uPixel: { value: gl.getPixelRatio() } }), [gl]);

  // Soft halos that light the night air around each burst.
  const glows = useMemo(() => Array.from({ length: GLOW_POOL }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softGlowTexture(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    s.visible = false;
    return { sprite: s, life: 0, scale: 1 };
  }), []);
  const nextGlow = useRef(0);
  useEffect(() => () => glows.forEach((g) => g.sprite.material.dispose()), [glows]);

  // Real shells leave drifting smoke that catches the light of the burst, then fades into the night.
  const smoke = useMemo(() => Array.from({ length: SMOKE_POOL }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTexture(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    s.visible = false;
    return { sprite: s, age: SMOKE_LIFE, scale: 1, tint: new THREE.Color(), spin: 0 };
  }), []);
  const nextSmoke = useRef(0);
  const smokeDim = useMemo(() => new THREE.Color(0.16, 0.16, 0.22), []);
  useEffect(() => () => smoke.forEach((m) => m.sprite.material.dispose()), [smoke]);

  const ambientWait = useRef(2.6); // let the scene's opening shells go first
  const ambientOn = useRef(ambient);
  ambientOn.current = ambient;

  useEffect(() => {
    sim.onBurst = (x, y, z, kind, s, c: RGB) => {
      flash.current = Math.min(1.5, flash.current + (kind === "grand" ? 1.2 : 0.4 + 0.25 * s));
      if (flashLight.current) {
        flashLight.current.position.set(x, y, z);
        flashLight.current.color.setRGB(0.6 + c[0] * 0.4, 0.55 + c[1] * 0.4, 0.5 + c[2] * 0.4);
      }
      const g = glows[nextGlow.current++ % GLOW_POOL];
      g.life = 1; g.scale = (kind === "grand" ? 28 : 20) * s;
      g.sprite.position.set(x, y, z - 0.5);
      g.sprite.material.color.setRGB(c[0], c[1], c[2]);
      g.sprite.visible = true;
      const m = smoke[nextSmoke.current++ % SMOKE_POOL];
      m.age = 0; m.scale = (kind === "grand" ? 16 : 11) * s; m.spin = (Math.random() - 0.5) * 0.08;
      m.tint.setRGB(0.35 + c[0] * 0.45, 0.32 + c[1] * 0.45, 0.32 + c[2] * 0.45);
      m.sprite.position.set(x, y - 1, z - 1);
      m.sprite.material.rotation = Math.random() * Math.PI * 2;
      m.sprite.visible = true;
      const dist = Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z);
      window.setTimeout(() => audio.boom(kind === "grand" || s > 1.2), Math.min(900, dist * 8));
    };
    let last: Shell | null = null;
    apiRef.current = {
      launch: (x, y, kind, color, z = -20 - Math.random() * 15, s) => {
        if (sim.rockets > 14) return;
        const random = nextShell(last);
        const shell: Shell = { kind: kind ?? random.kind, color: color ?? random.color, size: s ?? random.size };
        last = shell;
        if (sim.launch(x, y, z, shell.kind, PALETTE[shell.color], shell.size)) audio.whoosh();
      },
      clear: () => sim.clear(),
    };
    return () => { apiRef.current = null; sim.onBurst = undefined; sim.clear(); geo.dispose(); };
  }, [sim, apiRef, flash, camera, geo, glows, smoke]);

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    // Gentle background show so the sky is never empty.
    if (ambientOn.current) {
      ambientWait.current -= dt;
      if (ambientWait.current <= 0) {
        const shot = ambientShot();
        ambientWait.current = shot.wait;
        if (sim.rockets < 3) apiRef.current?.launch(shot.x, shot.y, undefined, undefined, shot.z);
      }
    }
    sim.step(d);
    const sizeA = geo.attributes.aSize as THREE.BufferAttribute;
    const alphaA = geo.attributes.aAlpha as THREE.BufferAttribute;
    const heatA = geo.attributes.aHeat as THREE.BufferAttribute;
    for (let i = 0; i < sim.count; i++) {
      const f = sim.life[i] / sim.maxLife[i];
      sizeA.array[i] = sim.size[i] * (0.4 + 0.6 * f);
      alphaA.array[i] = Math.min(1, f * 1.6) * (0.75 + Math.random() * 0.25);
      heatA.array[i] = f > 0.8 ? (f - 0.8) * 5 : 0;
    }
    geo.setDrawRange(0, sim.count);
    for (const k of ["position", "aColor", "aSize", "aAlpha", "aHeat"]) {
      const a = geo.attributes[k] as THREE.BufferAttribute;
      a.clearUpdateRanges(); a.addUpdateRange(0, sim.count * a.itemSize); a.needsUpdate = true;
    }
    for (const g of glows) {
      if (g.life <= 0) continue;
      g.life = Math.max(0, g.life - dt * 1.4);
      const m = g.sprite.material;
      m.opacity = 0.22 * g.life * g.life;
      g.sprite.scale.setScalar(g.scale * (1.15 - 0.15 * g.life));
      if (g.life === 0) g.sprite.visible = false;
    }
    for (const m of smoke) {
      if (!m.sprite.visible) continue;
      m.age += dt;
      const f = m.age / SMOKE_LIFE;
      if (f >= 1) { m.sprite.visible = false; continue; }
      const mat = m.sprite.material;
      // lit by the burst at first, then cooling to a faint grey haze
      mat.color.copy(smokeDim).lerp(m.tint, Math.exp(-m.age * 1.6));
      mat.opacity = 0.2 * Math.min(1, m.age * 3) * (1 - f) * (1 - f);
      mat.rotation += m.spin * dt;
      m.sprite.scale.setScalar(m.scale * (0.6 + 0.9 * Math.sqrt(f)));
      m.sprite.position.x += WIND * dt;
      m.sprite.position.y -= 0.25 * dt;
    }
    flash.current *= Math.exp(-3 * dt);
    if (flashLight.current) flashLight.current.intensity = flash.current * 2500;
  });

  const portrait = size.width < size.height;
  return (
    <>
      <SkyDome top="#020414" horizon="#0f1430" glow="#2b1830" />
      <Stars count={3000} />
      <fog attach="fog" args={["#0a0d22", 30, 140]} />
      <ambientLight intensity={0.08} />
      <pointLight ref={flashLight} distance={130} decay={1.6} color="#ffd6a0" />
      {/* Looking up at the sky: a view-direction pull-back would sink the camera under the water, so portrait framing is set here. */}
      <CameraRig pos={[0, 2, portrait ? 30 : 18]} look={[0, 14, -20]} parallax={1.2} speed={0.8} portraitBack={1} />
      <SkyLanterns />
      <Skyline />
      {smoke.map((m, i) => <primitive key={"s" + i} object={m.sprite} />)}
      {glows.map((g, i) => <primitive key={i} object={g.sprite} />)}
      <mesh position={[0, 20, -25]} onPointerDown={(e) => { e.stopPropagation(); apiRef.current?.launch(THREE.MathUtils.clamp(e.point.x, -40, 40), THREE.MathUtils.clamp(e.point.y, 10, 34), undefined, undefined, -25); }}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <points geometry={geo} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {/* reflective water to catch the sky */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2, -10]}>
        <planeGeometry args={[400, 200]} />
        <meshStandardMaterial color="#05060f" roughness={0.12} metalness={0.8} />
      </mesh>
    </>
  );
}

const LANTERNS = 28;

/** Paper sky lanterns (akash kandil) drifting up behind the fireworks. */
function SkyLanterns() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => Array.from({ length: LANTERNS }, () => ({
    x: (Math.random() - 0.5) * 90, y: -2 + Math.random() * 46, z: -34 - Math.random() * 46,
    v: 0.45 + Math.random() * 0.5, phase: Math.random() * 6.28, s: 0.7 + Math.random() * 0.6,
  })), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(2.2, 2.2), []);
  const map = useMemo(lanternTexture, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => {
    const im = ref.current; if (!im) return;
    const c = new THREE.Color();
    // Slight over-brightness lets the bloom pass give each lantern a soft glow; a few are rose or gold.
    data.forEach((_, i) => {
      const r = Math.random();
      c.setRGB(...(r < 0.7 ? [1.35, 1.0, 0.9] : r < 0.85 ? [1.35, 0.75, 0.85] : [1.35, 1.15, 0.7]) as [number, number, number]);
      im.setColorAt(i, c);
    });
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [data]);
  useFrame(({ clock }, d) => {
    const im = ref.current; if (!im) return;
    const dt = Math.min(d, 0.05), t = clock.elapsedTime;
    data.forEach((p, i) => {
      p.y += p.v * dt;
      if (p.y > 46) { p.y = -2; p.x = (Math.random() - 0.5) * 90; }
      const fade = Math.min(1, (46 - p.y) / 10); // shrink away as they rise out of sight
      o.position.set(p.x + Math.sin(t * 0.35 + p.phase) * 1.2, p.y, p.z);
      o.rotation.set(0, 0, Math.cos(t * 0.6 + p.phase) * 0.08);
      o.scale.setScalar(p.s * fade * (0.96 + Math.sin(t * 7 + p.phase * 3) * 0.04));
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, LANTERNS]} frustumCulled={false}>
      <meshBasicMaterial map={map} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
    </instancedMesh>
  );
}

// Onion dome profile (radius, height) for the skyline, lathed once and shared.
let domeGeo: THREE.LatheGeometry | null = null;
function getDomeGeo() {
  if (!domeGeo) {
    const prof = [[1, 0], [1.08, 0.15], [1.13, 0.36], [1.06, 0.62], [0.86, 0.88], [0.56, 1.08], [0.26, 1.28], [0.09, 1.46], [0, 1.6]];
    domeGeo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 20);
  }
  return domeGeo;
}

/**
 * Old-city silhouette lit by the bursts: onion domes with finials, minarets, warm windows,
 * a lit string along every roofline and curtains of hanging lights (jhalar) down the facades.
 */
function Skyline() {
  const c = "#0b0a17";
  const dome = useMemo(getDomeGeo, []);
  const domes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: -90 + i * 10.5 + (Math.random() - 0.5) * 4, h: 3 + Math.random() * 9, w: 3 + Math.random() * 4, z: -60 - Math.random() * 30,
    minaret: Math.random() < 0.4, hasDome: Math.random() < 0.75,
    windows: Array.from({ length: 8 }, () => Math.random() < 0.6),
  })), []);
  const lights = useMemo(() => {
    const p: number[] = [], col: number[] = [], s: number[] = [];
    const warm: [number, number, number] = [2.2, 1.4, 0.5];
    const tints: [number, number, number][] = [warm, warm, warm, [2.0, 0.5, 0.7], [0.5, 1.6, 1.4], [2.0, 0.6, 0.3], [0.7, 1.8, 0.6]];
    const add = (x: number, y: number, z: number, tint?: [number, number, number], size = 0.42) => {
      p.push(x, y, z);
      col.push(...(tint ?? tints[Math.floor(Math.random() * tints.length)]));
      s.push(size + Math.random() * 0.14);
    };
    for (const b of domes) {
      const y0 = -2, top = y0 + b.h, front = b.z + 1.6;
      // roofline string, sagging slightly between posts
      for (let x = -b.w; x <= b.w; x += 0.55) add(b.x + x, top + 0.05 - Math.abs(Math.sin((x / b.w) * Math.PI * 2)) * 0.12, front);
      // straight curtains of hanging lights down the facade, one colour per strand
      const strandTint = tints[Math.floor(Math.random() * tints.length)];
      for (let x = -b.w + 0.4; x <= b.w - 0.4; x += 0.9) {
        const len = Math.min(b.h - 0.5, 1.4 + Math.random() * 2.2);
        for (let y = 0.35; y < len; y += 0.38) add(b.x + x, top - y, front + 0.02, strandTint, 0.36);
      }
      if (b.minaret) for (let y = 0.5; y < b.h * 1.75; y += 0.7) add(b.x + b.w * 1.1, y0 + y, b.z + 0.5);
    }
    return { p: new Float32Array(p), c: new Float32Array(col), s: new Float32Array(s) };
  }, [domes]);
  return (
    <>
      <group position-y={-2}>
        {domes.map((b, i) => (
          <group key={i} position={[b.x, 0, b.z]}>
            <mesh position-y={b.h / 2}><boxGeometry args={[b.w * 2, b.h, 3]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
            {b.hasDome && (
              <>
                <mesh position-y={b.h} scale={[b.w * 0.62, b.w * 0.62, b.w * 0.62]} geometry={dome} dispose={null}><meshStandardMaterial color={c} roughness={0.9} /></mesh>
                <mesh position-y={b.h + b.w * 0.62 * 1.6 + 0.3}><cylinderGeometry args={[0.04, 0.08, 0.7, 6]} /><meshStandardMaterial color="#2a2030" metalness={0.6} roughness={0.4} /></mesh>
              </>
            )}
            {b.minaret && (
              <>
                <mesh position={[b.w * 1.1, b.h * 0.9, 0]}><cylinderGeometry args={[0.35, 0.45, b.h * 1.8, 8]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
                <mesh position={[b.w * 1.1, b.h * 1.8, 0]} scale={0.42} geometry={dome} dispose={null}><meshStandardMaterial color={c} roughness={0.9} /></mesh>
              </>
            )}
            {b.windows.map((on, k) => on && (
              <mesh key={k} position={[-b.w + 0.5 + (k % 4) * (b.w / 2), b.h * (k < 4 ? 0.3 : 0.6), 1.52]}><planeGeometry args={[0.35, 0.7]} /><meshBasicMaterial color={k % 3 ? "#d08840" : "#b8683a"} toneMapped={false} /></mesh>
            ))}
          </group>
        ))}
      </group>
      <TwinklePoints positions={lights.p} colors={lights.c} sizes={lights.s} speed={2.2} />
    </>
  );
}
