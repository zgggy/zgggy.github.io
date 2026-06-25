window.__registerArticleFeature({
  slug: 'hidden/game',
  setup(api) {
  const utils = window.__hiddenFeatureUtils__;
  if (!utils || typeof utils.bindKeySequence !== 'function') return;

  utils.bindKeySequence(
    api.onKeydown,
    ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    () => api.open()
  );
  }
});
