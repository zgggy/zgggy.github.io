window.__registerArticleFeature({
  slug: 'poem/旧树',
  setup(api) {
  var MAX_SKEW = 8;
  var SKEW_DELAY = 10000;
  var SKEW_DURATION = 30000;
  var cleanupFns = [];

  function cleanup() {
    cleanupFns.forEach(function(fn) { fn(); });
    cleanupFns = [];
  }

  api.onOpen(function() {
    cleanup();

    var modal = document.getElementById('article-modal');
    var dialog = modal ? modal.querySelector('.article-modal-dialog') : null;
    if (!dialog) return;

    var timer = setTimeout(function() {
      dialog.style.transition = 'transform ' + SKEW_DURATION + 'ms ease-in';
      dialog.style.transformOrigin = 'bottom left';
      requestAnimationFrame(function() {
        dialog.style.transform = 'skewX(' + MAX_SKEW + 'deg)';
      });
    }, SKEW_DELAY);

    cleanupFns.push(function() {
      clearTimeout(timer);
      dialog.style.transition = '';
      dialog.style.transform = '';
      dialog.style.transformOrigin = '';
    });
  });

  api.onClose(function() { cleanup(); });
  }
});
