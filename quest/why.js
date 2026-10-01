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

  /* ── 장마다 그림 ── */
  var ART = {
    /* 방법 3(Internal Inventory): 여러 체인 속 여러 돈(3×3). Robinhood Chain 의 USDG 칸에서 동전이 사용자에게 바로 슝 떨어진다 */
    stock: function () {
      var u = S.why.ui, v = V(), want = S.solver.want;
      var short = function (n) { return n >= 1000 ? v.fmt(n / 1000, 1) + 'K' : v.fmt(n, 1); };
      var tiles = u.inventory.map(function (r, i) {
        var hot = r[0] === want.chain && r[1] === want.token;
        return '<div class="wy-tile' + (hot ? ' is-hot' : '') + '" style="--i:' + i + '">' + v.tokIcon(r[1], r[0]) +
          '<b>' + short(r[2]) + '</b><small>' + esc(S.tokens[r[1]].name) + '</small>' +
          (hot ? '<span class="wy-drop" aria-hidden="true">' + v.tokIcon(r[1], r[0]) + '</span>' : '') + '</div>';
      }).join('');
      return '<div class="wy-card"><div class="wy-head">' + esc(u.wallet) + '</div><div class="wy-tiles">' + tiles + '</div></div>' +
        '<div class="wy-user"><span class="wy-avatar" aria-hidden="true"></span><b>+' + v.fmt(best().amount, 2) + ' ' + esc(wantName()) + '</b></div>';
    },
    /* 방법 2(Ring Trading): 정반대로 바꾸려는 두 주문 — 사이에 반듯한 X 자 화살표 두 개.
       내 ETH 는 왼쪽 위(너) → 오른쪽 아래(다른 사람), 상대 USDG 는 왼쪽 아래 → 오른쪽 위(너). 동전이 화살표를 따라 엇갈려 간다 */
    ring: function () {
      var u = S.why.ui, v = V(), pay = S.solver.pay, want = S.solver.want, got = best().amount;
      var side = function (who, from, fromAmt, to, cls) {
        return '<div class="wy-ord ' + cls + '"><span class="wy-who">' + esc(who) + '</span>' +
          v.tokIcon(from.token, from.chain) + '<b>' + fromAmt + ' ' + esc(S.tokens[from.token].name) + '</b>' +
          '<span class="wy-to" aria-hidden="true">→</span>' + v.tokIcon(to.token, to.chain) + '<b>' + esc(S.tokens[to.token].name) + '</b></div>';
      };
      var head = function (id, cls) {
        return '<marker id="' + id + '" class="' + cls + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z"/></marker>';
      };
      var cross = '<div class="wy-cross" aria-hidden="true"><svg viewBox="0 0 200 72"><defs>' + head('wy-h-a', 'h-a') + head('wy-h-b', 'h-b') + '</defs>' +
        '<line class="l-a" x1="46" y1="8" x2="154" y2="64" marker-end="url(#wy-h-a)"/>' +
        '<line class="l-b" x1="46" y1="64" x2="154" y2="8" marker-end="url(#wy-h-b)"/></svg>' +
        '<span class="c-a">' + v.tokIcon(pay.token, pay.chain) + '</span><span class="c-b">' + v.tokIcon(want.token, want.chain) + '</span></div>';
      return '<div class="wy-ring">' + side(u.ringYou, pay, v.fmt(pay.amount, 3), want, 'is-you') + cross +
        side(u.ringOther, want, v.fmt(got, 2), pay, 'is-other') + '</div>';
    },
    /* 방법 1(Optimal On-chain Routing): 여러 거래소·브릿지 경로를 비교해 가장 많이 받는 길 */
    route: function () {
      var u = S.why.ui, v = V(), got = best().amount;
      return '<div class="wy-card"><div class="wy-head">' + esc(u.routeHead) + '</div>' + u.routes.map(function (r, i) {
        var isBest = r[2] === 0;
        return '<div class="wy-route' + (isBest ? ' is-best' : '') + '" style="--i:' + i + '"><span>' + esc(r[0]) + ' <em>→</em> ' + esc(r[1]) + '</span>' +
          '<b>' + v.fmt(got + r[2], 2) + ' ' + esc(wantName()) + '</b><i aria-hidden="true"></i></div>';
      }).join('') + '</div>';
    },
    /* 판단: 솔버 머릿속 생각 말풍선 — 가격·위험·가진 자산·리밸런싱 비용이 하나씩 체크되고, 다 되면 견적 보내기가 켜진다(사용자) */
    decide: function () {
      var u = S.why.ui, n = u.checks.length;
      /* 말풍선 판은 뒤에 깐 한 층(.wy-cloud-bg): 둥근 네모 + 왼쪽 아래 작은 동그라미 꼬리 둘 */
      return '<div class="wy-think"><div class="wy-cloud"><span class="wy-cloud-bg" aria-hidden="true"><i class="wy-puff p1"></i><i class="wy-puff p2"></i></span>' + u.checks.map(function (c, i) {
          return '<span class="wy-check" style="--i:' + i + '"><i aria-hidden="true"></i>' + esc(c) + '</span>';
        }).join('') + '</div>' +
        '<div class="wy-solver"><img class="wy-solver-ic" src="../brand/Radius_icon_primaryColor.svg" alt=""><b>' + esc(u.solverName) + '</b></div></div>' +   /* 생각하는 건 Radius 솔버(사용자) */
        '<div class="wy-go" style="--n:' + n + '">' + esc(u.send) + '</div>';
    },
    /* 기다림: 두 줄 시간표 — 너는 금방 끝나고, 솔버의 정산·다시 채우기는 뒤에서 천천히 */
    later: function () {
      var u = S.why.ui, v = V();
      var lane = function (who, steps, cls, tail) {
        return '<div class="wy-lane ' + cls + '"><span class="wy-who">' + esc(who) + '</span><div class="wy-steps">' + steps.map(function (s, i) {
          return '<div class="wy-step" style="--i:' + i + '"><span class="wy-fill"><i></i></span>' + esc(s) + '</div>';
        }).join('') + '</div><small>' + esc(tail) + '</small></div>';
      };
      return '<div class="wy-card wy-time">' + lane(u.you, u.youSteps, 'is-you', '~' + v.dur(S.solver.wait)) +
        lane(u.solver, u.solverSteps, 'is-solver', u.later) + '</div>';
    },
    /* 이득: 낸 것과 받은 것, 그 차이. 막대는 실제 비율 그대로(부풀리지 않는다), 차이는 숫자로 크게 */
    earn: function () {
      var u = S.why.ui, v = V();
      var usd = S.solver.pay.amount * S.tokens[S.solver.pay.token].price, got = best().amount;
      var bar = function (label, val, cls) {
        return '<div class="wy-bar-row ' + cls + '"><span>' + esc(label) + '</span><b>' + v.money(val) + '</b>' +
          '<span class="wy-bar" style="--w:' + (val / usd * 100).toFixed(2) + '%"><i></i></span></div>';
      };
      return '<div class="wy-card">' + bar(u.paid, usd, 'is-paid') + bar(u.got, got, 'is-got') +
        '<div class="wy-diff"><span>' + esc(u.diff) + '</span><b>' + v.money(usd - got) + '</b></div>' +
        '<div class="wy-costs">' + u.costs.map(function (c, i) { return '<span style="--i:' + i + '">− ' + esc(c) + '</span>'; }).join('') +
          '<span class="wy-profit" style="--i:' + u.costs.length + '">= ' + esc(u.profit) + '</span></div></div>';
    },
    /* 5장: Radius — 주문마다 받을지 거절할지 고른다. 인터뷰 링크 */
    radius: function () {
      var u = S.why.ui;
      return '<div class="wy-card"><img class="wy-logo" src="../brand/Radius_icon_primaryColor.svg" alt="Radius">' +
        u.orders.map(function (o, i) {
          var ok = i !== 1;
          return '<div class="wy-pick' + (ok ? ' is-ok' : ' is-no') + '" style="--i:' + i + '"><span>' + esc(o) + '</span><em>' + esc(ok ? u.accept : u.decline) + '</em></div>';
        }).join('') + '</div>' +
        '<a class="wy-link" href="' + esc(S.why.url) + '" target="_blank" rel="noopener noreferrer">' + esc(S.why.link) + ' ↗</a>';
    }
  };

  function page(p, i) {
    return '<section class="wy-page' + (i === 0 ? ' is-on' : '') + '" data-key="' + esc(p.key) + '" aria-label="' + (i + 1) + ' / ' + pages().length + '">' +
      /* 질문 장: 큰 검정 말풍선 하나(유저가 묻는 말, 사용자). 나머지 장: 방법 표시 + 그림 카드 */
      (p.ask ? '<div class="wy-art is-ask"><p class="wy-ask">' + esc(p.ask) + '</p></div>'
        : '<div class="wy-art">' + (p.method ? '<p class="wy-method">' + esc(p.method) + '</p>' : '') + ART[p.key]() + '</div>') +
      '<div class="wy-copy"><p class="ob-text">' + rich(p.text) + '</p></div></section>';
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
