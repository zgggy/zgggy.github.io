window.__registerArticleFeature({
  slug: 'poem/镜花',
  setup(api) {
    const STYLE_ID = 'jinghua-water-effect-style';
    const TARGET_LINE = '月出水中';
    const LINE_SCOPE_CLASS = 'jinghua-water-line';
    const BODY_SCOPE_CLASS = 'jinghua-water-host';
    const BODY_ACTIVE_CLASS = 'is-jinghua-water-active';
    const BODY_RESET_CLASS = 'is-jinghua-water-resetting';
    const SCENE_SELECTOR = '[data-jinghua-center-scene]';
    let cleanupFns = [];
    let activationFrame = 0;

    function ensureStyle() {
      if (document.getElementById(STYLE_ID)) return;

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
.jinghua-water-line {
  cursor: default;
}

.jinghua-water-host {
  position: relative;
}

.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon-top,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-reflection {
  transition: none !important;
  animation: none !important;
}

.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-line-mask,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-line-bar,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-reflection,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon,
.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon-top {
  opacity: 0 !important;
}

.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon {
  transform: translate(-50%, 18%) rotate(180deg) scaleX(-1) scaleY(1) !important;
}

.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-moon-top {
  transform: translate(-50%, -124%) scale(1) !important;
}

.jinghua-water-host.is-jinghua-water-resetting .jinghua-center-reflection {
  transform: translateX(-50%) rotate(180deg) scaleX(-1.06) scaleY(0.72) !important;
}

.jinghua-center-scene {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(18rem, 78%);
  height: 10rem;
  transform: translate(-50%, -44%) scale(0.92);
  transform-origin: center center;
  transition: none;
  opacity: 0;
  pointer-events: none;
  user-select: none;
  z-index: 6;
  isolation: isolate;
}

.jinghua-center-scene::before {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  width: 13.4rem;
  height: 7.6rem;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 68%);
  opacity: 0.8;
  filter: blur(10px);
}

.jinghua-center-line-row,
.jinghua-center-moon,
.jinghua-center-moon-top {
  position: absolute;
  left: 50%;
  transform-origin: center center;
}

.jinghua-center-line-row {
  --jinghua-line-width: 100%;
  width: min(13rem, 84%);
  display: flex;
  justify-content: center;
  transform: translateX(-50%);
}

.jinghua-center-line-mask {
  position: absolute;
  top: calc(50% + 0.08rem);
  left: 50%;
  display: block;
  width: min(11.44rem, 73.92%);
  height: min(11.44rem, 73.92%);
  transform: translateX(-50%);
  background: var(--surface);
  opacity: 0;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(0.78);
  -webkit-backdrop-filter: blur(18px) saturate(0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 0 28px rgba(255, 255, 255, 0.08);
}

.jinghua-center-reflection {
  position: absolute;
  left: 50%;
  top: -0.52rem;
  font-size: clamp(3.8rem, 10vw, 5.3rem);
  line-height: 1;
  transform: translateX(-50%) rotate(180deg) scaleX(-1.06) scaleY(0.72);
  transform-origin: center top;
  opacity: 0;
  filter: blur(2.4px);
  pointer-events: none;
  z-index: 1;
}

.jinghua-center-line-mask::before,
.jinghua-center-line-mask::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.jinghua-center-line-mask::before {
  inset: -6% -22%;
  background:
    repeating-radial-gradient(
      ellipse at 50% -10%,
      rgba(255, 255, 255, 0.34) 0 7px,
      rgba(255, 255, 255, 0.08) 7px 12px,
      rgba(255, 255, 255, 0) 12px 20px
    );
  background-size: 100% 30px;
  background-position: 0 0;
  opacity: 0.72;
  transform: translateX(-20%) scaleY(1.22);
  filter: blur(0.2px);
}

.jinghua-center-line-mask::after {
  inset: -4% -16%;
  background:
    repeating-linear-gradient(
      to right,
      rgba(255, 255, 255, 0.34) 0 5%,
      rgba(255, 255, 255, 0.08) 5% 11%,
      rgba(255, 255, 255, 0) 11% 18%
    ),
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.3),
      rgba(255, 255, 255, 0.12) 24%,
      rgba(255, 255, 255, 0.04) 58%,
      rgba(255, 255, 255, 0) 82%
    );
  mix-blend-mode: screen;
  background-size: 160% 100%, 100% 100%;
  background-position: 0 0, 0 0;
  opacity: 0.46;
  transform: translateX(14%) scaleY(1.08);
}

@keyframes jinghua-water-drift-left {
  0% {
    transform: translateX(-20%) scaleY(1.22);
    background-position: 0 0;
  }
  50% {
    transform: translateX(18%) scaleY(1.34);
    background-position: 0 18px;
  }
  100% {
    transform: translateX(-20%) scaleY(1.22);
    background-position: 0 36px;
  }
}

@keyframes jinghua-water-drift-right {
  0% {
    transform: translateX(14%) scaleY(1.08);
    background-position: 0 0, 0 0;
  }
  50% {
    transform: translateX(-16%) scaleY(1.16);
    background-position: 36px 0, 0 0;
  }
  100% {
    transform: translateX(14%) scaleY(1.08);
    background-position: 72px 0, 0 0;
  }
}

.jinghua-center-line-bar {
  display: block;
  height: 0.18rem;
  width: var(--jinghua-line-width);
  background: currentColor;
  opacity: 0;
  position: relative;
  z-index: 1;
  box-shadow:
    0 0 0.6rem rgba(255, 255, 255, 0.1),
    0 0 1.4rem rgba(255, 255, 255, 0.08);
}

.jinghua-center-line-row.is-line-1 {
  top: calc(50% - 0.5rem);
  --jinghua-line-width: 100%;
  z-index: 1;
}

.jinghua-center-line-row.is-line-2 {
  top: 50%;
  --jinghua-line-width: 88%;
  z-index: 8;
}

.jinghua-center-line-row.is-line-3 {
  top: calc(50% + 0.5rem);
  --jinghua-line-width: 76%;
  z-index: 8;
}

.jinghua-center-line-row.is-line-2 .jinghua-center-line-bar,
.jinghua-center-line-row.is-line-3 .jinghua-center-line-bar {
  z-index: 9;
}

.jinghua-center-moon {
  top: 50%;
  font-size: clamp(3.8rem, 10vw, 5.3rem);
  line-height: 1;
  z-index: 2;
  opacity: 0;
  transform: translate(-50%, 18%) rotate(180deg) scaleX(-1) scaleY(1);
  transition:
    opacity 120ms linear,
    transform 4600ms cubic-bezier(0.2, 0.9, 0.24, 1) 2000ms;
  filter: drop-shadow(0 0 1rem rgba(255, 248, 208, 0.2));
}

.jinghua-center-moon-top {
  top: 50%;
  font-size: clamp(3.8rem, 10vw, 5.3rem);
  line-height: 1;
  z-index: 0;
  opacity: 0;
  transform: translate(-50%, -124%) scale(1);
  filter: drop-shadow(0 0 0.9rem rgba(255, 248, 208, 0.12));
}

@keyframes jinghua-upper-moon-fade {
  0% {
    opacity: 0.88;
    transform: translate(-50%, -124%) scale(1);
  }
  30% {
    opacity: 0.88;
    transform: translate(-50%, -124%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -124%) scale(0.52);
  }
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-scene {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-line-bar {
  opacity: 0.42;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-line-mask {
  opacity: 0.72;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-line-mask::before {
  animation: jinghua-water-drift-left 2.2s linear infinite;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-line-mask::after {
  animation: jinghua-water-drift-right 1.8s linear infinite;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-reflection {
  opacity: 0.46;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-moon-top {
  animation: jinghua-upper-moon-fade 6600ms cubic-bezier(0.2, 0.9, 0.24, 1) both;
}

.jinghua-water-host.is-jinghua-water-active .jinghua-center-moon {
  opacity: 0.94;
  transform: translate(-50%, -138%) rotate(180deg) scaleX(-1) scaleY(1);
}
      `;
      document.head.appendChild(style);
    }

    function cleanup() {
      if (activationFrame) {
        cancelAnimationFrame(activationFrame);
        activationFrame = 0;
      }
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    }

    function setSceneActive(body, active) {
      if (!body) return;
      if (activationFrame) {
        cancelAnimationFrame(activationFrame);
        activationFrame = 0;
      }

      if (active) {
        body.classList.remove(BODY_ACTIVE_CLASS);
        body.classList.remove(BODY_RESET_CLASS);
        void body.offsetWidth;
        activationFrame = requestAnimationFrame(() => {
          body.classList.add(BODY_ACTIVE_CLASS);
          activationFrame = 0;
        });
        return;
      }

      body.classList.remove(BODY_ACTIVE_CLASS);
      body.classList.add(BODY_RESET_CLASS);
      void body.offsetWidth;
      activationFrame = requestAnimationFrame(() => {
        body.classList.remove(BODY_RESET_CLASS);
        activationFrame = 0;
      });
    }

    function ensureScene(body) {
      if (!body) return null;
      body.classList.add(BODY_SCOPE_CLASS);

      const existing = body.querySelector(SCENE_SELECTOR);
      if (existing) return existing;

      const scene = document.createElement('div');
      scene.className = 'jinghua-center-scene';
      scene.dataset.jinghuaCenterScene = 'true';
      scene.setAttribute('aria-hidden', 'true');

      const topMoon = document.createElement('span');
      topMoon.className = 'jinghua-center-moon-top';
      topMoon.textContent = '🌙';
      topMoon.setAttribute('aria-hidden', 'true');

      const mask = document.createElement('span');
      mask.className = 'jinghua-center-line-mask';
      mask.setAttribute('aria-hidden', 'true');

      const reflection = document.createElement('span');
      reflection.className = 'jinghua-center-reflection';
      reflection.textContent = '🌙';
      reflection.setAttribute('aria-hidden', 'true');

      mask.appendChild(reflection);

      const lineRows = [];
      for (let index = 0; index < 3; index += 1) {
        const row = document.createElement('div');
        row.className = 'jinghua-center-line-row';
        row.classList.add('is-line-' + String(index + 1));

        const bar = document.createElement('span');
        bar.className = 'jinghua-center-line-bar';

        row.appendChild(bar);
        lineRows.push(row);
      }

      const moon = document.createElement('span');
      moon.className = 'jinghua-center-moon';
      moon.textContent = '🌙';
      moon.setAttribute('aria-hidden', 'true');

      scene.appendChild(topMoon);
      scene.appendChild(moon);
      scene.appendChild(mask);
      lineRows.forEach((row) => scene.appendChild(row));
      body.appendChild(scene);
      return scene;
    }

    function bindLineScene(line, body) {
      if (!line || !body) return;
      line.classList.add(LINE_SCOPE_CLASS);
      ensureScene(body);

      const onEnter = () => setSceneActive(body, true);
      const onLeave = () => setSceneActive(body, false);

      line.addEventListener('mouseenter', onEnter);
      line.addEventListener('mouseleave', onLeave);
      line.addEventListener('focusin', onEnter);
      line.addEventListener('focusout', onLeave);

      cleanupFns.push(() => {
        line.removeEventListener('mouseenter', onEnter);
        line.removeEventListener('mouseleave', onLeave);
        line.removeEventListener('focusin', onEnter);
        line.removeEventListener('focusout', onLeave);
        line.classList.remove(LINE_SCOPE_CLASS);
      });
      cleanupFns.push(() => setSceneActive(body, false));
    }

    api.onOpen(() => {
      cleanup();
      ensureStyle();
      const body = document.getElementById('article-modal-body');
      if (!body) return;

      const line = Array.from(body.querySelectorAll('.poem-line')).find((node) => {
        return (node.textContent || '').includes(TARGET_LINE);
      });
      bindLineScene(line, body);
    });

    api.onClose(() => {
      cleanup();
      const body = document.getElementById('article-modal-body');
      setSceneActive(body, false);
    });
  }
});
