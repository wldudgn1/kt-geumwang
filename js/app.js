(function () {
  'use strict';

  const CFG = window.SITE_CONFIG;
  const I18N = window.I18N;
  // Supabase 가 설정돼 있으면 DB에서, 아니면 js/products.js 에서 상품을 읽어요
  const USE_DB = !!(CFG.supabaseUrl && CFG.supabaseKey);
  let PRODUCTS = USE_DB ? [] : (window.PRODUCTS || []).slice();
  let loading = USE_DB;
  const LANGS = (CFG.languages || Object.keys(I18N)).filter(l => I18N[l]);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  const state = { lang: detectLang(), brand: 'all', q: '', sort: 'new', hideSold: false };

  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    const saved = store.get('lang');
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'ko').slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : 'en';
  }

  function t(key, vars) {
    let v = I18N[state.lang][key];
    if (v === undefined) v = I18N.en[key];
    if (v === undefined) v = I18N.ko[key];
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return v;
  }
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function price(n) {
    if (n == null) return '';
    return state.lang === 'ko' ? n.toLocaleString('ko-KR') + '원' : '₩' + n.toLocaleString('en-US');
  }

  const telHref = 'tel:' + CFG.phone.replace(/[^0-9+]/g, '');

  /* ---------- 폰 그림 (사진이 없을 때) ---------- */
  function phoneSVG(p) {
    const c = p.colorHex || '#888';
    const dark = isDark(c);
    const lens = dark ? '#0b0b0b' : '#1a1a1a';
    const ring = dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)';
    const shine = 'rgba(255,255,255,.35)';
    if (/flip/i.test(p.model)) {
      return `<svg viewBox="0 0 120 200" class="phone-svg"><rect x="22" y="14" width="76" height="172" rx="14" fill="${c}"/><rect x="22" y="14" width="76" height="172" rx="14" fill="url(#g)" opacity=".5"/><rect x="30" y="22" width="60" height="62" rx="9" fill="#111"/><circle cx="44" cy="36" r="7" fill="${lens}" stroke="${ring}" stroke-width="2"/><circle cx="44" cy="54" r="7" fill="${lens}" stroke="${ring}" stroke-width="2"/><line x1="22" y1="100" x2="98" y2="100" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>${defs(shine)}</svg>`;
    }
    if (p.brand === 'apple') {
      const pro = /pro/i.test(p.model);
      const lensesPro = `<circle cx="42" cy="38" r="9" fill="${lens}" stroke="${ring}" stroke-width="2"/><circle cx="42" cy="62" r="9" fill="${lens}" stroke="${ring}" stroke-width="2"/><circle cx="62" cy="50" r="9" fill="${lens}" stroke="${ring}" stroke-width="2"/>`;
      const lensesStd = `<circle cx="42" cy="38" r="9" fill="${lens}" stroke="${ring}" stroke-width="2"/><circle cx="42" cy="62" r="9" fill="${lens}" stroke="${ring}" stroke-width="2"/>`;
      return `<svg viewBox="0 0 120 200" class="phone-svg"><rect x="18" y="10" width="84" height="180" rx="18" fill="${c}"/><rect x="18" y="10" width="84" height="180" rx="18" fill="url(#g)" opacity=".5"/><rect x="27" y="22" width="${pro ? 50 : 32}" height="54" rx="12" fill="rgba(0,0,0,.08)" stroke="${ring}"/>${pro ? lensesPro : lensesStd}<path d="M60 112c4 0 7-3 7-3s-3-2-3-5 3-5 3-5-2-3-6-3c-2 0-4 1-5 1s-3-1-5-1c-4 0-8 3-8 9 0 6 4 13 7 13 2 0 3-1 5-1s3 1 5 1z" fill="rgba(0,0,0,.18)"/>${defs(shine)}</svg>`;
    }
    // Galaxy & others: 세로 카메라 3개
    return `<svg viewBox="0 0 120 200" class="phone-svg"><rect x="18" y="10" width="84" height="180" rx="${/ultra/i.test(p.model) ? 8 : 16}" fill="${c}"/><rect x="18" y="10" width="84" height="180" rx="${/ultra/i.test(p.model) ? 8 : 16}" fill="url(#g)" opacity=".5"/><circle cx="36" cy="32" r="8" fill="${lens}" stroke="${ring}" stroke-width="2.5"/><circle cx="36" cy="54" r="8" fill="${lens}" stroke="${ring}" stroke-width="2.5"/><circle cx="36" cy="76" r="8" fill="${lens}" stroke="${ring}" stroke-width="2.5"/>${defs(shine)}</svg>`;
  }
  function defs(shine) {
    return `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shine}"/><stop offset=".5" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(0,0,0,.18)"/></linearGradient></defs>`;
  }
  function isDark(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 110;
  }

  function media(p, cls) {
    if (p.images && p.images.length) return `<img class="${cls}" src="${esc(p.images[0])}" alt="${esc(p.model)}" loading="lazy">`;
    return `<div class="${cls} ph-illust" style="--c:${esc(p.colorHex || '#999')}">${phoneSVG(p)}</div>`;
  }

  function note(p) {
    if (!p.note) return '';
    if (typeof p.note === 'string') return p.note;
    return p.note[state.lang] || p.note.en || p.note.ko || '';
  }

  /* ---------- 정적 문구 ---------- */
  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$('#langBar [data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === state.lang));
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, { n: CFG.refundDays }); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $('#statDays').textContent = t('hero.days', { n: CFG.refundDays });
    $('#statAs').textContent = t('hero.days', { n: CFG.refundDays });

    const days = { n: CFG.refundDays };
    $('#whyGrid').innerHTML = t('why').map((w, i) => `
      <article class="why-card"><div class="why-ic">${WHY_ICONS[i]}</div><h3>${esc(w[0])}</h3><p>${esc(w[1])}</p></article>`).join('');

    const g = t('grades');
    $('#gradeGrid').innerHTML = ['S', 'A', 'B', 'C'].map(k => `
      <div class="grade-card g-${k}"><span class="grade-letter">${k}</span><div><h3>${esc(g[k][0])}</h3><p>${esc(g[k][1])}</p></div></div>`).join('');
    $('#checkList').innerHTML = t('checks').map(c => `<li>${esc(c)}</li>`).join('');

    $('#steps').innerHTML = t('steps').map((s, i) => `
      <li><span class="step-n">${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></li>`).join('');

    $('#warrantyGrid').innerHTML = t('warranty').map((w, i) => `
      <div class="w-card"><div class="w-ic">${W_ICONS[i]}</div><h3>${esc(fill(w[0], days))}</h3><p>${esc(fill(w[1], days))}</p></div>`).join('');

    $('#reviewKw').innerHTML = t('reviews').map(r => `<li>“${esc(r)}”</li>`).join('');

    $('#galleryGrid').innerHTML = GALLERY.map((src, i) => `
      <button type="button" class="g-item g-${i}" data-gi="${i}"><img src="${src}" alt="${esc(t('gallery')[i])}" loading="lazy"><span class="g-cap">${esc(t('gallery')[i])}</span><span class="g-zoom" aria-hidden="true">⤢</span></button>`).join('');

    $('#faqList').innerHTML = [t('faq.as')].concat(t('faq')).map(f => [fill(f[0], days), fill(f[1], days)]).map(f => `
      <details class="faq-item"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');

    $$('#sortSelect option').forEach(o => { o.textContent = t(o.dataset.i18n); });
    renderProducts();
    if (!$('#modal').hidden && currentId) openModal(currentId, true);
  }

  const WHY_ICONS = [
    '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1.1 14.2-3.6-3.6 1.4-1.4 2.2 2.2 5-5 1.4 1.4-6.4 6.4Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M21.4 11.6 12.4 2.6A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .6.2 1.1.6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8ZM6.5 8A1.5 1.5 0 1 1 6.5 5a1.5 1.5 0 0 1 0 3Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M17 1H7a2 2 0 0 0-2 2v18c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm0 18H7V5h10v14Zm-5.6-3 5-5-1.4-1.4-3.6 3.6-1.6-1.6L8.4 13l3 3Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 14.5-4.5-4.5 1.4-1.4 3.1 3.1 6.1-6.1 1.4 1.4-7.5 7.5Z"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.7 15.7 0 0 0-1.3-3.6A8 8 0 0 1 18.9 8ZM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3c.2 1.3.7 2.5 1.3 3.6A8 8 0 0 1 5.1 16ZM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8Zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4Zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4Zm.3 5.6c.6-1.1 1.1-2.3 1.3-3.6h3a8 8 0 0 1-4.3 3.6Zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4Z"/></svg>',
  ];
  const GALLERY = ['images/store/storefront.jpg', 'images/store/inside.jpg', 'images/store/street.jpg', 'images/store/awards-board.jpg'];
  const W_ICONS = ['↺', '🔍', '🔒', '👀'];

  /* ---------- 상품 목록 ---------- */
  const ALIASES = { apple: '아이폰 iphone 苹果 ไอโฟน айфон', samsung: '갤럭시 galaxy 삼성 samsung 三星 гэлакси', etc: '' };
  const KO_WORDS = [['플립', 'flip'], ['폴드', 'fold'], ['프로', 'pro'], ['울트라', 'ultra'], ['맥스', 'max'], ['플러스', 'plus'], ['미니', 'mini'], ['에어', 'air'], ['엣지', 'edge']];
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
  const STATUS_ORDER = { sale: 0, reserved: 1, sold: 2 };

  function filtered() {
    let q = norm(state.q);
    KO_WORDS.forEach(([ko, en]) => { q = q.split(ko).join(en); });
    let list = PRODUCTS.filter(p => {
      if (state.brand !== 'all' && p.brand !== state.brand) return false;
      if (state.hideSold && p.status === 'sold') return false;
      if (q) {
        const hay = norm([p.model, p.storage, p.color, p.id, ALIASES[p.brand]].join(' '));
        // "아이폰15" 같이 브랜드+숫자 검색 대응
        const qq = q.replace(/아이폰|iphone/g, '').replace(/갤럭시|galaxy/g, '');
        const brandHit = /아이폰|iphone/.test(q) ? p.brand === 'apple' : /갤럭시|galaxy/.test(q) ? p.brand === 'samsung' : true;
        if (!(hay.includes(q) || (brandHit && qq && hay.includes(qq)) || (brandHit && !qq))) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (s) return s;
      if (state.sort === 'low') return a.price - b.price;
      if (state.sort === 'high') return b.price - a.price;
      return String(b.date).localeCompare(String(a.date));
    });
    return list;
  }

  function renderProducts() {
    if (loading) {
      $('#resultCount').textContent = '';
      $('#emptyState').hidden = true;
      $('#productGrid').innerHTML = '<div class="card skeleton"></div>'.repeat(4);
      return;
    }
    const list = filtered();
    $('#resultCount').textContent = t('products.count', { n: list.length });
    $('#emptyState').hidden = list.length > 0;
    const admin = document.body.classList.contains('is-admin');
    $('#productGrid').innerHTML = list.map(p => {
      const save = p.marketPrice && p.marketPrice > p.price ? p.marketPrice - p.price : 0;
      const card = `
      <button class="card status-${p.status}" data-id="${esc(p.id)}">
        <div class="card-media">
          ${media(p, 'card-img')}
          <span class="pill pill-${p.status}">${esc(t('status.' + p.status))}</span>
          <span class="grade-tag g-${esc(p.grade)}">${esc(t('card.grade', { g: p.grade }))}</span>
        </div>
        <div class="card-body">
          <div class="card-id">${esc(p.id)}</div>
          <h3>${esc(p.model)}</h3>
          <div class="card-spec">${esc(p.storage)} · ${esc(p.color)}${p.battery ? ` · ${esc(t('card.battery'))} ${p.battery}%` : ''}</div>
          <div class="card-price">
            ${p.marketPrice ? `<s>${esc(t('card.market'))} ${price(p.marketPrice)}</s>` : ''}
            <strong>${price(p.price)}</strong>
          </div>
          ${save && p.status !== 'sold' ? `<div class="save">${esc(t('card.save', { p: price(save) }))}</div>` : ''}
        </div>
      </button>`;
      if (!admin) return card;
      // 관리자 모드: 카드 아래에 판매 상태 버튼과 수정 버튼
      return `<div class="card-admin-wrap">${card}
        <div class="card-admin" data-id="${esc(p.id)}">
          <div class="ca-seg">${['sale', 'reserved', 'sold'].map(s => `<button type="button" data-status="${s}" class="${p.status === s ? 'on' : ''}">${esc(t('status.' + s))}</button>`).join('')}</div>
          <button type="button" class="ca-edit" data-edit="${esc(p.id)}">✎ 수정</button>
        </div></div>`;
    }).join('');
  }

  /* ---------- 상세 모달 ---------- */
  let currentId = null;
  function openModal(id, silent) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    currentId = id;
    const save = p.marketPrice && p.marketPrice > p.price ? p.marketPrice - p.price : 0;
    const imgs = (p.images || []);
    const gallery = imgs.length
      ? `<div class="gallery"><img id="mainImg" src="${esc(imgs[0])}" alt="${esc(p.model)}">${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<img src="${esc(s)}" data-src="${esc(s)}" class="${i ? '' : 'on'}" alt="">`).join('')}</div>` : ''}</div>`
      : `<div class="gallery">${media(p, 'modal-illust')}</div>`;
    const gradeInfo = t('grades')[p.grade] || ['', ''];
    const days = { n: CFG.refundDays };

    $('#modalBody').innerHTML = `
      ${gallery}
      <div class="m-info">
        <div class="m-top"><span class="pill pill-${p.status}">${esc(t('status.' + p.status))}</span><span class="m-id">${esc(t('modal.code'))} ${esc(p.id)}</span></div>
        <h2 id="mTitle">${esc(p.model)}</h2>
        <div class="m-price">
          <strong>${price(p.price)}</strong>
          ${p.marketPrice ? `<s>${price(p.marketPrice)}</s>` : ''}
          ${save && p.status !== 'sold' ? `<span class="save">${esc(t('card.save', { p: price(save) }))}</span>` : ''}
        </div>
        ${note(p) ? `<p class="m-note">${esc(note(p))}</p>` : ''}
        <table class="spec">
          <tr><th>${esc(t('modal.storage'))}</th><td>${esc(p.storage)}</td></tr>
          <tr><th>${esc(t('modal.color'))}</th><td><i class="sw" style="background:${esc(p.colorHex || '#ccc')}"></i>${esc(p.color)}</td></tr>
          <tr><th>${esc(t('modal.grade'))}</th><td><b class="grade-tag inline g-${esc(p.grade)}">${esc(p.grade)}</b> ${esc(gradeInfo[0])} · ${esc(gradeInfo[1])}</td></tr>
          ${p.battery ? `<tr><th>${esc(t('modal.battery'))}</th><td><div class="bat"><i style="width:${Math.min(100, p.battery)}%"></i></div>${p.battery}%</td></tr>` : ''}
          ${p.includes && p.includes.length ? `<tr><th>${esc(t('modal.includes'))}</th><td>${esc(p.includes.join(', '))}</td></tr>` : ''}
          ${p.date ? `<tr><th>${esc(t('modal.date'))}</th><td>${esc(p.date)}</td></tr>` : ''}
        </table>
        ${p.batteryReplaced ? `<p class="m-unlocked">🔋 ${esc(t('modal.batteryNew'))}</p>` : ''}
        <p class="m-unlocked">✓ ${esc(t('modal.unlocked'))}</p>
        <div class="m-benefits">
          <h4>${esc(t('modal.benefits'))}</h4>
          <ul>${t('benefits').map(b => `<li>${esc(fill(b, days))}</li>`).join('')}</ul>
        </div>
        <p class="m-tip">${esc(t('modal.tip', { id: p.id }))}</p>
        <div class="m-actions">
          <a class="btn btn-red" href="${telHref}">${esc(t('cta.call'))}</a>
          ${CFG.kakao ? `<a class="btn btn-kakao" href="${esc(CFG.kakao)}" target="_blank" rel="noopener">${esc(t('cta.kakao'))}</a>` : ''}
          <button class="btn btn-line" id="shareBtn">${esc(t('modal.share'))}</button>
          ${document.body.classList.contains('is-admin') ? `<button class="btn btn-dark" id="adminEditBtn">✎ 이 폰 수정</button>` : ''}
        </div>
      </div>`;

    $$('.thumbs img', $('#modalBody')).forEach(th => th.addEventListener('click', () => {
      $('#mainImg').src = th.dataset.src;
      $$('.thumbs img').forEach(x => x.classList.toggle('on', x === th));
    }));
    if ($('#adminEditBtn')) $('#adminEditBtn').addEventListener('click', () => { closeModal(); window.GWAdmin && window.GWAdmin.edit(p.id); });
    $('#shareBtn').addEventListener('click', () => {
      const url = location.origin + location.pathname + '#' + p.id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
        () => toast(t('modal.copied')), () => toast(url));
    });

    if (!silent) {
      $('#modal').hidden = false;
      document.body.classList.add('no-scroll');
      try { history.replaceState(null, '', '#' + p.id); } catch (e) { /* ignore */ }
      $('.modal-panel').scrollTop = 0;
    }
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.classList.remove('no-scroll');
    currentId = null;
    if (PRODUCTS.some(x => '#' + x.id === location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ---------- 매장 정보 바인딩 ---------- */
  function bindConfig() {
    $$('[data-cfg]').forEach(el => {
      const v = CFG[el.dataset.cfg];
      if (v === undefined || v === '') { el.remove(); return; }
      el.textContent = el.dataset.cfg === 'reviewCount' ? Number(v).toLocaleString() : v;
    });
    $$('[data-tel]').forEach(el => { el.href = telHref; });
    $$('[data-naver]').forEach(el => { el.href = CFG.naverPlace; });
    $$('[data-kakao]').forEach(el => { if (CFG.kakao) el.href = CFG.kakao; else el.remove(); });
    if ($('#mapFrame')) $('#mapFrame').src = `https://maps.google.com/maps?q=${CFG.lat},${CFG.lng}&z=17&output=embed`;
    $('#year').textContent = new Date().getFullYear();

    const sale = PRODUCTS.filter(p => p.status !== 'sold');
    const hp = sale.slice(0, 2);
    if (hp[0] && $('#heroPhone1')) $('#heroPhone1').innerHTML = phoneSVG(hp[0]);
    if (hp[1] && $('#heroPhone2')) $('#heroPhone2').innerHTML = phoneSVG(hp[1]);
  }

  /* ---------- 이벤트 ---------- */
  function initEvents() {
    const bar = $('#langBar');
    bar.innerHTML = LANGS.map(l => `<button type="button" lang="${l}" data-lang="${l}">${I18N[l].langName}</button>`).join('');
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-lang]'); if (!b) return;
      state.lang = b.dataset.lang; store.set('lang', state.lang); applyI18n();
    });

    $('#brandTabs').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      state.brand = b.dataset.brand;
      $$('#brandTabs button').forEach(x => x.classList.toggle('active', x === b));
      renderProducts();
    });
    $('#searchInput').addEventListener('input', e => { state.q = e.target.value; renderProducts(); });
    $('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderProducts(); });
    $('#hideSold').addEventListener('change', e => { state.hideSold = e.target.checked; renderProducts(); });

    // 매장 사진 크게 보기
    let lbIndex = 0;
    const lbShow = i => {
      lbIndex = (i + GALLERY.length) % GALLERY.length;
      $('#lbImg').src = GALLERY[lbIndex];
      $('#lbImg').alt = $('#lbCap').textContent = t('gallery')[lbIndex];
    };
    $('#galleryGrid').addEventListener('click', e => {
      const g = e.target.closest('[data-gi]'); if (!g) return;
      lbShow(+g.dataset.gi); $('#lightbox').hidden = false; document.body.classList.add('no-scroll');
    });
    const lbClose = () => { $('#lightbox').hidden = true; document.body.classList.remove('no-scroll'); };
    $('#lightbox').addEventListener('click', e => {
      const b = e.target.closest('[data-lb]');
      if (b) { if (b.dataset.lb === 'close') lbClose(); else lbShow(lbIndex + (b.dataset.lb === 'next' ? 1 : -1)); return; }
      if (e.target === $('#lightbox')) lbClose();
    });
    document.addEventListener('keydown', e => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape') lbClose();
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    });

    $('#productGrid').addEventListener('click', e => {
      const c = e.target.closest('.card'); if (c) openModal(c.dataset.id);
    });
    $('#modal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

    const nav = $('#nav');
    $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    nav.addEventListener('click', e => { if (e.target.tagName === 'A') document.body.classList.remove('nav-open'); });

    window.addEventListener('scroll', () => {
      document.body.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  bindConfig();
  initEvents();
  applyI18n();

  function fromRow(r) {
    return {
      id: r.id, brand: r.brand, model: r.model, storage: r.storage || '', color: r.color || '', colorHex: r.color_hex,
      grade: r.grade, battery: r.battery, batteryReplaced: r.battery_replaced, price: r.price, marketPrice: r.market_price,
      status: r.status, images: r.images || [], includes: r.includes || [], note: { ko: r.note_ko || '', en: r.note_en || '' }, date: r.arrived,
      _row: r,
    };
  }

  function openFromHash() {
    const hashId = decodeURIComponent(location.hash.slice(1));
    if (PRODUCTS.some(x => x.id === hashId)) openModal(hashId);
  }

  function loadProducts() {
    return fetch(CFG.supabaseUrl + '/rest/v1/used_phones?select=*&order=arrived.desc,created_at.desc', {
      headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey },
      cache: 'no-store',
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(rows => { PRODUCTS = rows.map(fromRow); })
      .catch(() => { if (loading) PRODUCTS = []; })
      .finally(() => { loading = false; renderProducts(); });
  }

  // 관리자 모드(js/admin.js)에서 쓰는 연결 고리
  window.GW = {
    reload: () => (USE_DB ? loadProducts() : Promise.resolve()),
    rerender: () => renderProducts(),
    all: () => PRODUCTS.slice(),
    get: id => PRODUCTS.find(x => x.id === id),
    setStatus(id, s) { const p = PRODUCTS.find(x => x.id === id); if (p) { p.status = s; if (p._row) p._row.status = s; renderProducts(); } },
  };

  if (USE_DB) loadProducts().then(openFromHash);
  else openFromHash();
})();
