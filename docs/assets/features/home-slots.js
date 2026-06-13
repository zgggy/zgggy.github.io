window.__registerSiteFeature?.(({ onHomeSlotReady }) => {
  const LOVE_TIMER_START = '2013-05-08T00:00:00+08:00';

  function getArticleCategory(article) {
    return article && Array.isArray(article.tags) && article.tags.length ? article.tags[0] : '未分类';
  }

  function getArticleTagText(article) {
    return article && Array.isArray(article.tags) && article.tags.length > 1 ? article.tags.slice(1).join(' ') : '';
  }

  function formatArticleMeta(article) {
    return [getArticleCategory(article), article && article.publishedAt, getArticleTagText(article)].filter(Boolean).join(' / ');
  }

  function numberToChinese(value) {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千'];
    const safeValue = Math.max(0, Math.floor(Number(value) || 0));
    if (safeValue === 0) return digits[0];

    let remaining = safeValue;
    let unitIndex = 0;
    let result = '';
    let zeroPending = false;

    while (remaining > 0) {
      const digit = remaining % 10;
      if (digit === 0) {
        zeroPending = result.length > 0;
      } else {
        const chunk = digits[digit] + units[unitIndex];
        result = (zeroPending ? digits[0] : '') + chunk + result;
        zeroPending = false;
      }
      remaining = Math.floor(remaining / 10);
      unitIndex += 1;
    }

    return result.replace(/^一十/, '十');
  }

  function formatDurationSince(start, end) {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) return '';
    const safeEnd = end instanceof Date && !Number.isNaN(end.getTime()) ? end : new Date();
    if (safeEnd <= start) return '我喜欢你比零年零个月零天零个小时零分钟零秒要久，';

    const cursor = new Date(start.getTime());
    let years = 0;
    let months = 0;

    while (true) {
      const next = new Date(cursor.getTime());
      next.setFullYear(next.getFullYear() + 1);
      if (next <= safeEnd) {
        cursor.setTime(next.getTime());
        years += 1;
        continue;
      }
      break;
    }

    while (true) {
      const next = new Date(cursor.getTime());
      next.setMonth(next.getMonth() + 1);
      if (next <= safeEnd) {
        cursor.setTime(next.getTime());
        months += 1;
        continue;
      }
      break;
    }

    let remaining = Math.max(0, safeEnd.getTime() - cursor.getTime());
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    const minuteMs = 60 * 1000;
    const secondMs = 1000;

    const days = Math.floor(remaining / dayMs);
    remaining -= days * dayMs;
    const hours = Math.floor(remaining / hourMs);
    remaining -= hours * hourMs;
    const minutes = Math.floor(remaining / minuteMs);
    remaining -= minutes * minuteMs;
    const seconds = Math.floor(remaining / secondMs);

    return '我喜欢你比' +
      numberToChinese(years) + '年' +
      numberToChinese(months) + '个月' +
      numberToChinese(days) + '天' +
      numberToChinese(hours) + '个小时' +
      numberToChinese(minutes) + '分钟' +
      numberToChinese(seconds) + '秒要久，';
  }

  function mountLiveDuration(node) {
    const textNode = document.createElement('span');
    textNode.className = 'feature-live-text';
    node.replaceChildren(textNode);
    node.classList.add('is-live-duration', 'is-placeholder');

    const startedAt = new Date(LOVE_TIMER_START);
    const render = () => {
      textNode.textContent = formatDurationSince(startedAt, new Date());
    };

    render();
    if (node.__liveDurationTimer) window.clearInterval(node.__liveDurationTimer);
    node.__liveDurationTimer = window.setInterval(render, 1000);
  }

  onHomeSlotReady(({ slug, article, node }) => {
    if (!node || !article) return;

    if (slug === 'hero') {
      const titleNode = node.querySelector('h1');
      const metaNode = node.querySelector('.hero-copy-meta');
      const summaryNode = node.querySelector('.hero-lead');
      if (titleNode) titleNode.textContent = article.title;
      if (metaNode) {
        const metaText = formatArticleMeta(article);
        metaNode.textContent = metaText;
        metaNode.hidden = !metaText;
      }
      if (summaryNode) summaryNode.textContent = article.summary || article.bodyText || '';
      return;
    }

    if (slug === 'lovestory1') {
      mountLiveDuration(node);
      return;
    }

    if (slug === 'midline') {
      const textNode = node.querySelector('p');
      if (textNode) textNode.textContent = '- ' + article.title + ' -';
      return;
    }

    if (slug === 'footer') {
      node.textContent = '- ' + article.title + ' -';
      return;
    }

    node.textContent = article.title;
  });
});
