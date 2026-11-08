// =====================================================================
//  Holiday home website
//  - Visitors: content is loaded from /api/content and rendered.
//  - Owner:    visit /admin, enter password, edit on the page, Save.
// =====================================================================

const $ = id => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const set = (o, p, v) => {
  const keys = p.split('.'); const last = keys.pop();
  const t = keys.reduce((x, k) => (x[k] ??= /^\d+$/.test(k) ? [] : {}), o);
  t[last] = v;
};

const ICONS = {
  waves: 'Pool', wifi: 'Wi‑Fi', 'chef-hat': 'Kitchen', snowflake: 'Air con', 'thermometer-sun': 'Heating',
  car: 'Parking', 'washing-machine': 'Washer', laptop: 'Workspace', flame: 'BBQ / fire', tv: 'TV',
  coffee: 'Coffee', trees: 'Garden', umbrella: 'Beach', 'paw-print': 'Pets', bike: 'Bike', bath: 'Bath',
  'bed-double': 'Bed', mountain: 'View', sun: 'Terrace', baby: 'Baby', dumbbell: 'Gym',
  'key-round': 'Self check-in', check: 'Other'
};

// Blank items used when the owner taps "+ Add"
const NEW_ITEM = {
  stats: () => ({ value: '0', label: 'Label' }),
  gallery: () => ({ image: '', caption: 'New photo' }),
  amenities: () => ({ icon: 'check', label: 'New amenity' }),
  reviews: () => ({ name: 'Guest', from: 'City', text: 'Write the review here.' }),
  rules: () => 'New rule',
  faq: () => ({ question: 'New question?', answer: 'Answer.' })
};

let data = {};
let editing = false;
let dirty = false;
let password = '';

