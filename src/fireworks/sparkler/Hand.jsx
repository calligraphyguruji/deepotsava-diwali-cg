import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
function Bone({ from, to, r = 0.15, skin }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to),
      direction = b.clone().sub(a);
    return {
      position: a.add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize(),
      ),
      length: Math.max(0.02, direction.length() - r * 1.1),
    };
  }, [from, to, r]);
  return (
    <mesh position={position} quaternion={quaternion} material={skin}>
      <capsuleGeometry args={[r, length, 5, 10]} />
    </mesh>
  );
}
function Hand() {
  const skin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bc805d",
        roughness: 0.56,
        metalness: 0,
      }),
    [],
  );
  useEffect(() => () => skin.dispose(), [skin]);
  const fingers = [
    [
      [0.48, 0.12, -0.13],
      [0.24, 0.3, 0.19],
      [-0.06, 0.2, 0.39],
      [-0.09, -0.04, 0.34],
    ],
    [
      [0.64, -0.2, -0.12],
      [0.37, -0.02, 0.22],
      [0.06, -0.12, 0.43],
      [0.03, -0.36, 0.35],
    ],
    [
      [0.64, -0.53, -0.12],
      [0.39, -0.37, 0.2],
      [0.12, -0.44, 0.4],
      [0.08, -0.67, 0.32],
    ],
    [
      [0.55, -0.8, -0.15],
      [0.34, -0.68, 0.15],
      [0.15, -0.74, 0.34],
      [0.13, -0.95, 0.27],
    ],
  ];
  return (
    <group>
      <mesh
        position={[0.28, -0.48, -0.22]}
        scale={[0.57, 0.69, 0.28]}
        material={skin}
      >
        <sphereGeometry args={[1, 24, 20]} />
      </mesh>
      <mesh
        position={[-0.04, -0.48, -0.15]}
        rotation={[0, 0, -0.3]}
        scale={[0.33, 0.49, 0.26]}
        material={skin}
      >
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <Bone
        from={[0.28, -0.95, -0.23]}
        to={[0.4, -2.3, -0.38]}
        r={0.34}
        skin={skin}
      />
      {fingers.map((joints, f) => (
        <group key={f}>
          {joints.slice(1).map((point, i) => (
            <Bone
              key={i}
              from={joints[i]}
              to={point}
              r={0.148 - f * 0.012}
              skin={skin}
            />
          ))}
          <mesh
            position={[joints[3][0], joints[3][1] + 0.07, joints[3][2] + 0.1]}
            scale={[0.095 - f * 0.008, 0.13, 0.026]}
            rotation={[0.25, 0, -0.15]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#e1ae91" roughness={0.35} />
          </mesh>
        </group>
      ))}
      <Bone
        from={[-0.2, -0.65, 0.05]}
        to={[-0.35, -0.27, 0.28]}
        r={0.2}
        skin={skin}
      />
      <Bone
        from={[-0.35, -0.27, 0.28]}
        to={[-0.02, -0.05, 0.49]}
        r={0.18}
        skin={skin}
      />
      <mesh
        position={[-0.08, -0.035, 0.63]}
        scale={[0.135, 0.17, 0.026]}
        rotation={[0.2, 0, -0.6]}
      >
        <sphereGeometry args={[1, 14, 12]} />
        <meshStandardMaterial color="#e4b397" roughness={0.35} />
      </mesh>
      <mesh position={[0.33, -1.38, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.022, 6, 32]} />
        <meshStandardMaterial color="#b9343f" roughness={0.8} />
      </mesh>
      <mesh position={[0.34, -1.44, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.012, 6, 32]} />
        <meshStandardMaterial color="#daa45b" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default memo(Hand);
