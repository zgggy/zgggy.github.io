(function() {
  var MESSAGES = {
    0:   '正在摆弄太阳...',
    10:  '正在和狗狗玩耍...',
    20:  '正在学校上课...',
    30:  '正在图书馆睡觉...',
    40:  '正在大树下乘凉...',
    50:  '正在亲吻小羊...',
    60:  '正在村庄里面挖井...',
    70:  '正在修理望远镜...',
    80:  '正在用力握手...',
    90:  '正在打喷嚏...'
  };

  var MIN_DISPLAY_TIME = 100;
  var overlay = document.getElementById('loading-overlay');
  var bar = null;
  var text = null;
  var current = 0;
  var lastUpdateTime = 0;

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

  function applyUpdate(percent) {
    current = Math.max(current, Math.min(100, percent));
    if (bar) {
      bar.firstChild.style.width = current + '%';
    }
    if (text) {
      text.textContent = getMessage(current);
    }
    lastUpdateTime = Date.now();
  }

  function update(percent) {
    if (percent <= current) return Promise.resolve();

    return new Promise(function(resolve) {
      var elapsed = Date.now() - lastUpdateTime;
      var remaining = MIN_DISPLAY_TIME - elapsed;

      if (remaining <= 0) {
        applyUpdate(percent);
        resolve();
      } else {
        setTimeout(function() {
          applyUpdate(percent);
          resolve();
        }, remaining);
      }
    });
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
