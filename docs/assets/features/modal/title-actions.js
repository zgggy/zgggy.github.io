window.__registerSiteFeature?.(({ onAppReady, onArticleOpen, onArticleClose, openArticle }) => {
  let titleNode = null;
  let currentAction = null;
  let currentSlug = '';

  function getTitleNode() {
    if (titleNode && document.body.contains(titleNode)) return titleNode;
    titleNode = document.getElementById('article-modal-title');
    return titleNode;
  }

  function applyAction(action) {
    currentAction = action || null;
    const title = getTitleNode();
    if (!title) return;

    const enabled = !!currentAction;
    title.classList.toggle('is-secret-trigger', enabled);
    title.tabIndex = enabled ? 0 : -1;
    if (enabled) {
      title.setAttribute('role', 'button');
      title.setAttribute('aria-label', currentAction.ariaLabel || title.textContent || '');
    } else {
      title.removeAttribute('role');
      title.removeAttribute('aria-label');
    }
  }

  function activateCurrentAction() {
    if (!currentAction || typeof currentAction.activate !== 'function') return;
    currentAction.activate();
  }

  function enhancePayload(payload) {
    if (!payload || !payload.slug) return payload;
    return {
      ...payload,
      setTitleAction(config) {
        if (!config || currentSlug !== payload.slug) return;
        applyAction({
          ariaLabel: config.ariaLabel || payload.article?.title || '',
          activate: typeof config.activate === 'function'
            ? config.activate
            : () => {
                if (config.targetSlug) openArticle(config.targetSlug);
              }
        });
      },
      clearTitleAction() {
        if (currentSlug === payload.slug) applyAction(null);
      }
    };
  }

  window.__modalTitleActions__ = {
    enhancePayload,
    clear() {
      applyAction(null);
    }
  };

  onAppReady(() => {
    const title = getTitleNode();
    if (!title) return;

    title.addEventListener('click', () => {
      activateCurrentAction();
    });

    title.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!currentAction || typeof currentAction.activate !== 'function') return;
      event.preventDefault();
      activateCurrentAction();
    });
  });

  onArticleOpen((payload) => {
    currentSlug = payload && payload.slug ? payload.slug : '';
    applyAction(null);
  });

  onArticleClose(() => {
    currentSlug = '';
    applyAction(null);
  });
});
