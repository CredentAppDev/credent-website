/* ====================================================
   CREDENT — Animated Website JS
   GSAP + ScrollTrigger + Three.js + custom canvas
   ==================================================== */

gsap.registerPlugin(ScrollTrigger);

/* ============== DEVICE DETECTION ============== */
const IS_MOBILE = window.matchMedia('(max-width: 900px)').matches
  || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============== PRELOADER ============== */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('done');
    runIntro();
  }, 1800);
});

/* ============== CUSTOM CURSOR ============== */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let mx = 0, my = 0, cx = 0, cy = 0;

window.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
});
function loopCursor() {
  cx += (mx - cx) * 0.15;
  cy += (my - cy) * 0.15;
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';
  requestAnimationFrame(loopCursor);
}
loopCursor();
document.querySelectorAll('[data-cursor="hover"]').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

/* ============== NAV ============== */
const nav = document.getElementById('nav');
const burger = document.getElementById('navBurger');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  document.body.classList.toggle('nav-locked', open);
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.classList.remove('nav-locked');
  });
});

/* ============== HERO INTRO ============== */
function runIntro() {
  // Reveal hero words letter-by-letter (already wrapped in spans)
  const words = document.querySelectorAll('.hero-word');
  gsap.to(words, {
    y: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.08,
    delay: 0.1,
  });

  // Reveal hero meta
  gsap.from('.hero-tag', { opacity: 0, y: 20, duration: 1, delay: 0.6, ease: 'power3.out' });
  gsap.from('.hero-sub', { opacity: 0, y: 30, duration: 1.2, delay: 1.0, ease: 'power3.out' });
  gsap.from('.hero-cta .btn', { opacity: 0, y: 30, duration: 1, delay: 1.3, stagger: 0.1, ease: 'power3.out' });
  gsap.from('.hero-stats .stat', { opacity: 0, y: 40, duration: 1, delay: 1.6, stagger: 0.12, ease: 'power3.out' });

  // Animate stat counters
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.count;
    gsap.fromTo(el, { innerText: 0 }, {
      innerText: target,
      duration: 2,
      delay: 1.8,
      snap: { innerText: 1 },
      ease: 'power3.out',
    });
  });

  // Reveal-text animations on scroll
  document.querySelectorAll('.reveal-text').forEach(el => {
    gsap.from(el, {
      y: '110%',
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Division panels stagger
  if (document.querySelector('.divisions-stage')) {
    gsap.from('.division-panel', {
      y: 80, opacity: 0, duration: 1.1, stagger: 0.16, ease: 'power3.out',
      scrollTrigger: { trigger: '.divisions-stage', start: 'top 78%' },
    });
  }

  // Service cards stagger
  gsap.from('.service-card', {
    y: 80, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.services-grid', start: 'top 75%' },
  });

  // Founder cards stagger
  gsap.from('.founder-card', {
    y: 80, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.founders-grid', start: 'top 75%' },
  });

  // Vision cards
  gsap.from('.vision-card', {
    y: 60, opacity: 0, duration: 1.1, stagger: 0.18, ease: 'power3.out',
    scrollTrigger: { trigger: '.vision-grid', start: 'top 80%' },
  });

  // About visual parallax
  gsap.to('.visual-frame', {
    yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Hero subtle parallax on video / earth
  gsap.to('.hero-video', {
    yPercent: 30, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero-earth', {
    yPercent: 50, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  if (!IS_MOBILE) initVaporText();
  if (!IS_MOBILE && !REDUCED_MOTION) initEarth();
  initTestimonials();
  initGallery();
  initLazyVideos();
}

/* ============== LAZY VIDEOS (mobile data + perf) ============== */
function initLazyVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(v => {
    v.setAttribute('preload', 'metadata');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.muted = true;
    v.pause();
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.1, rootMargin: '50px' });
  videos.forEach(v => io.observe(v));
}

/* ============== VAPORIZE TEXT (canvas particles) ============== */
function initVaporText() {
  const canvas = document.getElementById('vaporCanvas');
  const ctx = canvas.getContext('2d');
  const phrases = ['AI · ROBOTICS · INNOVATION', 'BUILT IN GHANA', 'DESIGNED FOR AFRICA', 'POWERING THE NEXT GENERATION'];
  let phraseIndex = 0;
  let particles = [];
  let state = 'forming'; // forming, holding, vaporizing
  let stateTime = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    sample();
  }

  function sample() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const text = phrases[phraseIndex];
    ctx.fillText(text, 0, h / 2);

    const dpr = window.devicePixelRatio || 1;
    const data = ctx.getImageData(0, 0, w * dpr, h * dpr).data;
    particles = [];
    const step = 3;
    for (let y = 0; y < h * dpr; y += step) {
      for (let x = 0; x < w * dpr; x += step) {
        const i = (y * w * dpr + x) * 4;
        if (data[i + 3] > 128) {
          particles.push({
            ox: x / dpr, oy: y / dpr,
            x: (x / dpr) + (Math.random() - 0.5) * 200,
            y: (y / dpr) + (Math.random() - 0.5) * 200,
            vx: 0, vy: 0,
            color: Math.random() < 0.5 ? '#ff00ff' : (Math.random() < 0.5 ? '#00ffff' : '#ffffff'),
          });
        }
      }
    }
    ctx.clearRect(0, 0, w, h);
  }

  function draw() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    stateTime += 1;

    particles.forEach(p => {
      if (state === 'forming' || state === 'holding') {
        // ease toward original
        p.vx += (p.ox - p.x) * 0.05;
        p.vy += (p.oy - p.y) * 0.05;
      } else if (state === 'vaporizing') {
        // drift outward
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy -= 0.05 + Math.random() * 0.1;
      }
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    });

    if (state === 'forming' && stateTime > 80) { state = 'holding'; stateTime = 0; }
    if (state === 'holding' && stateTime > 180) { state = 'vaporizing'; stateTime = 0; }
    if (state === 'vaporizing' && stateTime > 90) {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      state = 'forming';
      stateTime = 0;
      sample();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

/* ============== ROTATING EARTH (Three.js dotted globe) ============== */
function initEarth() {
  const canvas = document.getElementById('heroEarth');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);

  function size() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3;

  const globe = new THREE.Group();
  scene.add(globe);

  // Wireframe sphere
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 36, 24)),
    new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.18 })
  );
  globe.add(wire);

  // Dotted overlay
  const dotsGeo = new THREE.BufferGeometry();
  const positions = [];
  const N = 1800;
  for (let i = 0; i < N; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = 2 * Math.PI * Math.random();
    const r = 1.01;
    positions.push(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    );
  }
  dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const dotsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.6 });
  const dots = new THREE.Points(dotsGeo, dotsMat);
  globe.add(dots);

  // Inner glow (magenta)
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.96, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.08 })
  );
  globe.add(glow);

  // Africa highlight ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.005, 16, 64),
    new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = Math.PI / 2.4;
  ring.position.set(0.05, -0.05, 0.4);
  globe.add(ring);

  size();
  window.addEventListener('resize', size);

  let mouseX = 0;
  window.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5; });

  function loop() {
    globe.rotation.y += 0.0025;
    globe.rotation.x += (mouseX * 0.4 - globe.rotation.x) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}

