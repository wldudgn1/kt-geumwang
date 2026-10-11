/* =========================================================
 * 판매 장부 (관리자 모드 전용)
 * - 관리자 막대의 "판매 장부" 버튼으로 열기
 * - 홈페이지에 올린 폰이든, 매장에서 바로 판 폰이든 판매 건으로 기록
 * - 기간별 판매 대수 · 판매금액 · 마진 · 미정산 집계, 모델별 집계, 엑셀(CSV) 내려받기
 * ========================================================= */
(function () {
  'use strict';
  const CFG = window.SITE_CONFIG;
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toNum = v => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; };
  const won = n => (n == null ? '-' : Number(n).toLocaleString('ko-KR') + '원');
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const PAY = { cash: '현금', transfer: '계좌이체' };
  const CH = { store: '매장 방문', online: '홈페이지 문의', delivery: '택배' };

  let sales = [];
  let period = today().slice(0, 7);   // 'YYYY-MM' 또는 'all'
  let draft = null;
  let editingId = null;
  let built = false;

  const A = () => window.GWAdmin;
  const sb = () => A().sb();

  function build() {
    if (built) return; built = true;
    const style = document.createElement('style');
    style.textContent = `
    #gsForm{z-index:160}
    .gs-period{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:14px 0 4px}
    .gs-period .ga-in{width:auto;height:40px;flex:1;min-width:140px}
    .gs-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}
    .gs-stat{background:#fff;border-radius:14px;padding:14px}
    .gs-stat span{display:block;font-size:13px;color:#6b7178;font-weight:600}
    .gs-stat b{display:block;margin-top:2px;font-size:22px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
    .gs-stat small{display:block;margin-top:2px;font-size:12px;color:#6b7178}
    .gs-stat.warn b{color:#E60012}
    .gs-table{width:100%;border-collapse:collapse;font-size:14.5px}
    .gs-table th{text-align:left;font-size:12.5px;color:#6b7178;font-weight:600;padding:6px 4px;border-bottom:1px solid #e3e5e8}
    .gs-table td{padding:9px 4px;border-bottom:1px solid #f0f1f3;font-variant-numeric:tabular-nums}
    .gs-table td.r,.gs-table th.r{text-align:right}
    .gs-mix{margin-top:10px;font-size:13.5px;color:#3b3f45;line-height:1.7}
    .gs-row{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:12px 0;border-bottom:1px solid #f0f1f3}
    .gs-row:last-child{border-bottom:0}
    .gs-row h4{margin:0;font-size:16px}
    .gs-row .gs-meta{font-size:13px;color:#6b7178}
    .gs-row .gs-price{text-align:right;font-weight:800;font-size:16px;font-variant-numeric:tabular-nums}
    .gs-row .gs-margin{text-align:right;font-size:12.5px;color:#0a7a35;font-weight:700}
    .gs-acts{grid-column:1/-1;display:flex;gap:6px;margin-top:4px}
    .gs-acts button{height:36px;padding:0 12px;border-radius:9px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
    .gs-acts .done{background:#e8f7ee;border-color:#e8f7ee;color:#0a7a35}
    .gs-acts .todo{background:#fff4d6;border-color:#fff4d6;color:#9a6400}
    .gs-tag{display:inline-block;padding:1px 7px;border-radius:6px;background:#f3f4f6;font-size:12px;font-weight:700;color:#3b3f45;margin-right:4px}
    .gs-empty{text-align:center;padding:36px 12px;color:#6b7178}
    .gs-margin-prev{margin-top:10px;padding:10px 12px;border-radius:10px;background:#e8f7ee;color:#0a7a35;font-weight:700;font-size:14px}
    .gs-margin-prev[hidden]{display:none}
    @media (min-width:760px){.gs-stats{grid-template-columns:repeat(4,1fr)}}
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
    <div class="ga-sheet" id="gsSheet" hidden>
      <div class="ga-top"><div class="ga-wrap"><h2>판매 장부</h2><button type="button" class="ga-btn" id="gsCsv" style="height:40px;font-size:14px">엑셀 받기</button><button type="button" class="ga-x" id="gsClose" aria-label="닫기">✕</button></div></div>
      <div class="ga-wrap">
        <div class="gs-period">
          <button type="button" class="ga-chip" data-p="this">이번 달</button>
          <button type="button" class="ga-chip" data-p="last">지난달</button>
          <button type="button" class="ga-chip" data-p="all">전체</button>
          <input class="ga-in" type="month" id="gsMonth" aria-label="월 선택">
        </div>
        <div class="gs-stats" id="gsStats"></div>
        <div class="ga-sec"><h3>모델별 판매</h3><div id="gsModels"></div><div class="gs-mix" id="gsMix"></div></div>
        <div class="ga-sec"><h3>판매 건 <small id="gsCount" style="font-weight:500;color:#6b7178"></small></h3><div id="gsList"></div></div>
        <div style="height:8px"></div>
      </div>
      <div class="ga-foot"><div class="ga-wrap"><button type="button" class="ga-btn ga-red" id="gsAdd">＋ 판매 기록 추가</button></div></div>
    </div>

    <div class="ga-sheet" id="gsForm" hidden>
      <div class="ga-top"><div class="ga-wrap"><h2 id="gsFormTitle">판매 기록 추가</h2><button type="button" class="ga-x" id="gsFormClose" aria-label="닫기">✕</button></div></div>
      <div class="ga-wrap">
        <div class="ga-sec">
          <h3><span class="ga-n">1</span>어떤 폰을 팔았나요?</h3>
          <label class="ga-f"><span>홈페이지에 올린 폰에서 선택 <small>매장에서 바로 판 폰이면 건너뛰세요</small></span>
            <select class="ga-in" id="gsPhone"></select></label>
          <label class="ga-f"><span>모델명</span><input class="ga-in" id="gsModel" list="gsModelList" placeholder="예: iPhone 15 Pro"></label>
          <datalist id="gsModelList"></datalist>
          <div class="ga-2">
            <label class="ga-f"><span>용량</span><input class="ga-in" id="gsStorage" placeholder="256GB"></label>
            <label class="ga-f"><span>색상</span><input class="ga-in" id="gsColor" placeholder="블랙"></label>
          </div>
          <div class="ga-f"><span>등급</span><div class="ga-seg" id="gsGrade"><button type="button" data-v="S">S</button><button type="button" data-v="A">A</button><button type="button" data-v="B">B</button><button type="button" data-v="C">C</button><button type="button" data-v="">모름</button></div></div>
        </div>
        <div class="ga-sec">
          <h3><span class="ga-n">2</span>금액</h3>
          <div class="ga-2">
            <label class="ga-f"><span>판매가</span><span class="ga-money"><input class="ga-in" id="gsPrice" inputmode="numeric" placeholder="0"></span></label>
            <label class="ga-f"><span>매입가 <small>선택</small></span><span class="ga-money"><input class="ga-in" id="gsCost" inputmode="numeric" placeholder="0"></span></label>
          </div>
          <div class="gs-margin-prev" id="gsMarginPrev" hidden></div>
          <div class="ga-f" style="margin-top:12px"><span>결제 방법</span><div class="ga-seg" id="gsPay"><button type="button" data-v="cash">현금</button><button type="button" data-v="transfer">계좌이체</button></div></div>
        </div>
        <div class="ga-sec">
          <h3><span class="ga-n">3</span>판매 정보</h3>
          <label class="ga-f"><span>판매일</span><input class="ga-in" id="gsDate" type="date"></label>
          <div class="ga-f"><span>판매 경로</span><div class="ga-seg" id="gsChannel"><button type="button" data-v="store">매장 방문</button><button type="button" data-v="online">홈페이지 문의</button><button type="button" data-v="delivery">택배</button></div></div>
          <label class="ga-check"><input type="checkbox" id="gsSettled">정산 완료</label>
          <label class="ga-f" style="margin-top:14px"><span>메모 <small>선택</small></span><textarea class="ga-in" id="gsMemo" placeholder="예: 케이스 서비스, 단골 손님"></textarea></label>
        </div>
        <div style="height:8px"></div>
      </div>
      <div class="ga-foot"><div class="ga-wrap"><button type="button" class="ga-btn ga-danger" id="gsDelete" hidden>삭제</button><button type="button" class="ga-btn ga-red" id="gsSave">판매 기록 저장</button></div></div>
    </div>`);

    $('gsClose').addEventListener('click', close);
    $('gsAdd').addEventListener('click', () => openForm(null));
    $('gsCsv').addEventListener('click', csv);
    $('gsFormClose').addEventListener('click', closeForm);
    $('gsSave').addEventListener('click', save);
    $('gsDelete').addEventListener('click', remove);
    document.querySelector('#gsSheet .gs-period').addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const now = new Date();
      if (b.dataset.p === 'all') period = 'all';
      else { const d = new Date(now.getFullYear(), now.getMonth() - (b.dataset.p === 'last' ? 1 : 0), 1); period = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
      render();
    });
    $('gsMonth').addEventListener('change', e => { if (e.target.value) { period = e.target.value; render(); } });
    $('gsList').addEventListener('click', async e => {
      const ed = e.target.closest('[data-edit]'), st = e.target.closest('[data-settle]');
      if (ed) openForm(sales.find(s => s.id === ed.dataset.edit));
      if (st) {
        const s = sales.find(x => x.id === st.dataset.settle); if (!s) return;
        const next = !s.settled;
        const { error } = await sb().from('used_sales').update({ settled: next, settled_at: next ? today() : null }).eq('id', s.id);
        if (error) { A().toast(A().friendly(error)); return; }
        s.settled = next; s.settled_at = next ? today() : null; render();
        A().toast(next ? '정산 완료로 표시했어요.' : '미정산으로 되돌렸어요.');
      }
    });
    ['gsGrade', 'gsPay', 'gsChannel'].forEach(id => $(id).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      draft[{ gsGrade: 'grade', gsPay: 'payment', gsChannel: 'channel' }[id]] = b.dataset.v; paintSegs();
    }));
    ['gsPrice', 'gsCost'].forEach(id => $(id).addEventListener('input', e => { const n = toNum(e.target.value); e.target.value = n == null ? '' : n.toLocaleString('ko-KR'); paintMargin(); }));
    $('gsPhone').addEventListener('change', e => {
      const p = window.GW.get(e.target.value);
      draft.phone_id = p ? p.id : null;
      if (!p) return;
      $('gsModel').value = p.model; $('gsStorage').value = p.storage || ''; $('gsColor').value = p.color || '';
      $('gsPrice').value = p.price != null ? p.price.toLocaleString('ko-KR') : '';
      draft.grade = p.grade || ''; paintSegs(); paintMargin();
    });
  }

  /* ---------- 불러오기 ---------- */
  async function load() {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb().from('used_sales').select('*').order('sold_at', { ascending: false }).order('created_at', { ascending: false }).range(from, from + 999);
      if (error) { A().toast(A().friendly(error)); break; }
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    sales = all;
  }

  function inPeriod() { return period === 'all' ? sales : sales.filter(s => String(s.sold_at).slice(0, 7) === period); }

  function render() {
    const list = inPeriod();
    const now = new Date();
    const thisYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const l = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYm = l.getFullYear() + '-' + String(l.getMonth() + 1).padStart(2, '0');
    document.querySelectorAll('#gsSheet [data-p]').forEach(b => b.classList.toggle('on', (b.dataset.p === 'all' && period === 'all') || (b.dataset.p === 'this' && period === thisYm) || (b.dataset.p === 'last' && period === lastYm)));
    $('gsMonth').value = period === 'all' ? '' : period;

    const total = list.reduce((a, s) => a + (s.sale_price || 0), 0);
    const withCost = list.filter(s => s.cost != null);
    const margin = withCost.reduce((a, s) => a + (s.sale_price - s.cost), 0);
    const unsettled = list.filter(s => !s.settled);
    const unsettledSum = unsettled.reduce((a, s) => a + (s.sale_price || 0), 0);
    $('gsStats').innerHTML = `
      <div class="gs-stat"><span>판매 대수</span><b>${list.length}대</b></div>
      <div class="gs-stat"><span>판매금액</span><b>${won(total)}</b></div>
      <div class="gs-stat"><span>마진 (판매가 − 매입가)</span><b>${withCost.length ? won(margin) : '-'}</b><small>${withCost.length === list.length ? '전체 건 기준' : `매입가 입력한 ${withCost.length}건 기준 · 미입력 ${list.length - withCost.length}건`}</small></div>
      <div class="gs-stat ${unsettled.length ? 'warn' : ''}"><span>미정산</span><b>${unsettled.length}건</b><small>${won(unsettledSum)}</small></div>`;

    const by = {};
    list.forEach(s => { const k = s.model || '(모델명 없음)'; (by[k] = by[k] || { n: 0, sum: 0 }); by[k].n++; by[k].sum += s.sale_price || 0; });
    const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n || b[1].sum - a[1].sum);
    $('gsModels').innerHTML = rows.length ? `<table class="gs-table"><thead><tr><th>모델</th><th class="r">대수</th><th class="r">금액</th></tr></thead><tbody>${rows.map(([m, v]) => `<tr><td>${esc(m)}</td><td class="r">${v.n}대</td><td class="r">${won(v.sum)}</td></tr>`).join('')}</tbody></table>` : '<div class="gs-empty">이 기간에 판매 기록이 없어요.</div>';
    const cnt = (key, map) => Object.keys(map).map(k => { const f = list.filter(s => s[key] === k); return f.length ? `${map[k]} ${f.length}대 (${won(f.reduce((a, s) => a + s.sale_price, 0))})` : null; }).filter(Boolean).join(' · ');
    $('gsMix').innerHTML = list.length ? `<b>결제</b> ${esc(cnt('payment', PAY))}<br><b>경로</b> ${esc(cnt('channel', CH))}` : '';

    $('gsCount').textContent = list.length ? list.length + '건' : '';
    $('gsList').innerHTML = list.length ? list.map(s => `
      <div class="gs-row">
        <div>
          <h4>${esc(s.model)}</h4>
          <div class="gs-meta">${esc(s.sold_at)} · ${esc([s.storage, s.color, s.grade ? s.grade + '등급' : ''].filter(Boolean).join(' · '))}</div>
          <div class="gs-meta" style="margin-top:4px"><span class="gs-tag">${PAY[s.payment] || ''}</span><span class="gs-tag">${CH[s.channel] || ''}</span>${s.phone_id ? `<span class="gs-tag">${esc(s.phone_id)}</span>` : ''}${s.memo ? esc(s.memo) : ''}</div>
        </div>
        <div><div class="gs-price">${won(s.sale_price)}</div>${s.cost != null ? `<div class="gs-margin">마진 ${won(s.sale_price - s.cost)}</div>` : ''}</div>
        <div class="gs-acts"><button type="button" class="${s.settled ? 'done' : 'todo'}" data-settle="${s.id}">${s.settled ? '✓ 정산 완료' : '미정산 · 눌러서 완료'}</button><button type="button" data-edit="${s.id}">수정</button></div>
      </div>`).join('') : '<div class="gs-empty">아래 <b>＋ 판매 기록 추가</b>로 첫 판매를 기록해 보세요.</div>';
  }

  /* ---------- 열기/닫기 ---------- */
  async function open() {
    build();
    $('gsSheet').hidden = false; $('gsSheet').scrollTop = 0; document.body.classList.add('ga-lock');
    $('gsStats').innerHTML = '<div class="gs-stat"><span>불러오는 중…</span><b>&nbsp;</b></div>';
    await load(); render();
  }
  function close() { $('gsSheet').hidden = true; if ($('gsForm').hidden) document.body.classList.remove('ga-lock'); }

  /* ---------- 입력 폼 ---------- */
  function paintSegs() {
    const set = (id, v) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === (v || '')));
    set('gsGrade', draft.grade); set('gsPay', draft.payment); set('gsChannel', draft.channel);
  }
  function paintMargin() {
    const p = toNum($('gsPrice').value), c = toNum($('gsCost').value), el = $('gsMarginPrev');
    if (p != null && c != null) { el.hidden = false; el.textContent = '마진 ' + won(p - c); } else el.hidden = true;
  }
  function openForm(sale, fromPhone) {
    build();
    editingId = sale ? sale.id : null;
    draft = sale ? Object.assign({}, sale) : { sold_at: today(), phone_id: null, model: '', storage: '', color: '', grade: '', sale_price: null, cost: null, payment: 'cash', channel: 'store', settled: false, memo: '' };
    if (fromPhone) Object.assign(draft, { phone_id: fromPhone.id, model: fromPhone.model, storage: fromPhone.storage || '', color: fromPhone.color || '', grade: fromPhone.grade || '', sale_price: fromPhone.price });
    const phones = window.GW.all();
    $('gsPhone').innerHTML = '<option value="">선택 안 함 (매장에서 바로 판매)</option>' + phones.map(p => `<option value="${esc(p.id)}">${esc(p.id)} · ${esc(p.model)} ${esc(p.storage || '')} · ${won(p.price)}${p.status === 'sold' ? ' (판매완료)' : ''}</option>`).join('');
    $('gsPhone').value = draft.phone_id && phones.some(p => p.id === draft.phone_id) ? draft.phone_id : '';
    const names = Array.from(new Set(phones.map(p => p.model).concat(sales.map(s => s.model)).filter(Boolean)));
    $('gsModelList').innerHTML = names.map(m => `<option value="${esc(m)}">`).join('');
    $('gsModel').value = draft.model || ''; $('gsStorage').value = draft.storage || ''; $('gsColor').value = draft.color || '';
    $('gsPrice').value = draft.sale_price != null ? draft.sale_price.toLocaleString('ko-KR') : '';
    $('gsCost').value = draft.cost != null ? draft.cost.toLocaleString('ko-KR') : '';
    $('gsDate').value = draft.sold_at || today(); $('gsSettled').checked = !!draft.settled; $('gsMemo').value = draft.memo || '';
    $('gsFormTitle').textContent = sale ? '판매 기록 수정' : '판매 기록 추가';
    $('gsDelete').hidden = !sale;
    paintSegs(); paintMargin();
    $('gsForm').hidden = false; $('gsForm').scrollTop = 0; document.body.classList.add('ga-lock');
  }
  function closeForm() { $('gsForm').hidden = true; draft = null; if ($('gsSheet').hidden) document.body.classList.remove('ga-lock'); }

  async function save() {
    const settled = $('gsSettled').checked;
    const row = {
      sold_at: $('gsDate').value || today(), phone_id: draft.phone_id || null,
      model: $('gsModel').value.trim(), storage: $('gsStorage').value.trim() || null, color: $('gsColor').value.trim() || null,
      grade: draft.grade || null, sale_price: toNum($('gsPrice').value), cost: toNum($('gsCost').value),
      payment: draft.payment, channel: draft.channel, settled,
      settled_at: settled ? (draft.settled && draft.settled_at ? draft.settled_at : today()) : null,
      memo: $('gsMemo').value.trim() || null,
    };
    if (!row.model) { A().toast('모델명을 입력해 주세요.'); $('gsModel').focus(); return; }
    if (row.sale_price == null) { A().toast('판매가를 입력해 주세요.'); $('gsPrice').focus(); return; }
    $('gsSave').disabled = true;
    const q = editingId ? sb().from('used_sales').update(row).eq('id', editingId) : sb().from('used_sales').insert(row);
    const { error } = await q;
    $('gsSave').disabled = false;
    if (error) { A().toast('저장 실패: ' + A().friendly(error)); return; }
    // 홈페이지에 올린 폰이면 판매완료로 맞춰 주기
    let extra = '';
    const p = row.phone_id && window.GW.get(row.phone_id);
    if (p && p.status !== 'sold') {
      const r = await sb().from('used_phones').update({ status: 'sold' }).eq('id', p.id);
      if (!r.error) { window.GW.setStatus(p.id, 'sold'); extra = ' 홈페이지에서도 판매완료로 바꿨어요.'; }
    }
    A().toast((editingId ? '판매 기록을 수정했어요.' : '판매 기록을 저장했어요.') + extra);
    closeForm();
    await load();
    if (!$('gsSheet').hidden) render();
  }

  async function remove() {
    if (!editingId) return;
    if (!(await A().ask('이 판매 기록을 지울까요? 집계에서도 빠져요.'))) return;
    const { error } = await sb().from('used_sales').delete().eq('id', editingId);
    if (error) { A().toast('삭제 실패: ' + A().friendly(error)); return; }
    A().toast('삭제했어요.'); closeForm(); await load(); if (!$('gsSheet').hidden) render();
  }

  /* ---------- 엑셀(CSV) ---------- */
  function csv() {
    const list = inPeriod();
    if (!list.length) { A().toast('내려받을 판매 기록이 없어요.'); return; }
    const head = ['판매일', '상품번호', '모델', '용량', '색상', '등급', '판매가', '매입가', '마진', '결제', '경로', '정산', '정산일', '메모'];
    const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [head.join(',')].concat(list.map(s => [s.sold_at, s.phone_id, s.model, s.storage, s.color, s.grade, s.sale_price, s.cost, s.cost != null ? s.sale_price - s.cost : '', PAY[s.payment], CH[s.channel], s.settled ? '완료' : '미정산', s.settled_at, s.memo].map(cell).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `KT금왕점_중고폰판매_${period === 'all' ? '전체' : period}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  window.GWSales = { open, add: phone => openForm(null, phone && phone._row ? phone._row : phone) };
})();
