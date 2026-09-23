/* 화면 그리기 — 상태를 받아 HTML 문자열을 돌려준다. 상태를 바꾸지 않는다.
   문장은 data.js, 상태와 동작은 app.js. 여기는 모양만. */
window.SCREENS = (function () {
  'use strict';
  var S = window.MODE;

  /* ── 작은 도구 ── */
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n, dp) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function money(n) { return '$' + fmt(n, 2); }
  /* 큰 단위 둘만 적는다. 7일 2시간 8분 15초 는 읽히지 않는다 — 7일 2시간 이면 된다. */
  function dur(sec) {
    var units = [['일', 86400], ['시간', 3600], ['분', 60], ['초', 1]], out = [], rest = Math.round(sec);
    units.forEach(function (u) {
      var n = Math.floor(rest / u[1]);
      if (n && out.length < 2) { out.push(n + u[0]); rest -= n * u[1]; }
      else if (out.length) rest -= n * u[1];
    });
    return out.length ? out.join(' ') : '0초';
  }
  /* 선택지가 있는 단계는 고른 선택지(없으면 기본값)의 수치로 채워서 돌려준다. */
  function resolve(step, picked) {
    if (!step.options) return step;
    var idx = picked == null ? step.options.findIndex(function (x) { return x.pick; }) : picked;
    var o = step.options[idx], L = step.labels;
    return Object.assign({}, step, {
      app: picked == null ? step.app : o.name, option: o,
      to: Object.assign({}, step.to, { amount: o.amount }),
      lines: [[L.fee, money(o.fee)], [L.gas, o.gas.map(money).join(' + ')], [L.time, '~' + dur(o.wait)], L.dest],
      sigs: step.sigNames.map(function (name, i) { return { name: name, gas: o.gas[i] }; }),
      wait: o.wait
    });
  }
  function amountOf(tokenKey, n) { return fmt(n, S.tokens[tokenKey].dp); }

  function chainTag(key) {
    var c = S.chains[key];
    return '<span class="chain-tag" style="--c:' + c.color + '"><img src="' + c.icon + '" alt=""><b>' + esc(c.name) + '</b></span>';
  }
  function tokenPill(key) {
    var t = S.tokens[key];
    return '<span class="token-pill" style="--c:' + t.color + '"><img src="' + t.icon + '" alt=""><b>' + esc(t.name) + '</b></span>';
  }
  function tokIcon(tokenKey, chainKey) {
    return '<span class="tok-ic"><img class="t" src="' + S.tokens[tokenKey].icon + '" alt="">' +
      '<img class="c" src="' + S.chains[chainKey].icon + '" alt=""></span>';
  }
  function lines(rows, cls) {
    return '<div class="lines">' + rows.map(function (r) {
      return '<div class="line ' + (r[2] || '') + '"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
    }).join('') + '</div>';
  }
  function cta(label, cls, act, coach) {
    return '<div class="bar"><button class="cta ' + cls + '" type="button" data-act="' + act + '"' +
      (coach ? ' data-coach="' + coach + '"' : '') + '>' + esc(label) + '</button></div>';
  }
  function missionPill() {
    var m = S.mission, c = S.chains[m.need.chain];
    return '<div class="mission-pill"><img src="' + c.icon + '" alt=""><span>' + esc(m.word) + ' · <b>' + esc(m.pill) + '</b></span></div>';
  }
  function appBar(title, right) {
    return '<div class="appbar"><span class="app-title">' + esc(title) + '</span>' + (right || '') + '</div>';
  }

  /* ── Quest ── */
  function missionTile(spot, cls) {
    var c = S.chains[spot.chain];
    return '<div class="m-tile ' + cls + '" style="--c:' + c.color + '"><img src="' + c.icon + '" alt=""><b>' + esc(c.name) + '</b>' +
      '<small>' + spot.amount + ' ' + esc(S.tokens[spot.token].name) + '</small></div>';
  }
  function missionRoute(have, need) {
    return '<div class="m-route" aria-hidden="true">' + missionTile(have, 'from') + '<span class="m-dash"></span>' + missionTile(need, 'to') + '</div>';
  }
  function mission() {
    var m = S.mission, need = m.need, have = { chain: 'ethereum', token: 'eth', amount: S.holdings.ethereum.eth };
    return '<div class="canvas"><div class="mission">' +
      '<p class="m-eyebrow">' + esc(m.eyebrow) + '</p>' +
      '<h2 class="m-title">' + esc(m.title) + '</h2>' +
      '<div class="tickets">' +
      '<div class="ticket need">' + tokIcon(need.token, need.chain) + '<div><div class="lab">' + esc(m.needLabel) + '</div><div class="val">' +
      need.amount + ' ' + esc(S.tokens[need.token].name) + '<small>' + esc(S.chains[need.chain].name) + '</small></div></div></div>' +
      '<div class="ticket have">' + tokIcon(have.token, have.chain) + '<div><div class="lab">' + esc(m.haveLabel) + '</div><div class="val">' +
      have.amount + ' ' + esc(S.tokens[have.token].name) + '<small>' + esc(S.chains[have.chain].name) + '</small></div></div></div>' +
      '</div>' + missionRoute(have, need) + '<p class="m-gap">' + esc(m.gap) + '</p></div></div>' +
      cta(m.cta, 'now', 'next');
  }

  /* ── 지갑 ── */
  function walletTotal(w) {
    var sum = 0;
    Object.keys(w).forEach(function (chain) {
      Object.keys(w[chain]).forEach(function (t) { sum += w[chain][t] * S.tokens[t].price; });
    });
    return sum;
  }
  function chainTabs(tab) {
    var all = '<button class="ctab all' + (tab === 'all' ? ' on' : '') + '" type="button" data-act="tab:all">' + esc(S.ui.wallet.all) + '</button>';
    return '<div class="chain-tabs" data-coach="chains">' + all + S.chainOrder.map(function (k) {
      var c = S.chains[k];
      // 이름은 고른 탭에만 붙는다. 넷 다 이름을 붙이면 한 줄에 안 들어와 마지막 체인이 잘린다.
      return '<button class="ctab' + (tab === k ? ' on' : '') + '" type="button" data-act="tab:' + k + '" aria-label="' + esc(c.name) + '"><img src="' + c.icon + '" alt="">' +
        (tab === k ? esc(c.name) : '') + '</button>';
    }).join('') + '</div>';
  }
  function assetRow(chain, t, n, fresh) {
    var tok = S.tokens[t];
    return '<div class="asset' + (fresh ? ' new' : '') + '">' + tokIcon(t, chain) +
      '<div class="a-name"><b>' + esc(tok.name) + '</b><small>' + esc(S.chains[chain].name) + '</small></div>' +
      '<div class="a-amt"><b>' + amountOf(t, n) + '</b><small>' + money(n * tok.price) + '</small></div></div>';
  }
  function assets(w, tab, fresh) {
    var chains = tab === 'all' ? S.chainOrder : [tab], rows = [];
    chains.forEach(function (c) {
      Object.keys(w[c]).forEach(function (t) {
        if (w[c][t] > 0) rows.push(assetRow(c, t, w[c][t], fresh[c] && fresh[c][t]));
      });
    });
    if (!rows.length) {
      return '<div class="empty" data-coach="empty"><img src="' + S.chains[tab].icon + '" alt=""><span>' + esc(S.ui.wallet.empty) + '</span></div>';
    }
    return '<div class="assets">' + rows.join('') + '</div>';
  }
  function wallet(st) {
    var w = st.wallet[st.mode];
    return '<div class="canvas">' +
      '<div class="wal-head"><span class="avatar" aria-hidden="true"></span><span class="app-title">Wallet</span>' +
      '<span class="pill"><i aria-hidden="true"></i>' + esc(S.address) + '</span></div>' +
      missionPill() +
      '<div class="wal-total"><div class="lab">' + esc(S.ui.wallet.total) + '</div><div class="big">' + money(walletTotal(w)) + '</div></div>' +
      chainTabs(st.tab) + assets(w, st.tab, st.fresh[st.mode] || {}) + '</div>' +
      cta(S.ui.wallet.cta, 'now', 'next');
  }

  /* ── 스왑: 공통 조각 ── */
  function seg(mode) {
    return '<div class="seg' + (mode === 'solver' ? ' solver' : '') + '" data-coach="toggle" role="tablist"><span class="seg-thumb" aria-hidden="true"></span>' +
      '<button class="seg-btn' + (mode === 'normal' ? ' on' : '') + '" type="button" role="tab" aria-selected="' + (mode === 'normal') + '" data-act="mode:normal">' + esc(S.normal.label) + '</button>' +
      '<button class="seg-btn' + (mode === 'solver' ? ' on' : '') + '" type="button" role="tab" aria-selected="' + (mode === 'solver') + '" data-act="mode:solver">' + esc(S.solver.label) + '</button></div>';
  }
  function pane(label, spot, amount, foot, coach, dim) {
    var t = S.tokens[spot.token];
    return '<div class="pane" data-coach="' + coach + '"><div class="pane-top"><span class="lab">' + esc(label) + '</span>' + chainTag(spot.chain) + '</div>' +
      '<div class="pane-mid"><span class="amt' + (dim ? ' dim' : '') + '">' + (amount === null ? '—' : amountOf(spot.token, amount)) + '</span>' + tokenPill(spot.token) + '</div>' +
      '<div class="pane-foot"><span>' + (amount === null ? '' : money(amount * t.price)) + '</span><span>' + foot + '</span></div></div>';
  }
  function flip() { return '<div class="flip" aria-hidden="true"><span>↓</span></div>'; }
  function balanceFoot(st, spot) {
    var n = (st.wallet[st.mode][spot.chain] || {})[spot.token] || 0;
    return esc(S.ui.swap.balance) + ' ' + amountOf(spot.token, n) + '<button class="max" type="button" data-act="max">' + esc(S.ui.swap.max) + '</button>';
  }
  function doneBanner(m, t) {
    var line = m.doneLine;
    if (t) line = line.replace('{SIGS}', t.sigs).replace('{GAS}', money(t.gas)).replace('{WAIT}', dur(t.wait));
    return '<div class="done-banner"><b>' + esc(m.doneTitle) + '</b><p>' + esc(line) + '</p></div>';
  }

  /* ── 스왑: 일반 모드 ── */
  function stepOptions(step, i) {
    return '<div class="opts">' + step.options.map(function (o, j) {
      return '<button class="opt" type="button" data-act="pick:' + j + '"><b>' + esc(o.name) + '</b><small>' + esc(S.ui.swap.optTime) + ' ' + dur(o.wait) +
        (o.note ? ' · ' + esc(o.note) : '') + '</small><span class="fee">' + money(o.fee) + '</span></button>';
    }).join('') + '</div>';
  }
  function stepCard(raw, i, st) {
    var p = st.normal, state = i < p.step ? 'done' : i === p.step ? 'now' : 'wait';
    var step = resolve(raw, p.picked[i]);
    var body = '<div class="p-top"><span class="p-num">' + (state === 'done' ? '✓' : i + 1) + '</span><span class="p-kind">' + esc(step.kind) + '</span><span class="p-app">' + esc(step.app) + '</span></div>' +
      '<div class="p-title">' + esc(step.title) + '</div><p class="p-why">' + esc(step.why) + '</p>' +
      // 세로로 쌓는다: [체인] 토큰 → ↓ → [체인] 토큰. 가로로 늘어놓으면 폰 폭에서 쪼개진다.
      '<div class="p-flow"><span class="p-spot">' + chainTag(step.from.chain) + tokenPill(step.from.token) + '</span>' +
      '<span class="arr" aria-hidden="true">↓</span>' +
      '<span class="p-spot">' + chainTag(step.to.chain) + tokenPill(step.to.token) + '</span></div>';
    if (state === 'now' && p.phase === 'options') return '<div class="pstep now">' + body + stepOptions(step, i) + '</div>';
    body += '<div class="p-lines"' + (i === 0 ? ' data-coach="gas"' : '') + '>' + step.lines.map(function (r) {
      return '<div class="line' + (/도착 체인/.test(r[0]) ? ' warn' : '') + '"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
    }).join('') + '</div>';
    if (state === 'done') {
      body += '<div class="p-tx"><span>' + esc(S.pending.done) + ' · <span class="hash">' + esc(p.tx[i]) + '</span></span><a href="#" data-act="noop">' + esc(S.pending.explorer) + '</a></div>';
    } else if (state === 'now' && p.phase === 'idle') {
      body += '<button class="p-act" type="button" data-act="run:' + i + '">' + esc(S.ui.swap.run) + ' · ' + step.sigs.length + '회 서명</button>';
    }
    return '<div class="pstep ' + state + '">' + body + '</div>';
  }
  function normalBar(st) {
    if (st.normal.phase === 'done') return cta(S.normal.nextCta, 'solver', 'mode:solver');
    return cta(S.ui.swap.stepHint.replace('{N}', st.normal.step + 1), 'waiting', 'hint');
  }
  function swapNormal(st) {
    var m = S.normal, got = st.normal.phase === 'done';
    var recv = resolve(m.plan[1], st.normal.picked[1]).to.amount;
    return '<div class="canvas">' + appBar('Swap', '<span class="pill"><i aria-hidden="true"></i>' + esc(S.address) + '</span>') + seg('normal') +
      pane(S.ui.swap.pay, m.pay, m.pay.amount, balanceFoot(st, m.pay), 'pay') + flip() +
      pane(S.ui.swap.get, { chain: S.mission.need.chain, token: S.mission.need.token }, recv, '', 'get', !got) +
      (got ? doneBanner(m, st.tally.normal) : '') +
      '<div class="plan-head" data-coach="plan"><b>' + esc(S.ui.swap.plan) + '</b></div>' +
      m.plan.map(function (s, i) { return stepCard(s, i, st); }).join('') +
      '</div>' + normalBar(st);
  }

  /* ── 스왑: 솔버 모드 ── */
  function minRow(st) {
    return '<div class="min-row" data-coach="min"><span class="lab">' + esc(S.ui.swap.min) + '<b>' + fmt(st.solver.min, 2) + ' USDC</b></span>' +
      '<span class="stp"><button type="button" data-act="min:-1" aria-label="줄이기">−</button><button type="button" data-act="min:1" aria-label="늘리기">+</button></span></div>';
  }
  function quoteRows(st) {
    var q = S.solver.quotes, best = q.reduce(function (a, b) { return b.amount > a.amount ? b : a; });
    if (st.solver.phase === 'quoting') {
      return '<div class="quotes"><div class="q-head"><b>' + esc(S.ui.swap.quoting) + '</b><span>…</span></div>' +
        q.map(function (_, i) { return '<div class="q sk" style="--i:' + i + '"></div>'; }).join('') + '</div>';
    }
    return '<div class="quotes" data-coach="quotes"><div class="q-head"><b>견적 ' + q.length + '</b><span>' + esc(S.ui.swap.picked) + '</span></div>' +
      q.map(function (x, i) {
        return '<div class="q' + (x === best ? ' best' : '') + '" style="--i:' + i + '"><span class="dot' + (x.radius ? ' radius' : '') + '"></span>' +
          '<span class="who">' + esc(x.name) + '<small>' + esc(x.time) + ' · 가스 포함</small></span><span class="amt-q">' + fmt(x.amount, 2) + ' USDC</span></div>';
      }).join('') + '<p class="q-pick">' + esc(S.ui.swap.picked) + ': ' + esc(S.ui.swap.pickNote.replace('{WHO}', best.name)) + '</p></div>';
  }
  function behind() {
    return '<ul class="behind">' + S.solver.behind.map(function (t, i) { return '<li style="--i:' + i + '">' + esc(t) + '</li>'; }).join('') + '</ul>';
  }
  function solverBar(st) {
    var ph = st.solver.phase;
    if (ph === 'idle') return cta(S.ui.swap.quote, 'solver', 'quote', 'quote');
    if (ph === 'quoted') return cta(S.ui.swap.sign, 'solver', 'sign');
    if (ph === 'done') return cta(S.solver.nextCta, 'solver', 'next');
    return cta(ph === 'quoting' ? S.ui.swap.quoting : S.pending.title, 'waiting', 'hint');
  }
  function swapSolver(st) {
    var m = S.solver, ph = st.solver.phase, best = m.quotes[0];
    var got = ph === 'done', quoted = ph !== 'idle' && ph !== 'quoting';
    var rows = m.lines.map(function (r) {
      return [r[0], r[1].replace('{MIN}', fmt(st.solver.min, 2)), /가스/.test(r[0]) ? 'free' : ''];
    });
    var extra = '';
    if (got) extra = doneBanner(m) + behind();
    else if (ph === 'idle') extra = '<div class="q-hint" data-coach="quotes">' + esc(S.ui.swap.quoteHint) + '</div>';
    else extra = quoteRows(st);
    return '<div class="canvas solver-on">' + appBar('Swap', '<span class="pill"><i aria-hidden="true"></i>' + esc(S.address) + '</span>') + seg('solver') +
      pane(S.ui.swap.pay, m.pay, m.pay.amount, balanceFoot(st, m.pay), 'pay') + flip() +
      pane(S.ui.swap.get, m.want, quoted ? best.amount : null, '', 'get', !quoted) +
      (got ? '' : minRow(st)) + lines(rows) + extra + '</div>' + solverBar(st);
  }
  function swap(st) { return st.mode === 'normal' ? swapNormal(st) : swapSolver(st); }

  /* ── 기록판 (폰 밖·비교 화면 공용) ── */
  /* 낸 ETH · 도착한 USDC 는 출발 지갑과 지금 지갑의 차이다 */
  function ledger(st, mode) {
    var w = st.wallet[mode], need = S.mission.need;
    return {
      paid: Math.round((S.holdings.ethereum.eth - ((w.ethereum || {}).eth || 0)) * 1e4) / 1e4,
      got: ((w[need.chain] || {})[need.token]) || 0
    };
  }
  function cell(row, t, l) {
    var v = row.key in l ? l[row.key] : t[row.key], zero = !t.done && !v;
    var txt = zero ? '–'
      : row.unit === '$' ? money(v)
      : row.unit === 'time' ? dur(v)
      : row.unit === 'eth' ? fmt(v, 4) + '<small>ETH</small>'
      : row.unit === 'usdc' ? fmt(v, 2) + '<small>USDC</small>'
      : v + '<small>' + esc(row.unit) + '</small>';
    return '<div class="v' + (zero ? ' zero' : '') + '">' + txt + '</div>';
  }
  function boardGrid(st) {
    var b = S.board, T = st.tally, L = { normal: ledger(st, 'normal'), solver: ledger(st, 'solver') };
    var head = '<div class="h">' + esc(b.title) + '</div><div class="h' + (st.mode === 'normal' ? ' on' : '') + '">' + esc(S.normal.label) +
      '</div><div class="h solver' + (st.mode === 'solver' ? ' on' : '') + '">' + esc(S.solver.label) + '</div>';
    var rows = b.rows.map(function (r) { return '<div class="lab">' + esc(r.label) + '</div>' + cell(r, T.normal, L.normal) + cell(r, T.solver, L.solver); }).join('');
    var status = function (t) { return '<div class="s' + (t.done ? ' done' : '') + '">' + (t.done ? esc(S.mission.clear) : t.sigs ? esc(b.doing) : esc(b.empty)) + '</div>'; };
    return '<div class="board-grid">' + head + rows + '</div><div class="board-foot"><div></div>' + status(T.normal) + status(T.solver) + '</div>';
  }
  function board(st) {
    return '<div class="board-card"><div class="board-title"><b>' + esc(S.board.title) + '</b><span>' + esc(S.board.sub) + '</span></div>' + boardGrid(st) + '</div>';
  }

  /* ── 비교 ── */
  /* 두 모드가 다 끝났을 때만. 숫자를 보고 어느 문장을 쓸지 고른다. */
  function verdict(st) {
    var T = st.tally, c = S.compare;
    if (!T.normal.done || !T.solver.done) return '<p class="cmp-half">' + esc(c.half) + '</p>';
    var n = ledger(st, 'normal'), s = ledger(st, 'solver');
    var head = c.headline.replace('{SIGS_N}', T.normal.sigs).replace('{SIGS_S}', T.solver.sigs)
      .replace('{GAS_N}', money(T.normal.gas)).replace('{GAS_S}', money(T.solver.gas))
      .replace('{WAIT_N}', dur(T.normal.wait)).replace('{WAIT_S}', dur(T.solver.wait));
    var diff = fmt(n.paid - s.paid, 4), got = fmt(Math.abs(s.got - n.got), 2);   // 단위는 문장에 이미 있다
    var line = s.got >= n.got
      ? c.verdict.cheaper.replace('{DIFF}', diff).replace('{GOT}', got)
      : c.verdict.mixed.replace('{DIFF}', diff).replace('{GOT}', got).replace('{WAIT}', dur(T.normal.wait));
    return '<div class="cmp-verdict"><b>' + esc(head) + '</b><p>' + esc(line) + '</p></div>';
  }
  function compare(st) {
    var c = S.compare;
    return '<div class="canvas cmp">' + appBar('비교') + '<h2 class="cmp-title">' + esc(c.title) + '</h2>' + verdict(st) +
      '<div class="board-card">' + boardGrid(st) + '</div></div>' +
      cta(c.cta, 'now', 'restart');
  }

  /* ── 서명 시트 · 처리 중 ── */
  function change(sign, spot, amount, chainKey) {
    return '<div class="chg ' + sign + '">' + tokIcon(spot.token, chainKey) + '<span class="what">' + esc(S.chains[chainKey].name) +
      '<b>' + (sign === 'minus' ? '− ' : '+ ') + amount + ' ' + esc(S.tokens[spot.token].name) + '</b></span></div>';
  }
  function signSheet(sheet) {
    var w = S.sign;
    var changes = sheet.approve
      ? '<div class="chg"><span class="what">' + esc(sheet.approve) + '<b>Approve</b></span></div>'
      : change('minus', sheet.from, amountOf(sheet.from.token, sheet.from.amount), sheet.from.chain) +
        change('plus', sheet.to, (sheet.min ? '≥ ' : '') + amountOf(sheet.to.token, sheet.to.amount), sheet.to.chain);
    return '<div class="scrim" data-act="reject"></div><div class="sheet" role="dialog" aria-label="' + esc(w.title) + '"><div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="sheet-head"><b>' + esc(w.title) + ' · ' + esc(sheet.name) + '</b><span class="n">' + esc(sheet.count) + '</span></div>' +
      '<div class="sheet-app"><img src="../brand/Radius_horizontallogo_black.svg" alt="">' + esc(w.from) + '</div>' +
      '<div class="sheet-lab">' + esc(w.changes) + '</div><div class="changes">' + changes + '</div>' +
      '<div class="sheet-fee' + (sheet.gas ? '' : ' free') + '"><span>' + esc(w.fee) + '</span><b>' + (sheet.gas ? money(sheet.gas) + ' · ' + fmt(sheet.gas / S.tokens.eth.price, 5) + ' ETH' : esc(S.sign.free)) + '</b></div>' +
      '<div class="sheet-btns"><button class="reject" type="button" data-act="reject">' + esc(w.reject) + '</button><button class="confirm" type="button" data-act="confirm">' + esc(w.confirm) + '</button></div></div>';
  }
  function pendingCard(p) {
    return '<div class="pend"><div class="pend-top"><span class="spin" aria-hidden="true"></span><span><b>' + esc(S.pending.title) + ' · ' + esc(p.name) + '</b>' +
      '<small>예상 ' + dur(p.wait) + ' · ' + esc(S.pending.ff) + ' ×' + fmt(p.ff, 0) + '</small></span></div>' +
      '<div class="prog" style="--ff:' + p.ms + 'ms"><i></i></div><div class="ff"><span>' + esc(p.hash) + '</span><span>' + esc(p.where) + '</span></div></div>';
  }

  return {
    mission: mission, wallet: wallet, swap: swap, compare: compare, board: board,
    signSheet: signSheet, pendingCard: pendingCard, esc: esc, fmt: fmt, resolve: resolve, dur: dur
  };
})();