// ---------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------
async function loadContent(fresh) {
  try {
    const r = await fetch('/api/content' + (fresh ? '?t=' + Date.now() : ''), { cache: fresh ? 'no-store' : 'default' });
    if (r.ok) return await r.json();
  } catch (_) { /* fall through */ }
  // Nothing saved yet (or running locally): use the starter content
  const r = await fetch('/content/site.json', { cache: 'no-cache' });
  return r.json();
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function ctl(list, i, len) {
  if (!editing) return '';
  return `<div class="ctl" data-list="${list}" data-i="${i}">
    <button data-op="up" ${i === 0 ? 'disabled' : ''} title="Move earlier"><i data-lucide="arrow-left"></i></button>
    <button data-op="down" ${i === len - 1 ? 'disabled' : ''} title="Move later"><i data-lucide="arrow-right"></i></button>
    <button data-op="del" class="danger" title="Remove"><i data-lucide="trash-2"></i></button>
  </div>`;
}
const addBtn = (list, label) => editing ? `<button class="add-btn" data-add="${list}"><i data-lucide="plus"></i> ${label}</button>` : '';

function render() {
  const d = data;
  document.title = d.meta?.siteTitle || 'Holiday home';
  document.querySelector('meta[name="description"]').content = d.meta?.seoDescription || '';
  document.documentElement.style.setProperty('--accent', d.meta?.accentColor || '#C4693D');

  // About text: paragraphs for visitors, one editable box for the owner
  $('about-body').innerHTML = editing
    ? `<div class="pre" data-text="about.body"></div>`
    : (d.about?.body || '').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('');

  const stats = d.stats || [];
  $('stats').innerHTML = stats.map((s, i) =>
    `<div class="stat item">${ctl('stats', i, stats.length)}<b data-text="stats.${i}.value"></b><span data-text="stats.${i}.label"></span></div>`
  ).join('') + addBtn('stats', 'Add');

  const photos = d.gallery || [];
  $('gallery-grid').innerHTML = photos.map((g, i) => `
    <figure class="g-item item reveal" data-i="${i}">
      ${ctl('gallery', i, photos.length)}
      <img loading="lazy" data-src="gallery.${i}.image" alt="${esc(g.caption)}">
      ${editing ? `<button class="photo-btn" data-photo="gallery.${i}.image"><i data-lucide="image"></i> Change</button>` : ''}
      ${(g.caption || editing) ? `<figcaption data-text="gallery.${i}.caption"></figcaption>` : ''}
    </figure>`).join('') + addBtn('gallery', 'Add photo');

  const am = d.amenities || [];
  $('amenities-list').innerHTML = am.map((a, i) => `
    <li class="item reveal">${ctl('amenities', i, am.length)}
      <i data-lucide="${esc(a.icon || 'check')}"></i><span data-text="amenities.${i}.label"></span>
      ${editing ? `<select class="icon-pick" data-field="amenities.${i}.icon">${Object.entries(ICONS).map(([v, l]) =>
        `<option value="${v}" ${v === a.icon ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
    </li>`).join('') + addBtn('amenities', 'Add amenity');

  $('map').src = `https://maps.google.com/maps?q=${encodeURIComponent(d.location?.mapQuery || '')}&z=11&output=embed`;

  const rv = d.reviews || [];
  $('reviews-list').innerHTML = rv.map((r, i) => `
    <div class="review item reveal">${ctl('reviews', i, rv.length)}
      <div class="stars">★★★★★</div>
      <p class="quote" data-text="reviews.${i}.text"></p>
      <div class="who"><b data-text="reviews.${i}.name"></b> · <span data-text="reviews.${i}.from"></span></div>
    </div>`).join('') + addBtn('reviews', 'Add review');

  const rules = d.rules || [];
  $('rules-list').innerHTML = rules.map((_, i) =>
    `<li class="item">${ctl('rules', i, rules.length)}<i data-lucide="check"></i><span data-text="rules.${i}"></span></li>`
  ).join('') + addBtn('rules', 'Add rule');

  const faq = d.faq || [];
  $('faq-list').innerHTML = faq.map((f, i) => editing
    ? `<div class="faq-edit item">${ctl('faq', i, faq.length)}<b data-text="faq.${i}.question"></b><p data-text="faq.${i}.answer"></p></div>`
    : `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`
  ).join('') + addBtn('faq', 'Add question');

  // Contact links
  const em = d.contact?.email || '', ph = d.contact?.phone || '';
  $('contact-email').href = 'mailto:' + em;
  $('contact-phone').href = 'tel:' + ph.replace(/\s/g, '');
  document.querySelector('.dot').style.display = (em && ph) || editing ? '' : 'none';

  // Generic bindings
  document.querySelectorAll('[data-text]').forEach(el => {
    el.textContent = get(d, el.dataset.text) ?? '';
    if (editing) {
      el.contentEditable = 'plaintext-only';
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
      el.spellcheck = true;
    } else {
      el.removeAttribute('contenteditable');
    }
  });
  document.querySelectorAll('[data-href]').forEach(el => { el.href = get(d, el.dataset.href) || '#'; });
  document.querySelectorAll('[data-src]').forEach(el => {
    const src = get(d, el.dataset.src);
    if (src) { el.src = src; el.classList.remove('empty'); } else { el.removeAttribute('src'); el.classList.add('empty'); }
  });
  document.querySelectorAll('[data-field]').forEach(el => { el.value = get(d, el.dataset.field) ?? ''; });

  if (window.lucide) lucide.createIcons();
  setupReveal();
}

// ---------------------------------------------------------------------
// Visitor interactions
// ---------------------------------------------------------------------
let io;
function setupReveal() {
  if (editing) { document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); return; }
  io?.disconnect();
  io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal:not(.in)').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
}

function setupLightbox() {
  const lb = $('lightbox'), img = $('lb-img'), cap = $('lb-cap');
  let i = 0;
  const photos = () => (data.gallery || []).filter(g => g.image);
  const show = n => { const p = photos(); i = (n + p.length) % p.length; img.src = p[i].image; cap.textContent = p[i].caption || ''; };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  $('gallery-grid').addEventListener('click', e => {
    if (editing) return;
    const f = e.target.closest('.g-item'); if (!f) return;
    show(+f.dataset.i); lb.classList.add('open'); document.body.style.overflow = 'hidden';
  });
  lb.querySelector('.lb-close').onclick = close;
  lb.querySelector('.lb-prev').onclick = () => show(i - 1);
  lb.querySelector('.lb-next').onclick = () => show(i + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
}

const nav = $('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });

// ---------------------------------------------------------------------
// Owner editing
// ---------------------------------------------------------------------
function toast(msg, ms = 2600) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
function markDirty() {
  dirty = true;
  $('edit-status').textContent = 'Unsaved changes';
  $('btn-save').classList.add('pulse');
}

function api(path, opts = {}) {
  return fetch(path, { ...opts, headers: { 'x-admin-password': password, ...(opts.headers || {}) } });
}

async function startEditing() {
  editing = true;
  document.body.classList.add('editing');
  data = await loadContent(true);
  render();
  toast('Tap any text to change it. Tap Save when you\'re done.', 4000);
}

function setupEditor() {
  // Text typed on the page -> data
  document.addEventListener('input', e => {
    if (!editing) return;
    const el = e.target.closest('[data-text]');
    if (el) {
      const path = el.dataset.text;
      set(data, path, el.innerText.replace(/\n$/, ''));
      document.querySelectorAll(`[data-text="${path}"]`).forEach(o => { if (o !== el) o.textContent = get(data, path); });
      markDirty();
      return;
    }
    const f = e.target.closest('[data-field]');
    if (f) {
      set(data, f.dataset.field, f.value);
      markDirty();
      if (f.dataset.field === 'meta.accentColor') document.documentElement.style.setProperty('--accent', f.value);
    }
  });
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-field]');
    if (editing && f) { set(data, f.dataset.field, f.value); markDirty(); render(); }
  });

  // Single-line fields: Enter finishes editing instead of adding a line
  document.addEventListener('keydown', e => {
    const el = e.target.closest?.('[data-text]');
    if (editing && el && e.key === 'Enter' && !['about.body'].includes(el.dataset.text) && !el.classList.contains('quote') && el.tagName !== 'P') {
      e.preventDefault(); el.blur();
    }
  });

  // Clicks while editing
  document.addEventListener('click', async e => {
    if (!editing) return;
    // Links must not navigate while editing
    const a = e.target.closest('a[href]');
    if (a && !a.classList.contains('modal-link')) e.preventDefault();

    const ctlBtn = e.target.closest('.ctl button');
    if (ctlBtn) {
      const box = ctlBtn.closest('.ctl'); const list = data[box.dataset.list]; const i = +box.dataset.i;
      const op = ctlBtn.dataset.op;
      if (op === 'del') { if (!confirm('Remove this item?')) return; list.splice(i, 1); }
      if (op === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (op === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      markDirty(); render(); return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const k = add.dataset.add; (data[k] ??= []).push(NEW_ITEM[k]());
      markDirty(); render();
      if (k === 'gallery') pickPhoto(`gallery.${data.gallery.length - 1}.image`);
      return;
    }
    const photo = e.target.closest('[data-photo]');
    if (photo) { pickPhoto(photo.dataset.photo); return; }
    const img = e.target.closest('img[data-src]');
    if (img && !img.classList.contains('hero-img')) { pickPhoto(img.dataset.src); return; }
  });

  $('btn-settings').onclick = () => $('drawer').classList.add('open');
  $('drawer-close').onclick = () => $('drawer').classList.remove('open');
  $('btn-preview').onclick = () => {
    const on = document.body.classList.toggle('previewing');
    editing = !on; render();
    $('btn-preview').querySelector('span').textContent = on ? 'Back to editing' : 'Preview';
  };
  $('btn-save').onclick = save;
  $('btn-logout').onclick = () => {
    if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
    try { sessionStorage.removeItem('owner-pw'); } catch (_) {}
    dirty = false; location.href = '/';
  };
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
}

// Photos: shrink on the device (phone photos are huge), then upload
let photoTarget = null;
function pickPhoto(path) { photoTarget = path; $('file-input').value = ''; $('file-input').click(); }

async function shrink(file, max = 2000) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
  } catch (_) { return file; }
}

async function uploadPhoto(file) {
  toast('Uploading photo…', 60000);
  const blob = await shrink(file);
  const r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Upload failed');
  return (await r.json()).url;
}

$('file-input').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file || !photoTarget) return;
  try {
    const url = await uploadPhoto(file);
    set(data, photoTarget, url); markDirty(); render();
    toast('Photo added — remember to Save');
  } catch (err) { toast('⚠️ ' + err.message, 5000); }
});

