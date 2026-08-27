/* ============================================================
   Credent site — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  /* ---- mobile nav toggle ---- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  /* ---- OS detection -> tailor the hero download button ---- */
  function detectOS() {
    const ua = navigator.userAgent || "";
    const plat = navigator.platform || "";
    if (/Mac|iPhone|iPad|iPod/.test(ua) || /Mac/.test(plat)) return "mac";
    if (/Win/.test(ua) || /Win/.test(plat)) return "windows";
    if (/Linux/.test(ua)) return "linux";
    return "other";
  }
  const os = detectOS();
  const hint = document.querySelector("[data-os-hint]");
  const heroBtn = document.querySelector("[data-os-download]");
  if (heroBtn) {
    if (os === "windows") {
      heroBtn.setAttribute("href", "https://github.com/CredentAppDev/credent-website/releases/download/v1.6.25/Credent-Setup-1.6.25.exe");
      heroBtn.setAttribute("download", "");
      heroBtn.querySelector("[data-os-label]").textContent = "Download for Windows";
      if (hint) hint.textContent = "Windows 10 / 11 · 83 MB · also available for macOS";
    } else if (os === "mac") {
      heroBtn.setAttribute("href", "https://github.com/CredentAppDev/credent-website/releases/download/v1.6.25/Credent-1.6.25-arm64.dmg");
      heroBtn.setAttribute("download", "");
      heroBtn.querySelector("[data-os-label]").textContent = "Download for macOS";
      if (hint) hint.textContent = "macOS 10.15+ · Intel & Apple Silicon (Rosetta) · also on Windows";
    } else {
      heroBtn.setAttribute("href", "download.html");
      heroBtn.querySelector("[data-os-label]").textContent = "View downloads";
      if (hint) hint.textContent = "Available for Windows and macOS";
    }
  }

  /* ---- scroll reveal ---- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      q.closest(".faq-item").classList.toggle("open");
    });
  });

  /* ---- year in footer ---- */
  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- ambient high-tech canvas: glow orbs + particle network + perspective grid ---- */
  const canvas = document.getElementById("glow-canvas");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const COLORS = ["#33EBFF", "#0087D1", "#6C5CE7", "#FF00FF"];
    const orbs = [];
    const nodes = [];
    const mouse = { x: -9999, y: -9999 };
    let scrollY = 0;

    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeScene() {
      orbs.length = 0;
      const n = w < 700 ? 4 : 6;
      for (let i = 0; i < n; i++) {
        orbs.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 130 + Math.random() * 240,
          dx: (Math.random() - 0.5) * 0.22, dy: (Math.random() - 0.5) * 0.22,
          c: COLORS[i % COLORS.length],
        });
      }
      nodes.length = 0;
      const count = w < 700 ? 34 : 70;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          c: COLORS[i % COLORS.length],
        });
      }
    }

    // perspective grid that scrolls toward the viewer
    function drawGrid(t) {
      const horizon = h * 0.55;
      ctx.save();
      ctx.strokeStyle = "rgba(51,235,255,0.06)";
      ctx.lineWidth = 1;
      // horizontal lines receding to the horizon
      const rows = 18;
      for (let i = 0; i < rows; i++) {
        const p = ((i + ((t * 0.04) % 1)) / rows);
        const y = horizon + Math.pow(p, 2.2) * (h - horizon);
        ctx.globalAlpha = (1 - p) * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // vanishing vertical lines
      ctx.globalAlpha = 0.18;
      const cols = 24;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * w;
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.12, horizon);
        ctx.stroke();
      }
      ctx.restore();
    }

    function tick(now) {
      const t = now * 0.001;
      ctx.clearRect(0, 0, w, h);

      // 1. perspective grid (subtle, behind everything)
      drawGrid(t);

      // 2. soft glow orbs
      ctx.globalCompositeOperation = "lighter";
      orbs.forEach((o) => {
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.c + "22");
        g.addColorStop(1, o.c + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. particle network with connecting lines (parallax with scroll)
      const par = -scrollY * 0.04;
      const LINK = w < 700 ? 110 : 150;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        // gentle attraction to the cursor
        const mdx = mouse.x - a.x, mdy = mouse.y - a.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 180) { a.x += (mdx / md) * 0.4; a.y += (mdy / md) * 0.4; }

        const ay = a.y + par;
        ctx.beginPath();
        ctx.arc(a.x, ay, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = a.c + "cc";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            ctx.globalAlpha = (1 - dist / LINK) * 0.5;
            ctx.strokeStyle = a.c;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, ay);
            ctx.lineTo(b.x, b.y + par);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";

      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", () => { resize(); makeScene(); });
    resize();
    makeScene();
    requestAnimationFrame(tick);
  }
})();
