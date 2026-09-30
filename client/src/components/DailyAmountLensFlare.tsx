import { useEffect, useRef } from "react";

const FLARE_DURATION_MS = 4400;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / (edge1 - edge0));
  return progress * progress * (3 - 2 * progress);
}

function easeInOutSine(value: number) {
  return (1 - Math.cos(Math.PI * value)) / 2;
}

export function DailyAmountLensFlare() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const ambient = layer.querySelector<HTMLElement>(".da-pin-flare-ambient");
    const track = layer.querySelector<HTMLElement>(".da-pin-flare-track");
    if (!ambient || !track) {
      throw new Error("Daily Amount lens flare layers are missing.");
    }

    const halo = ambient.querySelector<HTMLElement>(".da-pin-flare-halo");
    const softStreak = ambient.querySelector<HTMLElement>(".da-pin-flare-streak-soft");
    const core = track.querySelector<HTMLElement>(".da-pin-flare-core");
    const streak = track.querySelector<HTMLElement>(".da-pin-flare-streak");
    const dust = track.querySelector<HTMLElement>(".da-pin-flare-dust");
    if (!halo || !softStreak || !core || !streak || !dust) {
      throw new Error("Daily Amount lens flare elements are incomplete.");
    }

    const rings = Array.from(track.querySelectorAll<HTMLElement>("[data-flare-ring]")).map((element) => ({
      element,
      strength: Number(element.dataset.flareRing ?? 0.5),
      rotation: Number(element.dataset.flareRotation ?? 0),
    }));
    const ghosts = Array.from(layer.querySelectorAll<HTMLElement>("[data-flare-ghost]")).map((element) => ({
      element,
      factor: Number(element.dataset.flareFactor ?? 0.5),
      strength: Number(element.dataset.flareStrength ?? 0.3),
    }));
    const animatedNodes = [
      ambient,
      halo,
      softStreak,
      track,
      core,
      streak,
      dust,
      ...rings.map(({ element }) => element),
      ...ghosts.map(({ element }) => element),
    ];
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let startedAt: number | null = null;
    let disposed = false;

    const clearAnimationStyles = () => {
      animatedNodes.forEach((element) => {
        element.style.removeProperty("transform");
        element.style.removeProperty("opacity");
        element.style.removeProperty("filter");
        element.classList.remove("da-pin-flare-running");
      });
    };

    const animate = (timestamp: number) => {
      if (disposed) return;
      if (startedAt === null) startedAt = timestamp;

      const elapsed = timestamp - startedAt;
      const timeProgress = clamp(elapsed / FLARE_DURATION_MS);
      const pathProgress = easeInOutSine(timeProgress);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const margin = Math.max(64, width * 0.08);
      const x = -margin + (width + margin * 2) * pathProgress;
      const curve = -Math.min(height * 0.025, 20) * Math.sin(Math.PI * pathProgress);
      const y = height * (0.44 + 0.12 * pathProgress) + curve;
      const pathSlope = height * 0.12 -
        Math.min(height * 0.025, 20) * Math.PI * Math.cos(Math.PI * pathProgress);
      const streakAngle = clamp(Math.atan2(pathSlope, width + margin * 2) * (180 / Math.PI), -2.2, 2.2);

      const peak = Math.exp(-Math.pow((timeProgress - 0.5) / 0.16, 2));
      const fadeIn = smoothstep(0, 0.13, timeProgress);
      const fadeOut = 1 - smoothstep(0.86, 1, timeProgress);
      const envelope = fadeIn * fadeOut;
      const intensity = width < 640 ? 0.55 : width < 900 ? 0.86 : 1;

      ambient.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.96 + peak * 0.06})`;
      ambient.style.opacity = String(envelope * (0.2 + peak * 0.16) * intensity);
      halo.style.opacity = String(0.62 + peak * 0.18);
      softStreak.style.opacity = String(0.18 + peak * 0.34);

      track.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${streakAngle}deg) scale(${0.94 + peak * 0.1})`;
      track.style.opacity = String(envelope * (0.25 + peak * 0.72) * intensity);
      track.style.filter = `brightness(${0.82 + peak * (width < 640 ? 0.35 : 0.5)})`;
      core.style.opacity = String(0.18 + peak * 0.82);
      streak.style.opacity = String(0.2 + peak * 0.8);
      dust.style.opacity = String(envelope * (0.08 + peak * 0.2));

      rings.forEach(({ element, strength, rotation }) => {
        element.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotation + streakAngle * 0.25}deg) scale(${0.88 + peak * 0.2})`;
        element.style.opacity = String(envelope * (0.025 + peak * 0.105) * strength);
      });

      const centerX = width / 2;
      const centerY = height / 2;
      ghosts.forEach(({ element, factor, strength }) => {
        const ghostX = centerX - (x - centerX) * factor;
        const ghostY = centerY - (y - centerY) * factor;
        element.style.transform = `translate3d(${ghostX}px, ${ghostY}px, 0) translate(-50%, -50%) rotate(${streakAngle * factor}deg) scale(${0.9 + peak * 0.12})`;
        element.style.opacity = String(envelope * (0.055 + peak * 0.15) * strength * intensity);
      });

      if (timeProgress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = 0;
        clearAnimationStyles();
      }
    };

    const startAnimation = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      startedAt = null;
      clearAnimationStyles();
      if (motionPreference.matches || disposed) return;

      animatedNodes.forEach((element) => element.classList.add("da-pin-flare-running"));
      frameId = window.requestAnimationFrame(animate);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) startAnimation();
    };
    const handleMotionPreferenceChange = () => startAnimation();

    window.addEventListener("pageshow", handlePageShow);
    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    startAnimation();

    return () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("pageshow", handlePageShow);
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      clearAnimationStyles();
    };
  }, []);

  return (
    <div ref={layerRef} className="da-pin-flare-layer" aria-hidden="true">
      <div className="da-pin-flare-ambient">
        <span className="da-pin-flare-halo" />
        <span className="da-pin-flare-streak-soft" />
      </div>
      <span className="da-pin-flare-ghost da-pin-flare-ghost-one" data-flare-ghost data-flare-factor="0.28" data-flare-strength="0.44" />
      <span className="da-pin-flare-ghost da-pin-flare-ghost-two" data-flare-ghost data-flare-factor="0.46" data-flare-strength="0.34" />
      <span className="da-pin-flare-ghost da-pin-flare-ghost-three" data-flare-ghost data-flare-factor="0.64" data-flare-strength="0.26" />
      <span className="da-pin-flare-ghost da-pin-flare-ghost-four" data-flare-ghost data-flare-factor="0.82" data-flare-strength="0.2" />
      <span className="da-pin-flare-ghost da-pin-flare-ghost-five" data-flare-ghost data-flare-factor="1.02" data-flare-strength="0.16" />
      <div className="da-pin-flare-track">
        <span className="da-pin-flare-streak" />
        <span className="da-pin-flare-core" />
        <span className="da-pin-flare-ring da-pin-flare-ring-one" data-flare-ring="0.72" data-flare-rotation="-12" />
        <span className="da-pin-flare-ring da-pin-flare-ring-two" data-flare-ring="0.48" data-flare-rotation="8" />
        <span className="da-pin-flare-ring da-pin-flare-ring-three" data-flare-ring="0.34" data-flare-rotation="21" />
        <span className="da-pin-flare-dust" />
      </div>
    </div>
  );
}