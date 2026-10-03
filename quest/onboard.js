/* 첫 화면 — 온보딩. 한 장에 한 문장(data.js 의 mission.onboard).
   0장은 표지: 일반 앱처럼 Radius 로고만. 1장으로 넘기면 토큰이 먼저 나타나고, 체인 층이 날아와 그 아래에 앉는다.
   위에는 같은 무대가 계속 있다: 체인 층 두 장(Ethereum 위, Robinhood Chain 아래)이 건물 층처럼 쌓인 페이크 3D.
   아래 글 칸을 옆으로 넘기면(스와이프) 무대의 움직임이 바뀐다 — 버튼으로 넘기지 않는다.
     토큰: 여러 토큰 카드가 Ethereum 층 위에 오른쪽 위로 포개져, 건반처럼 차례로 들썩인다(도레미파미레)
     스왑: ETH·USDG 가 같은 층에서 타원을 그리며 서로 자리를 계속 맞바꾼다(뒤집지 않는다 — 사용자 요청)
     브릿지: USDG 가 위층 가운데 ↔ 아래층 가운데를 오간다
     한 번에?: 위아래 두 장씩, 층마다 스왑 → 같은 토큰끼리 층을 맞바꾸는 브릿지를 끝없이
     크로스체인 스왑: ETH 가 먼저 아래층으로 건너가고, 거기 반투명하게 나타난 USDG 와 스왑
     Quest(미정): 아래층의 USDG
   진짜 3D 중첩(preserve-3d 여러 겹)과 뒷면 숨기기는 쓰지 않는다 — 아이폰 사파리에서 카드가 눕고 거울 글자가 비쳤다.
   층은 각자 기울인 판 한 장. 토큰은 같은 아이소메트릭 각도로 선 동전(앞면 + 반투명 두께 겹, 각각 2D matrix)이고,
   자리는 바닥 위 좌표로 계산해 화면에 옮긴다 — 화면 기준으로 좌우를 맞추면 바닥과 따로 논다(사용자 지적). 움직임은 styles/onboard.css — 카드 길은 tools/onboard_keyframes.py 가 만든다. */
