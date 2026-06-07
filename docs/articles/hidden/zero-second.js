window.__registerHiddenArticleTrigger?.(({ open }) => {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.feature-live-text') : null;
    if (!target) return;

    const text = (target.textContent || '').trim();
    if (/零个小时零分钟零秒(?:要久，?)?$/.test(text)) return;
    if (!/零秒(?:要久，?)?$/.test(text)) return;

    open();
  });
});
