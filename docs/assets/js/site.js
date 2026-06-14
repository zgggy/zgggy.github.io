const HOME_SLOT_SLUGS = ["hero","lovestory1","lovestory2","lovestory3","midline","footer"];
const HIDDEN_ARTICLE_DIR = "hidden/";
const SITE_GITHUB_SOURCE = {
  owner: 'zgggy',
  repo: 'zgggy.github.io',
  branch: 'main',
  docsDir: 'docs'
};

function getAlgoColors() {
  const s = getComputedStyle(document.body);
  return {
    bg: s.getPropertyValue('--algo-bg').trim() || '#f7f7f7',
    bgAlt: s.getPropertyValue('--algo-bg-alt').trim() || '#fafafa',
    line: s.getPropertyValue('--algo-line').trim() || '#d0d0d0',
    muted: s.getPropertyValue('--algo-muted').trim() || '#c8c8c8',
    text: s.getPropertyValue('--algo-text').trim() || '#999999',
    textDark: s.getPropertyValue('--algo-text-dark').trim() || '#666666',
    accent: s.getPropertyValue('--algo-accent').trim() || '#333333',
    highlight: s.getPropertyValue('--algo-highlight').trim() || '#4a90e2',
    highlightStroke: s.getPropertyValue('--algo-highlight-stroke').trim() || '#057dbc'
  };
}
window.getAlgoColors = getAlgoColors;
const SITE_SCRIPT_URL = (() => {
  const matchedScript = Array.from(document.scripts || []).find((script) => {
    try {
      return /\/assets\/js\/site\.js(?:[?#].*)?$/.test(new URL(script.src, window.location.href).pathname);
    } catch (error) {
      return false;
    }
  });
  return new URL(matchedScript && matchedScript.src ? matchedScript.src : './assets/js/site.js', window.location.href);
})();
const SITE_ROOT_URL = new URL('../../', SITE_SCRIPT_URL);
const RUNTIME_LINK_MAP = Object.create(null);
let githubTreeCachePromise = null;
const HIDDEN_RUNTIME_BRIDGE = {
  articleOpenListeners: [],
  articleCloseListeners: [],
  keydownListeners: [],
  homeSlotListeners: [],
  appReadyListeners: [],
  directoryFilterListeners: [],
  hiddenDirectoryController: null
};

function addHiddenRuntimeListener(bucket, handler) {
  if (typeof handler !== 'function') return function noop() {};
  bucket.push(handler);
  return () => {
    const index = bucket.indexOf(handler);
    if (index >= 0) bucket.splice(index, 1);
  };
}

function emitHiddenRuntimeListeners(bucket, payload) {
  bucket.slice().forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.warn('[hidden-trigger] listener failed:', error);
    }
  });
}

function setHiddenDirectoryController(controller) {
  HIDDEN_RUNTIME_BRIDGE.hiddenDirectoryController = controller || null;
}

function unlockHiddenDirectoryFromBridge() {
  const controller = HIDDEN_RUNTIME_BRIDGE.hiddenDirectoryController;
  if (!controller || typeof controller.unlock !== 'function') return false;
  return !!controller.unlock();
}

function isHiddenDirectoryUnlockedFromBridge() {
  const controller = HIDDEN_RUNTIME_BRIDGE.hiddenDirectoryController;
  if (!controller || typeof controller.isUnlocked !== 'function') return false;
  return !!controller.isUnlocked();
}

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
  return new URL(normalized, SITE_ROOT_URL).toString();
}