window.ONBOARD = (function () {
  'use strict';
  var S = window.MODE;
  var DRAG_PX = 8;
  var SETTLE_MS = 160;   /* 스크롤이 이만큼 멈춰 있으면 넘기기가 끝난 것으로 본다 */
  /* 장마다 글이 나타나는 때(초) — 그 장 그림 움직임이 거의 끝날 즈음 */
  var TEXT_AT_S = { cover: .3, tokens: .5, quest: 1.4 }, TEXT_AT_DEFAULT_S = .8, TEXT_FROM_COVER_S = 1.7;   /* 끌 때, 이보다 적게 움직이면 누른 것으로 본다 */
  var STACK = ['eth', 'usdg', 'usdt', 'wbtc'];   /* 첫 장에 포개 놓는 토큰 카드. 앞(ETH)부터 */
  var EXTRA = [['eth', 'eth2'], ['usdg', 'usdg2']];
  var RIMS = 4;   /* 동전 두께 = 앞면 뒤로 겹친 반투명 원 수(뒤 → 앞). tools/onboard_keyframes.py 의 RIMS 와 같게 */   /* 4장: 아래층에도 ETH·USDG 한 장씩 [토큰, 카드 이름] */

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function layer(key, cls) {
    var c = S.chains[key];
    return '<div class="ob-layer ' + cls + '" style="--c:' + esc(c.color) + '"><span class="ob-slab"></span>' +
      '<span class="ob-top"><span class="ob-name"><img src="' + esc(c.icon) + '" alt="">' + esc(c.name) + '</span></span></div>';
  }
  function card(key, name, token) {
    var t = token || S.tokens[key];
    /* 바닥과 같은 아이소메트릭 공간에 선 동전: 바닥 그림자, 반투명한 두께 겹(뒤부터), 앞면. 기울기는 CSS 의 matrix */
    var rims = '';
    for (var i = RIMS; i >= 1; i--) rims += '<span class="ob-rim r' + i + '"></span>';
    return '<div class="ob-tok k-' + (name || key) + '"><span class="ob-shadow"></span>' +
      '<div class="ob-lift">' + rims +
      '<div class="ob-coin"><img src="' + esc(t.icon) + '" alt=""><b>' + esc(t.name) + '</b></div></div></div>';
  }
  /* 스톡 토큰: 로고 대신 색 원 안에 티커 첫 글자 */
  function stockCoin(t) {
    var rims = '';
    for (var i = RIMS; i >= 1; i--) rims += '<span class="ob-rim r' + i + '"></span>';
    return '<div class="ob-tok k-' + esc(t.key) + '"><span class="ob-shadow"></span><div class="ob-lift">' + rims +
      '<div class="ob-coin"><span class="ob-mono" style="--mono:' + esc(t.color) + '">' + esc(t.name.charAt(0)) + '</span>' +
      '<b>' + esc(t.name) + '</b></div></div></div>';
  }
  /* 마지막 장의 동전: 로고가 있으면 로고 동전, 없으면(스톡 토큰·상표) 색 원 + 글자 동전 */
  function questCoin(chain, key, i) {
    var name = 'q-' + chain + '-' + i;
    var find = function (list) { return list.filter(function (t) { return t.key === key; })[0]; };
    var extra = find(S.mission.stocks) || find(S.mission.moreTokens);
    if (!extra) return card(key, name);
    return extra.icon ? card(key, name, extra) : stockCoin(Object.assign({}, extra, { key: name }));
  }
  function stage(at) {
    var tags = S.mission.tags;
    return '<div class="ob-stage at-' + at + '" aria-hidden="true">' +
      /* 표지: 일반 앱처럼 로고만(사용자). 넘기면 사라지고 무대가 시작된다 */
      '<div class="ob-logo"><img src="../brand/Radius_icon_primaryColor.svg" alt=""></div>' +
      '<div class="ob-world">' + layer('robinhood', 'rh') + layer('base', 'base') + layer('arbitrum', 'arb') + layer('ethereum', 'eth') +
        STACK.map(function (k) { return card(k); }).join('') +
        EXTRA.map(function (e) { return card(e[0], e[1]); }).join('') +
        S.mission.stocks.map(stockCoin).join('') +
        S.mission.questFloors.map(function (f) {
          return f.tokens.map(function (k, i) { return questCoin(f.chain, k, i); }).join('');
        }).join('') +
        /* 일어나는 자리에서 톡 튀어나왔다 사라지는 글씨. 자리·때는 onboard-motion.css */
        '<span class="ob-pop p-swap"><span>' + esc(tags.swap) + '</span></span>' +
        '<span class="ob-pop p-bridge"><span>' + esc(tags.bridge) + '</span></span>' +
        '<span class="ob-pop p-cross"><span>' + esc(tags.cross) + '</span></span>' +
      '</div>' +
    '</div>';
  }
  /* **단어** → 굵게. 먼저 이스케이프하고 나서 바꾼다 */
  function rich(text) { return esc(text).replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>'); }
  function pages(at) {
    var list = S.mission.onboard;
    return '<div class="ob-pages" tabindex="0" aria-label="' + esc(S.ui.a11y.onboard.replace('{N}', list.length)) + '">' + list.map(function (p, i) {
      return '<section class="ob-page' + (i === at ? ' is-on' : '') + (p.key === 'cover' ? ' is-cover' : '') + (p.key === 'cover' || p.key === 'quest' ? ' is-big' : '') + '" data-key="' + esc(p.key) + '" aria-label="' + (i + 1) + ' / ' + list.length + '"><p class="ob-text">' + rich(p.text) + '</p>' +
        (p.note ? '<p class="ob-note">' + esc(p.note) + '</p>' : '') + '</section>';
    }).join('') + '</div>';
  }
  /* 순서 막대는 1장부터 센다(표지는 칸이 없고, 표지에선 막대를 숨긴다 — 사용자) */
  function dots(at) {
    var list = S.mission.onboard.slice(1), n = list.length;
    return '<div class="ob-dots">' + list.map(function (p, k) {
      var i = k + 1;
      return '<button type="button" data-ob-go="' + i + '" aria-label="' + i + ' / ' + n + '"' +
        (i < at ? ' class="is-past"' : '') + (i === at ? ' aria-current="step"' : '') + '></button>';
    }).join('') + '</div>';
  }
  function isLast(at) { return at === S.mission.onboard.length - 1; }

  /* parts: 화면 공통 조각(테마·언어 줄)은 screens.js 가 넘긴다 */
  function html(st, parts) {
    var at = st.ob || 0, m = S.mission;
    return '<div class="canvas onboard' + (at === 0 ? ' at-cover' : '') + '">' + parts.setup + dots(at) + stage(at) + pages(at) + '</div>' +
      '<div class="bar ob-bar' + (isLast(at) ? ' is-ready' : '') + '">' +
        /* 아래 양옆 꺾쇠 ‹ › — 웹에선 끌기가 불편하다(사용자). 배경 없이 꺾쇠만. 마지막 장에선 시작 버튼이 대신한다 */
        '<button class="ob-prev" type="button" aria-label="' + esc(S.ui.a11y.prev) + '"' + (isLast(at) || at === 0 ? ' tabindex="-1"' : '') + '><span aria-hidden="true">‹</span></button>' +
        '<button class="ob-next" type="button" aria-label="' + esc(S.ui.a11y.next) + '"' + (isLast(at) ? ' tabindex="-1"' : '') + '><span aria-hidden="true">›</span></button>' +
        '<button class="cta now" type="button" data-act="next"' + (isLast(at) ? '' : ' tabindex="-1"') + '>' + esc(m.cta) + '</button>' +
      '</div>';
  }

  /* 그린 뒤에 붙인다. remember(i) 는 넘긴 장을 앱 상태에 적어 둔다 — 다시 그려도 그 장에 머문다 */
  function mount(screen, st, remember) {
    var pager = screen.querySelector('.ob-pages');
    if (!pager) return;
    var stageEl = screen.querySelector('.ob-stage');
    var bar = screen.querySelector('.ob-bar');
    var at = st.ob || 0;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pager.scrollLeft = at * pager.clientWidth;

    function show(i) {
      /* from-N: 어느 장에서 왔는지 — 표지에서 1장으로 올 때만 층이 천천히 날아오고 토큰이 그 뒤에 내려앉는다 */
      stageEl.className = 'ob-stage at-' + i + ' from-' + at;
      /* 글은 장에 들어와 그림 움직임이 거의 끝날 때 나타난다(사용자). 표지에서 1장으로 올 때만 층이 날아오느라 더 늦게 */
      Array.prototype.forEach.call(pager.children, function (el, j) {
        if (j === i) el.classList.add('is-on');   /* 떠나는 장 글은 스크롤이 멈출 때까지 그대로 — prune() */
        if (j === i) el.style.setProperty('--text-at', (i === 1 && at === 0 ? TEXT_FROM_COVER_S : TEXT_AT_S[el.dataset.key] || TEXT_AT_DEFAULT_S) + 's');
      });
      at = i;
      Array.prototype.forEach.call(screen.querySelectorAll('[data-ob-go]'), function (b) {
        var j = Number(b.dataset.obGo);
        if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-past', j < i);   /* 스토리 막대: 지나온 장도 채운다 */
      });
      screen.querySelector('.canvas.onboard').classList.toggle('at-cover', i === 0);   /* 표지에서만 토글, 1장부터 순서 막대 */
      bar.classList.toggle('is-ready', isLast(i));
      bar.querySelector('.ob-next').tabIndex = isLast(i) ? -1 : 0;
      bar.querySelector('.ob-prev').tabIndex = isLast(i) || i === 0 ? -1 : 0;
      bar.querySelector('.cta').tabIndex = isLast(i) ? 0 : -1;
      remember(i);
    }
    function go(i) { pager.scrollTo({ left: i * pager.clientWidth, behavior: reduced ? 'auto' : 'smooth' }); }

    var settle;
    function prune() { Array.prototype.forEach.call(pager.children, function (el, j) { if (j !== at) el.classList.remove('is-on'); }); }
    var ticking = false;
    pager.addEventListener('scroll', function () {
      clearTimeout(settle); settle = setTimeout(prune, SETTLE_MS);
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var i = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth));
        if (i !== at) show(i);
      });
    }, { passive: true });

    screen.querySelector('.ob-next').addEventListener('click', function () {
      go(Math.min(S.mission.onboard.length - 1, at + 1));
    });
    screen.querySelector('.ob-prev').addEventListener('click', function () {
      go(Math.max(0, at - 1));
    });
    screen.querySelector('.ob-dots').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ob-go]');
      if (b) go(Number(b.dataset.obGo));
    });
    pager.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.min(S.mission.onboard.length - 1, at + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(0, at - 1)); }
    });
    swipeArea(screen.querySelector('.canvas.onboard'), pager, go);
  }

  /* 화면 어디를 밀어도 넘어간다(사용자: 글자 칸만 밀려서 넘어갔다). 손가락이 글자 칸 위면 브라우저 스크롤에 맡기고,
     그 밖(무대·진행 점 둘레)과 마우스는 여기서 글자 칸을 대신 민다. 가로로 움직일 때만 붙잡고, 버튼 누름은 그대로 둔다.
     포인터를 붙잡아 이 칸에만 듣는다 — 다시 그릴 때마다 window 에 리스너가 쌓이지 않게 */
  function swipeArea(area, pager, go) {
    var x0 = 0, y0 = 0, left0 = 0, isDown = false, isDragging = false;
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a')) return;
      if (e.pointerType !== 'mouse' && pager.contains(e.target)) return;   /* 글자 칸 위의 손가락은 브라우저가 민다 */
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
      var dx = e.clientX - x0, n = S.mission.onboard.length;
      var start = Math.round(left0 / Math.max(1, pager.clientWidth));
      go(Math.max(0, Math.min(n - 1, start + (dx < 0 ? 1 : -1))));
    }
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);
  }

  return { html: html, mount: mount };
})();
