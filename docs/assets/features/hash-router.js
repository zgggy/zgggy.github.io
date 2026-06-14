(function () {
  'use strict';

  window.__registerSiteFeature((api) => {
    const runtime = api.runtimeData;
    const modal = runtime.modalElement;
    const title = runtime.modalTitleElement;
    const meta = runtime.modalMetaElement;
    const time = runtime.modalTimeElement;
    const summary = runtime.modalSummaryElement;
    const side = runtime.modalSideElement;
    const body = runtime.modalBodyElement;
    let syncingHash = false;

    function pushArticleHash(slug) {
      const newHash = '#/article/' + encodeURIComponent(slug);
      if (window.location.hash !== newHash) {
        syncingHash = true;
        history.pushState({ articleSlug: slug }, '', newHash);
        syncingHash = false;
      }
    }

    function clearHash() {
      if (window.location.hash) {
        syncingHash = true;
        history.pushState(null, '', window.location.pathname + window.location.search);
        syncingHash = false;
      }
    }

    function show404() {
      if (!modal) return;
      if (title) title.textContent = '404';
      if (meta) { meta.textContent = ''; meta.hidden = true; }
      if (time) { time.textContent = ''; time.hidden = true; }
      if (summary) { summary.textContent = '页面走丢了'; summary.hidden = false; }
      if (side) side.hidden = false;
      modal.classList.toggle('has-modal-side', true);
      if (body) {
        body.className = 'article-modal-body article-body';
        body.innerHTML = '<div style="text-align:center;padding:2rem 0"><img src="./assets/images/site/violet_with_case.jpg" alt="404" style="max-width:320px;margin:0 auto;border:1px solid var(--line)"><p style="margin-top:1.4rem;color:var(--text-muted);font-size:0.95rem">你要找的页面不在这里。</p></div>';
      }
      modal.scrollTop = 0;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-modal-open');
      requestAnimationFrame(function () { modal.scrollTop = 0; });
    }

    function handleHashChange() {
      if (syncingHash) return;
      const hash = window.location.hash;
      if (hash === '#/404') {
        show404();
      } else if (hash.startsWith('#/article/')) {
        const slug = decodeURIComponent(hash.slice('#/article/'.length));
        if (slug) api.openArticle(slug);
      }
    }

    api.onArticleOpen(function (payload) {
      pushArticleHash(payload.slug);
    });

    api.onArticleClose(function () {
      if (window.location.hash.startsWith('#/article/') || window.location.hash === '#/404') {
        clearHash();
      }
    });

    window.addEventListener('hashchange', handleHashChange);

    if (window.location.hash.startsWith('#/article/') || window.location.hash === '#/404') {
      setTimeout(handleHashChange, 100);
    }
  });
})();
