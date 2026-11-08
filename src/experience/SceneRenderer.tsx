import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";

export type RenderStatus = "loading" | "ready" | "lost" | "failed";

/** Browser-specific steps to turn hardware graphics back on (WebGL needs them). */
function accelerationSteps(): string[] {
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) return ["Open Settings → General → Performance.", "Untick “Use recommended performance settings”, then tick “Use hardware acceleration when available”.", "Restart Firefox and reopen this page."];
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return ["Make sure Safari is up to date.", "In Safari → Settings → Advanced, untick any option that disables WebGL.", "Reopen this page."];
  const name = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : "Chrome";
  return [`Open ${name} Settings → System.`, "Turn on “Use graphics acceleration when available”.", `Click Relaunch, then reopen this page.`];
}

export function RenderNotice({ status, retry }: { status: RenderStatus; retry: () => void }) {
  const [copied, setCopied] = useState(false);
  if (status === "ready") return null;
  if (status !== "failed") return <div className="exp-render-notice" role="status">
    <p>{status === "loading" ? "Lighting up the night…" : "Restoring the 3D night…"}</p>
    {status === "lost" && <Button variant="outline" onClick={retry}>Retry 3D</Button>}
  </div>;
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); }
  };
  return <div className="exp-render-notice" role="alert">
    <p className="exp-render-title">3D graphics are turned off in this browser</p>
    <p className="exp-render-help">This Diwali journey is drawn in 3D, and your browser isn’t allowing it right now. To turn it back on:</p>
    <ol className="exp-render-steps">{accelerationSteps().map((s) => <li key={s}>{s}</li>)}</ol>
    <div className="exp-render-actions">
      <Button variant="outline" onClick={retry}>Try again</Button>
      <Button variant="outline" onClick={copy}>{copied ? "Link copied" : "Copy link"}</Button>
    </div>
    <p className="exp-render-help">Or open the link on your phone or in another browser.</p>
  </div>;
}

export class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error) { console.error("3D renderer failed:", error); this.props.onError(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

/** CSS supports OKLCH; Three.Color only accepts older CSS color models. */
export function nightColor(element: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new THREE.Color(0, 0, 0);
  ctx.fillStyle = getComputedStyle(element).getPropertyValue("--veil").trim();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

/** Keep the same WebGL canvas alive so the browser can restore its resources. */
export function RendererLifecycle({ scene, onStatus }: { scene: number; onStatus: (status: RenderStatus) => void }) {
  const { gl } = useThree();
  const pending = useRef(true);
  const lost = useRef(false);
  useEffect(() => { pending.current = true; onStatus("loading"); }, [scene, onStatus]);
  useEffect(() => {
    const canvas = gl.domElement;
    gl.setClearColor(nightColor(canvas), 1);
    const onLost = (event: Event) => { event.preventDefault(); lost.current = true; pending.current = true; onStatus("lost"); };
    const onRestored = () => { lost.current = false; pending.current = true; gl.setClearColor(nightColor(canvas), 1); onStatus("loading"); };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => { canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored); };
  }, [gl, onStatus]);
  useFrame(() => {
    if (!pending.current || lost.current || gl.getContext().isContextLost()) return;
    pending.current = false;
    requestAnimationFrame(() => { if (!lost.current) onStatus("ready"); });
  });
  return null;
}