import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import Hand from "./Hand";
import { RGB, SPARKLER_COLORS } from "./model.js";
const pointVertex = `attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;uniform float uDpr;void main(){vColor=color;vAlpha=aAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uDpr;}`;
const pointFragment =
  `varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float glow=exp(-r*r*5.);float core=exp(-r*r*38.);gl_FragColor=vec4(vColor*(1.5+core*1.4)+vec3(core*.45),(glow*.32+core*.8)*vAlpha);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(
    ";#include",
    ";\n#include",
  );
const smokeFragment =
  `varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vColor,exp(-r*r*4.)*vAlpha);#include <colorspace_fragment>\n}`.replace(
    ";#include",
    ";\n#include",
  );
const ribbonVertex = `attribute float aAlpha;varying vec3 vColor;varying float vAlpha;varying vec2 vUv;void main(){vColor=color;vAlpha=aAlpha;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const ribbonFragment =
  `varying vec3 vColor;varying float vAlpha;varying vec2 vUv;void main(){float a=exp(-pow(abs(vUv.y-.5)*5.,2.));gl_FragColor=vec4(vColor*1.9,a*vAlpha);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(
    ";#include",
    ";\n#include",
  );
function geometry(size, { points = false, ribbon = false } = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(size * 3), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  g.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(size * 3), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  if (points)
    g.setAttribute(
      "aSize",
      new THREE.BufferAttribute(new Float32Array(size), 1).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
  if (points || ribbon)
    g.setAttribute(
      "aAlpha",
      new THREE.BufferAttribute(new Float32Array(size), 1).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
  if (ribbon)
    g.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(size * 2), 2).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
  return g;
}
function changed(g, count) {
  for (const a of Object.values(g.attributes)) a.needsUpdate = true;
  g.setDrawRange(0, count);
}
function Composer({ low, model, canvasRef }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef(null);
  useEffect(() => {
    if (low) return;
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        0.5,
        0.5,
        0.85,
      ),
    );
    c.addPass(new OutputPass());
    composer.current = c;
    return () => {
      composer.current = null;
      for (const pass of c.passes) pass.dispose?.();
      c.dispose();
    };
  }, [gl, scene, camera, low]);
  useEffect(() => {
    composer.current?.setSize(size.width, size.height);
  }, [size.width, size.height, low]);
  useFrame(() => {
    if (composer.current) composer.current.render();
    else gl.render(scene, camera);
    if (model.captureNext) {
      const request = model.captureNext;
      model.captureNext = null;
      gl.domElement.toBlob(
        (blob) =>
          blob
            ? request.resolve(blob)
            : request.reject(
                new Error("Image capture failed. Please try again."),
              ),
        "image/png",
      );
    }
  }, 1);
  useEffect(() => {
    canvasRef.current = gl.domElement;
    return () => {
      canvasRef.current = null;
    };
  }, [gl, canvasRef]);
  return null;
}
export default function SparklerScene({
  model,
  low,
  reduced,
  paused,
  background,
  onTick,
  onReady,
  canvasRef,
}) {
  const { camera, size, invalidate, gl } = useThree(),
    backdropMesh = useRef(),
    hand = useRef(),
    coat = useRef(),
    charred = useRef(),
    tip = useRef(),
    light = useRef(),
    lastSnapshot = useRef(-1),
    wasBurning = useRef(false);
  const latest = useRef();
  latest.current = { paused, onTick, reduced };
  const buffers = useMemo(
    () => ({
      points: geometry(2400, { points: true }),
      lines: geometry(4800),
      ribbons: geometry(5000 * 6, { ribbon: true }),
      smoke: geometry(40, { points: true }),
    }),
    [],
  );
  const pointMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        vertexColors: true,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uDpr: { value: 1 } },
      }),
    [],
  );
  const ribbonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        vertexColors: true,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const smokeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: smokeFragment,
        vertexColors: true,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        uniforms: { uDpr: { value: 1 } },
      }),
    [],
  );
  const backdrop = useMemo(() => {
      const c = document.createElement("canvas");
      c.width = 2;
      c.height = 2;
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []),
    backdropVersion = useRef("");
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.left = -6 * aspect;
    camera.right = 6 * aspect;
    camera.top = 6;
    camera.bottom = -6;
    camera.updateProjectionMatrix();
    model.resize(aspect);
    backdropMesh.current.scale.set(12 * aspect, 12, 1);
    pointMaterial.uniforms.uDpr.value = gl.getPixelRatio();
    smokeMaterial.uniforms.uDpr.value = gl.getPixelRatio();
    invalidate();
  }, [
    size.width,
    size.height,
    low,
    camera,
    model,
    gl,
    pointMaterial,
    smokeMaterial,
    invalidate,
  ]);
  useEffect(() => {
    model.wake = invalidate;
    onReady();
    const timer = setInterval(
      () => {
        if (!document.hidden && !latest.current.paused && model.active)
          invalidate();
      },
      1000 / (low ? 30 : 60),
    );
    return () => {
      clearInterval(timer);
      model.wake = () => {};
    };
  }, [model, invalidate, low, onReady]);
  useEffect(() => {
    invalidate();
  }, [paused, low, reduced, invalidate]);
  useEffect(
    () => () => {
      for (const g of Object.values(buffers)) g.dispose();
      pointMaterial.dispose();
      ribbonMaterial.dispose();
      smokeMaterial.dispose();
      backdrop.dispose();
    },
    [buffers, pointMaterial, ribbonMaterial, smokeMaterial, backdrop],
  );
  useFrame((_, delta) => {
    model.low = low;
    model.reduced = reduced;
    if (!latest.current.paused && !document.hidden) model.step(delta);
    const c = background();
    if (c && c.width > 1) {
      const version = c.__deepotsavaFrame || `${c.width}:${c.height}`;
      if (backdrop.image !== c || backdropVersion.current !== version) {
        backdrop.image = c;
        backdrop.needsUpdate = true;
        backdropVersion.current = version;
      }
    }
    const angle = model.rotation,
      length = model.coatTip;
    hand.current.position.set(
      model.tip.x + Math.sin(angle) * length,
      model.tip.y - Math.cos(angle) * length,
      0.2,
    );
    hand.current.rotation.z = angle;
    const remaining = length - 1.9;
    coat.current.position.y = 1.9 + Math.max(0.001, remaining) / 2;
    coat.current.scale.y = Math.max(0.001, remaining) / 1.45;
    charred.current.position.y = length + (3.35 - length) / 2;
    charred.current.scale.y = Math.max(0.001, (3.35 - length) / 1.45);
    tip.current.position.set(model.tip.x, model.tip.y, 0.5);
    const flicker = reduced ? 1 : 1 + Math.sin(model.time * 31) * 0.09;
    tip.current.scale.setScalar(model.brightness * flicker);
    const hex =
      model.color === "rainbow"
        ? SPARKLER_COLORS[Math.floor(model.time * 3) % 6].hex
        : SPARKLER_COLORS.find((c) => c.id === model.color).hex;
    light.current.position.set(model.tip.x, model.tip.y, 1.5);
    light.current.intensity = 18 * model.brightness;
    light.current.color.set(hex);
    let pCount = 0;
    const p = buffers.points.attributes,
      l = buffers.lines.attributes;
    for (const s of model.particles) {
      const rgb = RGB[s.color],
        alpha = Math.max(0, s.life / s.total);
      p.position.setXYZ(pCount, s.x, s.y, 0.55);
      p.color.setXYZ(pCount, ...rgb);
      p.aSize.setX(pCount, s.size * 4);
      p.aAlpha.setX(pCount, alpha);
      l.position.setXYZ(
        pCount * 2,
        s.px - s.vx * 0.018,
        s.py - s.vy * 0.018,
        0.54,
      );
      l.position.setXYZ(pCount * 2 + 1, s.x, s.y, 0.54);
      l.color.setXYZ(
        pCount * 2,
        rgb[0] * alpha,
        rgb[1] * alpha,
        rgb[2] * alpha,
      );
      l.color.setXYZ(
        pCount * 2 + 1,
        rgb[0] * alpha,
        rgb[1] * alpha,
        rgb[2] * alpha,
      );
      pCount++;
    }
    changed(buffers.points, pCount);
    changed(buffers.lines, pCount * 2);
    let vertex = 0;
    const r = buffers.ribbons.attributes;
    for (const t of model.trails) {
      const dx = t.bx - t.ax,
        dy = t.by - t.ay,
        d = Math.hypot(dx, dy) || 1,
        nx = (-dy / d) * t.width,
        ny = (dx / d) * t.width,
        rgb = RGB[t.color],
        alpha = Math.pow(Math.max(0, 1 - (model.time - t.born) / t.life), 0.75);
      const write = (x, y, u, v) => {
        r.position.setXYZ(vertex, x, y, 0.35);
        r.color.setXYZ(vertex, ...rgb);
        r.aAlpha.setX(vertex, alpha);
        r.uv.setXY(vertex, u, v);
        vertex++;
      };
      write(t.ax + nx, t.ay + ny, 0, 0);
      write(t.ax - nx, t.ay - ny, 0, 1);
      write(t.bx + nx, t.by + ny, 1, 0);
      write(t.bx + nx, t.by + ny, 1, 0);
      write(t.ax - nx, t.ay - ny, 0, 1);
      write(t.bx - nx, t.by - ny, 1, 1);
    }
    changed(buffers.ribbons, vertex);
    let sCount = 0;
    const smoke = buffers.smoke.attributes;
    for (const s of model.smoke) {
      smoke.position.setXYZ(sCount, s.x, s.y, 0.1);
      smoke.color.setXYZ(sCount, 0.3, 0.26, 0.38);
      smoke.aSize.setX(sCount, (s.size * size.height) / 6);
      smoke.aAlpha.setX(sCount, (s.life / s.total) * 0.12);
      sCount++;
    }
    changed(buffers.smoke, sCount);
    if (
      model.time - lastSnapshot.current > 0.2 ||
      wasBurning.current !== model.burning
    ) {
      lastSnapshot.current = model.time;
      wasBurning.current = model.burning;
      latest.current.onTick(model.snapshot());
    }
  });
  return (
    <>
      <mesh
        ref={backdropMesh}
        position={[0, 0, -3]}
        scale={[model.width, 12, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} />
      </mesh>
      <ambientLight intensity={1.25} color="#e6c2b1" />
      <directionalLight position={[-3, 5, 7]} intensity={2.5} color="#ffe3bf" />
      <directionalLight position={[4, 0, 3]} intensity={1.7} color="#a8bbff" />
      <pointLight ref={light} distance={8} decay={2} />
      <group ref={hand}>
        <Hand />
        <mesh position={[0, 1.45, 0.25]}>
          <cylinderGeometry args={[0.015, 0.015, 3.7, 8]} />
          <meshStandardMaterial
            color="#a9b5bd"
            metalness={0.9}
            roughness={0.24}
          />
        </mesh>
        <mesh ref={coat} position={[0, 2.625, 0.25]}>
          <cylinderGeometry args={[0.034, 0.032, 1.45, 10]} />
          <meshStandardMaterial color="#6a655e" roughness={0.85} />
        </mesh>
        <mesh ref={charred} position={[0, 3.35, 0.25]} scale={[1, 0.001, 1]}>
          <cylinderGeometry args={[0.023, 0.023, 1.45, 8]} />
          <meshStandardMaterial color="#272428" roughness={1} />
        </mesh>
      </group>
      <group ref={tip}>
        <mesh scale={[0.055, 0.12, 0.04]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#fff3c3" toneMapped={false} />
        </mesh>
        <mesh scale={[0.12, 0.2, 0.08]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color="#ffbe58"
            transparent
            opacity={0.25}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <mesh
        geometry={buffers.ribbons}
        material={ribbonMaterial}
        frustumCulled={false}
      />
      <lineSegments geometry={buffers.lines} frustumCulled={false}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <points
        geometry={buffers.points}
        material={pointMaterial}
        frustumCulled={false}
      />
      <points
        geometry={buffers.smoke}
        material={smokeMaterial}
        frustumCulled={false}
      />
      <Composer low={low} model={model} canvasRef={canvasRef} />
    </>
  );
}
