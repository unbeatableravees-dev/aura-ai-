import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import type { RafMode } from "../types";

interface VrmAvatarProps {
  mode: RafMode;
  amplitude: number;
  analyserNode: AnalyserNode | null;
  isSpeaking: boolean;
  modelUrl?: string;
}

// -------------------------------------------------------------
// Dark Neon Sci-Fi Background Elements
// -------------------------------------------------------------

// 1. Neon Sci-Fi Grid Floor
function SciFiGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);
  useFrame((state) => {
    if (gridRef.current) {
      // Subtle pulse with time
      const t = state.clock.elapsedTime;
      const mat = gridRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.opacity = 0.28 + Math.sin(t * 1.5) * 0.05;
      }
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[30, 40, "#00f0ff", "#182642"]}
      position={[0, -0.01, 0]}
    />
  );
}

// 2. Holographic Neon Platform under Avatar
function CyberPedestal({ amplitude, mode }: { amplitude: number; mode: RafMode }) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const coreDiscRef = useRef<THREE.Mesh>(null);

  const primaryColor =
    mode === "speaking"
      ? "#38bdf8"
      : mode === "thinking"
      ? "#fbbf24"
      : mode === "listening"
      ? "#c084fc"
      : "#00f0ff";

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.35;
      const s = 1 + amplitude * 0.12;
      outerRingRef.current.scale.set(s, s, s);
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.z = -t * 0.5;
    }
    if (coreDiscRef.current) {
      const mat = coreDiscRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(t * 3) * 0.08 + amplitude * 0.25;
    }
  });

  return (
    <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer Cyan Ring */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[1.05, 1.12, 64]} />
        <meshBasicMaterial
          color={primaryColor}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Mid Magenta Ring */}
      <mesh ref={midRingRef}>
        <ringGeometry args={[0.75, 0.8, 48]} />
        <meshBasicMaterial
          color="#ff007f"
          side={THREE.DoubleSide}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Inner Glowing Hex / Disc */}
      <mesh ref={coreDiscRef}>
        <circleGeometry args={[0.65, 32]} />
        <meshBasicMaterial
          color="#00f0ff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Thin Accent Circle */}
      <mesh>
        <ringGeometry args={[1.35, 1.37, 64]} />
        <meshBasicMaterial
          color="#a855f7"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// 3. Floating Sci-Fi Cyber Motes / Particles
function CyberParticles() {
  const count = 350;
  const meshRef = useRef<THREE.Points>(null);

  const { positions, basePos, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = Math.random() * 4;
      const z = (Math.random() - 0.5) * 8;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      spd[i] = 0.15 + Math.random() * 0.45;
    }
    return { positions: pos, basePos: base, speeds: spd };
  }, [count]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mesh = meshRef.current;
    if (!mesh) return;

    const attr = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx + 1] = (basePos[idx + 1] + t * speeds[i]) % 4.5;
      arr[idx] = basePos[idx] + Math.sin(t * 0.8 + i) * 0.15;
      arr[idx + 2] = basePos[idx + 2] + Math.cos(t * 0.8 + i) * 0.15;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geom}>
      <pointsMaterial
        color="#00f0ff"
        size={0.028}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// -------------------------------------------------------------
// VRM Avatar Model with Idle Breathing, Eye Blinking & Lip-Sync
// -------------------------------------------------------------

