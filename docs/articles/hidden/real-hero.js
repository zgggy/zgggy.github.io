window.__registerHiddenArticleTrigger?.(({ onArticleOpen, onArticleClose, open }) => {
  let heroCloseCount = 0;
  let heroTitleArmed = false;

  onArticleClose(({ slug }) => {
    if (slug === 'hero') {
      heroCloseCount += 1;
      heroTitleArmed = heroCloseCount >= 5;
      return;
    }

    if (!slug) return;
    heroCloseCount = 0;
    heroTitleArmed = false;
  });

  onArticleOpen(({ slug, setTitleAction }) => {
    if (slug !== 'hero' || !heroTitleArmed) return;

    setTitleAction({
      ariaLabel: '打开真个人简介',
      activate: () => {
        heroCloseCount = 0;
        heroTitleArmed = false;
        open();
      }
    });
  });
});
