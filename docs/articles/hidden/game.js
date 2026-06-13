window.__registerHiddenArticleTrigger?.(({ onKeydown, open }) => {
  const utils = window.__hiddenFeatureUtils__;
  if (!utils || typeof utils.bindKeySequence !== 'function') return;

  utils.bindKeySequence(
    onKeydown,
    ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    open
  );
});
