function renderSiteHeader() {
  const root = document.getElementById('site-header-root');
  if (!root) return;

  root.innerHTML = [
    '<div class="header-inner">',
    '  <a class="brandmark" href="/test/blog-v2/">',
    '    <span class="brandmark-main">派大栓</span>',
    '    <span class="brandmark-sub">WIRED NOTES / POEMS / ARCHIVE</span>',
    '  </a>',
    '  <a class="header-link" href="https://github.com/zgggy/zgggy.github.io" target="_blank" rel="noreferrer" aria-label="GitHub"><img class="header-icon" src="https://cdn.simpleicons.org/github/111111" alt="GitHub"></a>',
    '</div>'
  ].join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSiteHeader();
});