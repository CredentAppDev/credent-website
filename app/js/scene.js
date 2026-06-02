/* ============================================================
   Credent — 3D hero scene (Three.js via CDN, ES module)
   A rotating wireframe "neural core": an icosahedron wireframe,
   a particle shell, and orbiting nodes — reacts to the mouse.
   Brand: cyan #33EBFF · blue #0087D1 · indigo #6C5CE7 · magenta #FF00FF
   ============================================================ */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const mount = document.getElementById("hero-3d");

// Respect reduced-motion and missing-WebGL: bail to the CSS fallback orb.
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

if (mount && !prefersReduced && webglOK()) {
  mount.classList.add("is-3d"); // hides the CSS fallback orb

  const W = () => mount.clientWidth;
  const H = () => mount.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  mount.appendChild(renderer.domElement);

  const COLORS = {
    cyan: 0x33ebff,
    blue: 0x0087d1,
    indigo: 0x6c5ce7,
    magenta: 0xff00ff,
  };

  // Group that holds everything so we can tilt the whole core toward the mouse.
  const core = new THREE.Group();
  scene.add(core);

  // --- 1. Inner glowing solid icosahedron ---
  const innerGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const innerMat = new THREE.MeshBasicMaterial({
    color: COLORS.indigo,
    transparent: true,
    opacity: 0.18,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  core.add(inner);

  // --- 2. Wireframe shell (the "tech" lattice) ---
  const wireGeo = new THREE.IcosahedronGeometry(1.7, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: COLORS.cyan,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  core.add(wire);

  // --- 3. Particle shell (points scattered on a sphere) ---
  const COUNT = 900;
  const positions = new Float32Array(COUNT * 3);
  const pColors = new Float32Array(COUNT * 3);
  const palette = [COLORS.cyan, COLORS.blue, COLORS.indigo, COLORS.magenta].map(
    (c) => new THREE.Color(c)
  );
  for (let i = 0; i < COUNT; i++) {
    // even-ish distribution on a sphere
    const r = 2.5 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const col = palette[i % palette.length];
    pColors[i * 3] = col.r;
    pColors[i * 3 + 1] = col.g;
    pColors[i * 3 + 2] = col.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  core.add(points);

  // --- 4. Two orbiting rings (gives a "system" feel) ---
  function makeRing(radius, color, tiltX, tiltY) {
    const g = new THREE.TorusGeometry(radius, 0.012, 8, 120);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(g, m);
    ring.rotation.x = tiltX;
    ring.rotation.y = tiltY;
    return ring;
  }
  const ring1 = makeRing(2.5, COLORS.magenta, Math.PI / 2.2, 0.3);
  const ring2 = makeRing(2.9, COLORS.cyan, Math.PI / 3, -0.5);
  core.add(ring1, ring2);

  // --- mouse parallax ---
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- resize ---
  function onResize() {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }
  window.addEventListener("resize", onResize);

  // --- animate ---
  const clock = new THREE.Clock();
  let running = true;

  // pause when offscreen to save battery
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => (running = en.isIntersecting)),
    { threshold: 0 }
  );
  io.observe(mount);

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = clock.getElapsedTime();

    // ease the core tilt toward the mouse
    current.x += (target.x - current.x) * 0.05;
    current.y += (target.y - current.y) * 0.05;
    core.rotation.y = t * 0.18 + current.x * 0.5;
    core.rotation.x = current.y * 0.4;

    wire.rotation.y -= 0.004;
    wire.rotation.x += 0.0015;
    inner.rotation.y += 0.006;
    points.rotation.y += 0.0008;

    ring1.rotation.z += 0.006;
    ring2.rotation.z -= 0.004;

    // gentle breathing scale
    const s = 1 + Math.sin(t * 1.2) * 0.03;
    core.scale.setScalar(s);

    renderer.render(scene, camera);
  }
  tick();
}
