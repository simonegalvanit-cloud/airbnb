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

// ---- Languages ------------------------------------------------------
const LANG_NAMES = {
  en: 'English', it: 'Italiano', de: 'Deutsch', fr: 'Français', es: 'Español', nl: 'Nederlands',
  pt: 'Português', pl: 'Polski', sv: 'Svenska', da: 'Dansk', no: 'Norsk', cs: 'Čeština',
  ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية', he: 'עברית'
};
// Country (from the visitor's location) -> language
const COUNTRY_LANG = {
  IT: 'it', SM: 'it', VA: 'it',
  DE: 'de', AT: 'de', LI: 'de', CH: 'de',
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', MA: 'fr', TN: 'fr', DZ: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', UY: 'es', PY: 'es', BO: 'es', CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', CU: 'es',
  NL: 'nl', SR: 'nl', PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', PL: 'pl', SE: 'sv', DK: 'da', NO: 'no', CZ: 'cs',
  RU: 'ru', BY: 'ru', KZ: 'ru', CN: 'zh', TW: 'zh', HK: 'zh', JP: 'ja', KR: 'ko',
  SA: 'ar', AE: 'ar', EG: 'ar', QA: 'ar', KW: 'ar', JO: 'ar', IL: 'he',
  GB: 'en', IE: 'en', US: 'en', CA: 'en', AU: 'en', NZ: 'en', ZA: 'en', IN: 'en', SG: 'en'
};

let lang = 'it';
const langs = () => (data.languages && data.languages.length ? data.languages : ['en']);
const mainLang = () => (langs().includes(data.defaultLanguage) ? data.defaultLanguage : langs()[0]);
const isTr = v => v && typeof v === 'object' && !Array.isArray(v);

// Text in the current language, falling back to the main language
function tx(path) {
  const v = get(data, path);
  if (isTr(v)) return v[lang] || v[mainLang()] || v.en || Object.values(v).find(Boolean) || '';
  return v ?? '';
}
function needsTranslation(path) {
  if (lang === mainLang()) return false;
  const v = get(data, path);
  if (isTr(v)) return !v[lang] && !!v[mainLang()];
  // Names, numbers, prices and contact details don't need translating
  if (/(\.name|\.from|\.value|siteTitle|priceFrom|email|phone|cin|cir|address)$/.test(path)) return false;
  return /\p{L}{3}/u.test(String(v ?? ''));
}
// Save typed text into the language being edited
function setText(path, value) {
  const v = get(data, path);
  if (isTr(v)) { v[lang] = value; return; }
  if (lang === mainLang()) { set(data, path, value); return; }
  set(data, path, { [mainLang()]: v ?? '', [lang]: value });
}

async function detectCountry() {
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch('/api/geo', { signal: ctrl.signal });
    if (r.ok) return (await r.json()).country || '';
  } catch (_) {}
  return '';
}
const IS_BOT = /bot|crawl|spider|slurp|google|bing|yandex|duckduck|baidu|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent);
function pickLanguage(country) {
  if (IS_BOT) return mainLang(); // Google & link previews always get the main language
  const ok = l => l && langs().includes(l);
  let saved = ''; try { saved = localStorage.getItem('lang') || ''; } catch (_) {}
  if (ok(saved)) return saved;                                   // visitor chose it before
  const byCountry = COUNTRY_LANG[country];
  if (ok(byCountry)) return byCountry;                           // visitor's location
  for (const l of navigator.languages || [navigator.language]) { // phone/browser language
    const code = String(l).slice(0, 2).toLowerCase();
    if (ok(code)) return code;
  }
  return mainLang();
}
function setLang(l, remember) {
  lang = l;
  if (remember) { try { localStorage.setItem('lang', l); } catch (_) {} }
  render();
}

