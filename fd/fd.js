/* Decade · Fixed deposits — new flow, with spring physics and shared-element morphs */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const stage = $('#stage'), pagesEl = $('#pages'), layer = $('#layer');
const EMB = window.parent !== window;
if (EMB) document.body.classList.add('embedded');
if (EMB) document.addEventListener('pointerup', () => { try { parent.postMessage({ decade: 'tap' }, '*'); } catch (_) {} }, { once: true, capture: true });
document.addEventListener('touchstart', () => {}, { passive: true });

/* ---------------- fit (only when opened on its own) ---------------- */
let K = 1;
function fit() {
  if (EMB) { K = 1; stage.style.transform = ''; return; }
  const w = innerWidth, h = innerHeight; K = Math.min(w / 390, h / 849);
  stage.style.transform = `translate(${(w - 390 * K) / 2}px, ${(h - 849 * K) / 2}px) scale(${K})`;
}
fit(); addEventListener('resize', fit);
function R(el) { // rect in stage units
  const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: (r.left - s.left) / K, y: (r.top - s.top) / K, w: r.width / K, h: r.height / K };
}

/* ---------------- springs → CSS linear() easing ---------------- */
const LIN = CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)');
function spring(k, c, m = 1) {
  let x = 0, v = 0, t = 0; const pts = [0], dt = 1 / 240;
  while (t < 2.4) {
    for (let i = 0; i < 4; i++) { const a = (-k * (x - 1) - c * v) / m; v += a * dt; x += v * dt; }
    t += 1 / 60; pts.push(x);
    if (Math.abs(1 - x) < 0.0015 && Math.abs(v) < 0.02) break;
  }
  pts[pts.length - 1] = 1;
  const z = 1 - Math.exp(-c / (2 * Math.sqrt(k * m)) * 3);
  return { e: LIN ? `linear(${pts.map((n) => +n.toFixed(4)).join(',')})` : (z > .9 ? 'cubic-bezier(.2,.9,.25,1)' : 'cubic-bezier(.3,1.35,.4,1)'), d: Math.round(t * 1000) };
}
const SNAP = spring(420, 40), SOFT = spring(230, 28), BOUNCE = spring(340, 21), GENTLE = spring(150, 25), QUICK = spring(700, 52);
const EASE = { e: 'cubic-bezier(.22,1,.36,1)', d: 420 }, FADE = { e: 'ease', d: 220 };