/* ============== TESTIMONIALS ============== */
const testimonials = [
  {
    img: 'assets/images/pichai.jpeg', name: 'Sundar Pichai', role: 'CEO of Google',
    quote: 'I think people who learn to adopt and adapt to AI will do better. It doesn\'t matter whether you want to be a teacher or a doctor — the people who do well in each profession are the ones who learn how to use these tools.',
  },
  {
    img: 'assets/images/altman.jpeg', name: 'Sam Altman', role: 'CEO of OpenAI',
    quote: 'AI will not replace humans, but humans who use AI will replace those who don\'t.',
  },
  {
    img: 'assets/images/zuckerberg.jpeg', name: 'Mark Zuckerberg', role: 'CEO of Meta',
    quote: 'The future is humans + AI working together, not humans vs AI.',
  },
  {
    img: 'assets/images/wang.jpeg', name: 'Alexander Wang', role: 'Founder & CEO of Scale AI',
    quote: 'Young people, especially 10-13 year olds, should focus their time on coding and AI — the future belongs to those who build it early.',
  },
  {
    img: 'assets/images/bawumia.jpeg', name: 'Dr. Mahamudu Bawumia', role: 'Former Vice President of Ghana',
    quote: 'AI won\'t just replace people — it will change how people work.',
  },
  {
    img: 'assets/images/founder.jpeg', name: 'The Founder of Credent', role: 'Founder & CEO',
    quote: 'Africa will not wait for the future to arrive — we are building it, one student, one robot, one line of code at a time.',
  },
];

