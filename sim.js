/* 대본(data.js)을 폰 화면 하나로 그린다. 설명도 전부 폰 안에서 한다.

   거래 종류는 미리 정해져 있지 않다. 유저가 고른 From·To 조합에서 나온다.
       같은 체인 + 다른 토큰 → 같은 체인 스왑
       다른 체인 + 같은 토큰 → 브릿지
       다른 체인 + 다른 토큰 → 크로스체인 스왑 */
(function () {
  'use strict';

  var S = window.SIM;
  var screen = document.getElementById('screen');
  var beads = document.getElementById('beads');
  if (!S || !screen) return;

  var LABELS = { addr: '지갑 주소', chain: '체인 (네트워크)', token: '토큰', balance: '잔액' };
  var ORDER = ['addr', 'chain', 'token', 'balance'];
  var KIND_ORDER = ['swap', 'bridge', 'xswap'];
  var STEP_MS = 180, PEEL_MS = 690;
  var DIM = '#d9dcdc';          // 아직 긁지 않은 테두리 색

  var opened = Object.create(null);
  var done = Object.create(null);        // 만들어 본 거래 종류
  var flipped = Object.create(null);     // 뒤집어 본 장점 카드
  var mission = null;                    // 지금 만들어 보기로 한 거래. 고르기 전엔 없다
  var chosen = Object.create(null);      // 받는 쪽에서 유저가 직접 고른 것
  var guide = '';                        // 막혔을 때 띄우는 안내
  var picker = null;
  var pass = null, busy = false;
  var at = 0;
  var shown = -1;                        // 마지막으로 등장 모션을 돌린 단계
  var shownAt = 0;                       // 그 모션이 시작된 시각
  var ENTER_MS = 1680;                   // .fresh .rise 가 마지막 덩어리까지 끝나는 데 걸리는 시간
  var from = { chain: 'ethereum', token: 'eth' };
  var to   = { chain: 'ethereum', token: 'usdc' };

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function esc(v) {
    return String(v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmt(n, dp) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  /* ── 조합에서 거래 종류가 나온다 ─────────────── */

  function kindOf() {
    if (from.chain === to.chain) return 'swap';
    if (from.token === to.token) return 'bridge';
    return 'xswap';
  }

  function clearGuide() { guide = ''; }
  function kind() { return S.kinds[kindOf()]; }
  function sendAmount() { return S.send[from.token]; }
  function recvAmount() {
    var gross = sendAmount() * S.tokens[from.token].price / S.tokens[to.token].price;
    return gross * (1 - S.fee[kindOf()]);
  }
  function balanceOf(spot) { return (S.holdings[spot.chain] || {})[spot.token] || 0; }

  var START = {
    swap:   { from: { chain: 'ethereum', token: 'eth' },  to: { chain: 'ethereum', token: 'usdc' } },
    bridge: { from: { chain: 'ethereum', token: 'usdc' }, to: { chain: 'base', token: 'usdc' } },
    xswap:  { from: { chain: 'ethereum', token: 'eth' },  to: { chain: 'base', token: 'usdc' } }
  };

  function setMission(k) {
    mission = k;
    chosen = Object.create(null);        // 미션이 바뀌면 다시 고르게 한다
    flipped = Object.create(null);       // 장점 카드도 다시 덮는다
    from = { chain: START[k].from.chain, token: START[k].from.token };
    to   = { chain: START[k].to.chain,   token: START[k].to.token };
  }

  /* 내는 쪽은 가진 것만, 받는 쪽은 그 네트워크에 있는 것 전부. */
  function listFor(side, chain) {
    return side === 'from' ? Object.keys(S.holdings[chain] || {}) : S.tokensOn[chain];
  }

  function chainsWith(token, not) {
    return Object.keys(S.chains).filter(function (c) {
      return c !== not && S.tokensOn[c].indexOf(token) >= 0;
    });
  }

  /* 고른 미션이 깨지지 않게 받는 쪽을 맞춘다. */
  function enforce() {
    if (mission === 'swap') {
      to.chain = from.chain;
      var list = listFor('to', from.chain);
      if (to.token === from.token || list.indexOf(to.token) < 0) {
        to.token = list.filter(function (t) { return t !== from.token; })[0] || from.token;
      }
      return;
    }
    if (mission === 'bridge') to.token = from.token;
    if (to.chain === from.chain || S.tokensOn[to.chain].indexOf(to.token) < 0) {
      to.chain = chainsWith(to.token, from.chain)[0] || to.chain;
    }
    if (mission === 'xswap' && to.token === from.token) {
      to.token = listFor('to', to.chain).filter(function (t) { return t !== from.token; })[0] || to.token;
    }
  }

  /* 이 미션에서 유저가 직접 골라야 하는 받는 쪽 항목. 잠긴 쪽은 따라오므로 뺀다. */
  function needs() {
    var lock = S.kinds[mission].lock;
    return ['chain', 'token'].filter(function (w) { return w !== lock; });
  }

  /* 아직 고르지 않은 것 중 첫 번째. 그 자리 하나만 빛난다. */
  function nextPick() {
    return needs().filter(function (w) { return !chosen[w]; })[0] || null;
  }

  /* 이 미션에서 따라오는(유저가 고를 필요 없는) 축인가.
     미리 잠그지는 않는다. 열어서 고르게 두고, 미션을 깨는 선택을 했을 때 막는다.
     막혀 있는 것을 보는 것보다 골라 보고 막히는 쪽이 왜 그런지 남는다. */
  function followsAlong(side, what) {
    var m = S.kinds[mission];
    return Boolean(m && m.lock && side === 'to' && what === m.lock);
  }

  /* 고를 수 있는 것만 내놓는다. 미션을 깨는 선택지는 이유와 함께 잠근다. */
  function optionsFor(side, what) {
    var m = S.kinds[mission];
    var spot = side === 'from' ? from : to;
    if (what === 'chain') {
      return Object.keys(S.chains).map(function (c) {
        if (side === 'from' && listFor('from', c).length === 0) {
          return { key: c, ok: false, why: '여기엔 가진 토큰이 없어. 내가 가진 게 있는 네트워크에서 보내야 해.' };
        }
        if (mission === 'swap' && side === 'from' && S.tokensOn[c].length < 2) {
          return { key: c, ok: false, why: '이 네트워크엔 토큰이 하나뿐이야. 바꿀 상대가 없지.' };
        }
        if (side === 'to' && c === from.chain) return { key: c, ok: false, why: m.sameChainGuide };
        if (side === 'to' && S.tokensOn[c].indexOf(to.token) < 0 && mission === 'bridge') {
          return { key: c, ok: false, why: '이 네트워크엔 ' + S.tokens[to.token].name + ' 가 없어. 없는 토큰은 받을 수 없지.' };
        }
        return { key: c, ok: true };
      });
    }
    return listFor(side, spot.chain).map(function (t) {
      if (mission === 'bridge' && side === 'from' && chainsWith(t, from.chain).length === 0) {
        return { key: t, ok: false, why: '이 토큰은 다른 네트워크에 없어. 옮길 데가 없지.' };
      }
      if (side === 'to' && t === from.token && mission !== 'bridge') {
        return { key: t, ok: false, why: '내는 토큰과 같으면 바뀌는 게 없지. 다른 토큰을 골라야 해.' };
      }
      return { key: t, ok: true };
    });
  }

  /* 고른 체인에 없는 토큰이면 그 체인에 있는 것으로 맞춘다. 같은 자산끼리 겹치는 것도 막는다. */
  function settle(side, spot, other) {
    var list = listFor(side, spot.chain);
    if (list.indexOf(spot.token) < 0) spot.token = list[0];
    if (spot.chain === other.chain && spot.token === other.token) {
      var alt = list.filter(function (t) { return t !== other.token; })[0];
      if (alt) spot.token = alt;
      else spot.chain = Object.keys(S.chains).filter(function (c) { return c !== other.chain; })[0];
    }
  }

  /* ── 가림 라벨(빵조각) ───────────────────────── */

  function veil(k, inner) {
    // 열린 뒤에도 같은 상자를 그대로 둔다. 껍데기를 벗기면 줄 높이가 미세하게 달라져
    // 네 장의 카드가 동시에 움찔한다.
    if (opened[k]) return '<span class="slot open" data-kind="' + k + '"><span class="real">' + inner + '</span></span>';
    if (pass.collect) { pass.kinds[k] = true; return ''; }
    var lit = (k === pass.target && !pass.lit);
    if (lit) pass.lit = true;
    return '<span class="slot" data-kind="' + k + '">' +
      '<span class="real">' + inner + '</span>' +
      (lit ? '<button class="veil now" type="button" data-kind="' + k + '">' + esc(LABELS[k]) + '<i aria-hidden="true"></i></button>'
           : '<span class="veil wait" aria-hidden="true">' + esc(LABELS[k]) + '</span>') + '</span>';
  }

  function planPass(draw) {
    pass = { collect: true, kinds: {} };
    draw();
    var target = ORDER.filter(function (k) { return pass.kinds[k]; })[0] || null;
    pass = { collect: false, target: target, lit: false };
    return target;
  }

  function byPosition(a, b) {
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (Math.abs(ra.top - rb.top) > 6) return ra.top - rb.top;
    return ra.left - rb.left;
  }

  /* 체인 이름이 드러나는 속도에 맞춰 감싸는 카드도 같이 물든다.
     render() 를 기다리면 다 끝난 뒤에 테두리만 툭 바뀌어 끊겨 보인다. */
  function tintBorders() {
    Array.prototype.slice.call(screen.querySelectorAll('.netgroup[data-c]'))
      .sort(byPosition)
      .forEach(function (el, i) {
        el.style.setProperty('--d', (i * STEP_MS) + 'ms');
        el.style.setProperty('--c', el.dataset.c);
      });
  }

  function scratch(k) {
    var slots = Array.prototype.slice.call(screen.querySelectorAll('.slot[data-kind="' + k + '"]'));
    opened[k] = true;
    if (calm.matches || !slots.length) return render();
    busy = true;
    var last = null;
    slots.sort(byPosition).forEach(function (el, i) {
      el.style.setProperty('--d', (i * STEP_MS) + 'ms');
      el.classList.add('opening');
      last = el;
    });
    if (k === 'chain') tintBorders();
    var cover = last && last.querySelector('.veil');
    if (cover) cover.addEventListener('animationend', function () { if (busy) render(); }, { once: true });
    setTimeout(function () { if (busy) render(); }, slots.length * STEP_MS + PEEL_MS + 240);
  }

  /* ── 조각 ────────────────────────────────────── */

  function chainChip(key, side) {
    var c = S.chains[key];
    var caret = side ? '<i class="caret" aria-hidden="true">▾</i>' : '';
    var body = '<img src="' + c.icon + '" alt=""><b>' + esc(c.name) + '</b>' + caret;
    if (side) {
      if (side === 'to' && needs().indexOf('chain') >= 0 && !chosen.chain) return blank('chain', '네트워크 고르기');
      return '<button class="chain-tag tap" type="button" style="--c:' + c.color + '" ' +
        'data-pick="chain" data-side="' + side + '">' + body + '</button>';
    }
    return veil('chain', '<span class="chain-tag" style="--c:' + (opened.chain ? c.color : '#d9dcdc') + '">' + body + '</span>');
  }

  function tokenChip(key, opts) {
    var t = S.tokens[key];
    opts = opts || {};
    var caret = opts.side ? '<i class="caret" aria-hidden="true">▾</i>' : '';
    var body = '<img src="' + t.icon + '" alt=""><b>' + esc(t.name) + '</b>' + caret;
    var cls = 'token-pill' + (opts.plain ? ' plain' : '');
    if (opts.side) {
      if (opts.side === 'to' && needs().indexOf('token') >= 0 && !chosen.token) return blank('token', '토큰 고르기');
      return '<button class="' + cls + ' tap" type="button" style="--c:' + t.color + '" ' +
        'data-pick="token" data-side="' + opts.side + '">' + body + '</button>';
    }
    return veil('token', '<span class="' + cls + '" style="--c:' + t.color + '">' + body + '</span>');
  }

  /* 아직 고르지 않은 자리. 지금 골라야 할 하나만 빛나고 나머지는 회색으로 기다린다. */
  function blank(what, label) {
    var now = nextPick() === what;
    if (!now) return '<span class="veil wait pick-blank" aria-hidden="true">' + esc(label) + '</span>';
    return '<button class="veil now pick-blank" type="button" data-pick="' + what + '" data-side="to">' +
      esc(label) + '<i aria-hidden="true"></i></button>';
  }

  /* 첫 화면은 앱의 얼굴이다. 이름 대신 로고를 세운다. */
  function brandBar() {
    return '<div class="appbar"><img class="app-logo" src="brand/Radius_horizontallogo_black.svg" alt="Radius"></div>';
  }

  function appBar(title, addr) {
    var right = addr === 'veil' ? veil('addr', '<span class="addr">0x7a…4f2b</span>')
      : addr === 'plain' ? '<span class="addr">0x7a…4f2b</span>' : '';
    return '<div class="appbar"><span class="app-title">' + esc(title) + '</span>' + right + '</div>';
  }
  function replayBar(right) {
    return '<div class="appbar replay"><span class="badge">복기</span>' +
      (right ? '<span class="addr">' + esc(right) + '</span>' : '') + '</div>';
  }

  /* ── 앱 화면 ─────────────────────────────────── */

  function connectScreen() {
    return brandBar() + '<div class="connect rise"><span class="orb" aria-hidden="true"></span>' +
      '<p class="big">지갑 연결</p><p class="sub">연결하면 내가 가진 것을 볼 수 있다</p></div>';
  }

  function walletScreen() {
    var groups = Object.keys(S.holdings).map(function (ch, i) {
      var rows = Object.keys(S.holdings[ch]).map(function (tk) {
        var t = S.tokens[tk], amt = S.holdings[ch][tk];
        return '<div class="hold">' + tokenChip(tk, { plain: true }) +
          veil('balance', '<span class="amt">' + fmt(amt, t.price > 100 ? 4 : 2) +
            '<small>$' + fmt(amt * t.price, 2) + '</small></span>') + '</div>';
      }).join('');
      return '<section class="netgroup rise" data-c="' + S.chains[ch].color + '" style="--i:' + i +
        ';--c:' + (opened.chain ? S.chains[ch].color : DIM) + '">' + chainChip(ch) + rows + '</section>';
    }).join('');
    return appBar('Wallet', 'veil') + '<div class="scroller">' + groups + '</div>';
  }

  /* 긁지도 고르지도 않는 붙박이 칩. 예시와 결과가 같은 것을 쓴다. */
  function plainChain(key) {
    var c = S.chains[key];
    return '<span class="chain-tag" style="--c:' + c.color + '"><img src="' + c.icon + '" alt=""><b>' +
      esc(c.name) + '</b></span>';
  }

  function plainToken(key) {
    var t = S.tokens[key];
    return '<span class="token-pill plain" style="--c:' + t.color + '"><img src="' + t.icon + '" alt=""><b>' +
      esc(t.name) + '</b></span>';
  }

  function egSpot(spot) {
    return '<span class="eg-spot" style="--c:' + S.chains[spot.chain].color + '">' +
      plainChain(spot.chain) + plainToken(spot.token) + '</span>';
  }

  function menuScreen() {
    var cards = KIND_ORDER.map(function (k, i) {
      var m = S.kinds[k];
      var on = mission === k;
      // 고른 카드에만 예시가 열린다. 먼저 보고, 다음 화면에서 직접 해 본다.
      var eg = on ? '<span class="eg-open"><span class="eg">' + egSpot(m.example.from) +
        '<i class="eg-go" aria-hidden="true">' + esc(m.en.toLowerCase()) + '</i>' +
        egSpot(m.example.to) + '</span></span>' : '';
      return '<button class="quest rise' + (on ? ' on' : '') + (done[k] ? ' got' : '') + '" ' +
        'style="--i:' + i + '" type="button" data-quest="' + k + '" aria-pressed="' + on + '">' +
        '<span class="quest-top"><b>' + esc(m.name) + ' <em>(' + esc(m.en) + ')</em></b>' +
        (done[k] ? '<span class="got-mark">완료 ✓</span>' : '') + '</span>' +
        '<span class="quest-axis">' + esc(m.axis) + '</span>' + eg + '</button>';
    }).join('');
    return appBar('무엇을 해 볼까?') + '<div class="quests">' + cards + '</div>';
  }

  function sideBox(side, spot, label, amount) {
    var t = S.tokens[spot.token];
    return '<div class="side rise" style="--i:' + (side === 'from' ? 1 : 3) +
      ';--c:' + S.chains[spot.chain].color + '">' +
      '<div class="side-top"><span class="side-lab">' + label + '</span>' + chainChip(spot.chain, side) + '</div>' +
      '<div class="side-mid"><span class="amt-in">' +
      (amount === null ? '—' : fmt(amount, t.price > 100 ? 4 : 2)) + '</span>' +
      tokenChip(spot.token, { side: side }) + '</div>' +
      // 아직 고르지 않은 토큰의 잔액을 미리 말하지 않는다
      '<div class="side-foot"><span>' + (amount === null ? '' : '$' + fmt(amount * t.price, 2)) + '</span>' +
      '<span>' + (amount === null ? '' : '잔액 ' + fmt(balanceOf(spot), 2)) + '</span></div></div>';
  }

  function swapScreen() {
    var k = kind(), ft = S.tokens[from.token], tt = S.tokens[to.token];
    var rate = ft.price / tt.price;
    return appBar(k.en, 'plain') +
      '<div class="verdict rise" style="--i:0"><span class="verdict-name">' + esc(k.name) + '</span>' +
      '<span class="verdict-axis">' + esc(k.axis) + '</span></div>' +
      sideBox('from', from, 'From', sendAmount()) +
      '<div class="flip rise" style="--i:2" aria-hidden="true"><span>↓</span></div>' +
      sideBox('to', to, 'To', nextPick() ? null : recvAmount()) +
      '<div class="quote rise" style="--i:4"><div class="quote-row"><span>환율</span><b>' +
      (nextPick() ? '—' : '1 ' + esc(ft.name) + ' = ' + fmt(rate, rate >= 100 ? 2 : 4) + ' ' + esc(tt.name)) + '</b></div>' +
      '<div class="quote-row"><span>슬리피지 허용</span><b>0.5%</b></div></div>';
  }

  function pendingScreen() {
    return appBar(kind().en, 'plain') + '<div class="connect rise"><span class="orb pulse" aria-hidden="true"></span>' +
      '<p class="big">처리 중</p><p class="sub">조건에 맞게 실행되기를 기다린다</p></div>';
  }

  function deltaRow(spot, before, after) {
    // 무엇을 해 볼까 화면과 같은 자리 — 왼쪽 체인, 오른쪽 토큰. 두 줄이 위아래로 맞는다.
    var dp = S.tokens[spot.token].price > 100 ? 4 : 2;
    return '<div class="delta" style="--c:' + S.chains[spot.chain].color + '">' +
      '<div class="delta-top">' + plainChain(spot.chain) + plainToken(spot.token) + '</div>' +
      '<div class="ba"><s>' + fmt(before, dp) + '</s><i aria-hidden="true">→</i><b>' + fmt(after, dp) + '</b></div></div>';
  }

  function summaryLine() {
    var k = kind();
    return k.sum({
      fromChain: S.chains[from.chain].name, toChain: S.chains[to.chain].name,
      fromToken: S.tokens[from.token].name, toToken: S.tokens[to.token].name,
      send: fmt(sendAmount(), S.tokens[from.token].price > 100 ? 4 : 2),
      recv: fmt(recvAmount(), S.tokens[to.token].price > 100 ? 4 : 2)
    });
  }

  function resultScreen() {
    var fb = balanceOf(from), tb = balanceOf(to);
    var k = kind();
    return appBar(k.en) +
      '<div class="done rise" style="--i:0"><span class="tick" aria-hidden="true">✓</span><p class="big">거래 완료</p></div>' +
      '<div class="recap rise" style="--i:1"><p class="block-lab">거래 요약</p>' +
      '<p class="recap-sum">' + esc(summaryLine()) + '</p></div>' +
      '<div class="changed rise" style="--i:2"><p class="block-lab">지갑</p>' +
      deltaRow(from, fb, fb - sendAmount()) +
      deltaRow(to, tb, tb + recvAmount()) + '</div>';
  }

  /* ── 복기 ────────────────────────────────────── */

  /* 거래 화면에서 복기로 넘어가는 한 장면.
     세팅 화면의 두 카드가 벌어지고 → 그 틈에서 처리 중 동그라미가 자라 화면을 덮고
     → 응답한 솔버들이 나타나고 → 그중 하나가 무엇을 따져보는지 말풍선으로 연다.
     설명 문장 대신 순서로 말한다. 모든 움직임은 transform·opacity 뿐이다. */
  function stageScreen() {
    var k = kind();
    var crowd = k.solvers.map(function (sv, i) {
      return '<li class="face' + (sv.radius ? ' is-radius' : '') + '" style="--i:' + i + '">' +
        '<span class="head" aria-hidden="true"></span><b>' + esc(sv.name) + '</b></li>';
    }).join('');
    // 고민은 머리 위아래로 흩뿌린다. 한 명의 것이 아니라는 뜻이다.
    var half = Math.ceil(S.ask.length / 2);
    var think = function (list, from) {
      return '<ul class="asks">' + list.map(function (q, i) {
        return '<li style="--i:' + (from + i) + '">' + esc(q) + '</li>';
      }).join('') + '</ul>';
    };
    return replayBar(k.name) +
      '<div class="play">' +
        '<div class="act cards" aria-hidden="true">' +
          '<span class="mini up">' + egSpot(from) + '</span>' +
          '<span class="mini down">' + egSpot(to) + '</span>' +
        '</div>' +
        '<span class="bloom" aria-hidden="true"></span>' +
        '<div class="act crowd" style="--n:' + k.solvers.length + '">' +
          think(S.ask.slice(0, half), 0) +
          '<ul class="faces">' + crowd + '</ul>' +
          think(S.ask.slice(half), half) +
        '</div>' +
      '</div>';
  }

  /* 솔버를 거쳐서 유저가 얻는 것.
     한꺼번에 쏟지 않는다. 앞면에는 무엇에 대한 이야기인지만 두고, 뒤집어야 답이 나온다.
     지갑 화면에서 라벨을 긁어 여는 것과 같은 방식이다 — 읽는 사람이 한 장씩 만나게 된다. */
  function perksScreen() {
    var rows = S.perks.list.map(function (p, i) {
      var on = Boolean(flipped[i]);
      return '<li class="perk rise" style="--i:' + (i + 1) + '">' +
        '<button class="card' + (on ? ' on' : '') + '" type="button" data-perk="' + i + '" ' +
        'aria-expanded="' + on + '">' +
        '<span class="lid"><b>' + esc(p.key) + '</b><i aria-hidden="true"></i></span>' +
        '<span class="answer"><b>' + esc(p.good) + '</b><p>' + esc(p.why) + '</p></span>' +
        '</button></li>';
    }).join('');
    return replayBar(kind().name) +
      '<h3 class="perk-head rise" style="--i:0">' + esc(S.perks.head) + '</h3>' +
      '<ul class="perks">' + rows + '</ul>';
  }

  var SCREENS = {
    connect: connectScreen, wallet: walletScreen, menu: menuScreen, swap: swapScreen, pending: pendingScreen,
    result: resultScreen, stage: stageScreen, perks: perksScreen
  };

  /* ── 고르기 시트 ─────────────────────────────── */

  function pickerSheet() {
    if (!picker) return '';
    var spot = picker.side === 'from' ? from : to;
    var isChain = picker.what === 'chain';
    var rows = optionsFor(picker.side, picker.what).map(function (o) {
      var on = (isChain ? spot.chain : spot.token) === o.key;
      var meta = isChain ? S.chains[o.key] : S.tokens[o.key];
      // 고를 수 없는 것도 똑같이 보인다. 골라 봐야 왜 안 되는지 알게 된다.
      return '<button class="opt' + (on ? ' on' : '') + '" type="button" ' +
        'style="--c:' + meta.color + '" data-choose="' + o.key + '">' +
        '<img src="' + meta.icon + '" alt=""><b>' + esc(meta.name) + '</b>' +
        (on ? '<span class="now-mark" aria-hidden="true">✓</span>' : '') + '</button>';
    }).join('');
    return '<div class="picker" role="dialog" aria-label="' + (isChain ? '네트워크' : '토큰') + ' 고르기">' +
      '<div class="picker-head"><b>' + (isChain ? '네트워크 고르기' : '토큰 고르기') + '</b>' +
      '<button class="close" type="button" data-close="1" aria-label="닫기">✕</button></div>' +
      '<div class="opts-wrap"' + (rows.split('<button').length - 1 > 4 ? ' data-more="1"' : '') +
      '><div class="opts">' + rows + '</div></div></div>';
  }

  /* ── 그리기 ──────────────────────────────────── */

  function stepsForKind() {
    var k = kindOf();
    return S.steps.filter(function (st) { return !st.onlyKind || st.onlyKind === k; });
  }

  function drawTrack(steps, index) {
    beads.innerHTML = steps.map(function (st, i) {
      var state = i === index ? 'at' : (i < index ? 'done' : '');
      return '<li><button type="button" data-step="' + i + '" class="' + st.phase + ' ' + state + '"' +
        (i === index ? ' aria-current="step"' : '') + ' aria-label="' + (i + 1) + '단계"></button></li>';
    }).join('');
  }

  /* 아래에는 버튼만 둔다. 설명은 화면 안에 이미 있다. */
  function actionBar(step) {
    var label = step.cta.replace('{KIND}', mission ? S.kinds[mission].name : '거래');
    return '<div class="bar"><button class="cta' + (step.waiting ? ' waiting' : ' now') +
      '" type="button" id="cta">' + esc(label) + '</button></div>';
  }

  function menuAt(steps) {
    for (var i = 0; i < steps.length; i += 1) { if (steps[i].type === 'menu') return i; }
    return 0;
  }

  function render() {
    busy = false;
    var steps = stepsForKind();
    if (at >= steps.length) at = steps.length - 1;
    if (!mission) at = Math.min(at, menuAt(steps));   // 고르기 전에는 앞으로 못 간다
    var step = steps[at];
    var target = planPass(function () { SCREENS[step.type](); });
    var canvas = SCREENS[step.type]();
    // 단계가 바뀔 때만 블록이 올라온다. 복권을 긁거나 토큰을 고를 때마다
    // 화면 전체가 다시 날아오르면 무엇이 바뀌었는지 놓친다.
    // 다만 아직 올라오는 중에 다시 그릴 때는 모션을 유지한다. 중간에 끄면
    // 덩어리들이 올라오던 자리에서 제자리로 9px 뚝 떨어진다.
    var now = Date.now();
    var moved = at !== shown || now - shownAt < ENTER_MS;
    if (at !== shown) { shown = at; shownAt = now; }
    screen.className = 'screen phase-' + step.phase + ' type-' + step.type +
      (picker ? ' picking' : '') + (moved ? ' fresh' : '');
    // 고르는 동안에는 설명 시트를 그리지 않는다. 두 시트가 겹치면 글자가 비친다.
    // 안내는 화면 위로 뜬다. canvas 안에 두면 스크롤에 딸려 가고 잘린다.
    var notice = guide
      ? '<button class="guide" type="button" role="status" data-hide-guide="1">' + guide + '</button>'
      : '';
    screen.innerHTML = notice + '<div class="canvas">' + canvas + '</div>' +
      (picker ? pickerSheet()
              : actionBar({ cta: step.cta,
                            waiting: Boolean(target) ||
                                     (step.type === 'menu' && !mission) ||
                                     (step.type === 'swap' && Boolean(nextPick())) }));
    drawTrack(steps, at);
  }

  /* ── 움직이기 ────────────────────────────────── */

  function shift(dir) {
    clearGuide();
    var steps = stepsForKind();
    at = Math.min(Math.max(at + dir, 0), steps.length - 1);
    render();
  }

  function advance() {
    clearGuide();
    var steps = stepsForKind();
    if (steps[at].type === 'swap') done[kindOf()] = true;   // 보낸 조합을 기록
    if (at === steps.length - 1) { at = menuAt(steps); mission = null; picker = null; return render(); }
    at += 1;
    render();
  }

  function choose(key) {
    var spotNow = picker.side === 'from' ? from : to;
    var same = (picker.what === 'chain' ? spotNow.chain : spotNow.token) === key;
    // 따라오는 축을 굳이 바꾸려 하면 미션이 깨진다. 막고 왜 그런지 말해 준다.
    if (!same && followsAlong(picker.side, picker.what)) {
      guide = S.kinds[mission].guide;
      return render();
    }
    var opt = optionsFor(picker.side, picker.what).filter(function (o) { return o.key === key; })[0];
    if (opt && !opt.ok) { guide = opt.why; return render(); }
    var spot = picker.side === 'from' ? from : to;
    var other = picker.side === 'from' ? to : from;
    if (picker.what === 'chain') spot.chain = key; else spot.token = key;
    if (picker.side === 'to') chosen[picker.what] = true;
    settle(picker.side, spot, other);
    enforce();
    picker = null;
    guide = '';
    render();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var v = t.closest('button[data-kind]');
    if (v) { if (!busy) scratch(v.dataset.kind); return; }
    var opt = t.closest('[data-choose]');
    if (opt) return choose(opt.dataset.choose);
    if (t.closest('[data-close]')) { picker = null; return render(); }
    var perk = t.closest('[data-perk]');
    if (perk) {
      // 다시 그리지 않는다. 새로 만든 카드는 이미 뒤집힌 채로 나타나서 뒤집는 동작이 사라진다.
      var at2 = perk.dataset.perk;
      flipped[at2] = !flipped[at2];
      perk.classList.toggle('on', Boolean(flipped[at2]));
      perk.setAttribute('aria-expanded', String(Boolean(flipped[at2])));
      return;
    }
    var quest = t.closest('[data-quest]');
    if (quest) { setMission(quest.dataset.quest); guide = ''; return render(); }
    if (t.closest('[data-hide-guide]')) { guide = ''; return render(); }
    var pick = t.closest('[data-pick]');
    if (pick) {
      picker = { side: pick.dataset.side, what: pick.dataset.pick };
      guide = '';
      return render();
    }
    if (t.closest('#cta')) return advance();
    var jump = t.closest('[data-step]');
    if (jump) { at = Number(jump.dataset.step); return render(); }
    var move = t.closest('[data-move]');
    if (move) return shift(Number(move.dataset.move));
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input, textarea')) return;
    if (e.key === 'Escape' && picker) { picker = null; return render(); }
    if (e.key === 'ArrowRight') { shift(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { shift(-1); e.preventDefault(); }
  });

  render();
})();
