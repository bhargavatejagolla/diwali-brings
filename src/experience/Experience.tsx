import "./quietWarnings";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PersonalWish } from "./PersonalWish";
import { RenderNotice, RendererLifecycle, SceneBoundary, type RenderStatus } from "./SceneRenderer";
import { FINALE } from "@/lib/fireworks";
import { audio } from "./audio";
import { FirstLight } from "./scenes/FirstLight";
import { GardenScene } from "./scenes/GardenScene";
import { LetterScene } from "./scenes/LetterScene";
import { RangoliScene } from "./scenes/RangoliScene";
import { SkyScene, type SkyApi } from "./scenes/SkyScene";

const SCENES = ["The First Light", "Rangoli of Wishes", "Garden of Light", "A Quiet Wish", "Celestial Sky"];
const WISHES = [
  { ring: "Peace", text: "Peace that gently stills every anxious thought." },
  { ring: "Joy", text: "Joy that arrives unexpectedly in quiet moments." },
  { ring: "Laughter", text: "Laughter that stays long after the conversation ends." },
  { ring: "Warmth", text: "Warmth that guides you through every tomorrow." },
  { ring: "Beginnings", text: "Beautiful beginnings waiting for you in the year ahead." },
];

export function Experience() {
  const [scene, setScene] = useState(0);
  const [shown, setShown] = useState(0); // scene currently rendered (lags during fade)
  const [fading, setFading] = useState(false);
  const [sound, setSound] = useState(false);
  const [awake, setAwake] = useState(false);
  const [wish, setWish] = useState(0);
  const [discovered, setDiscovered] = useState(false);
  const [letterAll, setLetterAll] = useState(false);
  const [skyWish, setSkyWish] = useState("");
  const [released, setReleased] = useState<{ id: number; text: string }[]>([]);
  const [finaleOn, setFinaleOn] = useState(false);
  const [finaleMsg, setFinaleMsg] = useState(false);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("loading");
  const [rendererKey, setRendererKey] = useState(0);
  const sky = useRef<SkyApi | null>(null);
  const flash = useRef(0);
  const timers = useRef<number[]>([]);
  const transition = useRef<number | undefined>(undefined);
  const retry3D = () => { setRenderStatus("loading"); setRendererKey((key) => key + 1); };

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  const go = useCallback((n: number) => {
    if (n < 0 || n >= SCENES.length || n === scene) return;
    setScene(n); setFading(true);
    clearTimers();
    clearTimeout(transition.current);
    transition.current = window.setTimeout(() => { setShown(n); setFading(false); }, 650);
    audio.chime(440 + n * 66);
  }, [scene]);

  useEffect(() => {
    if (shown === 4) {
      setFinaleOn(false); setFinaleMsg(false);
      later(700, () => sky.current?.launch(0, 26, "chrysanthemum", "gold", undefined, 1.1));
      later(1400, () => { sky.current?.launch(-14, 22, "peony", "teal", undefined, 0.8); sky.current?.launch(14, 22, "glitter", "red", undefined, 0.9); });
    }
    if (shown === 2) setDiscovered(false);
    if (shown === 3) setLetterAll(false);
    return clearTimers;
  }, [shown]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.closest('[role="dialog"]')) return;
      if (e.key === "ArrowRight") go(scene + 1);
      if (e.key === "ArrowLeft") go(scene - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go, scene]);

  useEffect(() => () => { clearTimers(); clearTimeout(transition.current); audio.setEnabled(false); }, []);

  const toggleSound = () => { const v = !sound; setSound(v); audio.setEnabled(v); };
  const awaken = () => { if (!sound) { setSound(true); audio.setEnabled(true); } setAwake(true); audio.chime(523); };

  const finale = () => {
    if (finaleOn) return;
    setFinaleOn(true); setFinaleMsg(false);
    FINALE.forEach(([t, x, y, z, k, c, s]) => later(t * 1000, () => sky.current?.launch(x, y, k, c, z, s)));
    later(5200, () => setFinaleMsg(true));
    later(16000, () => setFinaleOn(false));
  };

  const releaseWish = (text: string) => {
    if (!text) return;
    const id = Date.now();
    setReleased([{ id, text }]);
    setSkyWish("");
    later(2200, () => { sky.current?.launch(0, 26, "multi", undefined, -24, 1.2); });
    later(2700, () => { sky.current?.launch(-10, 24, "willow", "gold"); sky.current?.launch(10, 24, "willow", "pink"); });
    later(14000, () => setReleased((r) => r.filter((w) => w.id !== id)));
  };
  const release = (e: React.FormEvent) => { e.preventDefault(); releaseWish(skyWish.trim().slice(0, 80)); };

  return (
    <div className="exp-root">
      <div className="exp-canvas" data-render-status={renderStatus} data-scene-ready={renderStatus === "ready" ? shown : undefined}>
        <SceneBoundary key={rendererKey} onError={() => setRenderStatus("failed")}><Canvas
          dpr={[1, 1.5]}
          camera={{ fov: 42, near: 0.05, far: 800, position: [0, 1.5, 3.4] }}
          gl={{ alpha: false, antialias: false, powerPreference: "default", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        >
          <Suspense fallback={null}>
            <RendererLifecycle scene={shown} onStatus={setRenderStatus} />
            {shown === 0 && <FirstLight awake={awake} />}
            {shown === 1 && <RangoliScene wish={wish} />}
            {shown === 2 && <GardenScene discovered={discovered} />}
            {shown === 3 && <LetterScene />}
            {shown === 4 && <SkyScene apiRef={sky} flash={flash} ambient={!finaleOn} />}
            <EffectComposer multisampling={0} frameBufferType={THREE.UnsignedByteType}>
              <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.7} />
              <Vignette offset={0.3} darkness={0.75} />
            </EffectComposer>
          </Suspense>
        </Canvas></SceneBoundary>
        <RenderNotice status={renderStatus} retry={retry3D} />
      </div>
      <div className={`exp-veil ${fading ? "is-on" : ""}`} aria-hidden />

      <header className="exp-top">
        <div className="exp-brand-wrap">
          <svg className="exp-love-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="url(#exp-love-grad)"
            />
            <defs>
              <linearGradient id="exp-love-grad" x1="2" y1="3" x2="22" y2="21.35" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF4A70" />
                <stop offset="0.6" stopColor="#FFA048" />
                <stop offset="1" stopColor="#FFD15C" />
              </linearGradient>
            </defs>
          </svg>
          <span className="exp-brand">A Thousand Lights, One Wish</span>
        </div>
        <button className="exp-chip" onClick={toggleSound} aria-pressed={sound}>
          <span className={`exp-dot ${sound ? "is-on" : ""}`} /> Sound {sound ? "on" : "off"}
        </button>
      </header>

      <main className="exp-stage" key={shown} hidden={renderStatus !== "ready"}>
        {shown === 0 && (
          <section className="exp-panel exp-panel--low">
            <p className="exp-eyebrow">Diwali · for Dharvi Shravya</p>
            <h1 className="exp-title">On a night of a thousand lights</h1>
            <p className="exp-lede">may a little extra brightness find its way to you.</p>
            {!awake ? (
              <button className="exp-btn" onClick={awaken}>Light the diya</button>
            ) : (
              <button className="exp-btn exp-btn--ghost" onClick={() => go(1)}>Follow the light →</button>
            )}
          </section>
        )}

        {shown === 1 && (
          <section className="exp-panel exp-panel--side">
            <p className="exp-eyebrow">Rangoli of wishes</p>
            <h2 className="exp-h2">Choose a ring</h2>
            <div className="exp-wishes" role="radiogroup" aria-label="Wishes">
              {WISHES.map((w, i) => (
                <button key={w.ring} role="radio" aria-checked={wish === i} className={`exp-wish ${wish === i ? "is-on" : ""}`} onClick={() => { setWish(i); audio.chime(523 + i * 60); }}>
                  {w.ring}
                </button>
              ))}
            </div>
            <p className="exp-quote" key={wish}>“{WISHES[wish].text}”</p>
            <button className="exp-btn exp-btn--ghost" onClick={() => go(2)}>Walk into the garden →</button>
          </section>
        )}

        {shown === 2 && (
          <section className="exp-panel exp-panel--low">
            {!discovered ? (
              <>
                <p className="exp-eyebrow">Garden of light</p>
                <h2 className="exp-h2">Walk toward the palace</h2>
                <button className="exp-btn" onClick={() => { setDiscovered(true); audio.chime(660); }}>Follow the lanterns</button>
              </>
            ) : (
              <div className="exp-reveal">
                <p className="exp-eyebrow">Dedicated to Dharvi Shravya</p>
                <p className="exp-quote exp-quote--lg">“In the warmest corner of this celebration, some people naturally bring more light than a thousand lamps.”</p>
                <button className="exp-btn exp-btn--ghost" onClick={() => go(3)}>Read her letter →</button>
              </div>
            )}
          </section>
        )}

        {shown === 3 && (
          <section className="exp-letter-wrap">
            <article className={`exp-letter ${letterAll ? "is-all" : ""}`}>
              <p className="exp-letter-greet">Dear Shravya,</p>
              <p>Diwali has always been about the quiet lights we bring into each other’s lives. Thinking back on this year, having you as a friend has been one of its most genuine and comforting blessings.</p>
              <p>May your days be filled with the kind of happiness that arrives unexpectedly, the kind of laughter that stays a little longer, and the kind of peace that makes everything feel right.</p>
              <p>May every little light you see tonight remind you of how appreciated and rare you are. Wishing you and your loved ones a celebration as radiant and wonderful as you are.</p>
              <p className="exp-letter-sign">With all warmth and light</p>
            </article>
            <div className="exp-row">
              {!letterAll && <button className="exp-btn exp-btn--ghost" onClick={() => setLetterAll(true)}>Show all</button>}
              <button className="exp-btn" onClick={() => go(4)}>Celebrate the sky →</button>
            </div>
          </section>
        )}

        {shown === 4 && (
          <>
            {finaleMsg && (
              <div className="exp-finale" role="status">
                <p className="exp-eyebrow">Shubh Deepavali</p>
                <p className="exp-finale-text">May this Diwali bring you more reasons to smile than you can count.</p>
              </div>
            )}
            {released.map((w) => <p key={w.id} className="exp-rising">{w.text}</p>)}
            <section className="exp-skybar">
              <PersonalWish onRelease={releaseWish} />
              <form className="exp-wishform" onSubmit={release}>
                <label htmlFor="wish" className="sr-only">Your wish</label>
                <input id="wish" value={skyWish} onChange={(e) => setSkyWish(e.target.value)} maxLength={80} placeholder="Write a wish for the sky…" className="exp-input" />
                <button className="exp-btn" type="submit" disabled={!skyWish.trim()}>Release</button>
              </form>
              <div className="exp-row">
                <button className="exp-chip" onClick={() => sky.current?.launch((Math.random() - 0.5) * 30, 20 + Math.random() * 8)}>Launch</button>
                <button className="exp-chip exp-chip--gold" onClick={finale} disabled={finaleOn}>{finaleOn ? "Celebrating…" : "Grand finale"}</button>
              </div>
            </section>
          </>
        )}
      </main>

      <nav className="exp-nav" aria-label="Scenes">
        <button className="exp-arrow" onClick={() => go(scene - 1)} disabled={scene === 0} aria-label="Previous scene">←</button>
        <ol>
          {SCENES.map((s, i) => (
            <li key={s}>
              <button className={`exp-step ${scene === i ? "is-on" : ""}`} onClick={() => go(i)} aria-current={scene === i ? "step" : undefined}>
                <span className="exp-step-num">0{i + 1}</span>
                <span className="exp-step-name">{s}</span>
              </button>
            </li>
          ))}
        </ol>
        <button className="exp-arrow" onClick={() => go(scene + 1)} disabled={scene === SCENES.length - 1} aria-label="Next scene">→</button>
      </nav>
    </div>
  );
}
