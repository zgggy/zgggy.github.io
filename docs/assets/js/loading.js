(function() {
  var MESSAGES = {
    0:   '正在初始化...',
    10:  '正在加载算法可视化...',
    20:  '正在加载站点功能...',
    30:  '正在加载文章目录...',
    40:  '正在加载首页内容...',
    50:  '正在加载诗歌...',
    60:  '正在加载散文...',
    70:  '正在渲染页面...',
    80:  '正在初始化交互...',
    90:  '即将完成...'
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
