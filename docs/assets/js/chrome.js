function renderSiteHeader() {
  const root = document.getElementById('site-header-root');
  if (!root) return;

  root.innerHTML = [
    '<div class="header-inner">',
    '  <a class="brandmark" href="./">',
    '    <span class="brandmark-main">派大栓</span>',
    '    <span class="brandmark-sub">WIRED NOTES / POEMS / ARCHIVE</span>',
    '  </a>',
    '</div>'
  ].join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSiteHeader();
});