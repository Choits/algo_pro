/* ============================================================
   아키네이터의 비밀 – 공유 시트 연동 (Google Apps Script)
   구글 시트 › 확장 프로그램 › Apps Script 에 이 파일 내용을 그대로 붙여 넣으세요.
   ============================================================ */

// ★ 반드시 바꾸세요: 선생님 화면 비밀번호 (학생에게 알려 주지 마세요)
const TEACHER_KEY = '1127';

// 시트(탭) 구조 – 웹앱의 assets/common.js 와 같아야 합니다.
const TABS = {
  '제출': ['시각', '학급', '모둠', '번호', '활동지', '내용'],
  '게임기록': ['시각', '학급', '모둠', '번호', '활동지', '판', '범위', '전략', '부른수', '질문수'],
  '알고리즘비교': ['시각', '학급', '모둠', '번호', '활동지', '알고리즘', '최댓값', '최소', '최대'],
  '결정트리': ['시각', '학급', '모둠', '번호', '활동지', '첫질문', '예수', '아니오수', '합계', '평균', '최대'],
  '사용자테스트': ['시각', '학급', '모둠', '번호', '활동지', '구분', '테스트수', '맞힌수', '정답률', '평균질문수'],
  '동료평가': ['시각', '학급', '모둠', '번호', '활동지', '대상모둠', '주제', '근거', '잘한점', '질문제안']
};
const PUBLIC_TABS = ['게임기록', '알고리즘비교', '결정트리', '사용자테스트', '동료평가'];

/* ---------- 입구 ---------- */
function doGet(e) {
  try { return out(handleGet((e && e.parameter) || {})); }
  catch (err) { return out({ ok: false, error: String(err) }); }
}
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: '잘못된 요청입니다.' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    return out(handlePost(body));
  } catch (err) {
    return out({ ok: false, error: '잠시 후 다시 제출해 주세요. (' + err + ')' });
  } finally {
    try { lock.releaseLock(); } catch (e2) { }
  }
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 제출 ---------- */
function handlePost(b) {
  if (b.action !== 'submit') return { ok: false, error: 'unknown action' };
  const who = { cls: short(b.cls), grp: short(b.grp), num: short(b.num), ws: short(b.ws) };
  if (!who.cls || !who.grp || !who.num || !who.ws) return { ok: false, error: '학급·모둠·번호가 비어 있어요.' };
  const json = JSON.stringify(b.data || {});
  if (json.length > 48000) return { ok: false, error: '내용이 너무 길어요. 긴 글을 조금 줄여 주세요.' };
  const now = new Date();
  const base = [now, toNum(who.cls), toNum(who.grp), toNum(who.num), toNum(who.ws)];

  removeMine('제출', who);
  sheet('제출').appendRow(base.concat([json]));

  const rec = b.records || {};
  Object.keys(rec).forEach(function (t) {
    if (!TABS[t] || t === '제출') return;
    removeMine(t, who);
    const rows = (rec[t] || []).slice(0, 60).map(function (o) {
      return base.concat(TABS[t].slice(5).map(function (h) { return clean(o[h]); }));
    });
    if (rows.length) {
      const sh = sheet(t);
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, TABS[t].length).setValues(rows);
    }
  });
  return { ok: true };
}

/* ---------- 읽기 ---------- */
function handleGet(p) {
  const a = p.action;
  if (a === 'records') {
    if (PUBLIC_TABS.indexOf(p.tab) < 0) return { ok: false, error: '읽을 수 없는 시트입니다.' };
    return { ok: true, rows: readRows(p.tab).filter(function (r) { return !p.cls || same(r['학급'], p.cls); }) };
  }
  if (a === 'latest') {   // 같은 모둠(또는 나 자신)이 제출한 같은 활동지 (가장 최근)
    const rows = readRows('제출').filter(function (r) {
      return same(r['학급'], p.cls) && same(r['모둠'], p.grp) && same(r['활동지'], p.ws) && !(p.except && same(r['번호'], p.except)) && !(p.num && !same(r['번호'], p.num));
    });
    rows.sort(function (x, y) { return String(y['시각']).localeCompare(String(x['시각'])); });
    return { ok: true, row: rows.length ? rows[0] : null };
  }
  if (a === 'feedback') {
    return { ok: true, rows: readRows('동료평가').filter(function (r) { return same(r['학급'], p.cls) && same(r['대상모둠'], p.grp); }) };
  }
  if (a === 'all') {
    if (String(p.key) !== String(TEACHER_KEY)) return { ok: false, error: '비밀번호가 맞지 않습니다.' };
    const tabs = {};
    Object.keys(TABS).forEach(function (t) { tabs[t] = readRows(t).filter(function (r) { return !p.cls || same(r['학급'], p.cls); }); });
    return { ok: true, tabs: tabs };
  }
  return { ok: true, hello: '아키네이터의 비밀 공유 시트가 연결되었습니다.' };
}

/* ---------- 시트 도구 ---------- */
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(TABS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, TABS[name].length).setFontWeight('bold').setBackground('#E8EEF7');
  }
  return sh;
}
function readRows(name) {
  const v = sheet(name).getDataRange().getValues();
  const h = v[0];
  return v.slice(1).map(function (r) {
    const o = {};
    h.forEach(function (k, i) { o[k] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
}
function removeMine(name, w) {
  const sh = sheet(name);
  const v = sh.getDataRange().getValues();
  const h = v[0];
  const ci = ['학급', '모둠', '번호', '활동지'].map(function (k) { return h.indexOf(k); });
  for (let i = v.length - 1; i >= 1; i--) {
    if (same(v[i][ci[0]], w.cls) && same(v[i][ci[1]], w.grp) && same(v[i][ci[2]], w.num) && same(v[i][ci[3]], w.ws)) sh.deleteRow(i + 1);
  }
}
function same(a, b) { return String(a) === String(b); }
function short(v) { return String(v == null ? '' : v).slice(0, 10); }
function toNum(v) { return /^\d+$/.test(String(v)) ? Number(v) : String(v); }
function clean(v) {
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  let s = String(v).slice(0, 2000);
  if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;   // 수식으로 해석되지 않게
  return s;
}

/* 처음 한 번 실행하면 탭 6개가 만들어집니다 (선택) */
function setup() { Object.keys(TABS).forEach(sheet); }
