window.__registerSiteFeature?.(({ onAppReady, onDirectoryFilterClick }) => {
  let lastScrollY = window.scrollY;
  let spacerResetLocked = false;
  let spacerResetTimer = null;
  let correctionTimers = [];
  let directoryAutoScrollActive = false;
  let pendingDirectoryAlign = false;

  function getScrollSpacer() {
    return document.getElementById('directory-scroll-spacer');
  }

  function collapseScrollSpacer() {
    const spacer = getScrollSpacer();
    if (!spacer) return;
    const spacerHeight = spacer.offsetHeight;
    if (!spacerHeight) return;

    const baseScrollHeight = document.documentElement.scrollHeight - spacerHeight;
    const maxScrollTop = Math.max(baseScrollHeight - window.innerHeight, 0);
    spacer.style.height = '0px';

    if (window.scrollY > maxScrollTop) {
      window.scrollTo({ top: maxScrollTop, behavior: 'auto' });
    }
  }

  function maybeSnapToTop() {
    if (directoryAutoScrollActive) return;
    if (window.scrollY > 0 && window.scrollY < 140) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function lockSpacerReset() {
    spacerResetLocked = true;
    if (spacerResetTimer) window.clearTimeout(spacerResetTimer);
    spacerResetTimer = window.setTimeout(() => {
      spacerResetLocked = false;
      spacerResetTimer = null;
    }, 500);
  }

  function cancelPendingDirectoryAutoScroll() {
    correctionTimers.forEach((timerId) => window.clearTimeout(timerId));
    correctionTimers = [];
    directoryAutoScrollActive = false;
  }

  function getScrollOffset() {
    const header = document.getElementById('site-header-root');
    const headerHeight = header ? header.offsetHeight : 0;
    return headerHeight + 20;
  }

  function getDirectoryTarget() {
    return document.querySelector('.directory-main') || document.querySelector('.directory-layout');
  }

  function preserveScrollPositionCapacity() {
    const spacer = getScrollSpacer();
    if (!spacer) return;
    const currentSpacerHeight = spacer.offsetHeight;
    const baseScrollHeight = document.documentElement.scrollHeight - currentSpacerHeight;
    const minRequiredHeight = window.scrollY + window.innerHeight + 1;
    const requiredExtraSpace = Math.max(0, minRequiredHeight - baseScrollHeight);
    if (requiredExtraSpace > currentSpacerHeight) {
      spacer.style.height = requiredExtraSpace + 'px';
    }
  }

  function alignDirectoryIntoView(behavior) {
    const target = getDirectoryTarget();
    if (!target) return;
    const desiredTop = Math.max(target.getBoundingClientRect().top + window.scrollY - getScrollOffset(), 0);
    const spacer = getScrollSpacer();
    const currentSpacerHeight = spacer ? spacer.offsetHeight : 0;
    const baseScrollHeight = document.documentElement.scrollHeight - currentSpacerHeight;
    const maxScrollTop = Math.max(baseScrollHeight - window.innerHeight, 0);
    const requiredExtraSpace = Math.max(0, desiredTop - maxScrollTop);
    if (spacer) spacer.style.height = requiredExtraSpace > 0 ? requiredExtraSpace + 'px' : '0px';
    window.scrollTo({ top: desiredTop, behavior });
  }

  function scrollDirectoryIntoView() {
    const target = getDirectoryTarget();
    if (!target) return;
    cancelPendingDirectoryAutoScroll();
    directoryAutoScrollActive = true;
    lockSpacerReset();
    requestAnimationFrame(() => {
      alignDirectoryIntoView('smooth');
      const releaseTimer = window.setTimeout(() => {
        directoryAutoScrollActive = false;
        correctionTimers = correctionTimers.filter((timerId) => timerId !== releaseTimer);
      }, 520);
      correctionTimers = [releaseTimer];
    });
  }

  onAppReady(() => {
    window.addEventListener(
      'scroll',
      () => {
        const scrollingUp = window.scrollY < lastScrollY - 4;
        if (scrollingUp && !spacerResetLocked) collapseScrollSpacer();
        if (scrollingUp) maybeSnapToTop();
        lastScrollY = window.scrollY;
      },
      { passive: true }
    );

    window.addEventListener(
      'wheel',
      (event) => {
        cancelPendingDirectoryAutoScroll();
        if (event.deltaY < -1) {
          collapseScrollSpacer();
          requestAnimationFrame(maybeSnapToTop);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      () => {
        cancelPendingDirectoryAutoScroll();
      },
      { passive: true }
    );

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(event.key)) {
        cancelPendingDirectoryAutoScroll();
        if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) {
          collapseScrollSpacer();
          requestAnimationFrame(maybeSnapToTop);
        }
      }
    });

    window.addEventListener('site:directory-rendered', () => {
      if (!pendingDirectoryAlign) return;
      pendingDirectoryAlign = false;
      scrollDirectoryIntoView();
    });
  });

  onDirectoryFilterClick(() => {
    pendingDirectoryAlign = true;
    lockSpacerReset();
    preserveScrollPositionCapacity();
  });

});
