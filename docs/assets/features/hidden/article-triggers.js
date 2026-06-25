window.__registerSiteFeature?.(() => {
  // Legacy compatibility only. Article sidecars are now loaded by the shared
  // feature loader and must explicitly declare their target slug.
  window.__registerHiddenArticleTrigger = function registerHiddenArticleTrigger() {
    console.warn('[hidden-trigger] Deprecated. Use window.__registerArticleFeature({ slug, setup }) instead.');
  };
});
