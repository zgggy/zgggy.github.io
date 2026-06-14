window.__registerSiteFeature(function(api) {
  var SLUG = 'poem/旧树';
  var MAX_SKEW = 8;
  var SKEW_DELAY = 10000;
  var SKEW_DURATION = 30000;
  var cleanupFns = [];

  function cleanup() {
    cleanupFns.forEach(function(fn) { fn(); });
    cleanupFns = [];
  }

  api.onArticleOpen(function(payload) {
    cleanup();
    if (payload.slug !== SLUG) return;

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

  api.onArticleClose(function() { cleanup(); });
});
