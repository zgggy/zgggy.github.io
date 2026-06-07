const HOME_SLOT_SLUGS = ["hero","lovestory1","lovestory2","lovestory3","midline","footer"];
const LOVE_TIMER_START = "2013-05-08T00:00:00+08:00";
const HIDDEN_ARTICLE_DIR = "hidden/";

function escapeHtml(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getArticleCategory(article) {
  return article.tags && article.tags.length ? article.tags[0] : '未分类';
}

function getArticleTagText(article) {
  return article.tags && article.tags.length > 1 ? article.tags.slice(1).join(' ') : '';
}

function formatArticleMeta(article) {
  return [getArticleCategory(article), article.publishedAt, getArticleTagText(article)].filter(Boolean).join(' / ');
}

function formatModalMeta(article) {
  return [getArticleCategory(article), getArticleTagText(article)].filter(Boolean).join(' ');
}

function isHiddenArticleEntry(entry) {
  const section = String((entry && entry.section) || '');
  const slug = String((entry && entry.slug) || '');
  const mdPath = normalizeArticleMdPath(entry && entry.mdPath);
  return section === 'hidden' || slug.startsWith(HIDDEN_ARTICLE_DIR) || mdPath.startsWith(HIDDEN_ARTICLE_DIR);
}

function getPoemBodyVariantClass(article) {
  const tags = article && Array.isArray(article.tags) ? article.tags : [];
  if (tags.includes('旧体诗')) return ' is-classic-poem';
  if (tags.includes('现代诗')) return ' is-modern-poem';
  return '';
}

function normalizeArticleMdPath(input) {
  return String(input || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function buildSiteUrl(relativePath) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  return new URL(window.__SITE_DATA__.site.root + '/' + normalized, window.location.href).toString();
}

function getSiteRootPath() {
  return new URL(window.__SITE_DATA__.site.root + '/', window.location.href).pathname.replace(/\/$/, '');
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function normalizePublishedAt(value, fallbackYear) {
  const input = String(value || '').trim();
  if (!input) return '';
  const resolvedYear = typeof fallbackYear === 'number' ? fallbackYear : new Date().getFullYear();

  let matched = input.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (matched) {
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return input;
    return year + '-' + padDatePart(month) + '-' + padDatePart(day);
  }

  matched = input.match(/^(\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (matched) {
    const month = Number(matched[1]);
    const day = Number(matched[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return input;
    return String(resolvedYear) + '-' + padDatePart(month) + '-' + padDatePart(day);
  }

  return input;
}

function getArticlePathWithoutExtension(mdPath) {
  const normalized = normalizeArticleMdPath(mdPath);
  if (/\/README\.md$/i.test(normalized)) return normalized.replace(/\/README\.md$/i, '');
  if (/^README\.md$/i.test(normalized)) return 'README';
  return normalized.replace(/\.(md|js)$/i, '');
}

function resolveArticleSlugFromMdPath(mdPath) {
  const pathWithoutExtension = getArticlePathWithoutExtension(mdPath);
  const segments = pathWithoutExtension.split('/').filter(Boolean);
  const baseName = segments[segments.length - 1] || '';
  const parentName = segments.length > 1 ? segments[segments.length - 2] : '';
  if (parentName === 'home' && HOME_SLOT_SLUGS.includes(baseName)) return baseName;
  return pathWithoutExtension;
}

function resolveArticleSlugFromScriptPath(jsPath) {
  return resolveArticleSlugFromMdPath(jsPath);
}

function parsePublishedAtSortValue(value) {
  const input = normalizePublishedAt(value);
  if (!input) return null;
  const matched = input.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const timestamp = Date.UTC(year, month - 1, day);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareArticlesByDisplayOrder(left, right) {
  const leftTime = parsePublishedAtSortValue(left.publishedAt);
  const rightTime = parsePublishedAtSortValue(right.publishedAt);
  const leftHasTime = leftTime !== null;
  const rightHasTime = rightTime !== null;

  if (leftHasTime && rightHasTime && leftTime !== rightTime) return rightTime - leftTime;
  if (leftHasTime !== rightHasTime) return leftHasTime ? -1 : 1;

  return String(left.title || '').localeCompare(String(right.title || ''), 'zh-CN-u-co-pinyin', { sensitivity: 'base' });
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

function normalizeWhitespace(input) {
  return input.replace(/\s+/g, ' ').trim();
}

const BACKTICK = String.fromCharCode(96);
const CODE_FENCE = BACKTICK.repeat(3);

function stripMarkdown(input) {
  return normalizeWhitespace(
    input
      .replace(new RegExp(CODE_FENCE + '[\\s\\S]*?' + CODE_FENCE, 'g'), ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/[*_~]/g, ' ')
      .replace(new RegExp(String.fromCharCode(96), 'g'), ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function isSpecialLine(line) {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    /^#{1,6}\s+/.test(trimmed) ||
    trimmed.startsWith(CODE_FENCE) ||
    /^>\s?/.test(trimmed) ||
    /^\s*[-*+]\s+/.test(trimmed) ||
    /^\s*\d+\.\s+/.test(trimmed) ||
    /^---+$/.test(trimmed) ||
    /^<!--/.test(trimmed)
  );
}

function resolveArticleSlugFromHref(href) {
  const sanitized = new URL(href.trim(), window.location.href).pathname;
  const siteRootPath = getSiteRootPath();
  const normalized = siteRootPath && sanitized.startsWith(siteRootPath + '/')
    ? sanitized.slice(siteRootPath.length)
    : sanitized;
  return window.__SITE_DATA__.linkMap && (window.__SITE_DATA__.linkMap[sanitized] || window.__SITE_DATA__.linkMap[normalized]);
}

function resolveRuntimeAsset(rawHref, article) {
  if (/^(https?:)?\/\//.test(rawHref)) return rawHref;
  const cleanHref = rawHref.trim().replace(/\s+"[^"]*"$/, '');
  if (cleanHref.startsWith('/')) return cleanHref;
  const fileName = cleanHref.split('/').pop();
  return buildSiteUrl('assets/images/articles/' + article.slug + '/' + fileName);
}

function createInlineConverter(article) {
  return function convertInline(input) {
    const tokens = [];
    let output = input;

    output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, rawHref) => {
      const assetUrl = resolveRuntimeAsset(rawHref, article);
      const token = '__HTML_TOKEN_' + tokens.length + '__';
      tokens.push('<img class="inline-image" src="' + assetUrl + '" alt="' + escapeHtml(alt) + '">');
      return token;
    });

    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, rawHref) => {
      const href = rawHref.trim();
      const slug = href.startsWith('/') ? resolveArticleSlugFromHref(href) : '';
      const token = '__HTML_TOKEN_' + tokens.length + '__';
      if (slug) {
        tokens.push('<a href="#article-modal" data-article-open="' + slug + '">' + escapeHtml(text) + '</a>');
      } else {
        const resolved = href.startsWith('/') ? href : resolveRuntimeAsset(href, article);
        const external = /^https?:\/\//.test(resolved);
        const target = external ? ' target="_blank" rel="noreferrer"' : '';
        tokens.push('<a href="' + resolved + '"' + target + '>' + escapeHtml(text) + '</a>');
      }
      return token;
    });

    output = escapeHtml(output);
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(new RegExp(String.fromCharCode(96) + '([^' + String.fromCharCode(96) + ']+)' + String.fromCharCode(96), 'g'), '<code>$1</code>');
    tokens.forEach((tokenHtml, index) => {
      output = output.replace('__HTML_TOKEN_' + index + '__', tokenHtml);
    });
    return output;
  };
}

function markdownToHtml(markdown, article) {
  const convertInline = createInlineConverter(article);
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^<!--/.test(trimmed)) {
      while (index < lines.length && !/-->$/.test(lines[index].trim())) index += 1;
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push('<h' + level + '>' + convertInline(headingMatch[2].trim()) + '</h' + level + '>');
      index += 1;
      continue;
    }

    const codeMatch = trimmed.startsWith(CODE_FENCE) ? [trimmed, trimmed.slice(CODE_FENCE.length)] : null;
    if (codeMatch) {
      const language = codeMatch[1].trim() || 'text';
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(CODE_FENCE)) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push('<pre class="code-block"><code class="language-' + escapeHtml(language) + '">' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      html.push('<blockquote>' + quoteLines.map((line) => '<p>' + convertInline(line) + '</p>').join('') + '</blockquote>');
      continue;
    }

    if (/^\s*[-*+]\s+/.test(rawLine)) {
      const items = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim());
        index += 1;
      }
      html.push('<ul>' + items.map((item) => '<li>' + convertInline(item) + '</li>').join('') + '</ul>');
      continue;
    }

    if (/^\s*\d+\.\s+/.test(rawLine)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, '').trim());
        index += 1;
      }
      html.push('<ol>' + items.map((item) => '<li>' + convertInline(item) + '</li>').join('') + '</ol>');
      continue;
    }

    if (article.section === 'poem') {
      html.push('<p class="poem-line">' + convertInline(trimmed) + '</p>');
      index += 1;
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length && !isSpecialLine(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    html.push('<p>' + convertInline(paragraphLines.join(' ')) + '</p>');
  }

  return html.join('\n');
}

function formatAfterwordText(markdown) {
  return escapeHtml(String(markdown || '').trim()).replace(/\n+/g, '<br>');
}

function buildAfterwordsHtml(afterwords) {
  if (!afterwords || !afterwords.length) return '';

  const entries = afterwords
    .slice()
    .sort(compareAfterwordsByDisplayOrder)
    .map((afterword) => {
      return [
        '<article class="article-afterword">',
        afterword.publishedAt ? '<div class="article-afterword-time">' + escapeHtml(afterword.publishedAt) + '</div>' : '',
        '<div class="article-afterword-content">' + formatAfterwordText(afterword.bodyMarkdown) + '</div>',
        '</article>'
      ].join('');
    })
    .join('');

  return '<section class="article-afterwords">' + entries + '</section>';
}

function parseDocumentParts(markdown, fallbackTitle) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let cursor = 0;
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;

  const titleLine = cursor < lines.length ? lines[cursor].trim() : fallbackTitle;
  const title = titleLine.replace(/^#\s+/, '').trim() || fallbackTitle;
  cursor += 1;

  let publishedAt = '';
  let tags = [];
  const summaryLines = [];

  while (cursor < lines.length) {
    const trimmed = lines[cursor].trim();
    if (!trimmed) {
      cursor += 1;
      continue;
    }
    if (!publishedAt && trimmed.startsWith('@')) {
      publishedAt = normalizePublishedAt(trimmed.slice(1).trim());
      cursor += 1;
      continue;
    }
    if (!tags.length && trimmed.startsWith('&')) {
      tags = trimmed.slice(1).trim().split(/\s+/).filter(Boolean);
      cursor += 1;
      continue;
    }
    if (!summaryLines.length && /^>\s?/.test(trimmed)) {
      while (cursor < lines.length && /^>\s?/.test(lines[cursor].trim())) {
        summaryLines.push(lines[cursor].trim().replace(/^>\s?/, ''));
        cursor += 1;
      }
      continue;
    }
    break;
  }

  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
  const trailing = extractTrailingAfterwords(lines.slice(cursor));
  const bodyMarkdown = trailing.bodyLines.join('\n').trim();
  const summary = normalizeWhitespace(summaryLines.join(' '));
  return { title, publishedAt, tags, summary, bodyMarkdown, afterwords: trailing.afterwords };
}

function extractInlineAfterwordDate(line) {
  const input = String(line || '').trim();
  if (!input) return { text: '', publishedAt: '' };
  const matched = input.match(/^(.*?)(?:\s+[&@](.+))$/);
  if (!matched) return { text: input, publishedAt: '' };
  const normalized = normalizePublishedAt(matched[2].trim());
  if (parsePublishedAtSortValue(normalized) === null) return { text: input, publishedAt: '' };
  return { text: matched[1].trim(), publishedAt: normalized };
}

function extractTrailingAfterwords(lines) {
  let scan = lines.length - 1;
  while (scan >= 0 && !lines[scan].trim()) scan -= 1;
  if (scan < 0) return { bodyLines: lines, afterwords: [] };

  const afterwords = [];

  while (scan >= 0) {
    let cursor = scan;
    let publishedAt = '';

    if (/^[&@]\s*/.test(lines[cursor].trim())) {
      const normalized = normalizePublishedAt(lines[cursor].trim().replace(/^[&@]\s*/, ''));
      if (parsePublishedAtSortValue(normalized) === null) break;
      publishedAt = normalized;
      cursor -= 1;
      while (cursor >= 0 && !lines[cursor].trim()) cursor -= 1;
    }

    if (cursor < 0 || !/^>\s?/.test(lines[cursor].trim())) break;

    const quoteLines = [];
    while (cursor >= 0 && /^>\s?/.test(lines[cursor].trim())) {
      quoteLines.unshift(lines[cursor].trim().replace(/^>\s?/, ''));
      cursor -= 1;
    }

    if (!publishedAt && quoteLines.length) {
      const inline = extractInlineAfterwordDate(quoteLines[quoteLines.length - 1]);
      quoteLines[quoteLines.length - 1] = inline.text;
      publishedAt = inline.publishedAt;
    }

    const bodyMarkdown = quoteLines.join('\n').trim();
    if (!bodyMarkdown) break;

    afterwords.push({
      bodyMarkdown,
      publishedAt,
      sourceIndex: afterwords.length
    });

    scan = cursor;
    while (scan >= 0 && !lines[scan].trim()) scan -= 1;
  }

  if (!afterwords.length) return { bodyLines: lines, afterwords: [] };

  return {
    bodyLines: lines.slice(0, scan + 1),
    afterwords: afterwords.reverse()
  };
}

function buildCard(article) {
  const category = getArticleCategory(article);
  const tagText = getArticleTagText(article);
  const displayLabel = tagText || category;
    const metaParts = [
    displayLabel ? '<span class="meta-tags">' + escapeHtml(displayLabel) + '</span>' : '',
    article.publishedAt ? '<span class="meta-time">' + escapeHtml(article.publishedAt) + '</span>' : ''
  ].filter(Boolean).join('');

  return [
    '<article class="article-card" data-section="' + article.section + '" data-tags="' + article.tags.join('|') + '">',
    '  <a class="article-card-link" href="#article-modal" data-article-open="' + article.slug + '">',
    '    <div class="article-card-meta">' + metaParts + '</div>',
    '    <div class="article-card-main"><h3>' + escapeHtml(article.title) + '</h3>' + (article.summary ? '<p>' + escapeHtml(article.summary) + '</p>' : '') + '</div>',
    '  </a>',
    '</article>'
  ].join('');
}

function parseRuntimeArticle(entry, markdown) {
  const parsed = parseDocumentParts(markdown, entry.slug);
  const inferredSection = inferArticleSection(entry.section, parsed.tags);
  const articleContext = { slug: entry.slug, section: inferredSection };
  return {
    slug: entry.slug,
    section: inferredSection,
    title: parsed.title,
    tags: parsed.tags,
    summary: parsed.summary,
    publishedAt: parsed.publishedAt,
    bodyText: stripMarkdown(parsed.bodyMarkdown),
    html: markdownToHtml(parsed.bodyMarkdown, articleContext) + buildAfterwordsHtml(parsed.afterwords)
  };
}

function inferArticleSection(section, tags) {
  if (section === 'hidden') return 'hidden';
  if (section && section !== 'article') return section;
  if ((tags || []).some((tag) => ['诗歌', '现代诗', '旧体诗'].includes(tag))) return 'poem';
  if ((tags || []).includes('散文')) return 'essay';
  if ((tags || []).some((tag) => ['技术', '架构', '状态机', 'C++'].includes(tag))) return 'tech';
  return 'article';
}

function compareAfterwordsByDisplayOrder(left, right) {
  const leftTime = parsePublishedAtSortValue(left.publishedAt);
  const rightTime = parsePublishedAtSortValue(right.publishedAt);
  const leftHasTime = leftTime !== null;
  const rightHasTime = rightTime !== null;

  if (leftHasTime && rightHasTime && leftTime !== rightTime) return rightTime - leftTime;
  if (leftHasTime !== rightHasTime) return leftHasTime ? -1 : 1;

  return (left.sourceIndex || 0) - (right.sourceIndex || 0);
}

async function discoverArticleEntries() {
  const rootPath = getSiteRootPath() + '/articles/';
  const visitedDirs = new Set();
  const discoveredArticles = new Map();
  const discoveredScripts = new Map();

  async function visit(dirUrl) {
    const absoluteDirUrl = new URL(dirUrl, window.location.href).toString();
    if (visitedDirs.has(absoluteDirUrl)) return;
    visitedDirs.add(absoluteDirUrl);

    const response = await fetch(absoluteDirUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to read articles directory: ' + absoluteDirUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nestedVisits = [];

    Array.from(doc.querySelectorAll('a')).forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href === '../') return;
      const resolvedUrl = new URL(href, absoluteDirUrl);
      if (!resolvedUrl.pathname.startsWith(rootPath)) return;

      if (/.md$/i.test(resolvedUrl.pathname)) {
        const mdPath = decodeURIComponent(resolvedUrl.pathname.slice(rootPath.length));
        const slug = resolveArticleSlugFromMdPath(mdPath);
        if (!discoveredArticles.has(slug)) {
          discoveredArticles.set(slug, {
            slug,
            mdPath,
            mdUrl: buildSiteUrl('articles/' + mdPath)
          });
        }
        return;
      }

      if (/.js$/i.test(resolvedUrl.pathname)) {
        const jsPath = decodeURIComponent(resolvedUrl.pathname.slice(rootPath.length));
        if (!jsPath.startsWith(HIDDEN_ARTICLE_DIR)) return;
        const slug = resolveArticleSlugFromScriptPath(jsPath);
        discoveredScripts.set(slug, {
          slug,
          jsPath,
          jsUrl: buildSiteUrl('articles/' + jsPath)
        });
        return;
      }

      if (resolvedUrl.pathname.endsWith('/')) nestedVisits.push(visit(resolvedUrl.toString()));
    });

    await Promise.all(nestedVisits);
  }

  try {
    await visit(buildSiteUrl('articles/'));
    return {
      articles: Array.from(discoveredArticles.values()),
      hiddenScripts: Array.from(discoveredScripts.values())
    };
  } catch (error) {
    return { articles: [], hiddenScripts: [] };
  }
}

async function loadRuntimeArticles() {
  const manifestMap = new Map((window.__SITE_DATA__.articles || []).map((article) => [article.slug, {
    slug: article.slug,
    section: article.section,
    mdPath: article.mdPath,
    mdUrl: buildSiteUrl('articles/' + article.mdPath),
    jsPath: article.jsPath || '',
    jsUrl: article.jsPath ? buildSiteUrl('articles/' + article.jsPath) : ''
  }]));
  const discoveredResources = await discoverArticleEntries();
  discoveredResources.articles.forEach((entry) => {
    const previous = manifestMap.get(entry.slug);
    manifestMap.set(entry.slug, {
      slug: entry.slug,
      section: previous && previous.section ? previous.section : (isHiddenArticleEntry(entry) ? 'hidden' : 'article'),
      mdPath: entry.mdPath,
      mdUrl: entry.mdUrl,
      jsPath: previous && previous.jsPath ? previous.jsPath : '',
      jsUrl: previous && previous.jsUrl ? previous.jsUrl : ''
    });
  });
  discoveredResources.hiddenScripts.forEach((script) => {
    const previous = manifestMap.get(script.slug);
    if (!previous) return;
    previous.jsPath = script.jsPath;
    previous.jsUrl = script.jsUrl;
  });

  const entries = Array.from(manifestMap.values());
  const loaded = (await Promise.all(
    entries.map(async (entry) => {
      try {
        const response = await fetch(entry.mdUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load ' + entry.mdUrl);
        const markdown = await response.text();
        return parseRuntimeArticle(entry, markdown);
      } catch (error) {
        console.warn('[articles] skipped entry:', entry.mdUrl, error);
        return null;
      }
    })
  )).filter(Boolean);

  const homeSlots = HOME_SLOT_SLUGS.map((slug) => loaded.find((item) => item.slug === slug)).filter(Boolean);
  const hiddenSlugs = new Set(HOME_SLOT_SLUGS);
  const hiddenArticles = loaded
    .filter((item) => item.section === 'hidden')
    .map((item) => {
      const matched = manifestMap.get(item.slug);
      return {
        ...item,
        jsPath: matched && matched.jsPath ? matched.jsPath : '',
        jsUrl: matched && matched.jsUrl ? matched.jsUrl : ''
      };
    });

  return {
    homeSlots,
    hiddenArticles,
    articles: loaded.filter((item) => !hiddenSlugs.has(item.slug) && item.section !== 'hidden')
  };
}

function initHomeSlots(runtimeData) {
  HOME_SLOT_SLUGS.forEach((slug) => {
    const article = runtimeData.homeSlots.find((item) => item.slug === slug);
    const node = document.querySelector('[data-home-slot="' + slug + '"]');
    if (!node || !article) return;

    node.dataset.articleOpen = article.slug;
    node.classList.add('is-ready');

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
    } else if (slug === 'lovestory1') {
      mountLiveDuration(node);
    } else if (slug === 'midline') {
      const textNode = node.querySelector('p');
      if (textNode) textNode.textContent = '- ' + article.title + ' -';
    } else if (slug === 'footer') {
      node.textContent = '- ' + article.title + ' -';
    } else {
      node.textContent = article.title;
    }
  });
}

function initArticleModal(runtimeData) {
  const modal = document.getElementById('article-modal');
  const title = document.getElementById('article-modal-title');
  const meta = document.getElementById('article-modal-meta');
  const side = document.querySelector('.article-modal-side');
  const time = document.getElementById('article-modal-time');
  const summary = document.getElementById('article-modal-summary');
  const body = document.getElementById('article-modal-body');
  const close = document.getElementById('article-modal-close');
  if (!modal || !title || !meta || !side || !time || !summary || !body || !close) return;

  const articleMap = new Map(runtimeData.homeSlots.concat(runtimeData.articles, runtimeData.hiddenArticles || []).map((article) => [article.slug, article]));
  let currentArticleSlug = '';
  let modalTitleAction = null;
  const articleOpenListeners = [];
  const articleCloseListeners = [];
  const keydownListeners = [];
  const hiddenTriggerFactories = [];

  function applyModalTitleAction(action) {
    modalTitleAction = action || null;
    const enabled = !!modalTitleAction;
    title.classList.toggle('is-secret-trigger', enabled);
    title.tabIndex = enabled ? 0 : -1;
    if (enabled) {
      title.setAttribute('role', 'button');
      title.setAttribute('aria-label', modalTitleAction.ariaLabel || title.textContent);
    } else {
      title.removeAttribute('role');
      title.removeAttribute('aria-label');
    }
  }

  function addHiddenListener(store, handler) {
    if (typeof handler !== 'function') return function noop() {};
    store.push(handler);
    return () => {
      const index = store.indexOf(handler);
      if (index >= 0) store.splice(index, 1);
    };
  }

  function emitHiddenListeners(store, payload) {
    store.slice().forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.warn('[hidden-trigger] listener failed:', error);
      }
    });
  }

  function createArticleOpenPayload(article) {
    return {
      slug: article.slug,
      article,
      openArticle,
      open(slug) {
        openArticle(slug);
      },
      setTitleAction(config) {
        if (!config || currentArticleSlug !== article.slug) return;
        applyModalTitleAction({
          ariaLabel: config.ariaLabel || article.title,
          activate: typeof config.activate === 'function'
            ? config.activate
            : () => {
                if (config.targetSlug) openArticle(config.targetSlug);
              }
        });
      },
      clearTitleAction() {
        if (currentArticleSlug === article.slug) applyModalTitleAction(null);
      }
    };
  }

  function createHiddenTriggerApi(article) {
    return {
      slug: article.slug,
      article,
      open() {
        openArticle(article.slug);
      },
      openArticle,
      onArticleOpen(handler) {
        return addHiddenListener(articleOpenListeners, handler);
      },
      onArticleClose(handler) {
        return addHiddenListener(articleCloseListeners, handler);
      },
      onKeydown(handler) {
        return addHiddenListener(keydownListeners, handler);
      }
    };
  }

  function loadHiddenTriggerScript(article) {
    if (!article || !article.jsUrl) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const scriptUrl = new URL(article.jsUrl, window.location.href);
      scriptUrl.searchParams.set('_', String(Date.now()));
      script.src = scriptUrl.toString();
      script.async = false;
      script.dataset.hiddenSlug = article.slug;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load hidden trigger script: ' + article.jsUrl));
      document.head.appendChild(script);
    });
  }

  async function initHiddenTriggerScripts() {
    window.__registerHiddenArticleTrigger = function registerHiddenArticleTrigger(factory) {
      const currentScript = document.currentScript;
      const slug = currentScript && currentScript.dataset ? currentScript.dataset.hiddenSlug || '' : '';
      if (!slug || typeof factory !== 'function') return;
      hiddenTriggerFactories.push({ slug, factory });
    };

    const hiddenWithScripts = (runtimeData.hiddenArticles || []).filter((article) => article.jsUrl);
    for (const article of hiddenWithScripts) {
      await loadHiddenTriggerScript(article);
    }

    hiddenTriggerFactories.forEach(({ slug, factory }) => {
      const article = articleMap.get(slug);
      if (!article) return;
      try {
        factory(createHiddenTriggerApi(article));
      } catch (error) {
        console.warn('[hidden-trigger] setup failed:', slug, error);
      }
    });
  }

  function openArticle(slug) {
    const article = articleMap.get(slug);
    if (!article) return;
    currentArticleSlug = slug;
    applyModalTitleAction(null);
    title.textContent = article.title;
    meta.textContent = formatModalMeta(article);
    meta.hidden = !meta.textContent;
    time.textContent = article.publishedAt || '';
    time.hidden = !time.textContent;
    summary.textContent = article.summary || '';
    summary.hidden = !summary.textContent;
    side.hidden = time.hidden && summary.hidden;
    modal.classList.toggle('has-modal-side', !side.hidden);
    body.className = 'article-modal-body article-body' + (article.section === 'poem' ? ' poem-body' + getPoemBodyVariantClass(article) : '');
    body.innerHTML = article.html;
    modal.scrollTop = 0;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-modal-open');
    requestAnimationFrame(() => {
      modal.scrollTop = 0;
    });
    emitHiddenListeners(articleOpenListeners, createArticleOpenPayload(article));
  }

  function closeArticle() {
    const closedSlug = currentArticleSlug;
    const closedArticle = closedSlug ? articleMap.get(closedSlug) : null;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-modal-open');
    currentArticleSlug = '';
    applyModalTitleAction(null);
    if (closedSlug) emitHiddenListeners(articleCloseListeners, { slug: closedSlug, article: closedArticle, openArticle });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-article-open]');
    if (trigger) {
      event.preventDefault();
      openArticle(trigger.dataset.articleOpen);
      return;
    }

    if (event.target === modal) {
      closeArticle();
    }
  });

  close.addEventListener('click', closeArticle);
  title.addEventListener('click', () => {
    if (!modalTitleAction || typeof modalTitleAction.activate !== 'function') return;
    modalTitleAction.activate();
  });
  title.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!modalTitleAction || typeof modalTitleAction.activate !== 'function') return;
    event.preventDefault();
    modalTitleAction.activate();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeArticle();
    emitHiddenListeners(keydownListeners, {
      event,
      key: event.key,
      normalizedKey: String(event.key || '').length === 1 ? String(event.key).toLowerCase() : String(event.key || ''),
      openArticle
    });
  });

  initHiddenTriggerScripts().catch((error) => {
    console.warn('[hidden-trigger] bootstrap failed:', error);
  });
}

