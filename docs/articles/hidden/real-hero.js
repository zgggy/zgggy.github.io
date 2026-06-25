window.__registerArticleFeature({
  slug: 'hidden/real-hero',
  setup(api) {
  let heroCloseCount = 0;
  let heroTitleArmed = false;
  const gradientPalettes = [
    ['#ff6b6b', '#ffd166'],
    ['#7c3aed', '#22d3ee'],
    ['#ec4899', '#8b5cf6'],
    ['#f97316', '#fb7185'],
    ['#10b981', '#3b82f6'],
    ['#eab308', '#ef4444']
  ];
  const gradientDirections = ['90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

  function clearHeroTitleGradient() {
    const title = document.getElementById('article-modal-title');
    if (!title) return;
    title.style.backgroundImage = '';
    title.style.color = '';
    title.style.webkitTextFillColor = '';
    title.style.webkitBackgroundClip = '';
    title.style.backgroundClip = '';
  }

  function applyHeroTitleGradient() {
    const title = document.getElementById('article-modal-title');
    if (!title) return;

    const palette = gradientPalettes[Math.floor(Math.random() * gradientPalettes.length)];
    const direction = gradientDirections[Math.floor(Math.random() * gradientDirections.length)];

    title.style.backgroundImage = `linear-gradient(${direction}, ${palette[0]}, ${palette[1]})`;
    title.style.webkitBackgroundClip = 'text';
    title.style.backgroundClip = 'text';
    title.style.color = 'transparent';
    title.style.webkitTextFillColor = 'transparent';
  }

  api.onArticleClose(({ slug }) => {
    clearHeroTitleGradient();

    if (slug === 'hero') {
      if (heroTitleArmed) {
        heroCloseCount = 0;
        heroTitleArmed = false;
        return;
      }
      heroCloseCount += 1;
      heroTitleArmed = heroCloseCount >= 5;
      return;
    }

    if (!slug) return;
    heroCloseCount = 0;
    heroTitleArmed = false;
  });

  api.onArticleOpen(({ slug, setTitleAction }) => {
    clearHeroTitleGradient();
    if (slug !== 'hero' || !heroTitleArmed) return;

    applyHeroTitleGradient();

    setTitleAction({
      ariaLabel: '打开真个人简介',
      activate: () => {
        clearHeroTitleGradient();
        heroCloseCount = 0;
        heroTitleArmed = false;
        api.open();
      }
    });
  });
  }
});