function getSiteRootPath() {
  return SITE_ROOT_URL.pathname.replace(/\/$/, '');
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
  return RUNTIME_LINK_MAP[sanitized] || RUNTIME_LINK_MAP[normalized];
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
      if (trimmed === '-' || trimmed === '—' || trimmed === '---') {
        html.push('<hr class="poem-separator">');
      } else {
        html.push('<p class="poem-line">' + convertInline(trimmed) + '</p>');
      }
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

function inferSectionFromMdPath(mdPath) {
  const firstSegment = normalizeArticleMdPath(mdPath).split('/').filter(Boolean)[0] || '';
  if (firstSegment === 'hidden') return 'hidden';
  if (['essay', 'poem', 'tech', 'article'].includes(firstSegment)) return firstSegment;
  return 'article';
}

function clearRuntimeLinkMap() {
  Object.keys(RUNTIME_LINK_MAP).forEach((key) => {
    delete RUNTIME_LINK_MAP[key];
  });
}

function registerRuntimeLinkAlias(pathname, slug) {
  const siteRootPath = getSiteRootPath();
  const normalizedPath = '/' + String(pathname || '').replace(/^\/+/, '');
  const encodedPath = encodeURI(normalizedPath);
  RUNTIME_LINK_MAP[normalizedPath] = slug;
  RUNTIME_LINK_MAP[encodedPath] = slug;
  if (siteRootPath && siteRootPath !== '/') {
    RUNTIME_LINK_MAP[siteRootPath + normalizedPath] = slug;
    RUNTIME_LINK_MAP[siteRootPath + encodedPath] = slug;
  }
}

function rebuildRuntimeLinkMap(articles) {
  clearRuntimeLinkMap();
  (articles || []).forEach((article) => {
    if (!article || !article.slug || !article.mdPath) return;
    registerRuntimeLinkAlias('articles/' + article.mdPath, article.slug);
    if (article.mdPath !== article.slug + '.md') {
      registerRuntimeLinkAlias('articles/' + article.slug + '.md', article.slug);
    }
  });
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

async function discoverArticleEntriesFromDirectory() {
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

async function discoverAlgorithmEntriesFromDirectory() {
  try {
    const response = await fetch(buildSiteUrl('assets/algorithms/'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to read algorithms directory');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('a'))
      .map((link) => link.getAttribute('href') || '')
      .filter((href) => /\.js$/i.test(href) && !/\.worker\.js$/i.test(href))
      .map((href) => decodeURIComponent(new URL(href, buildSiteUrl('assets/algorithms/')).pathname.split('/assets/algorithms/')[1] || ''))
      .filter(Boolean)
      .sort();
  } catch (error) {
    return [];
  }
}

function fetchGitHubTree() {
  if (!githubTreeCachePromise) {
    const apiUrl = 'https://api.github.com/repos/' +
      encodeURIComponent(SITE_GITHUB_SOURCE.owner) + '/' +
      encodeURIComponent(SITE_GITHUB_SOURCE.repo) +
      '/git/trees/' + encodeURIComponent(SITE_GITHUB_SOURCE.branch) + '?recursive=1';
    githubTreeCachePromise = fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then(async (response) => {
      if (!response.ok) throw new Error('Failed to fetch GitHub tree: ' + response.status);
      const payload = await response.json();
      return Array.isArray(payload.tree) ? payload.tree : [];
    });
  }
  return githubTreeCachePromise;
}

async function discoverSiteEntriesFromGitHub() {
  try {
    const tree = await fetchGitHubTree();
    const docsPrefix = normalizeArticleMdPath(SITE_GITHUB_SOURCE.docsDir) + '/';
    const articlePrefix = docsPrefix + 'articles/';
    const algorithmPrefix = docsPrefix + 'assets/algorithms/';
    const articles = new Map();
    const hiddenScripts = new Map();
    const algorithms = new Set();

    tree.forEach((entry) => {
      if (!entry || entry.type !== 'blob' || !entry.path) return;
      const entryPath = String(entry.path);
      if (entryPath.startsWith(articlePrefix) && /\.md$/i.test(entryPath)) {
        const mdPath = entryPath.slice(articlePrefix.length);
        const slug = resolveArticleSlugFromMdPath(mdPath);
        if (!articles.has(slug)) {
          articles.set(slug, {
            slug,
            section: inferSectionFromMdPath(mdPath),
            mdPath,
            mdUrl: buildSiteUrl('articles/' + mdPath)
          });
        }
        return;
      }
      if (entryPath.startsWith(articlePrefix) && /\.js$/i.test(entryPath)) {
        const jsPath = entryPath.slice(articlePrefix.length);
        if (!jsPath.startsWith(HIDDEN_ARTICLE_DIR)) return;
        const slug = resolveArticleSlugFromScriptPath(jsPath);
        hiddenScripts.set(slug, {
          slug,
          jsPath,
          jsUrl: buildSiteUrl('articles/' + jsPath)
        });
        return;
      }
      if (entryPath.startsWith(algorithmPrefix) && /\.js$/i.test(entryPath) && !/\.worker\.js$/i.test(entryPath)) {
        algorithms.add(entryPath.slice(algorithmPrefix.length));
      }
    });

    return {
      articles: Array.from(articles.values()),
      hiddenScripts: Array.from(hiddenScripts.values()),
      algorithms: Array.from(algorithms).sort()
    };
  } catch (error) {
    return { articles: [], hiddenScripts: [], algorithms: [] };
  }
}

async function discoverArticleEntries() {
  const local = await discoverArticleEntriesFromDirectory();
  if (local.articles.length || local.hiddenScripts.length) return local;
  const remote = await discoverSiteEntriesFromGitHub();
  return {
    articles: remote.articles,
    hiddenScripts: remote.hiddenScripts
  };
}

async function discoverAlgorithmEntries() {
  const local = await discoverAlgorithmEntriesFromDirectory();
  if (local.length) return local;
  const remote = await discoverSiteEntriesFromGitHub();
  return remote.algorithms || [];
}

async function discoverFeatureEntriesFromDirectory() {
  const rootPath = getSiteRootPath() + '/assets/features/';
  const visitedDirs = new Set();
  const discoveredScripts = new Set();

  async function visit(dirUrl) {
    const absoluteDirUrl = new URL(dirUrl, window.location.href).toString();
    if (visitedDirs.has(absoluteDirUrl)) return;
    visitedDirs.add(absoluteDirUrl);

    const response = await fetch(absoluteDirUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to read features directory: ' + absoluteDirUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nestedVisits = [];

    Array.from(doc.querySelectorAll('a')).forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href === '../') return;
      const resolvedUrl = new URL(href, absoluteDirUrl);
      if (!resolvedUrl.pathname.startsWith(rootPath)) return;

      if (/\.js$/i.test(resolvedUrl.pathname) && !/\.worker\.js$/i.test(resolvedUrl.pathname)) {
        const scriptPath = decodeURIComponent(resolvedUrl.pathname.slice(rootPath.length));
        if (scriptPath) discoveredScripts.add(scriptPath);
        return;
      }

      if (resolvedUrl.pathname.endsWith('/')) nestedVisits.push(visit(resolvedUrl.toString()));
    });

    await Promise.all(nestedVisits);
  }

  try {
    await visit(buildSiteUrl('assets/features/'));
    return Array.from(discoveredScripts).sort();
  } catch (error) {
    return [];
  }
}

async function discoverFeatureEntries() {
  const local = await discoverFeatureEntriesFromDirectory();
  if (local.length) return local;
  const docsPrefix = normalizeArticleMdPath(SITE_GITHUB_SOURCE.docsDir) + '/assets/features/';
  const tree = await fetchGitHubTree().catch(() => []);
  return tree
    .filter((entry) => entry && entry.type === 'blob' && entry.path && entry.path.startsWith(docsPrefix) && /\.js$/i.test(entry.path) && !/\.worker\.js$/i.test(entry.path))
    .map((entry) => entry.path.slice(docsPrefix.length))
    .sort();
}

async function loadRuntimeArticles() {
  const manifestMap = new Map();
  const discoveredResources = await discoverArticleEntries();
  discoveredResources.articles.forEach((entry) => {
    manifestMap.set(entry.slug, {
      slug: entry.slug,
      section: entry.section || (isHiddenArticleEntry(entry) ? 'hidden' : 'article'),
      mdPath: entry.mdPath,
      mdUrl: entry.mdUrl || buildSiteUrl('articles/' + entry.mdPath),
      jsPath: '',
      jsUrl: ''
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
  rebuildRuntimeLinkMap(loaded.map((item) => {
    const matched = manifestMap.get(item.slug);
    return {
      slug: item.slug,
      mdPath: matched && matched.mdPath ? matched.mdPath : item.slug + '.md'
    };
  }));

  return {
    homeSlots,
    hiddenArticles,
    hiddenScripts: discoveredResources.hiddenScripts.slice(),
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
    emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.homeSlotListeners, { slug, article, node });
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
  if (!modal || !title || !meta || !side || !time || !summary || !body || !close) {
    return {
      openArticle() {},
      closeArticle() {}
    };
  }

  const articleMap = new Map(runtimeData.homeSlots.concat(runtimeData.articles, runtimeData.hiddenArticles || []).map((article) => [article.slug, article]));
  let currentArticleSlug = '';

  function createArticleOpenPayload(article) {
    return {
      slug: article.slug,
      article,
      openArticle,
      open(slug) {
        openArticle(slug);
      }
    };
  }

  function openArticle(slug) {
    const article = articleMap.get(slug);
    if (!article) return;
    currentArticleSlug = slug;
    title.textContent = article.title;
    meta.textContent = formatModalMeta(article);
    meta.hidden = !meta.textContent;
    time.textContent = article.publishedAt || '';
    time.hidden = !time.textContent;
    summary.textContent = article.summary || '';
    summary.hidden = !summary.textContent;
    side.hidden = time.hidden && summary.hidden;
    modal.classList.toggle('has-modal-side', !side.hidden);
    body.className = 'article-modal-body article-body' + (article.section === 'poem' ? ' poem-body' + getPoemBodyVariantClass(article) : '') + (article.section === 'essay' ? ' essay-body' : '');
    body.innerHTML = article.html;
    modal.scrollTop = 0;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-modal-open');
    requestAnimationFrame(() => {
      modal.scrollTop = 0;
    });
    emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.articleOpenListeners, createArticleOpenPayload(article));
  }

  function closeArticle() {
    const closedSlug = currentArticleSlug;
    const closedArticle = closedSlug ? articleMap.get(closedSlug) : null;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-modal-open');
    currentArticleSlug = '';
    if (closedSlug) emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.articleCloseListeners, { slug: closedSlug, article: closedArticle, openArticle });
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
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeArticle();
    emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.keydownListeners, {
      event,
      key: event.key,
      normalizedKey: String(event.key || '').length === 1 ? String(event.key).toLowerCase() : String(event.key || ''),
      openArticle
    });
  });

  return {
    openArticle,
    closeArticle
  };
}

function initHomeDirectory(runtimeData) {
  const directory = document.getElementById('article-directory');
  const filterContainer = document.getElementById('category-filters');
  if (!directory || !filterContainer) return;

  let activeSection = 'all';
  const articles = runtimeData.articles;
  const hiddenDirectoryArticles = (runtimeData.hiddenArticles || []).map((article) => ({
    ...article,
    __directoryCategory: '隐藏'
  }));
  let allFilterClickCount = 0;
  let hiddenUnlocked = false;

  function getDirectoryCategory(article) {
    if (article && article.__directoryCategory) return article.__directoryCategory;
    return getArticleCategory(article);
  }

  function getVisibleArticles() {
    return hiddenUnlocked ? articles.concat(hiddenDirectoryArticles) : articles;
  }

  function getFilterItems() {
    const visibleArticles = getVisibleArticles();
    const categories = Array.from(new Set(visibleArticles.map((article) => getDirectoryCategory(article))));
    return [{ key: 'all', label: '全部文章', description: '共 ' + visibleArticles.length + ' 篇' }].concat(
      categories.map((category) => ({
        key: category,
        label: category,
        description: visibleArticles.filter((article) => getDirectoryCategory(article) === category).length + ' 篇'
      }))
    );
  }

  setHiddenDirectoryController({
    unlock() {
      if (hiddenUnlocked) return false;
      hiddenUnlocked = true;
      return true;
    },
    isUnlocked() {
      return hiddenUnlocked;
    }
  });

  function renderFilters() {
    const filterItems = getFilterItems();
    const availableKeys = new Set(filterItems.map((item) => item.key));
    if (!availableKeys.has(activeSection)) activeSection = 'all';

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
        const filterKey = link.dataset.filter;
        if (filterKey === 'all' && !hiddenUnlocked) allFilterClickCount += 1;
        emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.directoryFilterListeners, {
          event,
          key: filterKey,
          label: link.textContent || '',
          count: filterKey === 'all' ? allFilterClickCount : 0,
          activeSection,
          unlockHiddenDirectory: unlockHiddenDirectoryFromBridge,
          isHiddenDirectoryUnlocked: isHiddenDirectoryUnlockedFromBridge,
          resetCount() { allFilterClickCount = 0; }
        });
        activeSection = filterKey;
        renderFilters();
        render();
      });
    });
  }

  function render() {
    const filtered = getVisibleArticles()
      .filter((article) => (activeSection === 'all' ? true : getDirectoryCategory(article) === activeSection))
      .slice()
      .sort(compareArticlesByDisplayOrder);

    directory.innerHTML = filtered.map(buildCard).join('');
  }
  renderFilters();
  render();
}