const ICONS = {
  'waves': 'Piscina',
  'wifi': 'Wi‑Fi',
  'chef-hat': 'Cucina',
  'snowflake': 'Aria condizionata',
  'thermometer-sun': 'Riscaldamento',
  'car': 'Auto / parcheggio',
  'washing-machine': 'Lavatrice',
  'laptop': 'Lavoro / scrivania',
  'flame': 'Stufa / camino / barbecue',
  'tv': 'TV',
  'coffee': 'Caffè',
  'trees': 'Giardino',
  'umbrella': 'Ombrellone',
  'paw-print': 'Animali',
  'bike': 'Bici',
  'bath': 'Vasca',
  'bed-double': 'Letto matrimoniale',
  'mountain': 'Vista / colline',
  'sun': 'Sole / terrazza',
  'baby': 'Bambini',
  'dumbbell': 'Palestra',
  'key-round': 'Chiavi / self check-in',
  'sofa': 'Divano',
  'armchair': 'Poltrona / soggiorno',
  'utensils-crossed': 'Pranzo',
  'wine': 'Vino',
  'grape': 'Vigneti',
  'cooking-pot': 'Pentole',
  'shower-head': 'Doccia',
  'book-open': 'Libri / lettura',
  'clock': 'Orario',
  'log-in': 'Arrivo (check-in)',
  'log-out': 'Partenza (check-out)',
  'cigarette-off': 'Vietato fumare',
  'receipt': 'Tasse / ricevuta',
  'train-front': 'Treno',
  'plane': 'Aereo',
  'bus': 'Autobus',
  'volume-x': 'Silenzio / niente feste',
  'languages': 'Lingue',
  'info': 'Informazione',
  'map-pin': 'Luogo',
  'bed': 'Biancheria / letto',
  'shopping-basket': 'Negozi',
  'accessibility': 'Accessibilità',
  'circle-parking': 'Parcheggio',
  'check': 'Altro (spunta)'
};

// Blank items used when the owner taps "+ Add"
const NEW_ITEM = {
  stats: () => ({ value: '0', label: 'Label' }),
  gallery: () => ({ image: '', caption: 'New photo' }),
  amenities: () => ({ icon: 'check', label: 'New amenity' }),
  reviews: () => ({ name: 'Guest', from: 'City', text: 'Write the review here.' }),
  rules: () => 'New rule',
  faq: () => ({ question: 'New question?', answer: 'Answer.' }),
  people: () => ({ name: 'Nome', phone: '+39 ' }),
  info: () => ({ icon: 'info', label: {}, value: {} })
};

let data = {};
let editing = false;
let dirty = false;
let password = '';

// ---------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------
// Content saved before a new feature existed lacks its texts: fill any missing
// field from the starter content, without touching what the owner has changed.
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function withDefaults(saved, def) {
  if (!isObj(saved) || !isObj(def)) return saved === undefined ? def : saved;
  const out = { ...saved };
  for (const k of Object.keys(def)) out[k] = k in saved ? withDefaults(saved[k], def[k]) : def[k];
  return out;
}

