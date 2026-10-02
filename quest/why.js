/* 솔버 설명 — 결과 화면 버튼("솔버가 더 궁금해?") 다음 화면. 옆으로 넘기는 9장.
   질문 장(큰 말풍선) → 방법 세 장(Radius 자료: 가장 좋은 경로 · 맞물리는 주문 · 미리 가진 자산) → 판단 → 기다림 → 질문 장 → 이득 → Radius.
   장마다 위에는 거래 화면에서 쓰던 UI 조각으로 만든 그림 카드, 아래에는 글 한 덩어리. 글은 data.js 의 why.
   넘기는 법은 첫 화면 온보딩과 같다 — 맨 위 스토리 막대, 옆으로 밀기, 아래 양옆 꺾쇠, 마지막 장에서만 버튼.
   장에 들어오면 .is-on 이 붙고, 그림 속 움직임은 styles/why.css 가 맡는다. */
window.WHY = (function () {
  'use strict';
  var S = window.MODE;
  var DRAG_PX = 8;   /* 끌 때, 이보다 적게 움직이면 누른 것으로 본다 */
  function V() { return window.SCREENS; }   /* 숫자·칩 그리기는 screens.js 의 것을 쓴다(그리는 때에 찾는다) */
  function esc(v) { return V().esc(v); }
  function rich(text) { return esc(text).replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>'); }
  function pages() { return S.why.pages; }
  function isLast(i) { return i === pages().length - 1; }
  function best() { return S.solver.quotes.reduce(function (a, b) { return b.amount > a.amount ? b : a; }); }
  function wantName() { return S.tokens[S.solver.want.token].name; }

  /* 선 아이콘 — 그림 판 속 앱 화면에서 쓴다(색은 CSS 의 stroke) */
  var ICON = {
    route: '<svg viewBox="0 0 24 24"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><circle cx="16" cy="13.5" r="1.2"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M13 7l3 3"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>'
  };
  function ico(name, cls) { return '<span class="wy-ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + ICON[name] + '</span>'; }

  /* ── 장마다 그림 ── */
  var ART = {
    /* 방법 3(Internal Inventory): 솔버 지갑 화면 — 총 자산, 체인별 줄(토큰 아이콘이 겹쳐 쌓임). Robinhood Chain 줄의 USDG 가
       아래 iOS 알림으로 떨어진다(받은 금액 = 결과, 솔버 색) */
    stock: function () {
      var u = S.why.ui, v = V(), want = S.solver.want;
      var short = function (n) { return n >= 1e6 ? v.fmt(n / 1e6, 2) + 'M' : n >= 1000 ? v.fmt(n / 1000, 1) + 'K' : v.fmt(n, 1); };
      var usd = function (r) { return r[2] * S.tokens[r[1]].price; };
      var total = u.inventory.reduce(function (a, r) { return a + usd(r); }, 0);
      var chains = [];
      u.inventory.forEach(function (r) { if (chains.indexOf(r[0]) < 0) chains.push(r[0]); });
      var rows = chains.map(function (c, i) {
        var mine = u.inventory.filter(function (r) { return r[0] === c; });
        var hot = c === want.chain;
        return '<div class="ws-row' + (hot ? ' is-hot' : '') + '" style="--i:' + i + '"><img class="ws-chain" src="' + S.chains[c].icon + '" alt="">' +
          '<span class="ws-name">' + esc(S.chains[c].name) + '</span>' +
          '<span class="ws-toks">' + mine.map(function (r) { return '<img src="' + S.tokens[r[1]].icon + '" alt="">'; }).join('') + '</span>' +
          '<b>$' + short(mine.reduce(function (a, r) { return a + usd(r); }, 0)) + '</b>' +
          (hot ? '<span class="wy-drop" aria-hidden="true">' + v.tokIcon(want.token, want.chain) + '</span>' : '') + '</div>';
      }).join('');
      return '<div class="wy-card wy-wallet" aria-label="' + esc(u.wallet) + '">' +
          '<div class="ws-head"><img src="../brand/Radius_icon_primaryColor.svg" alt=""><span>' + esc(u.wallet) + '<small>' + esc(u.total) + '</small></span><b>$' + short(total) + '</b></div>' + rows + '</div>' +
        /* 받는 사람 = 유저의 지갑(Radius 로고가 아니다 — 사용자) */
        '<span class="wy-hand" aria-hidden="true"></span>' +   /* 솔버 지갑 → 내 지갑 */
        '<div class="wy-toast"><span class="wt-app" aria-hidden="true"><svg viewBox="0 0 24 24" data-icon="wallet"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><circle cx="16" cy="13.5" r="1.2"/></svg></span>' +
          /* 위: 큰 금액 한 줄, 아래: 내 지갑 · 체인 한 줄(사용자). "지금"은 뺐다 — 자리만 깨뜨렸다 */
          '<span class="wt-text"><b>+' + v.fmt(best().amount, 2) + ' ' + esc(wantName()) + '</b><small>' + esc(u.myWallet) + ' · ' + esc(S.chains[want.chain].name) + '</small></span></div>';
    },
    /* 방법 2(Ring Trading): 정반대로 바꾸려는 두 주문 — 사이에 반듯한 X 자 화살표 두 개.
       내 ETH 는 왼쪽 위(너) → 오른쪽 아래(다른 사람), 상대 USDG 는 왼쪽 아래 → 오른쪽 위(너). 동전이 화살표를 따라 엇갈려 간다 */
    ring: function () {
      var u = S.why.ui, v = V(), pay = S.solver.pay, want = S.solver.want, got = best().amount;
      /* 주문 카드: 머리말(누구의 주문 + 끝나면 "완료"), 아래 내는 것 → 받는 것을 큰 금액과 토큰 아이콘으로 */
      var side = function (title, from, fromAmt, to, toAmt, cls) {
        return '<div class="wy-ord ' + cls + '"><div class="wo-head"><span>' + esc(title) + '</span><em>' + esc(S.pending.done) + '</em></div>' +
          '<div class="wo-body"><span class="wo-leg">' + v.tokIcon(from.token, from.chain) + '<span class="wo-t"><small>' + esc(S.ui.swap.pay) + '</small><b>' + fromAmt + ' ' + esc(S.tokens[from.token].name) + '</b></span></span>' +
          '<span class="wy-to" aria-hidden="true">→</span>' +
          '<span class="wo-leg">' + v.tokIcon(to.token, to.chain) + '<span class="wo-t"><small>' + esc(S.ui.swap.get) + '</small><b>' + toAmt + ' ' + esc(S.tokens[to.token].name) + '</b></span></span></div></div>';
      };
      var head = function (id, cls) {
        return '<marker id="' + id + '" class="' + cls + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z"/></marker>';
      };
      /* 화살표 끝은 카드 속 토큰 자리 — 왼쪽(낼 토큰) 약 25%, 오른쪽(받을 토큰) 약 66%. 좌표는 카드 폭 320 기준, why.css 의 cqw 와 같게 */
      var cross = '<div class="wy-cross" aria-hidden="true"><svg viewBox="0 0 320 72"><defs>' + head('wy-h-a', 'h-a') + head('wy-h-b', 'h-b') + '</defs>' +
        '<line class="l-a" x1="80" y1="8" x2="211" y2="64" marker-end="url(#wy-h-a)"/>' +
        '<line class="l-b" x1="80" y1="64" x2="211" y2="8" marker-end="url(#wy-h-b)"/></svg>' +
        '<span class="c-a">' + v.tokIcon(pay.token, pay.chain) + '</span><span class="c-b">' + v.tokIcon(want.token, want.chain) + '</span></div>';
      return '<div class="wy-ring">' + side(u.ringYouOrder, pay, v.fmt(pay.amount, 3), want, v.fmt(got, 2), 'is-you') + cross +
        side(u.ringOtherOrder, want, v.fmt(got, 2), pay, v.fmt(pay.amount, 3), 'is-other') + '</div>';
    },
    /* 방법 1(Optimal On-chain Routing): 스왑 앱의 경로 시트 — 큰 받는 수량 + "최적 경로" 배지, 아래 Ethereum → 거래소 → 브릿지 → Robinhood Chain.
       다른 두 경로 카드는 뒤에 부채처럼 겹쳐 있다가 물러난다 */
    route: function () {
      var u = S.why.ui, v = V(), got = best().amount, pay = S.solver.pay, want = S.solver.want;
      var bestR = u.routes.filter(function (r) { return r[2] === 0; })[0];
      var ghosts = u.routes.filter(function (r) { return r[2] !== 0; }).map(function (r, i) {
        return '<div class="wy-card wy-ghost g' + (i + 1) + '" aria-hidden="true"><span>' + esc(r[0]) + ' → ' + esc(r[1]) + '</span><b>' + v.fmt(got + r[2], 2) + '</b></div>';
      }).join('');
      var ic = { swap: '<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>', bridge: '<svg viewBox="0 0 24 24"><path d="M3 17h18M5 17c0-5 3-8 7-8s7 3 7 8M9 17v-4M15 17v-4"/></svg>' };
      var node = function (img, label, i) { return '<li style="--i:' + i + '"><span class="sp-ic">' + img + '</span><small>' + esc(label) + '</small></li>'; };
      return '<div class="wy-stack">' + ghosts +
        '<div class="wy-card wy-sheet" aria-label="' + esc(u.routeHead) + '">' +
          '<div class="sh-head"><span>' + esc(u.get) + '</span><em>' + esc(u.bestRoute) + '</em></div>' +
          '<div class="sh-amt">' + v.tokIcon(want.token, want.chain) + '<b>' + v.fmt(got, 2) + '</b><span>' + esc(wantName()) + '</span></div>' +
          '<ol class="sh-path">' +
            node('<img src="' + S.chains[pay.chain].icon + '" alt="">', S.chains[pay.chain].name, 0) +
            node(ic.swap, bestR[0], 1) + node(ic.bridge, bestR[1], 2) +
            node('<img src="' + S.chains[want.chain].icon + '" alt="">', S.chains[want.chain].name, 3) +
          '</ol></div></div>';
    },
    /* 판단: 솔버 머릿속 생각 말풍선 — 생각(네 가지 체크) → 결심(말풍선 속 결론 한 줄) → 행동(견적 쪽지가 날아간다).
       버튼으로 두면 사람이 누르는 것처럼 보여 솔버의 결심이 안 읽혔다(사용자) */
    decide: function () {
      var u = S.why.ui, v = V(), n = u.checks.length;
      /* 말풍선 판은 뒤에 깐 한 층(.wy-cloud-bg): 둥근 네모 + 왼쪽 아래 작은 동그라미 꼬리 둘 */
      return '<div class="wy-think"><div class="wy-cloud"><span class="wy-cloud-bg" aria-hidden="true"><i class="wy-puff p1"></i><i class="wy-puff p2"></i></span>' +
        u.checks.map(function (c, i) { return '<span class="wy-check" style="--i:' + i + '"><i aria-hidden="true"></i>' + esc(c) + '<em>' + esc(u.checkVals[i]) + '</em></span>'; }).join('') +   /* 머릿속 계산이 진짜처럼 — 값은 예시 */
        '<p class="wy-decide" style="--n:' + n + '">' + esc(u.decided) + '</p></div>' +
        /* 프로필: 로고 위, 이름 아래(사용자: 일렬일 이유가 없다). 결론이 뜨면 로고에서 견적 종이비행기가 오른쪽 위로 날아간다 */
        '<div class="wy-solver" style="--n:' + n + '"><img class="wy-solver-ic" src="../brand/Radius_icon_primaryColor.svg" alt=""><b>' + esc(u.solverName) + '</b></div>' +
        '<div class="wy-quote" style="--n:' + n + '" aria-label="' + esc(u.quoteTag) + ' ' + v.fmt(best().amount, 2) + ' ' + esc(wantName()) + '">' +
          '<span class="wq-in"><svg class="wy-plane" viewBox="0 0 24 24" aria-hidden="true"><path class="pl-a" d="M2 11 22 2 15 22l-4-8z"/><path class="pl-b" d="M11 14 22 2"/></svg>' +
          '<span class="wq-tag">' + esc(u.quoteTag) + ' <b>' + v.fmt(best().amount, 2) + ' ' + esc(wantName()) + '</b></span></span></div></div>';
    },
    /* 기다림: 세로 타임라인(사용자 선택 — 막대는 무슨 뜻인지 안 읽혔다).
       지금(너, 서명) → ~25초(너, USDG 도착 · 완료 — 너는 여기서 끝) → 나중에(솔버, ETH 정산 받기) → 나중에(솔버, 자산 다시 채우기) */
    later: function () {
      var u = S.why.ui, v = V();
      /* 단계마다 아이콘 — 너: 서명(펜) → USDG 도착(동전, 완료). 솔버: ETH 정산(동전) → 리밸런싱(화살표) */
      var coin = function (t, c) { return '<span class="wy-ico is-coin" aria-hidden="true"><img src="' + S.tokens[t].icon + '" alt=""></span>'; };
      var rows = [
        [u.now, u.you, u.youSteps[0], 'is-you', ico('pen')],
        ['~' + v.dur(S.solver.wait), u.you, u.youSteps[1], 'is-you is-end', coin(S.solver.want.token)],
        [u.later, u.solver, u.solverSteps[0], 'is-solver', coin(S.solver.pay.token)],
        [u.later, u.solver, u.solverSteps[1], 'is-solver', ico('refresh')]
      ];
      return '<ol class="wy-card wy-tl">' + rows.map(function (r, i) {
        return '<li class="' + r[3] + '" style="--i:' + i + '"><i aria-hidden="true"></i>' + r[4] +
          '<span class="tl-text"><small>' + esc(r[1]) + ' · <time>' + esc(r[0]) + '</time></small><b>' + esc(r[2]) + '</b></span>' +
          (/is-end/.test(r[3]) ? '<em>' + esc(S.pending.done) + '</em>' : '') + '</li>';
      }).join('') + '</ol>';
    },
    /* 이득: 낸 것과 받은 것, 그 차이 — 막대(차이가 0.8% 라 안 보였다)·알약(버튼처럼 보였다) 대신 세로 계산식 */
    earn: function () {
      var u = S.why.ui, v = V(), pay = S.solver.pay, want = S.solver.want;
      var usd = pay.amount * S.tokens[pay.token].price, got = best().amount;
      /* 영수증처럼: 낸 것(ETH)·받은 것(USDG) 줄에 토큰 아이콘과 수량 → 굵은 줄 → 차이(솔버 쪽, 크게) → 그 안에서 나가는 비용 → 솔버 수익 */
      var leg = function (label, token, chain, qty, val, cls, i) {
        return '<div class="wy-sum-row ' + cls + '" style="--i:' + i + '">' + v.tokIcon(token, chain) +
          '<span class="sr-t"><small>' + esc(label) + '</small>' + qty + ' ' + esc(S.tokens[token].name) + '</span><b>' + val + '</b></div>';
      };
      return '<div class="wy-card wy-sum">' +
        leg(u.paid, pay.token, pay.chain, v.fmt(pay.amount, 3), v.money(usd), 'is-paid', 0) +
        leg(u.got, want.token, want.chain, v.fmt(got, 2), '− ' + v.money(got), 'is-got', 1) +
        '<div class="wy-sum-row is-diff" style="--i:2"><span class="sr-t">' + esc(u.diff) + '</span><b>' + v.money(usd - got) + '</b></div>' +
        '<ul class="wy-sum-cost">' + u.costs.map(function (c, i) { return '<li style="--i:' + i + '"><span>− ' + esc(c) + '</span></li>'; }).join('') +
          '<li class="is-profit" style="--i:' + u.costs.length + '"><b>= ' + esc(u.profit) + '</b></li></ul></div>';
    },
    /* Radius: 주문마다 받을지 거절할지 고른다(인터뷰 링크는 글 아래 버튼) */
    radius: function () {
      var u = S.why.ui;
      /* 주문 검토 화면: 머리줄(Radius 로고 + 이름), 주문 줄마다 토큰 쌍 + 수량 → 받음(솔버 색) / 거절(중립). 쌍·수량은 예시 */
      var chainOf = function (t) { return t === S.solver.want.token ? S.solver.want.chain : 'ethereum'; };
      return '<div class="wy-card wy-picks"><div class="wp-head"><img class="wy-logo" src="../brand/Radius_icon_primaryColor.svg" alt=""><b>' + esc(u.solverName) + '</b></div>' +
        u.orderPairs.map(function (o, i) {
          return '<div class="wy-pick' + (o[3] ? ' is-ok' : ' is-no') + '" style="--i:' + i + '"><span class="wp-pair">' + V().tokIcon(o[0], chainOf(o[0])) + V().tokIcon(o[1], chainOf(o[1])) + '</span>' +
            '<span class="wp-name"><small>' + esc(u.orders[i]) + '</small>' + esc(o[2]) + ' ' + esc(S.tokens[o[0]].name) + ' → ' + esc(S.tokens[o[1]].name) + '</span>' +
            '<em>' + esc(o[3] ? u.accept : u.decline) + '</em></div>';
        }).join('') + '</div>';
    }
  };

  /* 토스식 문법(사용자 선택): 위에는 장마다 같은 둥근 그림 판(.wy-stage) 위에 앱 UI 조각, 아래에는 이름표 → 굵은 제목 → 회색 설명.
     방법 장은 "방법 1 · 가장 좋은 경로" 를 이름표(방법 1) + 제목(가장 좋은 경로)으로 나눈다 */
  function eyebrow(m) { return '<p class="wy-eyebrow">' + esc(m.split(' · ')[0]) + '</p>'; }
  function titleOf(p) { return p.method ? p.method.split(' · ')[1] || p.method : p.title; }
  /* 첫 질문 장: "세 가지야" 위에 세 방법 이름을 미리 보여 준다 — 질문 장이 비어 보였다 */
  function ways(p) {
    if (p.key !== 'askFast') return '';
    return '<div class="wy-ways">' + pages().filter(function (x) { return x.method; }).map(function (x, i) {
      var parts = x.method.split(' · ');
      return '<span style="--i:' + i + '">' + ico({ route: 'route', ring: 'swap', stock: 'wallet' }[x.key] || 'route') + '<em>' + (i + 1) + '</em>' + esc(parts[1] || parts[0]) + '</span>';
    }).join('') + '</div>';
  }
  /* 두 번째 질문 장: 질문 아래 Radius 솔버가 답을 쓰는 중("…") — 대화처럼 다음 장으로 이어진다 */
  function typing(p) {
    if (p.key !== 'askEarn') return '';
    return '<div class="wy-typing"><img src="../brand/Radius_icon_primaryColor.svg" alt=""><span aria-hidden="true"><i></i><i></i><i></i></span></div>';
  }
  function copy(p) {
    if (p.ask) return '<div class="wy-copy is-ask"><h3 class="wy-title">' + rich(p.text) + '</h3></div>';   /* 질문 장은 답 한 줄이 곧 제목 */
    return '<div class="wy-copy">' + (p.method ? eyebrow(p.method) : '') + '<h3 class="wy-title">' + esc(titleOf(p)) + '</h3>' +
      '<p class="wy-body">' + rich(p.text) + '</p>' +
      (p.key === 'radius' ? '<a class="wy-link" href="' + esc(S.why.url) + '" target="_blank" rel="noopener noreferrer">' + esc(S.why.link) + '<i aria-hidden="true">→</i></a>' : '') +
      '</div>';
  }
  function page(p, i) {
    return '<section class="wy-page' + (i === 0 ? ' is-on' : '') + '" data-key="' + esc(p.key) + '" aria-label="' + (i + 1) + ' / ' + pages().length + '">' +
      '<div class="wy-stage' + (p.ask ? ' is-ask' : '') + '">' +
        (p.ask ? '<p class="wy-ask">' + esc(p.ask) + '</p>' + ways(p) + typing(p) : '<div class="wy-art">' + ART[p.key]() + '</div>') +
      '</div>' + copy(p) + '</section>';
  }
  function dots(at) {
    return '<div class="ob-dots">' + pages().map(function (p, i) {
      return '<button type="button" data-wy-go="' + i + '" aria-label="' + (i + 1) + ' / ' + pages().length + '"' +
        (i < at ? ' class="is-past"' : '') + (i === at ? ' aria-current="step"' : '') + '></button>';
    }).join('') + '</div>';
  }
  function html(st) {
    var at = Math.min(st.why || 0, pages().length - 1), last = isLast(at);
    return '<div class="canvas why' + (at === 0 ? ' at-first' : '') + '">' + dots(at) +
      '<div class="wy-pages" tabindex="0">' + pages().map(page).join('') + '</div></div>' +
      '<div class="bar ob-bar' + (last ? ' is-ready' : '') + '">' +
        '<button class="ob-prev" type="button" aria-label="' + esc(S.ui.a11y.prev) + '"' + (last || at === 0 ? ' tabindex="-1"' : '') + '><span aria-hidden="true">‹</span></button>' +
        '<button class="ob-next" type="button" aria-label="' + esc(S.ui.a11y.next) + '"' + (last ? ' tabindex="-1"' : '') + '><span aria-hidden="true">›</span></button>' +
        '<button class="cta now" type="button" data-act="restart"' + (last ? '' : ' tabindex="-1"') + '>' + esc(S.why.cta) + '</button>' +
      '</div>';
  }

  /* ── 넘기기 ── 첫 화면 온보딩과 같은 손맛 */
  function mount(screen, st, remember) {
    var pager = screen.querySelector('.wy-pages');
    if (!pager) return;
    var canvas = screen.querySelector('.canvas.why'), bar = screen.querySelector('.ob-bar');
    var at = Math.min(st.why || 0, pages().length - 1), n = pages().length;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pager.scrollLeft = at * pager.clientWidth;
    show(at);

    function show(i) {
      at = i;
      Array.prototype.forEach.call(pager.children, function (el, j) { el.classList.toggle('is-on', j === i); });
      Array.prototype.forEach.call(screen.querySelectorAll('[data-wy-go]'), function (b) {
        var j = Number(b.dataset.wyGo);
        if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-past', j < i);
      });
      canvas.classList.toggle('at-first', i === 0);
      bar.classList.toggle('is-ready', isLast(i));
      bar.querySelector('.ob-next').tabIndex = isLast(i) ? -1 : 0;
      bar.querySelector('.ob-prev').tabIndex = isLast(i) || i === 0 ? -1 : 0;
      bar.querySelector('.cta').tabIndex = isLast(i) ? 0 : -1;
      remember(i);
    }
    function go(i) { pager.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * pager.clientWidth, behavior: reduced ? 'auto' : 'smooth' }); }

    var ticking = false;
    pager.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var i = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth));
        if (i !== at) show(i);
      });
    }, { passive: true });
    bar.querySelector('.ob-next').addEventListener('click', function () { go(at + 1); });
    bar.querySelector('.ob-prev').addEventListener('click', function () { go(at - 1); });
    screen.querySelector('.ob-dots').addEventListener('click', function (e) {
      var b = e.target.closest('[data-wy-go]');
      if (b) go(Number(b.dataset.wyGo));
    });
    pager.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1); }
    });
    drag(canvas, pager, go, n);
  }
  /* 마우스로 끌어 넘기기(손가락은 브라우저가 민다) */
  function drag(area, pager, go, n) {
    var x0 = 0, y0 = 0, left0 = 0, isDown = false, isDragging = false;
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a') || e.pointerType !== 'mouse') return;
      isDown = true; isDragging = false; x0 = e.clientX; y0 = e.clientY; left0 = pager.scrollLeft;
    });
    area.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - x0;
      if (!isDragging) {
        if (Math.abs(dx) < DRAG_PX || Math.abs(dx) < Math.abs(e.clientY - y0)) return;
        isDragging = true;
        area.setPointerCapture(e.pointerId);
        pager.classList.add('dragging');
      }
      pager.scrollLeft = left0 - dx;
    });
    function end(e) {
      if (!isDown) return;
      isDown = false;
      if (!isDragging) return;
      isDragging = false;
      pager.classList.remove('dragging');
      var start = Math.round(left0 / Math.max(1, pager.clientWidth));
      go(Math.max(0, Math.min(n - 1, start + (e.clientX - x0 < 0 ? 1 : -1))));
    }
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);
  }

  return { html: html, mount: mount };
})();