function initHomeDirectory(runtimeData) {
  const directory = document.getElementById('article-directory');
  const filterContainer = document.getElementById('category-filters');
  if (!directory || !filterContainer) return;

  let activeSection = 'all';
  const articles = runtimeData.articles;
  const categories = Array.from(new Set(articles.map((article) => getArticleCategory(article))));
  const filterItems = [{ key: 'all', label: '全部文章', description: '共 ' + articles.length + ' 篇' }].concat(
    categories.map((category) => ({
      key: category,
      label: category,
      description: articles.filter((article) => getArticleCategory(article) === category).length + ' 篇'
    }))
  );
  let lastScrollY = window.scrollY;
  let spacerResetLocked = false;
  let spacerResetTimer = null;
  let correctionTimers = [];
  let directoryAutoScrollActive = false;

  function getScrollSpacer() {
    return document.getElementById('directory-scroll-spacer');
  }

  function clearScrollSpacer() {
    const spacer = getScrollSpacer();
    if (spacer) spacer.style.height = '0px';
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
    return document.querySelector('.directory-layout');
  }

  function getSidebarTarget() {
    return document.querySelector('.directory-sidebar');
  }

  function alignDirectoryIntoView(behavior, useSidebarTarget) {
    syncHeaderState();
    syncLayoutMetrics();
    const target = useSidebarTarget ? getSidebarTarget() || getDirectoryTarget() : getDirectoryTarget();
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
      alignDirectoryIntoView('smooth', false);
      correctionTimers = [220, 420, 680].map((delay) =>
        window.setTimeout(() => {
          if (!directoryAutoScrollActive) return;
          lockSpacerReset();
          alignDirectoryIntoView('auto', true);
        }, delay)
      );
      const releaseTimer = window.setTimeout(() => {
        directoryAutoScrollActive = false;
        correctionTimers = correctionTimers.filter((timerId) => timerId !== releaseTimer);
      }, 760);
      correctionTimers.push(releaseTimer);
    });
  }

  function render() {
    const filtered = articles
      .filter((article) => (activeSection === 'all' ? true : getArticleCategory(article) === activeSection))
      .slice()
      .sort(compareArticlesByDisplayOrder);

    directory.innerHTML = filtered.map(buildCard).join('');
  }

  filterContainer.innerHTML = filterItems.map((item) => {
    return [
      '<a class="filter-button' + (item.key === activeSection ? ' is-active' : '') + '" href="#directory-title" data-filter="' + escapeHtml(item.key) + '">',
      '  <span>' + item.label + '</span>',
      '  <small>' + item.description + '</small>',
      '</a>'
    ].join('');
  }).join('');

  filterContainer.querySelectorAll('[data-filter]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      activeSection = link.dataset.filter;
      filterContainer.querySelectorAll('[data-filter]').forEach((node) => node.classList.toggle('is-active', node === link));
      render();
      scrollDirectoryIntoView();
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!spacerResetLocked && window.scrollY < lastScrollY - 4) clearScrollSpacer();
      lastScrollY = window.scrollY;
    },
    { passive: true }
  );

  ['wheel', 'touchstart'].forEach((eventName) => {
    window.addEventListener(
      eventName,
      () => {
        cancelPendingDirectoryAutoScroll();
      },
      { passive: true }
    );
  });

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(event.key)) {
      cancelPendingDirectoryAutoScroll();
    }
  });

  render();
}

