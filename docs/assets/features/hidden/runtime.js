(function installHiddenFeatureUtils() {
  const root = window.__hiddenFeatureUtils__ || (window.__hiddenFeatureUtils__ = {});

  root.onFeatureLiveTextClick = function onFeatureLiveTextClick(matcher, handler) {
    if (typeof matcher !== 'function' || typeof handler !== 'function') return function noop() {};

    const listener = (event) => {
      const target = event.target instanceof Element ? event.target.closest('.feature-live-text') : null;
      if (!target) return;

      const text = (target.textContent || '').trim();
      if (!matcher({ event, target, text })) return;
      handler({ event, target, text });
    };

    document.addEventListener('click', listener);
    return () => {
      document.removeEventListener('click', listener);
    };
  };

  root.bindKeySequence = function bindKeySequence(onKeydown, sequence, onMatch) {
    if (typeof onKeydown !== 'function' || !Array.isArray(sequence) || typeof onMatch !== 'function') {
      return function noop() {};
    }

    const expected = sequence.map((key) => String(key));
    const buffer = [];

    return onKeydown(({ normalizedKey }) => {
      if (!normalizedKey) return;
      buffer.push(normalizedKey);
      if (buffer.length > expected.length) buffer.shift();
      if (buffer.length < expected.length) return;

      const matched = expected.every((key, index) => buffer[buffer.length - expected.length + index] === key);
      if (!matched) return;

      buffer.length = 0;
      onMatch();
    });
  };
}());