function initAlgorithms() {
  const firstCanvas = document.getElementById('algorithm-canvas-a');
  const secondCanvas = document.getElementById('algorithm-canvas-b');
  if (!firstCanvas || !secondCanvas) return;

  const factories = (window.__ALGORITHM_VISUALIZERS__ || []).filter((item) => item && typeof item.mount === 'function');

  if (factories.length < 2) return;

  const shuffled = factories.slice().sort(() => Math.random() - 0.5).slice(0, 2);
  const visualizers = [firstCanvas, secondCanvas].map((canvas, index) => {
    const viz = shuffled[index].mount(canvas);
    return { canvas, viz };
  });

  // 离屏暂停：canvas 不在视口时暂停动画
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = visualizers.find((v) => v.canvas === entry.target);
        if (item && item.viz) item.viz._paused = !entry.isIntersecting;
      });
    }, { rootMargin: '60px' });
    visualizers.forEach((item) => observer.observe(item.canvas));
  }
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
  const algorithms = await discoverAlgorithmEntries();
  for (const scriptPath of algorithms) {
    await loadAlgorithmScript(scriptPath);
  }
  return window.__ALGORITHM_VISUALIZERS__;
}

function ensureSiteFeatureRegistry() {
  if (!Array.isArray(window.__SITE_RUNTIME_FEATURES__)) {
    window.__SITE_RUNTIME_FEATURES__ = [];
  }

  window.__registerSiteFeature = (factory) => {
    if (typeof factory !== 'function') return;
    window.__SITE_RUNTIME_FEATURES__.push(factory);
  };

  return window.__SITE_RUNTIME_FEATURES__;
}