function A(el, kf, sp = SNAP, o = {}) {
  if (!el) return Promise.resolve();
  const a = el.animate(kf, { duration: o.d || sp.d, easing: sp.e, delay: o.delay || 0, fill: 'both' });
  return a.finished.then(() => {
    const last = Object.assign({}, kf[kf.length - 1]); delete last.offset; delete last.easing;
    // identity values hand control back to the stylesheet; anything else stays where the motion ended
    for (const [k, v] of Object.entries(last)) el.style[k] = ((k === 'transform' && v === 'none') || (k === 'opacity' && +v === 1)) ? '' : v;
    a.cancel();
  }).catch(() => {});
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let busy = false;
const lock = (ms = 380) => { busy = true; clearTimeout(lock.t); lock.t = setTimeout(() => { busy = false; }, ms); };

/* ---------------- data ---------------- */
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const mat = (a, r, y) => a * Math.pow(1 + r / 100, y);
const B = {
  shiv: { n: 'Shivalik SF Bank', l: 'Shivalik Small Finance Bank', img: 'shivalik', since: 'Since 2010 • Private bank', tag: 'DICGC insured' },
  shri: { n: 'Shriram finance', l: 'Shriram Finance', img: 'shriram', full: 1, since: 'Since 1979 • NBFC', tag: 'DICGC insured' },
  sur: { n: 'Suryoday SF bank', l: 'Suryoday Small Finance Bank', img: 'suryoday', since: 'Since 2008 • Public bank', tag: 'DICGC insured' },
  jana: { n: 'Jana SF Bank', l: 'Jana Small Finance Bank', img: 'jana', full: 1, since: 'Since 2006 • Private bank', tag: 'DICGC insured' },
  unity: { n: 'Unity SF Bank', l: 'Unity Small Finance Bank', img: 'unity', full: 1, since: 'Since 2021 • Private bank', tag: 'DICGC insured' },
};
const CATS = {
  high: ['High returns', 'Up to 8.30% a year', '#21a32a'], monthly: ['Monthly payouts', 'Interest paid monthly', '#e8517a'],
  instant: ['Instant withdrawals', 'Break it anytime', '#9a55b5'],
};
const PLANS = {
  fd: [['More than 1 year', '#c43960', [['5 years', 5, 8.25], ['3 years', 3, 4], ['1 year', 1, 4]]],
    ['Up to 1 year', '#8f5aa0', [['6 months', .5, 4], ['9 months', .75, 4], ['1 year', 1, 4]]],
    ['Up to 3 months', '#cf8a2e', [['14 days', .04, 4], ['45 days', .12, 4.25], ['90 days', .25, 4.5]]]],
  rd: [['More than 1 year', '#2f7d9a', [['5 years', 5, 7.75], ['3 years', 3, 7.4], ['2 years', 2, 7.2]]],
    ['Up to 1 year', '#5b6fb5', [['12 months', 1, 6.9], ['9 months', .75, 6.6], ['6 months', .5, 6.2]]]],
};
const S = {
  tab: 0, dtab: 1, calcT: 3, calcAmt: 1292, recI: 0, ptab: 0,
  sel: { bank: 'sur', ten: '5 Years', yrs: 5, rate: 8.25 }, amt: 50000, fresh: true,
  steps: [], pan: [1, 0, 0], nom: 0, acc: 0, reinv: false, newDep: null, form: {},
  noms: [{ n: 'Jojo Maria George', r: 'Husband', d: '14/10/1991' }, { n: 'Roshni Singh', r: 'Sister', d: '22/06/1995' }],
  accts: [{ b: 'HDFC bank savings', s: 'HDFC', n: '3456', lg: 'hdfc' }, { b: 'HDFC bank savings', s: 'HDFC', n: '8821', lg: 'hdfc' }, { b: 'HDFC bank savings', s: 'HDFC', n: '1047', lg: 'hdfc' }],
};
// the three recommendation card layouts from the design (same FD, shown three ways)
const REC = [
  { v: 1, bank: 'sur', amt: 500000, rate: 8.31, ten: '5Y 3M 16D', yrs: 5.29 },
  { v: 2, bank: 'sur', amt: 0, rate: 8.31, ten: '5Y 3M 16D', yrs: 5.29 },
  { v: 3, bank: 'sur', amt: 500000, rate: 8.31, ten: '5Y 3M 16D', yrs: 5.29 },
];
// an FD that was started but not finished; shows as "Complete your FD"
S.pend = { bank: 'sur', amt: 500000, ten: '5Y 3M 16D', yrs: 5.29, rate: 8.31, stage: 'kyc', step: 'pan' };
const STAGE = { kyc: ['Complete KYC', 'Start KYC'], pan: ['Verify PAN', 'Start'], details: ['Enter details', 'Start'] };
const ORDER = ['select', 'amount', 'pan', 'aadhaar', 'personal', 'income', 'nominee', 'addnom', 'acct', 'addacct', 'review'];
const ASKQ = [['Mutual fund market', 'How mutual funds performed in the last 6 months?', '#ffe9ee'], ['FD investments', 'Is safe to invest in an FD?', '#fff1cc'], ['FD vs Savings', 'FD or savings - which is better for me?', '#f8f7cc'], ['FD taxes', 'How FD interest taxed?', '#e4e8ee'], ['DICGS insurance', 'What is DICGC insurance?', '#ffe9ee']];
const TENURES = [['Upto<br>1 Year', 'Upto 1 Year'], ['Upto<br>5 Years', 'Upto 5 Years'], ['Beyond<br>5 Years', 'Beyond 5 Years']];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bankName = (k) => B[k].n.replace(' bank', ' Bank');
const CALC_T = [['5Y', 5, '5 Years'], ['3Y', 3, '3 Years'], ['1Y', 1, '1 Year'], ['6M', .5, '6 Months'], ['3M', .25, '3 Months']];

/* ---------------- icons ---------------- */
const MARK_D = 'M17 8.5C17 10.8477 16.0383 12.9727 14.4828 14.5103C12.9282 16.0488 10.7797 17 8.40605 17H2.11658V14.9074L8.59484 8.5L7.6438 7.55935L4.43968 10.7276H2.11658V2.09256L0 0H8.40605C13.1524 0 17 3.80554 17 8.5Z';
const I = {
  back: '<svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10 2L2 10l8 8" stroke="#1c1c1c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="#292929" stroke-width="2"/><path d="M16 16l4 4" stroke="#292929" stroke-width="2" stroke-linecap="round"/></svg>',
  calc: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2.5" stroke="#292929" stroke-width="1.8"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" stroke="#292929" stroke-width="2" stroke-linecap="round"/></svg>',
  filter: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M7 12h10M10 17h4" stroke="#292929" stroke-width="2" stroke-linecap="round"/></svg>',
  dots: '<svg width="18" height="4" viewBox="0 0 18 4"><circle cx="2" cy="2" r="2"/><circle cx="9" cy="2" r="2"/><circle cx="16" cy="2" r="2"/></svg>',
  chev: (c = '#292929') => `<svg class="chev" width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1.5 1.5l5 5-5 5" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevs: (c = '#4a1d17') => `<svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevd: '<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#4a1d17" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  send: '<svg width="14" height="19" viewBox="0 0 13 18"><path d="M1.78 17.79L12.13 10.72c1.14-.78 1.14-2.68 0-3.46L1.78.19C.84-.45-.3.62.07 1.81L2 8.02l3.71.97L2 9.96.07 16.17c-.37 1.2.76 2.27 1.71 1.62z" fill="#fff"/></svg>',
  mark: (c = '#6c4126', s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 17 17"><path d="${MARK_D}" fill="${c}"/></svg>`,
  pen: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10.5 2.5l3 3L6 13H3v-3zM3 14.5h10" stroke="#292929" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bolt: '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M4.75 10.41L9.71 1.91v5.67h3.54l-4.96 8.5v-5.67H4.75z" stroke="#292929" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  sun: '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="9" cy="9" r="2.83" stroke="#292929" stroke-width="1.4"/><path d="M14.67 9h.7M2.63 9h.7M9 14.66v.71M9 2.63v.7M13 13l.5.5M4.5 4.5l.5.5M5 13l-.5.5M13.5 4.5l-.5.5" stroke="#292929" stroke-width="1.4" stroke-linecap="round"/></svg>',
  shield: (c = '#292929', s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 17 17" fill="none"><path d="M4.47 4.57L9 2.63l4.53 1.94c.26.11.43.37.43.65v4.86c0 1.53-.82 2.93-2.14 3.69L9 15.38l-2.82-1.61a4.24 4.24 0 0 1-2.14-3.69V5.22c0-.28.17-.54.43-.65z" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/><path d="M11.13 7.59L8.29 10.42 6.88 9" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dicgc: '<svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 1.2l5.6 2.3v4.1c0 3.4-2.3 6.1-5.6 7.2C4.7 13.7 2.4 11 2.4 7.6V3.5z" fill="#e0306a"/><path d="M5.6 8l1.7 1.7 3.2-3.3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tick: '<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#292929" stroke-width="2" stroke-linecap="round"/></svg>',
  xw: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  del: '<svg width="30" height="22" viewBox="0 0 24 18" fill="none"><path d="M7.5 1.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13L1.5 9z" stroke="#645f5f" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 5.5l7 7m0-7l-7 7" stroke="#645f5f" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bell: '<svg width="18" height="19" viewBox="0 0 18 19" fill="none"><path d="M9 1.5a5 5 0 0 0-5 5v3.2L2.4 13h13.2L14 9.7V6.5a5 5 0 0 0-5-5z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M6.8 15.5a2.3 2.3 0 0 0 4.4 0" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>',
  lock: '<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><rect x="1" y="6" width="10" height="7" rx="2" fill="#1a8d1a"/><path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#1a8d1a" stroke-width="1.6"/></svg>',
  bars: (c, s = 39, r = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 39 39" style="flex:none"><rect width="39" height="39" rx="${r * 39 / s}" fill="${c}"/><rect x="10.5" y="21.5" width="3" height="4" rx="1.5" fill="#fff" opacity=".75"/><rect x="15.5" y="19.5" width="3" height="6" rx="1.5" fill="#fff" opacity=".85"/><rect x="20.5" y="16.5" width="3" height="9" rx="1.5" fill="#fff"/><rect x="25.5" y="13.5" width="3" height="12" rx="1.5" fill="#fff"/></svg>`,
  cat: {
    high: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4 23v-4M9.5 23v-7M15 23v-5M20.5 23v-9" stroke="#21a32a" stroke-width="2" stroke-linecap="round"/><path d="M3.5 13.5l6-6 4.5 3.5 7.5-7.5M16.5 3.5h5v5" stroke="#21a32a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    monthly: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3.5" y="5" width="19" height="17" rx="4" stroke="#e8517a" stroke-width="1.9"/><path d="M3.5 10.5h19M8.5 3v4M17.5 3v4" stroke="#e8517a" stroke-width="1.9" stroke-linecap="round"/><circle cx="13" cy="16" r="2.4" stroke="#e8517a" stroke-width="1.7"/></svg>',
    instant: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3.5" y="6" width="19" height="16" rx="4" stroke="#9a55b5" stroke-width="1.9"/><path d="M6 6l9-2.5a2 2 0 0 1 2.5 1.5L18 6" stroke="#9a55b5" stroke-width="1.9" stroke-linejoin="round"/><path d="M14 10l-3 4.5h4L12 19" stroke="#9a55b5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
};
const logo = (k, cls = '') => `<div class="logo ${B[k].full ? 'full' : ''} ${cls}" data-logo><i><img src="img/${B[k].img}.png" alt=""></i></div>`;

/* ---------------- pages & navigation ---------------- */
const stack = [];
const top = () => stack[stack.length - 1];
function mkPage(cls, html) {
  const p = document.createElement('div');
  p.className = 'page ' + cls; p.innerHTML = html + '<div class="dim"></div>';
  return p;
}
const UNDER = -109;
function setUnder(p, on) {
  p.classList.toggle('under', on);
  p.style.transform = on ? `translateX(${UNDER}px)` : '';
  $('.dim', p).style.opacity = on ? .08 : 0;
}
function stagger(p, delay = 60) {
  $$('[data-st]', p).slice(0, 9).forEach((el, i) => A(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: delay + i * 38 }));
}
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
function push(p, how = 'slide', o = {}) {
  const prev = top();
  p.style.transform = how === 'slide' ? 'translateX(100%)' : how === 'up' ? 'translateY(100%)' : '';
  if (how === 'fade') p.style.opacity = 0;
  pagesEl.appendChild(p); stack.push(p);
  if (p._init) p._init();
  lock(SNAP.d * .6 + 40);
  frame().then(() => { p.style.opacity = ''; pushGo(p, prev, how, o); });
  return p;
}
function pushGo(p, prev, how, o) {
  if (how === 'slide') {
    A(p, [{ transform: 'translateX(100%)' }, { transform: 'none' }], SNAP);
    if (prev) { prev.classList.add('under'); A(prev, [{ transform: 'none' }, { transform: `translateX(${UNDER}px)` }], SNAP); A($('.dim', prev), [{ opacity: 0 }, { opacity: .08 }], SNAP); }
    if (!o.noStagger) stagger(p, 90);
  } else if (how === 'up') {
    A(p, [{ transform: 'translateY(100%)' }, { transform: 'none' }], SOFT);
    if (prev) wait(SOFT.d).then(() => { if (stack.includes(prev)) setUnder(prev, true); });
  } else if (how === 'fade') {
    A(p, [{ opacity: 0 }, { opacity: 1 }], FADE);
    if (prev) wait(FADE.d).then(() => { if (stack.includes(prev)) setUnder(prev, true); });
  } else if (prev) setUnder(prev, true);
  return p;
}
function pop(from = 0, how = 'slide') {
  if (stack.length < 2) return Promise.resolve();
  const p = stack.pop(), prev = top();
  prev.classList.remove('under'); lock(SNAP.d * .6);
  if (prev._top) prev._top();
  if (how === 'down') {
    prev.style.transform = ''; $('.dim', prev).style.opacity = 0;
    return A(p, [{ transform: `translateY(${from}px)` }, { transform: 'translateY(100%)' }], SNAP).then(() => p.remove());
  }
  const k = from / 390;
  A(prev, [{ transform: `translateX(${UNDER * (1 - k)}px)` }, { transform: 'none' }], SNAP);
  A($('.dim', prev), [{ opacity: .08 * (1 - k) }, { opacity: 0 }], SNAP);
  return A(p, [{ transform: `translateX(${from}px)` }, { transform: 'translateX(100%)' }], SNAP).then(() => p.remove());
}
function resetTo(p) { // replace the whole stack with p (no animation)
  stack.splice(0).forEach((x) => x.remove());
  pagesEl.appendChild(p); stack.push(p); if (p._init) p._init();
}

/* edge swipe back */
let sw = null;
stage.addEventListener('pointerdown', (e) => {
  if (busy || stack.length < 2 || layer.children.length) return;
  const x = (e.clientX - stage.getBoundingClientRect().left) / K;
  const p = top(); if (x > 26 || p.dataset.noswipe) return;
  sw = { x0: e.clientX, t0: performance.now(), p, prev: stack[stack.length - 2], dx: 0, id: e.pointerId, on: false };
}, true);
stage.addEventListener('pointermove', (e) => {
  if (!sw || e.pointerId !== sw.id) return;
  sw.dx = Math.max(0, (e.clientX - sw.x0) / K);
  if (!sw.on && sw.dx > 8) { sw.on = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
  if (!sw.on) return;
  const k = sw.dx / 390;
  sw.p.style.transform = `translateX(${sw.dx}px)`;
  sw.prev.style.transform = `translateX(${UNDER * (1 - k)}px)`;
  $('.dim', sw.prev).style.opacity = .08 * (1 - k);
}, true);
const endSwipe = (e) => {
  if (!sw || e.pointerId !== sw.id) return;
  const s = sw; sw = null; if (!s.on) return;
  blockClick();
  const v = s.dx / Math.max(1, performance.now() - s.t0);
  if (s.dx > 120 || v > .55) { if (s.p.dataset.book) bookBack(true, s.dx); else pop(s.dx); }
  else {
    A(s.p, [{ transform: `translateX(${s.dx}px)` }, { transform: 'none' }], SNAP);
    A(s.prev, [{ transform: s.prev.style.transform }, { transform: `translateX(${UNDER}px)` }], SNAP);
    $('.dim', s.prev).style.opacity = .08;
  }
  e.stopPropagation();
};
stage.addEventListener('pointerup', endSwipe, true);
stage.addEventListener('pointercancel', endSwipe, true);
stage.addEventListener('click', (e) => { if (endSwipe.block) { e.stopPropagation(); e.preventDefault(); } }, true);
function blockClick() { endSwipe.block = true; clearTimeout(blockClick.t); blockClick.t = setTimeout(() => { endSwipe.block = false; }, 80); }

/* ---------------- shared-element morph ---------------- */
function ghost(r, style, parent = stage) {
  const g = document.createElement('div'); g.className = 'ghost'; g.style.transformOrigin = '0 0';
  Object.assign(g.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }, style);
  if (parent === stage) parent.appendChild(g); else parent.insertBefore(g, parent.children[1] || null);
  return g;
}
// The box is drawn once at its final size, then scaled from the source rect: compositor-only, no relayout or repaint per frame.
function morphBox(from, to, o = {}) {
  const bg1 = o.bg1 || o.bg0 || '#fff';
  const g = ghost(to, { background: bg1, borderRadius: (o.r1 ?? 20) + 'px', boxShadow: o.sh || '0 10px 30px rgba(0,0,0,.08)', willChange: 'transform', zIndex: o.z ?? 50 }, o.parent);
  if (o.bg0 && o.bg0 !== bg1) { // colour change = a second layer fading out, not an animated background
    const dk = document.createElement('div');
    dk.style.cssText = `position:absolute;inset:0;border-radius:inherit;background:${o.bg0};will-change:opacity`;
    g.appendChild(dk);
    A(dk, [{ opacity: 1 }, { opacity: 0 }], { e: 'cubic-bezier(.4,0,.2,1)', d: (o.sp || SOFT).d * .55 });
  }
  const t0 = `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.w / to.w}, ${from.h / to.h})`;
  g.style.transform = t0;
  return A(g, [{ transform: t0 }, { transform: 'none' }], o.sp || SOFT).then(() => g);
}
function morphEl(el, from, to, sp = SOFT, extra = {}) { // flies a copy of el from one rect to another (transform only)
  const c = el.cloneNode(true); c.removeAttribute('data-a');
  const g = ghost(from, { overflow: 'hidden' }); g.appendChild(c);
  Object.assign(c.style, { width: from.w + 'px', height: from.h + 'px', margin: 0, transformOrigin: '0 0' });
  const sx = to.w / from.w, sy = to.h / from.h;
  return A(g, [{ transform: 'none', opacity: 1 }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity: extra.o1 ?? 1 }], sp).then(() => g);
}

/* ---------------- shared bits ---------------- */
const askbar = () => `<div class="askbar"><label class="f press" style="transition:none">${I.mark('#9a9a9a', 19)}<i class="caret"></i><input type="text" placeholder="Ask Decade" enterkeyhint="send" aria-label="Ask Decade"><button type="button" class="send press-s press" data-a="send" aria-label="Send">${I.send}</button></label></div>`;
const qcards = (n = 5) => {
  return `<div class="askh">${I.mark('#6c4126', 22)}Ask Decade</div><div class="qgrid">` +
    ASKQ.slice(0, n).map(([t, q, c]) => `<button class="q press rv" data-st style="background:${c}" data-a="ask"><small>${t} ›</small><b>${q}</b></button>`).join('') + '</div>';
};
function bindAsk(root) {
  $$('.askbar', root).forEach((b) => {
    const inp = $('input', b);
    inp.addEventListener('focus', () => b.classList.add('focus'));
    inp.addEventListener('blur', () => b.classList.remove('focus'));
    inp.addEventListener('input', () => b.classList.toggle('typed', !!inp.value));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAsk(b); });
  });
}
function sendAsk(b) {
  const inp = $('input', b), q = inp.value.trim(); if (!q) { inp.focus(); return; }
  inp.value = ''; b.classList.remove('typed');
  A($('.send', b), [{ transform: 'scale(1)' }, { transform: 'scale(.75) translateX(6px)' }, { transform: 'scale(1)' }], BOUNCE);
  if (b.classList.contains('inl')) chatSend(q); else { chatSheet(q); }
}
// once you scroll, a frosted capsule forms behind the header and the buttons tuck in (same as the bank page)
function hdrFade(p, at = 40) {
  const sc = $('.scroll', p), h = $('.hdr', p);
  if (!sc || !h) return;
  if (!$('.bpill', p)) { const b = document.createElement('div'); b.className = 'bpill'; p.insertBefore(b, h); }
  let on = false;
  sc.addEventListener('scroll', () => { const n = sc.scrollTop > at; if (n !== on) { on = n; p.classList.toggle('scrolled', n); } }, { passive: true });
}
function segPill(seg, i, anim = true) {
  const bs = $$('button', seg), pill = $('.pill', seg), b = bs[i];
  bs.forEach((x, j) => x.classList.toggle('on', j === i));
  const to = { transform: `translateX(${b.offsetLeft - 2}px)`, width: b.offsetWidth + 'px' };
  if (!anim) { Object.assign(pill.style, to); return; }
  pill.style.width = to.width;
  A(pill, [{ transform: pill.style.transform || 'none' }, { transform: to.transform }], SNAP);
}

/* =====================================================================
   HOME — All / Your deposits
   ===================================================================== */
function recCard(i) {
  const r = REC[i], b = B[r.bank];
  const head = `<div class="top"><span class="rlogo"><img src="img/${b.img}.png" alt=""></span><span>${bankName(r.bank)}</span></div>`;
  const kv = (l, v, cls = '') => `<div class="${cls}"><label>${l}</label><div class="v ${cls.includes('g') ? 'green' : ''}">${v}</div></div>`;
  let body;
  if (r.v === 2) body = `<div class="grid2">${kv('Tenure', r.ten)}${kv('Interest rate', r.rate.toFixed(2) + '%', 'r g')}</div>
    <button class="go wide press" data-a="recstart" data-i="${i}">Start FD</button>`;
  else if (r.v === 3) body = `<div class="grid2">${kv('Invest', inr(r.amt))}${kv('At maturity', inr(mat(r.amt, r.rate, r.yrs)), 'r g')}</div>
    <div class="grid2" style="padding-top:25px"><div><label>Plan</label><div class="v sm">${r.ten} @ ${r.rate.toFixed(2)}%</div></div></div>
    <button class="go press" data-a="recstart" data-i="${i}" style="bottom:25px">Start FD</button>`;
  else body = `<div class="grid">${kv('Invest', inr(r.amt))}${kv('Interest rate', r.rate.toFixed(2) + '%', 'g')}${kv('Tenure', r.ten)}</div>
    <button class="go press" data-a="recstart" data-i="${i}">Start FD</button>`;
  return `<div class="dcard" data-i="${i}" data-a="recplan">${head}${body}</div>`;
}
/* "Complete your FD": an FD that was started but not finished */
function actionCard() {
  const d = S.pend; if (!d) return '';
  const [msg, btn] = STAGE[d.stage];
  return `<div class="acard card" data-st>
    <div class="top"><span class="rlogo"><img src="img/${B[d.bank].img}.png" alt=""></span><span>${bankName(d.bank)}</span></div>
    <div class="apbox"><div class="r"><div><label>Invest</label><b>${inr(d.amt)}</b></div><div class="rt"><label>Tenure</label><b>${d.ten}</b></div></div>
      <div class="f"><span>${msg}</span><button class="go press" data-a="pendgo">${btn}</button></div></div></div>`;
}
function refreshPend(p) {
  const a = $('#pendA', p), b = $('#pendB', p); if (!a) return;
  const has = !!S.pend;
  a.innerHTML = has ? `<h2 class="h2">Complete your FD</h2>${actionCard()}` : '';
  b.innerHTML = has ? actionCard() : '';
  p.classList.toggle('haspend', has);
}
const REC_TEXT = (bank = 'Suryoday SF Bank') => `Hi Arunima, Decade suggests moving part of your savings to a fixed deposit, and we found a great option at ${bank}.`;
const askd = () => `<button class="askd press" data-a="askchat">${I.mark('rgba(255,255,255,.85)', 17)}Ask Decade ${I.chevs('rgba(255,255,255,.75)')}</button>`;
function depCard(d, i) {
  return `<div class="dep card press rv ${d.isNew ? 'new' : ''}" data-st data-a="depopen" data-k="${d.key}" data-i="${i}">
    <div class="t">${logo('sur', 'sm')}<span>Suryoday SF bank FD</span>${I.chevs('rgba(0,0,0,.6)')}<span class="s ${d.s}">${d.s[0].toUpperCase() + d.s.slice(1)}</span></div>
    <div class="r1"><div><small>Invested amount</small><b>${inr(d.a)}</b></div><div class="rt"><small>Interest rate</small><b class="green">${d.r.toFixed(2)}%</b></div></div>
    <div class="in"><div class="row">Maturity amount<b>${inr(d.m)}</b></div><div class="prog"><i style="transform:scaleX(${Math.max(d.p, .03)})"></i></div><div class="row">${{ matured: 'Matured on', expired: 'Booking expired', refunded: 'Refunded' }[d.s] || 'Tenure'}<b class="t2">${d.left}</b></div></div>
  </div>`;
}
function deposits() {
  const base = { a: 50000, r: 8.75, m: 51208, left: '5Y 3M 15D left' };
  const L = {
    pending: [Object.assign({}, base, { s: 'pending', p: 0, left: 'Starts after VKYC' }), Object.assign({}, base, { s: 'expired', p: 0, left: 'VKYC not done in time' }), Object.assign({}, base, { s: 'refunded', p: 0, left: '₹50,000 back in HDFC ••3456' })],
    ongoing: [0, 1, 2].map(() => Object.assign({}, base, { s: 'ongoing', p: .06 })),
    matured: [Object.assign({}, base, { s: 'matured', p: 1, left: '12 Mar 2026', m: 54380 }), Object.assign({}, base, { s: 'matured', p: 1, left: '02 Jan 2026', a: 100000, m: 108250 })],
  };
  if (S.newDep) L.pending.unshift(S.newDep);
  for (const k in L) L[k].forEach((d) => { d.key = k; });
  return L;
}
/* =====================================================================
   FD DETAILS
   ===================================================================== */
function detailsPage(d) {
  const isNew = d === S.newDep;
  const nom = isNew ? S.noms[S.nom] : { n: 'Roshni Singh', r: 'Wife' }, acc = isNew ? S.accts[S.acc] : { s: 'HDFC', n: '4563' };
  const row = (l, v, extra = '', cls = '') => `<div class="kv"><span>${l}</span><b class="${cls}">${v}${extra}</b></div>`;
  const chip = (icon, a) => `<button class="pen press-s press" data-a="${a}" aria-label="${a}">${icon}</button>`;
  const dl = '<svg width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1v8M2.5 5.5L6 9l3.5-3.5M1 12h10" stroke="#292929" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const cr = '<svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="#292929" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const date = isNew ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ (\w{3}) /, ' $1. ') : '16 Nov. 2026';
  const p = mkPage('details', `
    <div class="scroll">
      <div class="dband">
        <svg class="ovals" viewBox="0 0 429 512" fill="none" stroke="#d2cecc" stroke-width=".45" aria-hidden="true"><ellipse cx="86" cy="128" rx="85.8" ry="127.8"/><ellipse cx="86" cy="256" rx="85.8" ry="127.8"/><ellipse cx="86" cy="384" rx="85.8" ry="127.8"/><ellipse cx="172" cy="128" rx="85.8" ry="127.8"/><ellipse cx="172" cy="256" rx="85.8" ry="127.8"/><ellipse cx="172" cy="384" rx="85.8" ry="127.8"/><ellipse cx="258" cy="128" rx="85.8" ry="127.8"/><ellipse cx="258" cy="256" rx="85.8" ry="127.8"/><ellipse cx="258" cy="384" rx="85.8" ry="127.8"/><ellipse cx="343" cy="128" rx="85.8" ry="127.8"/><ellipse cx="343" cy="256" rx="85.8" ry="127.8"/><ellipse cx="343" cy="384" rx="85.8" ry="127.8"/></svg>
        <div class="dslot">${depCard(d, 0).replace('data-a="depopen"', '')}</div>
        <button class="again press" data-a="again">Invest again${I.chevs('#fff')}</button>
      </div>
      <div class="dtable rv" data-st>
        ${row('Investment date', date, '', 'n')}${row('Investment amount', inr(d.a), '', 'n')}${row('Tenure', isNew ? titleTen(S.sel.ten) : '4Y 5M 14D', '', 'n')}
        ${row('Maturity instruction', `<span id="mi">${S.reinv ? 'Reinvest' : 'Reinvest'}</span>`, chip(I.pen, 'mi'))}
        ${row('Transaction ID', '23456781098354721083')}${row('Payment method', 'UPI')}${row('Nominee', esc(nom.n))}${row('Nominee relation', esc(nom.r))}
        ${row('Receipt', '<u data-a="dl">Download</u>', chip(dl, 'dl'))}${row('Form 121', '<u data-a="f121">Apply</u>', chip(cr, 'f121'))}
      </div>
      <h2 class="h2" style="margin:35px 31px 21px">Withdrawal details</h2>
      <div class="dtable rv" data-st style="height:130px;margin-top:0">
        ${row('Account', `<u class="n">xxxx${acc.n}</u>`, chip(cr, 'noop'))}${row('Bank', acc.s === 'HDFC' ? 'HDFC Bank' : esc(acc.s + ' Bank'))}
      </div>
      <div style="height:187px"></div>
    </div>
    <div class="hdr"><button class="cbtn l press press-s" data-a="back" aria-label="Back">${I.back}</button><div class="htitle">FD details</div></div>
    ${askbar()}`);
  p._dep = d;
  hdrFade(p); bindAsk(p);
  return p;
}
function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; layer.appendChild(t);
  A(t, [{ opacity: 0, transform: 'translate(-50%, 16px) scale(.96)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], SOFT);
  setTimeout(() => A(t, [{ opacity: 1 }, { opacity: 0 }], FADE).then(() => t.remove()), 1800);
}

function homePage() {
  const cats = Object.entries(CATS).map(([k, [t, s]]) => `<button class="cat press" data-a="cat" data-c="${k}">${I.cat[k]}<span><b data-lbl>${t}</b><small>${s}</small></span>${I.chev('#8a8a8a')}</button>`).join('');
  const banks = ['shiv', 'shri', 'sur', 'shiv'].map((k) => `<button class="bcard card press rv" data-st data-a="bank" data-b="${k}">
      <div class="t">${logo(k)}<span><b>${B[k].n}</b><span class="dicgc">${I.dicgc}DICGC insured</span></span><div class="upto"><small>upto</small><b>8.35%</b></div></div>
      <div class="d"><b>RBI Licensed Small finance bank</b><small>AAA means the highest degree of safety for timely repayment of interest and principal.</small></div></button>`).join('');
  const tiles = [['tile1', 'DICGC insured<br>up to ₹5 lakh'], ['tile2', 'RBI-regulated<br>banks'], ['tile3', 'Trusted banks.<br>Secure deposits.'], ['tile4', 'Flexible interest<br>payouts']].map(([c, t]) => `<div class="tile" style="background-image:url(img/${c}.jpg)">${t}</div>`).join('');
  const ten = TENURES.map(([l, t]) => `<button class="tten card press" data-a="tenure" data-t="${t}"><svg viewBox="0 0 115 139" fill="none" stroke="#f5dff9" aria-hidden="true"><ellipse cx="28.5" cy="4" rx="29.5" ry="62"/><ellipse cx="62.5" cy="4" rx="29.5" ry="62"/><ellipse cx="92.5" cy="4" rx="29.5" ry="62"/></svg><span data-lbl>${l}</span></button>`).join('');
  const chips = CALC_T.map(([l], i) => `<button data-a="chip" data-i="${i}">${l}</button>`).join('') + '<button data-a="chip" data-i="5">+</button>';
  const all = `
    <div id="pendA"></div>
    <h2 class="h2">FD Categories</h2>
    <div class="cats card" data-st>${cats}</div>
    <h2 class="h2">Recommendation</h2>
    <div class="rec" data-st data-a="recopen">
      <div class="deck">${REC.map((_, i) => recCard(i)).join('')}</div>
      <p>${REC_TEXT()}</p>
      ${askd()}
    </div>
    <h2 class="h2">Search by tenure</h2>
    <div class="tens" data-st>${ten}</div>
    <h2 class="h2" style="margin-left:17px">Available deposits</h2>
    ${banks}
    <button class="obtn press" data-a="allbanks" style="margin-top:2px">View all banks ${I.chevd}</button>
    <div class="calcband"><svg class="ovals" viewBox="0 0 429 256" fill="none" stroke="#d2cecc" stroke-width=".4" aria-hidden="true"><ellipse cx="86" cy="128" rx="85.8" ry="127.8"/><ellipse cx="172" cy="128" rx="85.8" ry="127.8"/><ellipse cx="258" cy="128" rx="85.8" ry="127.8"/><ellipse cx="343" cy="128" rx="85.8" ry="127.8"/></svg><div class="calc card rv" data-st>
      <h3>Calculate<br>Fixed Deposit Returns</h3>
      <div class="in"><div class="amtbox"><div class="a"><span id="calcAmt">${inr(S.calcAmt)}</span><input type="tel" inputmode="numeric" aria-label="Investment amount" data-calcin></div><div class="l">Investment amount</div></div>
        <div class="chips" id="chips"><i class="pill"></i>${chips}</div>
        <button class="dbtn press" data-a="calc">Calculate</button></div>
    </div></div>
    <h2 class="h2" style="margin-bottom:21px">Fixed deposit protection</h2>
    <div class="tiles card rv" data-st>${tiles}</div>
    ${qcards().replace('class="askh"', 'class="askh" style="margin-top:55px"')}
    <div style="height:139px"></div>`;
  const dep = `
    <div id="pendB"></div>
    <div class="sum card" data-st><small>Total investment</small><div class="big" id="sumv">₹5,03,265</div><div class="gbox"><span>Interest gain</span><b>+₹3,265</b></div></div>
    <div class="seg dtabs" id="dseg"><i class="pill"></i><button data-a="dtab" data-i="0">Pending</button><button data-a="dtab" data-i="1">Ongoing</button><button data-a="dtab" data-i="2">Matured</button></div>
    <div id="deplist"></div>
    <div style="height:130px"></div>`;
  const p = mkPage('home', `
    <div class="scroll">
      <div style="height:129px"></div>
      <div class="seg" id="topseg" style="margin:0 15px"><i class="pill"></i><button data-a="tab" data-i="0">All</button><button data-a="tab" data-i="1">Your deposits</button></div>
      <div class="pane" data-p="0">${all}</div>
      <div class="pane" data-p="1" style="display:none">${dep}</div>
    </div>
    <div class="hdr"><button class="cbtn l press press-s" data-a="exit" aria-label="Back">${I.back}</button><div class="htitle">Fixed deposits</div><button class="cbtn r press press-s" data-a="noop" aria-label="Search">${I.search}</button></div>
    ${askbar()}`);
  p._init = () => {
    segPill($('#topseg', p), S.tab, false); setPanes(p, S.tab, 0);
    segPill($('#chips', p), S.calcT, false);
    renderDeps(p, false); refreshPend(p);
    $('#sumv', p).textContent = inr(503265 + (S.newDep ? S.newDep.a : 0));
    deckLayout(p); deckTimer(p);
  };
  p._top = () => { deckTimer(p); if (p._pendKey !== JSON.stringify(S.pend)) { refreshPend(p); p._pendKey = JSON.stringify(S.pend); if (S.pend) { $$('.acard', p).forEach((c) => A(c, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 200 })); } } };
  p._pendKey = JSON.stringify(S.pend);
  hdrFade(p); bindAsk(p);
  const ci = $('[data-calcin]', p);
  ci.addEventListener('input', () => {
    const n = +(ci.value.replace(/\D/g, '').slice(0, 9)) || 0; S.calcAmt = n;
    const el = $('#calcAmt', p); el.textContent = inr(n);
    A(el, [{ transform: 'scale(1.06)' }, { transform: 'none' }], BOUNCE);
  });
  ci.addEventListener('focus', () => { ci.value = ''; });
  return p;
}
function setPanes(p, i, dir) {
  const panes = $$('.pane', p), inc = panes[i], out = panes[1 - i];
  if (!dir) { panes.forEach((x, j) => { x.style.display = j === i ? '' : 'none'; }); fixPills(p); return; }
  const sc = $('.scroll', p);
  out.style.position = 'absolute'; out.style.left = '0'; out.style.right = '0'; out.style.top = (out.offsetTop) + 'px';
  inc.style.display = ''; fixPills(p);
  A(out, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 70}px)`, opacity: 0 }], SNAP).then(() => { out.style.display = 'none'; out.style.position = ''; out.style.transform = ''; out.style.opacity = ''; });
  A(inc, [{ transform: `translateX(${dir * 70}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], SNAP);
  if (sc.scrollTop > 0) sc.scrollTo({ top: 0, behavior: 'smooth' });
  stagger(inc, 40);
  if (i === 1) countUp($('#sumv', p), 503265 + (S.newDep ? S.newDep.a : 0));
}
function fixPills(p) {
  const d = $('#dseg', p), c = $('#chips', p);
  if (d && d.offsetWidth) segPill(d, S.dtab, false);
  if (c && c.offsetWidth) segPill(c, S.calcT, false);
}
function countUp(el, to) {
  const t0 = performance.now(), d = 900;
  const f = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = inr(to * e); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function renderDeps(p, anim = true, dir = 1) {
  const L = deposits(), key = ['pending', 'ongoing', 'matured'][S.dtab];
  segPill($('#dseg', p), S.dtab, anim);
  const box = $('#deplist', p);
  const html = L[key].length ? L[key].map(depCard).join('') : '<div class="empty">Nothing here yet</div>';
  if (!anim) { box.innerHTML = html; return; }
  const old = Array.from(box.children);
  old.forEach((c, i) => A(c, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 40}px)` }], QUICK, { delay: i * 20 }));
  wait(160).then(() => {
    box.innerHTML = html;
    Array.from(box.children).forEach((c, i) => {
      A(c, [{ opacity: 0, transform: `translateX(${dir * 50}px)` }, { opacity: 1, transform: 'none' }], SOFT, { delay: i * 45 });
      const bar = $('.prog i', c); if (bar) { const s = bar.style.transform; A(bar, [{ transform: 'scaleX(0)' }, { transform: s }], GENTLE, { delay: 250 + i * 60 }); }
    });
  });
}

/* recommendation deck: front card lifts up, tucks behind; the next one slides forward */
// front card, and the one behind it peeking out narrower and translucent (as in the design)
const POS = ['translateY(0) scale(1)', 'translateY(23px) scale(.8944, .9905)'], OP = [1, .3]; // back sheet: 288×208 at (+17,+23), white/.30
const NREC = REC.length;
function deckLayout(p) {
  $$('.deck', p).forEach((dk) => $$('.dcard', dk).forEach((c, i) => {
    const pos = (i - S.recI + NREC) % NREC;
    c.style.zIndex = NREC - pos; c.style.pointerEvents = pos === 0 ? '' : 'none';
    c.style.transform = POS[Math.min(pos, 1)]; c.style.opacity = pos > 1 ? 0 : OP[pos];
  }));
}
function deckNext(p) {
  const dk = $('.deck', p); if (!dk) return;
  const cards = $$('.dcard', dk), front = cards[S.recI], back = cards[(S.recI + 1) % NREC], next = cards[(S.recI + 2) % NREC];
  S.recI = (S.recI + 1) % NREC;
  // front lifts up, slips behind; the one behind slides up to the front
  const a = front.animate([
    { transform: POS[0], opacity: 1 },
    { transform: 'translateY(-58px) scale(.99)', opacity: 1, offset: .42 },
    { transform: POS[1], opacity: OP[1] }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'both' });
  setTimeout(() => { front.style.zIndex = 0; back.style.zIndex = NREC; if (next !== front) next.style.zIndex = NREC - 1; }, 380);
  if (next !== front) A(next, [{ opacity: 0 }, { opacity: OP[1] }], SOFT, { delay: 420 });
  if (next !== front) A(front, [{ opacity: 1 }, { opacity: 0 }], { e: 'ease', d: 300 }, { delay: 560 });
  a.finished.then(() => { a.cancel(); deckLayout(p); }).catch(() => {});
  A(back, [{ transform: POS[1], opacity: OP[1] }, { transform: POS[0], opacity: 1 }], SOFT, { delay: 300 });
}
function deckTimer(p) {
  clearInterval(deckTimer.t);
  deckTimer.t = setInterval(() => {
    if (top() !== p || S.tab !== 0 || layer.children.length || deckTimer.hold || recM || document.hidden) return;
    deckNext(p);
  }, 3600);
}

/* tapping the banner (anywhere but its buttons) opens it full height; the cards spread into a list */
let recM = null;
function openRecModal(banner) {
  if (busy || recM || sheet) return; lock(650);
  deckTimer.hold = true;
  const order = REC.map((_, k) => (S.recI + k) % NREC);
  const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;inset:0;isolation:isolate';
  wrap.innerHTML = `<div class="backdrop" data-a="recclose"></div>
    <div class="rmodal"><div class="rmscroll">${order.map((i) => recCard(i)).join('')}<p>${REC_TEXT()}</p>${askd()}</div></div>
    <button class="rmx press press-s" data-a="recclose" aria-label="Close">${I.xw}</button>`;
  layer.appendChild(wrap);
  const mod = $('.rmodal', wrap), sc = $('.rmscroll', mod), bd = $('.backdrop', wrap), x = $('.rmx', wrap);
  recM = { wrap, banner, order };
  const to = R(mod), from = R(banner);
  // where every piece starts: its spot inside the banner
  const pieces = $$('.dcard', sc).map((c, k) => [c, $(`.dcard[data-i="${order[k]}"]`, banner)]);
  pieces.push([$('p', sc), $('p', banner)], [$('.askd', sc), $('.askd', banner)]);
  const firsts = pieces.map(([, s]) => [R(s), +getComputedStyle(s).opacity]);
  firsts.forEach((f, k) => { if (k < NREC && f[1] === 0) f[1] = 0; });
  banner.style.visibility = 'hidden';
  mod.classList.add('flying');
  morphBox(from, to, { r0: 23, r1: 24, bg1: 'linear-gradient(180deg,#4f1d15,#7e3125)', sh: 'none', parent: wrap, z: 0 }).then((g) => { mod.classList.remove('flying'); g.remove(); });
  pieces.forEach(([el], k) => {
    const f = firsts[k][0], l = R(el), o0 = firsts[k][1];
    const t0 = `translate(${f.x - l.x}px, ${f.y - l.y}px) scale(${f.w / l.w})`;
    el.style.transformOrigin = '0 0';
    A(el, [{ transform: t0, opacity: o0 }, { transform: 'none', opacity: 1 }], SOFT, { delay: k === 1 ? 30 : 0 });
  });
  A(bd, [{ opacity: 0 }, { opacity: .6 }], EASE);
  A(x, [{ transform: 'translateY(16px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], BOUNCE, { delay: 140 });
}
function closeRecModal(fast) {
  if (!recM) return Promise.resolve();
  const { wrap, banner, order } = recM; recM = null; lock(500);
  const mod = $('.rmodal', wrap), sc = $('.rmscroll', mod);
  if (fast) {
    banner.style.visibility = ''; deckTimer.hold = false;
    return A(wrap, [{ opacity: 1 }, { opacity: 0 }], { e: 'ease', d: 200 }).then(() => wrap.remove());
  }
  const from = R(mod), to = R(banner);
  const pieces = $$('.dcard', sc).map((c, k) => [c, $(`.dcard[data-i="${order[k]}"]`, banner)]);
  pieces.push([$('p', sc), $('p', banner)], [$('.askd', sc), $('.askd', banner)]);
  const targets = pieces.map(([, t]) => [R(t), +getComputedStyle(t).opacity]);
  mod.classList.add('flying');
  morphBox(from, to, { r0: 24, r1: 23, bg1: 'linear-gradient(180deg,#4d1c14,#7e3125)', sh: 'none', parent: wrap, z: 0, sp: SNAP });
  pieces.forEach(([el], k) => {
    const l = R(el), t = targets[k][0];
    el.style.transformOrigin = '0 0';
    A(el, [{ transform: 'none', opacity: 1 }, { transform: `translate(${t.x - l.x}px, ${t.y - l.y}px) scale(${t.w / l.w})`, opacity: targets[k][1] }], SNAP);
  });
  A($('.backdrop', wrap), [{ opacity: .6 }, { opacity: 0 }], EASE);
  A($('.rmx', wrap), [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.6)' }], QUICK);
  return wait(SNAP.d).then(() => { banner.style.visibility = ''; wrap.remove(); deckTimer.hold = false; });
}

/* =====================================================================
   ASK DECADE — chat sheet; opens with the keyboard up
   ===================================================================== */
const CHIPS = ['Is Suryoday SF Bank safe?', 'Can I withdraw early?', 'How is FD interest taxed?'];
function reply(q) {
  const t = q.toLowerCase();
  if (/safe|risk|insur|dicgc|rbi/.test(t)) return 'Suryoday is an RBI-licensed small finance bank, and DICGC insures your deposits there up to ₹5 lakh, including interest.';
  if (/withdraw|break|early|lock|liquid/.test(t)) return 'You can break this FD anytime. After the first year there is no penalty; before that, the bank pays a slightly lower rate for the time your money was in.';
  if (/tax|tds|15g|15h/.test(t)) return 'FD interest is added to your income and taxed at your slab rate. The bank deducts 10% TDS once your interest crosses ₹40,000 in a year, unless you submit Form 15G/15H.';
  if (/rate|return|maturity|much|earn|interest/.test(t)) return `At 8.31% a year, ₹5,00,000 grows to about ${inr(mat(500000, 8.31, 5.29))} in 5 years 3 months — roughly ${inr(mat(500000, 8.31, 5.29) - 500000)} in interest.`;
  return 'Good question. For this FD at Suryoday SF Bank you get 8.31% a year, deposits insured up to ₹5 lakh, and you can withdraw anytime. Want me to compare it with other banks?';
}
function chatSheet(q) {
  if (sheet) return;
  const s = openSheet(`<div class="chat">
      <div class="chd"><span class="serif">${I.mark('#6c4126', 20)}Ask Decade</span><button class="chx press press-s" data-a="closesheet" aria-label="Close">${I.x}</button></div>
      <div class="msgs"><div class="msg d">Hi Arunima, ask me anything about this fixed deposit at Suryoday SF Bank.</div></div>
      <div class="qchips">${CHIPS.map((c) => `<button class="press" data-a="chatq">${c}</button>`).join('')}</div>
      <div class="askbar inl"><label class="f">${I.mark('#9a9a9a', 19)}<input type="text" placeholder="Ask Decade" enterkeyhint="send" aria-label="Message Decade"><button type="button" class="send press press-s" data-a="send" aria-label="Send">${I.send}</button></label></div>
    </div>`, { noScale: true });
  if (!s) return;
  const inp = $('.chat input', s.el);
  inp.focus({ preventScroll: true }); // same tap → the keyboard comes up straight away
  if (q) chatSend(q);
}
function chatSend(q) {
  if (!sheet) return;
  const el = sheet.el, box = $('.msgs', el), chips = $('.qchips', el);
  if (chips && chips.offsetHeight) { A(chips, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], QUICK).then(() => { chips.style.display = 'none'; }); }
  const add = (cls, html) => { const m = document.createElement('div'); m.className = 'msg ' + cls; m.innerHTML = html; box.appendChild(m); box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); return m; };
  const u = add('u', esc(q));
  A(u, [{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], SOFT);
  const ty = add('d typing', '<i></i><i></i><i></i>');
  A(ty, [{ opacity: 0 }, { opacity: 1 }], FADE, { delay: 200 });
  setTimeout(() => {
    ty.classList.remove('typing'); ty.textContent = reply(q);
    A(ty, [{ opacity: .4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], SOFT);
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }, 1100);
}

/* =====================================================================
   LISTINGS
   ===================================================================== */
// listing rows: tenure in months, payouts and categories drive the filter sheet
const LIST = [
  { b: 'shiv', t: '4Y 6M 11D', y: 4.53, mo: 54, pay: 'mat qtr', cat: 'high' },
  { b: 'shri', t: '5 Years', y: 5, mo: 60, pay: 'mat mon qtr', cat: 'high' },
  { b: 'sur', t: '2Y 6M', y: 2.5, mo: 30, pay: 'mat mon qtr', cat: 'high inst' },
  { b: 'jana', t: '1Y 3M', y: 1.25, mo: 15, pay: 'mat qtr', cat: 'high' },
  { b: 'shiv', t: '11 Months', y: .92, mo: 11, pay: 'mat qtr', cat: 'inst' },
  { b: 'shri', t: '3 Years', y: 3, mo: 36, pay: 'mat mon qtr', cat: '' },
  { b: 'sur', t: '5Y 3M 16D', y: 5.29, mo: 63, pay: 'mat mon qtr', cat: 'high' },
  { b: 'jana', t: '4Y 6M 11D', y: 4.53, mo: 54, pay: 'mat qtr', cat: '' },
];
const fdat = (k, mo, pay, cat) => `data-b="${k}" data-mo="${mo}" data-pay="${pay}" data-cat="${cat}" data-type="${isNbfc(k) ? 'nbfc' : 'sf'}"`;
function listHdr(badgeCalc) {
  return `<div class="hdr"><button class="cbtn l press press-s" data-a="back" aria-label="Back">${I.back}</button><div class="htitle left">Fixed deposits</div>
    <button class="cbtn r2 press press-s" data-a="calcsheet" aria-label="Calculator">${I.calc}${badgeCalc ? '<span class="badge">1</span>' : ''}</button>
    <button class="cbtn r press press-s" data-a="filter" aria-label="Filter">${I.filter}</button></div>`;
}
function listPage(title) {
  const rows = LIST.map((r, i) => `<button class="lrow card press rv" data-st data-a="plan" ${fdat(r.b, r.mo, r.pay, r.cat)} data-i="${i}" data-t="${r.t}" data-y="${r.y}">${logo(r.b)}<span><b>${B[r.b].n}</b><span class="dicgc">${I.dicgc}DICGC insured</span></span>
      <div class="r"><b>8.5%</b><small>${r.t}</small></div></button>`).join('');
  const p = mkPage('list', `<div class="scroll"><div style="height:147px"></div><div class="fapplied"></div><h1 class="ltitle">${title}</h1><div class="frows">${rows}</div>${qcards(3)}<div style="height:130px"></div></div>${listHdr(false)}${askbar()}`);
  hdrFade(p); bindAsk(p); return p;
}
function amtListPage() {
  const t = CALC_T[S.calcT] || CALC_T[0];
  const rows = ['shiv', 'shri', 'jana', 'sur'].map((k, i) => `<button class="arow card press rv" data-st data-a="plan" ${fdat(k, Math.round(t[1] * 12), k === 'shri' || k === 'sur' ? 'mat mon qtr' : 'mat qtr', i % 2 ? 'high' : 'high inst')} data-i="${i}" data-amt="1">
      <div class="t">${logo(k)}<span><b>${B[k].n}</b><span class="dicgc">${I.dicgc}DICGC insured</span></span><div class="r"><b>8.5%</b><small>${t[2]}</small></div></div>
      <div class="m"><div><b>${inr(S.calcAmt)}</b><small>Investing amount</small></div><div><b class="green">${inr(mat(S.calcAmt, 8.5, t[1]))}</b><small>At maturity</small></div></div></button>`).join('');
  const p = mkPage('list', `<div class="scroll"><div style="height:147px"></div><div class="fapplied"></div><h1 class="ltitle" data-a="calcsheet">Invest ${inr(S.calcAmt)} for ${t[2]}</h1><div class="frows">${rows}</div>${qcards(2)}<div style="height:130px"></div></div>${listHdr(true)}${askbar()}`);
  hdrFade(p); bindAsk(p); return p;
}

/* =====================================================================
   FILTER — sheet with live count; applied filters show as chips on the list
   ===================================================================== */
const FG = {
  cat: ['FD Category', [['high', 'High return'], ['inst', 'Instant withdrawal']]],
  ten: ['Tenure', [['u1', 'Up to 1Y'], ['b13', '1Y - 3Y'], ['b35', '3Y - 5Y'], ['b5', '5Y +']]],
  pay: ['Interest payout', [['mat', 'At maturity'], ['mon', 'Monthly'], ['qtr', 'Quarterly']]],
  type: ['Bank type', [['sf', 'Small finance'], ['nbfc', 'NBFC']]],
};
const fNew = () => ({ sort: 'rate', cat: [], ten: [], pay: [], type: [], banks: [], ins: false });
const fCount = (f) => f.cat.length + f.ten.length + f.pay.length + f.type.length + f.banks.length + (f.ins ? 1 : 0);
const tBucket = (mo) => (mo <= 12 ? 'u1' : mo <= 36 ? 'b13' : mo <= 60 ? 'b35' : 'b5');
function fMatch(d, f) {
  const any = (sel, v) => !sel.length || sel.includes(v);
  return any(f.ten, tBucket(+d.mo)) && any(f.type, d.type) && any(f.banks, d.b) && (!f.ins || d.type !== 'nbfc') &&
    (!f.pay.length || f.pay.some((x) => d.pay.split(' ').includes(x))) && (!f.cat.length || f.cat.every((x) => d.cat.split(' ').includes(x)));
}
const fRows = (p) => $$('.frows > button', p);
function fLabel(g, v) {
  if (g === 'banks') return B[v].n;
  if (g === 'ins') return 'DICGC Insured';
  return FG[g][1].find((x) => x[0] === v)[1];
}
function filterSheet(btn) {
  const p = btn.closest('.page'), f = JSON.parse(JSON.stringify(p._flt || fNew()));
  const banks = Array.from(new Set(fRows(p).map((r) => r.dataset.b)));
  const chips = (g) => `<div class="fchips">${FG[g][1].map(([v, l]) => `<button class="fchip ${f[g].includes(v) ? 'on' : ''}" data-a="fchip" data-g="${g}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const s = openSheet(`<div class="fsheet">
    <div class="fh"><b>Filter</b><span class="fbadge" id="fbadge"></span><button class="fclr press" data-a="fclear">Clear all${I.x.replace(/width="16" height="16"/, 'width="9" height="9"').replace('stroke-width="2"', 'stroke-width="2.4"')}</button></div>
    <div class="fbody">
      <h4>Sort by</h4><div class="fseg"><button class="${f.sort === 'rate' ? 'on' : ''}" data-a="fsort" data-v="rate">Highest rate</button><button class="${f.sort === 'ten' ? 'on' : ''}" data-a="fsort" data-v="ten">Short tenure</button></div>
      ${['cat', 'ten', 'pay', 'type'].map((g) => `<h4>${FG[g][0]}</h4>${chips(g)}`).join('')}
      <h4>Insurance</h4><button class="fins" data-a="fins"><b>DICGC Insured</b><span class="toggle ${f.ins ? 'on' : ''}"><i></i></span><small>Deposits up to ₹5 lakh per bank are covered by DICGC, an RBI company</small></button>
      <h4>Banks &amp; more</h4><div class="fbanks">${banks.map((k) => `<button class="fbank ${f.banks.includes(k) ? 'on' : ''}" data-a="fchip" data-g="banks" data-v="${k}">${logo(k, 'sm')}<span><b>${B[k].n}</b><small>Up to 8.5% /year</small></span><span class="radio"></span></button>`).join('')}</div>
    </div>
    <div class="ffoot"><button class="fshow press" data-a="fapply"><span id="fshow"></span></button></div></div>`, { cls: 'fsh' });
  if (!s) return;
  s.flt = f; s.page = p;
  fLive();
}
function fLive() {
  if (!sheet || !sheet.flt) return;
  const f = sheet.flt, n = fRows(sheet.page).filter((r) => fMatch(r.dataset, f)).length, c = fCount(f);
  const bd = $('#fbadge', sheet.el), sh = $('#fshow', sheet.el), btn = sh.parentElement;
  bd.textContent = c; bd.classList.toggle('on', c > 0);
  const t = n ? `Show ${n} FD${n === 1 ? '' : 's'}` : 'No FDs match these filters';
  if (sh.textContent !== t) { sh.textContent = t; A(sh, [{ opacity: .3, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], QUICK); }
  btn.classList.toggle('off', !n);
}
function applyFilter(p, anim = true) {
  const f = p._flt || fNew(), rows = fRows(p), box = $('.frows', p), c = fCount(f);
  const on = rows.filter((r) => fMatch(r.dataset, f));
  const order = on.slice().sort((a, b) => (f.sort === 'ten' ? +a.dataset.mo - +b.dataset.mo : +a.dataset.i - +b.dataset.i));
  rows.forEach((r) => { r.style.display = on.includes(r) ? '' : 'none'; });
  order.forEach((r) => box.appendChild(r));
  // applied chips replace the title; the filter button carries the count
  const ap = $('.fapplied', p), list = [];
  ['ten', 'pay', 'cat', 'type', 'banks'].forEach((g) => f[g].forEach((v) => list.push([g, v])));
  if (f.ins) list.push(['ins', 1]);
  ap.innerHTML = list.map(([g, v]) => `<button class="fap press" data-a="funset" data-g="${g}" data-v="${v}">${fLabel(g, v)}${I.x.replace(/width="16" height="16"/, 'width="9" height="9"').replace('#292929', '#fff').replace('stroke-width="2"', 'stroke-width="2.4"')}</button>`).join('');
  p.classList.toggle('filtered', c > 0);
  const fb = $('[data-a="filter"]', p); let bd = $('.badge', fb);
  if (c) { if (!bd) { bd = document.createElement('span'); bd.className = 'badge'; fb.appendChild(bd); if (anim) A(bd, [{ transform: 'scale(0)' }, { transform: 'none' }], BOUNCE, { delay: 200 }); } bd.textContent = c; }
  else if (bd) bd.remove();
  if (anim) {
    $$('.fap', ap).forEach((x, i) => A(x, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], BOUNCE, { delay: 120 + i * 40 }));
    order.slice(0, 6).forEach((r, i) => A(r, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 80 + i * 45 }));
    const sc = $('.scroll', p); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* =====================================================================
   SHEETS
   ===================================================================== */
let sheet = null; // { wrap, el, close }
function scaleBehind(on) {
  const p = top(); if (!p) return;
  stack.forEach((x) => { if (x !== p) x.style.visibility = on ? 'hidden' : ''; });
  // Figma dims the screen behind a sheet (black/.6) without shrinking it
}
function openSheet(html, o = {}) {
  if (sheet) return null;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0';
  wrap.innerHTML = `<div class="backdrop" data-a="closesheet"></div><div class="sheet ${o.cls || ''}"><div class="handle"></div>${html}</div>`;
  layer.appendChild(wrap);
  const el = $('.sheet', wrap), bd = $('.backdrop', wrap);
  sheet = { wrap, el, src: o.src, onClose: o.onClose };
  bindAsk(wrap);
  if (!o.custom) {
    A(bd, [{ opacity: 0 }, { opacity: .6 }], EASE);
    A(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], SOFT);
  }
  if (!o.noScale) scaleBehind(true);
  dragSheet(el);
  lock(300);
  return sheet;
}
function closeSheet(o = {}) {
  if (!sheet) return Promise.resolve();
  const s = sheet; sheet = null;
  deckTimer.hold = false;
  if (!o.keepPage) scaleBehind(false); else { const p = top(); if (p) { p.style.transform = ''; p.style.borderRadius = ''; } }
  if (s.src) { s.src.style.visibility = ''; A(s.src, [{ opacity: 0 }, { opacity: 1 }], FADE, { delay: 120 }); }
  if (s.onClose) s.onClose();
  A($('.backdrop', s.wrap), [{ opacity: getComputedStyle($('.backdrop', s.wrap)).opacity }, { opacity: 0 }], EASE);
  return A(s.el, [{ transform: s.el.style.transform || 'none' }, { transform: 'translateY(105%)' }], SNAP).then(() => s.wrap.remove());
}
function dragSheet(el) {
  let d = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, .fbody, [data-a]:not(.ptop)')) return;
    d = { y0: e.clientY, t0: performance.now(), dy: 0, id: e.pointerId };
  });
  el.addEventListener('pointermove', (e) => {
    if (!d || e.pointerId !== d.id) return;
    const raw = (e.clientY - d.y0) / K; d.dy = raw > 0 ? raw : -Math.sqrt(-raw) * 3;
    if (Math.abs(raw) > 6) { try { el.setPointerCapture(e.pointerId); } catch (_) {} d.moved = true; }
    el.style.transform = `translateY(${d.dy}px)`;
    const bd = el.previousElementSibling; if (bd) bd.style.opacity = .6 * Math.max(0, 1 - d.dy / 500);
  });
  const up = (e) => {
    if (!d || e.pointerId !== d.id) return;
    const v = d.dy / Math.max(1, performance.now() - d.t0), moved = d.moved, dy = d.dy; d = null;
    if (!moved) return;
    blockClick();
    if (dy > 130 || v > .6) closeSheet();
    else { A(el, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], BOUNCE); const bd = el.previousElementSibling; if (bd) A(bd, [{ opacity: bd.style.opacity }, { opacity: .6 }], EASE); }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

/* plan sheet: the tapped bank card flies up and becomes the sheet's top card */
function planSheet(src, plan) {
  const k = plan.bank, b = B[k];
  const amtRow = plan.amt ? `<div class="pkv"><div><b>${inr(plan.amt)}</b><small>Investing amount</small></div><div class="rt"><b class="green">${inr(mat(plan.amt, plan.rate, plan.yrs))}</b><small>At maturity</small></div></div>` : '';
  const html = `<div class="psheet">
    <div class="ptop" data-a="sheetbank"><h3>${b.l}${I.chevs('#282424')}</h3><p>${b.since}</p>${logo(k, 'w')}</div>
    <div class="pmain"><div class="pkv"><div><b>${plan.ten}</b><small>Tenure</small></div><div class="rt"><b class="green">${plan.rate.toFixed(2)}%</b><small>Interest rate</small></div></div>${amtRow}
      <div class="feats"><div>${I.bolt}Instant withdrawal available</div><div>${I.sun}No penalty for 1Y withdrawal</div><div>${I.shield()}DICGC insures up to ₹5 lakh</div></div>
      <button class="bigbtn press" data-a="startfd" style="margin-top:22px">Start FD</button></div>
    <button class="allplans press" data-a="viewplans">View all plans ${I.chevs()}</button></div>`;
  S.sel = { bank: k, ten: plan.ten, yrs: plan.yrs, rate: plan.rate };
  S.planAmt = plan.amt || 0;
  const s = openSheet(html, { custom: true, src });
  if (!s) return;
  const el = s.el, ptop = $('.ptop', el), pmain = $('.pmain', el), ap = $('.allplans', el), lg = $('.logo', ptop), hd = $('.handle', el);
  const from = R(src), to = R(ptop), lf = src.querySelector('[data-logo]');
  A($('.backdrop', s.wrap), [{ opacity: 0 }, { opacity: .6 }], EASE);
  // the card itself
  ptop.style.opacity = 0; src.style.visibility = 'hidden';
  morphBox(from, to, { r0: 22, r1: 26, sp: SOFT }).then((g) => { ptop.style.opacity = ''; g.remove(); });
  if (lf) { lg.style.opacity = 0; morphEl(lf, R(lf), R(lg), SOFT).then((g) => { lg.style.opacity = ''; g.remove(); }); }
  A($('h3', ptop), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: SOFT.d * .45 });
  A($('p', ptop), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: SOFT.d * .52 });
  // the rest rises from below, one beat behind
  A(pmain, [{ transform: 'translateY(560px)' }, { transform: 'none' }], SOFT, { delay: 40 });
  A(ap, [{ transform: 'translateY(400px)' }, { transform: 'none' }], SOFT, { delay: 90 });
  A(hd, [{ opacity: 0 }, { opacity: 1 }], FADE, { delay: 200 });
  $$('.feats div', pmain).forEach((f, i) => A(f, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 260 + i * 50 }));
}

function calcSheet() {
  const chips = CALC_T.map(([l], i) => `<button data-a="chip" data-i="${i}">${l}</button>`).join('') + '<button data-a="chip" data-i="5">+</button>';
  const s = openSheet(`<div class="calc card" style="margin:0 0 11px 26px">
    <h3>Calculate<br>Fixed Deposit Returns</h3>
    <div class="in"><div class="amtbox"><div class="a"><span id="calcAmt2">${inr(S.calcAmt)}</span><input type="tel" inputmode="numeric" data-calcin2 aria-label="Investment amount"></div><div class="l">Investment amount</div></div>
      <div class="chips" id="chips2"><i class="pill"></i>${chips}</div>
      <button class="dbtn press" data-a="calc">Calculate</button></div></div>`);
  if (!s) return;
  segPill($('#chips2', s.el), S.calcT, false);
  const ci = $('[data-calcin2]', s.el);
  ci.addEventListener('focus', () => { ci.value = ''; });
  ci.addEventListener('input', () => { S.calcAmt = +(ci.value.replace(/\D/g, '').slice(0, 9)) || 0; $('#calcAmt2', s.el).textContent = inr(S.calcAmt); });
}

/* =====================================================================
   BANK LANDING
   ===================================================================== */
function bankPage(k) {
  const b = B[k];
  const plans = [['5 years', 5, 8.25], ['4y 6m 11d', 4.53, 8.25], ['3y 4m', 3.33, 8.25], ['1 years', 1, 8.25]].map(([t, y, r]) => `<button class="dplan press" data-a="dplan" data-t="${t}" data-y="${y}" data-r="${r}">${I.bars('#c43960', 39, 15)}<span>${t}</span><b>${r.toFixed(2)}%</b>${I.chev('#9a9a9a')}</button>`).join('');
  const bars = [['6.30%', 78, '#d9dee6', 60], ['7.56%', 121, '#d9dee6', 160], ['8.32%', 176, '#7ce469', 265]].map(([v, h, c, x]) => `<div class="bar" style="left:${x}px"><span>${v}</span><i style="height:${h}px;background:${c}"></i></div>`).join('');
  const tiles = [['btile1', 'Partial<br>withdrawals<br>available'], ['btile2', 'No withdrawal<br>penalty for 1Y<br>tenure'], ['btile3', 'Withdraw<br>instantly in 7<br>days'], ['btile4', 'Flexible<br>interest<br>payouts']].map(([c, t]) => `<div class="tile" style="background-image:url(img/${c}.jpg)">${t}</div>`).join('');
  const p = mkPage('bank', `
    <div class="scroll">
      <div style="height:137px"></div>
      <div class="bhero" data-st><div class="img"></div><div class="in"><h1>${b.l}</h1>${logo(k, 'w')}<p>${b.since}</p>
        <div class="feats"><div>${I.bolt}DICGC insured up to ₹5 lakh</div><div>${I.sun}RBI-licensed Small Finance Bank</div><div>${I.shield()}Listed on NSE &amp; BSE</div></div></div></div>
      <h2 class="h2">Deposit plans</h2>
      <div class="card dcards">${plans}</div>
      <button class="obtn press" data-a="viewplans2" style="margin-top:23px">View all plans ${I.chevs()}</button>
      <h2 class="h2">About the bank</h2>
      <div class="tiles card rv" data-st>${tiles}</div>
      <h2 class="h2">Compare interest rates</h2>
      <div class="card cmp">
        <div class="dd"><div class="logo"><i><img src="img/hdfc.png" alt=""></i></div><div style="flex:1"><small>HDFC BANK SAVINGS</small><b>7.86%</b></div><span class="ddv">${I.chevd.replace('#4a1d17', '#a2a2a2')}</span></div>
        <div class="bars" id="bars" style="height:230px"><i class="guide" style="bottom:176px"></i><i class="guide" style="bottom:88px"></i>${bars}</div>
        <div class="blabels"><span style="left:60px">HDFC<br>SVINGS</span><span style="left:160px">HDFC<br>FD</span><span style="left:265px">${b.n.split(' ')[0].toUpperCase()}<br>FD</span></div>
      </div>
      <h2 class="h2">Recommendation</h2>
      <div class="rec" data-a="recopen"><div class="deck">${REC.map((_, i) => recCard(i)).join('')}</div>
        <p>${REC_TEXT()}</p>
        ${askd()}</div>
      <div class="rband"><h2>Get instant receipt</h2>
        <div class="receipt"><svg class="seal" width="66" height="66" viewBox="0 0 66 66" aria-hidden="true"><defs><path id="sealp" d="M33 33m-26 0a26 26 0 1 1 52 0a26 26 0 1 1 -52 0"/></defs><text font-size="8.6" fill="rgba(255,255,255,.55)" letter-spacing="1.1"><textPath href="#sealp">Fixed deposit started 19 July 2026 •</textPath></text><g transform="translate(22 22) scale(1.3)"><path d="${MARK_D}" fill="rgba(255,255,255,.7)"/></g></svg>
          <h4>Fixed deposit receipt</h4><div class="s">Arunima Chandra, your deposit of ₹1,00,000 on Decade was successful on 25 June 2026</div>
          <div class="kv"><div><span>Start date</span><b>25 June 2026</b></div><div><span>Tenure</span><b>5 Years</b></div><div><span>Interest</span><b>8.75%</b></div><div><span>Principle</span><b>₹1,00,000</b></div></div></div>
        <div class="note">For illustration only, actual receipt may vary</div></div>
      ${qcards()}
      <div style="height:139px"></div>
    </div>
    <div class="bpill"></div>
    <div class="hdr"><button class="cbtn l press press-s" data-a="back" aria-label="Back">${I.back}</button><div class="htitle">${b.n.replace('Suryoday', 'Suryodaya')}</div><button class="cbtn r press press-s" data-a="noop" aria-label="More">${I.dots}</button></div>
    <div class="vbar"><label class="disc press" data-a="disc">${I.mark('#5a2a1f', 21)}<input type="text" placeholder="Ask Decade" aria-label="Ask Decade" tabindex="-1"><button type="button" class="send" data-a="send" aria-label="Send">${I.send}</button></label>
      <button class="vp press" data-a="viewplans2">View plans</button></div>`);
  p.dataset.bank = k;
  deckLayout(p);
  const sc = $('.scroll', p), img = $('.bhero .img', p), h = $('.hdr', p);
  h.style.setProperty('--hb', 0);
  let barsDone = false;
  hdrFade(p, 70);
  sc.addEventListener('scroll', () => { if (p._discOpen && Math.abs(sc.scrollTop - p._discY) > 30) discClose(p); }, { passive: true });
  const io = new IntersectionObserver((es) => {
    if (barsDone || !es.some((e) => e.isIntersecting)) return;
    barsDone = true; io.disconnect();
    $$('#bars .bar i', p).forEach((x, i) => A(x, [{ transform: 'scaleY(0)' }, { transform: 'none' }], BOUNCE, { delay: i * 110 }));
  }, { root: sc, rootMargin: '0px 0px -80px 0px' });
  io.observe($('#bars', p));
  $$('#bars .bar i', p).forEach((x) => { x.style.transform = 'scaleY(0)'; });
  const di = $('.disc input', p);
  di.addEventListener('keydown', (e) => { if (e.key === 'Enter') discClose(p); });
  return p;
}
function discOpen(p) {
  if (p._discOpen) { $('.disc input', p).focus(); return; }
  p._discOpen = true; p._discY = $('.scroll', p).scrollTop;
  const d = $('.disc', p), vp = $('.vp', p), inp = $('input', d), sd = $('.send', d);
  A(d, [{ clipPath: 'inset(0 296px 0 0 round 28px)' }, { clipPath: 'inset(0 0px 0 0 round 28px)' }], SOFT);
  A(vp, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(40px) scale(.7)', opacity: 0 }], SNAP);
  vp.style.pointerEvents = 'none';
  A(inp, [{ opacity: 0 }, { opacity: 1 }], FADE, { delay: 120 });
  A(sd, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], BOUNCE, { delay: 140 });
  inp.tabIndex = 0; d.parentElement.classList.add('open');
  setTimeout(() => inp.focus(), 60);
}
function discClose(p) {
  if (!p._discOpen) return; p._discOpen = false;
  const d = $('.disc', p), vp = $('.vp', p), inp = $('input', d), sd = $('.send', d);
  inp.blur(); inp.tabIndex = -1; d.parentElement.classList.remove('open');
  A(d, [{ clipPath: 'inset(0 0px 0 0 round 28px)' }, { clipPath: 'inset(0 296px 0 0 round 28px)' }], SNAP);
  A(inp, [{ opacity: 1 }, { opacity: 0 }], { e: 'ease', d: 120 });
  A(sd, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], QUICK);
  A(vp, [{ transform: 'translateX(40px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], SOFT, { delay: 60 });
  vp.style.pointerEvents = '';
}

/* =====================================================================
   BOOKING — one card; the steps slide inside it and the button stays put
   ===================================================================== */
const CTA = { personal: 'Confirm', income: 'Confirm', amount: 'Continue', pan: 'Confirm', aadhaar: 'Proceed', nominee: 'Confirm', addnom: 'Confirm', acct: 'Confirm', addacct: 'Confirm', review: 'Confirm' };
const PID = { rel: '#fRel', bank: '#fBank', occ: '#fOcc', edu: '#fEdu', inc: '#fInc', src: '#fSrc', mar: '#fMar' };
const isNbfc = (k = S.sel.bank) => /NBFC/.test(B[k].since || '');
const PICK = {
  occ: ['Occupation', ['Salaried', 'Self-employed', 'Business owner', 'Student', 'Retired', 'Homemaker']],
  edu: ['Education', ['Below graduate', 'Graduate', 'Post - graduate']],
  inc: ['Annual income', ['Up to ₹5L', '₹5L - ₹10L', '₹10L - ₹15L', '₹15L - ₹25L', '₹25L - ₹50L', '₹50L - ₹1Cr', 'Above ₹1Cr']],
  src: ['Source of income', ['Salary', 'Business', 'Investments', 'Dependent', 'Other']],
  mar: ['Marital status', ['Single', 'Married', 'Other']],
  rel: ['Relationship', ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister']],
  bank: ['Bank name', ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Federal Bank']],
};
function dobOk(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v || ''); if (!m) return false;
  const d = +m[1], mo = +m[2], y = +m[3], dt = new Date(y, mo - 1, d);
  return y > 1900 && dt.getMonth() === mo - 1 && dt.getDate() === d && dt < new Date();
}
function formErrors(st) {
  const f = S.form, e = [];
  if (st === 'addnom') {
    if (!f.name || f.name.trim().length < 2) e.push(['name', 'Enter the nominee’s full name']);
    if (!f.rel) e.push(['rel', 'Choose how they’re related to you']);
    if (!dobOk(f.dob)) e.push(['dob', f.dob && f.dob.length === 10 ? 'That date of birth isn’t valid' : 'Enter date of birth as DD/MM/YYYY']);
  } else if (st === 'personal') {
    if (!f.father || f.father.trim().length < 2) e.push(['father', 'Enter your father’s name']);
    if (isNbfc()) { if (!f.occ) e.push(['occ', 'Choose your occupation']); }
    else {
      if (!f.mother || f.mother.trim().length < 2) e.push(['mother', 'Enter your mother’s name']);
      if (!f.mar) e.push(['mar', 'Choose your marital status']);
    }
  } else if (st === 'income') {
    if (!f.occ) e.push(['occ', 'Choose your occupation']);
    if (!f.edu) e.push(['edu', 'Choose your education']);
    if (!f.inc) e.push(['inc', 'Choose your annual income']);
    if (!f.src) e.push(['src', 'Choose your source of income']);
  } else if (st === 'addacct') {
    const n = (f.accno || '').replace(/\D/g, '');
    if (n.length < 9) e.push(['accno', 'Account numbers have 9 to 18 digits']);
    if (!f.bank) e.push(['bank', n.length >= 9 ? 'We couldn’t find the bank, try again' : 'Choose your bank']);
    if (!f.holder || f.holder.trim().length < 2) e.push(['holder', 'Enter the name on the account']);
  }
  return e;
}
// typing into the booking forms: format as you go, keep the button state live
stage.addEventListener('input', (e) => {
  const t = e.target, f = S.form;
  if (t.id === 'fName') f.name = t.value;
  else if (t.id === 'fFather') f.father = t.value;
  else if (t.id === 'fMother') f.mother = t.value;
  else if (t.id === 'fHolder') f.holder = t.value;
  else if (t.id === 'fDob') {
    const d = t.value.replace(/\D/g, '').slice(0, 8);
    t.value = f.dob = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  } else if (t.id === 'fAcc') {
    const d = t.value.replace(/\D/g, '').slice(0, 18);
    t.value = f.accno = d.replace(/(\d{4})(?=\d)/g, '$1 ');
  } else return;
  const fe = t.closest('.field'); if (fe) fe.classList.remove('err');
  const er = $('#ferr'); if (er) er.textContent = '';
  updateCta();
});
stage.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const nx = { fName: null, fAcc: null }[e.target.id];
  if (e.target.id === 'fFather' && $('#fMother')) { e.preventDefault(); $('#fMother').focus(); }
  else if (e.target.id === 'fName' || e.target.id === 'fAcc' || e.target.id === 'fFather' || e.target.id === 'fMother') { e.preventDefault(); e.target.blur(); const b = e.target.closest('.step').querySelector('[data-a="pick"]'); if (b) b.click(); }
  else if (e.target.id === 'fDob' || e.target.id === 'fHolder') { e.preventDefault(); e.target.blur(); }
});
function bookPage() {
  const b = B[S.sel.bank];
  const p = mkPage('bk', `
    <div class="bcardx">
      <div class="bkh"><button class="back press press-s" data-a="stepback" aria-label="Back">${I.back}</button>${logo(S.sel.bank, 'sm')}<div class="nm">${b.n}</div></div>
      <div class="steps"></div>
    </div>
    <button class="cta press" data-a="cta"><span>Continue</span></button>
    ${askbar()}`);
  p.dataset.book = 1;
  bindAsk(p);
  return p;
}
function bookEl() { return stack.slice().reverse().find((p) => p.dataset.book); }
function stepHTML(st) {
  const s = S.sel, m = mat(S.amt, s.rate, s.yrs);
  switch (st) {
    case 'select': {
      const groups = PLANS[S.ptab ? 'rd' : 'fd'].map(([g, c, rows]) => `<div class="pgroup" data-st>${g}</div>` + rows.map(([t, y, r]) => `<button class="prow press" data-st data-a="pickplan" data-t="${t}" data-y="${y}" data-r="${r}" data-c="${c}">${I.bars(c, 39, 15)}<span>${t}</span><b>${r.toFixed(2)}%</b>${I.chev('#1c1c1c')}</button>`).join('')).join('<div style="height:61px"></div>');
      return `<div class="st" style="margin:20px 15px 25px">Select your plan</div>
        <div class="seg eq ptabs" id="ptabs"><i class="pill"></i><button data-a="ptab" data-i="0">Fixed deposit</button><button data-a="ptab" data-i="1">Recurring deposit</button></div>
        <div id="plist">${groups}</div><div style="height:40px"></div>`;
    }
    case 'amount':
      return `<div class="ptop2b" data-morph="plan"><div class="ptop2">${I.bars(s.color || '#c43960', 47, 15)}<div><b>${titleTen(s.ten)}</b><small>${B[s.bank].n.replace('bank', 'Bank')}</small></div><span class="rt">${s.rate.toFixed(2)}%</span></div>
          <div class="pay-row"><span>Interest payout</span><span class="r">On maturity<span class="pen">${I.pen}</span></span></div></div>
        <div class="bigamt"><div class="v" id="amtv">${amtSpans(S.amt)}</div><div class="m" id="amtm">Your FD at maturity will be ${inr(m)}</div></div>
        <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'd'].map((k) => k === '' ? '<span></span>' : `<button data-a="key" data-k="${k}" aria-label="${k === 'd' ? 'Delete' : k}">${k === 'd' ? I.del : k}</button>`).join('')}</div>`;
    case 'pan':
      return `<div class="st c" style="margin-bottom:35px">Confirm your PAN details</div>
        <div class="pancard" data-st><img class="phd" src="img/panhead.png" alt="Income Tax Department, Govt. of India"><i class="ln"></i>
          <dl><dt>Name</dt><dd>Vangipurappu Venkata</dd><dt>Pan Account Number</dt><dd>abcde1234k</dd><dt>Date of Birth</dt><dd>15/08/1999</dd></dl><img class="holo" src="img/holo.jpg" alt=""></div>
        <div data-st id="consents">${['I authorize Decade and its partner to verify my PAN details.', 'I consent to processing my KYC information for verification.', 'I confirm the PAN details are accurate and mine.'].map((c, i) => `<button class="consent ${S.pan[i] ? 'on' : ''}" data-a="consent" data-i="${i}"><span class="chk">${I.tick}</span>${c}</button>`).join('')}</div>`;
    case 'aadhaar':
      return `<div class="st c">Confirm your Aadhaar</div>
        <div class="adesc" data-st>You will be redirected to the bank page, enter your Aadhaar number and confirm with OTP</div>
        <div class="abox" data-st><img src="img/aadhaar.png" alt="Aadhaar card"><div>Keep your Aadhaar number handy</div></div>
        <div class="ashare" data-st>${I.shield('#037600', 16)}Shared directly with the bank KYC</div>`;
    case 'personal': case 'income': {
      const f = S.form, pf = (k, l) => `<button class="field" data-st data-f="${k}" data-a="pick" data-k="${k}"><small>${l}</small><span class="val ${f[k] ? '' : 'phv'}" id="${PID[k].slice(1)}">${f[k] ? esc(f[k]) : 'Select one'}${I.chevd.replace('#4a1d17', '#aba6a6')}</span></button>`;
      const tf = (k, id, l) => `<label class="field" data-st data-f="${k}"><small>${l}</small><input id="${id}" type="text" autocomplete="off" autocapitalize="words" enterkeyhint="next" placeholder="Enter name" value="${esc(f[k] || '')}"></label>`;
      if (st === 'income') return `<div class="st">Income details</div>${pf('occ', 'Occupation')}${pf('edu', 'Education')}${pf('inc', 'Annual income')}${pf('src', 'Source of income')}<div class="ferr" id="ferr"></div>`;
      if (isNbfc()) return `<div class="st">Personal details</div>${tf('father', 'fFather', 'Father’s name')}${pf('occ', 'Your occupation')}<div class="ferr" id="ferr"></div>`;
      return `<div class="st">Personal details</div>${tf('father', 'fFather', 'Father’s name')}${tf('mother', 'fMother', 'Mother’s name')}${pf('mar', 'Marital status')}<div class="ferr" id="ferr"></div>`;
    }
    case 'nominee':
      return `<div class="st">Choose your nominee</div>` +
        S.noms.map((m, i) => `<button class="opt person ${S.nom === i ? 'on' : ''}" data-st data-a="nom" data-i="${i}" ${m.isNew ? 'data-new' : ''}><b>${esc(m.n)}</b><small>${esc(m.r)}</small><small>DOB : ${m.d}</small><span class="radio"></span></button>`).join('') +
        `<button class="addnew press" data-st data-a="goto" data-s="addnom">Add new +</button>`;
    case 'addnom': {
      const f = S.form;
      return `<div class="st">Add nominee details</div>
        <label class="field" data-st data-f="name"><small>Name</small><input id="fName" type="text" autocomplete="off" autocapitalize="words" enterkeyhint="next" placeholder="Enter full name" value="${esc(f.name || '')}"></label>
        <button class="field" data-st data-f="rel" data-a="pick" data-k="rel"><small>Relationship</small><span class="val ${f.rel ? '' : 'phv'}" id="fRel">${f.rel || 'Select one'}${I.chevd.replace('#4a1d17', '#aba6a6')}</span></button>
        <label class="field" data-st data-f="dob"><small>Date of birth</small><input id="fDob" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="DD/MM/YYYY" maxlength="10" value="${f.dob || ''}"></label>
        <div class="ferr" id="ferr"></div>`;
    }
    case 'acct':
      return `<div class="st">Choose your bank account</div><div class="asub" data-st>This account will pay and receive money from your fixed deposit</div>` +
        S.accts.map((a, i) => `<button class="opt acct ${S.acc === i ? 'on' : ''}" data-st data-a="acc" data-i="${i}" ${a.isNew ? 'data-new' : ''}><span class="lg">${a.lg ? `<img src="img/${a.lg}.png" alt="" style="width:26px">` : `<b class="ini">${a.s.slice(0, 2)}</b>`}</span><span><b>${esc(a.b)}</b><small><span class="dots4">····</span>${a.n}</small></span><span class="radio"></span></button>`).join('') +
        `<button class="addnew press" data-st data-a="goto" data-s="addacct">Add new +</button>`;
    case 'addacct': {
      const f = S.form;
      return `<div class="st">Add bank details</div>
        <label class="field" data-st data-f="accno"><small>Account number</small><input id="fAcc" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next" placeholder="Enter account number" value="${f.accno || ''}"></label>
        <button class="field" data-st data-f="bank" data-a="pick" data-k="bank"><small>Bank name</small><span class="val ${f.bank ? '' : 'phv'}" id="fBank">${f.bank || 'Select one'}${I.chevd.replace('#4a1d17', '#aba6a6')}</span></button>
        <label class="field" data-st data-f="holder"><small>Name on account</small><input id="fHolder" type="text" autocomplete="off" autocapitalize="words" enterkeyhint="done" placeholder="Enter name" value="${esc(f.holder || '')}"></label>
        <div class="ferr bot" id="ferr"></div>`;
    }
    case 'review':
      return `<div class="rvh"><div>Review your FD</div><button data-a="edit">Edit</button></div>
        <div class="rv1" data-st><div class="a">Amount<b>${inr(S.amt)}</b></div>
          <div class="m"><div><small>Maturity amount</small><b>${inr(m)}</b></div><div><small>Interest gain</small><b class="g">+${inr(m - S.amt)}</b></div></div></div>
        <div class="rv2" data-st>
          ${[['Tenure', titleTen(s.ten), 'n'], ['Interest rate', s.rate.toFixed(2) + '%', 'n'], ['Interest payout', 'At maturity', ''], ['Nominee', esc(S.noms[S.nom].n), '']].map(([l, v, c]) => `<div class="kv"><span>${l}</span><b class="${c}">${v}</b></div>`).join('')}
          <div class="kv"><b>Reinvest on maturity</b><button class="toggle ${S.reinv ? 'on' : ''}" data-a="reinv" aria-label="Reinvest on maturity"><i></i></button></div></div>`;
  }
  return '';
}
const titleTen = (t) => t.replace(/\b(years?|months?|days?)\b/g, (w) => w[0].toUpperCase() + w.slice(1));
const amtSpans = (n) => Array.from(inr(n)).map((c) => `<span>${c}</span>`).join('');

function renderStep(dir, o = {}) {
  const p = bookEl(); if (!p) return;
  const st = S.steps[S.steps.length - 1], box = $('.steps', p);
  const old = Array.from(box.children);
  const el = document.createElement('div'); el.className = 'step'; el.innerHTML = stepHTML(st); el.dataset.step = st;
  box.appendChild(el);
  p.classList.toggle('sel', st === 'select');
  if (st === 'select') segPill($('#ptabs', el), S.ptab, false);
  // CTA label rolls, the button never moves
  const cta = $('.cta', p), lab = CTA[st] || 'Confirm', cur = $('span:last-child', cta);
  if (cur.textContent !== lab) {
    const n = document.createElement('span'); n.textContent = lab; cta.appendChild(n);
    A(cur, [{ transform: 'none', opacity: 1 }, { transform: `translateY(${-24 * (dir || 1)}px)`, opacity: 0 }], QUICK).then(() => cur.remove());
    A(n, [{ transform: `translateY(${24 * (dir || 1)}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], SOFT, { delay: 40 });
  }
  updateCta();
  if (o.morphFrom) { // a picked row becomes the next step's top box
    const tgt = $('[data-morph]', el);
    old.forEach((x) => A(x, [{ opacity: 1 }, { opacity: 0 }], { e: 'ease', d: 160 }).then(() => x.remove()));
    $$(':scope > *', el).forEach((c, i) => { if (c !== tgt) A(c, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 140 + i * 40 }); });
    tgt.style.opacity = 0;
    morphBox(o.morphFrom, R(tgt), { r0: 20, r1: 20, bg0: '#fff', bg1: '#f3f3ee', sh: 'none', sp: SOFT }).then((g) => { tgt.style.opacity = ''; g.remove(); });
    const ic = o.icon; if (ic) { const ti = $('svg', tgt); ti.style.opacity = 0; morphEl(ic, R(ic), R(ti), SOFT).then((g) => { ti.style.opacity = ''; g.remove(); }); }
    return;
  }
  const nw = $('[data-new]', el);
  if (nw) { nw.removeAttribute('data-new'); A(nw, [{ transform: 'scale(.92)', opacity: 0 }, { transform: 'none', opacity: 1 }], BOUNCE, { delay: 260 }); [S.noms, S.accts].forEach((l) => l.forEach((x) => { x.isNew = false; })); }
  if (!dir) { old.forEach((x) => x.remove()); stagger(el, 60); return; }
  old.forEach((x) => A(x, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 90}px)`, opacity: 0 }], SNAP).then(() => x.remove()));
  A(el, [{ transform: `translateX(${dir * 120}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], SNAP);
  if (dir > 0) $$('[data-st]', el).slice(0, 6).forEach((x, i) => A(x, [{ transform: `translateX(${30 + i * 14}px)` }, { transform: 'none' }], SOFT, { delay: 20 }));
}
function updateCta() {
  const p = bookEl(); if (!p) return;
  const st = S.steps[S.steps.length - 1];
  $('.cta', p).classList.toggle('off', (st === 'pan' && !S.pan.every(Boolean)) || (['addnom', 'addacct', 'personal', 'income'].includes(st) && formErrors(st).length > 0));
}
function reach(st) { const i = ORDER.indexOf(st); if (i > (S.reached ?? -1)) S.reached = i; }
function goStep(st, o = {}) {
  reach(st);
  if (busy && !o.force) return; lock(320);
  const i = S.steps.indexOf(st);
  if (i >= 0) { S.steps = S.steps.slice(0, i + 1); renderStep(-1, o); }
  else { S.steps.push(st); renderStep(1, o); }
}
function bookBack(fromSwipe, dx = 0) {
  if (S.steps.length > 1) {
    if (fromSwipe) { // the swipe walks back one step; the card springs home
      const p = top(), prev = stack[stack.length - 2];
      A(p, [{ transform: `translateX(${dx}px)` }, { transform: 'none' }], SNAP);
      A(prev, [{ transform: prev.style.transform }, { transform: `translateX(${UNDER}px)` }], SNAP);
      $('.dim', prev).style.opacity = .08;
    }
    S.steps.pop(); lock(320); renderStep(-1); return;
  }
  // leaving a booking part-way keeps it on the home screen as "Complete your FD"
  const r = S.reached ?? -1, sel = S.sel;
  if (r >= ORDER.indexOf('amount') && !S.paid) {
    const stage = r >= ORDER.indexOf('personal') ? 'details' : r === ORDER.indexOf('pan') ? 'pan' : 'kyc';
    const step = stage === 'details' ? 'personal' : r >= ORDER.indexOf('aadhaar') ? 'aadhaar' : 'pan';
    S.pend = { bank: sel.bank, amt: S.amt, ten: sel.ten, yrs: sel.yrs, rate: sel.rate, color: sel.color, stage, step };
  }
  pop(dx);
}
/* opening the booking card: whatever was tapped grows into it */
function openBooking(steps, src, o = {}) {
  if (busy) return; lock(700);
  S.steps = steps.slice(); S.fresh = true; S.ptab = 0; S.paid = false; S.reached = -1; steps.forEach(reach);
  if (S.planAmt && steps[0] === 'amount') S.amt = S.planAmt;
  if (recM) closeRecModal(true);
  const p = bookPage();
  const prev = top();
  pagesEl.appendChild(p); stack.push(p);
  renderStep(0);
  const card = $('.bcardx', p), to = R(card), cta = $('.cta', p);
  if (!p.classList.contains('sel')) to.h -= 127;
  if (!src) { p.style.transform = 'translateX(100%)'; A(p, [{ transform: 'translateX(100%)' }, { transform: 'none' }], SNAP); if (prev) { A(prev, [{ transform: 'none' }, { transform: `translateX(${UNDER}px)` }], SNAP); prev.classList.add('under'); } return; }
  const from = R(src);
  card.style.opacity = 0; p.style.background = 'transparent';
  const fbg = document.createElement('div'); fbg.style.cssText = 'position:absolute;inset:0;background:#f2f2f0;will-change:opacity';
  p.insertBefore(fbg, p.firstChild);
  A(fbg, [{ opacity: 0 }, { opacity: 1 }], { e: 'ease', d: 380 });
  const dark = o.dark;
  morphBox(from, to, { r0: o.r0 ?? 22, r1: 27, bg0: dark ? '#211715' : '#fff', bg1: '#fff', sp: SOFT }).then((g) => {
    card.style.opacity = ''; g.remove(); p.style.background = ''; fbg.remove();
    if (prev) setUnder(prev, true), prev.style.borderRadius = '';
  });
  const inner = [$('.bkh', p), $('.steps', p)];
  inner.forEach((x, i) => A(x, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: SOFT.d * .5 + i * 50 }));
  const lgT = $('.bkh .logo', p), lgS = o.logo;
  if (lgS) { lgT.style.opacity = 0; morphEl(lgS, R(lgS), R(lgT), SOFT).then((g) => { lgT.style.opacity = ''; g.remove(); }); }
  if (!p.classList.contains('sel')) A(cta, [{ transform: 'translateY(110px)' }, { transform: 'none' }], SOFT, { delay: 120 });
  else { const ab = $('.askbar', p); A(ab, [{ transform: 'translateY(120px)' }, { transform: 'none' }], SOFT, { delay: 160 }); }
  if (sheet) { // the sheet dissolves into the new card
    const s = sheet; sheet = null;
    A($('.backdrop', s.wrap), [{ opacity: .6 }, { opacity: 0 }], EASE);
    const ptop = $('.ptop', s.el), ap = $('.allplans', s.el), hd = $('.handle', s.el);
    if (ptop) A(ptop, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-60px) scale(.96)', opacity: 0 }], SOFT);
    if (ap) A(ap, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(80px)', opacity: 0 }], SOFT);
    if (hd) hd.style.opacity = 0;
    $$('.pmain', s.el).forEach((x) => { x.style.opacity = 0; });
    if (s.src) s.src.style.visibility = '';
    if (prev) A(prev, [{ transform: prev.style.transform || 'none', borderRadius: '26px' }, { transform: 'scale(.92)', borderRadius: '26px' }], SOFT);
    wait(SOFT.d).then(() => s.wrap.remove());
  } else if (prev) A(prev, [{ transform: 'none' }, { transform: 'scale(.95)' }], SOFT);
}

