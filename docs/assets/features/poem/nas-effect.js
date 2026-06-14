window.__registerSiteFeature(function(api) {
  var NAS_SLUG = 'poem/NAS';
  var TICK_INTERVAL = 2600;
  var JITTER_DURATION = 300;
  var JITTER_MIN_DELAY = 1000;
  var JITTER_MAX_DELAY = 4000;

  var MESSAGES = [
    '后台进程溢出：内存占用 99%',
    '这些都是假的',
    'PID 7429: SIGKILL — cannot allocate memory',
    'kernel: oom-killer invoked',
    'swap usage: 100% — thrashing detected',
    'memory leak at 0x7ffe4a2b1040',
    '/dev/sda: I/O error, sector 2048819',
    'NAS: fan speed critical — 7200 RPM',
    'heartbeat timeout: 3 packets lost',
    'zpool: checksum error — scrub recommended',
    'rsync: connection reset by peer (errno 104)',
    'dd: write error — No space left on device',
    'smartctl: Reallocated_Sector_Ct — FAILURE',
    'btrfs: csum failed root 5',
    'mdadm: /dev/md0 degraded',
    'systemd: unit nasd.service entered failed state'
  ];

  var JITTER_WORDS = ['静音', '嗡嗡'];
  var cleanupFns = [];

  function wrapJitterWords(container) {
    if (!container) return;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function(node) {
      var text = node.textContent;
      var hasMatch = JITTER_WORDS.some(function(word) { return text.indexOf(word) >= 0; });
      if (!hasMatch) return;

      var fragment = document.createDocumentFragment();
      var remaining = text;
      while (remaining.length > 0) {
        var earliest = -1;
        var matchedWord = '';
        JITTER_WORDS.forEach(function(word) {
          var idx = remaining.indexOf(word);
          if (idx >= 0 && (earliest < 0 || idx < earliest)) {
            earliest = idx;
            matchedWord = word;
          }
        });
        if (earliest < 0) {
          fragment.appendChild(document.createTextNode(remaining));
          break;
        }
        if (earliest > 0) fragment.appendChild(document.createTextNode(remaining.slice(0, earliest)));
        var span = document.createElement('span');
        span.className = 'nas-word-jitter';
        span.textContent = matchedWord;
        fragment.appendChild(span);
        remaining = remaining.slice(earliest + matchedWord.length);
      }
      node.parentNode.replaceChild(fragment, node);
    });
  }

  function cleanup() {
    cleanupFns.forEach(function(fn) { fn(); });
    cleanupFns = [];
  }

  function randomDelay() {
    return JITTER_MIN_DELAY + Math.random() * (JITTER_MAX_DELAY - JITTER_MIN_DELAY);
  }

  function scheduleJitter(elements) {
    var timer = setTimeout(function() {
      elements.forEach(function(el) { el.classList.add('nas-jitter'); });
      var removeTimer = setTimeout(function() {
        elements.forEach(function(el) { el.classList.remove('nas-jitter'); });
        scheduleJitter(elements);
      }, JITTER_DURATION);
      cleanupFns.push(function() { clearTimeout(removeTimer); });
    }, randomDelay());
    cleanupFns.push(function() { clearTimeout(timer); });
  }

  api.onArticleOpen(function(payload) {
    cleanup();
    if (payload.slug !== NAS_SLUG) return;

    var modal = document.getElementById('article-modal');
    var meta = document.getElementById('article-modal-meta');
    var title = document.getElementById('article-modal-title');
    var close = document.getElementById('article-modal-close');
    var time = document.getElementById('article-modal-time');
    var summary = document.getElementById('article-modal-summary');
    var body = document.getElementById('article-modal-body');
    if (!modal) return;

    wrapJitterWords(summary);
    wrapJitterWords(body);

    var textElements = [meta, title, close, time, summary, body].filter(Boolean);
    scheduleJitter(textElements);

    var log = document.createElement('div');
    log.className = 'nas-syslog';
    log.setAttribute('aria-hidden', 'true');

    var prefix = document.createElement('span');
    prefix.className = 'nas-syslog-prefix';
    prefix.textContent = '[$]';

    var text = document.createElement('span');
    text.className = 'nas-syslog-text';

    log.appendChild(prefix);
    log.appendChild(text);
    modal.appendChild(log);

    var idx = Math.floor(Math.random() * MESSAGES.length);
    function tick() {
      text.textContent = MESSAGES[idx % MESSAGES.length];
      idx += 1;
      log.classList.remove('is-flash');
      void log.offsetWidth;
      log.classList.add('is-flash');
    }
    tick();
    var timer = setInterval(tick, TICK_INTERVAL);

    cleanupFns.push(function() {
      clearInterval(timer);
      textElements.forEach(function(el) { el.classList.remove('nas-jitter'); });
      log.remove();
    });
  });

  api.onArticleClose(function() { cleanup(); });
});
