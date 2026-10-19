(function () {
  const bg = document.getElementById('bg');
  const spot = document.getElementById('spot');
  const ring = document.getElementById('ring');
  const dot = document.getElementById('dot');
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  let mx = W / 2, my = H / 2;      // mouse position
  let rx = mx, ry = my;            // ring (smoothed) position
  let px = mx, py = my;            // previous mouse position
  let speed = 0;
  const particles = [];
  const waves = [];

  function emit(x, y, vx, vy, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 1.6 + 0.3;
      particles.push({
        x, y,
        vx: vx * 0.15 + Math.cos(a) * s,
        vy: vy * 0.15 + Math.sin(a) * s - 0.4,
        life: 1,
        decay: Math.random() * 0.02 + 0.012,
        r: Math.random() * 2.2 + 0.8,
        hue: 265 + Math.random() * 35
      });
    }
    if (particles.length > 700) particles.splice(0, particles.length - 700);
  }

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    const dx = mx - px, dy = my - py;
    speed = Math.min(Math.hypot(dx, dy), 60);
    if (!reduce) emit(mx, my, dx, dy, Math.ceil(speed / 8) + 1);
    px = mx; py = my;

    dot.style.transform = `translate(${mx}px, ${my}px)`;
    spot.style.setProperty('--x', mx + 'px');
    spot.style.setProperty('--y', my + 'px');

    if (!reduce) {
      const nx = mx / W - 0.5, ny = my / H - 0.5;
      bg.style.transform =
        `translate(${-nx * 38}px, ${-ny * 38}px) scale(${1.02 + speed / 1500})`;
    }

    // ring grows over links and buttons
    const overLink = e.target.closest && e.target.closest('a, button, input, textarea');
    ring.classList.toggle('hover', !!overLink);
  });

  window.addEventListener('pointerdown', (e) => {
    ring.classList.add('down');
    waves.push({ x: e.clientX, y: e.clientY, r: 10, a: 1 });
    if (!reduce) emit(e.clientX, e.clientY, 0, 0, 60);
  });
  window.addEventListener('pointerup', () => ring.classList.remove('down'));

  function frame() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    speed *= 0.92;

    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.985; p.vy *= 0.985;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 78%, ${p.life})`);
      g.addColorStop(1, `hsla(${p.hue}, 100%, 55%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
    }

    for (let j = waves.length - 1; j >= 0; j--) {
      const w = waves[j];
      w.r += 11; w.a -= 0.02;
      if (w.a <= 0) { waves.splice(j, 1); continue; }
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(200, 130, 255, ${w.a})`;
      ctx.shadowColor = '#b45cff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(frame);
  }
  frame();

  // ---------- welcome <-> feedback views ----------
  const fb = document.getElementById('feedback');
  function show(view) {
    const isFb = view === 'feedback';
    document.body.classList.toggle('view-feedback', isFb);
    fb.setAttribute('aria-hidden', String(!isFb));
    if (isFb) setTimeout(() => document.getElementById('fbName').focus(), 350);
  }
  document.querySelectorAll('[data-view]').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); show(a.dataset.view); }));
  if (location.hash === '#feedback') show('feedback');

  // star rating
  let rating = 0;
  const stars = document.querySelectorAll('#stars button');
  stars.forEach((b) => b.addEventListener('click', () => {
    rating = +b.dataset.v;
    stars.forEach((s) => s.classList.toggle('on', +s.dataset.v <= rating));
  }));

  // submit (saved in this browser; connect to a backend/email service to receive it)
  document.getElementById('fbForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
      name: document.getElementById('fbName').value.trim(),
      rating, message: document.getElementById('fbMsg').value.trim(), date: new Date().toISOString()
    };
    try {
      const all = JSON.parse(localStorage.getItem('aura-feedback') || '[]');
      all.push(entry); localStorage.setItem('aura-feedback', JSON.stringify(all));
    } catch (err) {}
    document.getElementById('thanks').classList.add('show');
    e.target.reset(); rating = 0; stars.forEach((s) => s.classList.remove('on'));
  });
})();
