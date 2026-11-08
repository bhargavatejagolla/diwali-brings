// @react-three/fiber still creates a THREE.Clock internally, which three.js now flags as
// deprecated on every load. It is harmless and outside this app's code, so drop only that line.
const CLOCK_DEPRECATION = "THREE.Clock: This module has been deprecated";

if (typeof window !== "undefined") {
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith(CLOCK_DEPRECATION)) return;
    warn(...args);
  };
}

export {};
