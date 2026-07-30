/* ====================================================
   CREDENT — Division pages JS (education / industrial)
   Dependency-free: preloader, cursor, nav, reveals,
   lazy videos, forms. Shares the backend with app.js.
   ==================================================== */

/* ============== PRELOADER ============== */
window.addEventListener('load', () => {
  setTimeout(() => {
    const pre = document.getElementById('preloader');
    if (pre) pre.classList.add('done');
    document.querySelectorAll('.rise').forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) {
        setTimeout(() => el.classList.add('in'), 120 * i);
      }
    });
  }, 900);
});

/* ============== CUSTOM CURSOR ============== */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
if (cursor && cursorDot && window.matchMedia('(pointer: fine)').matches) {
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px';
    cursorDot.style.top = my + 'px';
  });
  (function loopCursor() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(loopCursor);
  })();
  document.querySelectorAll('[data-cursor="hover"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

/* ============== NAV ============== */
const nav = document.getElementById('nav');
const burger = document.getElementById('navBurger');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}
if (nav && burger) {
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
}

/* ============== SCROLL REVEALS (.rise) ============== */
/* IO as the primary trigger, plus a scroll/resize sweep as a
   safety net — content must never be able to stay hidden. */
function sweepRise() {
  const limit = window.innerHeight * 0.96;
  document.querySelectorAll('.rise:not(.in)').forEach(el => {
    if (el.getBoundingClientRect().top < limit) el.classList.add('in');
  });
}
if ('IntersectionObserver' in window) {
  const riseIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        riseIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0 });
  document.querySelectorAll('.rise').forEach(el => riseIO.observe(el));
}
let riseTick = false;
window.addEventListener('scroll', () => {
  if (riseTick) return;
  riseTick = true;
  requestAnimationFrame(() => { sweepRise(); riseTick = false; });
}, { passive: true });
window.addEventListener('resize', sweepRise);

/* ============== LAZY VIDEOS ============== */
(function () {
  const videos = document.querySelectorAll('video');
  if (!videos.length) return;
  videos.forEach(v => {
    v.setAttribute('preload', 'metadata');
    v.setAttribute('playsinline', '');
    v.muted = true;
    v.pause();
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    });
  }, { threshold: 0.1, rootMargin: '50px' });
  videos.forEach(v => io.observe(v));
})();

/* ============== LITE YOUTUBE EMBEDS ============== */
/* Thumbnail first; the player iframe is injected on click. */
document.querySelectorAll('.video-frame[data-yt]').forEach(frame => {
  frame.addEventListener('click', () => {
    if (frame.classList.contains('playing')) return;
    const id = frame.dataset.yt;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = frame.dataset.title || 'Robot video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    frame.classList.add('playing');
  });
});

/* ============== FORMS (same backend as the homepage) ============== */
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
    fd.append('school_name', form.querySelector('#demo-school')?.value || '');
    fd.append('name', form.querySelector('#demo-name')?.value || '');
    fd.append('role', form.querySelector('#demo-role')?.value || '');
    fd.append('email', form.querySelector('#demo-email')?.value || '');
    fd.append('phone', form.querySelector('#demo-phone')?.value || '');
    fd.append('location', form.querySelector('#demo-location')?.value || '');
    fd.append('message', form.querySelector('#demo-message')?.value || '');

    const resp = await fetch(`${API_BASE}/api/applications`, { method: 'POST', body: fd });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.message || 'Server error');

    showToast('✓ Request sent — our team will reach out within 48 hours.');
    form.reset();
  } catch (err) {
    console.error('Form submit error:', err);
    showToast('⚠ Could not send — please try again or message us on WhatsApp.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('span').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ============== YEAR ============== */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
