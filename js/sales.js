/* =========================================================
 * 재고 · 판매 장부 (관리자 모드 전용) — 구글시트처럼 칸에 바로 입력
 * - 탭 2개: 재고 / 판매 리스트. 열 순서는 기존 구글시트와 같음
 * - 칸을 고치고 다른 칸으로 넘어가면 자동 저장, Enter = 아래 칸
 * - 구글시트에서 복사한 여러 줄을 그대로 붙여넣기 가능
 * - 재고 줄의 "판매" 버튼 → 그 줄이 판매 리스트로 넘어감
 * ========================================================= */
(function () {
  'use strict';
  const CFG = window.SITE_CONFIG;
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;

  const C = {
    arrived: { k: 'arrived', t: '입고일', type: 'date', w: 82 },
    sold_at: { k: 'sold_at', t: '판매일', type: 'date', w: 82 },
    model: { k: 'model', t: '모델명', w: 110, list: 'gsModelList' },
    color: { k: 'color', t: '색상', w: 70, center: true },
    storage: { k: 'storage', t: '용량', w: 62, center: true },
    imei: { k: 'imei', t: 'IMEI', w: 130, center: true },
    grade: { k: 'grade', t: '등급', w: 50, center: true },
    ref_price: { k: 'ref_price', t: '단가표상 A급', w: 104 },
    sale_price: { k: 'sale_price', t: '판매금액', type: 'money', w: 92 },
    margin: { k: 'margin', t: '마진', type: 'calc', w: 96, tone: 'green' },
    channel: { k: 'channel', t: '판매채널', w: 84, tone: 'pink', center: true },
    memo: { k: 'memo', t: '기타', w: 110, center: true },
    deposit: { k: 'deposit', t: '입금', w: 82, list: 'gsDepositList', center: true },
  };
  const TABS = {
    stock: {
      label: '재고', table: 'used_stock', dateKey: 'arrived', file: '중고폰_재고',
      cols: [C.arrived, Object.assign({}, C.model, { w: 130 }), C.color, C.storage, Object.assign({}, C.imei, { w: 190 }), C.grade, Object.assign({}, C.ref_price, { num: true, w: 118 }), Object.assign({}, C.memo, { w: 190 })],
    },
    sales: {
      label: '판매 리스트', table: 'used_sales', dateKey: 'sold_at', file: '중고폰_판매_리스트', period: true,
      cols: [C.arrived, C.sold_at, C.model, C.color, C.storage, C.imei, C.grade, Object.assign({}, C.ref_price, { tone: 'green', num: true }), C.sale_price, C.margin, C.channel, Object.assign({}, C.memo, { w: 150 }), C.deposit],
    },
  };
  TABS.resv = {
    label: '예약', table: 'used_reservations', dateKey: 'reserved_at', file: '중고폰_예약',
    cols: [{ k: 'reserved_at', t: '날짜', type: 'date', w: 90 }, { k: 'name', t: '이름', w: 110, center: true }, { k: 'phone', t: '휴대폰번호', type: 'phone', w: 150, center: true }, Object.assign({}, C.model, { t: '모델', w: 170 }), { k: 'memo', t: '내용', w: 460 }],
  };
  TABS.vip = {
    label: 'VIP', table: 'used_vips', dateKey: null, file: '중고폰_VIP',
    cols: [{ k: 'name', t: '이름', w: 130, center: true }, { k: 'phone', t: '휴대폰번호', type: 'phone', w: 160, center: true }, { k: 'memo', t: '내용', w: 690 }],
  };
  Object.values(TABS).forEach(T => { T.fields = T.cols.filter(c => c.type !== 'calc').map(c => c.k); });
  const BLANK_ROWS = 8;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toNum = v => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; };
  const comma = n => (n == null ? '' : Number(n).toLocaleString('ko-KR'));
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };

  // "26.10.01", "10.1", "10/1", "1001", "261001", "2026-10-01" → "2026-10-01"
  function parseDate(s) {
    s = String(s ?? '').trim(); if (!s) return null;
    let p = s.split(/[^0-9]+/).filter(Boolean), y, m, d;
    if (p.length === 1) {
      const t = p[0];
      if (t.length === 8) p = [t.slice(0, 4), t.slice(4, 6), t.slice(6)];
      else if (t.length === 6) p = [t.slice(0, 2), t.slice(2, 4), t.slice(4)];
      else if (t.length === 4) p = [t.slice(0, 2), t.slice(2)];
      else if (t.length === 3) p = [t.slice(0, 1), t.slice(1)];
      else return null;
    }
    if (p.length === 2) { y = new Date().getFullYear(); m = +p[0]; d = +p[1]; }
    else if (p.length >= 3) { y = +p[0]; if (y < 100) y += 2000; m = +p[1]; d = +p[2]; }
    else return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return y + '-' + pad(m) + '-' + pad(d);
  }
  const fmtDate = iso => (iso ? String(iso).slice(2, 4) + '.' + String(iso).slice(5, 7) + '.' + String(iso).slice(8, 10) : '');
  const isPlainNumber = s => /^[\d,\s]+$/.test(String(s ?? '')) && /\d/.test(String(s));
  // 01012345678 → 010-1234-5678 (숫자만 적었을 때만 모양을 맞춤)
  function fmtPhone(s) {
    const d = s.replace(/[^0-9]/g, '');
    if (!/^[\d\s-]+$/.test(s)) return s || null;
    if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return s || null;
  }

  function parseCell(col, text) {
    const s = String(text ?? '').trim();
    if (col.type === 'date') return parseDate(s);
    if (col.type === 'money') return toNum(s);
    if (col.type === 'phone') return fmtPhone(s);
    if (col.num && isPlainNumber(s)) return comma(toNum(s));   // 단가표: 숫자면 콤마 맞추고, 글자면 그대로
    return s || null;
  }
  // 마진 = 단가표상 A급 - 판매금액. 단가표 칸이 숫자가 아니거나 둘 중 하나가 비면 빈칸
  const marginOf = row => (isPlainNumber(row.ref_price) && row.sale_price != null ? toNum(row.ref_price) - row.sale_price : null);
  function showCell(col, row) {
    if (col.type === 'calc') return comma(marginOf(row));
    const v = row[col.k];
    if (col.type === 'date') return fmtDate(v);
    if (col.type === 'money') return comma(v);
    return v ?? '';
  }

  const data = {};
  Object.keys(TABS).forEach(k => { data[k] = { rows: [], blanks: [], loaded: false }; });
  let cur = TABS[store.get('gs-tab')] ? store.get('gs-tab') : 'stock';
  let period = today().slice(0, 7);     // 판매 리스트 기간: 'YYYY-MM' 또는 'all'
  let built = false;
  let uid = 0;
  let pending = 0;

  const A = () => window.GWAdmin;
  const sb = () => A().sb();
  const T = () => TABS[cur];
  const D = () => data[cur];
  const isEmptyIn = (tab, r) => TABS[tab].fields.every(k => r[k] == null || r[k] === '');
  const newBlank = tab => ({ _key: tab[0] + 'n' + (++uid), _new: true });

  function build() {
    if (built) return; built = true;
    const style = document.createElement('style');
    style.textContent = `
    /* 홈페이지 위에 뜨는 작은 창 (전체 화면 아님) */
    #gsBack{position:fixed;inset:0;z-index:149;background:rgba(10,11,13,.5)}
    #gsBack[hidden]{display:none}
    #gsSheet{display:flex;flex-direction:column;overflow:hidden;background:#fff;inset:0;margin:auto;width:min(1340px,calc(100vw - 48px));height:min(740px,calc(100vh - 100px));border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
    .gs-title{font-size:15px;font-weight:800;margin-right:4px;white-space:nowrap}
    @media (max-width:760px){#gsSheet{width:calc(100vw - 16px);height:calc(100vh - 72px);border-radius:14px}.gs-title{display:none}}
    .gs-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e3e5e8;flex-wrap:wrap;padding-top:calc(10px + env(safe-area-inset-top,0px))}
    .gs-tabs{display:flex;background:#f3f4f6;border-radius:10px;padding:3px;gap:3px;margin-right:6px}
    .gs-tabs button{height:36px;padding:0 16px;border:0;border-radius:8px;background:transparent;font:inherit;font-size:15px;font-weight:800;color:#6b7178;cursor:pointer;white-space:nowrap}
    .gs-tabs button.on{background:#111214;color:#fff}
    .gs-tabs button small{font-weight:700;opacity:.8}
    .gs-head .ga-chip{height:34px;padding:0 12px;font-size:13.5px}
    .gs-head input[type=month]{height:34px;border:1px solid #e3e5e8;border-radius:8px;padding:0 8px;font:inherit;font-size:13.5px}
    .gs-period{display:flex;gap:6px;align-items:center}
    .gs-period[hidden]{display:none}
    .gs-status{font-size:12.5px;color:#6b7178;margin-left:auto;white-space:nowrap}
    .gs-status.err{color:#E60012;font-weight:700;white-space:normal}
    .gs-hbtn{height:34px;padding:0 12px;border-radius:8px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
    .gs-sum{display:flex;gap:0;border-bottom:1px solid #e3e5e8;overflow-x:auto;background:#fafafa}
    .gs-sum div{padding:8px 16px;border-right:1px solid #e3e5e8;white-space:nowrap}
    .gs-sum span{display:block;font-size:12px;color:#6b7178;font-weight:600}
    .gs-sum b{font-size:18px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
    .gs-sum .warn b{color:#E60012}
    .gs-grid{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#f3f4f6}
    .gs-t{border-collapse:separate;border-spacing:0;font-size:13.5px;background:#fff;table-layout:fixed}
    .gs-t th{position:sticky;top:0;z-index:3;background:#ffeb3b;border:1px solid #c9b800;border-left:0;padding:7px 4px;font-weight:800;font-size:13px;white-space:nowrap}
    .gs-t th.no,.gs-t td.no{position:sticky;left:0;z-index:2;background:#f3f4f6;color:#6b7178;text-align:center;font-size:12px;border-right:1px solid #c9ccd1}
    .gs-t th.no{z-index:4;background:#e9eaec;border-color:#c9ccd1}
    .gs-t th.act{background:#e9eaec;border-color:#c9ccd1}
    .gs-t td{border-bottom:1px solid #e3e5e8;border-right:1px solid #e3e5e8;padding:0;height:32px}
    .gs-t td.green{background:#e3f1df}.gs-t td.pink{background:#f6dce4}
    .gs-t td.wait{background:#fff4d6}
    .gs-t td input{width:100%;height:32px;border:0;background:transparent;padding:0 7px;font:inherit;font-size:13.5px;color:#111214;outline:0;font-variant-numeric:tabular-nums}
    .gs-t td input.c{text-align:center}.gs-t td input.r{text-align:right}
    .gs-t td input:focus{box-shadow:inset 0 0 0 2px #1a73e8;background:#fff}
    .gs-t td input[readonly]{color:#0a7a35;font-weight:700;cursor:default}
    .gs-t td input.neg{color:#E60012}
    .gs-t td input.bad{box-shadow:inset 0 0 0 2px #E60012}
    .gs-t td.act{text-align:center;border-right:0;white-space:nowrap;padding:0 4px}
    .gs-t td.act .x{width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:#9aa0a6;cursor:pointer;font-size:13px}
    .gs-t td.act .x:hover{background:#fdecee;color:#E60012}
    .gs-t td.act .sell{height:26px;padding:0 10px;border:0;border-radius:6px;background:#E60012;color:#fff;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
    .gs-foot{border-top:1px solid #e3e5e8;padding:8px 14px calc(8px + env(safe-area-inset-bottom,0px));font-size:12.5px;color:#6b7178;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
    .gs-foot details{flex-basis:100%}
    .gs-foot details[hidden]{display:none}
    .gs-foot summary{cursor:pointer;font-weight:700;color:#3b3f45}
    .gs-models{margin-top:6px;max-height:160px;overflow:auto;display:flex;flex-wrap:wrap;gap:6px}
    .gs-models span{padding:4px 10px;border-radius:999px;background:#f3f4f6;color:#111214;font-weight:600}
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
    <div id="gsBack" hidden></div>
    <div class="ga-sheet" id="gsSheet" role="dialog" aria-label="재고·판매 장부" hidden>
      <div class="gs-head">
        <span class="gs-title">재고·판매 장부</span>
        <div class="gs-tabs" id="gsTabs" role="tablist">
          <button type="button" data-tab="stock">재고 <small id="gsTabStock"></small></button>
          <button type="button" data-tab="sales">판매 리스트</button>
          <button type="button" data-tab="resv">예약</button>
          <button type="button" data-tab="vip">VIP</button>
        </div>
        <div class="gs-period" id="gsPeriod">
          <button type="button" class="ga-chip" data-p="this">이번 달</button>
          <button type="button" class="ga-chip" data-p="last">지난달</button>
          <button type="button" class="ga-chip" data-p="all">전체</button>
          <input type="month" id="gsMonth" aria-label="월 선택">
        </div>
        <span class="gs-status" id="gsStatus"></span>
        <button type="button" class="gs-hbtn" id="gsCsv">엑셀 받기</button>
        <button type="button" class="ga-x" id="gsClose" aria-label="닫기">✕</button>
      </div>
      <div class="gs-sum" id="gsSum"></div>
      <div class="gs-grid" id="gsGrid"></div>
      <div class="gs-foot">
        <span id="gsHelp"></span>
        <details id="gsDetails"><summary>모델별 집계 보기</summary><div class="gs-models" id="gsModels"></div></details>
      </div>
      <datalist id="gsModelList"></datalist>
      <datalist id="gsDepositList"><option value="입금전"><option value="신한"><option value="카뱅"><option value="현금"></datalist>
    </div>`);

    $('gsClose').addEventListener('click', close);
    $('gsBack').addEventListener('click', close);
    $('gsCsv').addEventListener('click', csv);
    $('gsTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) switchTab(b.dataset.tab); });
    $('gsPeriod').addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const now = new Date();
      if (b.dataset.p === 'all') period = 'all';
      else { const d = new Date(now.getFullYear(), now.getMonth() - (b.dataset.p === 'last' ? 1 : 0), 1); period = d.getFullYear() + '-' + pad(d.getMonth() + 1); }
      render();
    });
    $('gsMonth').addEventListener('change', e => { if (e.target.value) { period = e.target.value; render(); } });

    const grid = $('gsGrid');
    grid.addEventListener('change', e => { const i = e.target.closest('input[data-k]'); if (i) onEdit(i); });
    grid.addEventListener('keydown', onKey);
    grid.addEventListener('paste', onPaste);
    grid.addEventListener('click', e => {
      const d = e.target.closest('[data-del]'), s = e.target.closest('[data-sell]');
      if (d) removeRow(d.dataset.del);
      if (s) sellStock(s.dataset.sell);
    });
  }

  /* ---------- 데이터 ---------- */
  async function load(tab) {
    const all = [], cfg = TABS[tab];
    for (let from = 0; ; from += 1000) {
      let q = sb().from(cfg.table).select('*');
      if (cfg.dateKey) q = q.order(cfg.dateKey, { ascending: true });
      const { data: rows, error } = await q.order('created_at', { ascending: true }).range(from, from + 999);
      if (error) { status(A().friendly(error), true); return false; }
      all.push(...(rows || []));
      if (!rows || rows.length < 1000) break;
    }
    data[tab].rows = all.map(r => Object.assign(r, { _key: tab[0] + 'r' + r.id }));
    data[tab].loaded = true;
    return true;
  }
  const inPeriod = r => !T().period || period === 'all' || !r.sold_at || String(r.sold_at).slice(0, 7) === period;
  function visible() { return D().rows.filter(r => r._new || inPeriod(r)).concat(D().blanks); }
  function counted(tab) { return data[tab].rows.filter(r => !isEmptyIn(tab, r) && (tab !== 'sales' || period === 'all' || !r.sold_at || String(r.sold_at).slice(0, 7) === period)); }
  function rowByKey(key) { return D().rows.find(r => r._key === key) || D().blanks.find(r => r._key === key); }

  function status(text, err) { const s = $('gsStatus'); s.textContent = text; s.className = 'gs-status' + (err ? ' err' : ''); }
  function saved() { if (pending === 0) { const d = new Date(); status('저장됨 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())); } }

  // 행 단위로 순서대로 저장 (새 행은 첫 저장 때 생성)
  function saveRow(tab, row, keys) {
    const cfg = TABS[tab], st = data[tab];
    pending++; status('저장 중…');
    row._q = (row._q || Promise.resolve()).then(async () => {
      if (!row.id) {
        if (isEmptyIn(tab, row)) return;
        if (cfg.dateKey && !row[cfg.dateKey]) { row[cfg.dateKey] = today(); if (tab === cur) paintCell(row, cfg.dateKey); }
        const payload = {}; cfg.fields.forEach(k => { payload[k] = row[k] ?? null; });
        if (tab === 'sales' && row.phone_id) payload.phone_id = row.phone_id;
        const { data: ins, error } = await sb().from(cfg.table).insert(payload).select().single();
        if (error) throw error;
        row.id = ins.id; row.created_at = ins.created_at;
        st.blanks = st.blanks.filter(b => b !== row); st.rows.push(row);
        if (tab === cur) {
          const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`);
          if (tr) { const a = tr.querySelector('td.act'); if (a) a.innerHTML = actHtml(row); }
          topUpBlanks();
        }
      } else {
        const patch = {}; keys.forEach(k => { patch[k] = row[k] ?? null; });
        const { error } = await sb().from(cfg.table).update(patch).eq('id', row.id);
        if (error) throw error;
      }
    }).then(() => { pending--; saved(); summary(); }, err => { pending--; status('저장 실패: ' + A().friendly(err), true); });
    return row._q;
  }

  /* ---------- 화면 ---------- */
  const actW = () => (cur === 'stock' ? 92 : 34);
  function actHtml(row) {
    if (!row.id) return '';
    return (cur === 'stock' ? `<button type="button" class="sell" data-sell="${row._key}">판매</button> ` : '') + `<button type="button" class="x" data-del="${row._key}" aria-label="줄 삭제">✕</button>`;
  }
  function cellHtml(row, col) {
    const cls = (col.type === 'money' || col.type === 'calc' || col.num ? 'r' : col.center || col.type === 'date' ? 'c' : '') + (col.type === 'calc' && marginOf(row) < 0 ? ' neg' : '');
    const tdCls = [col.tone || '', col.k === 'deposit' && /입금전/.test(row.deposit || '') ? 'wait' : ''].join(' ').trim();
    return `<td class="${tdCls}"><input data-k="${col.k}" class="${cls}" value="${esc(showCell(col, row))}" ${col.type === 'calc' ? 'readonly tabindex="-1"' : ''} ${col.list ? `list="${col.list}"` : ''} ${col.type === 'money' ? 'inputmode="numeric"' : ''} autocomplete="off" aria-label="${esc(col.t)}"></td>`;
  }
  function rowHtml(row, i) {
    return `<tr data-key="${row._key}"><td class="no">${i + 1}</td>${T().cols.map(c => cellHtml(row, c)).join('')}<td class="act">${actHtml(row)}</td></tr>`;
  }
  function render(keepScroll) {
    const grid = $('gsGrid'); const top = grid.scrollTop;
    while (D().blanks.length < BLANK_ROWS) D().blanks.push(newBlank(cur));
    const rows = visible(), cols = T().cols;
    grid.innerHTML = `<table class="gs-t" style="width:${38 + actW() + cols.reduce((a, c) => a + c.w, 0)}px"><colgroup><col style="width:38px">${cols.map(c => `<col style="width:${c.w}px">`).join('')}<col style="width:${actW()}px"></colgroup>
      <thead><tr><th class="no">NO</th>${cols.map(c => `<th>${c.t}</th>`).join('')}<th class="act"></th></tr></thead>
      <tbody>${rows.map(rowHtml).join('')}</tbody></table>`;
    if (keepScroll) grid.scrollTop = top;
    document.querySelectorAll('#gsTabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === cur));
    $('gsPeriod').hidden = !T().period;
    const now = new Date(), l = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYm = now.getFullYear() + '-' + pad(now.getMonth() + 1), lastYm = l.getFullYear() + '-' + pad(l.getMonth() + 1);
    document.querySelectorAll('#gsPeriod [data-p]').forEach(b => b.classList.toggle('on', (b.dataset.p === 'all' && period === 'all') || (b.dataset.p === 'this' && period === thisYm) || (b.dataset.p === 'last' && period === lastYm)));
    $('gsMonth').value = period === 'all' ? '' : period;
    $('gsHelp').textContent = (cur === 'stock' ? '팔린 폰은 줄 끝의 "판매"를 누르면 판매 리스트로 넘어가요 · ' : cur === 'resv' ? '원하는 폰이 들어오면 연락드릴 손님을 적어두세요 · ' : cur === 'vip' ? '중고폰을 자주 사가는 단골 손님 메모 · ' : '') + '칸을 고치고 다른 칸으로 넘어가면 자동 저장 · Enter = 아래 칸 · 구글시트에서 복사한 줄을 그대로 붙여넣기 · 날짜는 10.1 처럼 쳐도 돼요';
    summary();
  }
  function topUpBlanks() {
    const body = document.querySelector('#gsGrid tbody'); if (!body) return;
    while (D().blanks.length < BLANK_ROWS) {
      const b = newBlank(cur); D().blanks.push(b);
      body.insertAdjacentHTML('beforeend', rowHtml(b, body.children.length));
    }
  }
  function paintCell(row, k) {
    const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`); if (!tr) return;
    const col = T().cols.find(c => c.k === k), inp = tr.querySelector(`input[data-k="${k}"]`);
    if (col && inp && document.activeElement !== inp) inp.value = showCell(col, row);
    if (k === 'deposit' && inp) inp.parentElement.classList.toggle('wait', /입금전/.test(row.deposit || ''));
    const m = tr.querySelector('input[data-k="margin"]');
    if (m) { m.value = showCell(C.margin, row); m.classList.toggle('neg', marginOf(row) < 0); }
  }
  function summary() {
    const list = counted(cur);
    const sum = k => list.reduce((a, r) => a + (r[k] || 0), 0);
    if (cur === 'stock') {
      const priced = list.filter(r => isPlainNumber(r.ref_price));
      const oldest = list.map(r => r.arrived).filter(Boolean).sort()[0];
      $('gsSum').innerHTML = `
        <div><span>재고 대수</span><b>${list.length}</b></div>
        <div><span>단가표 합계</span><b>${comma(priced.reduce((a, r) => a + (toNum(r.ref_price) || 0), 0))}</b></div>
        <div><span>단가 미입력</span><b>${list.length - priced.length}대</b></div>
        <div><span>가장 오래된 입고</span><b>${oldest ? fmtDate(oldest) : '-'}</b></div>`;
    } else if (cur === 'sales') {
      const wait = list.filter(r => /입금전/.test(r.deposit || ''));
      $('gsSum').innerHTML = `
        <div><span>판매댓수</span><b>${list.length}</b></div>
        <div><span>단가표 합계</span><b>${comma(list.reduce((a, r) => a + (isPlainNumber(r.ref_price) ? toNum(r.ref_price) : 0), 0))}</b></div>
        <div><span>판매금액</span><b>${comma(sum('sale_price'))}</b></div>
        <div><span>마진</span><b>${comma(list.reduce((a, r) => a + (marginOf(r) || 0), 0))}</b></div>
        <div class="${wait.length ? 'warn' : ''}"><span>입금전</span><b>${wait.length}건 · ${comma(wait.reduce((a, r) => a + (r.sale_price || 0), 0))}</b></div>`;
    } else if (cur === 'resv') {
      const oldest = list.map(r => r.reserved_at).filter(Boolean).sort()[0];
      $('gsSum').innerHTML = `
        <div><span>예약 건수</span><b>${list.length}</b></div>
        <div><span>가장 오래된 예약</span><b>${oldest ? fmtDate(oldest) : '-'}</b></div>`;
    } else {
      $('gsSum').innerHTML = `<div><span>VIP 고객</span><b>${list.length}명</b></div>`;
    }
    $('gsDetails').hidden = cur === 'vip';
    if (data.stock.loaded) $('gsTabStock').textContent = counted('stock').length + '대';
    const by = {};
    list.forEach(r => { const k = r.model || '(모델명 없음)'; by[k] = by[k] || { n: 0, s: 0 }; by[k].n++; by[k].s += (cur === 'stock' ? (isPlainNumber(r.ref_price) ? toNum(r.ref_price) : 0) : cur === 'sales' ? r.sale_price : 0) || 0; });
    $('gsModels').innerHTML = Object.entries(by).sort((a, b) => b[1].n - a[1].n || b[1].s - a[1].s).map(([m, v]) => `<span>${esc(m)} ${v.n}${cur === 'resv' ? '건' : '대'}${v.s ? ' · ' + comma(v.s) : ''}</span>`).join('') || '기록이 없어요.';
    const names = Array.from(new Set(data.stock.rows.concat(data.sales.rows, data.resv.rows).map(r => r.model).concat((window.GW ? window.GW.all() : []).map(p => p.model)).filter(Boolean)));
    $('gsModelList').innerHTML = names.map(m => `<option value="${esc(m)}">`).join('');
  }

  /* ---------- 입력 ---------- */
  function onEdit(inp) {
    const tr = inp.closest('tr'), row = rowByKey(tr.dataset.key); if (!row) return;
    const col = T().cols.find(c => c.k === inp.dataset.k);
    const v = parseCell(col, inp.value);
    const bad = (col.type === 'date' || col.type === 'money') && inp.value.trim() !== '' && v == null;
    inp.classList.toggle('bad', bad);
    if (bad) { status(col.t + ' 칸을 다시 확인해 주세요 (예: ' + (col.type === 'date' ? '26.10.01 또는 10.1' : '610000') + ')', true); return; }
    row[col.k] = v;
    inp.value = showCell(col, row);
    paintCell(row, col.k);
    saveRow(cur, row, [col.k]);
  }
  function onKey(e) {
    const inp = e.target.closest('input[data-k]'); if (!inp) return;
    const down = e.key === 'Enter' || (e.key === 'ArrowDown' && !inp.list), up = e.key === 'ArrowUp' && !inp.list;
    if (!down && !up) return;
    const tr = inp.closest('tr'), next = down ? tr.nextElementSibling : tr.previousElementSibling;
    e.preventDefault();
    if (!next) return;
    const t = next.querySelector(`input[data-k="${inp.dataset.k}"]`);
    if (t) { t.focus(); t.select(); }
  }
  // 구글시트에서 복사한 여러 칸/여러 줄 붙여넣기
  function onPaste(e) {
    const inp = e.target.closest('input[data-k]'); if (!inp) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]/.test(text.replace(/\r?\n$/, ''))) return;   // 한 칸짜리는 평소대로
    e.preventDefault();
    const cols = T().cols, tab = cur;
    let lines = text.replace(/\r/g, '').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
    let table = lines.map(l => l.split('\t'));
    const startCol = cols.findIndex(c => c.k === inp.dataset.k);
    // 시트의 맨 앞 NO 열까지 같이 복사해 온 경우 건너뛰기
    const filled = table.filter(r => r.some(c => c.trim() !== ''));
    if (startCol === 0 && filled.length && filled.every(r => /^\d{0,3}$/.test((r[0] || '').trim()) && r.length > 1 && (parseDate(r[1]) || (r[1] || '').trim() === '')) && filled.some(r => parseDate(r[1]))) table = table.map(r => r.slice(1));
    const rows = visible();
    let ri = rows.findIndex(r => r._key === inp.closest('tr').dataset.key);
    const touched = [];
    table.forEach(cells => {
      if (cells.every(c => c.trim() === '')) return;            // 빈 줄은 건너뛰고 위로 붙임
      while (ri >= rows.length) { const b = newBlank(tab); D().blanks.push(b); rows.push(b); }
      const row = rows[ri++], keys = [];
      cells.forEach((c, j) => {
        const col = cols[startCol + j]; if (!col || col.type === 'calc') return;
        const v = parseCell(col, c);
        if ((col.type === 'date' || col.type === 'money') && c.trim() !== '' && v == null) return;
        row[col.k] = v; keys.push(col.k);
      });
      if (keys.length) touched.push([row, keys]);
    });
    render(true);
    touched.forEach(([row, keys]) => saveRow(tab, row, keys));
    status(touched.length + '줄 붙여넣는 중…');
  }
  async function removeRow(key) {
    const row = rowByKey(key); if (!row || !row.id) return;
    if (!(await A().ask(`${row.model || '이'} 줄을 지울까요?`))) return;
    const { error } = await sb().from(T().table).delete().eq('id', row.id);
    if (error) { status('삭제 실패: ' + A().friendly(error), true); return; }
    D().rows = D().rows.filter(r => r !== row); render(true); status('삭제했어요');
  }

  // 재고 → 판매 리스트로 넘기기
  async function sellStock(key) {
    const row = data.stock.rows.find(r => r._key === key); if (!row || !row.id) return;
    if (!(await A().ask(`${row.model || '이 폰'}을(를) 판매 리스트로 넘길까요? 재고에서는 빠져요.`))) return;
    status('판매 리스트로 넘기는 중…');
    const payload = { arrived: row.arrived || null, sold_at: today(), model: row.model || null, color: row.color || null, storage: row.storage || null, imei: row.imei || null, grade: row.grade || null, ref_price: row.ref_price || null, memo: row.memo || null };
    const { data: ins, error } = await sb().from('used_sales').insert(payload).select().single();
    if (error) { status('넘기기 실패: ' + A().friendly(error), true); return; }
    const del = await sb().from('used_stock').delete().eq('id', row.id);
    if (del.error) { status('판매 리스트에는 넣었지만 재고에서 빼지 못했어요. 재고 줄을 직접 지워 주세요: ' + A().friendly(del.error), true); }
    else data.stock.rows = data.stock.rows.filter(r => r !== row);
    const sale = Object.assign({}, payload, { id: ins.id, created_at: ins.created_at, _key: 'sr' + ins.id, _new: true });
    if (!data.sales.loaded) await load('sales');
    if (!data.sales.rows.some(r => r.id === sale.id)) data.sales.rows.push(sale);
    else data.sales.rows.find(r => r.id === sale.id)._new = true;
    period = today().slice(0, 7);
    await switchTab('sales', 'sr' + ins.id);
    if (!del.error) status('판매 리스트로 넘겼어요. 판매금액과 입금을 적어 주세요.');
  }

  /* ---------- 열기/닫기/탭 ---------- */
  async function switchTab(tab, focusKey) {
    cur = tab; store.set('gs-tab', tab);
    if (!D().loaded) { status('불러오는 중…'); if (!(await load(tab))) return; status(''); }
    render();
    const grid = $('gsGrid');
    const tr = focusKey && document.querySelector(`#gsGrid tr[data-key="${focusKey}"]`);
    if (tr) { tr.scrollIntoView({ block: 'center' }); const i = tr.querySelector('input[data-k="sale_price"]'); if (i) i.focus(); }
    else grid.scrollTop = grid.scrollHeight;   // 새로 적을 빈 줄이 보이게
  }
  async function open(tab) {
    build();
    $('gsSheet').hidden = false; $('gsBack').hidden = false; document.body.classList.add('ga-lock');
    status('불러오는 중…');
    Object.keys(data).forEach(k => { data[k].loaded = false; });
    await load('stock');                       // 재고 대수는 항상 탭에 표시
    await switchTab(tab || cur);
    if (!/실패|권한/.test($('gsStatus').textContent)) status(D().rows.length ? '' : '첫 줄에 바로 입력해 보세요');
  }
  function close() { $('gsSheet').hidden = true; $('gsBack').hidden = true; document.body.classList.remove('ga-lock'); }

  // 홈페이지 폰을 판매완료로 바꿨을 때: 판매 리스트에 한 줄 자동으로 추가
  async function addFromPhone(p) {
    await open('sales');
    if (!p) return;
    const st = data.sales;
    const row = st.blanks.find(r => isEmptyIn('sales', r)) || newBlank('sales');
    if (!st.blanks.includes(row)) st.blanks.push(row);
    Object.assign(row, { phone_id: p.id, arrived: p.arrived || null, sold_at: today(), model: p.model, color: p.color || null, storage: p.storage || null, grade: p.grade || null, sale_price: p.price ?? null, memo: p.id });
    render();
    await saveRow('sales', row, TABS.sales.fields);
    const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`);
    if (tr) { tr.scrollIntoView({ block: 'center' }); const d = tr.querySelector('input[data-k="deposit"]'); if (d) d.focus(); }
  }

  /* ---------- 엑셀(CSV) ---------- */
  function csv() {
    const list = counted(cur), cols = T().cols;
    if (!list.length) { status('내려받을 기록이 없어요', true); return; }
    const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [['NO'].concat(cols.map(c => c.t)).join(',')].concat(list.map(r => ['1'].concat(cols.map(c => (c.type === 'date' ? (r[c.k] || '') : c.type === 'calc' ? (marginOf(r) ?? '') : c.num && isPlainNumber(r[c.k]) ? toNum(r[c.k]) : r[c.k]))).map(cell).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${T().file}_${cur === 'sales' ? (period === 'all' ? '전체' : period) : today()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  window.GWSales = { open: () => open(), add: phone => addFromPhone(phone && phone._row ? phone._row : phone) };
})();