function VrmModel({
  url,
  analyserNode,
  isSpeaking,
  mode,
}: {
  url: string;
  analyserNode: AnalyserNode | null;
  isSpeaking: boolean;
  mode: RafMode;
}) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { mouse } = useThree();

  // Lip-sync viseme tracking
  const freqDataRef = useRef<Uint8Array | null>(null);
  const visemesRef = useRef({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });

  // Eye blinking state
  const blinkState = useRef({
    timer: 0,
    nextBlinkTime: 3.0,
    isBlinking: false,
    progress: 0,
    isDouble: false,
  });

  // Load VRM model using GLTFLoader + VRMLoaderPlugin
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const loadedVrm = gltf.userData.vrm as VRM;
        if (!loadedVrm) {
          setLoadError("Failed to extract VRM data");
          return;
        }

        // Optimize model and rotate VRM 0.x to face camera
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        VRMUtils.rotateVRM0(loadedVrm);

        // Ensure all meshes render properly without clipping
        loadedVrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
          if ((obj as THREE.Mesh).isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        // Set natural relaxed idle pose
        const leftArm = loadedVrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
        const rightArm = loadedVrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
        if (leftArm) {
          leftArm.rotation.z = THREE.MathUtils.degToRad(-68);
          leftArm.rotation.x = THREE.MathUtils.degToRad(12);
        }
        if (rightArm) {
          rightArm.rotation.z = THREE.MathUtils.degToRad(68);
          rightArm.rotation.x = THREE.MathUtils.degToRad(12);
        }

        setVrm(loadedVrm);
      },
      (progress) => {
        // loading progress
      },
      (err) => {
        console.error("VRM Load Error:", err);
        setLoadError(String(err.message || err));
      }
    );

    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      }
    };
  }, [url]);

  // Helper to safely set expression blendshape for both VRM 1.0 and 0.x names
  const setExpressionValue = (name: string, value: number) => {
    if (!vrm?.expressionManager) return;

    // Standard VRM 1.0 presets
    vrm.expressionManager.setValue(name, value);

    // VRM 0.x fallback mapping
    const map0: Record<string, string> = {
      aa: "A",
      ih: "I",
      ou: "U",
      ee: "E",
      oh: "O",
      blink: "Blink",
      blinkLeft: "Blink_L",
      blinkRight: "Blink_R",
      happy: "Joy",
      fun: "Fun",
      neutral: "Neutral",
      angry: "Angry",
      sorrow: "Sorrow",
      surprised: "Surprised",
    };

    if (map0[name]) {
      vrm.expressionManager.setValue(map0[name], value);
    }
  };

  // Main animation frame loop (Breathing, Blinking, Lip-Sync, LookAt)
  useFrame((state, delta) => {
    if (!vrm) return;
    const t = state.clock.elapsedTime;
    const exp = vrm.expressionManager;

    // -------------------------------------------------------------
    // 1. Idle Breathing Animation (Subtle chest, spine & shoulders)
    // -------------------------------------------------------------
    const breathFreq = 1.9; // ~18 breaths per minute
    const breathVal = Math.sin(t * breathFreq);

    const chest = vrm.humanoid?.getNormalizedBoneNode("chest");
    if (chest) {
      chest.rotation.x = breathVal * 0.022;
    }
    const spine = vrm.humanoid?.getNormalizedBoneNode("spine");
    if (spine) {
      spine.rotation.x = breathVal * 0.012;
    }
    const leftShoulder = vrm.humanoid?.getNormalizedBoneNode("leftShoulder");
    const rightShoulder = vrm.humanoid?.getNormalizedBoneNode("rightShoulder");
    if (leftShoulder) leftShoulder.rotation.z = breathVal * 0.008;
    if (rightShoulder) rightShoulder.rotation.z = -breathVal * 0.008;

    // -------------------------------------------------------------
    // 2. Idle Head Sway & Mouse Cursor LookAt
    // -------------------------------------------------------------
    const head = vrm.humanoid?.getNormalizedBoneNode("head");
    if (head) {
      // Natural subtle idle drift
      const idleYaw = Math.sin(t * 0.55) * 0.035;
      const idlePitch = Math.cos(t * 0.4) * 0.018;

      // Mouse look tracking with clamping
      const mouseYaw = THREE.MathUtils.clamp(-mouse.x * 0.35, -0.4, 0.4);
      const mousePitch = THREE.MathUtils.clamp(mouse.y * 0.25, -0.3, 0.3);

      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, idleYaw + mouseYaw, 0.06);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, idlePitch + mousePitch, 0.06);

      // Speaking head nod cadence
      if (isSpeaking) {
        head.rotation.x += Math.sin(t * 7) * 0.018;
      }
    }

    // -------------------------------------------------------------
    // 3. Eye Blinking State Machine
    // -------------------------------------------------------------
    const bs = blinkState.current;
    bs.timer += delta;

    if (!bs.isBlinking && bs.timer >= bs.nextBlinkTime) {
      bs.isBlinking = true;
      bs.progress = 0;
      bs.timer = 0;
      bs.nextBlinkTime = 2.4 + Math.random() * 3.8;
      bs.isDouble = Math.random() < 0.18; // 18% double blink chance
    }

    if (bs.isBlinking) {
      bs.progress += delta * 14; // rapid natural eye blink (~150ms)
      if (bs.progress >= Math.PI) {
        if (bs.isDouble) {
          bs.isDouble = false;
          bs.progress = 0;
        } else {
          bs.isBlinking = false;
          setExpressionValue("blink", 0);
        }
      } else {
        const blinkAmount = Math.sin(bs.progress);
        setExpressionValue("blink", blinkAmount);
      }
    }

    // -------------------------------------------------------------
    // 4. Real-time Lip-Sync with ElevenLabs Audio Stream
    // -------------------------------------------------------------
    let targetAa = 0;
    let targetIh = 0;
    let targetOu = 0;
    let targetEe = 0;
    let targetOh = 0;

    if (analyserNode && isSpeaking) {
      if (!freqDataRef.current || freqDataRef.current.length !== analyserNode.frequencyBinCount) {
        freqDataRef.current = new Uint8Array(analyserNode.frequencyBinCount);
      }
      analyserNode.getByteFrequencyData(freqDataRef.current);
      const data = freqDataRef.current;

      // Calculate overall volume & frequency band energy
      let total = 0;
      let lowEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;

      const binCount = data.length;
      for (let i = 0; i < binCount; i++) {
        const val = data[i];
        total += val;
        if (i >= 1 && i <= 5) lowEnergy += val;
        else if (i >= 6 && i <= 16) midEnergy += val;
        else if (i >= 17 && i <= 34) highEnergy += val;
      }

      const avgVolume = total / binCount;

      if (avgVolume > 8) {
        const energy = Math.min(1.0, (avgVolume - 8) / 48);

        // Low freqs -> 'ou' / 'oh' (pursed/rounded mouth)
        const lowNorm = lowEnergy / (5 * 255);
        // Mid freqs -> 'aa' (wide open jaw)
        const midNorm = midEnergy / (11 * 255);
        // High freqs -> 'ih' / 'ee' (wide teeth smile)
        const highNorm = highEnergy / (18 * 255);

        targetAa = Math.min(1.0, midNorm * 1.6 * energy);
        targetOh = Math.min(0.8, lowNorm * 1.3 * energy);
        targetIh = Math.min(0.7, highNorm * 1.4 * energy);
        targetOu = Math.min(0.6, lowNorm * 1.1 * energy);
        targetEe = Math.min(0.5, (midNorm + highNorm) * 0.8 * energy);
      }
    } else if (isSpeaking) {
      // Procedural fallback lip-sync if audio analyser is connecting
      const speechWave = Math.sin(t * 14);
      if (speechWave > 0) {
        targetAa = speechWave * 0.55;
        targetIh = Math.cos(t * 10) > 0 ? 0.35 : 0.1;
      }
    }

    // Smooth lerp visemes to prevent rapid jitter
    const v = visemesRef.current;
    const lerpSpeed = 0.35;
    v.aa = THREE.MathUtils.lerp(v.aa, targetAa, lerpSpeed);
    v.ih = THREE.MathUtils.lerp(v.ih, targetIh, lerpSpeed);
    v.ou = THREE.MathUtils.lerp(v.ou, targetOu, lerpSpeed);
    v.ee = THREE.MathUtils.lerp(v.ee, targetEe, lerpSpeed);
    v.oh = THREE.MathUtils.lerp(v.oh, targetOh, lerpSpeed);

    setExpressionValue("aa", v.aa);
    setExpressionValue("ih", v.ih);
    setExpressionValue("ou", v.ou);
    setExpressionValue("ee", v.ee);
    setExpressionValue("oh", v.oh);

    // Expressive mood blend: friendly anime smile when speaking or happy
    if (isSpeaking) {
      setExpressionValue("happy", 0.35);
      setExpressionValue("fun", 0.25);
    } else if (mode === "thinking") {
      setExpressionValue("surprised", 0.15);
      setExpressionValue("happy", 0.0);
    } else {
      setExpressionValue("happy", 0.15);
      setExpressionValue("fun", 0.0);
    }

    // Update expressions and spring bone physics
    exp?.update();
    vrm.update(delta);
  });

  if (loadError) {
    return (
      <group position={[0, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#ff0055" wireframe />
        </mesh>
      </group>
    );
  }

  return vrm ? <primitive object={vrm.scene} position={[0, 0, 0]} /> : null;
}

// -------------------------------------------------------------
// Main Canvas Component with Dark Neon Sci-Fi Stage & Lighting
// -------------------------------------------------------------

export default function VrmAvatar({
  mode,
  amplitude,
  analyserNode,
  isSpeaking,
  modelUrl = "./avatar.vrm",
}: VrmAvatarProps) {
  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 1.22, 1.55], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#040711"]} />
        <fogExp2 attach="fog" args={["#040711", 0.09]} />

        {/* Sci-Fi Lighting Setup */}
        {/* Deep Slate Ambient */}
        <ambientLight intensity={0.7} color="#10182b" />

        {/* Neon Cyan Key Light */}
        <directionalLight
          position={[-1.5, 2.4, 2.0]}
          intensity={1.5}
          color="#00f0ff"
        />

        {/* Neon Magenta Hair & Rim Light (Cyberpunk Silhouette) */}
        <directionalLight
          position={[1.8, 2.5, -2.0]}
          intensity={2.2}
          color="#ff007f"
        />

        {/* Soft Warm Facial Fill Light for Anime Skin Glow */}
        <directionalLight
          position={[0, 1.4, 2.2]}
          intensity={0.65}
          color="#fff0e6"
        />

        {/* Platform Uplight */}
        <pointLight
          position={[0, 0.1, 0]}
          intensity={1.2}
          color="#00f0ff"
          distance={3}
        />

        {/* Dark Neon Sci-Fi Environment */}
        <SciFiGrid />
        <CyberPedestal amplitude={amplitude} mode={mode} />
        <CyberParticles />

        {/* 3D Anime Avatar with VRM */}
        <VrmModel
          url={modelUrl}
          analyserNode={analyserNode}
          isSpeaking={isSpeaking}
          mode={mode}
        />

        {/* Restricted Orbit Controls for Gentle Viewing Angles */}
        <OrbitControls
          target={[0, 1.08, 0]}
          enablePan={false}
          minDistance={0.9}
          maxDistance={3.2}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          dampingFactor={0.08}
        />

        {/* Neon Sci-Fi Bloom Post-Processing */}
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