function loadFeatureScript(scriptPath) {
  return new Promise((resolve, reject) => {
    if (!scriptPath) {
      resolve();
      return;
    }

    const normalizedPath = String(scriptPath).replace(/^\/+/, '');
    const existing = document.querySelector('script[data-feature-path="' + normalizedPath + '"]');
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('功能脚本加载失败：' + normalizedPath)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = false;
    script.dataset.featurePath = normalizedPath;
    const scriptUrl = new URL(buildSiteUrl('assets/features/' + normalizedPath), window.location.href);
    scriptUrl.searchParams.set('_', String(Date.now()));
    script.src = scriptUrl.toString();
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('功能脚本加载失败：' + normalizedPath));
    document.head.appendChild(script);
  });
}

async function loadFeatureScripts() {
  ensureSiteFeatureRegistry();
  const features = await discoverFeatureEntries();
  for (const scriptPath of features) {
    await loadFeatureScript(scriptPath);
  }
  return window.__SITE_RUNTIME_FEATURES__;
}

function createSiteFeatureApi(runtimeData, controls) {
  const articleMap = new Map(runtimeData.homeSlots.concat(runtimeData.articles, runtimeData.hiddenArticles || []).map((article) => [article.slug, article]));
  return {
    runtimeData,
    getArticle(slug) {
      return articleMap.get(slug) || null;
    },
    openArticle(slug) {
      if (controls && typeof controls.openArticle === 'function') controls.openArticle(slug);
    },
    closeArticle() {
      if (controls && typeof controls.closeArticle === 'function') controls.closeArticle();
    },
    onHomeSlotReady(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.homeSlotListeners, handler);
    },
    onAppReady(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.appReadyListeners, handler);
    },
    onArticleOpen(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.articleOpenListeners, handler);
    },
    onArticleClose(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.articleCloseListeners, handler);
    },
    onKeydown(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.keydownListeners, handler);
    },
    onDirectoryFilterClick(handler) {
      return addHiddenRuntimeListener(HIDDEN_RUNTIME_BRIDGE.directoryFilterListeners, handler);
    },
    unlockHiddenDirectory() {
      return unlockHiddenDirectoryFromBridge();
    },
    isHiddenDirectoryUnlocked() {
      return isHiddenDirectoryUnlockedFromBridge();
    }
  };
}

