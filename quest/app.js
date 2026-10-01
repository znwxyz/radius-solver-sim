/* 상태와 동작. 화면은 screens.js 가 그리고, 여기는 무엇을 눌렀을 때 상태가 어떻게 되는지만 안다.
   상태는 바꿀 때마다 새 객체로 만든다(render 가 통째로 다시 그린다). */
(function () {
  'use strict';
  var S = window.MODE, V = window.SCREENS, C = window.COACH;
  var screen = document.getElementById('screen');
  var beadLists = document.querySelectorAll('.beads');   // 데스크톱은 폰 위, 폰에서는 폰 안 머리에 하나씩
  var boardEl = document.getElementById('board');
  var FF_MS = 3200, TOAST_MS = 2800, DONE_MS = 900, THEME_KEY = 'solver-b-theme', LANG_KEY = 'solver-b-lang';   // DONE_MS: 처리 완료 표시를 잠깐 보여 주고 넘어간다
  var timer = null, toastTimer = null, noteTimer = null, timers = [];   // timers: 견적 도착처럼 여러 개를 한꺼번에 거는 것
  var litKey = null;   // 받는 수량을 이미 세어 올린 적이 있는지(같은 견적 한 번만)
  var seenArrived = 0; // 견적이 몇 개까지 도착한 상태를 그렸는지 — 새로 오면 그 줄까지 스크롤
  var last = { at: -1, mode: null, step: -1, phase: null, solverPhase: null, normalDone: false };   // 직전에 그린 상태. 무엇이 바뀌었는지 보고 전환 모션을 건다
  var noteEl = document.getElementById('side-note');

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function tally() { return { sigs: 0, gas: 0, wait: 0, decide: 0, done: false }; }
  function fresh() {
    return {
      at: 0, ob: 0, mode: 'normal', tab: 'all', toast: '', coach: null, seen: {},   // ob: 첫 화면 온보딩에서 넘긴 장
      wallet: { normal: clone(S.holdings), solver: clone(S.holdings) },
      fresh: { normal: {}, solver: {} },
      normal: { step: 0, phase: 'idle', sig: 0, picked: {}, tx: [] },   // picked 는 단계 번호 → 고른 선택지
      solver: { phase: 'idle', min: S.solver.minReceive, tx: null, arrived: [] },   // arrived: 도착한 견적의 번호, 도착 순서
      tally: { normal: tally(), solver: tally() },
      pending: null
    };
  }
  var st = fresh();

  function set(patch) { st = Object.assign({}, st, patch); render(); }
  function setMode(mode, patch) { var o = {}; o[mode] = Object.assign({}, st[mode], patch); set(o); }
  function hash() {
    var h = '0x'; for (var i = 0; i < 4; i++) h += Math.floor(Math.random() * 16).toString(16);
    return h + '…' + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  }

  /* ── 지갑 잔액 옮기기 ── 새 지갑 객체를 만들어 돌려준다 */
  function moved(w, chain, token, delta) {
    var next = clone(w); next[chain] = next[chain] || {};
    next[chain][token] = Math.max(0, Math.round(((next[chain][token] || 0) + delta) * 1e6) / 1e6);
    if (next[chain][token] === 0 && delta < 0) delete next[chain][token];
    return next;
  }
  function payGas(w, chain, usd) { return usd ? moved(w, chain, S.chains[chain].gas, -usd / S.tokens.eth.price) : w; }
  function transfer(w, from, to) { return moved(moved(w, from.chain, from.token, -from.amount), to.chain, to.token, to.amount); }
  function bump(mode, patch) {
    var t = Object.assign({}, st.tally[mode]);
    Object.keys(patch).forEach(function (k) { t[k] = k === 'done' ? patch[k] : t[k] + patch[k]; });
    var all = Object.assign({}, st.tally); all[mode] = t; return all;
  }
  function mark(mode, to) {
    var f = clone(st.fresh); f[mode][to.chain] = f[mode][to.chain] || {}; f[mode][to.chain][to.token] = true; return f;
  }

  /* ── 일반 모드 동작 ── */
  function currentStep() { return V.resolve(S.normal.plan[st.normal.step], st.normal.picked[st.normal.step]); }
  function runStep(i) {
    if (i !== st.normal.step || st.normal.phase !== 'idle') return;
    setMode('normal', { phase: currentStep().options ? 'options' : 'sign', sig: 0 });
  }
  function pickOption(j) {
    var picked = Object.assign({}, st.normal.picked); picked[st.normal.step] = j;
    setMode('normal', { picked: picked, phase: 'sign', sig: 0 });
  }
  /* 느린 선택지는 처리 중 애니메이션을 두 배로 끈다. 실제 시간을 기다리게 하진 않는다. */
  function pendingFor(name, wait, where, slow) {
    var ms = slow ? FF_MS * 2 : FF_MS;
    return { name: name, wait: wait, ms: ms, hash: hash(), where: where };
  }
  function normalSheet() {
    var step = currentStep(), sig = step.sigs[st.normal.sig];
    return { name: sig.name, count: (st.normal.sig + 1) + ' / ' + step.sigs.length, gas: sig.gas,
      approve: /^Approve/.test(sig.name) ? S.sign.approveWhat : null, from: step.from, to: step.to };
  }
  function confirmNormal() {
    var step = currentStep(), sig = step.sigs[st.normal.sig], last = st.normal.sig + 1 >= step.sigs.length;
    var wallets = Object.assign({}, st.wallet, { normal: payGas(st.wallet.normal, step.from.chain, sig.gas) });
    var patch = { wallet: wallets, tally: bump('normal', { sigs: 1, gas: sig.gas }),
      normal: Object.assign({}, st.normal, { sig: st.normal.sig + 1, phase: last ? 'pending' : 'sign' }) };
    if (last) patch.pending = pendingFor(step.option ? step.option.name : step.kind, step.wait, S.chains[step.to.chain].name, step.option && step.option.slow);
    set(patch);
    if (last) timer = setTimeout(function () { settle(finishNormal); }, patch.pending.ms);
  }
  function finishNormal() {
    var step = currentStep(), next = st.normal.step + 1, done = next >= S.normal.plan.length;
    var wallets = Object.assign({}, st.wallet, { normal: transfer(st.wallet.normal, step.from, step.to) });
    set({ wallet: wallets, fresh: mark('normal', step.to), pending: null,
      tally: bump('normal', { wait: step.wait, decide: step.decide ? 1 : 0, done: done }),
      normal: Object.assign({}, st.normal, { step: next, phase: done ? 'done' : 'idle', sig: 0, tx: st.normal.tx.concat([st.pending.hash]) }) });
  }

  /* ── 솔버 모드 동작 ── */
  function bestQuote() { return S.solver.quotes.reduce(function (a, b) { return b.amount > a.amount ? b : a; }); }
  /* 견적은 솔버마다 다른 시점에 도착한다. 다 모이면 잠깐 뒤 규칙이 고른다. */
  function quote() {
    if (st.solver.phase !== 'idle') return;
    setMode('solver', { phase: 'quoting', arrived: [] });
    var last = 0;
    S.solver.quotes.forEach(function (q, i) {
      last = Math.max(last, q.delay);
      timers.push(setTimeout(function () { setMode('solver', { arrived: st.solver.arrived.concat([i]) }); }, q.delay));
    });
    timers.push(setTimeout(function () { setMode('solver', { phase: 'quoted' }); }, last + S.solver.pickAfter));
  }
  /* 받는 수량이 0 에서 올라가며 켜진다. 같은 견적에서 한 번만. */
  function countUp() {
    var el = screen.querySelector('.amt[data-count]');
    if (!el || litKey === st.solver.phase + ':' + st.solver.tx) return;
    litKey = st.solver.phase + ':' + st.solver.tx;
    var target = Number(el.dataset.count), t0 = performance.now(), MS = 1400;
    if (calmMotion()) { el.classList.add('lit'); return; }
    (function tick(now) {
      var k = Math.min(1, (now - t0) / MS), e = 1 - Math.pow(1 - k, 3);
      el.textContent = V.fmt(target * e, 2);
      if (k < 1) requestAnimationFrame(tick); else el.classList.add('lit');
    })(t0);
  }
  function calmMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ── 폰 안 스크롤 ── 브라우저의 smooth 는 엔진마다 속도가 달라 뚝뚝 끊겼고, nearest 는 카드가 화면보다 크면
     위만 맞추고 아래를 잘랐다. 직접 느긋하게(ease-out) 굴린다. 다시 그려서 canvas 가 바뀌면 멈춘다. */
  var GLIDE_MS = 750, GLIDE_PAD = 10;
  var RISE_START_MS = 450, RISE_PX_PER_MS = 0.5;   // 퀘스트 클리어 파도: 시작 지연, 차오르는 속도
  function glide(el, to) {
    var from = el.scrollTop;
    to = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, to));
    if (Math.abs(to - from) < 1) return;
    if (calmMotion()) { el.scrollTop = to; return; }
    var t0 = performance.now();
    (function tick(now) {
      if (screen.querySelector('.canvas') !== el) return;
      var k = Math.min(1, (now - t0) / GLIDE_MS), e = 1 - Math.pow(1 - k, 3);
      el.scrollTop = from + (to - from) * e;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function layoutTop(el, canvas) {   // canvas 안에서의 세로 위치(스크롤·변형과 무관한 레이아웃 값)
    var y = 0;
    while (el && el !== canvas) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }
  /* align — 'start': 대상 위를 화면 위에 · 'end': 대상 아래를 화면 아래에 · 'nearest': 안 보일 때만 가까운 쪽으로 */
  function glideTo(target, align) {
    var canvas = screen.querySelector('.canvas');
    if (!canvas || !target) return;
    var c = canvas.getBoundingClientRect(), r = target.getBoundingClientRect();
    // 자리·높이는 레이아웃 값으로 잰다. 등장 애니메이션(scale)이 도는 중에 rect 로 재면 몇 px 어긋난다. canvas 는 position: relative
    var top = layoutTop(target, canvas), height = target.offsetHeight, view = c.height;
    var atStart = top - GLIDE_PAD, atEnd = top + height - view + GLIDE_PAD;
    // 'start' 인데 여유 때문에 아래가 몇 px 잘리는 크기(작은 폰의 단계 카드)면 아래를 맞춘다. 화면보다 큰 카드만 위부터.
    if (align === 'start') return glide(canvas, height <= view && height + GLIDE_PAD > view ? atEnd - GLIDE_PAD : atStart);
    if (align === 'end') return glide(canvas, atEnd);
    if (r.top < c.top + GLIDE_PAD) return glide(canvas, atStart);
    if (r.bottom > c.bottom - GLIDE_PAD) return glide(canvas, height > view ? atStart : atEnd);
  }
  /* 퀘스트 클리어: 검정이 아래(버튼 칸)부터 파도처럼 차오른다(사용자).
     칸마다 높이로 늦춤·길이를 재서, 칸이 바뀌어도 같은 속도로 이어 올라가게 한다. 다시 그리면 .rise 가 빠져 한 번만 돈다 */
  function riseDone() {
    if (calmMotion()) return;
    var at = RISE_START_MS;
    ['.bar.on-black', '.done-zone', '.plan-panel.is-done'].forEach(function (sel) {
      var el = screen.querySelector(sel);
      if (!el) return;
      var ms = el.offsetHeight / RISE_PX_PER_MS;
      el.style.setProperty('--rise-at', Math.round(at) + 'ms');
      el.style.setProperty('--rise-ms', Math.round(ms) + 'ms');
      at += ms;
    });
    screen.classList.add('rise');
  }
  /* 견적이 하나 올 때마다 그 줄이 보이게 따라 내려간다. 다 모여 규칙이 고르면 고른 줄까지. */
  function followQuotes() {
    var ph = st.solver.phase, n = (st.solver.arrived || []).length;
    if (ph !== 'quoting' && ph !== 'quoted') { seenArrived = 0; return; }
    var target = ph === 'quoted' ? screen.querySelector('.q.pick') : screen.querySelectorAll('.q.in')[n - 1];
    if (!target || (ph === 'quoting' && n === seenArrived)) return;
    seenArrived = n;
    glideTo(target, 'nearest');
  }
  function nudgeMin(dir) {
    var m = Math.max(0, Math.min(bestQuote().amount - 1, st.solver.min + dir * S.solver.minStep));
    setMode('solver', { min: m });
  }
  function solverSheet() {
    var m = S.solver;
    return { name: m.sig.name, count: '1 / 1', gas: 0, min: true, from: m.pay,
      to: { chain: m.want.chain, token: m.want.token, amount: st.solver.min } };
  }
  function confirmSolver() {
    var m = S.solver;
    set({ tally: bump('solver', { sigs: 1, decide: 1 }), solver: Object.assign({}, st.solver, { phase: 'pending' }),
      pending: pendingFor(S.pending.order, m.wait, S.chains[m.want.chain].name, false) });
    timer = setTimeout(function () { settle(finishSolver); }, FF_MS);
  }
  /* 진행 바가 다 차면 완료 표시를 잠깐 보여 주고 나서 넘어간다. 바로 사라지면 끝난 줄 모른다. */
  function settle(fn) {
    set({ pending: Object.assign({}, st.pending, { done: true }) });
    timer = setTimeout(fn, DONE_MS);
  }
  function finishSolver() {
    var m = S.solver, to = { chain: m.want.chain, token: m.want.token, amount: bestQuote().amount };
    var wallets = Object.assign({}, st.wallet, { solver: transfer(st.wallet.solver, m.pay, to) });
    set({ wallet: wallets, fresh: mark('solver', to), pending: null, tally: bump('solver', { wait: m.wait, done: true }),
      solver: Object.assign({}, st.solver, { phase: 'done', tx: st.pending.hash }) });
  }

  /* ── 공통 동작 ── */
  function toast(msg) {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(function () { set({ toast: '' }); }, TOAST_MS);
  }
  function move(dir) {
    var n = st.at + dir;
    if (n < 0 || n >= S.steps.length) return;
    if (st.pending) return toast(S.ui.toast.pending);
    set({ at: n, toast: '' });
  }
  function hint() {   /* 솔버 모드의 기다리는 버튼을 눌렀을 때 */
    toast(st.solver.phase === 'quoting' ? S.ui.toast.quoting : S.ui.toast.busy);
  }
  function switchMode(mode) {
    if (st.pending) return toast(S.ui.toast.mode);
    set({ mode: mode, toast: '' });
  }
  function restart() {
    clearTimeout(timer); clearTimeout(toastTimer);
    timers.forEach(clearTimeout); timers = []; litKey = null;
    last = { at: -1, mode: null, step: -1, phase: null, solverPhase: null, normalDone: false };
    st = fresh(); render();
  }
  function theme(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 저장 못 해도 화면은 돈다 */ }
  }
  function toggleTheme() { theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }
  /* 영어 버전은 아직 없다. 눌리기만 하고 아무 말이 없으면 고장으로 읽히니, 준비 중이라고 말한다. */
  /* 언어는 data.js(한글) 위에 data-en.js 가 영어를 덮어써서 정해진다 — 페이지를 열 때 한 번.
     그래서 바꿀 때는 고른 언어를 기억해 두고 그 언어로 다시 연다. 저장이 막힌 창도 있어서 주소(?lang=)에도 싣는다 */
  function lang(code) {
    if (code === S.lang) return;
    try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* 저장이 막혀도 아래 주소로 그 언어가 열린다 */ }
    location.search = '?lang=' + code;
  }
  /* index.html 에 박힌 글(페이지 제목, 버튼 이름, 주의사항)을 지금 언어로. 한국어는 index.html 그대로다 */
  function pick(path) {
    return path.split('.').reduce(function (v, k) { return v == null ? v : v[k]; }, S);
  }
  function localizePage() {
    var P = S.page, isEn = S.lang === 'en';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { var v = pick(el.dataset.t); if (v) el.textContent = v; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-aria]'), function (el) { var v = pick(el.dataset.tAria); if (v) el.setAttribute('aria-label', v); });
    if (P && P.title) document.title = P.title;
    var notes = document.querySelector('.foot ul');
    if (P && P.notes && notes) notes.innerHTML = P.notes.map(function (n) { return '<li>' + V.esc(n) + '</li>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.lang'), function (g) {
      g.classList.toggle('is-en', isEn);
      Array.prototype.forEach.call(g.querySelectorAll('.lang-btn'), function (btn) {
        var on = btn.dataset.act === 'lang:' + S.lang;
        btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
      });
    });
  }
  function note(msg) {
    clearTimeout(noteTimer);
    noteEl.textContent = msg; noteEl.classList.toggle('show', !!msg);
    if (msg) noteTimer = setTimeout(function () { note(''); }, TOAST_MS);
  }

  /* ── 코치마크: 어느 화면에서 어떤 묶음을 보여 줄지 ── */
  function coachKey() {
    var t = S.steps[st.at].type;
    if (t === 'wallet') return st.tab === 'robinhood' ? 'wallet-empty' : 'wallet';
    if (t === 'swap' && st.mode === 'normal' && st.normal.step === 0 && st.normal.phase === 'idle') return 'normal';
    if (t === 'swap' && st.mode === 'normal' && st.normal.step === 0 && st.normal.phase === 'sign') return 'gas';   // 1단계 서명 요청이 떴을 때
    if (t === 'swap' && st.mode === 'solver' && st.solver.phase === 'idle') return 'solver';
    return null;
  }
  function coachStep(dir) {
    var c = st.coach, seen = Object.assign({}, st.seen);
    if (!c) return;
    var i = dir === 'skip' ? Infinity : c.i + 1;
    if (i >= S.coach[c.key].length) { seen[c.key] = true; return set({ coach: null, seen: seen }); }
    set({ coach: { key: c.key, i: i } });
  }
  function coachAfterRender() {
    var key = coachKey();
    if (!st.coach && key && !st.seen[key]) st.coach = { key: key, i: 0 };
    if (st.coach && st.coach.key !== key) st.coach = null;
    if (!st.coach) return;
    if (!C.mount(screen, S.coach[st.coach.key], st.coach.i, S.coach)) coachStep('skip');
  }

  /* ── 전환 모션 ── 다시 그린 뒤, 직전 상태와 비교해 무엇이 바뀌었는지에 따라 건다 */
  function transitions(type) {
    var canvas = screen.querySelector('.canvas');
    var stepChanged = last.at !== st.at, modeChanged = !stepChanged && last.mode !== st.mode;
    if (canvas && (stepChanged || modeChanged)) canvas.classList.add('screen-in');
    if (modeChanged) screen.classList.add('flip-' + st.mode);
    if (type === 'swap' && st.mode === 'normal' && !stepChanged) {
      var now = screen.querySelector('.pstep.now');
      if (now && st.normal.step !== last.step && st.normal.step > 0) {
        now.classList.add('just');
        glideTo(now, 'start');   // 다음 단계 카드의 제목이 화면 위에 오게. 카드가 화면보다 커도 위부터 읽힌다
      }
      var opts = screen.querySelector('.pstep.now .opts');
      if (opts && st.normal.phase === 'options' && last.phase !== 'options') glideTo(opts.closest('.pstep'), 'end');   // 선택지를 담은 2단계 박스 아래 끝까지(선택지만 맞추면 박스 하단이 잘렸다)
      if (st.normal.phase === 'done' && last.phase !== 'done') {
        glideTo(screen.querySelector('.done-banner'), 'end');   // 3단계 아래 붙은 완료 배너까지 보이게
        riseDone();
      }
    }
    if (type === 'swap' && st.mode === 'solver' && st.solver.phase === 'done' && last.solverPhase !== 'done') {
      glideTo(screen.querySelector('.behind') || screen.querySelector('.done-banner'), 'end');   // 배너 아래 "뒤에서 무슨 일이"까지 — 손으로 내리지 않게(사용자)
    }
    last = { at: st.at, mode: st.mode, step: st.normal.step, phase: st.normal.phase, solverPhase: st.solver.phase, normalDone: st.tally.normal.done };
  }

  /* ── 그리기 ── */
  function drawBeads() {
    var html = S.steps.map(function (s, i) {
      return '<li><button type="button" class="' + (i === st.at ? 'at' : i < st.at ? 'done' : '') + '" data-act="go:' + i + '">' + V.esc(s.label) + '</button></li>';
    }).join('');
    Array.prototype.forEach.call(beadLists, function (el) { el.innerHTML = html; });
  }
  function overlay() {
    if (st.pending) return V.pendingCard(st.pending);
    var m = st.mode;
    if (st[m].phase !== 'sign') return '';
    return V.signSheet(m === 'normal' ? normalSheet() : solverSheet());
  }
  var lastKey = null;   // 마지막으로 그린 화면(단계+모드). 같으면 스크롤 위치를 지킨다
  function render() {
    var type = S.steps[st.at].type, key = st.at + ':' + st.mode;
    var prev = screen.querySelector('.canvas'), top = prev && lastKey === key ? prev.scrollTop : 0;
    screen.className = 'screen' + (st.mode === 'solver' ? ' solver-on' : '');
    screen.innerHTML = V[type](st) + (type === 'swap' ? overlay() : '') +
      (st.toast ? '<div class="toast" role="status">' + V.esc(st.toast) + '</div>' : '');
    // 통째로 다시 그리면 스크롤이 맨 위로 튄다. 단계 카드를 누를 때마다 다시 내려오게 하지 않는다.
    var canvas = screen.querySelector('.canvas');
    if (canvas && top) canvas.scrollTop = top;
    lastKey = key;
    drawBeads();
    boardEl.innerHTML = V.board(st);
    if (type === 'mission') window.ONBOARD.mount(screen, st, rememberPage);
    if (type === 'why') window.WHY.mount(screen, st, rememberWhy);
    transitions(type);
    coachAfterRender();
    if (type === 'swap' && st.mode === 'solver') { followQuotes(); if (st.solver.phase === 'quoted') countUp(); }
  }

  /* 온보딩 장을 넘겨도 다시 그리지 않는다(스와이프 도중에 화면이 바뀌면 끊긴다). 적어만 둔다 */
  function rememberPage(i) { st = Object.assign({}, st, { ob: i }); }
  function rememberWhy(i) { st = Object.assign({}, st, { why: i }); }   /* 솔버 설명 장도 같은 식으로 */

  /* ── 눌렀을 때 ── */
  var ACTIONS = {
    next: function () { move(1); }, back: function () { move(-1); },
    go: function (n) { if (!st.pending) set({ at: Number(n), toast: '' }); },
    theme: toggleTheme, lang: lang, restart: restart, hint: hint, max: function () { toast(S.ui.toast.max); },
    mode: switchMode, tab: function (k) { set({ tab: k }); },
    run: function (i) { runStep(Number(i)); }, pick: function (j) { pickOption(Number(j)); },
    confirm: function () { st.mode === 'normal' ? confirmNormal() : confirmSolver(); },
    reject: function () { setMode(st.mode, { phase: st.mode === 'normal' ? 'idle' : 'quoted', sig: 0 }); },
    quote: quote, sign: function () { if (st.solver.phase === 'quoted') setMode('solver', { phase: 'sign' }); },
    min: function (d) { nudgeMin(Number(d)); },
    'coach-next': function () { coachStep('next'); }, 'coach-skip': function () { coachStep('skip'); },
    noop: function () { toast(S.ui.toast.explorer); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act], [data-move]');
    if (!el) return;
    if (el.dataset.move) return move(Number(el.dataset.move));
    var parts = el.dataset.act.split(':'), fn = ACTIONS[parts[0]];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(parts[1]);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && st.coach) coachStep('skip');
  });

  // 주의사항은 푸터 한 곳에만 적는다. 폰에서는 푸터가 숨으니 비교 화면이 같은 내용을 접어 보여 준다.
  localizePage();
  var footNotes = document.querySelector('.foot details');
  V.notice = footNotes ? footNotes.innerHTML : '';

  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
  theme(saved === 'dark' ? 'dark' : 'light');
  render();
})();
