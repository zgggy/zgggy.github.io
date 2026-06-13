window.__registerSiteFeature?.(({
  runtimeData,
  getArticle,
  openArticle,
  onAppReady,
  onArticleOpen,
  onArticleClose,
  onKeydown,
  onDirectoryFilterClick,
  unlockHiddenDirectory,
  isHiddenDirectoryUnlocked
}) => {
  const hiddenTriggerFactories = [];
  const modalTitleActions = () => window.__modalTitleActions__;

  function enhanceArticleOpenPayload(payload) {
    const controller = modalTitleActions();
    if (!controller || typeof controller.enhancePayload !== 'function') return payload;
    return controller.enhancePayload(payload);
  }

  function createHiddenTriggerApi(article) {
    return {
      slug: article ? article.slug : '',
      article,
      open() {
        if (article) openArticle(article.slug);
      },
      openArticle,
      onArticleOpen(handler) {
        if (typeof handler !== 'function') return function noop() {};
        return onArticleOpen((payload) => {
          handler(enhanceArticleOpenPayload(payload));
        });
      },
      onArticleClose,
      onKeydown,
      onDirectoryFilterClick,
      unlockHiddenDirectory,
      isHiddenDirectoryUnlocked
    };
  }

  function loadHiddenTriggerScript(entry) {
    if (!entry || !entry.jsUrl) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const scriptUrl = new URL(entry.jsUrl, window.location.href);
      scriptUrl.searchParams.set('_', String(Date.now()));
      script.src = scriptUrl.toString();
      script.async = false;
      script.dataset.hiddenSlug = entry.slug;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load hidden trigger script: ' + entry.jsUrl));
      document.head.appendChild(script);
    });
  }

  window.__registerHiddenArticleTrigger = function registerHiddenArticleTrigger(factory) {
    const currentScript = document.currentScript;
    const slug = currentScript && currentScript.dataset ? currentScript.dataset.hiddenSlug || '' : '';
    if (!slug || typeof factory !== 'function') return;
    hiddenTriggerFactories.push({ slug, factory });
  };

  onAppReady(async () => {
    const hiddenWithScripts = (runtimeData.hiddenScripts || [])
      .filter((entry) => entry && entry.jsUrl)
      .filter((entry, index, list) => list.findIndex((item) => item.slug === entry.slug) === index);

    for (const entry of hiddenWithScripts) {
      try {
        await loadHiddenTriggerScript(entry);
      } catch (error) {
        console.warn('[hidden-trigger] bootstrap failed:', error);
      }
    }

    hiddenTriggerFactories.forEach(({ slug, factory }) => {
      try {
        factory(createHiddenTriggerApi(getArticle(slug) || null));
      } catch (error) {
        console.warn('[hidden-trigger] setup failed:', slug, error);
      }
    });
  });
});
