/* 코치마크 — 화면이 그려진 뒤 대상 요소의 자리를 재서 그 위에 덮는다.
   문장은 data.js 의 coach 에 있다. 여기는 자리를 재고 그리는 일만 한다. */
window.COACH = (function () {
  'use strict';
  var PAD = 6;

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 대상이 폰 화면 밖(스크롤 아래)에 있으면 먼저 보이게 끌어온다 */
  function reveal(target, screen) {
    var canvas = screen.querySelector('.canvas');
    if (!canvas) return;
    var r = target.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    if (r.top < c.top + 8 || r.bottom > c.bottom - 8) {
      canvas.scrollTop += (r.top - c.top) - 56;
    }
  }

  function box(target, screen) {
    var r = target.getBoundingClientRect(), s = screen.getBoundingClientRect();
    return { top: r.top - s.top - PAD, left: r.left - s.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, sh: s.height };
  }

  /* 대상 둘레의 네 조각 그늘. 한 장의 거대한 그림자로 뚫으면 캡처·저사양 기기에서
     이전 화면이 겹쳐 보이는 일이 있어 네 개의 면으로 나눈다. */
  function shades(b) {
    var bottom = b.top + b.height, right = b.left + b.width;
    return '<div class="shade" style="top:0;left:0;right:0;height:' + Math.max(0, b.top) + 'px"></div>' +
      '<div class="shade" style="top:' + bottom + 'px;left:0;right:0;bottom:0"></div>' +
      '<div class="shade" style="top:' + b.top + 'px;left:0;width:' + Math.max(0, b.left) + 'px;height:' + b.height + 'px"></div>' +
      '<div class="shade" style="top:' + b.top + 'px;left:' + right + 'px;right:0;height:' + b.height + 'px"></div>';
  }

  function bubbleHtml(step, i, n, words) {
    var last = i === n - 1;
    return '<div class="b-title">' + esc(step.title) + '</div>' +
      '<div class="b-text">' + esc(step.text) + '</div>' +
      '<div class="b-btns"><span class="b-count">' + (i + 1) + ' / ' + n + '</span><span class="btns">' +
      (last ? '' : '<button type="button" data-act="coach-skip">' + esc(words.skip) + '</button>') +
      '<button type="button" class="go" data-act="coach-next">' + esc(last ? words.done : words.next) + '</button></span></div>';
  }

  /* 화면에 덮는다. 대상이 없으면(아직 안 그려진 요소) 그 단계를 건너뛴다. */
  function mount(screen, steps, i, words) {
    var step = steps[i];
    var target = step && screen.querySelector(step.at);
    if (!target) return false;
    reveal(target, screen);
    var b = box(target, screen);
    var below = b.top + b.height + 150 < b.sh;
    var wrap = document.createElement('div');
    wrap.className = 'coach';
    wrap.innerHTML = shades(b) + '<div class="spot" style="top:' + b.top + 'px;left:' + b.left + 'px;width:' + b.width + 'px;height:' + b.height + 'px"></div>' +
      '<div class="bubble ' + (below ? 'below' : 'above') + '" style="' +
      (below ? 'top:' + (b.top + b.height + 12) : 'bottom:' + (b.sh - b.top + 12)) + 'px;--ax:' +
      Math.max(20, Math.min(b.left + 20, 300)) + 'px">' + bubbleHtml(step, i, steps.length, words) + '</div>';
    screen.appendChild(wrap);
    return true;
  }

  return { mount: mount };
})();
