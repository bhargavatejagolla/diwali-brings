import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** Portrait screens pull the camera back along its view direction by this factor. */
export const PORTRAIT_PULLBACK = 1.45;

/**
 * Smoothly eases the camera toward a target pose; pointer adds subtle parallax.
 * The camera is shared by every scene, so the first frame after mount snaps to the
 * target pose instead of flying in from wherever the previous scene left it.
 */
export function CameraRig({ pos, look, parallax = 0.3, speed = 1.5, portraitBack = PORTRAIT_PULLBACK }: { pos: [number, number, number]; look: [number, number, number]; parallax?: number; speed?: number; portraitBack?: number }) {
  const { camera, pointer, size } = useThree();
  const lookV = useRef(new THREE.Vector3(...look));
  const target = useRef(new THREE.Vector3());
  const lookT = useRef(new THREE.Vector3());
  const snapped = useRef(false);
  const portrait = size.width < size.height;
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    const back = portrait ? portraitBack : 1;
    lookT.current.set(look[0], look[1], look[2]);
    // Pull back along the look→camera direction so orbits and walks keep their shape.
    target.current.set(pos[0], pos[1], pos[2]).sub(lookT.current).multiplyScalar(back).add(lookT.current);
    target.current.x += pointer.x * parallax;
    target.current.y += pointer.y * parallax * 0.5;
    if (!snapped.current) {
      snapped.current = true;
      camera.position.copy(target.current);
      lookV.current.copy(lookT.current);
    } else {
      const k = 1 - Math.exp(-speed * dt);
      camera.position.lerp(target.current, k);
      lookV.current.lerp(lookT.current, k);
    }
    camera.lookAt(lookV.current);
  });
  return null;
}

/** Soft warm bokeh motes drifting slowly upward. */
export function Motes({ count = 120, area = [12, 5, 10], color = "#ffb45a", size = 0.08, center = [0, 2, 0] }: { count?: number; area?: [number, number, number]; color?: string; size?: number; center?: [number, number, number] }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = center[0] + (Math.random() - 0.5) * area[0];
      p[i * 3 + 1] = center[1] + (Math.random() - 0.5) * area[1];
      p[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2];
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count, area[0], area[1], area[2], center[0], center[1], center[2]]);
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    if (!g) return new THREE.CanvasTexture(c);
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => { geo.dispose(); }, [geo]);
  useEffect(() => () => { tex.dispose(); }, [tex]);
  useFrame((_, d) => {
    const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) + d * 0.08;
      if (y > center[1] + area[1] / 2) y -= area[1];
      a.setY(i, y);
    }
    a.needsUpdate = true;
    if (ref.current) ref.current.rotation.y += d * 0.005;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={tex} color={color} size={size} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

const twinkleVert = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime; uniform float uScale; uniform float uSpeed; uniform float uMaxPx;
varying vec3 vColor; varying float vTw;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float rate = uSpeed * (0.55 + fract(aPhase * 7.13));
  float tw = 0.6 + 0.4 * sin(uTime * rate + aPhase * 6.2831);
  vTw = tw; vColor = aColor;
  gl_PointSize = clamp(aSize * uScale / max(0.1, -mv.z) * (0.85 + 0.15 * tw), 1.0, uMaxPx);
  gl_Position = projectionMatrix * mv;
}`;
const twinkleFrag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = 1.0 - smoothstep(0.08, 0.5, d);
  gl_FragColor = vec4(vColor * vTw, a * uOpacity * vTw);
}`;

/** Additive glowing points that twinkle individually (stars, string lights). Unaffected by fog. */
/** `maxPx` caps on-screen size (CSS px) so lights near the camera stay crisp points instead of big discs. */
export function TwinklePoints({ positions, colors, sizes, speed = 1.2, opacity = 1, maxPx = 48 }: { positions: Float32Array; colors: Float32Array; sizes: Float32Array; speed?: number; opacity?: number; maxPx?: number }) {
  const { gl, size } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const phase = new Float32Array(sizes.length);
    for (let i = 0; i < phase.length; i++) phase[i] = Math.random();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return g;
  }, [positions, colors, sizes]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 400 }, uSpeed: { value: speed }, uOpacity: { value: opacity }, uMaxPx: { value: maxPx } }), [speed, opacity, maxPx]);
  useEffect(() => () => { geo.dispose(); }, [geo]);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScale.value = size.height * gl.getPixelRatio() * 0.5;
    uniforms.uMaxPx.value = maxPx * gl.getPixelRatio();
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={twinkleVert} fragmentShader={twinkleFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Star field on the upper sky; a few bright stars stand out and every star twinkles at its own pace. */
export function Stars({ count = 2500, radius = 180 }: { count?: number; radius?: number }) {
  const data = useMemo(() => {
    const p = new Float32Array(count * 3), c = new Float32Array(count * 3), s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 0.9 + 0.08, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      p.set([Math.cos(t) * r * radius, u * radius, Math.sin(t) * r * radius], i * 3);
      const b = 0.45 + Math.random() * 0.55;
      const warm = Math.random();
      c.set([b, b * (0.92 + warm * 0.06), b * (0.8 + (1 - warm) * 0.25)], i * 3);
      s[i] = Math.random() < 0.03 ? 1.5 + Math.random() * 0.6 : 0.45 + Math.random() * 0.5;
    }
    return { p, c, s };
  }, [count, radius]);
  return <TwinklePoints positions={data.p} colors={data.c} sizes={data.s} speed={1.4} opacity={0.9} />;
}

/** Large sky dome with a vertical night gradient. */
export function SkyDome({ top = "#05071a", horizon = "#1a1530", glow = "#3a1d24" }: { top?: string; horizon?: string; glow?: string }) {
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) }, glow: { value: new THREE.Color(glow) } }), [top, horizon, glow]);
  return (
    <mesh scale={300}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
        fragmentShader={`uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; varying vec3 vP;
          void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(horizon, top, pow(h,0.55)); c += glow * pow(1.-h, 8.) * 0.8; gl_FragColor = vec4(c,1.); }`} />
    </mesh>
  );
}
