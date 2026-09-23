/* 코치마크 — 화면이 그려진 뒤 대상 요소의 자리를 재서 그 위에 덮는다.
   문장은 data.js 의 coach 에 있다. 여기는 자리를 재고 그리는 일만 한다. */
window.COACH = (function () {
  'use strict';
  var PAD = 6, INSET = 4;

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

  /* 대상 둘레에 PAD 만큼 여유를 두되, 폰 화면 가장자리 안쪽(INSET)으로 잘라 넣는다.
     체인 탭처럼 화면 폭 끝까지 붙은 요소는 그냥 두면 링이 화면 밖으로 나가 잘린다. */
  function box(target, screen) {
    var r = target.getBoundingClientRect(), s = screen.getBoundingClientRect();
    var left = Math.max(INSET, r.left - s.left - PAD), right = Math.min(s.width - INSET, r.right - s.left + PAD);
    var top = Math.max(INSET, r.top - s.top - PAD), bottom = Math.min(s.height - INSET, r.bottom - s.top + PAD);
    return { top: top, left: left, width: right - left, height: bottom - top, sh: s.height };
  }

  /* 대상 둘레의 그늘. 링과 같은 반지름으로 둥글게 뚫은 SVG 마스크 한 장이다.
     네 조각 직사각형으로 뚫으면 둥근 링 밖으로 흰 모서리 네 개가 삐져나온다.
     거대한 box-shadow 한 장은 캡처·저사양 기기에서 이전 화면이 겹쳐 보였다. */
  var RADIUS = 16;
  function shades(b) {
    var id = 'coach-hole-' + Date.now();
    return '<svg class="shade" width="100%" height="100%" aria-hidden="true"><defs><mask id="' + id + '">' +
      '<rect width="100%" height="100%" fill="#fff"/>' +
      '<rect x="' + b.left + '" y="' + b.top + '" width="' + b.width + '" height="' + b.height + '" rx="' + RADIUS + '" fill="#000"/>' +
      '</mask></defs><rect width="100%" height="100%" fill="rgba(0,0,0,.58)" mask="url(#' + id + ')"/></svg>';
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
