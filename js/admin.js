/* =========================================================
 * 홈페이지 안의 관리자 모드
 * - 맨 아래 "관리자" 버튼(또는 주소 끝 #admin)으로 로그인
 * - 로그인하면 같은 화면에서 새 폰 등록 / 수정 / 판매 상태 변경
 * - 손님 화면에는 영향 없음 (Supabase 라이브러리도 로그인할 때만 불러옴)
 * ========================================================= */
(function () {
  'use strict';
  const CFG = window.SITE_CONFIG;
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;

  const BUCKET = 'used-phones';
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const SESSION_KEY = 'sb-' + new URL(CFG.supabaseUrl).hostname.split('.')[0] + '-auth-token';
  // 로그인 아이디 → 실제 계정 이메일 (아이디만 입력해도 로그인되게)
  const LOGIN_IDS = CFG.loginIds || {};

  const MODELS = {
    apple: ['iPhone 18 Pro Max', 'iPhone 18 Pro', 'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17', 'iPhone 17e', 'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini', 'iPhone 12 Pro', 'iPhone 12', 'iPhone SE (3rd)'],
    samsung: ['Galaxy S26 Ultra', 'Galaxy S26+', 'Galaxy S26', 'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S25 Edge', 'Galaxy S25 FE', 'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy Z Fold8', 'Galaxy Z Flip8', 'Galaxy Z Fold7', 'Galaxy Z Flip7', 'Galaxy Z Fold6', 'Galaxy Z Flip6', 'Galaxy Z Fold5', 'Galaxy Z Flip5', 'Galaxy A56', 'Galaxy A36', 'Galaxy A35', 'Galaxy A25', 'Galaxy A16', 'Galaxy Jump5', 'Galaxy Quantum5'],
    etc: [],
  };
  const STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB'];
  const INCLUDES = ['본체', '충전기', 'C타입 케이블', '정품 박스', 'S펜', '케이스', '필름 부착'];
  const SWATCHES = ['#1d1d1f', '#f5f5f0', '#c8c8cc', '#bfa48a', '#e07a3f', '#f2c9d0', '#bde3d3', '#7e8fa6', '#2e3a55', '#6c5b9e', '#a3c4e8', '#c9b037', '#9b2335'];
  const GRADES = { S: ['최상', '사용감 거의 없음'], A: ['상', '미세한 생활기스'], B: ['중', '눈에 띄는 기스·찍힘 일부'], C: ['하', '사용감 많음, 기능 정상'] };
  const STATUS = { sale: '판매중', reserved: '예약중', sold: '판매완료' };

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toNum = v => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; };

  let sb = null;
  let draft = null;
  let editingId = null;
  let uploading = 0;

  /* ---------- 화면 조각 넣기 ---------- */
  const css = `
  .ga-bar{position:sticky;top:0;z-index:70;background:#E60012;color:#fff;padding-top:env(safe-area-inset-top,0px)}
  .ga-bar-in{display:flex;align-items:center;gap:8px;min-height:50px;flex-wrap:wrap;padding-block:6px}
  .ga-bar b{margin-right:auto;font-size:15px}
  .ga-bar button{height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;font-weight:700;font-size:14px}
  .ga-bar .ga-add{background:#fff;color:#E60012;border-color:#fff}
  body.is-admin .header{top:50px}
  body.is-admin .mobile-bar{display:none}
  .card-admin-wrap{display:flex;flex-direction:column;gap:6px;min-width:0}
  .card-admin-wrap .card{flex:1}
  .card-admin{display:flex;flex-direction:column;gap:6px;background:#fff;border-radius:14px;padding:8px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .ca-seg{display:flex;gap:3px;background:#f3f4f6;border-radius:10px;padding:3px}
  .ca-seg button{flex:1;height:34px;border:0;border-radius:8px;background:transparent;font-size:12.5px;font-weight:700;color:#6b7178;white-space:nowrap;padding:0 2px}
  .ca-seg button.on[data-status=sale]{background:#e8f7ee;color:#0a7a35}
  .ca-seg button.on[data-status=reserved]{background:#fff4d6;color:#9a6400}
  .ca-seg button.on[data-status=sold]{background:#dfe1e4;color:#3b3f45}
  .ca-edit{height:38px;border-radius:10px;border:1px solid #111214;background:#111214;color:#fff;font-weight:700;font-size:14px}
  .admin-link{background:none;border:0;padding:0;color:#7d828a;font-size:13px;text-decoration:underline;cursor:pointer}
  .ga-modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;background:rgba(10,11,13,.55)}
  .ga-login{width:100%;max-width:360px;background:#fff;border-radius:20px;padding:26px 22px;color:#111214}
  .ga-login h2{margin:0 0 4px;font-size:21px}
  .ga-login p{margin:0 0 18px;color:#6b7178;font-size:14px}
  .ga-f{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
  .ga-f>span{font-size:14px;font-weight:700;color:#3b3f45}
  .ga-f small{font-weight:500;color:#6b7178;font-size:12.5px}
  .ga-in{width:100%;height:50px;padding:0 14px;border-radius:12px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-size:16px;color:#111214}
  textarea.ga-in{height:auto;min-height:84px;padding:12px 14px;resize:vertical}
  .ga-in:focus{outline:2px solid #111214;outline-offset:-1px}
  .ga-btn{height:48px;padding:0 18px;border-radius:12px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-weight:700;font-size:16px;color:#111214;cursor:pointer}
  .ga-btn:disabled{opacity:.5}
  .ga-red{background:#E60012;border-color:#E60012;color:#fff}
  .ga-danger{color:#E60012;border-color:#f3c3c7}
  .ga-row{display:flex;gap:8px}
  .ga-row>*{flex:1}
  .ga-msg{margin:12px 0 0;padding:10px 12px;border-radius:10px;font-size:14px;background:#fdecee;color:#B8000E}
  .ga-msg.ok{background:#e8f7ee;color:#0a7a35}
  .ga-sheet{position:fixed;inset:0;z-index:150;background:#f3f4f6;overflow:auto;-webkit-overflow-scrolling:touch;color:#111214}
  .ga-wrap{max-width:720px;margin:0 auto;padding:0 16px}
  .ga-top{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #e3e5e8;padding-top:env(safe-area-inset-top,0px)}
  .ga-top .ga-wrap{display:flex;align-items:center;gap:10px;height:58px}
  .ga-top h2{margin:0 auto 0 0;font-size:18px}
  .ga-x{width:42px;height:42px;border:0;border-radius:50%;background:#f3f4f6;font-size:18px;cursor:pointer}
  .ga-sec{background:#fff;border-radius:16px;padding:18px 16px;margin:12px 0}
  .ga-sec h3{margin:0 0 12px;font-size:16px;display:flex;align-items:center;gap:8px}
  .ga-n{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#111214;color:#fff;font-size:12px}
  .ga-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .ga-chips{display:flex;flex-wrap:wrap;gap:6px}
  .ga-chip{height:40px;padding:0 14px;border-radius:999px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-weight:600;font-size:14.5px;color:#111214;cursor:pointer}
  .ga-chip.on{background:#111214;border-color:#111214;color:#fff}
  .ga-seg{display:flex;background:#f3f4f6;border-radius:10px;padding:3px;gap:3px}
  .ga-seg button{flex:1;height:40px;border:0;border-radius:8px;background:transparent;font:inherit;font-size:14.5px;font-weight:700;color:#6b7178;cursor:pointer}
  .ga-seg button.on{background:#fff;color:#111214;box-shadow:0 1px 2px rgba(0,0,0,.08)}
  .ga-sws{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .ga-sw{width:34px;height:34px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #e3e5e8;cursor:pointer;position:relative;overflow:hidden;padding:0}
  .ga-sw.on{box-shadow:0 0 0 2px #111214}
  .ga-grades{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .ga-grade{text-align:left;padding:12px;border-radius:12px;border:2px solid #e3e5e8;background:#fff;font:inherit;color:#111214;cursor:pointer}
  .ga-grade b{display:flex;align-items:center;gap:8px;font-size:15px}
  .ga-grade small{display:block;margin-top:4px;color:#6b7178;font-size:12.5px;line-height:1.4}
  .ga-grade.on{border-color:#111214;background:#fafafa}
  .ga-g{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:6px;color:#fff;font-size:12px;font-weight:800}
  .ga-g.S{background:#111214}.ga-g.A{background:#2563eb}.ga-g.B{background:#0d9488}.ga-g.C{background:#9ca3af}
  .ga-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
  .ga-ph{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:#eceef0}
  .ga-ph img{width:100%;height:100%;object-fit:cover;display:block}
  .ga-ph .ga-main{position:absolute;left:6px;top:6px;padding:2px 7px;border-radius:6px;background:#E60012;color:#fff;font-size:11px;font-weight:800}
  .ga-ph .ga-ctl{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:4px;background:linear-gradient(transparent,rgba(0,0,0,.55))}
  .ga-ph .ga-ctl button{width:30px;height:30px;border:0;border-radius:8px;background:rgba(255,255,255,.92);font-size:14px;font-weight:800;cursor:pointer}
  .ga-ph .ga-prog{position:absolute;inset:0;display:grid;place-items:center;background:rgba(255,255,255,.75);font-weight:800;font-size:13px}
  .ga-add-ph{aspect-ratio:1;border-radius:12px;border:2px dashed #c9ccd1;background:#fafafa;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-weight:700;font-size:13.5px;color:#3b3f45;cursor:pointer;text-align:center}
  .ga-add-ph svg{width:28px;height:28px;fill:currentColor}
  .ga-hint{font-size:13px;color:#6b7178;margin:8px 0 0}
  .ga-money{position:relative;display:block}
  .ga-money .ga-in{padding-right:36px;font-weight:700;font-variant-numeric:tabular-nums}
  .ga-money::after{content:'원';position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#6b7178;font-weight:600}
  .ga-quick{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
  .ga-quick button{height:32px;padding:0 10px;border-radius:8px;border:1px solid #e3e5e8;background:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .ga-save{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fdecee;color:#E60012;font-weight:700;font-size:14px}
  .ga-range{width:100%;accent-color:#111214}
  .ga-check{display:flex;align-items:center;gap:10px;margin-top:10px;font-weight:600;font-size:15px}
  .ga-check input{width:22px;height:22px;accent-color:#111214}
  .ga-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #e3e5e8;padding:10px 0 calc(10px + env(safe-area-inset-bottom,0px))}
  .ga-foot .ga-wrap{display:flex;gap:8px}
  .ga-foot .ga-red{flex:1}
  .ga-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:300;padding:12px 18px;border-radius:12px;background:#111214;color:#fff;font-weight:600;font-size:15px;max-width:calc(100% - 32px)}
  .ga-confirm{background:#fff;border-radius:18px;padding:22px;max-width:360px;width:100%;color:#111214}
  .ga-confirm p{margin:0 0 18px;font-weight:600}
  body.ga-lock{overflow:hidden}
  .ga-modal[hidden],.ga-sheet[hidden],.ga-toast[hidden],.ga-msg[hidden],.ga-save[hidden],#gaDelete[hidden]{display:none!important}
  @media (min-width:760px){.ga-grades{grid-template-columns:repeat(4,1fr)}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // 하단 "관리자" 버튼
  const copy = document.querySelector('.footer .copy');
  if (copy) copy.insertAdjacentHTML('beforeend', ' · <button type="button" class="admin-link" id="gaOpen">관리자</button>');

  document.body.insertAdjacentHTML('beforeend', `
  <div class="ga-modal" id="gaLoginBox" hidden>
    <form class="ga-login" id="gaLoginForm" autocomplete="on">
      <h2>관리자 로그인</h2>
      <p>직원 공용 아이디(master)로 로그인하면 이 화면에서 바로 폰을 올리고 고칠 수 있어요.</p>
      <label class="ga-f"><span>아이디</span><input class="ga-in" id="gaId" autocomplete="username" autocapitalize="off" required placeholder="master"></label>
      <label class="ga-f"><span>비밀번호</span><input class="ga-in" id="gaPw" type="password" autocomplete="current-password" required></label>
      <div class="ga-row"><button type="button" class="ga-btn" id="gaCancel">닫기</button><button type="submit" class="ga-btn ga-red" id="gaLoginBtn">로그인</button></div>
      <div class="ga-msg" id="gaMsg" hidden></div>
    </form>
  </div>
  <div class="ga-modal" id="gaConfirm" hidden><div class="ga-confirm"><p id="gaConfirmText"></p><div class="ga-row"><button class="ga-btn" id="gaNo">취소</button><button class="ga-btn ga-red" id="gaYes">확인</button></div></div></div>
  <div class="ga-toast" id="gaToast" hidden></div>
  <div class="ga-sheet" id="gaSheet" hidden>
    <div class="ga-top"><div class="ga-wrap"><h2 id="gaTitle">새 폰 등록</h2><button type="button" class="ga-x" id="gaClose" aria-label="닫기">✕</button></div></div>
    <div class="ga-wrap">
      <div class="ga-sec">
        <h3><span class="ga-n">1</span>사진 <small style="font-weight:500;color:#6b7178">첫 번째가 대표 사진</small></h3>
        <div class="ga-photos" id="gaPhotos"></div>
        <input type="file" id="gaFile" accept="image/*" multiple hidden>
        <p class="ga-hint">앞면 · 뒷면 · 옆면 · 흠집 부위를 찍어 올리면 손님이 믿고 사요. 사진은 자동으로 줄여서 올라가요.</p>
      </div>
      <div class="ga-sec">
        <h3><span class="ga-n">2</span>기본 정보</h3>
        <div class="ga-f"><span>브랜드</span><div class="ga-seg" id="gaBrand"><button type="button" data-v="apple">아이폰</button><button type="button" data-v="samsung">갤럭시</button><button type="button" data-v="etc">기타</button></div></div>
        <label class="ga-f"><span>모델명 <small>영어로 쓰면 외국인 손님도 검색돼요</small></span><input class="ga-in" id="gaModel" list="gaModels" placeholder="예: iPhone 15 Pro"></label>
        <datalist id="gaModels"></datalist>
        <div class="ga-f"><span>용량</span><div class="ga-chips" id="gaStorage"></div></div>
        <label class="ga-f"><span>색상</span><input class="ga-in" id="gaColor" placeholder="예: Natural Titanium, 블랙"></label>
        <div class="ga-sws" id="gaSwatches"></div>
        <p class="ga-hint">색 동그라미는 사진이 없을 때 그림 색상으로 쓰여요.</p>
      </div>
      <div class="ga-sec">
        <h3><span class="ga-n">3</span>상태</h3>
        <div class="ga-f"><span>외관 등급</span><div class="ga-grades" id="gaGrades"></div></div>
        <div class="ga-f"><span>배터리 성능 <small id="gaBatLabel"></small></span>
          <input class="ga-range" id="gaBatRange" type="range" min="50" max="100" value="90">
          <div class="ga-2"><input class="ga-in" id="gaBat" type="number" inputmode="numeric" min="0" max="100" placeholder="모르면 비워두세요"><button type="button" class="ga-btn" id="gaBatUnknown">모름</button></div>
        </div>
        <label class="ga-check"><input type="checkbox" id="gaBatNew">정품 새 배터리로 교체함</label>
      </div>
      <div class="ga-sec">
        <h3><span class="ga-n">4</span>가격</h3>
        <div class="ga-2">
          <label class="ga-f"><span>판매가</span><span class="ga-money"><input class="ga-in" id="gaPrice" inputmode="numeric" placeholder="0"></span></label>
          <label class="ga-f"><span>시중가 <small>선택</small></span><span class="ga-money"><input class="ga-in" id="gaMarket" inputmode="numeric" placeholder="0"></span></label>
        </div>
        <div class="ga-quick" id="gaQuick"><button type="button" data-d="-10000">−1만</button><button type="button" data-d="10000">+1만</button><button type="button" data-d="50000">+5만</button><button type="button" data-d="100000">+10만</button></div>
        <div class="ga-save" id="gaSavePrev" hidden></div>
      </div>
      <div class="ga-sec">
        <h3><span class="ga-n">5</span>구성품 · 설명</h3>
        <div class="ga-chips" id="gaIncludes"></div>
        <label class="ga-f" style="margin-top:14px"><span>설명 (한국어)</span><textarea class="ga-in" id="gaNoteKo" placeholder="예: 케이스 끼고 사용해서 기스 거의 없음. 기능 모두 정상."></textarea></label>
        <label class="ga-f"><span>설명 (영어) <small>선택 · 비우면 외국어 화면에 한국어가 보여요</small></span><textarea class="ga-in" id="gaNoteEn" placeholder="e.g. Very clean, used with a case. Everything works."></textarea></label>
      </div>
      <div class="ga-sec">
        <h3><span class="ga-n">6</span>판매 상태 · 상품번호</h3>
        <div class="ga-seg" id="gaStatus"><button type="button" data-v="sale">판매중</button><button type="button" data-v="reserved">예약중</button><button type="button" data-v="sold">판매완료</button></div>
        <div class="ga-2" style="margin-top:14px">
          <label class="ga-f"><span>상품번호</span><input class="ga-in" id="gaPid"></label>
          <label class="ga-f"><span>입고일</span><input class="ga-in" id="gaArrived" type="date"></label>
        </div>
      </div>
      <div style="height:8px"></div>
    </div>
    <div class="ga-foot"><div class="ga-wrap"><button type="button" class="ga-btn ga-danger" id="gaDelete" hidden>삭제</button><button type="button" class="ga-btn ga-red" id="gaSaveBtn">저장하고 사이트에 올리기</button></div></div>
  </div>`);

  /* ---------- 공통 ---------- */
  let tt;
  function toast(m) { const t = $('gaToast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2600); }
  function ask(text) {
    return new Promise(res => {
      $('gaConfirmText').textContent = text; $('gaConfirm').hidden = false;
      const done = v => { $('gaConfirm').hidden = true; $('gaYes').onclick = $('gaNo').onclick = null; res(v); };
      $('gaYes').onclick = () => done(true); $('gaNo').onclick = () => done(false);
    });
  }
  function msg(text, ok) { const m = $('gaMsg'); m.textContent = text; m.className = 'ga-msg' + (ok ? ' ok' : ''); m.hidden = !text; }
  function friendly(err) {
    const m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login/i.test(m)) return '아이디나 비밀번호가 맞지 않아요.';
    if (/Email not confirmed/i.test(m)) return '아직 인증되지 않은 계정이에요.';
    if (/row-level security|permission|not authorized|403|JWT/i.test(m)) return '관리자 권한이 없는 계정이에요.';
    if (/Failed to fetch|NetworkError/i.test(m)) return '인터넷 연결을 확인해 주세요.';
    return m;
  }
  function loadLib() {
    if (window.supabase) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = LIB; s.onload = res; s.onerror = () => rej(new Error('관리자 기능을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));
      document.head.appendChild(s);
    });
  }
  async function client() {
    if (sb) return sb;
    await loadLib();
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    return sb;
  }
  function hasSavedSession() { try { return !!localStorage.getItem(SESSION_KEY); } catch (e) { return false; } }

  /* ---------- 로그인 / 관리자 모드 ---------- */
  function openLogin() { msg(''); $('gaLoginBox').hidden = false; setTimeout(() => $('gaId').focus(), 50); }
  function closeLogin() { $('gaLoginBox').hidden = true; if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search); }
  $('gaCancel').addEventListener('click', closeLogin);
  if ($('gaOpen')) $('gaOpen').addEventListener('click', () => (document.body.classList.contains('is-admin') ? null : openLogin()));
  window.addEventListener('hashchange', () => { if (location.hash === '#admin') openLogin(); });

  $('gaLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('gaId').value.trim();
    const email = id.includes('@') ? id : LOGIN_IDS[id.toLowerCase()];
    if (!email) { msg('등록되지 않은 아이디예요.'); return; }
    $('gaLoginBtn').disabled = true; msg('');
    try {
      const c = await client();
      const { error } = await c.auth.signInWithPassword({ email, password: $('gaPw').value });
      if (error) throw error;
      if (!(await enter())) { await c.auth.signOut(); msg('관리자 권한이 없는 계정이에요.'); }
      else { $('gaPw').value = ''; closeLogin(); toast('관리자 모드예요. 폰을 등록하거나 수정할 수 있어요.'); }
    } catch (err) { msg(friendly(err)); }
    $('gaLoginBtn').disabled = false;
  });

  async function enter() {
    const c = await client();
    const { data } = await c.auth.getSession();
    if (!data.session) return false;
    const { data: adm, error } = await c.from('used_admins').select('email').limit(1);
    if (error || !adm || !adm.length) return false;
    document.body.classList.add('is-admin');
    if (!$('gaBar')) {
      document.body.insertAdjacentHTML('afterbegin', `<div class="ga-bar" id="gaBar"><div class="wrap ga-bar-in"><b>관리자 모드</b><button type="button" class="ga-add" id="gaAdd">＋ 새 폰 등록</button><button type="button" id="gaLogout">로그아웃</button></div></div>`);
      $('gaAdd').addEventListener('click', () => openEditor(null));
      $('gaLogout').addEventListener('click', async () => {
        await c.auth.signOut();
        document.body.classList.remove('is-admin'); $('gaBar').remove(); window.GW.rerender(); toast('로그아웃했어요.');
      });
    }
    await window.GW.reload();
    return true;
  }

  // 카드 아래 관리자 버튼
  const grid = document.getElementById('productGrid');
  grid.addEventListener('click', async e => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { openEditor(window.GW.get(ed.dataset.edit)); return; }
    const st = e.target.closest('.card-admin [data-status]');
    if (st) {
      const id = st.closest('.card-admin').dataset.id, v = st.dataset.status;
      const p = window.GW.get(id); if (!p || p.status === v) return;
      const prev = p.status; window.GW.setStatus(id, v);
      const { error } = await sb.from('used_phones').update({ status: v }).eq('id', id);
      if (error) { window.GW.setStatus(id, prev); toast(friendly(error)); } else toast(`${id} → ${STATUS[v]}`);
    }
  });

  /* ---------- 편집기 ---------- */
  function nextId() {
    const nums = window.GW.all().map(p => parseInt(String(p.id).replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    return 'GW-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  }
  function blank() {
    return { id: nextId(), brand: 'apple', model: '', storage: '128GB', color: '', color_hex: '#1d1d1f', grade: 'A', battery: null, battery_replaced: false, price: null, market_price: null, status: 'sale', images: [], includes: ['본체'], note_ko: '', note_en: '', arrived: new Date().toISOString().slice(0, 10) };
  }
  function openEditor(p) {
    const row = p && p._row;
    editingId = row ? row.id : null;
    draft = JSON.parse(JSON.stringify(row || blank()));
    draft.images = draft.images || []; draft.includes = draft.includes || [];
    $('gaTitle').textContent = row ? row.id + ' 수정' : '새 폰 등록';
    $('gaDelete').hidden = !row;
    $('gaModel').value = draft.model || ''; $('gaColor').value = draft.color || '';
    $('gaPrice').value = draft.price != null ? draft.price.toLocaleString('ko-KR') : '';
    $('gaMarket').value = draft.market_price != null ? draft.market_price.toLocaleString('ko-KR') : '';
    $('gaBat').value = draft.battery ?? ''; $('gaBatRange').value = draft.battery ?? 90;
    $('gaBatNew').checked = !!draft.battery_replaced;
    $('gaNoteKo').value = draft.note_ko || ''; $('gaNoteEn').value = draft.note_en || '';
    $('gaPid').value = draft.id; $('gaArrived').value = draft.arrived || '';
    paint();
    $('gaSheet').hidden = false; $('gaSheet').scrollTop = 0; document.body.classList.add('ga-lock');
  }
  function closeEditor(force) {
    if (!force && uploading) { toast('사진을 올리는 중이에요. 잠시만요.'); return; }
    $('gaSheet').hidden = true; document.body.classList.remove('ga-lock'); draft = null;
  }
  function seg(id, v) { document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
  function paint() {
    seg('gaBrand', draft.brand); seg('gaStatus', draft.status);
    $('gaModels').innerHTML = (MODELS[draft.brand] || []).map(m => `<option value="${esc(m)}">`).join('');
    const st = STORAGES.includes(draft.storage) || !draft.storage ? STORAGES : STORAGES.concat(draft.storage);
    $('gaStorage').innerHTML = st.map(s => `<button type="button" class="ga-chip ${draft.storage === s ? 'on' : ''}" data-v="${esc(s)}">${esc(s)}</button>`).join('') + '<button type="button" class="ga-chip" data-v="__custom">직접 입력</button>';
    $('gaSwatches').innerHTML = SWATCHES.map(c => `<button type="button" class="ga-sw ${draft.color_hex === c ? 'on' : ''}" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('') +
      `<label class="ga-sw" style="background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red)" title="다른 색"><input type="color" id="gaColorPick" value="${esc(draft.color_hex || '#cccccc')}" style="opacity:0;position:absolute;inset:0;width:100%;height:100%"></label>`;
    $('gaGrades').innerHTML = Object.entries(GRADES).map(([k, v]) => `<button type="button" class="ga-grade ${draft.grade === k ? 'on' : ''}" data-g="${k}"><b><span class="ga-g ${k}">${k}</span>${v[0]}</b><small>${v[1]}</small></button>`).join('');
    $('gaIncludes').innerHTML = INCLUDES.map(s => `<button type="button" class="ga-chip ${draft.includes.includes(s) ? 'on' : ''}" data-v="${esc(s)}">${esc(s)}</button>`).join('');
    $('gaBatLabel').textContent = draft.battery == null ? '(모름)' : draft.battery + '%';
    paintPhotos(); paintSave();
  }
  function paintSave() {
    const p = toNum($('gaPrice').value), m = toNum($('gaMarket').value), el = $('gaSavePrev');
    if (p && m && m > p) { el.hidden = false; el.textContent = `사이트에 "${(m - p).toLocaleString('ko-KR')}원 저렴"으로 표시돼요`; } else el.hidden = true;
  }
  function paintPhotos() {
    $('gaPhotos').innerHTML = draft.images.map((src, i) => `
      <div class="ga-ph">${src.startsWith('uploading:') ? '<div class="ga-prog">올리는 중…</div>' : `<img src="${esc(src)}" alt="">`}
        ${i === 0 ? '<span class="ga-main">대표</span>' : ''}
        ${src.startsWith('uploading:') ? '' : `<div class="ga-ctl"><button type="button" data-mv="${i}" data-d="-1" aria-label="앞으로">◀</button><button type="button" data-rm="${i}" aria-label="삭제">✕</button><button type="button" data-mv="${i}" data-d="1" aria-label="뒤로">▶</button></div>`}
      </div>`).join('') +
      '<label class="ga-add-ph" for="gaFile"><svg viewBox="0 0 24 24"><path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>사진 찍기 / 선택</label>';
  }

  $('gaBrand').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { draft.brand = b.dataset.v; paint(); } });
  $('gaStatus').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { draft.status = b.dataset.v; seg('gaStatus', draft.status); } });
  $('gaStorage').addEventListener('click', e => {
    const b = e.target.closest('.ga-chip'); if (!b) return;
    if (b.dataset.v === '__custom') { const v = window.prompt('용량을 입력하세요 (예: 2TB)'); if (v) draft.storage = v.trim().toUpperCase(); } else draft.storage = b.dataset.v;
    paint();
  });
  $('gaSwatches').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { draft.color_hex = b.dataset.c; paint(); } });
  $('gaSwatches').addEventListener('input', e => { if (e.target.id === 'gaColorPick') { draft.color_hex = e.target.value; document.querySelectorAll('#gaSwatches .ga-sw').forEach(s => s.classList.remove('on')); } });
  $('gaGrades').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { draft.grade = b.dataset.g; paint(); } });
  $('gaIncludes').addEventListener('click', e => { const b = e.target.closest('.ga-chip'); if (!b) return; const v = b.dataset.v; draft.includes = draft.includes.includes(v) ? draft.includes.filter(x => x !== v) : draft.includes.concat(v); paint(); });
  $('gaBatRange').addEventListener('input', e => { draft.battery = +e.target.value; $('gaBat').value = draft.battery; $('gaBatLabel').textContent = draft.battery + '%'; });
  $('gaBat').addEventListener('input', e => { const n = toNum(e.target.value); draft.battery = n == null ? null : Math.min(100, n); if (n != null) $('gaBatRange').value = n; $('gaBatLabel').textContent = n == null ? '(모름)' : n + '%'; });
  $('gaBatUnknown').addEventListener('click', () => { draft.battery = null; $('gaBat').value = ''; $('gaBatLabel').textContent = '(모름)'; });
  ['gaPrice', 'gaMarket'].forEach(id => $(id).addEventListener('input', e => { const n = toNum(e.target.value); e.target.value = n == null ? '' : n.toLocaleString('ko-KR'); paintSave(); }));
  $('gaQuick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const n = Math.max(0, (toNum($('gaPrice').value) || 0) + +b.dataset.d); $('gaPrice').value = n.toLocaleString('ko-KR'); paintSave(); });
  $('gaClose').addEventListener('click', () => closeEditor());

  // 사진
  $('gaPhotos').addEventListener('click', e => {
    const mv = e.target.closest('[data-mv]'), rm = e.target.closest('[data-rm]');
    if (mv) { const i = +mv.dataset.mv, j = i + +mv.dataset.d; if (j < 0 || j >= draft.images.length) return; const a = draft.images; [a[i], a[j]] = [a[j], a[i]]; paintPhotos(); }
    if (rm) { draft.images.splice(+rm.dataset.rm, 1); paintPhotos(); }
  });
  $('gaFile').addEventListener('change', async e => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    for (const f of files) {
      const token = 'uploading:' + Math.random().toString(36).slice(2);
      draft.images.push(token); paintPhotos(); uploading++;
      try {
        const blob = await shrink(f);
        const path = `${(draft.id || 'new').replace(/[^A-Za-z0-9-]/g, '')}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (error) throw error;
        const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        if (draft) { const k = draft.images.indexOf(token); if (k > -1) draft.images[k] = url; }
      } catch (err) {
        if (draft) draft.images = draft.images.filter(x => x !== token);
        toast('사진 업로드 실패: ' + friendly(err));
      }
      uploading--; if (draft) paintPhotos();
    }
  });
  // 긴 변 1600px JPEG로 줄이기
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))), 'image/jpeg', 0.84);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이 사진 형식은 읽을 수 없어요. JPG/PNG로 올려주세요.')); };
      img.src = url;
    });
  }

  // 저장
  $('gaSaveBtn').addEventListener('click', async () => {
    if (uploading) { toast('사진을 올리는 중이에요. 잠시 후 저장해 주세요.'); return; }
    const row = {
      id: $('gaPid').value.trim(), brand: draft.brand, model: $('gaModel').value.trim(), storage: draft.storage || null,
      color: $('gaColor').value.trim() || null, color_hex: draft.color_hex, grade: draft.grade,
      battery: draft.battery, battery_replaced: $('gaBatNew').checked,
      price: toNum($('gaPrice').value), market_price: toNum($('gaMarket').value), status: draft.status,
      images: draft.images.filter(s => !s.startsWith('uploading:')), includes: draft.includes,
      note_ko: $('gaNoteKo').value.trim() || null, note_en: $('gaNoteEn').value.trim() || null,
      arrived: $('gaArrived').value || new Date().toISOString().slice(0, 10),
    };
    if (!row.model) { toast('모델명을 입력해 주세요.'); $('gaModel').focus(); return; }
    if (row.price == null) { toast('판매가를 입력해 주세요.'); $('gaPrice').focus(); return; }
    if (!row.id) { toast('상품번호를 입력해 주세요.'); return; }
    if (window.GW.all().some(p => p.id === row.id && p.id !== editingId)) { toast('이미 있는 상품번호예요: ' + row.id); return; }
    $('gaSaveBtn').disabled = true;
    let error;
    if (editingId && editingId !== row.id) {
      ({ error } = await sb.from('used_phones').insert(row));
      if (!error) ({ error } = await sb.from('used_phones').delete().eq('id', editingId));
    } else if (editingId) {
      ({ error } = await sb.from('used_phones').update(row).eq('id', editingId));
    } else {
      ({ error } = await sb.from('used_phones').insert(row));
    }
    $('gaSaveBtn').disabled = false;
    if (error) { toast('저장 실패: ' + friendly(error)); return; }
    toast(editingId ? '수정했어요.' : '등록했어요. 사이트에 바로 올라갔어요.');
    closeEditor(true); window.GW.reload();
  });

  // 삭제
  $('gaDelete').addEventListener('click', async () => {
    if (!editingId) return;
    if (!(await ask(`${editingId} 상품을 완전히 지울까요? 팔린 폰은 "판매완료"로 두면 판매 기록이 남아요.`))) return;
    const imgs = (draft && draft.images) || [];
    const { error } = await sb.from('used_phones').delete().eq('id', editingId);
    if (error) { toast('삭제 실패: ' + friendly(error)); return; }
    const paths = imgs.map(u => u.split('/object/public/' + BUCKET + '/')[1]).filter(Boolean);
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    toast('삭제했어요.'); closeEditor(true); window.GW.reload();
  });

  /* ---------- 시작 ---------- */
  window.GWAdmin = { edit: id => openEditor(window.GW.get(id)), open: openLogin };
  if (location.hash === '#admin') openLogin();
  if (hasSavedSession()) client().then(enter).catch(() => {});
})();
