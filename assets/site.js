/* Shared behaviour: live TikTok stats, scroll reveals, count-up numbers, active nav link. */
(function () {
  const S = window.WHEAT_STATS || {};
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : n.toLocaleString('en-GB');

  // Fill every [data-stat] from data/stats.js (refreshed daily by scripts/update-stats.js).
  document.querySelectorAll('[data-stat]').forEach(el => {
    const v = S[el.dataset.stat];
    if (v === undefined || v === null || v === '') return;
    if (typeof v === 'number') { el.dataset.count = v; el.textContent = fmt(v); }
    else el.textContent = el.dataset.stat === 'bio' ? String(v).split('\n')[0] : v;
  });
  document.querySelectorAll('img[data-avatar]').forEach(img => {
    img.addEventListener('error', () => { if (!img.src.endsWith('wheat.jpg')) img.src = 'assets/wheat.jpg'; }, { once: true });
  });
  document.querySelectorAll('[data-updated]').forEach(el => {
    if (!S.updated) return;
    const d = new Date(S.updated);
    el.textContent = 'Live from TikTok · updated ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });

  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Count numbers up when they scroll into view.
  function countUp(el) {
    const target = +el.dataset.count; if (!target || reduce) return;
    const t0 = performance.now(), dur = 1400;
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(target * e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // Reveal on scroll.
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  window.WheatReveal = (root = document) => root.querySelectorAll('.reveal:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  window.WheatReveal();

  // Highlight the nav link for the section on screen.
  const links = [...document.querySelectorAll('.navpill a[href^="#"]')];
  if (links.length && io) {
    const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
