window.__registerHiddenArticleTrigger?.(({ onKeydown, open }) => {
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const buffer = [];

  onKeydown(({ normalizedKey }) => {
    if (!normalizedKey) return;
    buffer.push(normalizedKey);
    if (buffer.length > sequence.length) buffer.shift();
    if (buffer.length < sequence.length) return;

    const matched = sequence.every((key, index) => buffer[buffer.length - sequence.length + index] === key);
    if (!matched) return;

    buffer.length = 0;
    open();
  });
});