function initAlgorithms() {
  const firstCanvas = document.getElementById('algorithm-canvas-a');
  const secondCanvas = document.getElementById('algorithm-canvas-b');
  if (!firstCanvas || !secondCanvas) return;

  const factories = (window.__ALGORITHM_VISUALIZERS__ || []).filter((item) => item && typeof item.mount === 'function');

  if (factories.length < 2) return;

  const shuffled = factories.slice().sort(() => Math.random() - 0.5).slice(0, 2);
  [firstCanvas, secondCanvas].forEach((canvas, index) => {
    shuffled[index].mount(canvas);
  });
}

function ensureAlgorithmRegistry() {
  if (!Array.isArray(window.__ALGORITHM_VISUALIZERS__)) {
    window.__ALGORITHM_VISUALIZERS__ = [];
  }

  window.__registerAlgorithmVisualizer = (entry) => {
    if (!entry || typeof entry.mount !== 'function') return;
    const store = window.__ALGORITHM_VISUALIZERS__;
    const normalized = {
      id: String(entry.id || ''),
      mount: entry.mount
    };
    const existingIndex = normalized.id ? store.findIndex((item) => item && item.id === normalized.id) : -1;
    if (existingIndex >= 0) {
      store[existingIndex] = normalized;
    } else {
      store.push(normalized);
    }
  };

  return window.__ALGORITHM_VISUALIZERS__;
}

