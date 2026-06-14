window.__registerSiteFeature(function(api) {
  var SLUG = 'poem/别旧人';
  var PETAL_COUNT = 30;
  var FALL_DURATION = 23000;
  var SPAWN_INTERVAL = 500;
  var cleanupFns = [];
  var overlay = null;
  var spawnTimer = null;

  function cleanup() {
    cleanupFns.forEach(function(fn) { fn(); });
    cleanupFns = [];
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function gaussianRandom() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function createPetal() {
    if (!overlay) return;
    var dialog = document.querySelector('.article-modal-dialog');
    if (!dialog) return;

    var rect = dialog.getBoundingClientRect();
    var petal = document.createElement('div');
    petal.className = 'sakura-petal';
    petal.textContent = '🌸';

    var relCenter = rect.width / 2;
    var relSpread = rect.width * 0.15;
    var relX = relCenter + gaussianRandom() * relSpread;
    relX = Math.max(10, Math.min(rect.width - 30, relX));

    var startY = rect.bottom - 50;

    var size = 8 + Math.random() * 24;
    var clearThreshold = 26;
    var blur = size < clearThreshold ? (clearThreshold - size) / clearThreshold * 2.5 : 0;
    var normalizedSize = (size - 8) / 24;
    var duration = FALL_DURATION * (0.6 + (1 - normalizedSize) * 2.0);
    var driftDir = Math.random() < 0.5 ? -1 : 1;

    petal.style.left = (rect.left + relX) + 'px';
    petal.style.top = startY + 'px';
    petal.style.fontSize = size + 'px';
    if (blur > 0) petal.style.filter = 'blur(' + blur.toFixed(1) + 'px)';
    petal.style.setProperty('--drift-dir', driftDir);
    petal.style.animationDuration = duration + 'ms';
    petal.style.animationDelay = (Math.random() * 1000) + 'ms';

    overlay.appendChild(petal);

    setTimeout(function() {
      petal.remove();
    }, FALL_DURATION + 2000);
  }

  api.onArticleOpen(function(payload) {
    cleanup();
    if (payload.slug !== SLUG) return;

    var modal = document.getElementById('article-modal');
    if (!modal) return;

    overlay = document.createElement('div');
    overlay.className = 'sakura-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    modal.appendChild(overlay);

    for (var i = 0; i < 8; i++) {
      setTimeout(createPetal, i * SPAWN_INTERVAL);
    }

    spawnTimer = setInterval(createPetal, SPAWN_INTERVAL);

    cleanupFns.push(function() {
      if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
      if (overlay) { overlay.remove(); overlay = null; }
    });
  });

  api.onArticleClose(function() { cleanup(); });
});
