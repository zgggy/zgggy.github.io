(function () {
  'use strict';

  window.__registerSiteFeature((api) => {
    let activeCleanup = null;
    const runtime = api.runtimeData;
    const body = runtime.modalBodyElement;
    const modal = runtime.modalElement;

    function cleanup() {
      if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    }

    function buildToc(article) {
      cleanup();
      if (!article || article.section === 'poem') return;
      if (!body || !modal) return;

      const headings = body.querySelectorAll('h2, h3');
      if (headings.length < 3) return;

      headings.forEach((h, i) => {
        if (!h.id) h.id = 'toc-h-' + i;
      });

      const toc = document.createElement('nav');
      toc.className = 'floating-toc';
      toc.innerHTML = Array.from(headings).map((h) => {
        const indent = h.tagName === 'H3' ? ' is-h3' : '';
        return '<a class="floating-toc-item' + indent + '" href="#' + h.id + '">' + (h.textContent || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }) + '</a>';
      }).join('');

      modal.appendChild(toc);

      function onClick(e) {
        const link = e.target.closest('.floating-toc-item');
        if (!link) return;
        e.preventDefault();
        const target = body.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      toc.addEventListener('click', onClick);

      const tocLinks = toc.querySelectorAll('.floating-toc-item');
      function onScroll() {
        let activeIdx = 0;
        const scrollTop = modal.scrollTop;
        headings.forEach((h, i) => {
          if (h.offsetTop - 80 <= scrollTop) activeIdx = i;
        });
        tocLinks.forEach((link, i) => link.classList.toggle('is-active', i === activeIdx));
      }
      modal.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      activeCleanup = function () {
        toc.remove();
        modal.removeEventListener('scroll', onScroll);
      };
    }

    api.onArticleOpen(function (payload) {
      requestAnimationFrame(function () { buildToc(payload.article); });
    });

    api.onArticleClose(function () { cleanup(); });
  });
})();
