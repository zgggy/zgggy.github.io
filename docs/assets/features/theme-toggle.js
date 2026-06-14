(function () {
  'use strict';

  window.__registerSiteFeature((api) => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function isNightTime() {
      const h = new Date().getHours();
      return h >= 20 || h < 6;
    }

    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (stored === 'light') {
      document.body.classList.remove('dark-mode');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    } else if (isNightTime()) {
      document.body.classList.add('dark-mode');
    }

    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  });
})();
