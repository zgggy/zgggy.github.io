(function() {
  var MESSAGES = {
    0:   '正在摆弄太阳...',
    10:  '正在和狗狗玩耍...',
    20:  '正在学校上课...',
    30:  '正在炸毁图书馆...',
    40:  '正在大树下乘凉...',
    50:  '正在亲吻小羊...',
    60:  '正在村庄里面挖井...',
    70:  '正在修理望远镜...',
    80:  '正在用力握手...',
    90:  '正在打喷嚏...'
  };

  var overlay = document.getElementById('loading-overlay');
  var bar = null;
  var text = null;
  var current = 0;

  function createUI() {
    if (!overlay) return;
    bar = document.createElement('div');
    bar.className = 'loading-bar';
    var track = document.createElement('div');
    track.className = 'loading-bar-track';
    bar.appendChild(track);
    overlay.appendChild(bar);

    text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = MESSAGES[0];
    overlay.appendChild(text);
  }

  function getMessage(p) {
    var keys = Object.keys(MESSAGES).map(Number).sort(function(a, b) { return b - a; });
    for (var i = 0; i < keys.length; i++) {
      if (p >= keys[i]) return MESSAGES[keys[i]];
    }
    return MESSAGES[0];
  }

  function update(percent) {
    current = Math.max(current, Math.min(100, percent));
    if (bar) {
      bar.firstChild.style.width = current + '%';
    }
    if (text) {
      text.textContent = getMessage(current);
    }
  }

  function hide() {
    if (overlay) {
      overlay.classList.add('is-hidden');
      setTimeout(function() { overlay.remove(); }, 600);
    }
  }

  createUI();

  window.__loading = {
    update: update,
    hide: hide
  };
})();