async function save() {
  const btn = $('btn-save'); btn.disabled = true;
  $('edit-status').textContent = 'Saving…';
  try {
    const r = await api('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Save failed');
    dirty = false;
    btn.classList.remove('pulse');
    $('edit-status').textContent = 'Saved ✓ Live for everyone within a few seconds';
    toast('Saved! Your website is updated.');
  } catch (err) {
    $('edit-status').textContent = 'Not saved';
    toast('⚠️ ' + err.message, 5000);
  } finally { btn.disabled = false; }
}

function showLogin() {
  $('login').classList.add('open');
  $('login-pw').focus();
  $('login-form').onsubmit = async e => {
    e.preventDefault();
    password = $('login-pw').value;
    $('login-error').textContent = '';
    const r = await api('/api/login', { method: 'POST' }).catch(() => null);
    if (r && r.ok) {
      try { sessionStorage.setItem('owner-pw', password); } catch (_) {}
      $('login').classList.remove('open');
      startEditing();
    } else {
      $('login-error').textContent = r && r.status === 401 ? 'Wrong password, try again.' : 'Could not reach the server.';
    }
  };
}

// ---------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------
(async function init() {
  onScroll();
  setupLightbox();
  setupEditor();
  data = await loadContent(false);
  render();

  if (location.pathname.replace(/\/$/, '') === '/admin') {
    let saved = '';
    try { saved = sessionStorage.getItem('owner-pw') || ''; } catch (_) {}
    if (saved) {
      password = saved;
      const r = await api('/api/login', { method: 'POST' }).catch(() => null);
      if (r && r.ok) return startEditing();
    }
    showLogin();
  }
})();
