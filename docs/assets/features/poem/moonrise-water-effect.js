window.__registerArticleFeature({
  slug: 'poem/镜花',
  setup(api) {
    const STYLE_ID = 'jinghua-moonrise-style';
    const SCENE_SELECTOR = '[data-jinghua-moonrise-scene]';
    const ACTIVE_CLASS = 'is-jinghua-moonrise-active';
    let activationFrame = 0;

    function ensureStyle() {
      if (document.getElementById(STYLE_ID)) return;

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
.jinghua-moonrise-scene {
  position: fixed;
  inset: 0;
  pointer-events: none;
  user-select: none;
  z-index: 10000;
}

.jinghua-moonrise-glow,
.jinghua-moonrise-moon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

.jinghua-moonrise-glow {
  width: min(18rem, 44vw);
  height: min(18rem, 44vw);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 249, 224, 0.22), rgba(255, 249, 224, 0) 68%);
  opacity: 0;
  transform: translate(-50%, 90vh) scale(0.82);
  transition:
    transform 5400ms cubic-bezier(0.16, 0.92, 0.2, 1),
    opacity 420ms linear;
  filter: blur(20px);
}

.jinghua-moonrise-moon {
  font-size: clamp(4.8rem, 14vw, 8rem);
  line-height: 1;
  opacity: 0;
  transform: translate(-50%, 96vh) scale(0.94);
  transition:
    transform 5400ms cubic-bezier(0.16, 0.92, 0.2, 1),
    opacity 320ms linear;
  filter: drop-shadow(0 0 1.2rem rgba(255, 248, 208, 0.24));
}

.jinghua-moonrise-scene.${ACTIVE_CLASS} .jinghua-moonrise-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.jinghua-moonrise-scene.${ACTIVE_CLASS} .jinghua-moonrise-moon {
  opacity: 0.96;
  transform: translate(-50%, -50%) scale(1);
}
      `;
      document.head.appendChild(style);
    }

    function ensureScene() {
      let scene = document.querySelector(SCENE_SELECTOR);
      if (scene) return scene;

      scene = document.createElement('div');
      scene.className = 'jinghua-moonrise-scene';
      scene.dataset.jinghuaMoonriseScene = 'true';
      scene.setAttribute('aria-hidden', 'true');

      const glow = document.createElement('span');
      glow.className = 'jinghua-moonrise-glow';

      const moon = document.createElement('span');
      moon.className = 'jinghua-moonrise-moon';
      moon.textContent = '🌙';

      scene.appendChild(glow);
      scene.appendChild(moon);
      document.body.appendChild(scene);
      return scene;
    }

    function stopAnimation() {
      if (activationFrame) {
        cancelAnimationFrame(activationFrame);
        activationFrame = 0;
      }
      const scene = document.querySelector(SCENE_SELECTOR);
      if (!scene) return;
      scene.classList.remove(ACTIVE_CLASS);
    }

    function playAnimation() {
      stopAnimation();
      ensureStyle();
      const scene = ensureScene();
      void scene.offsetWidth;
      activationFrame = requestAnimationFrame(() => {
        scene.classList.add(ACTIVE_CLASS);
        activationFrame = 0;
      });
    }

    api.onOpen(() => {
      playAnimation();
    });

    api.onClose(() => {
      stopAnimation();
    });
  }
});