function initSiteFeatures(runtimeData, controls) {
  const factories = ensureSiteFeatureRegistry();
  const api = createSiteFeatureApi(runtimeData, controls);
  factories.forEach((factory) => {
    try {
      factory(api);
    } catch (error) {
      console.warn('[site-feature] setup failed:', error);
    }
  });
}

function syncLayoutMetrics() {
  const header = document.getElementById('site-header-root');
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty('--header-height', (header ? header.offsetHeight : 0) + 'px');
}

function showRuntimeLoadError(error) {
  const directory = document.getElementById('article-directory');
  if (directory) {
    directory.innerHTML = '<article class="article-card"><div class="article-card-link"><div class="article-card-main"><h3>加载失败</h3><p>' + escapeHtml(String(error.message || error)) + '</p></div></div></article>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 同步内联脚本设置的主题到 body
  if (document.documentElement.classList.contains('dark-mode')) {
    document.body.classList.add('dark-mode');
  }

  syncLayoutMetrics();
  await loadAlgorithmScripts();
  await loadFeatureScripts();
  initAlgorithms();
  window.addEventListener('resize', syncLayoutMetrics);
  try {
    const runtimeData = await loadRuntimeArticles();
    const modalControls = initArticleModal(runtimeData);
    initHomeDirectory(runtimeData);
    initSiteFeatures(runtimeData, modalControls);
    initHomeSlots(runtimeData);
    emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.appReadyListeners, {
      runtimeData,
      openArticle: modalControls.openArticle,
      closeArticle: modalControls.closeArticle
    });
  } catch (error) {
    console.error(error);
    showRuntimeLoadError(error);
  }

  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('is-hidden');
    setTimeout(() => loadingOverlay.remove(), 600);
  }
});