function loadAlgorithmScript(scriptPath) {
  return new Promise((resolve, reject) => {
    if (!scriptPath) {
      resolve();
      return;
    }

    const normalizedPath = String(scriptPath).replace(/^\/+/, '');
    const existing = document.querySelector('script[data-algorithm-path="' + normalizedPath + '"]');
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('算法脚本加载失败：' + normalizedPath)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = false;
    script.dataset.algorithmPath = normalizedPath;
    const scriptUrl = new URL(buildSiteUrl('assets/algorithms/' + normalizedPath), window.location.href);
    scriptUrl.searchParams.set('_', String(Date.now()));
    script.src = scriptUrl.toString();
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('算法脚本加载失败：' + normalizedPath));
    document.head.appendChild(script);
  });
}

async function loadAlgorithmScripts() {
  ensureAlgorithmRegistry();
  const algorithms = Array.isArray(window.__SITE_DATA__.algorithms) ? window.__SITE_DATA__.algorithms : [];
  for (const entry of algorithms) {
    await loadAlgorithmScript(entry && entry.scriptPath);
  }
  return window.__ALGORITHM_VISUALIZERS__;
}

function syncLayoutMetrics() {
  const header = document.getElementById('site-header-root');
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty('--header-height', (header ? header.offsetHeight : 0) + 'px');
}

