import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { RafMode } from "../types";

const COUNT = 5400;
const RING_COUNT = 800;

const MODE_COLORS: Record<RafMode, { primary: string; secondary: string }> = {
  idle: { primary: "#00f0ff", secondary: "#0088ff" },
  listening: { primary: "#c084fc", secondary: "#a855f7" },
  thinking: { primary: "#fbbf24", secondary: "#f59e0b" },
  executing: { primary: "#34d399", secondary: "#10b981" },
  speaking: { primary: "#38bdf8", secondary: "#0284c7" },
};

function QuantumSphere({ amplitude, mode }: { amplitude: number; mode: RafMode }) {
  const points = useRef<THREE.Points>(null);
  const colorTarget = useMemo(() => new THREE.Color(), []);
  const currentColor = useMemo(() => new THREE.Color("#00f0ff"), []);

  const base = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.55;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    return g;
  }, [base]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mesh = points.current;
    if (!mesh) return;

    // Smooth color interpolation
    colorTarget.set(MODE_COLORS[mode].primary);
    currentColor.lerp(colorTarget, 0.08);
    (mesh.material as THREE.PointsMaterial).color.copy(currentColor);

    const spin =
      mode === "listening"
        ? 0.75
        : mode === "speaking"
        ? 1.1
        : mode === "thinking"
        ? 1.9
        : mode === "executing"
        ? 2.2
        : 0.25;

    mesh.rotation.y = t * spin;
    mesh.rotation.x = Math.sin(t * 0.3) * 0.15;
    mesh.rotation.z = Math.cos(t * 0.2) * 0.08;

    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const pulse = 1 + amplitude * 0.65 + (mode === "speaking" ? 0.12 * Math.sin(t * 16) : 0);

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];
      const noise =
        1 +
        amplitude * 0.45 * Math.sin(t * 7 + y * 4 + x * 3) +
        amplitude * 0.22 * Math.cos(t * 10 + z * 5);

      pos.array[ix] = x * noise * pulse;
      pos.array[ix + 1] = y * noise * pulse;
      pos.array[ix + 2] = z * noise * pulse;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geom}>
      <pointsMaterial
        color="#00f0ff"
        size={0.032}
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Outer Gyroscopic Orbital Rings
function OrbitalRings({ mode, amplitude }: { mode: RafMode; amplitude: number }) {
  const ring1 = useRef<THREE.Points>(null);
  const ring2 = useRef<THREE.Points>(null);

  const ringGeom1 = useMemo(() => {
    const pos = new Float32Array(RING_COUNT * 3);
    const radius = 2.05;
    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 2] = radius * Math.sin(angle);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const ringGeom2 = useMemo(() => {
    const pos = new Float32Array(RING_COUNT * 3);
    const radius = 2.45;
    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = radius * Math.sin(angle);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.2) * 0.1;
      ring1.current.rotation.y = t * 0.45;
      const s = 1 + amplitude * 0.2;
      ring1.current.scale.set(s, s, s);
    }
    if (ring2.current) {
      ring2.current.rotation.x = -Math.PI / 3;
      ring2.current.rotation.y = -t * 0.35;
      ring2.current.rotation.z = Math.cos(t * 0.25) * 0.1;
      const s = 1 + amplitude * 0.25;
      ring2.current.scale.set(s, s, s);
    }
  });

  const ringColor = MODE_COLORS[mode].secondary;

  return (
    <>
      <points ref={ring1} geometry={ringGeom1}>
        <pointsMaterial
          color={ringColor}
          size={0.022}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={ring2} geometry={ringGeom2}>
        <pointsMaterial
          color={ringColor}
          size={0.024}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function CoreGlow({ amplitude, mode }: { amplitude: number; mode: RafMode }) {
  const ref = useRef<THREE.Mesh>(null);
  const colorTarget = useMemo(() => new THREE.Color(), []);
  const currentColor = useMemo(() => new THREE.Color("#00f0ff"), []);

  useFrame((state) => {
    if (!ref.current) return;
    colorTarget.set(MODE_COLORS[mode].primary);
    currentColor.lerp(colorTarget, 0.08);
    (ref.current.material as THREE.MeshBasicMaterial).color.copy(currentColor);

    const s = 0.48 + amplitude * 0.45 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.16} />
    </mesh>
  );
}

export default function ParticleOrb({
  amplitude,
  mode,
}: {
  amplitude: number;
  mode: RafMode;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["#060913"]} />
      <CoreGlow amplitude={amplitude} mode={mode} />
      <QuantumSphere amplitude={amplitude} mode={mode} />
      <OrbitalRings amplitude={amplitude} mode={mode} />
      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.04} luminanceSmoothing={0.25} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
