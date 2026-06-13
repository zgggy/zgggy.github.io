window.__registerHiddenArticleTrigger?.(({ open }) => {
  const utils = window.__hiddenFeatureUtils__;
  if (!utils || typeof utils.onFeatureLiveTextClick !== 'function') return;

  utils.onFeatureLiveTextClick(
    ({ text }) => /零个小时零分钟零秒(?:要久，?)?$/.test(text),
    open
  );
});