function syncHeaderState() {
  const header = document.getElementById('site-header-root');
  if (!header) return;
  const wasCondensed = header.classList.contains('is-condensed');
  const expandThreshold = 4;
  const condenseThreshold = 72;
  const condensed = wasCondensed ? window.scrollY > expandThreshold : window.scrollY > condenseThreshold;
  const changed = header.classList.contains('is-condensed') !== condensed;
  header.classList.toggle('is-condensed', condensed);
  if (changed) syncLayoutMetrics();
}

function showRuntimeLoadError(error) {
  const directory = document.getElementById('article-directory');
  if (directory) {
    directory.innerHTML = '<article class="article-card"><div class="article-card-link"><div class="article-card-main"><h3>加载失败</h3><p>' + escapeHtml(String(error.message || error)) + '</p></div></div></article>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  syncLayoutMetrics();
  syncHeaderState();
  await loadAlgorithmScripts();
  initAlgorithms();
  window.addEventListener('resize', () => {
    syncHeaderState();
    syncLayoutMetrics();
  });
  window.addEventListener('scroll', syncHeaderState, { passive: true });
  try {
    const runtimeData = await loadRuntimeArticles();
    initHomeSlots(runtimeData);
    initArticleModal(runtimeData);
    initHomeDirectory(runtimeData);
  } catch (error) {
    console.error(error);
    showRuntimeLoadError(error);
  }
});