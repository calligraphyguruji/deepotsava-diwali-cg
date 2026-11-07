import { useRef, useMemo, useEffect, useState, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Diya } from "./Rangoli";
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Diya className="hero-fallback" />
    ) : (
      this.props.children
    );
  }
}
function Lamp({ reduced, lowQuality }) {
  const group = useRef(),
    flame = useRef(),
    light = useRef();
  const points = useMemo(
    () => [
      new THREE.Vector2(0, 0.03),
      new THREE.Vector2(0.4, 0.05),
      new THREE.Vector2(0.82, 0.2),
      new THREE.Vector2(1.12, 0.43),
      new THREE.Vector2(1.34, 0.75),
      new THREE.Vector2(1.38, 0.85),
      new THREE.Vector2(1.3, 0.9),
      new THREE.Vector2(1.27, 0.81),
      new THREE.Vector2(1.05, 0.51),
      new THREE.Vector2(0.78, 0.3),
      new THREE.Vector2(0.36, 0.18),
      new THREE.Vector2(0, 0.18),
    ],
    [],
  );
  const flameProfile = useMemo(
    () =>
      [
        [0, -1],
        [0.55, -0.8],
        [0.95, -0.4],
        [1, 0],
        [0.78, 0.4],
        [0.4, 0.8],
        [0, 1.2],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.2) * 0.09;
    flame.current.scale.set(
      1 + Math.sin(t * 8) * 0.045,
      1 + Math.sin(t * 11) * 0.06,
      1,
    );
    flame.current.rotation.z = Math.sin(t * 5) * 0.045;
    light.current.intensity = 12 + Math.sin(t * 12) * 1.3;
  });
  return (
    <group ref={group} rotation={[0.12, 0, -0.07]} position={[0, -0.58, 0]}>
      <mesh>
        <latheGeometry args={[points, lowQuality ? 48 : 96]} />
        <meshStandardMaterial
          color="#a56627"
          metalness={0.8}
          roughness={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.77, 0]}>
        <circleGeometry args={[1.27, 96]} />
        <meshStandardMaterial
          color="#553016"
          metalness={0.7}
          roughness={0.18}
        />
      </mesh>
      {[0.81, 0.86].map((y) => (
        <mesh key={y} rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
          <torusGeometry args={[1.32, 0.028, 12, 96]} />
          <meshStandardMaterial
            color="#e7bc69"
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
      ))}
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.07, 0.49, Math.sin(a) * 1.07]}
            scale={[0.055, 0.15, 0.025]}
            rotation={[0, -a + Math.PI / 2, -0.3]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color="#dda653"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0.84, 0.62]} rotation={[0.6, 0, 0.2]}>
        <capsuleGeometry args={[0.035, 0.26, 4, 8]} />
        <meshStandardMaterial color="#211207" />
      </mesh>
      <group ref={flame} position={[0, 1.2, 0.64]}>
        <mesh scale={[0.18, 0.53, 0.14]} rotation={[0, 0, -0.1]}>
          <latheGeometry args={[flameProfile, 24]} />
          <meshBasicMaterial color="#ff981f" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0.01, -0.08, 0.06]} scale={[0.11, 0.38, 0.09]}>
          <latheGeometry args={[flameProfile, 20]} />
          <meshBasicMaterial color="#ffe4a0" />
        </mesh>
        <mesh position={[0, -0.21, 0.12]} scale={[0.065, 0.19, 0.06]}>
          <latheGeometry args={[flameProfile, 16]} />
          <meshBasicMaterial color="#fffce3" />
        </mesh>
      </group>
      <pointLight
        ref={light}
        position={[0, 1.5, 0.7]}
        color="#ffae42"
        intensity={13}
        distance={8}
      />
      <mesh position={[0, -0.025, 0]} scale={[1.52, 0.07, 1.52]}>
        <cylinderGeometry args={[1, 1, 1, 96]} />
        <meshStandardMaterial
          color="#6d441e"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
function PhoneRenderLoop({ active }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => clearInterval(timer);
  }, [active, invalidate]);
  return null;
}
export default function DiyaScene({ reduced }) {
  const lowQuality =
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
    navigator.connection?.saveData;
  const [visible, setVisible] = useState(true),
    host = useRef();
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    o.observe(host.current);
    return () => o.disconnect();
  }, []);
  return (
    <div
      className="diya-scene"
      ref={host}
      role="img"
      aria-label="A sculpted brass diya with a warm, flickering flame"
    >
      <SceneBoundary>
        <Canvas
          camera={{ position: [0, 2.25, 5.1], fov: 42 }}
          dpr={[1, lowQuality ? 1 : 1.5]}
          frameloop={visible && !reduced && !lowQuality ? "always" : "demand"}
          gl={{
            alpha: true,
            antialias: !lowQuality,
            powerPreference: "low-power",
          }}
          fallback={<Diya className="hero-fallback" />}
        >
          <ambientLight intensity={1.5} color="#e9b97c" />
          <directionalLight
            position={[3, 5, 4]}
            intensity={4}
            color="#ffe7ad"
          />
          <directionalLight
            position={[-4, 2, -1]}
            intensity={3}
            color="#9872cc"
          />
          <PhoneRenderLoop active={visible && !reduced && lowQuality} />
          <Lamp reduced={reduced} lowQuality={lowQuality} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
