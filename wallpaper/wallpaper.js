import * as THREE from "three";

const canvas = document.querySelector("#universe");
const fallback = document.querySelector("#fallback");
const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const hint = document.querySelector("#hint");

const updateClock = () => {
  const now = new Date();
  clock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(now);
  date.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  }).format(now).toUpperCase();
};
updateClock();
setInterval(updateClock, 1000);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: "high-performance"
  });
} catch (error) {
  fallback.hidden = false;
  hint.hidden = true;
  throw error;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 15);

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse = matchMedia("(pointer: coarse)").matches;
const particleCount = Math.min(6500, Math.max(2600, Math.floor((innerWidth * innerHeight) / 260)));
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);
const phases = new Float32Array(particleCount);

const colorA = new THREE.Color("#55d9f2");
const colorB = new THREE.Color("#9b7bff");
const colorC = new THREE.Color("#e1f6ff");

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  const radius = 2.2 + Math.pow(Math.random(), .62) * 8.4;
  const theta = Math.random() * Math.PI * 2;
  const u = Math.random() * 2 - 1;
  const phi = Math.acos(u);
  positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.cos(phi) * .64;
  positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * .72;

  const mix = Math.random();
  const c = colorA.clone().lerp(colorB, mix * .72);
  if (Math.random() > .93) c.lerp(colorC, .55);
  colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
  sizes[i] = .55 + Math.random() * 1.9;
  phases[i] = Math.random() * Math.PI * 2;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uPointer: { value: new THREE.Vector2(0, 0) } },
  vertexShader: `
    attribute vec3 color;
    attribute float aSize;
    attribute float aPhase;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform vec2 uPointer;
    void main() {
      vec3 p = position;
      float t = uTime * 0.22;
      p.x += sin(t + aPhase + position.y * .28) * .19;
      p.y += cos(t * .8 + aPhase) * .16;
      p.z += sin(t * .65 + aPhase) * .22;
      vec2 pointerWorld = uPointer * 2.4;
      float d = distance(p.xy, pointerWorld);
      float influence = exp(-d * .45);
      p.xy += normalize(p.xy - pointerWorld + vec2(.001)) * influence * .18;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = clamp(aSize * uPixelRatio * (23.0 / -mvPosition.z), 1.0, 8.0);
      vColor = color;
      vAlpha = .42 + .48 * (.5 + .5 * sin(uTime * .7 + aPhase));
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec2 p = gl_PointCoord - .5;
      float d = length(p);
      float core = smoothstep(.5, .03, d);
      float halo = exp(-d * 10.0) * .34;
      float alpha = (core + halo) * vAlpha;
      if (alpha < .025) discard;
      gl_FragColor = vec4(vColor, alpha);
    }
  `
});
const points = new THREE.Points(geometry, material);
scene.add(points);

// A very faint, slowly turning wireframe orb adds depth without competing with the name.
const orbGeometry = new THREE.IcosahedronGeometry(3.0, 2);
const orbMaterial = new THREE.MeshBasicMaterial({
  color: 0x4c9fc8, wireframe: true, transparent: true, opacity: .045
});
const orb = new THREE.Mesh(orbGeometry, orbMaterial);
orb.position.set(3.4, -.1, -1.4);
scene.add(orb);

const pointer = new THREE.Vector2(0, 0);
const targetPointer = new THREE.Vector2(0, 0);
const onPointerMove = (event) => {
  targetPointer.x = (event.clientX / innerWidth) * 2 - 1;
  targetPointer.y = -((event.clientY / innerHeight) * 2 - 1);
};
if (!isCoarse) window.addEventListener("pointermove", onPointerMove, { passive: true });

let width = innerWidth, height = innerHeight;
const resize = () => {
  width = innerWidth; height = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 700 ? 18 : 15;
  camera.updateProjectionMatrix();
  material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
};
resize();
window.addEventListener("resize", resize, { passive: true });

let frame = 0;
let last = 0;
const animate = (now) => {
  frame = requestAnimationFrame(animate);
  if (document.hidden) return;
  if (now - last < 15) return; // cap near 60–66fps
  last = now;
  const t = now * .001;
  pointer.lerp(targetPointer, .035);
  material.uniforms.uTime.value = reducedMotion ? 0 : t;
  material.uniforms.uPointer.value.copy(pointer);
  points.rotation.y = reducedMotion ? 0 : t * .018 + pointer.x * .055;
  points.rotation.x = reducedMotion ? 0 : Math.sin(t * .12) * .045 + pointer.y * .025;
  orb.rotation.x = t * .025;
  orb.rotation.y = -t * .035;
  renderer.render(scene, camera);
};
if (!reducedMotion) frame = requestAnimationFrame(animate);
else renderer.render(scene, camera);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !reducedMotion) {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(animate);
  }
});
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(frame);
  geometry.dispose(); material.dispose(); orbGeometry.dispose(); orbMaterial.dispose();
  renderer.dispose();
});
