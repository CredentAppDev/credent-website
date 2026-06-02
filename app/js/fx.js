/* ============================================================
   Credent — high-tech interaction FX
   3D tilt cards · magnetic buttons · decrypt text · counters ·
   cursor glow · perspective tech-grid · scroll parallax.
   Plain JS, no deps. Honors prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches; // not touch

  /* ---------- 1. 3D tilt on cards ---------- */
  if (!reduced && fine) {
    const tiltEls = document.querySelectorAll("[data-tilt]");
    tiltEls.forEach((el) => {
      const max = 12; // deg
      let raf = null;
      function onMove(e) {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform =
            `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(8px)`;
          // move the inner sheen highlight
          el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
        });
      }
      function reset() {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      }
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", reset);
    });
  }

  /* ---------- 2. Magnetic buttons ---------- */
  if (!reduced && fine) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
    });
  }

  /* ---------- 3. Decrypt / scramble text on headline ---------- */
  if (!reduced) {
    const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+<>";
    document.querySelectorAll("[data-decrypt]").forEach((el) => {
      const final = el.dataset.decrypt;
      let frame = 0;
      const total = 28;
      el.textContent = "";
      function run() {
        const out = final
          .split("")
          .map((c, i) => {
            if (c === " ") return " ";
            const reveal = (i / final.length) * total;
            if (frame > reveal + 6) return final[i];
            if (frame > reveal) return CH[(Math.random() * CH.length) | 0];
            return "";
          })
          .join("");
        el.textContent = out;
        frame++;
        if (frame <= total + final.length) requestAnimationFrame(run);
        else el.textContent = final;
      }
      // start after a tiny delay so it reads as an "intro"
      setTimeout(run, 250);
    });
  }

  /* ---------- 4. Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          cio.unobserve(el);
          const end = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const dur = 1400;
          const start = performance.now();
          function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = end % 1 === 0 ? Math.round(end * eased) : (end * eased).toFixed(1);
            el.textContent = val + suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- 5. Cursor glow (a soft light that follows the pointer) ---------- */
  if (!reduced && fine) {
    const dot = document.createElement("div");
    dot.className = "cursor-glow";
    document.body.appendChild(dot);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    })();
    // grow over interactive elements
    document.querySelectorAll("a, button, [data-tilt]").forEach((el) => {
      el.addEventListener("pointerenter", () => dot.classList.add("big"));
      el.addEventListener("pointerleave", () => dot.classList.remove("big"));
    });
  }

  /* ---------- 6. Scroll parallax for [data-parallax] ---------- */
  if (!reduced) {
    const pEls = [...document.querySelectorAll("[data-parallax]")];
    if (pEls.length) {
      let ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const vh = window.innerHeight;
          pEls.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax) || 0.2;
            const r = el.getBoundingClientRect();
            const offset = (r.top + r.height / 2 - vh / 2) * -speed;
            el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
          });
          ticking = false;
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- 7. Header shrink on scroll ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onS = () => nav.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onS, { passive: true });
    onS();
  }
})();
