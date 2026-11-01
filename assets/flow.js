/* 활동지 3 ④ – 업다운 이진 탐색 순서도 (빈칸 4곳은 입력 칸) */
window.AKN_FLOW = function (host, keys) {
  const W = 1000, H = 1290, cx = 400, xl = 96, xr = 800, xm = 720;
  const Y = { start: 50, init: 155, join: 238, d1: 330, mid: 470, cnt: 572, ask: 674, d2: 796, d3: 980, upd: 1114, back: 1180, end: 500, out: 796 };
  const s = [];
  const T = (x, y, t, cls, anchor) => s.push(`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor || 'middle'}">${t}</text>`);
  const box = (x, y, w, h, k, label) => s.push(`<foreignObject x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}"><input xmlns="http://www.w3.org/1999/xhtml" type="text" data-k="${k}" aria-label="${label}" maxlength="6"/></foreignObject>`);
  const term = (x, y, t) => { s.push(`<rect x="${x - 85}" y="${y - 28}" width="170" height="56" rx="28" class="f-term"/>`); T(x, y + 8, t, 'f-termt'); };
  const proc = (x, y, w) => s.push(`<rect x="${x - w / 2}" y="${y - 32}" width="${w}" height="64" rx="6" class="f-proc"/>`);
  const io = (x, y, w, t) => { const k = 22; s.push(`<polygon points="${x - w / 2 + k},${y - 32} ${x + w / 2 + k},${y - 32} ${x + w / 2 - k},${y + 32} ${x - w / 2 - k},${y + 32}" class="f-io"/>`); T(x, y + 7, t, 'f-iot'); };
  const dec = (x, y, w, h) => s.push(`<polygon points="${x},${y - h / 2} ${x + w / 2},${y} ${x},${y + h / 2} ${x - w / 2},${y}" class="f-dec"/>`);
  const line = (pts, arrow = true) => s.push(`<path d="M${pts.map(p => p.join(',')).join(' L')}" class="f-ln" ${arrow ? 'marker-end="url(#f-ar)"' : ''}/>`);
  const pill = (x, y, yes) => { const w = yes ? 40 : 62; s.push(`<rect x="${x - w / 2}" y="${y - 13}" width="${w}" height="26" rx="13" class="${yes ? 'f-py' : 'f-pn'}"/>`); T(x, y + 6, yes ? '예' : '아니오', yes ? 'f-pyt' : 'f-pnt'); };

  line([[cx, Y.start + 28], [cx, Y.init - 35]]);
  line([[cx, Y.init + 32], [cx, Y.d1 - 65]]);
  line([[cx, Y.d1 + 62], [cx, Y.mid - 35]]);
  line([[cx, Y.mid + 32], [cx, Y.cnt - 35]]);
  line([[cx, Y.cnt + 32], [cx, Y.ask - 35]]);
  line([[cx, Y.ask + 32], [cx, Y.d2 - 59]]);
  line([[cx, Y.d2 + 56], [cx, Y.d3 - 59]]);
  line([[cx, Y.d3 + 56], [cx, Y.upd - 35]]);
  line([[cx + 150, Y.d1], [xr, Y.d1], [xr, Y.end - 31]]);
  line([[cx + 110, Y.d2], [xr - 100, Y.d2]]);
  line([[xr, Y.out - 32], [xr, Y.end + 31]]);
  line([[cx + 110, Y.d3], [xm, Y.d3], [xm, Y.upd - 35]]);
  line([[cx, Y.upd + 32], [cx, Y.back]], false);
  line([[xm, Y.upd + 32], [xm, Y.back], [xl, Y.back], [xl, Y.join], [cx - 8, Y.join]]);
  s.push(`<circle cx="${cx}" cy="${Y.join}" r="6" fill="#8E99AB"/>`);
  s.push(`<text x="${xl - 14}" y="${(Y.join + Y.back) / 2}" class="f-loop" transform="rotate(-90 ${xl - 14} ${(Y.join + Y.back) / 2})" text-anchor="middle">다시 반복</text>`);

  term(cx, Y.start, '시작');
  proc(cx, Y.init, 400); T(cx, Y.init + 7, '최소 ← 1,  최대 ← 30,  횟수 ← 0', 'f-proct');
  dec(cx, Y.d1, 300, 124); T(cx - 44, Y.d1 + 7, '최소', 'f-dect', 'end'); box(cx, Y.d1, 70, 40, keys[0], '빈칸 ㉠'); T(cx + 44, Y.d1 + 7, '최대?', 'f-dect', 'start');
  proc(cx, Y.mid, 580); T(cx + 168, Y.mid + 7, '가운데 ← (최소+최대)÷2, 소수점 이하', 'f-proct', 'end'); box(cx + 220, Y.mid, 90, 40, keys[1], '빈칸 ㉡');
  proc(cx, Y.cnt, 260); T(cx, Y.cnt + 7, '횟수 ← 횟수 + 1', 'f-proct');
  io(cx, Y.ask, 360, '가운데 수를 부르고 대답 듣기');
  dec(cx, Y.d2, 220, 112); T(cx, Y.d2 + 7, '정답?', 'f-dect');
  dec(cx, Y.d3, 220, 112); T(cx, Y.d3 + 7, '업?', 'f-dect');
  proc(cx, Y.upd, 260); T(cx + 28, Y.upd + 7, '최소 ← 가운데', 'f-proct', 'end'); box(cx + 76, Y.upd, 76, 40, keys[2], '빈칸 ㉢');
  proc(xm, Y.upd, 260); T(xm + 28, Y.upd + 7, '최대 ← 가운데', 'f-proct', 'end'); box(xm + 76, Y.upd, 76, 40, keys[3], '빈칸 ㉣');
  io(xr, Y.out, 190, '횟수 말하기');
  term(xr, Y.end, '끝');
  pill(cx + 40, Y.d1 + 88, true); pill(cx + 215, Y.d1 - 20, false);
  pill(cx + 152, Y.d2 - 20, true); pill(cx + 48, Y.d2 + 90, false);
  pill(cx + 40, Y.d3 + 82, true); pill(cx + 180, Y.d3 - 20, false);
  // 범례
  const ly = H - 30;
  s.push(`<g transform="translate(60,${ly})" class="f-lg">
    <rect x="0" y="-14" width="44" height="24" rx="12" fill="#1F3B63"/><text x="54" y="4">시작·끝</text>
    <rect x="150" y="-14" width="44" height="24" rx="3" fill="#fff" stroke="#1F3B63" stroke-width="2"/><text x="204" y="4">처리</text>
    <polygon points="290,-14 334,-14 326,10 282,10" fill="#E9F6EF" stroke="#2E9E6B" stroke-width="2"/><text x="346" y="4">입력·출력</text>
    <polygon points="470,-16 494,-2 470,12 446,-2" fill="#FFF7E8" stroke="#E2B04A" stroke-width="2"/><text x="506" y="4">판단</text>
    <line x1="584" x2="626" y1="-2" y2="-2" stroke="#8E99AB" stroke-width="2.2" marker-end="url(#f-ar)"/><text x="638" y="4">흐름선</text></g>`);

  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="업다운 이진 탐색 순서도 빈칸형">
  <style>
   .f-ln{fill:none;stroke:#8E99AB;stroke-width:2.2;stroke-linejoin:round}
   .f-term{fill:#1F3B63}.f-termt{fill:#fff;font-size:22px;font-weight:800}
   .f-proc{fill:#fff;stroke:#1F3B63;stroke-width:2.2}.f-proct{fill:#1F3B63;font-size:19px;font-weight:700}
   .f-dec{fill:#FFF7E8;stroke:#E2B04A;stroke-width:2.2}.f-dect{fill:#8A5D0B;font-size:19px;font-weight:800}
   .f-io{fill:#E9F6EF;stroke:#2E9E6B;stroke-width:2.2}.f-iot{fill:#1E6B47;font-size:18px;font-weight:700}
   .f-py{fill:#E6F4EC;stroke:#9FD3B6}.f-pn{fill:#F1F2F5;stroke:#C9CDD6}
   .f-pyt{fill:#23784F;font-size:15px;font-weight:700}.f-pnt{fill:#5D6576;font-size:15px;font-weight:700}
   .f-loop{font-size:15px;fill:#6B7383}.f-lg text{font-size:16px;fill:#3A4150}
   text{font-family:"Noto Sans KR","Malgun Gothic",sans-serif}
  </style>
  <defs><marker id="f-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#8E99AB"/></marker></defs>
  ${s.join('\n')}</svg>`;
};