async function loadContent(fresh) {
  const defaultsP = fetch('/content/site.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({}));
  let saved = null;
  try {
    const r = await fetch('/api/content' + (fresh ? '?t=' + Date.now() : ''), { cache: fresh ? 'no-store' : 'default' });
    if (r.ok) saved = await r.json();
  } catch (_) { /* fall through */ }
  const defaults = await defaultsP;
  // Nothing saved yet (or running locally): use the starter content
  return saved ? withDefaults(saved, defaults) : defaults;
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function ctl(list, i, len, path) {
  if (!editing) return '';
  return `<div class="ctl" data-list="${path || list}" data-i="${i}">
    <button data-op="up" ${i === 0 ? 'disabled' : ''} title="Sposta prima"><i data-lucide="arrow-left"></i></button>
    <button data-op="down" ${i === len - 1 ? 'disabled' : ''} title="Sposta dopo"><i data-lucide="arrow-right"></i></button>
    <button data-op="del" class="danger" title="Elimina"><i data-lucide="trash-2"></i></button>
  </div>`;
}
const addBtn = (list, label) => editing ? `<button class="add-btn" data-add="${list}"><i data-lucide="plus"></i> ${label}</button>` : '';

function render() {
  const d = data;
  document.title = tx('meta.siteTitle') || 'Holiday home';
  document.querySelector('meta[name="description"]').content = tx('meta.seoDescription');
  document.documentElement.lang = lang;
  document.documentElement.dir = ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr';
  renderLanguageUI();
  document.documentElement.style.setProperty('--accent', d.meta?.accentColor || '#C4693D');

  // About text: paragraphs for visitors, one editable box for the owner
  $('about-body').innerHTML = editing
    ? `<div class="pre" data-text="about.body"></div>`
    : tx('about.body').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('');

  const stats = d.stats || [];
  $('stats').innerHTML = stats.map((s, i) =>
    `<div class="stat item">${ctl('stats', i, stats.length)}<b data-text="stats.${i}.value"></b><span data-text="stats.${i}.label"></span></div>`
  ).join('') + addBtn('stats', 'Aggiungi');

  const photos = d.gallery || [];
  $('gallery-grid').innerHTML = photos.map((g, i) => `
    <figure class="g-item item reveal" data-i="${i}">
      ${ctl('gallery', i, photos.length)}
      <img loading="lazy" decoding="async" data-src="gallery.${i}.image" ${g.thumb ? `srcset="${esc(g.thumb)} 825w, ${esc(g.image)} 1500w" sizes="${i === 0 || i === 3 ? '(max-width: 900px) 100vw, 700px' : '(max-width: 900px) 50vw, 340px'}"` : ''} alt="${esc(tx(`gallery.${i}.caption`))}">
      ${editing ? `<button class="photo-btn" data-photo="gallery.${i}.image"><i data-lucide="image"></i> Cambia</button>` : ''}
      ${(tx(`gallery.${i}.caption`) || editing) ? `<figcaption data-text="gallery.${i}.caption"></figcaption>` : ''}
    </figure>`).join('') + addBtn('gallery', 'Aggiungi foto');

  const am = d.amenities || [];
  $('amenities-list').innerHTML = am.map((a, i) => `
    <li class="item reveal">${ctl('amenities', i, am.length)}
      <i data-lucide="${esc(a.icon || 'check')}"></i><span data-text="amenities.${i}.label"></span>
      ${editing ? `<select class="icon-pick" data-field="amenities.${i}.icon">${Object.entries(ICONS).map(([v, l]) =>
        `<option value="${v}" ${v === a.icon ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
    </li>`).join('') + addBtn('amenities', 'Aggiungi servizio');

  renderMap();

  // Useful info: owners fill in what they want; empty items are hidden from visitors
  const info = d.info || [];
  const shown = info.map((_, i) => i).filter(i => editing || tx(`info.${i}.value`).trim());
  $('info-list').innerHTML = shown.map(i => `
    <div class="info-item item reveal">${ctl('info', i, info.length)}
      <i data-lucide="${esc(info[i].icon || 'info')}"></i>
      <div class="info-text">
        <b data-text="info.${i}.label"></b>
        <p data-text="info.${i}.value"></p>
      </div>
      ${editing ? `<select class="icon-pick" data-field="info.${i}.icon">${Object.entries(ICONS).map(([v, l]) =>
        `<option value="${v}" ${v === info[i].icon ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
    </div>`).join('') + addBtn('info', 'Aggiungi informazione');
  $('info').style.display = shown.length || editing ? '' : 'none';

  // Privacy text
  $('privacy-body').innerHTML = tx('privacy.text').split(/\n\s*\n/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

  const rv = d.reviews || [];
  $('reviews-list').innerHTML = rv.map((r, i) => `
    <div class="review item reveal">${ctl('reviews', i, rv.length)}
      <div class="stars">★★★★★</div>
      <p class="quote" data-text="reviews.${i}.text"></p>
      <div class="who"><b data-text="reviews.${i}.name"></b> · <span data-text="reviews.${i}.from"></span></div>
    </div>`).join('') + addBtn('reviews', 'Aggiungi recensione');

  const rules = d.rules || [];
  $('rules-list').innerHTML = rules.map((_, i) =>
    `<li class="item">${ctl('rules', i, rules.length)}<i data-lucide="check"></i><span data-text="rules.${i}"></span></li>`
  ).join('') + addBtn('rules', 'Aggiungi regola');

  const faq = d.faq || [];
  $('faq-list').innerHTML = faq.map((f, i) => editing
    ? `<div class="faq-edit item">${ctl('faq', i, faq.length)}<b data-text="faq.${i}.question"></b><p data-text="faq.${i}.answer"></p></div>`
    : `<details><summary>${esc(tx(`faq.${i}.question`))}</summary><p>${esc(tx(`faq.${i}.answer`))}</p></details>`
  ).join('') + addBtn('faq', 'Aggiungi domanda');

  // Contacts: one card per person, with Call + WhatsApp buttons
  const people = d.contact?.people || [];
  const digits = n => String(n || '').replace(/[^\d+]/g, '');
  $('people').innerHTML = people.map((pp, i) => `
    <div class="person item">${ctl('people', i, people.length, 'contact.people')}
      <div class="avatar">${esc((pp.name || '?').trim().charAt(0))}</div>
      <b class="p-name" data-text="contact.people.${i}.name"></b>
      <a class="p-phone" href="tel:${esc(digits(pp.phone))}" data-text="contact.people.${i}.phone"></a>
      <div class="p-actions">
        <a class="btn btn-sm" href="tel:${esc(digits(pp.phone))}"><i data-lucide="phone"></i><span data-text="labels.call"></span></a>
        ${d.contact?.whatsapp === false ? '' : `<a class="btn btn-sm btn-wa" href="https://wa.me/${esc(digits(pp.phone).replace(/^\+/, ''))}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i>WhatsApp</a>`}
      </div>
    </div>`).join('') + addBtn('people', 'Aggiungi contatto');
  const em = d.contact?.email || '';
  $('contact-email').href = 'mailto:' + em;
  $('contact-email-wrap').style.display = em || editing ? '' : 'none';

  // Hide sections that have nothing in them (owner still sees them while editing)
  const hide = (el, empty) => { el.style.display = empty && !editing ? 'none' : ''; };
  hide($('reviews'), !rv.length);
  hide($('rules-col'), !rules.length);
  hide($('faq-col'), !faq.length);
  hide($('faq'), !rules.length && !faq.length);
  $('faq').classList.toggle('one-col', !editing && (!rules.length || !faq.length));
  hide($('gallery'), !photos.length);
  // Price is optional
  document.querySelectorAll('.price-wrap').forEach(el => { el.style.display = d.booking?.priceFrom || editing ? '' : 'none'; });
  // CIN (codice identificativo nazionale) in the footer
  $('cin-wrap').style.display = d.meta?.cin || editing ? '' : 'none';
  $('cir-wrap').style.display = d.meta?.cir || editing ? '' : 'none';
  $('codes-sep').style.display = (d.meta?.cin && d.meta?.cir) || editing ? '' : 'none';
  $('cin-line').style.display = d.meta?.cin || d.meta?.cir || editing ? '' : 'none';
  $('wa-toggle').checked = d.contact?.whatsapp !== false;
  document.querySelector('.footer-addr').style.display = d.location?.address || editing ? '' : 'none';

  // Generic bindings
  document.querySelectorAll('[data-text]').forEach(el => {
    el.textContent = tx(el.dataset.text);
    el.classList.toggle('untranslated', editing && needsTranslation(el.dataset.text));
    if (editing) {
      el.contentEditable = 'plaintext-only';
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
      el.spellcheck = true;
    } else {
      el.removeAttribute('contenteditable');
    }
  });
  document.querySelectorAll('[data-href]').forEach(el => {
    const url = get(d, el.dataset.href) || '#contatti';
    el.href = url;
    if (/^https?:/i.test(url)) { el.target = '_blank'; el.rel = 'noopener'; } else { el.removeAttribute('target'); }
  });
  document.querySelectorAll('[data-src]').forEach(el => {
    const src = get(d, el.dataset.src);
    if (src) { el.src = src; el.classList.remove('empty'); } else { el.removeAttribute('src'); el.classList.add('empty'); }
  });
  document.querySelectorAll('[data-field]').forEach(el => { const v = get(d, el.dataset.field); el.value = isTr(v) ? tx(el.dataset.field) : (v ?? ''); });

  if (window.lucide) lucide.createIcons();
  if (window.onRendered) window.onRendered(editing);
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
  const photos = () => (data.gallery || []).map((g, k) => ({ image: g.image, caption: tx(`gallery.${k}.caption`) })).filter(g => g.image);
  const show = n => { const p = photos(); if (!p.length) return; i = (n + p.length) % p.length; img.src = p[i].image; cap.textContent = p[i].caption || ''; };
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
  $('edit-status').textContent = 'Modifiche non salvate';
  $('btn-save').classList.add('pulse');
}

function api(path, opts = {}) {
  return fetch(path, { ...opts, headers: { 'x-admin-password': password, ...(opts.headers || {}) } });
}

async function startEditing() {
  editing = true;
  document.body.classList.add('editing');
  data = await loadContent(true);
  lang = mainLang(); // owner always starts in the main language
  render();
  toast('Tocca un testo per modificarlo. Quando hai finito premi Salva.', 4000);
}

function setupEditor() {
  // Text typed on the page -> data
  document.addEventListener('input', e => {
    if (!editing) return;
    const el = e.target.closest('[data-text]');
    if (el) {
      const path = el.dataset.text;
      setText(path, el.innerText.replace(/\n$/, ''));
      el.classList.remove('untranslated');
      document.querySelectorAll(`[data-text="${path}"]`).forEach(o => { if (o !== el) { o.textContent = tx(path); o.classList.remove('untranslated'); } });
      markDirty();
      return;
    }
    const f = e.target.closest('[data-field]');
    if (f) {
      if (isTr(get(data, f.dataset.field))) setText(f.dataset.field, f.value); else set(data, f.dataset.field, f.value);
      markDirty();
      if (f.dataset.field === 'meta.accentColor') document.documentElement.style.setProperty('--accent', f.value);
    }
  });
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-field]');
    if (editing && f && f.tagName === 'SELECT') { set(data, f.dataset.field, f.value); markDirty(); render(); }
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
      const box = ctlBtn.closest('.ctl'); const list = get(data, box.dataset.list); const i = +box.dataset.i;
      const op = ctlBtn.dataset.op;
      if (op === 'del') { if (!confirm('Eliminare questo elemento?')) return; list.splice(i, 1); }
      if (op === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (op === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      markDirty(); render(); return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const k = add.dataset.add;
      if (k === 'people') { data.contact ??= {}; (data.contact.people ??= []).push(NEW_ITEM.people()); }
      else (data[k] ??= []).push(NEW_ITEM[k]());
      markDirty(); render();
      if (k === 'gallery') pickPhoto(`gallery.${data.gallery.length - 1}.image`);
      return;
    }
    const photo = e.target.closest('[data-photo]');
    if (photo) { pickPhoto(photo.dataset.photo); return; }
    const img = e.target.closest('img[data-src]');
    if (img && !img.classList.contains('hero-img')) { pickPhoto(img.dataset.src); return; }
  });

  $('wa-toggle').onchange = e => { data.contact ??= {}; data.contact.whatsapp = e.target.checked; markDirty(); render(); };
  $('btn-settings').onclick = () => $('drawer').classList.add('open');
  $('drawer-close').onclick = () => $('drawer').classList.remove('open');
  $('btn-preview').onclick = () => {
    const on = document.body.classList.toggle('previewing');
    editing = !on; render();
    $('btn-preview').querySelector('span').textContent = on ? 'Torna a modificare' : 'Anteprima';
  };
  $('btn-save').onclick = save;
  $('btn-logout').onclick = () => {
    if (dirty && !confirm('Hai modifiche non salvate. Uscire comunque?')) return;
    try { sessionStorage.removeItem('owner-pw'); } catch (_) {}
    dirty = false; location.href = '/';
  };
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
}

// Photos: shrink on the device (phone photos are huge), then upload
let photoTarget = null;
function pickPhoto(path) { photoTarget = path; $('file-input').value = ''; $('file-input').click(); }

// Resize in the browser with good quality: halve step by step (avoids a blurry,
// jagged result when shrinking a 4000px phone photo in one go), then sharpen a little.
async function shrink(file, max = 2000, sharpen = 0) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const tw = Math.round(bmp.width * Math.min(1, max / Math.max(bmp.width, bmp.height)));
    const th = Math.round(bmp.height * (tw / bmp.width));
    let src = bmp, w = bmp.width, h = bmp.height;
    while (w / 2 >= tw) {
      const c = document.createElement('canvas'); c.width = Math.round(w / 2); c.height = Math.round(h / 2);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height);
      src = c; w = c.width; h = c.height;
    }
    const c = document.createElement('canvas'); c.width = tw; c.height = th;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, tw, th);
    if (sharpen) sharpenCanvas(x, tw, th, sharpen);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.86));
  } catch (_) { return file; }
}
function sharpenCanvas(ctx, w, h, amount) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, o = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    for (let k = 0; k < 3; k++) {
      const blur = (o[i - 4 + k] + o[i + 4 + k] + o[i - w * 4 + k] + o[i + w * 4 + k]) / 4;
      d[i + k] = o[i + k] + amount * (o[i + k] - blur);
    }
  }
  ctx.putImageData(img, 0, 0);
}

async function sendPhoto(blob) {
  const r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Caricamento non riuscito');
  return (await r.json()).url;
}
// Uploads the full photo (for full screen) and a smaller sharp copy (for the grid)
async function uploadPhoto(file) {
  toast('Caricamento foto…', 60000);
  const [full, small] = await Promise.all([shrink(file, 2000), shrink(file, 1100, 0.35)]);
  const [url, thumb] = await Promise.all([sendPhoto(full), sendPhoto(small)]);
  return { url, thumb };
}

$('file-input').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file || !photoTarget) return;
  try {
    const { url, thumb } = await uploadPhoto(file);
    set(data, photoTarget, url);
    if (/\.image$/.test(photoTarget)) set(data, photoTarget.replace(/\.image$/, '.thumb'), thumb);
    markDirty(); render();
    toast('Foto aggiunta: ricordati di premere Salva');
  } catch (err) { toast('⚠️ ' + err.message, 5000); }
});

async function save() {
  const btn = $('btn-save'); btn.disabled = true;
  $('edit-status').textContent = 'Salvataggio…';
  try {
    const r = await api('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Salvataggio non riuscito');
    dirty = false;
    btn.classList.remove('pulse');
    $('edit-status').textContent = 'Salvato ✓ Online per tutti tra pochi secondi';
    toast('Salvato! Il sito è aggiornato.');
  } catch (err) {
    $('edit-status').textContent = 'Non salvato';
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
      await startEditing();
      const info = await r.json().catch(() => ({}));
      if (info.storage && info.storage !== 'ok') toast('⚠️ ' + info.storage, 9000);
    } else {
      $('login-error').textContent = r && r.status === 401 ? 'Password errata, riprova.' : 'Impossibile contattare il server.';
    }
  };
}

// ---------------------------------------------------------------------
// Language menus
// ---------------------------------------------------------------------
function renderLanguageUI() {
  const list = langs();
  $('lang').style.display = list.length > 1 ? '' : 'none';
  $('lang-current').textContent = lang.toUpperCase();
  $('lang-menu').innerHTML = list.map(l =>
    `<button data-lang="${l}" class="${l === lang ? 'on' : ''}">${LANG_NAMES[l] || l}</button>`).join('');
  $('edit-lang').innerHTML = list.map(l =>
    `<option value="${l}" ${l === lang ? 'selected' : ''}>✎ ${LANG_NAMES[l] || l}${l === mainLang() ? ' (principale)' : ''}</option>`).join('');
  $('lang-checks').innerHTML = Object.entries(LANG_NAMES).map(([l, n]) =>
    `<label class="lc"><input type="checkbox" value="${l}" ${list.includes(l) ? 'checked' : ''}> ${n}</label>`).join('');
  $('default-lang').innerHTML = list.map(l =>
    `<option value="${l}" ${l === mainLang() ? 'selected' : ''}>${LANG_NAMES[l] || l}</option>`).join('');
}

$('lang-btn').addEventListener('click', e => { e.stopPropagation(); $('lang').classList.toggle('open'); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b) { e.preventDefault(); setLang(b.dataset.lang, !editing); }
  if (!e.target.closest('#lang')) $('lang').classList.remove('open');
});
$('edit-lang').addEventListener('change', e => setLang(e.target.value, false));
$('lang-checks').addEventListener('change', () => {
  const picked = [...$('lang-checks').querySelectorAll('input:checked')].map(i => i.value);
  if (!picked.length) { toast('Tieni almeno una lingua'); renderLanguageUI(); return; }
  data.languages = picked;
  if (!picked.includes(data.defaultLanguage)) data.defaultLanguage = picked[0];
  if (!picked.includes(lang)) lang = mainLang();
  markDirty(); render();
});
$('default-lang').addEventListener('change', e => { data.defaultLanguage = e.target.value; markDirty(); render(); });

// ---------------------------------------------------------------------
// Cookies: Google Maps is the only third-party content, loaded only with consent
// ---------------------------------------------------------------------
const CONSENT_KEY = 'cookie-consent-v1';
function getConsent() { try { return localStorage.getItem(CONSENT_KEY) || ''; } catch (_) { return ''; } }
function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (_) {} hideBanner(); renderMap(); }
function showBanner() { $('cookie').classList.add('show'); }
function hideBanner() { $('cookie').classList.remove('show'); }
function renderMap() {
  const ok = getConsent() === 'all';
  const url = `https://maps.google.com/maps?q=${encodeURIComponent(data.location?.mapQuery || '')}&z=11&output=embed&hl=${lang}`;
  const frame = $('map');
  if (ok) { if (frame.getAttribute('src') !== url) frame.setAttribute('src', url); }
  else frame.removeAttribute('src');
  $('map-box').classList.toggle('blocked', !ok);
}
$('cookie-accept').onclick = () => setConsent('all');
$('cookie-reject').onclick = () => setConsent('necessary');
$('map-load').onclick = () => setConsent('all');
$('footer-cookies').onclick = e => { e.preventDefault(); showBanner(); };
const openPrivacy = e => { e.preventDefault(); $('privacy').classList.add('open'); };
$('footer-privacy').onclick = openPrivacy;
document.querySelectorAll('.privacy-open').forEach(a => a.onclick = openPrivacy);
$('privacy-close').onclick = () => $('privacy').classList.remove('open');
$('privacy').addEventListener('click', e => { if (e.target.id === 'privacy') $('privacy').classList.remove('open'); });

// ---------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------
(async function init() {
  onScroll();
  setupLightbox();
  setupEditor();
  const [content, country] = await Promise.all([loadContent(false), detectCountry()]);
  data = content;
  lang = pickLanguage(country);
  render();
  if (!getConsent() && !IS_BOT && location.pathname.replace(/\/$/, '') !== '/admin') setTimeout(showBanner, 600);

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
