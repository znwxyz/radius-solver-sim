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
    if (!canvas || !canvas.contains(target)) return;   // 서명 시트처럼 canvas 밖에 있는 대상은 스크롤로 못 끌어온다
    var r = rectOf(target), c = canvas.getBoundingClientRect();
    if (r.top < c.top + 8 || r.bottom > c.bottom - 8) {
      canvas.scrollTop += (r.top - c.top) - 56;
    }
  }

  /* 대상 둘레에 PAD 만큼 여유를 두되, 폰 화면 가장자리 안쪽(INSET)으로 잘라 넣는다.
     체인 탭처럼 화면 폭 끝까지 붙은 요소는 그냥 두면 링이 화면 밖으로 나가 잘린다. */
  /* data-coach-fit="children" 인 대상은 컨테이너가 아니라 자식들이 실제로 차지하는 영역을 잰다.
     체인 탭 줄처럼 가로 스크롤 영역이 있는 컨테이너는 브라우저에 따라 탭보다 아래로 더 길어
     링이 밑으로 늘어졌다. */
  function rectOf(target) {
    if (target.dataset.coachFit !== 'children' || !target.children.length) return target.getBoundingClientRect();
    var u = null;
    Array.prototype.forEach.call(target.children, function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      u = u ? { top: Math.min(u.top, r.top), left: Math.min(u.left, r.left), bottom: Math.max(u.bottom, r.bottom), right: Math.max(u.right, r.right) } : { top: r.top, left: r.left, bottom: r.bottom, right: r.right };
    });
    if (!u) return target.getBoundingClientRect();
    return { top: u.top, left: u.left, bottom: u.bottom, right: u.right, width: u.right - u.left, height: u.bottom - u.top };
  }
  /* 화면 등장 애니메이션(.canvas 가 10px 아래서 떠오른다) 도중에 재면 대상이 실제보다 아래에 있다.
     사파리는 첫 프레임을 바로 적용해서 화면 전환 직후 첫 코치마크가 10px 밀렸다.
     canvas 의 '보이는 자리'와 '레이아웃 자리'의 차이를 빼서 애니메이션과 무관하게 잰다. */
  function drift(target, screen, s) {
    var el = target;   // 대상을 품은 .screen 바로 아래 자식 — canvas, 서명 시트, 처리 중 카드. 등장 애니메이션은 이 층에 걸린다
    while (el && el.parentElement && el.parentElement !== screen) el = el.parentElement;
    if (!el || el.parentElement !== screen) return { x: 0, y: 0 };
    var c = el.getBoundingClientRect();
    return { x: c.left - s.left - el.offsetLeft, y: c.top - s.top - el.offsetTop };
  }
  /* 링의 여유는 네 변이 같아야 한다. 한쪽이 화면 가장자리에 걸려 잘리면 반대쪽도 같은 만큼만 띄운다 —
     하단 버튼처럼 화면 끝에 붙은 대상에서 위는 6px, 아래는 2px 로 어긋나 보였다. */
  function box(target, screen) {
    var r = rectOf(target), s = screen.getBoundingClientRect(), d = drift(target, screen, s);
    var x0 = r.left - s.left - d.x, x1 = r.right - s.left - d.x, y0 = r.top - s.top - d.y, y1 = r.bottom - s.top - d.y;
    var padX = Math.max(0, Math.min(PAD, x0 - INSET, s.width - INSET - x1));
    var padY = Math.max(0, Math.min(PAD, y0 - INSET, s.height - INSET - y1));
    var left = Math.max(INSET, x0 - padX), right = Math.min(s.width - INSET, x1 + padX);
    var top = Math.max(INSET, y0 - padY), bottom = Math.min(s.height - INSET, y1 + padY);
    return { top: top, left: left, width: right - left, height: bottom - top, sh: s.height };
  }

  /* 대상 둘레의 그늘. 링과 같은 반지름으로 둥글게 뚫은 SVG 마스크 한 장이다.
     네 조각 직사각형으로 뚫으면 둥근 링 밖으로 흰 모서리 네 개가 삐져나온다.
     거대한 box-shadow 한 장은 캡처·저사양 기기에서 이전 화면이 겹쳐 보였다. */
  var RADIUS = 16;
  /* 그늘은 화면보다 사방 BLEED px 크게 그린다(넘친 건 화면이 잘라 낸다). 확대 비율이 딱 안 떨어지면
     화면 가장자리 반 픽셀이 덮이지 않아 밝은 세로줄이 비쳤다(사용자). 구멍은 그만큼 옮긴다. styles/guide.css 의 --bleed 와 같게 */
  var BLEED = 2;
  function shades(b) {
    var id = 'coach-hole-' + Date.now();
    return '<svg class="shade" aria-hidden="true"><defs><mask id="' + id + '">' +
      '<rect width="100%" height="100%" fill="#fff"/>' +
      '<rect x="' + (b.left + BLEED) + '" y="' + (b.top + BLEED) + '" width="' + b.width + '" height="' + b.height + '" rx="' + RADIUS + '" fill="#000"/>' +
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