let activeTesti = 0;
let testiTimer;

function initTestimonials() {
  const stack = document.getElementById('testiImages');
  stack.innerHTML = '';
  testimonials.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'testi-img';
    div.innerHTML = `<img src="${t.img}" alt="${t.name}" />`;
    stack.appendChild(div);
  });
  renderTesti();

  document.getElementById('testiPrev').addEventListener('click', () => {
    activeTesti = (activeTesti - 1 + testimonials.length) % testimonials.length;
    renderTesti();
  });
  document.getElementById('testiNext').addEventListener('click', () => {
    activeTesti = (activeTesti + 1) % testimonials.length;
    renderTesti();
  });
  startTestiAuto();
}

function renderTesti() {
  const imgs = document.querySelectorAll('.testi-img');
  imgs.forEach((img, i) => {
    const offset = i - activeTesti;
    const isActive = offset === 0;
    img.style.zIndex = 100 - Math.abs(offset);
    img.style.opacity = isActive ? 1 : (Math.abs(offset) > 2 ? 0 : 0.45);
    img.style.transform = isActive
      ? `translate(0,0) rotate(0deg) scale(1)`
      : `translate(${offset * 18}px, ${Math.abs(offset) * 12}px) rotate(${offset * 4}deg) scale(${1 - Math.abs(offset) * 0.06})`;
    img.style.filter = isActive ? 'none' : 'grayscale(0.4)';
  });

  const t = testimonials[activeTesti];
  const quote = document.getElementById('testiQuote');
  const name = document.getElementById('testiName');
  const role = document.getElementById('testiRole');

  gsap.fromTo([quote, name, role], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' });
  quote.textContent = t.quote;
  name.textContent = t.name;
  role.textContent = t.role;

  // progress bar reset
  const bar = document.getElementById('testiProgressBar');
  bar.style.transition = 'none';
  bar.style.transform = 'scaleX(0)';
  requestAnimationFrame(() => {
    bar.style.transition = 'transform 6s linear';
    bar.style.transform = 'scaleX(1)';
  });
}

function startTestiAuto() {
  clearInterval(testiTimer);
  testiTimer = setInterval(() => {
    activeTesti = (activeTesti + 1) % testimonials.length;
    renderTesti();
  }, 6000);
}

/* ============== GALLERY (3D arc with videos + photos) ============== */
function initGallery() {
  const stage = document.getElementById('galleryStage');
  // On mobile, the CSS converts the stage to a horizontal snap-scroll row.
  // Skip arc math + hover pop in that mode.
  if (IS_MOBILE) {
    const items = [
      { type: 'video', src: 'assets/videos/teaching.mp4' },
      { type: 'img', src: 'assets/images/instructor.jpeg' },
      { type: 'video', src: 'assets/videos/house-learning.mp4' },
      { type: 'img', src: 'assets/images/certificate.jpeg' },
      { type: 'img', src: 'assets/images/vision.jpeg' },
      { type: 'video', src: 'assets/videos/starting.mp4' },
      { type: 'img', src: 'assets/images/cfo.jpeg' },
      { type: 'img', src: 'assets/images/cxo.jpeg' },
      { type: 'img', src: 'assets/images/founder.jpeg' },
    ];
    stage.innerHTML = '';
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = it.type === 'video'
        ? `<video src="${it.src}" muted loop playsinline preload="metadata"></video>`
        : `<img src="${it.src}" alt="" loading="lazy" />`;
      stage.appendChild(card);
    });
    return;
  }
  const items = [
    { type: 'video', src: 'assets/videos/teaching.mp4' },
    { type: 'img', src: 'assets/images/instructor.jpeg' },
    { type: 'video', src: 'assets/videos/house-learning.mp4' },
    { type: 'img', src: 'assets/images/certificate.jpeg' },
    { type: 'img', src: 'assets/images/vision.jpeg' },
    { type: 'video', src: 'assets/videos/starting.mp4' },
    { type: 'img', src: 'assets/images/cfo.jpeg' },
    { type: 'img', src: 'assets/images/cxo.jpeg' },
    { type: 'img', src: 'assets/images/founder.jpeg' },
  ];

  stage.innerHTML = '';
  items.forEach((it, i) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = it.type === 'video'
      ? `<video src="${it.src}" autoplay muted loop playsinline></video>`
      : `<img src="${it.src}" alt="" />`;
    stage.appendChild(card);
  });

  const cards = stage.querySelectorAll('.gallery-card');
  function arrange(progress = 0) {
    const radius = Math.min(window.innerWidth * 0.42, 600);
    const total = cards.length;
    const spread = Math.PI * 0.85;
    cards.forEach((card, i) => {
      const t = i / (total - 1);
      const angle = -spread / 2 + t * spread + progress;
      const x = Math.sin(angle) * radius;
      const y = -Math.cos(angle) * radius * 0.25 + 100;
      const rot = angle * (180 / Math.PI) * 0.6;
      card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    });
  }
  arrange();
  window.addEventListener('resize', () => arrange());

  // Scroll-driven shuffle
  ScrollTrigger.create({
    trigger: '.gallery',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
    onUpdate: (self) => arrange(self.progress * 1.2 - 0.6),
  });

  // Hover-pop
  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.15, duration: 0.5, ease: 'power3.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.5, ease: 'power3.out' });
    });
  });
}

