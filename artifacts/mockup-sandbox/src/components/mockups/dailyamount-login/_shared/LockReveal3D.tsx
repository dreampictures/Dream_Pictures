import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import type * as ThreeTypes from "three";

type ThreeModule = typeof import("three");

const REVEAL_DURATION_MS = 2150;

function easeOutBack(value: number) {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * Math.pow(value - 1, 3) + overshoot * Math.pow(value - 1, 2);
}

function createBodyShape(THREE: ThreeModule) {
  const shape = new THREE.Shape();
  const left = -0.64;
  const right = 0.64;
  const bottom = -0.46;
  const top = 0.46;
  const radius = 0.14;

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  shape.closePath();

  return shape;
}

function createKeyholeShape(THREE: ThreeModule) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.065, 0.12);
  shape.lineTo(0.065, 0.12);
  shape.lineTo(0.13, -0.2);
  shape.quadraticCurveTo(0, -0.31, -0.13, -0.2);
  shape.closePath();
  return shape;
}

export function LockReveal3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let frameId = 0;
    let renderer: ThreeTypes.WebGLRenderer | null = null;
    let scene: ThreeTypes.Scene | null = null;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglReady(false);
    };

    const startRenderer = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(80, 80, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camera.position.set(0, 0.05, 4.25);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.HemisphereLight(0xa8c6ff, 0x241507, 2.2));

        const keyLight = new THREE.DirectionalLight(0xffd477, 5.2);
        keyLight.position.set(-2.8, 3.5, 4);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(256, 256);
        keyLight.shadow.bias = -0.0002;
        scene.add(keyLight);

        const blueRim = new THREE.PointLight(0x67bfff, 15, 8);
        blueRim.position.set(2, 0.65, -1.8);
        scene.add(blueRim);

        const warmFill = new THREE.PointLight(0xffe8b0, 13, 7);
        warmFill.position.set(-1.7, 1.2, 2.5);
        scene.add(warmFill);

        const pivot = new THREE.Group();
        const lockModel = new THREE.Group();
        lockModel.position.y = -0.285;
        pivot.add(lockModel);
        scene.add(pivot);

        const gold = new THREE.MeshPhysicalMaterial({
          color: 0xe3aa39,
          metalness: 0.56,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          emissive: 0x382000,
          emissiveIntensity: 0.17,
        });
        const shackleGold = new THREE.MeshPhysicalMaterial({
          color: 0xffd36a,
          metalness: 0.42,
          roughness: 0.18,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          emissive: 0x412500,
          emissiveIntensity: 0.12,
        });

        const shackleCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.38, 0.31, -0.035),
          new THREE.Vector3(-0.38, 0.65, -0.035),
          new THREE.Vector3(-0.31, 0.91, -0.035),
          new THREE.Vector3(0, 1.03, -0.035),
          new THREE.Vector3(0.31, 0.91, -0.035),
          new THREE.Vector3(0.38, 0.65, -0.035),
          new THREE.Vector3(0.38, 0.31, -0.035),
        ], false, "centripetal");
        const shackle = new THREE.Mesh(
          new THREE.TubeGeometry(shackleCurve, 56, 0.082, 12, false),
          shackleGold,
        );
        shackle.castShadow = true;
        lockModel.add(shackle);

        const bodyGeometry = new THREE.ExtrudeGeometry(createBodyShape(THREE), {
          depth: 0.22,
          steps: 1,
          bevelEnabled: true,
          bevelSegments: 5,
          bevelThickness: 0.035,
          bevelSize: 0.035,
          curveSegments: 14,
        });
        bodyGeometry.center();
        const body = new THREE.Mesh(bodyGeometry, gold);
        body.castShadow = true;
        body.receiveShadow = true;
        lockModel.add(body);

        const keyholeMaterial = new THREE.MeshStandardMaterial({
          color: 0x201505,
          metalness: 0.18,
          roughness: 0.58,
          emissive: 0x130b02,
          emissiveIntensity: 0.22,
        });
        const keyholeCircle = new THREE.Mesh(
          new THREE.CircleGeometry(0.115, 32),
          keyholeMaterial,
        );
        keyholeCircle.position.set(0, 0.12, 0.151);
        lockModel.add(keyholeCircle);

        const keyholeStem = new THREE.Mesh(
          new THREE.ShapeGeometry(createKeyholeShape(THREE)),
          keyholeMaterial,
        );
        keyholeStem.position.z = 0.152;
        lockModel.add(keyholeStem);

        const glintMaterial = new THREE.MeshBasicMaterial({
          color: 0xfff4ce,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.72), glintMaterial);
        glint.position.set(-0.46, -0.01, 0.17);
        lockModel.add(glint);

        const render = () => renderer?.render(scene!, camera);
        const setRestingPose = () => {
          pivot.rotation.set(0, 0, 0);
          pivot.position.set(0, 0, 0);
          pivot.scale.setScalar(1);
          keyLight.position.x = -2.8;
          glintMaterial.opacity = 0;
          render();
        };

        const startAnimation = () => {
          if (frameId) window.cancelAnimationFrame(frameId);
          frameId = 0;

          if (motionPreference.matches || disposed) {
            setRestingPose();
            return;
          }

          pivot.rotation.set(-0.34, Math.PI * 0.55, 0.08);
          pivot.position.set(0, -0.13, 0);
          pivot.scale.setScalar(0.82);
          glintMaterial.opacity = 0;

          let startedAt: number | null = null;
          const animate = (timestamp: number) => {
            if (disposed) return;
            if (startedAt === null) startedAt = timestamp;

            const progress = Math.min((timestamp - startedAt) / REVEAL_DURATION_MS, 1);
            const eased = easeOutBack(progress);
            pivot.rotation.y = Math.PI * 0.55 * (1 - eased);
            pivot.rotation.x = -0.34 * (1 - eased) + Math.sin(progress * Math.PI) * 0.045;
            pivot.rotation.z = 0.08 * (1 - eased);
            pivot.position.y = -0.13 * (1 - eased);
            pivot.scale.setScalar(0.82 + 0.18 * eased);

            keyLight.position.x = -2.8 + progress * 5.6;
            keyLight.intensity = 4.8 + Math.sin(progress * Math.PI) * 1.5;

            const glintProgress = (progress - 0.38) / 0.46;
            if (glintProgress >= 0 && glintProgress <= 1) {
              glint.position.x = -0.46 + glintProgress * 0.92;
              glintMaterial.opacity = Math.sin(glintProgress * Math.PI) * 0.38;
            } else {
              glintMaterial.opacity = 0;
            }

            render();
            if (progress < 1) {
              frameId = window.requestAnimationFrame(animate);
            } else {
              frameId = 0;
              setRestingPose();
            }
          };

          frameId = window.requestAnimationFrame(animate);
        };

        setWebglReady(true);
        startAnimation();

        const handlePageShow = (event: PageTransitionEvent) => {
          if (event.persisted) startAnimation();
        };
        const handleMotionChange = () => startAnimation();
        window.addEventListener("pageshow", handlePageShow);
        motionPreference.addEventListener("change", handleMotionChange);
        canvas.addEventListener("webglcontextlost", handleContextLost);

        canvas.dataset.lockRevealCleanup = "attached";
        cleanupListeners = () => {
          window.removeEventListener("pageshow", handlePageShow);
          motionPreference.removeEventListener("change", handleMotionChange);
          canvas.removeEventListener("webglcontextlost", handleContextLost);
        };
      } catch (error) {
        if (!disposed) {
          console.warn("3D lock reveal unavailable; keeping the static lock icon.", error);
        }
      }
    };

    let cleanupListeners = () => {};
    void startRenderer();

    return () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      cleanupListeners();
      scene?.traverse((object) => {
        const mesh = object as ThreeTypes.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      });
      renderer?.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`da-pin-lock-canvas${webglReady ? " is-ready" : ""}`}
        aria-hidden="true"
      />
      <Lock
        size={34}
        strokeWidth={3}
        className={`da-pin-lock-fallback text-amber-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]${webglReady ? " is-hidden" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}