/* ============================================================
   아키네이터의 비밀 – 공통 기능
   로그인 · 자동 저장 · 동적 표 · 제출 · 구글 시트 API · 체험 모드
   ============================================================ */
(function () {
  'use strict';
  const C = window.AKN_CONFIG || {};

  /* ---------- 활동지 목록 ---------- */
  const WS = [
    { id: 1, title: 'UP & DOWN 게임 데이터 탐정', lesson: '1차시', stage: '문제 발견', group: false },
    { id: 2, title: '스무고개 질문 만들기와 특징 표', lesson: '2차시', stage: '문제 구조화', group: true },
    { id: 3, title: '업다운 챔피언전 & 이진 탐색 설계서', lesson: '3차시', stage: '컴퓨팅 설계', group: false },
    { id: 4, title: '탐색 알고리즘 비교 분석표', lesson: '4차시', stage: '컴퓨팅 설계', group: true },
    { id: 5, title: '컴퓨터가 내 수를 맞히게 하기', lesson: '5차시', stage: '구현', group: false },
    { id: 6, title: '우리 모둠 아키네이터 개발 기록지', lesson: '6차시', stage: '구현', group: true },
    { id: 7, title: '사용자 테스트와 AI 비교', lesson: '7차시', stage: '테스트 및 개선', group: true },
    { id: 8, title: '우리 아키네이터를 세상으로', lesson: '8차시', stage: '공유·확장', group: true }
  ];

  /* ---------- 공유 시트 탭 구조 (Apps Script와 같아야 함) ---------- */
  const TABS = {
    '제출': ['시각', '학급', '모둠', '번호', '활동지', '내용'],
    '게임기록': ['시각', '학급', '모둠', '번호', '활동지', '판', '범위', '전략', '부른수', '질문수'],
    '알고리즘비교': ['시각', '학급', '모둠', '번호', '활동지', '알고리즘', '최댓값', '최소', '최대'],
    '결정트리': ['시각', '학급', '모둠', '번호', '활동지', '첫질문', '예수', '아니오수', '합계', '평균', '최대'],
    '사용자테스트': ['시각', '학급', '모둠', '번호', '활동지', '구분', '테스트수', '맞힌수', '정답률', '평균질문수'],
    '동료평가': ['시각', '학급', '모둠', '번호', '활동지', '대상모둠', '주제', '근거', '잘한점', '질문제안']
  };

  /* ---------- 안전한 저장소 ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  const SS = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  /* ---------- 작은 도구 ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : null; };
  const parseSeq = s => (String(s || '').match(/\d+/g) || []).map(Number);
  const round = (v, d = 1) => v == null || !isFinite(v) ? '' : Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  const avg = a => { const b = a.filter(x => x != null && isFinite(x)); return b.length ? b.reduce((s, x) => s + x, 0) / b.length : null; };
  const now = () => new Date().toISOString();
  const hhmm = iso => { try { const d = new Date(iso); return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

  /* ---------- 사용자 ---------- */
  function user() { return LS.get('akn_user', null); }
  function setUser(u) { LS.set('akn_user', u); }
  function uid(u) { u = u || user(); return u ? `${u.cls}-${u.grp}-${u.num}` : 'guest'; }
  function who(u) { u = u || user(); return u ? `${u.cls}반 ${u.grp}모둠 ${u.num}번` : ''; }
  function wsKey(id, u) { return `akn:${uid(u)}:ws${id}`; }
  function meta(u) { return LS.get(`akn_meta:${uid(u)}`, { saved: {}, submitted: {} }); }
  function setMeta(m, u) { LS.set(`akn_meta:${uid(u)}`, m); }

  /* ---------- 상태 ---------- */
  let store = {};
  let wsId = 0;
  let viewMode = false;
  let viewUser = null;
  let page = {};          // 각 활동지가 등록하는 훅 (records 등)
  let saveTimer = null;

  /* ---------- 값 읽기/쓰기 ---------- */
  function readEl(el) {
    if (el.type === 'checkbox') return el.checked;
    return el.value;
  }
  function writeEl(el, v) {
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = (v != null && String(el.value) === String(v));
    else if (el.tagName === 'BUTTON') { /* 버튼형 셀은 각 페이지가 처리 */ }
    else el.value = v == null ? '' : v;
  }
  function restore(root) {
    $$('[data-k]', root || document).forEach(el => { if (el.dataset.k in store) writeEl(el, store[el.dataset.k]); });
  }
  function get(k, d) { return k in store ? store[k] : d; }
  function set(k, v, quiet) {
    store[k] = v;
    $$(`[data-k="${CSS.escape(k)}"]`).forEach(el => writeEl(el, v));
    if (!quiet) scheduleSave();
  }
  function del(k) { delete store[k]; scheduleSave(); }

  function scheduleSave() {
    if (viewMode) return;
    const st = $('#akn-save'); if (st) st.textContent = '저장 중…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }
  function saveNow() {
    if (viewMode || !wsId) return;
    const ok = LS.set(wsKey(wsId), store);
    const m = meta(); m.saved[wsId] = now(); setMeta(m);
    const st = $('#akn-save');
    if (st) st.textContent = ok ? '자동 저장됨 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '⚠ 이 브라우저는 저장이 막혀 있어요';
  }

  document.addEventListener('input', onEdit);
  document.addEventListener('change', onEdit);
  function onEdit(e) {
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.k) return;
    if (el.type === 'radio' && !el.checked) return;
    store[el.dataset.k] = readEl(el);
    scheduleSave();
    document.dispatchEvent(new CustomEvent('akn:change', { detail: { k: el.dataset.k } }));
  }

  /* ---------- 동적 표 ---------- */
  // cols: [{h, w, type:'text'|'num'|'select'|'area'|'check', opts:[], ph, ro}]
  function dynTable(host, opt) {
    host = typeof host === 'string' ? $(host) : host;
    const key = opt.key;
    const cntKey = '#' + key;
    const min = opt.min || 1, max = opt.max || 40;
    function count() { return Math.max(min, Math.min(max, parseInt(get(cntKey, min), 10) || min)); }
    function cellHTML(c, ci, i) {
      const k = `${key}.${i}.${ci}`;
      const st = c.w ? ` style="min-width:${c.w}px"` : '';
      if (c.type === 'select') return `<select data-k="${k}"${st}><option value=""></option>${c.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
      if (c.type === 'area') return `<textarea data-k="${k}" rows="2"${st} placeholder="${esc(c.ph || '')}"></textarea>`;
      if (c.type === 'check') return `<div class="c">${c.opts.map(o => `<label class="ck"><input type="checkbox" data-k="${k}.${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;
      if (c.type === 'label') return `<b>${esc(typeof c.label === 'function' ? c.label(i) : c.label)}</b>`;
      return `<input type="${c.type === 'num' ? 'number' : 'text'}" data-k="${k}"${st} placeholder="${esc(c.ph || '')}" ${c.ro ? 'readonly' : ''}>`;
    }
    function render() {
      const n = count();
      let h = `<div class="tbl-wrap"><table class="t"><thead><tr>${opt.numbered ? `<th style="width:44px">${esc(opt.numbered === true ? '번호' : opt.numbered)}</th>` : ''}${opt.cols.map(c => `<th${c.w ? ` style="min-width:${c.w}px"` : ''}>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>`;
      if (opt.example) h += `<tr>${opt.numbered ? '<td class="c ex">예</td>' : ''}${opt.example.map(x => `<td class="ex">${esc(x)}</td>`).join('')}</tr>`;
      for (let i = 0; i < n; i++) {
        h += `<tr data-row="${i}">${opt.numbered ? `<td class="c lab">${i + 1}</td>` : ''}${opt.cols.map((c, ci) => `<td class="${c.type === 'check' || c.type === 'label' ? 'c' : ''}">${cellHTML(c, ci, i)}</td>`).join('')}</tr>`;
      }
      h += `</tbody></table></div><div class="btns no-view no-print">` +
        (n < max ? `<button type="button" class="btn sm ghost" data-act="add">＋ ${esc(opt.addLabel || '줄 추가')}</button>` : '') +
        (n > min ? `<button type="button" class="btn sm ghost" data-act="rm">－ 마지막 줄 지우기</button>` : '') + `</div>`;
      host.innerHTML = h;
      restore(host);
      if (opt.onRender) opt.onRender();
    }
    host.addEventListener('click', e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const n = count();
      if (b.dataset.act === 'add' && n < max) { store[cntKey] = n + 1; }
      if (b.dataset.act === 'rm' && n > min) {
        Object.keys(store).forEach(k => { if (k.startsWith(`${key}.${n - 1}.`)) delete store[k]; });
        store[cntKey] = n - 1;
      }
      scheduleSave(); render();
      document.dispatchEvent(new CustomEvent('akn:change', { detail: { k: key } }));
    });
    render();
    return {
      count,
      render,
      cell: (i, ci) => get(`${key}.${i}.${ci}`, ''),
      rows: () => { const out = []; for (let i = 0; i < count(); i++) out.push(opt.cols.map((c, ci) => get(`${key}.${i}.${ci}`, ''))); return out; }
    };
  }

  /* ---------- 공유 시트 API ---------- */
  function mockDB() { return LS.get('akn_mock', {}); }
  function mockSave(db) { LS.set('akn_mock', db); }
  function same(a, b) { return String(a) === String(b); }

  function mock(params, body) {
    const db = mockDB();
    Object.keys(TABS).forEach(t => { db[t] = db[t] || []; });
    if (body && body.action === 'submit') {
      const base = { '시각': now(), '학급': body.cls, '모둠': body.grp, '번호': body.num, '활동지': body.ws };
      const mine = r => same(r['학급'], body.cls) && same(r['모둠'], body.grp) && same(r['번호'], body.num) && same(r['활동지'], body.ws);
      db['제출'] = db['제출'].filter(r => !mine(r));
      db['제출'].push(Object.assign({}, base, { '내용': JSON.stringify(body.data || {}) }));
      Object.keys(body.records || {}).forEach(t => {
        if (!TABS[t]) return;
        db[t] = db[t].filter(r => !mine(r));
        (body.records[t] || []).forEach(rec => db[t].push(Object.assign({}, base, rec)));
      });
      mockSave(db);
      return { ok: true, mode: 'demo' };
    }
    const a = params.action;
    if (a === 'records') return { ok: true, rows: (db[params.tab] || []).filter(r => !params.cls || same(r['학급'], params.cls)) };
    if (a === 'latest') {
      const rows = db['제출'].filter(r => same(r['학급'], params.cls) && same(r['모둠'], params.grp) && same(r['활동지'], params.ws) && !(params.except && same(r['번호'], params.except)) && !(params.num && !same(r['번호'], params.num)));
      rows.sort((x, y) => String(y['시각']).localeCompare(String(x['시각'])));
      return rows.length ? { ok: true, row: rows[0] } : { ok: true, row: null };
    }
    if (a === 'feedback') return { ok: true, rows: db['동료평가'].filter(r => same(r['학급'], params.cls) && same(r['대상모둠'], params.grp)) };
    if (a === 'all') {
      if (String(params.key) !== String(C.DEMO_TEACHER_KEY)) return { ok: false, error: '비밀번호가 맞지 않습니다.' };
      const tabs = {}; Object.keys(TABS).forEach(t => { tabs[t] = db[t].filter(r => !params.cls || same(r['학급'], params.cls)); });
      return { ok: true, tabs };
    }
    return { ok: false, error: 'unknown action' };
  }

  async function api(params, body) {
    if (!C.APPS_SCRIPT_URL) return mock(params || {}, body);
    try {
      let r;
      if (body) {
        r = await fetch(C.APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
      } else {
        r = await fetch(C.APPS_SCRIPT_URL + '?' + new URLSearchParams(params).toString());
      }
      return await r.json();
    } catch (e) {
      return { ok: false, error: '공유 시트에 연결하지 못했습니다. 인터넷 연결을 확인하세요.' };
    }
  }
  const isDemo = () => !C.APPS_SCRIPT_URL;

  /* ---------- 제출 ---------- */
  async function submit() {
    if (viewMode) return;
    saveNow();
    const u = user();
    if (!u) { location.href = 'index.html'; return; }
    let records = {};
    try { records = page.records ? (page.records() || {}) : {}; } catch (e) { console.error(e); }
    const btn = $('#akn-submit'); if (btn) { btn.disabled = true; btn.textContent = '제출 중…'; }
    const res = await api(null, { action: 'submit', cls: u.cls, grp: u.grp, num: u.num, ws: wsId, data: store, records });
    if (btn) { btn.disabled = false; btn.textContent = '제출하기'; }
    if (res && res.ok) {
      const m = meta(); m.submitted[wsId] = now(); setMeta(m);
      toast(isDemo() ? '체험 모드로 제출했어요 (이 기기에만 저장)' : '제출했어요! 고쳐서 다시 제출해도 됩니다.');
      if (page.afterSubmit) page.afterSubmit();
    } else toast('제출하지 못했어요: ' + ((res && res.error) || '알 수 없는 오류'));
  }

  async function loadGroup(mine) {
    const u = user(); if (!u) return;
    const q = { action: 'latest', cls: u.cls, grp: u.grp, ws: wsId };
    if (mine === true) q.num = u.num; else q.except = u.num;
    const res = await api(q);
    if (!res || !res.ok) { toast((res && res.error) || '불러오지 못했어요'); return; }
    if (!res.row) { toast(mine === true ? '아직 이 활동지를 제출한 기록이 없어요.' : '아직 우리 모둠에서 이 활동지를 제출한 친구가 없어요.'); return; }
    const r = res.row;
    if (!confirm(`${mine === true ? '내가' : r['번호'] + '번 친구가'} ${hhmm(r['시각'])}에 제출한 내용으로 바꿀까요?\n지금 화면의 내용은 사라집니다.`)) return;
    try { store = JSON.parse(r['내용']) || {}; } catch (e) { store = {}; }
    saveNow();
    location.reload();
  }

  /* ---------- 화면 틀 ---------- */
  function topbar() {
    const u = viewMode ? viewUser : user();
    const sel = `<select id="akn-nav" aria-label="활동지 이동" class="no-view">${WS.map(w => `<option value="${w.id}" ${w.id === wsId ? 'selected' : ''}>활동지 ${w.id} · ${w.lesson}</option>`).join('')}</select>`;
    const bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML = `<div class="in"><a class="brand" href="index.html">아키네이터의 비밀<small>${esc(C.SUBJECT || '')}</small></a>${wsId ? sel : ''}<span class="sp"></span>` +
      (u ? `<span class="chip">${esc(who(u))}${viewMode ? ' · 교사 보기' : ' <button type="button" id="akn-change">바꾸기</button>'}</span>` : '') +
      (wsId && !viewMode ? `<span class="savestate" id="akn-save"></span>` : '') + `</div>`;
    document.body.prepend(bar);
    if (isDemo() && !viewMode) {
      const d = document.createElement('div'); d.className = 'demo-banner';
      d.innerHTML = `<div class="in">체험 모드입니다. 구글 시트가 연결되지 않아 제출 내용이 <b>이 기기에만</b> 저장됩니다. (선생님: <code>assets/config.js</code>에 주소를 넣으면 반 전체가 공유돼요)</div>`;
      bar.after(d);
    }
    const nav = $('#akn-nav'); if (nav) nav.addEventListener('change', () => { location.href = `ws${nav.value}.html`; });
    const ch = $('#akn-change'); if (ch) ch.addEventListener('click', () => { location.href = 'index.html?change=1'; });
  }
  function bottombar() {
    if (viewMode) return;
    const w = WS.find(x => x.id === wsId);
    const bb = document.createElement('footer');
    bb.className = 'bottombar no-print';
    bb.innerHTML = `<div class="in">` +
      (wsId > 1 ? `<a class="btn ghost sm" href="ws${wsId - 1}.html">◀ 활동지 ${wsId - 1}</a>` : `<a class="btn ghost sm" href="index.html">◀ 처음</a>`) +
      (wsId < 8 ? `<a class="btn ghost sm" href="ws${wsId + 1}.html">활동지 ${wsId + 1} ▶</a>` : '') +
      `<span class="sp"></span>` +
      `<button type="button" class="btn ghost sm" id="akn-mine" title="다른 기기에서 제출한 내 내용을 가져옵니다">내 제출 불러오기</button>` +
      (w && w.group ? `<button type="button" class="btn ghost sm" id="akn-group" title="같은 모둠 친구가 제출한 내용을 내 화면으로 가져옵니다">모둠 친구 제출 불러오기</button>` : '') +
      `<button type="button" class="btn ghost sm" onclick="window.print()">인쇄·PDF</button>` +
      `<button type="button" class="btn green" id="akn-submit">제출하기</button></div>`;
    document.body.append(bb);
    $('#akn-submit').addEventListener('click', submit);
    const g = $('#akn-group'); if (g) g.addEventListener('click', () => loadGroup(false));
    $('#akn-mine').addEventListener('click', () => loadGroup(true));
  }

  /* ---------- 토스트·모달 ---------- */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  function modal(html, onOpen) {
    const bg = document.createElement('div'); bg.className = 'modal-bg show';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.append(bg);
    const close = () => bg.remove();
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
    if (onOpen) onOpen(bg.querySelector('.modal'), close);
    return close;
  }

  /* ---------- 업다운 게임 (컴퓨터가 출제) ---------- */
  function updownGame(maxN, title) {
    return new Promise(resolve => {
      const secret = 1 + Math.floor(Math.random() * maxN);
      let lo = 1, hi = maxN; const seq = [];
      let done = false;
      modal(`<h3>${esc(title || '업다운 게임')} (1~${maxN})</h3>
        <div class="ud"><p class="hint">컴퓨터가 1~${maxN} 중 수 하나를 정했어요. 수를 불러 보세요!</p>
        <div class="msg" id="ud-msg">&nbsp;</div>
        <div class="row" style="justify-content:center;gap:8px;align-items:center"><input id="ud-in" type="number" min="1" max="${maxN}" inputmode="numeric"><button class="btn" id="ud-go" type="button">부르기</button></div>
        <p class="hint" id="ud-range">남은 범위: 1 ~ ${maxN}</p>
        <div class="hist" id="ud-hist"></div>
        <div class="btns" style="justify-content:center"><button class="btn green" id="ud-ok" type="button" style="display:none">기록에 넣기</button><button class="btn ghost" data-close type="button">닫기</button></div></div>`,
        (m, close) => {
          const inp = m.querySelector('#ud-in'), msg = m.querySelector('#ud-msg');
          inp.focus();
          function go() {
            if (done) return;
            const g = parseInt(inp.value, 10);
            if (!g || g < 1 || g > maxN) { msg.className = 'msg'; msg.textContent = `1~${maxN} 사이의 수를 넣으세요`; return; }
            seq.push(g);
            m.querySelector('#ud-hist').innerHTML = seq.map(x => `<span>${x}</span>`).join('→');
            if (g === secret) { done = true; msg.className = 'msg hit'; msg.textContent = `정답! ${seq.length}번 만에 맞혔어요`; m.querySelector('#ud-ok').style.display = ''; }
            else if (g < secret) { msg.className = 'msg up'; msg.textContent = `${g} → 업 ▲`; lo = Math.max(lo, g + 1); }
            else { msg.className = 'msg down'; msg.textContent = `${g} → 다운 ▼`; hi = Math.min(hi, g - 1); }
            if (!done) m.querySelector('#ud-range').textContent = `남은 범위: ${lo} ~ ${hi}`;
            inp.value = ''; inp.focus();
          }
          m.querySelector('#ud-go').addEventListener('click', go);
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
          m.querySelector('#ud-ok').addEventListener('click', () => { close(); resolve(seq); });
          m.parentElement.addEventListener('click', e => { if (e.target === m.parentElement || e.target.closest('[data-close]')) resolve(null); });
        });
    });
  }

  /* ---------- 이진 탐색 시뮬레이션 ---------- */
  function binarySeq(maxN, secret, opts) {
    opts = opts || {}; let lo = 1, hi = maxN; const seq = [];
    while (lo <= hi && seq.length < (opts.limit || 12)) {
      const mid = Math.floor((lo + hi) / 2); seq.push(mid);
      if (mid === secret) return { seq, found: true };
      if (mid < secret) lo = mid + (opts.noPlus ? 0 : 1); else hi = mid - (opts.noMinus ? 0 : 1);
    }
    return { seq, found: false };
  }

  /* ---------- 차트 ---------- */
  const charts = new WeakMap();
  function chart(canvas, cfg) {
    if (!window.Chart) { canvas.parentElement.innerHTML = '<p class="hint">그래프 도구를 불러오지 못했어요 (인터넷 연결 확인)</p>'; return null; }
    const old = charts.get(canvas); if (old) old.destroy();
    Chart.defaults.font.family = '"Noto Sans KR","Malgun Gothic",sans-serif';
    Chart.defaults.color = '#4A5262';
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 300 } }, cfg.options || {});
    const c = new Chart(canvas, cfg); charts.set(canvas, c); return c;
  }
  const PALETTE = ['#1F3B63', '#E0873A', '#2E9E6B', '#8E5BB5', '#C0392B', '#3D8FB6', '#B08A1E', '#6B7383'];

  /* ---------- 시작 ---------- */
  function boot(id, hooks) {
    wsId = id; page = hooks || {};
    const q = new URLSearchParams(location.search);
    if (q.get('view') === '1') {
      const v = LS.get('akn_view', null);
      if (v) { viewMode = true; store = v.data || {}; viewUser = v.user; document.body.classList.add('viewmode'); }
    }
    if (!viewMode) {
      if (id && !user()) { location.replace('index.html?next=' + encodeURIComponent(location.pathname.split('/').pop())); return false; }
      store = id ? LS.get(wsKey(id), {}) : {};
    }
    topbar();
    if (id) bottombar();
    return true;
  }
  function ready() {
    restore();
    document.dispatchEvent(new CustomEvent('akn:restored'));
    document.dispatchEvent(new CustomEvent('akn:change', { detail: { k: '*' } }));
    if (!viewMode && wsId) { const m = meta(); const st = $('#akn-save'); if (st) st.textContent = m.submitted[wsId] ? '제출함 ' + hhmm(m.submitted[wsId]) : (m.saved[wsId] ? '자동 저장됨' : ''); }
  }

  /* 다른 활동지에 저장된 내 값 읽기 (예: 8차시에서 6·7차시 숫자 가져오기) */
  function peek(otherWs, k) { const s = LS.get(wsKey(otherWs), {}); return s[k]; }

  window.AKN = {
    C, WS, TABS, LS, SS, $, $$, esc, num, parseSeq, round, avg, hhmm, now,
    user, setUser, who, uid, meta, wsKey,
    boot, ready, get, set, del, restore, dynTable, api, isDemo, submit, toast, modal,
    updownGame, binarySeq, chart, PALETTE, peek,
    get viewMode() { return viewMode; }, get store() { return store; }
  };
})();
