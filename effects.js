// =====================================================================
//  Effects & animations for visitors.
//  Off while the owner is editing, and for "reduce motion" users.
// =====================================================================
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isEditing = () => document.body.classList.contains('editing') && !document.body.classList.contains('previewing');

  // ---- Scroll progress + phone booking bar ----
  const bar = document.getElementById('scroll-progress');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      const mb = document.querySelector('.mobile-bar');
      if (mb) mb.classList.toggle('show', scrollY > innerHeight * 0.6);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // ---- Ripple on every button tap ----
  document.addEventListener('pointerdown', e => {
    if (isEditing()) return;
    const b = e.target.closest('.btn, .btn-ghost');
    if (!b) return;
    const r = b.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // ---- Magnetic buttons (desktop only) ----
  if (finePointer && !reduce) {
    document.addEventListener('pointermove', e => {
      const b = e.target.closest('.btn-lg, .p-actions .btn, .nav .btn');
      document.querySelectorAll('.magnet').forEach(m => { if (m !== b) { m.style.translate = ''; m.classList.remove('magnet'); } });
      if (!b || isEditing()) return;
      const r = b.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
      b.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      b.classList.add('magnet');
    }, { passive: true });
  }

  // ---- Hero title: split into words that rise in ----
  function splitTitle() {
    const h1 = document.querySelector('.hero h1');
    if (!h1 || reduce) return;
    const text = h1.textContent;
    if (!text.trim()) return;
    h1.innerHTML = text.split(/(\s+)/).map((w, i) =>
      /\s+/.test(w) ? w : `<span class="w" style="animation-delay:${0.35 + i * 0.045}s">${w.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span>`
    ).join('');
  }

  // ---- Numbers count up when they appear ----
  const counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el)) return;
    const final = el.textContent.trim();
    const m = final.match(/^(\d+)([.,](\d+))?$/);
    if (!m || reduce) return;
    counted.add(el);
    const target = parseFloat(final.replace(',', '.'));
    const dec = m[3] ? m[3].length : 0;
    const sep = m[2] ? m[2][0] : '.';
    const dur = 1100, t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? (target * eased).toFixed(dec).replace('.', sep) : final;
      if (p < 1 && !isEditing()) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  }
  const statsObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting || isEditing()) return;
      en.target.querySelectorAll('.stat b').forEach(countUp);
      statsObserver.unobserve(en.target);
    });
  }, { threshold: 0.4 }) : null;

  // ---- Photos fade in when loaded ----
  function watchImages() {
    document.querySelectorAll('.g-item img, .about-img').forEach(img => {
      const done = () => img.classList.add('loaded');
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }

  // ---- Lightbox: swipe on phones + smooth photo change ----
  function setupLightboxExtras() {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lb-img');
    if (!lb || !img) return;
    let x0 = null, y0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lb.querySelector(dx < 0 ? '.lb-next' : '.lb-prev').click();
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lb.querySelector('.lb-close').click();
    }, { passive: true });
    // fade/slide when the photo changes
    let last = '';
    new MutationObserver(() => {
      if (reduce || img.src === last) return;
      last = img.src;
      img.classList.add('swap');
      const show = () => requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove('swap')));
      if (img.complete) show(); else img.addEventListener('load', show, { once: true });
    }).observe(img, { attributes: true, attributeFilter: ['src'] });
  }

  // Called by app.js after every render
  window.onRendered = function (editing) {
    if (editing && !document.body.classList.contains('previewing')) return;
    splitTitle();
    watchImages();
    const stats = document.getElementById('stats');
    if (stats && statsObserver) statsObserver.observe(stats);
    onScroll();
  };

  document.addEventListener('DOMContentLoaded', setupLightboxExtras);
  if (document.readyState !== 'loading') setupLightboxExtras();
})();
