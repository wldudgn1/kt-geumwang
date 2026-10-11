/* =========================================================
 * 판매 장부 (관리자 모드 전용) — 구글시트처럼 칸에 바로 입력
 * - 열 순서는 기존 "중고폰 판매 리스트" 시트와 같음 (마지막에 매입가만 추가)
 * - 칸을 고치고 다른 칸으로 넘어가면 자동 저장, Enter = 아래 칸
 * - 구글시트에서 복사한 여러 줄을 그대로 붙여넣기 가능
 * ========================================================= */
(function () {
  'use strict';
  const CFG = window.SITE_CONFIG;
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;

  const COLS = [
    { k: 'arrived', t: '입고일', type: 'date', w: 82 },
    { k: 'sold_at', t: '판매일', type: 'date', w: 82 },
    { k: 'model', t: '모델명', w: 124, list: 'gsModelList' },
    { k: 'color', t: '색상', w: 78 },
    { k: 'storage', t: '용량', w: 70 },
    { k: 'imei', t: 'IMEI', w: 150 },
    { k: 'grade', t: '등급', w: 50, center: true },
    { k: 'ref_price', t: '단가표상 A급', w: 118, tone: 'green' },
    { k: 'sale_price', t: '판매금액', type: 'money', w: 100 },
    { k: 'margin', t: '마진', type: 'calc', w: 94, tone: 'green' },
    { k: 'channel', t: '판매채널', w: 92, tone: 'pink', center: true },
    { k: 'memo', t: '기타', w: 118, center: true },
    { k: 'deposit', t: '입금', w: 82, list: 'gsDepositList', center: true },
    { k: 'cost', t: '매입가', type: 'money', w: 100 },
  ];
  const FIELDS = COLS.filter(c => c.type !== 'calc').map(c => c.k);
  const BLANK_ROWS = 8;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toNum = v => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; };
  const comma = n => (n == null ? '' : Number(n).toLocaleString('ko-KR'));
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

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

  function parseCell(col, text) {
    const s = String(text ?? '').trim();
    if (col.type === 'date') return parseDate(s);
    if (col.type === 'money') return toNum(s);
    return s || null;
  }
  function showCell(col, row) {
    if (col.type === 'calc') return row.sale_price != null && row.cost != null ? comma(row.sale_price - row.cost) : '';
    const v = row[col.k];
    if (col.type === 'date') return fmtDate(v);
    if (col.type === 'money') return comma(v);
    return v ?? '';
  }

  let sales = [];                       // 저장된 행 (DB)
  let blanks = [];                      // 아직 저장 안 된 빈 행
  let period = today().slice(0, 7);     // 'YYYY-MM' 또는 'all'
  let built = false;
  let uid = 0;
  let pending = 0;

  const A = () => window.GWAdmin;
  const sb = () => A().sb();
  const isEmpty = r => FIELDS.every(k => r[k] == null || r[k] === '');
  const newBlank = () => ({ _key: 'n' + (++uid), _new: true });

  function build() {
    if (built) return; built = true;
    const style = document.createElement('style');
    style.textContent = `
    #gsSheet{display:flex;flex-direction:column;overflow:hidden;background:#fff}
    .gs-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e3e5e8;flex-wrap:wrap;padding-top:calc(10px + env(safe-area-inset-top,0px))}
    .gs-head h2{margin:0 8px 0 0;font-size:18px}
    .gs-head .ga-chip{height:34px;padding:0 12px;font-size:13.5px}
    .gs-head input[type=month]{height:34px;border:1px solid #e3e5e8;border-radius:8px;padding:0 8px;font:inherit;font-size:13.5px}
    .gs-status{font-size:12.5px;color:#6b7178;margin-left:auto;white-space:nowrap}
    .gs-status.err{color:#E60012;font-weight:700}
    .gs-hbtn{height:34px;padding:0 12px;border-radius:8px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
    .gs-sum{display:flex;gap:0;border-bottom:1px solid #e3e5e8;overflow-x:auto;background:#fafafa}
    .gs-sum div{padding:8px 16px;border-right:1px solid #e3e5e8;white-space:nowrap}
    .gs-sum span{display:block;font-size:12px;color:#6b7178;font-weight:600}
    .gs-sum b{font-size:18px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
    .gs-sum .warn b{color:#E60012}
    .gs-grid{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#f3f4f6}
    .gs-t{border-collapse:separate;border-spacing:0;font-size:13.5px;background:#fff;table-layout:fixed}
    .gs-t th{position:sticky;top:0;z-index:3;background:#ffeb3b;border:1px solid #c9b800;border-left:0;padding:7px 4px;font-weight:800;font-size:13px;white-space:nowrap}
    .gs-t th.no,.gs-t td.no{position:sticky;left:0;z-index:2;width:38px;min-width:38px;background:#f3f4f6;color:#6b7178;text-align:center;font-size:12px;border-right:1px solid #c9ccd1}
    .gs-t th.no{z-index:4;background:#e9eaec;border-color:#c9ccd1}
    .gs-t td{border-bottom:1px solid #e3e5e8;border-right:1px solid #e3e5e8;padding:0;height:32px}
    .gs-t td.green{background:#e3f1df}.gs-t td.pink{background:#f6dce4}
    .gs-t td.wait{background:#fff4d6}
    .gs-t td input{width:100%;height:32px;border:0;background:transparent;padding:0 7px;font:inherit;font-size:13.5px;color:#111214;outline:0;font-variant-numeric:tabular-nums}
    .gs-t td input.c{text-align:center}.gs-t td input.r{text-align:right}
    .gs-t td input:focus{box-shadow:inset 0 0 0 2px #1a73e8;background:#fff}
    .gs-t td input[readonly]{color:#0a7a35;font-weight:700;cursor:default}
    .gs-t td input.bad{box-shadow:inset 0 0 0 2px #E60012}
    .gs-t td.del{width:34px;min-width:34px;text-align:center;border-right:0}
    .gs-t td.del button{width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:#9aa0a6;cursor:pointer;font-size:13px}
    .gs-t td.del button:hover{background:#fdecee;color:#E60012}
    .gs-foot{border-top:1px solid #e3e5e8;padding:8px 14px calc(8px + env(safe-area-inset-bottom,0px));font-size:12.5px;color:#6b7178;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
    .gs-foot details{flex-basis:100%}
    .gs-foot summary{cursor:pointer;font-weight:700;color:#3b3f45}
    .gs-models{margin-top:6px;max-height:160px;overflow:auto;display:flex;flex-wrap:wrap;gap:6px}
    .gs-models span{padding:4px 10px;border-radius:999px;background:#f3f4f6;color:#111214;font-weight:600}
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
    <div class="ga-sheet" id="gsSheet" hidden>
      <div class="gs-head">
        <h2>중고폰 판매 리스트</h2>
        <button type="button" class="ga-chip" data-p="this">이번 달</button>
        <button type="button" class="ga-chip" data-p="last">지난달</button>
        <button type="button" class="ga-chip" data-p="all">전체</button>
        <input type="month" id="gsMonth" aria-label="월 선택">
        <span class="gs-status" id="gsStatus"></span>
        <button type="button" class="gs-hbtn" id="gsCsv">엑셀 받기</button>
        <button type="button" class="ga-x" id="gsClose" aria-label="닫기">✕</button>
      </div>
      <div class="gs-sum" id="gsSum"></div>
      <div class="gs-grid" id="gsGrid"></div>
      <div class="gs-foot">
        <span>칸을 고치고 다른 칸으로 넘어가면 자동 저장돼요 · Enter = 아래 칸 · 구글시트에서 복사한 줄을 그대로 붙여넣을 수 있어요 · 날짜는 10.1 처럼 쳐도 돼요</span>
        <details><summary>모델별 집계 보기</summary><div class="gs-models" id="gsModels"></div></details>
      </div>
      <datalist id="gsModelList"></datalist>
      <datalist id="gsDepositList"><option value="입금전"><option value="신한"><option value="카뱅"><option value="현금"></datalist>
    </div>`);

    $('gsClose').addEventListener('click', close);
    $('gsCsv').addEventListener('click', csv);
    document.querySelector('#gsSheet .gs-head').addEventListener('click', e => {
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
    grid.addEventListener('click', e => { const d = e.target.closest('[data-del]'); if (d) removeRow(d.dataset.del); });
  }

  /* ---------- 데이터 ---------- */
  async function load() {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb().from('used_sales').select('*').order('sold_at', { ascending: true }).order('created_at', { ascending: true }).range(from, from + 999);
      if (error) { status(A().friendly(error), true); break; }
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    sales = all.map(r => Object.assign(r, { _key: 'r' + r.id }));
  }
  function visible() {
    const saved = sales.filter(r => r._new || period === 'all' || !r.sold_at || String(r.sold_at).slice(0, 7) === period);
    return saved.concat(blanks);
  }
  function rowByKey(key) { return sales.find(r => r._key === key) || blanks.find(r => r._key === key); }

  function status(text, err) { const s = $('gsStatus'); s.textContent = text; s.className = 'gs-status' + (err ? ' err' : ''); }
  function saved() { if (pending === 0) { const d = new Date(); status('저장됨 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())); } }

  // 행 단위로 순서대로 저장 (새 행은 첫 저장 때 생성)
  function saveRow(row, keys) {
    pending++; status('저장 중…');
    row._q = (row._q || Promise.resolve()).then(async () => {
      if (!row.id) {
        if (isEmpty(row)) return;
        if (!row.sold_at) { row.sold_at = today(); paintCell(row, 'sold_at'); }
        const payload = {}; FIELDS.forEach(k => { payload[k] = row[k] ?? null; });
        if (row.phone_id) payload.phone_id = row.phone_id;
        const { data, error } = await sb().from('used_sales').insert(payload).select().single();
        if (error) throw error;
        row.id = data.id; row.created_at = data.created_at;
        blanks = blanks.filter(b => b !== row); sales.push(row);
        const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`);
        if (tr) { const del = tr.querySelector('td.del'); if (del) del.innerHTML = `<button type="button" data-del="${row._key}" aria-label="줄 삭제">✕</button>`; }
        topUpBlanks();
      } else {
        const patch = {}; keys.forEach(k => { patch[k] = row[k] ?? null; });
        const { error } = await sb().from('used_sales').update(patch).eq('id', row.id);
        if (error) throw error;
      }
    }).then(() => { pending--; saved(); summary(); }, err => { pending--; status('저장 실패: ' + A().friendly(err), true); });
    return row._q;
  }

  /* ---------- 화면 ---------- */
  function cellHtml(row, col) {
    const cls = [col.type === 'money' || col.type === 'calc' ? 'r' : col.center || col.type === 'date' ? 'c' : ''].join(' ');
    const tdCls = [col.tone || '', col.k === 'deposit' && /입금전/.test(row.deposit || '') ? 'wait' : ''].join(' ').trim();
    return `<td class="${tdCls}"><input data-k="${col.k}" class="${cls}" value="${esc(showCell(col, row))}" ${col.type === 'calc' ? 'readonly tabindex="-1"' : ''} ${col.list ? `list="${col.list}"` : ''} ${col.type === 'money' ? 'inputmode="numeric"' : ''} autocomplete="off" aria-label="${esc(col.t)}"></td>`;
  }
  function rowHtml(row, i) {
    return `<tr data-key="${row._key}"><td class="no">${i + 1}</td>${COLS.map(c => cellHtml(row, c)).join('')}<td class="del">${row.id ? `<button type="button" data-del="${row._key}" aria-label="줄 삭제">✕</button>` : ''}</td></tr>`;
  }
  function render(keepScroll) {
    const grid = $('gsGrid'); const top = grid.scrollTop;
    while (blanks.length < BLANK_ROWS) blanks.push(newBlank());
    const rows = visible();
    grid.innerHTML = `<table class="gs-t" style="width:${38 + 34 + COLS.reduce((a, c) => a + c.w, 0)}px"><colgroup><col style="width:38px">${COLS.map(c => `<col style="width:${c.w}px">`).join('')}<col style="width:34px"></colgroup>
      <thead><tr><th class="no">NO</th>${COLS.map(c => `<th>${c.t}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rows.map(rowHtml).join('')}</tbody></table>`;
    if (keepScroll) grid.scrollTop = top;
    const now = new Date(), l = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYm = now.getFullYear() + '-' + pad(now.getMonth() + 1), lastYm = l.getFullYear() + '-' + pad(l.getMonth() + 1);
    document.querySelectorAll('#gsSheet [data-p]').forEach(b => b.classList.toggle('on', (b.dataset.p === 'all' && period === 'all') || (b.dataset.p === 'this' && period === thisYm) || (b.dataset.p === 'last' && period === lastYm)));
    $('gsMonth').value = period === 'all' ? '' : period;
    summary();
  }
  function topUpBlanks() {
    const body = document.querySelector('#gsGrid tbody'); if (!body) return;
    while (blanks.length < BLANK_ROWS) {
      const b = newBlank(); blanks.push(b);
      body.insertAdjacentHTML('beforeend', rowHtml(b, body.children.length));
    }
  }
  function paintCell(row, k) {
    const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`); if (!tr) return;
    const col = COLS.find(c => c.k === k), inp = tr.querySelector(`input[data-k="${k}"]`);
    if (inp && document.activeElement !== inp) inp.value = showCell(col, row);
    if (k === 'deposit' && inp) inp.parentElement.classList.toggle('wait', /입금전/.test(row.deposit || ''));
    const m = tr.querySelector('input[data-k="margin"]'); if (m) m.value = showCell(COLS.find(c => c.k === 'margin'), row);
  }
  function summary() {
    const list = sales.filter(r => (period === 'all' || !r.sold_at || String(r.sold_at).slice(0, 7) === period) && !isEmpty(r));
    const sum = k => list.reduce((a, r) => a + (r[k] || 0), 0);
    const wait = list.filter(r => /입금전/.test(r.deposit || ''));
    $('gsSum').innerHTML = `
      <div><span>판매댓수</span><b>${list.length}</b></div>
      <div><span>매입합산</span><b>${comma(sum('cost'))}</b></div>
      <div><span>매출</span><b>${comma(sum('sale_price'))}</b></div>
      <div><span>마진</span><b>${comma(sum('sale_price') - sum('cost'))}</b></div>
      <div class="${wait.length ? 'warn' : ''}"><span>입금전</span><b>${wait.length}건 · ${comma(wait.reduce((a, r) => a + (r.sale_price || 0), 0))}</b></div>`;
    const by = {};
    list.forEach(r => { const k = r.model || '(모델명 없음)'; by[k] = by[k] || { n: 0, s: 0 }; by[k].n++; by[k].s += r.sale_price || 0; });
    $('gsModels').innerHTML = Object.entries(by).sort((a, b) => b[1].n - a[1].n || b[1].s - a[1].s).map(([m, v]) => `<span>${esc(m)} ${v.n}대 · ${comma(v.s)}</span>`).join('') || '이 기간에 판매 기록이 없어요.';
    const names = Array.from(new Set(sales.map(r => r.model).concat((window.GW ? window.GW.all() : []).map(p => p.model)).filter(Boolean)));
    $('gsModelList').innerHTML = names.map(m => `<option value="${esc(m)}">`).join('');
  }

  /* ---------- 입력 ---------- */
  function onEdit(inp) {
    const tr = inp.closest('tr'), row = rowByKey(tr.dataset.key); if (!row) return;
    const col = COLS.find(c => c.k === inp.dataset.k);
    const v = parseCell(col, inp.value);
    const bad = (col.type === 'date' || col.type === 'money') && inp.value.trim() !== '' && v == null;
    inp.classList.toggle('bad', bad);
    if (bad) { status(col.t + ' 칸을 다시 확인해 주세요 (예: ' + (col.type === 'date' ? '26.10.01 또는 10.1' : '610000') + ')', true); return; }
    row[col.k] = v;
    inp.value = showCell(col, row);
    paintCell(row, col.k);
    saveRow(row, [col.k]);
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
    let lines = text.replace(/\r/g, '').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
    let table = lines.map(l => l.split('\t'));
    let startCol = COLS.findIndex(c => c.k === inp.dataset.k);
    // 시트의 맨 앞 NO 열까지 같이 복사해 온 경우 건너뛰기
    if (startCol === 0 && table.every(r => /^\d{0,3}$/.test((r[0] || '').trim()) && r.length > 1 && (parseDate(r[1]) || (r[1] || '').trim() === ''))) table = table.map(r => r.slice(1));
    const rows = visible();
    let ri = rows.findIndex(r => r._key === inp.closest('tr').dataset.key);
    const touched = [];
    table.forEach(cells => {
      if (cells.every(c => c.trim() === '')) { ri++; return; }
      while (ri >= rows.length) { const b = newBlank(); blanks.push(b); rows.push(b); }
      const row = rows[ri++], keys = [];
      cells.forEach((c, j) => {
        const col = COLS[startCol + j]; if (!col || col.type === 'calc') return;
        const v = parseCell(col, c);
        if ((col.type === 'date' || col.type === 'money') && c.trim() !== '' && v == null) return;
        row[col.k] = v; keys.push(col.k);
      });
      if (keys.length) touched.push([row, keys]);
    });
    render(true);
    touched.forEach(([row, keys]) => saveRow(row, keys));
    status(touched.length + '줄 붙여넣는 중…');
  }
  async function removeRow(key) {
    const row = rowByKey(key); if (!row || !row.id) return;
    if (!(await A().ask(`${row.model || '이'} 줄을 지울까요? 집계에서도 빠져요.`))) return;
    const { error } = await sb().from('used_sales').delete().eq('id', row.id);
    if (error) { status('삭제 실패: ' + A().friendly(error), true); return; }
    sales = sales.filter(r => r !== row); render(true); status('삭제했어요');
  }

  /* ---------- 열기/닫기 ---------- */
  async function open() {
    build();
    $('gsSheet').hidden = false; document.body.classList.add('ga-lock');
    status('불러오는 중…');
    await load(); render();
    status(sales.length ? '' : '첫 줄에 바로 입력해 보세요');
    const grid = $('gsGrid'); grid.scrollTop = grid.scrollHeight;   // 새로 적을 빈 줄이 보이게
  }
  function close() { $('gsSheet').hidden = true; document.body.classList.remove('ga-lock'); }

  // 홈페이지 폰을 판매완료로 바꿨을 때: 장부에 한 줄 자동으로 추가
  async function addFromPhone(p) {
    await open();
    if (!p) return;
    const row = blanks.find(isEmpty) || newBlank();
    if (!blanks.includes(row)) blanks.push(row);
    Object.assign(row, { phone_id: p.id, arrived: p.arrived || null, sold_at: today(), model: p.model, color: p.color || null, storage: p.storage || null, grade: p.grade || null, sale_price: p.price ?? null, memo: p.id });
    render();
    await saveRow(row, FIELDS);
    const tr = document.querySelector(`#gsGrid tr[data-key="${row._key}"]`);
    if (tr) { tr.scrollIntoView({ block: 'center' }); const d = tr.querySelector('input[data-k="deposit"]'); if (d) d.focus(); }
  }

  /* ---------- 엑셀(CSV) ---------- */
  function csv() {
    const list = sales.filter(r => (period === 'all' || !r.sold_at || String(r.sold_at).slice(0, 7) === period) && !isEmpty(r));
    if (!list.length) { status('내려받을 판매 기록이 없어요', true); return; }
    const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [['NO'].concat(COLS.map(c => c.t)).join(',')].concat(list.map(r => ['1'].concat(COLS.map(c => (c.type === 'date' ? fmtDate(r[c.k]) : c.type === 'calc' ? (r.sale_price != null && r.cost != null ? r.sale_price - r.cost : '') : r[c.k]))).map(cell).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `중고폰_판매_리스트_${period === 'all' ? '전체' : period}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  window.GWSales = { open, add: phone => addFromPhone(phone && phone._row ? phone._row : phone), _parseDate: parseDate };
})();
