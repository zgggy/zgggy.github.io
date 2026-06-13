window.__registerSiteFeature?.(({
  onDirectoryFilterClick,
  unlockHiddenDirectory,
  isHiddenDirectoryUnlocked
}) => {
  let clickHintTimer = null;

  function showClickHint(clientX, clientY, count) {
    if (count <= 10 || count > 20) return;

    const existing = document.getElementById('all-filter-click-hint');
    if (existing) existing.remove();
    if (clickHintTimer) {
      window.clearTimeout(clickHintTimer);
      clickHintTimer = null;
    }

    const progress = (count - 10) / 10;
    const hint = document.createElement('div');
    hint.id = 'all-filter-click-hint';
    hint.textContent = String(count);
    hint.setAttribute('aria-hidden', 'true');
    hint.style.position = 'fixed';
    hint.style.left = Math.round(typeof clientX === 'number' ? clientX : window.innerWidth / 2) + 'px';
    hint.style.top = Math.round(typeof clientY === 'number' ? clientY : window.innerHeight / 2) + 'px';
    hint.style.transform = 'translate(-50%, -50%) scale(0.86)';
    hint.style.pointerEvents = 'none';
    hint.style.zIndex = '9999';
    hint.style.color = '#111111';
    hint.style.opacity = '0';
    hint.style.fontSize = (16 + progress * 24).toFixed(1) + 'px';
    hint.style.fontWeight = String(Math.round(400 + progress * 500));
    hint.style.lineHeight = '1';
    hint.style.letterSpacing = '-0.03em';
    hint.style.transition = 'transform 180ms ease, opacity 180ms ease';
    document.body.appendChild(hint);

    requestAnimationFrame(() => {
      hint.style.opacity = '0.92';
      hint.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    clickHintTimer = window.setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transform = 'translate(-50%, -50%) scale(1.08)';
      window.setTimeout(() => hint.remove(), 180);
      clickHintTimer = null;
    }, 520);
  }

  onDirectoryFilterClick((payload) => {
    if (!payload || payload.key !== 'all') return;
    if (isHiddenDirectoryUnlocked()) return;

    const event = payload.event;
    showClickHint(event && event.clientX, event && event.clientY, payload.count || 0);

    if ((payload.count || 0) >= 20) {
      unlockHiddenDirectory();
    }
  });
});