/* ============== FORMS ============== */
// API base resolution order:
//   1) localStorage 'credentApiBase' override (handy for LAN/phone testing —
//      open devtools and run: localStorage.setItem('credentApiBase', 'http://192.168.x.x:5000'))
//   2) Otherwise hit the production backend on Render.
// Note: we intentionally do NOT auto-target http://localhost when served from
// localhost, because there isn't always a local backend running — falling back
// to the live Render API means the forms work everywhere by default. To test
// against a local backend, set the localStorage override above.
const PROD_API = 'https://credent-backend.onrender.com';
const API_BASE = (() => {
  try {
    const override = localStorage.getItem('credentApiBase');
    if (override) return override.replace(/\/$/, '');
  } catch (_) { /* localStorage may be disabled */ }
  return PROD_API;
})();

async function handleSubmit(e, type) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Sending…</span>';

  try {
    const fd = new FormData();
    fd.append('type', type);

    if (type === 'passkey') {
      const name = form.querySelector('#pk-name')?.value.trim() || '';
      const whatsapp = form.querySelector('#pk-whatsapp')?.value.trim() || '';
      const email = form.querySelector('#pk-email')?.value.trim() || '';
      const channel = form.querySelector('input[name="pk-channel"]:checked')?.value || 'whatsapp';
      // basic client-side validation
      if (!name || !whatsapp || !email) throw new Error('Please fill in your name, WhatsApp number and email.');
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
      if (!/^\+?[0-9\s().-]{7,}$/.test(whatsapp)) throw new Error('Please enter a valid WhatsApp number, including country code.');
      fd.append('name', name);
      fd.append('whatsapp', whatsapp);
      fd.append('phone', whatsapp);   // alias, in case the backend expects "phone"
      fd.append('email', email);
      fd.append('channel', channel);  // 'whatsapp' | 'email' — where to send the passkey
    } else if (type === 'instructor') {
      fd.append('name', form.querySelector('#ins-name')?.value || '');
      fd.append('email', form.querySelector('#ins-email')?.value || '');
      fd.append('phone', form.querySelector('#ins-phone')?.value || '');
      fd.append('subject', form.querySelector('#ins-subject')?.value || '');
      const cvFile = form.querySelector('#ins-cv')?.files[0];
      const letterFile = form.querySelector('#ins-letter')?.files[0];
      const degreeFile = form.querySelector('#ins-degree')?.files[0];
      if (cvFile) fd.append('cv', cvFile);
      if (letterFile) fd.append('letter', letterFile);
      if (degreeFile) fd.append('degree', degreeFile);
    } else {
      fd.append('school_name', form.querySelector('#demo-school')?.value || '');
      fd.append('name', form.querySelector('#demo-name')?.value || '');
      fd.append('role', form.querySelector('#demo-role')?.value || '');
      fd.append('email', form.querySelector('#demo-email')?.value || '');
      fd.append('phone', form.querySelector('#demo-phone')?.value || '');
      fd.append('location', form.querySelector('#demo-location')?.value || '');
      fd.append('message', form.querySelector('#demo-message')?.value || '');
    }

    const resp = await fetch(`${API_BASE}/api/applications`, { method: 'POST', body: fd });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) throw new Error(data.message || 'Server error');

    showToast(
      type === 'passkey'
        ? '✓ Request received — our team will send your passkey shortly via WhatsApp / email.'
        : type === 'demo'
          ? '✓ Demo request sent — we will reach out within 48 hours.'
          : '✓ Application received — thank you for applying to Credent.'
    );
    form.reset();
    form.querySelectorAll('.upload-box').forEach(b => {
      b.classList.remove('has-file');
      const strong = b.querySelector('.upload-text strong');
      if (strong) strong.textContent = strong.dataset.label || strong.textContent;
    });
  } catch (err) {
    console.error('Form submit error:', err);
    showToast('⚠ Could not send — please try again or email us directly.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

document.querySelectorAll('.upload-box input[type="file"]').forEach(input => {
  input.addEventListener('change', (e) => {
    const box = e.target.closest('.upload-box');
    if (e.target.files && e.target.files.length > 0) {
      box.classList.add('has-file');
      box.querySelector('.upload-text strong').textContent = e.target.files[0].name;
    } else {
      box.classList.remove('has-file');
    }
  });
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.querySelector('span').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ============== YEAR ============== */
document.getElementById('year').textContent = new Date().getFullYear();

/* ============== SMOOTH ANCHOR (refresh ScrollTrigger) ============== */
window.addEventListener('load', () => {
  setTimeout(() => ScrollTrigger.refresh(), 200);
});

/* ============================================================
   3D MODERNISATION FX
   tilt cards · sheen tracking · cursor glow · download canvas ·
   GSAP reveal for the download section.
   ============================================================ */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ---- 1. GSAP reveal for the download section ---- */
  if (window.gsap && document.querySelector('.download')) {
    gsap.from('.download .dl-card', {
      scrollTrigger: { trigger: '.download', start: 'top 70%' },
      opacity: 0, y: 60, rotateX: -12, duration: 1, stagger: 0.15, ease: 'power3.out'
    });
  }

  /* ---- 2. 3D tilt + sheen on cards ---- */
  if (!reduced && fine) {
    const tiltSel = '[data-tilt], .service-card, .founder-card, .vision-card';
    document.querySelectorAll(tiltSel).forEach((el) => {
      const max = el.matches('[data-tilt]') ? 12 : 6;   // download cards tilt more
      let raf = null;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform =
            `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-6px)`;
          el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
        });
      });
      el.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ---- 3. cursor glow ---- */
  if (!reduced && fine) {
    const glow = document.createElement('div');
    glow.className = 'fx-cursor-glow';
    document.body.appendChild(glow);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      glow.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, [data-tilt], .service-card, .founder-card').forEach((el) => {
      el.addEventListener('pointerenter', () => glow.classList.add('big'));
      el.addEventListener('pointerleave', () => glow.classList.remove('big'));
    });
  }

  /* ---- 4. download section canvas: particle network ---- */
  const canvas = document.getElementById('downloadCanvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['#00ffff', '#6c5ce7', '#ff00ff', '#2218ff'];
    let w, h, dpr, nodes = [], running = false;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function build() {
      nodes = [];
      const n = w < 700 ? 28 : 56;
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          c: COLORS[i % COLORS.length]
        });
      }
    }
    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      const LINK = w < 700 ? 110 : 150;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        const mdx = mouse.x - a.x, mdy = mouse.y - a.y, md = Math.hypot(mdx, mdy);
        if (md < 160 && md > 0) { a.x += (mdx / md) * 0.5; a.y += (mdy / md) * 0.5; }
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = a.c; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            ctx.globalAlpha = (1 - dist / LINK) * 0.45;
            ctx.strokeStyle = a.c; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    window.addEventListener('resize', () => { resize(); build(); });
    resize(); build();
    // only animate while the section is on screen
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const was = running; running = en.isIntersecting;
        if (running && !was) tick();
      });
    }, { threshold: 0 }).observe(canvas);
  }
})();