/* amount keypad */
function key(k) {
  const p = bookEl(); const v = $('#amtv', p);
  const old = S.amt;
  if (k === 'd') S.amt = S.fresh ? 0 : Math.floor(S.amt / 10);
  else { const n = (S.fresh ? 0 : S.amt) * 10 + +k; if (n > 99999999) { A(v, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { e: 'ease-out', d: 300 }); return; } S.amt = n; }
  S.fresh = false;
  v.innerHTML = amtSpans(S.amt);
  const sp = $$('span', v);
  if (k !== 'd') { const last = sp[sp.length - 1]; A(last, [{ transform: 'translateY(26px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], BOUNCE); }
  if (inr(old).length !== inr(S.amt).length) A(v, [{ transform: `scale(${k === 'd' ? 1.04 : .97})` }, { transform: 'none' }], SOFT);
  $('#amtm', p).textContent = 'Your FD at maturity will be ' + inr(mat(S.amt, S.sel.rate, S.sel.yrs));
}

/* =====================================================================
   OUTSIDE SCREENS — bank KYC page, payment page, UPI app, VKYC call
   ===================================================================== */
function present(html, cls = '', o = {}) {
  const p = mkPage('modal ' + cls, html); p.dataset.noswipe = 1;
  push(p, 'up', { noStagger: true });
  if (o.dark) $('#sbar').classList.add('light');
  return p;
}
function dismiss() { $('#sbar').classList.remove('light'); return pop(0, 'down'); }
function bankKyc() {
  const p = present(`<div class="hdr" style="height:100px;background:#fff"><div style="position:absolute;top:58px;left:0;right:0;text-align:center;font-size:13px;color:var(--mute);display:flex;justify-content:center;gap:6px;align-items:center">${I.lock}kyc.suryodaybank.com</div></div>
    <div class="ph" style="background:#fff">${logo('sur').replace('class="logo', 'style="width:64px;height:64px;border-radius:18px" class="logo')}
      <div style="font-size:21px;font-weight:500;margin-top:22px">Verify your Aadhaar</div><div style="color:var(--mute);font-size:14px;margin-top:6px">Enter the OTP sent to ••••• 43210</div>
      <div class="otp">${'<i></i>'.repeat(6)}</div><div id="kycmsg" style="font-size:14px;color:var(--mute);height:20px;margin-top:10px">Reading OTP…</div></div>`);
  const cells = $$('.otp i', p);
  '482913'.split('').forEach((d, i) => setTimeout(() => { cells[i].textContent = d; A(cells[i], [{ transform: 'scale(.6)', borderColor: '#8d6197' }, { transform: 'none', borderColor: '#ddd' }], BOUNCE); }, 700 + i * 170));
  setTimeout(() => { const m = $('#kycmsg', p); m.innerHTML = `<span style="color:var(--green-d)">✓ Aadhaar verified</span>`; A(m, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], SOFT); }, 1900);
  setTimeout(() => { dismiss().then(() => { S.form = {}; goStep('personal', { force: true }); }); }, 2700);
}
function payFlow() {
  const p = present(`<div class="hdr" style="height:100px;background:#fff"><div style="position:absolute;top:58px;left:0;right:0;text-align:center;font-size:13px;color:var(--mute);display:flex;justify-content:center;gap:6px;align-items:center">${I.lock}pay.suryodaybank.com</div></div>
    <div class="ph" style="background:#fff;justify-content:flex-start;padding-top:170px"><div style="font-size:14px;color:var(--mute)">Paying Suryoday SF Bank</div><div class="num" style="font-size:40px;font-weight:500;margin:10px 0 40px">${inr(S.amt)}</div>
      <div class="box" style="width:100%;text-align:left">${['UPI app', 'Net banking', 'Debit card'].map((t, i) => `<div class="kv" style="height:62px" ${i === 0 ? 'id="upi"' : ''}><b style="font-weight:400;font-size:16px">${t}</b><span class="radio" style="position:static;margin:0"></span></div>`).join('')}</div>
      <div id="paymsg" style="margin-top:30px;font-size:14px;color:var(--mute)"></div></div>`);
  setTimeout(() => { const u = $('#upi', p); u.classList.add('on'); u.style.background = 'var(--sel)'; u.style.transition = 'background .3s'; $('#paymsg', p).textContent = 'Opening your UPI app…'; }, 900);
  setTimeout(() => {
    const q = present(`<div class="ph" style="background:linear-gradient(180deg,#f4f1fb,#fff)"><div style="font-size:14px;color:var(--mute)">UPI · ${S.accts[S.acc].s} •••• ${S.accts[S.acc].n}</div><div class="num" style="font-size:34px;font-weight:500;margin:10px 0 34px">${inr(S.amt)}</div>
      <div style="font-size:16px;font-weight:500">Enter UPI PIN</div><div id="pin" style="display:flex;gap:14px;margin-top:22px">${'<i style="width:14px;height:14px;border-radius:50%;border:1.5px solid #8d6197;display:block"></i>'.repeat(6)}</div></div>`);
    const dots = $$('#pin i', q);
    dots.forEach((d, i) => setTimeout(() => { d.style.background = '#8d6197'; A(d, [{ transform: 'scale(1.5)' }, { transform: 'none' }], BOUNCE); }, 500 + i * 160));
    setTimeout(() => success(), 1700);
  }, 2000);
}

/* =====================================================================
   SUCCESS — rings + tick, then the result folds up into a card and VKYC rises
   ===================================================================== */
function success() {
  S.paid = true; S.pend = null;
  S.newDep = { a: S.amt, r: S.sel.rate, m: mat(S.amt, S.sel.rate, S.sel.yrs), s: 'pending', p: 0, left: 'Starts after VKYC', isNew: true };
  const p = mkPage('succ', `
    <button class="cbtn l press press-s" data-a="done" aria-label="Close" style="left:21px;opacity:0">${I.x}</button>
    <div class="card" id="scard" style="position:absolute;left:27px;width:340px;top:112px;height:249px;opacity:0"></div>
    ${[95, 145, 219, 343].map((s, i) => `<i class="ring ${i ? '' : 'r1'}" style="width:${s}px;height:${s}px"></i>`).join('')}
    <div class="sgroup" id="sg" style="position:absolute;left:27px;width:340px;top:152px">
      <div class="tickc"><svg width="24" height="18" viewBox="0 0 26 20" fill="none"><path d="M3 10.5l7 7L23 3" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="amt num" id="samt">₹0</div><div class="ok">Payment successful</div><button class="vd" data-a="details" style="opacity:0">View details</button></div>
    ${vkCard()}`);
  p.dataset.noswipe = 1;
  // everything else in the stack goes away under it
  pagesEl.appendChild(p);
  A(p, [{ opacity: 0 }, { opacity: 1 }], FADE).then(() => {
    const home = stack.find((x) => x.classList.contains('home'));
    stack.splice(0).forEach((x) => { if (x !== home) x.remove(); });
    if (home) { stack.push(home); setUnder(home, true); home.style.borderRadius = ''; }
    stack.push(p); $('#sbar').classList.remove('light');
  });
  const sg = $('#sg', p), tick = $('.tickc', p), path = $('.tickc path', p), rings = $$('.ring', p);
  // FLIP: start centred on the screen, end in the card
  const last = R(sg), cy = 362.5, dy = cy - (last.y + 27.5); // check centred where the Figma frame has it
  sg.style.transform = `translateY(${dy}px)`;
  rings.forEach((r) => { r.style.top = cy + 'px'; });
  A(tick, [{ transform: 'scale(0)' }, { transform: 'none' }], BOUNCE, { delay: 120 });
  A(path, [{ strokeDashoffset: 30 }, { strokeDashoffset: 0 }], { e: 'cubic-bezier(.4,0,.2,1)', d: 420 }, { delay: 380 });
  rings.forEach((r, i) => A(r, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], GENTLE, { delay: 260 + i * 120 }));
  A($('.amt', p), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 300 });
  A($('.ok', p), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 380 });
  setTimeout(() => countUp($('#samt', p), S.amt), 320);
  setTimeout(() => {
    A(sg, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], SOFT);
    rings.forEach((r) => { A(r, [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(-50%, calc(-50% - ${dy}px)) scale(.4)`, opacity: 0 }], SOFT); });
    A($('#scard', p), [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], SOFT);
    A($('.vd', p), [{ opacity: 0 }, { opacity: 1 }], FADE, { delay: 250 });
    A($('#vk', p), [{ opacity: 1, transform: 'translateY(520px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 90 });
    A($('[data-a="done"]', p), [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], BOUNCE, { delay: 300 });
  }, 1750);
}
function agentsOn() {
  const q = new URLSearchParams(location.search).get('vk'); if (q === 'off') return false; if (q === 'on') return true;
  const ist = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000), d = ist.getDay(), h = ist.getHours();
  return d >= 1 && d <= 5 && h >= 9 && h < 21;
}
function vkCard() {
  const on = agentsOn(), due = '<p>You need to do video KYC with the bank by <b>17 November 2026, 11:45 PM</b> to complete your FD booking</p>';
  return on ? `<div class="vk card" id="vk" style="opacity:0"><div class="img"></div><h4>Complete VKYC <small>takes ~3min</small></h4>${due}
      <div class="av"><i></i>Bank agent available</div><button class="bigbtn press" data-a="vkyc">Start VKYC</button></div>`
    : `<div class="vk card off" id="vk" style="opacity:0"><div class="img"></div><h4>Complete VKYC <small>No agents available</small></h4>${due}
      <div class="av">Available Mon -Fri 9AM to 9PM</div><button class="bigbtn press" data-a="remind">${I.bell}<span>Remind me</span></button></div>`;
}
function vkycCall() {
  const p = present(`<div class="ph"><div class="agent"></div><div id="cst" style="margin-top:26px;font-size:18px;font-weight:500">Connecting you to a bank agent…</div>
      <div id="csub" style="font-size:14px;opacity:.6;margin-top:6px">Keep your PAN card ready</div><div class="wave" id="wave" style="opacity:0">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i style="animation-delay:${i * 90}ms"></i>`).join('')}</div></div>
    <div class="me"></div><button class="end press" data-a="noop" aria-label="End call"><svg width="26" height="12" viewBox="0 0 26 12"><path d="M1 8c7-7 17-7 24 0l-3 3-4-2V6c-3-1-7-1-10 0v3l-4 2z" fill="#fff"/></svg></button>`, 'call', { dark: true });
  setTimeout(() => { $('#cst', p).textContent = 'Riya · Suryoday SF Bank'; $('#csub', p).textContent = 'Video KYC in progress'; A($('#wave', p), [{ opacity: 0 }, { opacity: 1 }], FADE); }, 1500);
  setTimeout(() => finishKyc(p), 3600);
}
/* the call screen shrinks into the "sit back and relax" sheet over Your deposits */
function finishKyc(callP) {
  S.tab = 1; S.dtab = 0;
  const home = homePage();
  stack.splice(0).forEach((x) => { if (x !== callP) x.remove(); });
  pagesEl.insertBefore(home, callP); stack.push(home); home._init();
  $('#sbar').classList.remove('light');
  const s = openSheet(`<div class="rsheet"><div class="img"></div><h3>Sit back and relax,<br>We have got your Video KYC</h3><p>We are verifying the details now. This usually takes 15mins</p><button class="bigbtn press" data-a="closesheet">Continue</button></div>`, { custom: true, noScale: true, onClose: () => {
    const n = $('.dep.new', home); if (n) { n.classList.remove('new'); void n.offsetWidth; n.classList.add('new'); }
    if (S.newDep) S.newDep.isNew = false;
  } });
  const rs = $('.rsheet', s.el), to = R(rs);
  rs.style.opacity = 0; $('.handle', s.el).style.opacity = 0;
  callP.remove();
  A($('.backdrop', s.wrap), [{ opacity: 0 }, { opacity: .6 }], EASE);
  morphBox({ x: 0, y: 0, w: 390, h: 849 }, to, { r1: 32, bg0: '#141212', bg1: '#fff', sh: 'none' }).then((g) => {
    rs.style.opacity = ''; g.remove(); A($('.handle', s.el), [{ opacity: 0 }, { opacity: 1 }], FADE);
    $$(':scope > *', rs).forEach((c, i) => A(c, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: i * 60 }));
  });
  scaleBehind(true);
}

/* =====================================================================
   actions
   ===================================================================== */
const ACT = {
  noop(el) { A(el, [{ transform: 'scale(.9)' }, { transform: 'none' }], BOUNCE); },
  exit() { if (EMB) parent.postMessage({ decade: 'menu' }, '*'); },
  back() { if (!busy) pop(); },
  ask(el) { const b = $('.askbar input', el.closest('.page')); if (b) { b.value = $('b', el).textContent; b.dispatchEvent(new Event('input')); b.focus(); } },
  askfocus(el) { const i = $('.askbar input', el.closest('.page')); if (i) i.focus(); else { const p = el.closest('.page'); if (p.classList.contains('bank')) discOpen(p); } },
  askchat() { if (recM) closeRecModal(true); chatSheet(); },
  chatq(el) { chatSend(el.textContent); const i = $('.chat input', sheet && sheet.el); if (i) i.focus({ preventScroll: true }); },
  recclose() { closeRecModal(); },
  send(el) { const b = el.closest('.askbar'); if (b) sendAsk(b); else discClose(el.closest('.page')); },
  pendgo(el) { // resume the unfinished FD at the step it stopped
    const d = S.pend; if (!d || busy) return;
    S.sel = { bank: d.bank, ten: d.ten, yrs: d.yrs, rate: d.rate, color: d.color }; S.amt = d.amt; S.planAmt = 0;
    if (d.step === 'personal') S.form = {};
    const card = el.closest('.acard');
    openBooking([d.step], card, { r0: 23, logo: $('.rlogo', card) });
  },
  tenure(el) {
    if (busy) return;
    const t = el.dataset.t, p = listPage(t), h = $('.ltitle', p), lbl = $('[data-lbl]', el);
    pagesEl.appendChild(p); const to = R(h); p.remove();
    const from = R(lbl); h.style.opacity = 0; push(p);
    const g = ghost(from, { font: '500 15px/21px var(--font-sans)', color: '#282424', whiteSpace: 'nowrap', transformOrigin: '0 0' }); g.textContent = t;
    A(g, [{ transform: 'none' }, { transform: `translate(${to.x - from.x}px, ${to.y + 4 - from.y}px) scale(${23 / 15})` }], SNAP).then(() => { h.style.opacity = ''; g.remove(); });
  },
  tab(el) {
    const i = +el.dataset.i; if (i === S.tab) return; const p = el.closest('.page');
    const dir = i > S.tab ? 1 : -1; S.tab = i; segPill($('#topseg', p), i); setPanes(p, i, dir);
  },
  dtab(el) { const i = +el.dataset.i; if (i === S.dtab) return; const dir = i > S.dtab ? 1 : -1; S.dtab = i; renderDeps(el.closest('.page'), true, dir); },
  cat(el) {
    if (busy) return;
    const lbl = $('[data-lbl]', el), t = CATS[el.dataset.c][0];
    const p = listPage(t), h = $('.ltitle', p);
    pagesEl.appendChild(p); const to = R(h); p.remove();
    const from = R(lbl);
    h.style.opacity = 0;
    push(p);
    const g = ghost(from, { font: '500 17px/22px var(--font-sans)', color: '#282424', whiteSpace: 'nowrap', transformOrigin: '0 0' }); g.textContent = t;
    A(g, [{ transform: 'none' }, { transform: `translate(${to.x - from.x}px, ${to.y + 4 - from.y}px) scale(${23 / 17})` }], SNAP).then(() => { h.style.opacity = ''; g.remove(); });
  },
  allbanks() { if (!busy) push(listPage('All FD’s')); },
  bank(el) { if (!busy) push(bankPage(el.dataset.b)); },
  plan(el) {
    if (busy) return;
    const k = el.dataset.b, amt = el.dataset.amt ? S.calcAmt : 0, t = CALC_T[S.calcT] || CALC_T[0];
    planSheet(el, amt ? { bank: k, ten: t[2], yrs: t[1], rate: 8.5, amt } : { bank: k, ten: el.dataset.t || '5 years', yrs: +el.dataset.y || 5, rate: 8.5 });
  },
  recopen(el) { openRecModal(el); },
  recplan(el) { // a card inside the open modal; on the banner itself a tap anywhere opens the modal
    if (!el.closest('.rmodal')) return openRecModal(el.closest('.rec'));
    const r = REC[+el.dataset.i]; planSheet(el, { bank: r.bank, ten: r.ten, yrs: r.yrs, rate: r.rate, amt: r.amt });
  },
  recstart(el) { // Start FD → the FD bottom sheet, the card flies up into it
    const r = REC[+el.dataset.i]; deckTimer.hold = true;
    planSheet(el.closest('.dcard'), { bank: r.bank, ten: r.ten, yrs: r.yrs, rate: r.rate, amt: r.amt || 0 });
  },
  closesheet() { if (sheet) closeSheet().then(() => { if (!recM) deckTimer.hold = false; }); },
  sheetbank() { const k = S.sel.bank; closeRecModal(true); closeSheet().then(() => push(bankPage(k))); },
  startfd() { if (!sheet) return; openBooking(['amount'], $('.pmain', sheet.el), { logo: $('.ptop .logo', sheet.el), r0: 26 }); },
  viewplans() { if (!sheet) return; S.planAmt = 0; openBooking(['select'], $('.pmain', sheet.el), { logo: $('.ptop .logo', sheet.el), r0: 26 }); },
  viewplans2(el) { const p = el.closest('.page'); S.sel = { bank: p.dataset.bank, ten: '5 years', yrs: 5, rate: 8.25 }; S.planAmt = 0; openBooking(['select'], el, { dark: el.classList.contains('vp'), r0: el.classList.contains('vp') ? 28 : 24, logo: $('.bhero .logo', p) }); },
  dplan(el) { const p = el.closest('.page'); S.sel = { bank: p.dataset.bank, ten: el.dataset.t, yrs: +el.dataset.y, rate: +el.dataset.r, color: '#c43960' }; S.planAmt = 0; openBooking(['amount'], el, { r0: 20, logo: $('.bhero .logo', p) }); },
  disc(el, e) { if (e.target.closest('.send')) return; discOpen(el.closest('.page')); },
  chip(el) {
    const i = +el.dataset.i, seg = el.parentElement;
    if (i === 5) { A(el, [{ transform: 'rotate(0)' }, { transform: 'rotate(90deg)' }], BOUNCE).then(() => { el.style.transform = ''; }); return; }
    S.calcT = i; segPill(seg, i);
  },
  calc() { if (busy) return; if (sheet) closeSheet().then(() => push(amtListPage())); else push(amtListPage()); },
  calcsheet() { calcSheet(); },
  filter(el) { if (!busy) filterSheet(el); },
  fchip(el) {
    const f = sheet.flt, g = el.dataset.g, v = el.dataset.v, i = f[g].indexOf(v);
    if (i >= 0) f[g].splice(i, 1); else f[g].push(v);
    el.classList.toggle('on', i < 0); A(el, [{ transform: 'scale(.93)' }, { transform: 'none' }], BOUNCE); fLive();
  },
  fsort(el) { sheet.flt.sort = el.dataset.v; $$('.fseg button', sheet.el).forEach((b) => b.classList.toggle('on', b === el)); fLive(); },
  fins(el) { const f = sheet.flt; f.ins = !f.ins; $('.toggle', el).classList.toggle('on', f.ins); fLive(); },
  fclear() {
    const f = sheet.flt, nf = fNew(); Object.keys(nf).forEach((k) => { f[k] = nf[k]; });
    $$('.fchip.on, .fbank.on', sheet.el).forEach((b) => b.classList.remove('on')); $('.fins .toggle', sheet.el).classList.remove('on');
    $$('.fseg button', sheet.el).forEach((b) => b.classList.toggle('on', b.dataset.v === 'rate')); fLive();
  },
  fapply(el) {
    if (el.classList.contains('off')) { A(el, [{ transform: 'none' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { e: 'ease-out', d: 380 }); return; }
    const p = sheet.page; p._flt = sheet.flt; closeSheet().then(() => applyFilter(p));
  },
  funset(el) {
    const p = el.closest('.page'), f = p._flt, g = el.dataset.g, v = el.dataset.v;
    if (g === 'ins') f.ins = false; else f[g] = f[g].filter((x) => x !== v);
    const hid = fRows(p).filter((r) => r.style.display === 'none');
    A(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.8)' }], QUICK).then(() => {
      applyFilter(p, false);
      hid.filter((r) => r.style.display !== 'none').forEach((r, i) => A(r, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: i * 40 }));
    });
  },
  stepback() { if (!busy) bookBack(false); },
  ptab(el) {
    const i = +el.dataset.i; if (i === S.ptab) return; const dir = i > S.ptab ? 1 : -1; S.ptab = i;
    const step = el.closest('.step'); segPill($('#ptabs', step), i);
    const list = $('#plist', step), tmp = document.createElement('div'); tmp.innerHTML = stepHTML('select'); const nl = $('#plist', tmp);
    A(list, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 50}px)` }], QUICK).then(() => {
      list.innerHTML = nl.innerHTML; list.style.transform = '';
      A(list, [{ opacity: 0, transform: `translateX(${dir * 50}px)` }, { opacity: 1, transform: 'none' }], SNAP);
    });
  },
  pickplan(el) {
    if (busy) return;
    S.sel = Object.assign({}, S.sel, { ten: el.dataset.t, yrs: +el.dataset.y, rate: +el.dataset.r, color: el.dataset.c }); S.fresh = true;
    const from = R(el), icon = $('svg', el);
    el.style.visibility = 'hidden';
    goStep('amount', { morphFrom: from, icon });
  },
  key(el) { key(el.dataset.k); },
  cta(el) {
    if (busy) return;
    const st = S.steps[S.steps.length - 1];
    if (st === 'pan' && !S.pan.every(Boolean)) { const c = $('#consents', bookEl()); A(c, [{ transform: 'none' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { e: 'ease-out', d: 420 }); return; }
    const next = { amount: 'pan', pan: 'aadhaar', nominee: 'acct', acct: 'review' }[st];
    if (st === 'amount' && S.amt < 1000) { A($('#amtv', bookEl()), [{ transform: 'none' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(7px)' }, { transform: 'none' }], { e: 'ease-out', d: 380 }); $('#amtm', bookEl()).textContent = 'Minimum deposit is ₹1,000'; return; }
    if (next) return goStep(next);
    if (st === 'aadhaar') return bankKyc();
    if (['addnom', 'addacct', 'personal', 'income'].includes(st)) {
      const errs = formErrors(st), step = $('.step:last-child', bookEl());
      if (errs.length) {
        errs.forEach(([k]) => { const fe = $(`[data-f="${k}"]`, step); if (fe) fe.classList.add('err'); });
        const er = $('#ferr', step); er.textContent = errs[0][1];
        A(er, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], SOFT);
        const first = $(`[data-f="${errs[0][0]}"]`, step);
        A(first, [{ transform: 'none' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { e: 'ease-out', d: 400 });
        const inp = first && $('input', first); if (inp) inp.focus();
        return;
      }
      const f = S.form;
      if (st === 'personal' && !isNbfc()) { goStep('income'); return; }
      if (st === 'personal' || st === 'income') { S.me = Object.assign({}, f); S.form = {}; goStep('nominee'); return; }
      if (st === 'addnom') { S.noms.forEach((m) => { m.isNew = false; }); S.noms.push({ n: f.name.trim(), r: f.rel, d: f.dob, isNew: true }); S.nom = S.noms.length - 1; goStep('nominee'); }
      else { S.accts.forEach((a) => { a.isNew = false; }); const n = f.accno.replace(/\D/g, ''); S.accts.push({ b: f.bank, s: f.bank.split(' ')[0], n: n.slice(-4), lg: f.bank === 'HDFC Bank' ? 'hdfc' : '', isNew: true }); S.acc = S.accts.length - 1; goStep('acct'); }
      return;
    }
    if (st === 'review') return payFlow();
  },
  consent(el) { const i = +el.dataset.i; S.pan[i] = !S.pan[i]; el.classList.toggle('on', S.pan[i]); updateCta(); A($('.chk', el), [{ transform: 'scale(.8)' }, { transform: 'none' }], BOUNCE); },
  nom(el) { S.nom = +el.dataset.i; $$('.opt', el.parentElement).forEach((o) => o.classList.toggle('on', o === el)); },
  acc(el) { S.acc = +el.dataset.i; $$('.opt', el.parentElement).forEach((o) => o.classList.toggle('on', o === el)); },
  goto(el) {
    const st = el.dataset.s; S.form = {};
    goStep(st);
    const inp = $('.step:last-child input', bookEl()); if (inp) inp.focus({ preventScroll: true }); // keyboard up on the same tap
  },
  pick(el) {
    const k = el.dataset.k, [title, opts] = PICK[k], cur = S.form[k];
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    openSheet(`<div class="psheet"><h3>${title}</h3><div class="pbody"><div class="plist">${opts.map((o) => `<button class="prow2 ${o === cur ? 'on' : ''}" data-a="picksel" data-v="${esc(o)}"><span>${esc(o)}</span><span class="radio"></span></button>`).join('')}</div>
      <button class="pconf press" data-a="pickset" data-k="${k}">Confirm</button></div></div>`);
  },
  picksel(el) {
    $$('.prow2', el.parentElement).forEach((x) => x.classList.toggle('on', x === el));
    A($('.radio', el), [{ transform: 'scale(.8)' }, { transform: 'none' }], BOUNCE);
  },
  pickset(el) {
    const k = el.dataset.k, on = $('.prow2.on', el.closest('.psheet'));
    if (!on) { const l = $('.plist', el.closest('.psheet')); A(l, [{ transform: 'none' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { e: 'ease-out', d: 400 }); return; }
    const v = on.dataset.v; S.form[k] = v;
    closeSheet().then(() => {
      const step = $('.step:last-child', bookEl()), val = $(PID[k], step), fe = val && val.closest('.field');
      if (!val) return;
      val.innerHTML = esc(v) + I.chevd.replace('#4a1d17', '#aba6a6'); val.classList.remove('phv'); fe.classList.remove('err'); const er = $('#ferr', step); if (er) er.textContent = '';
      A(val, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], SOFT);
      updateCta();
      const nx = k === 'rel' ? $('#fDob', step) : k === 'bank' ? $('#fHolder', step) : null; if (nx && !nx.value) nx.focus({ preventScroll: true });
      // income details: walk on to the next empty picker
      if (step.dataset.step === 'income') { const nb = $$('[data-a="pick"]', step).find((b) => !S.form[b.dataset.k]); if (nb) setTimeout(() => { if (!sheet) ACT.pick(nb); }, 280); }
    });
  },
  reinv(el) { S.reinv = !S.reinv; el.classList.toggle('on', S.reinv); },
  edit() {
    const r = (l, v, s, c = '') => `<div class="kv"><span>${l}</span><b class="${c}">${v}<button class="pen press-s press" data-a="editgo" data-s="${s}" aria-label="Edit ${l}">${I.pen}</button></b></div>`;
    openSheet(`<div class="esheet"><h3>Edit details</h3><div class="box fill">${r('Amount', inr(S.amt), 'amount')}${r('Tenure', titleTen(S.sel.ten), 'select')}${r('Nominee', esc(S.noms[S.nom].n), 'nominee', 'n')}</div></div>`);
  },
  editgo(el) { const s = el.dataset.s; closeSheet().then(() => goStep(s, { force: true })); },
  details() {
    openSheet(`<div class="esheet"><h3>Your FD</h3><div class="box fill">${[['Bank', B[S.sel.bank].n], ['Amount', inr(S.amt)], ['Tenure', titleTen(S.sel.ten)], ['Interest rate', S.sel.rate.toFixed(2) + '%'], ['At maturity', inr(mat(S.amt, S.sel.rate, S.sel.yrs))]].map(([l, v]) => `<div class="kv"><span>${l}</span><b>${v}</b></div>`).join('')}</div></div>`);
  },
  vkyc() { vkycCall(); },
  remind(el) {
    if (el.classList.contains('set')) return;
    el.classList.add('set'); const t = $('span', el);
    A(t, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], QUICK).then(() => { t.textContent = 'Reminder set for 9AM'; A(t, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], SOFT); });
    A($('svg', el), [{ transform: 'rotate(0)' }, { transform: 'rotate(-18deg)' }, { transform: 'rotate(14deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'none' }], { e: 'ease-out', d: 600 });
    toast('We’ll remind you when bank agents are available');
  },
  depopen(el) { // the card lifts out of the list and settles at the top of FD details
    if (busy) return;
    const L = deposits(), d = L[el.dataset.k][+el.dataset.i];
    const p = detailsPage(d), from = R(el);
    p.style.opacity = 0; pagesEl.appendChild(p); const slot = $('.dslot .dep', p), to = R(slot); p.remove(); p.style.opacity = '';
    slot.style.opacity = 0; el.style.visibility = 'hidden';
    push(p, 'fade', { noStagger: true });
    $$('[data-st]', p).forEach((x, i) => A(x, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 140 + i * 50 }));
    A($('.again', p), [{ opacity: 0, transform: 'translateY(-20px) scale(.96)' }, { opacity: 1, transform: 'none' }], SOFT, { delay: 160 });
    A($('.dband', p), [{ opacity: 0 }, { opacity: 1 }], FADE);
    morphEl(el, from, to, SOFT).then((g) => { slot.style.opacity = ''; g.remove(); el.style.visibility = ''; });
  },
  again(el) { const d = top()._dep; S.sel = { bank: 'sur', ten: '5 years', yrs: 5, rate: d.r }; S.planAmt = d.a; openBooking(['amount'], el, { dark: true, r0: 28 }); },
  mi() {
    S.form = S.form || {};
    const cur = $('#mi', top()).textContent;
    openSheet(`<div class="esheet"><h3>Maturity instruction</h3><div class="box">${['Reinvest', 'Reinvest principal only', 'Pay out to bank account'].map((o) => `<button class="kv pk ${o === cur ? 'on' : ''}" data-a="miset" data-v="${o}"><b style="font-weight:400;font-size:17px;letter-spacing:0">${o}</b><span class="radio"></span></button>`).join('')}</div></div>`);
  },
  miset(el) {
    $$('.pk', el.parentElement).forEach((x) => x.classList.toggle('on', x === el));
    const v = el.dataset.v;
    setTimeout(() => closeSheet().then(() => { const m = $('#mi', top()); if (!m) return; m.textContent = v.replace('Pay out to bank account', 'Payout'); A(m, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], SOFT); }), 160);
  },
  dl(el) { const c = el.closest('.kv').querySelector('.pen'); A(c, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'none' }], BOUNCE); toast('Receipt downloaded'); },
  f121() { toast('Form 121 opens on the bank’s site'); },
  done() {
    S.tab = 1; S.dtab = 0;
    const home = homePage(); const cur = top();
    pagesEl.insertBefore(home, cur);
    stack.splice(0).forEach((x) => { if (x !== cur) x.remove(); });
    stack.push(home, cur); home._init(); setUnder(home, true);
    pop(0, 'down');
  },
};
stage.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el || !stage.contains(el)) return;
  const f = ACT[el.dataset.a]; if (f) f(el, e);
});
// tapping outside the open bank field folds it back
stage.addEventListener('pointerdown', (e) => {
  const p = top(); if (p && p._discOpen && !e.target.closest('.vbar')) discClose(p);
  if (e.target.closest('.deck')) { deckTimer.hold = true; clearTimeout(deckTimer.h); deckTimer.h = setTimeout(() => { deckTimer.hold = false; }, 5000); }
});
// flick the recommendation deck up to shuffle it yourself
(() => {
  let d = null;
  stage.addEventListener('pointerdown', (e) => { const dk = e.target.closest('.home .deck'); if (dk) d = { y: e.clientY, t: performance.now() }; });
  stage.addEventListener('pointerup', (e) => {
    if (!d) return; const dy = (e.clientY - d.y) / K, dt = performance.now() - d.t; d = null;
    if (dy < -36 && dt < 450) { const p = top(); if (p && p.classList.contains('home')) { deckNext(p); endSwipe.block = true; setTimeout(() => { endSwipe.block = false; }, 60); } }
  });
})();
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (sheet) closeSheet(); else if (top() && top().dataset.book) bookBack(false); else pop(); } });
addEventListener('message', (e) => { if (e.data && e.data.decade === 'back') { if (sheet) closeSheet(); else if (stack.length > 1) { if (top().dataset.book) bookBack(false); else pop(); } } });

/* focusing a field must never scroll the fixed frame (stage, pages, the booking card) — only real scrollers move */
document.addEventListener('scroll', (e) => {
  const t = e.target;
  if (t === document || !t.classList) { if (scrollY || scrollX) scrollTo(0, 0); return; }
  if (t === stage || t === pagesEl || t === layer || t.classList.contains('page') || t.classList.contains('bcardx') || t.classList.contains('steps') || t.classList.contains('sheet') || t.classList.contains('rmodal')) { t.scrollTop = 0; t.scrollLeft = 0; }
}, true);
// keep a focused field in view inside its own step, smoothly
stage.addEventListener('focusin', (e) => {
  const f = e.target.closest && e.target.closest('.field'), st = f && f.closest('.step');
  if (st) setTimeout(() => { const r = f.offsetTop - 30; if (r < st.scrollTop || r > st.scrollTop + st.clientHeight - 120) st.scrollTo({ top: Math.max(0, r - 40), behavior: 'smooth' }); }, 60);
});

/* ---------------- start ---------------- */
['hero.jpg', 'vkyc.jpg', 'relax.jpg', 'btile1.jpg', 'btile2.jpg', 'btile3.jpg', 'btile4.jpg', 'panhead.png', 'holo.jpg', 'tile1.jpg', 'tile2.jpg', 'tile3.jpg', 'tile4.jpg', 'pan.png', 'aadhaar.png', 'hdfc.png', 'suryoday.png', 'jana.png', 'shriram.png', 'shivalik.png', 'unity.png']
  .forEach((n) => { const im = new Image(); im.src = 'img/' + n; if (im.decode) im.decode().catch(() => {}); });
const home = homePage();
pagesEl.appendChild(home); stack.push(home); home._init();
stagger(home, 120);
})();
