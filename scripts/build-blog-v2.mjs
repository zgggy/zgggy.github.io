import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs');
const EDITABLE_ARTICLES_DIR = path.join(OUT_DIR, 'articles');
const SITE_ROOT = '.';

const BRAND_SUBTITLE = 'WIRED NOTES / POEMS / ARCHIVE';
const HOME_SLOT_SLUGS = ['hero', 'lovestory1', 'lovestory2', 'lovestory3', 'midline', 'footer'];
const LOVE_TIMER_START = '2013-05-08T00:00:00+08:00';
const HIDDEN_ARTICLE_DIR = 'hidden/';

function toPosixPath(input) {
  return String(input || '').replace(/\\/g, '/');
}

function getArticlePathWithoutExtension(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, '');
  if (/\/README\.md$/i.test(normalized)) return normalized.replace(/\/README\.md$/i, '');
  if (/^README\.md$/i.test(normalized)) return 'README';
  return normalized.replace(/\.(md|js)$/i, '');
}

function resolveArticleSlug(relativePath) {
  const pathWithoutExtension = getArticlePathWithoutExtension(relativePath);
  const segments = pathWithoutExtension.split('/').filter(Boolean);
  const baseName = segments[segments.length - 1] || '';
  const parentName = segments.length > 1 ? segments[segments.length - 2] : '';
  if (parentName === 'home' && HOME_SLOT_SLUGS.includes(baseName)) return baseName;
  return pathWithoutExtension;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function joinSitePath(relativePath) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  if (!normalized) return SITE_ROOT === '.' ? './' : SITE_ROOT || '/';
  if (SITE_ROOT === '.') return `./${normalized}`;
  if (!SITE_ROOT) return `/${normalized}`;
  return `${SITE_ROOT}/${normalized}`.replace(/\/+/g, '/');
}

function copyFile(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) return;
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function resetOutput() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  ensureDir(OUT_DIR);
}

function snapshotDirectoryFiles(dirPath) {
  const snapshots = new Map();
  if (!fs.existsSync(dirPath)) return snapshots;

  const visit = (currentPath) => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      const relativePath = path.relative(dirPath, entryPath);
      snapshots.set(relativePath, fs.readFileSync(entryPath));
    }
  };

  visit(dirPath);
  return snapshots;
}

function restoreDirectoryFiles(dirPath, snapshots) {
  for (const [relativePath, content] of snapshots.entries()) {
    const targetPath = path.join(dirPath, relativePath);
    ensureDir(path.dirname(targetPath));
    fs.writeFileSync(targetPath, content);
  }
}

function snapshotEditableContentSources() {
  const sources = { articles: new Map(), hiddenScripts: new Map() };
  if (!fs.existsSync(EDITABLE_ARTICLES_DIR)) return sources;

  for (const filePath of getMarkdownFiles(EDITABLE_ARTICLES_DIR)) {
    const relativePath = toPosixPath(path.relative(EDITABLE_ARTICLES_DIR, filePath));
    const slug = resolveArticleSlug(relativePath);
    const markdown = fs.readFileSync(filePath, 'utf8');

    if (sources.articles.has(slug)) throw new Error(`Duplicate article slug "${slug}" from ${relativePath}`);
    sources.articles.set(slug, { markdown, mdPath: relativePath, filePath });
  }

  for (const filePath of getJavaScriptFiles(EDITABLE_ARTICLES_DIR)) {
    const relativePath = toPosixPath(path.relative(EDITABLE_ARTICLES_DIR, filePath));
    if (!relativePath.startsWith(HIDDEN_ARTICLE_DIR)) continue;
    sources.hiddenScripts.set(relativePath, {
      jsPath: relativePath,
      filePath,
      content: fs.readFileSync(filePath, 'utf8')
    });
  }

  return sources;
}

function escapeHtml(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeWhitespace(input) {
  return input.replace(/\s+/g, ' ').trim();
}

function getMarkdownFiles(dirPath) {
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getMarkdownFiles(fullPath));
      continue;
    }
    if (entry.name.toLowerCase() === 'readme.md' || entry.name.toLowerCase().endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getJavaScriptFiles(dirPath) {
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getJavaScriptFiles(fullPath));
      continue;
    }
    if (entry.name.toLowerCase().endsWith('.js')) results.push(fullPath);
  }
  return results;
}

function inferSectionFromTags(tags) {
  if ((tags || []).some((tag) => ['诗歌', '现代诗', '旧体诗'].includes(tag))) return 'poem';
  if ((tags || []).includes('散文')) return 'essay';
  if ((tags || []).some((tag) => ['技术', '架构', '状态机', 'C++'].includes(tag))) return 'tech';
  return 'article';
}

function inferSectionFromPath(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, '');
  if (normalized.startsWith(HIDDEN_ARTICLE_DIR)) return 'hidden';
  return '';
}

function resolveAsset(rawHref, article, assetCollector) {
  if (/^(https?:)?\/\//.test(rawHref)) return rawHref;

  const cleanHref = rawHref.trim().replace(/\s+"[^"]*"$/, '');
  const sourcePath = path.resolve(article.sourceDir, cleanHref);
  const fileName = path.basename(cleanHref);
  const targetRelative = path.join('assets', 'images', 'articles', article.slug, fileName);
  const targetAbsolute = path.join(OUT_DIR, targetRelative);

  if (!assetCollector.has(targetAbsolute) && fs.existsSync(sourcePath)) {
    assetCollector.add(targetAbsolute);
    copyFile(sourcePath, targetAbsolute);
  }

  return joinSitePath(targetRelative.replace(/\\/g, '/'));
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
      tags = trimmed
        .slice(1)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
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
  return { title, summary, bodyMarkdown, publishedAt, tags, afterwords: trailing.afterwords };
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

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function normalizePublishedAt(value, fallbackYear = new Date().getFullYear()) {
  const input = String(value || '').trim();
  if (!input) return '';

  let matched = input.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (matched) {
    const [, yearText, monthText, dayText] = matched;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return input;
    return year + '-' + padDatePart(month) + '-' + padDatePart(day);
  }

  matched = input.match(/^(\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (matched) {
    const [, monthText, dayText] = matched;
    const month = Number(monthText);
    const day = Number(dayText);
    if (month < 1 || month > 12 || day < 1 || day > 31) return input;
    return String(fallbackYear) + '-' + padDatePart(month) + '-' + padDatePart(day);
  }

  return input;
}

function parsePublishedAtSortValue(value) {
  const input = normalizePublishedAt(value);
  if (!input) return null;
  const matched = input.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})(?:日)?$/);
  if (!matched) return null;
  const [, yearText, monthText, dayText] = matched;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
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

function collectArticleAssets(filePath, slug, markdown, assetCollector) {
  const article = { slug, sourceDir: path.dirname(filePath) };
  for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    resolveAsset(match[1], article, assetCollector);
  }
}

function buildArticleRecord(filePath, slug, editableSource, sidecarScripts, assetCollector) {
  const markdown = editableSource.markdown;
  const parsed = parseDocumentParts(markdown, slug);
  const section = inferSectionFromPath(editableSource.mdPath) || inferSectionFromTags(parsed.tags);
  const expectedScriptPath = editableSource.mdPath.replace(/\.md$/i, '.js');
  const jsPath = section === 'hidden' && sidecarScripts.has(expectedScriptPath) ? expectedScriptPath : '';

  collectArticleAssets(filePath, slug, markdown, assetCollector);

  return {
    slug,
    mdPath: editableSource.mdPath,
    jsPath,
    section,
    title: parsed.title
  };
}

function buildHeroCluster() {
  return `
    <section class="feature-cluster card-surface">
      <div class="feature-link-block is-placeholder" data-home-slot="lovestory1">占位符 / 01</div>
      <div class="feature-link-block is-placeholder" data-home-slot="lovestory2">占位符 / 02</div>
      <div class="feature-link-block is-placeholder" data-home-slot="lovestory3">占位符 / 03</div>
    </section>
  `.trim();
}

function getSiteChrome(pageTitle, pageDescription) {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="icon" href="${joinSitePath('assets/images/site/paidashuan.ico')}">
    <link rel="stylesheet" href="${joinSitePath('assets/css/style.css')}">
  `.trim();
}

function buildHeader() {
  return `<header class="site-header" id="site-header-root"></header>`;
}

function buildFooter() {
  return `<footer class="site-footer" id="site-footer-root"><div class="footer-copy" data-home-slot="footer">- footer -</div></footer>`;
}

function buildArticleModal() {
  return `
    <div class="article-modal" id="article-modal" aria-hidden="true">
      <div class="article-modal-dialog">
        <div class="article-modal-header">
          <div class="article-modal-meta" id="article-modal-meta"></div>
          <button class="article-modal-close" id="article-modal-close" type="button" aria-label="关闭">×</button>
        </div>
        <div class="article-modal-scroll">
          <div class="article-modal-heading">
            <h2 class="article-modal-title" id="article-modal-title"></h2>
            <div class="article-modal-side">
              <div class="article-modal-time" id="article-modal-time"></div>
              <p class="article-modal-summary" id="article-modal-summary"></p>
            </div>
          </div>
          <div class="article-modal-body article-body" id="article-modal-body"></div>
        </div>
      </div>
    </div>
  `.trim();
}

function buildChromeScript() {
  return `
function renderSiteHeader() {
  const root = document.getElementById('site-header-root');
  if (!root) return;

  root.innerHTML = [
    '<div class="header-inner">',
    '  <a class="brandmark" href="${joinSitePath('')}">',
    '    <span class="brandmark-main">派大栓</span>',
    '    <span class="brandmark-sub">${BRAND_SUBTITLE}</span>',
    '  </a>',
    '</div>'
  ].join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSiteHeader();
});
  `.trim();
}

function buildHomePage() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
${getSiteChrome('新版文章站 | 派大栓', '技术、诗歌与散文并置的 Wired 风格静态网站。')}
</head>
<body data-page="home">
${buildHeader()}
<main class="page-shell">
  <section class="hero-grid">
    <article class="hero-copy card-surface" data-home-slot="hero">
      <div class="hero-copy-meta"></div>
      <h1>ZGGGY</h1>
      <p class="hero-lead">这里读取固定 md 的摘要内容。</p>
    </article>
    ${buildHeroCluster()}
    <section class="algorithm-stack card-surface">
      <canvas class="algorithm-canvas algorithm-canvas-a" id="algorithm-canvas-a" width="400" height="210"></canvas>
      <canvas class="algorithm-canvas algorithm-canvas-b" id="algorithm-canvas-b" width="400" height="210"></canvas>
    </section>
  </section>

  <section class="midline-strip" data-home-slot="midline"><p>这里先放一句话，后面再换成你真正想展示的内容。</p></section>

  <section class="directory-layout">
    <aside class="directory-sidebar card-surface">
      <div id="category-filters"></div>
    </aside>
    <section class="directory-main card-surface">
      <div class="article-directory" id="article-directory"></div>
    </section>
  </section>
  <div id="directory-scroll-spacer" aria-hidden="true"></div>
</main>
${buildFooter()}
${buildArticleModal()}
<script src="${joinSitePath('assets/js/chrome.js')}"></script>
<script src="${joinSitePath('assets/data/site-data.js')}"></script>
<script src="${joinSitePath('assets/js/site.js')}"></script>
</body>
</html>
  `.trim();
}

function buildSiteData(articles, algorithmScripts) {
  const linkMap = {};

  for (const article of articles) {
    linkMap[`/articles/${article.mdPath}`] = article.slug;
    if (SITE_ROOT && SITE_ROOT !== '.') linkMap[`${SITE_ROOT}/articles/${article.mdPath}`] = article.slug;
    if (article.mdPath !== `${article.slug}.md`) {
      linkMap[`/articles/${article.slug}.md`] = article.slug;
      if (SITE_ROOT && SITE_ROOT !== '.') linkMap[`${SITE_ROOT}/articles/${article.slug}.md`] = article.slug;
    }
  }

  return {
    site: {
      title: '派大栓的静态文章站',
      description: '技术、诗歌与散文并置的 Wired 风格静态网站',
      root: SITE_ROOT
    },
    linkMap,
    algorithms: (algorithmScripts || []).map((scriptPath) => ({
      scriptPath
    })),
    articles: articles.map((article) => ({
      slug: article.slug,
      section: article.section,
      mdPath: article.mdPath,
      jsPath: article.jsPath || ''
    }))
  };
}

function buildClientScript() {
  return `
const HOME_SLOT_SLUGS = ${JSON.stringify(HOME_SLOT_SLUGS)};
const LOVE_TIMER_START = ${JSON.stringify(LOVE_TIMER_START)};
const HIDDEN_ARTICLE_DIR = ${JSON.stringify(HIDDEN_ARTICLE_DIR)};

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
  return String(input || '').replace(/\\\\/g, '/').replace(/^\\/+/, '');
}

function buildSiteUrl(relativePath) {
  const normalized = String(relativePath || '').replace(/^\\/+/, '');
  return new URL(window.__SITE_DATA__.site.root + '/' + normalized, window.location.href).toString();
}

function getSiteRootPath() {
  return new URL(window.__SITE_DATA__.site.root + '/', window.location.href).pathname.replace(/\\/$/, '');
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function normalizePublishedAt(value, fallbackYear) {
  const input = String(value || '').trim();
  if (!input) return '';
  const resolvedYear = typeof fallbackYear === 'number' ? fallbackYear : new Date().getFullYear();

  let matched = input.match(/^(\\d{4})[.\\-/年](\\d{1,2})[.\\-/月](\\d{1,2})(?:日)?$/);
  if (matched) {
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return input;
    return year + '-' + padDatePart(month) + '-' + padDatePart(day);
  }

  matched = input.match(/^(\\d{1,2})[.\\-/月](\\d{1,2})(?:日)?$/);
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
  if (/\\/README\\.md$/i.test(normalized)) return normalized.replace(/\\/README\\.md$/i, '');
  if (/^README\\.md$/i.test(normalized)) return 'README';
  return normalized.replace(/\\.(md|js)$/i, '');
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
  const matched = input.match(/^(\\d{4})[.\\-/年](\\d{1,2})[.\\-/月](\\d{1,2})(?:日)?$/);
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
  return input.replace(/\\s+/g, ' ').trim();
}

const BACKTICK = String.fromCharCode(96);
const CODE_FENCE = BACKTICK.repeat(3);

function stripMarkdown(input) {
  return normalizeWhitespace(
    input
      .replace(new RegExp(CODE_FENCE + '[\\\\s\\\\S]*?' + CODE_FENCE, 'g'), ' ')
      .replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g, ' ')
      .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '$1')
      .replace(/^#{1,6}\\s+/gm, '')
      .replace(/^>\\s?/gm, '')
      .replace(/^\\s*[-*+]\\s+/gm, '')
      .replace(/^\\s*\\d+\\.\\s+/gm, '')
      .replace(/[*_~]/g, ' ')
      .replace(new RegExp(String.fromCharCode(96), 'g'), ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function isSpecialLine(line) {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    /^#{1,6}\\s+/.test(trimmed) ||
    trimmed.startsWith(CODE_FENCE) ||
    /^>\\s?/.test(trimmed) ||
    /^\\s*[-*+]\\s+/.test(trimmed) ||
    /^\\s*\\d+\\.\\s+/.test(trimmed) ||
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
  if (/^(https?:)?\\/\\//.test(rawHref)) return rawHref;
  const cleanHref = rawHref.trim().replace(/\\s+"[^"]*"$/, '');
  if (cleanHref.startsWith('/')) return cleanHref;
  const fileName = cleanHref.split('/').pop();
  return buildSiteUrl('assets/images/articles/' + article.slug + '/' + fileName);
}

function createInlineConverter(article) {
  return function convertInline(input) {
    const tokens = [];
    let output = input;

    output = output.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, (_, alt, rawHref) => {
      const assetUrl = resolveRuntimeAsset(rawHref, article);
      const token = '__HTML_TOKEN_' + tokens.length + '__';
      tokens.push('<img class="inline-image" src="' + assetUrl + '" alt="' + escapeHtml(alt) + '">');
      return token;
    });

    output = output.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, (_, text, rawHref) => {
      const href = rawHref.trim();
      const slug = href.startsWith('/') ? resolveArticleSlugFromHref(href) : '';
      const token = '__HTML_TOKEN_' + tokens.length + '__';
      if (slug) {
        tokens.push('<a href="#article-modal" data-article-open="' + slug + '">' + escapeHtml(text) + '</a>');
      } else {
        const resolved = href.startsWith('/') ? href : resolveRuntimeAsset(href, article);
        const external = /^https?:\\/\\//.test(resolved);
        const target = external ? ' target="_blank" rel="noreferrer"' : '';
        tokens.push('<a href="' + resolved + '"' + target + '>' + escapeHtml(text) + '</a>');
      }
      return token;
    });

    output = escapeHtml(output);
    output = output.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    output = output.replace(new RegExp(String.fromCharCode(96) + '([^' + String.fromCharCode(96) + ']+)' + String.fromCharCode(96), 'g'), '<code>$1</code>');
    tokens.forEach((tokenHtml, index) => {
      output = output.replace('__HTML_TOKEN_' + index + '__', tokenHtml);
    });
    return output;
  };
}

function markdownToHtml(markdown, article) {
  const convertInline = createInlineConverter(article);
  const lines = markdown.replace(/\\r\\n/g, '\\n').split('\\n');
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

    const headingMatch = trimmed.match(/^(#{1,6})\\s+(.*)$/);
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
      html.push('<pre class="code-block"><code class="language-' + escapeHtml(language) + '">' + escapeHtml(codeLines.join('\\n')) + '</code></pre>');
      continue;
    }

    if (/^>\\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\\s?/, ''));
        index += 1;
      }
      html.push('<blockquote>' + quoteLines.map((line) => '<p>' + convertInline(line) + '</p>').join('') + '</blockquote>');
      continue;
    }

    if (/^\\s*[-*+]\\s+/.test(rawLine)) {
      const items = [];
      while (index < lines.length && /^\\s*[-*+]\\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\\s*[-*+]\\s+/, '').trim());
        index += 1;
      }
      html.push('<ul>' + items.map((item) => '<li>' + convertInline(item) + '</li>').join('') + '</ul>');
      continue;
    }

    if (/^\\s*\\d+\\.\\s+/.test(rawLine)) {
      const items = [];
      while (index < lines.length && /^\\s*\\d+\\.\\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\\s*\\d+\\.\\s+/, '').trim());
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

  return html.join('\\n');
}

function formatAfterwordText(markdown) {
  return escapeHtml(String(markdown || '').trim()).replace(/\\n+/g, '<br>');
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
  const lines = markdown.replace(/\\r\\n/g, '\\n').split('\\n');
  let cursor = 0;
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;

  const titleLine = cursor < lines.length ? lines[cursor].trim() : fallbackTitle;
  const title = titleLine.replace(/^#\\s+/, '').trim() || fallbackTitle;
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
      tags = trimmed.slice(1).trim().split(/\\s+/).filter(Boolean);
      cursor += 1;
      continue;
    }
    if (!summaryLines.length && /^>\\s?/.test(trimmed)) {
      while (cursor < lines.length && /^>\\s?/.test(lines[cursor].trim())) {
        summaryLines.push(lines[cursor].trim().replace(/^>\\s?/, ''));
        cursor += 1;
      }
      continue;
    }
    break;
  }

  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
  const trailing = extractTrailingAfterwords(lines.slice(cursor));
  const bodyMarkdown = trailing.bodyLines.join('\\n').trim();
  const summary = normalizeWhitespace(summaryLines.join(' '));
  return { title, publishedAt, tags, summary, bodyMarkdown, afterwords: trailing.afterwords };
}

function extractInlineAfterwordDate(line) {
  const input = String(line || '').trim();
  if (!input) return { text: '', publishedAt: '' };
  const matched = input.match(/^(.*?)(?:\\s+[&@](.+))$/);
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

    if (/^[&@]\\s*/.test(lines[cursor].trim())) {
      const normalized = normalizePublishedAt(lines[cursor].trim().replace(/^[&@]\\s*/, ''));
      if (parsePublishedAtSortValue(normalized) === null) break;
      publishedAt = normalized;
      cursor -= 1;
      while (cursor >= 0 && !lines[cursor].trim()) cursor -= 1;
    }

    if (cursor < 0 || !/^>\\s?/.test(lines[cursor].trim())) break;

    const quoteLines = [];
    while (cursor >= 0 && /^>\\s?/.test(lines[cursor].trim())) {
      quoteLines.unshift(lines[cursor].trim().replace(/^>\\s?/, ''));
      cursor -= 1;
    }

    if (!publishedAt && quoteLines.length) {
      const inline = extractInlineAfterwordDate(quoteLines[quoteLines.length - 1]);
      quoteLines[quoteLines.length - 1] = inline.text;
      publishedAt = inline.publishedAt;
    }

    const bodyMarkdown = quoteLines.join('\\n').trim();
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

      if (/\.md$/i.test(resolvedUrl.pathname)) {
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

      if (/\.js$/i.test(resolvedUrl.pathname)) {
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

    const normalizedPath = String(scriptPath).replace(/^\\/+/, '');
    const existing = document.querySelector('script[data-algorithm-path=\"' + normalizedPath + '\"]');
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
  `.trim();
}

function buildStyles() {
  return `
:root {
  --bg: #ffffff;
  --bg-soft: #f4f4f2;
  --surface: #ffffff;
  --text: #050505;
  --text-muted: #666666;
  --line: #d8d8d8;
  --line-strong: #050505;
  --accent: #050505;
  --shadow: 0 18px 36px rgba(0, 0, 0, 0.04);
  --font-display: 'Iowan Old Style', 'Baskerville', 'Songti SC', Georgia, serif;
  --font-body: 'PingFang SC', 'Noto Sans SC', 'Helvetica Neue', sans-serif;
  --font-mono: 'SFMono-Regular', 'IBM Plex Mono', Consolas, monospace;
  --space: 20px;
  --space-tight: 12px;
  --card-padding: 22px;
  --header-height: 0px;
}

* { box-sizing: border-box; }
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.7;
}
body.has-modal-open { overflow: hidden; }
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.header-inner,
.page-shell,
.site-footer {
  max-width: 1440px;
  margin: 0 auto;
}

.header-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space);
  align-items: center;
  padding: 18px 24px 16px;
  transition: padding 180ms ease, gap 180ms ease;
}

.brandmark { display: inline-flex; flex-direction: column; gap: 4px; transition: gap 180ms ease; }
.brandmark-main {
  font-size: 1.05rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  transition: font-size 180ms ease;
}

.brandmark-sub,
.article-card-meta,
.filter-button span {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brandmark-sub { font-size: 0.72rem; color: var(--text-muted); transition: font-size 180ms ease; }

.site-header.is-condensed .header-inner {
  gap: 14px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.site-header.is-condensed .brandmark { gap: 0; }
.site-header.is-condensed .brandmark-main { font-size: 0.94rem; }
.site-header.is-condensed .brandmark-sub { display: none; }

.page-shell { padding: calc(var(--space) + 8px) 24px 72px; }
.card-surface { border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow); }

.hero-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 1.05fr;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: var(--space);
  row-gap: 0;
  align-items: stretch;
}

.hero-copy,
.feature-cluster,
.algorithm-canvas,
.midline-strip,
.directory-sidebar,
.directory-main {
  padding: var(--card-padding);
  overflow: hidden;
}

.hero-copy[data-article-open] { cursor: pointer; }

.hero-copy {
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-tight);
  min-height: 100%;
  justify-content: space-between;
}

.feature-cluster {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: grid;
  gap: var(--space);
  min-height: 100%;
}

.algorithm-stack {
  grid-column: 3;
  grid-row: 1 / span 2;
  padding: 0;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0;
  overflow: hidden;
}

.hero-copy h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3.4vw, 3.6rem);
  line-height: 0.95;
}

.article-card h3,
.article-body h2,
.article-body h3,
.article-body h4,
.directory-title {
  margin: 0;
  font-family: var(--font-display);
}

.hero-lead,
.article-body p,
.article-card p,
.directory-description {
  color: var(--text-muted);
}

.hero-lead {
  margin: 0;
  font-size: 0.95rem;
}

.hero-copy-meta {
  min-height: 1.1rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.article-body blockquote {
  margin: 0;
  padding-left: 14px;
  border-left: 2px solid var(--line-strong);
  color: var(--text-muted);
}

.feature-link-block {
  display: flex;
  align-items: center;
  min-height: 0;
  padding-bottom: calc(var(--space) - 2px);
  border-bottom: 1px solid var(--line);
  font-size: 0.95rem;
  line-height: 1.2;
}

.feature-link-block:last-child { padding-bottom: 0; border-bottom: 0; }
.feature-link-block.is-placeholder {
  color: var(--text-muted);
  justify-content: center;
  cursor: default;
}
.feature-link-block.is-ready,
.midline-strip.is-ready,
.midline-strip[data-article-open],
.feature-link-block[data-article-open] { cursor: pointer; }

.algorithm-canvas {
  width: 100%;
  display: block;
  padding: 0;
  background: var(--bg-soft);
  aspect-ratio: 400 / 210;
  border: 0;
}

.algorithm-canvas + .algorithm-canvas {
  border-top: 1px solid var(--line);
}

.midline-strip,
.directory-layout { margin-top: var(--space); }

.midline-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-tight) 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.5;
}

.midline-strip p { margin: 0; }

.directory-layout {
  display: grid;
  grid-template-columns: minmax(240px, 25%) minmax(0, 1fr);
  gap: var(--space);
  align-items: start;
}

.directory-sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--space));
}

#category-filters { display: grid; gap: var(--space-tight); }

.filter-button {
  display: grid;
  gap: 0;
  padding: 14px 16px;
  border: 1px solid var(--line);
  color: var(--text);
  background: transparent;
}

.filter-button small {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.88rem;
  transition: max-height 160ms ease, opacity 160ms ease, margin-top 160ms ease;
}

.filter-button:hover { background: #efefef; }

.filter-button.is-active {
  background: #efefef;
  border-color: var(--line-strong);
}

.filter-button.is-active small {
  max-height: 96px;
  opacity: 1;
  margin-top: 8px;
}

.article-directory {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-tight);
  margin-top: 0;
}

.article-card {
  border: 1px solid var(--line);
  background: var(--surface);
}

.article-card-link {
  display: grid;
  gap: 8px;
  padding: 18px;
  height: 100%;
}

.article-card-link:hover {
  background: #efefef;
}

.article-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(5px);
  overflow-y: auto;
}

.article-modal.active {
  display: block;
}

.article-modal-dialog {
  width: min(980px, calc(100vw - 48px));
  display: flex;
  flex-direction: column;
  margin: 88px auto 56px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18);
}

.article-modal-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.article-modal-meta {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.article-modal-close {
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
}

.article-modal-scroll {
  padding: 0 22px 22px;
}

.article-modal-heading {
  display: flex;
  gap: 24px;
  align-items: start;
  margin-top: 18px;
}

.article-modal-title {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  font-size: clamp(2rem, 3.4vw, 3.4rem);
  line-height: 0.96;
}

.article-modal-title.is-secret-trigger {
  cursor: pointer;
}

.article-modal-title.is-secret-trigger:hover,
.article-modal-title.is-secret-trigger:focus-visible {
  opacity: 0.82;
}

.article-modal.has-modal-side .article-modal-title {
  flex: 2 1 0;
}

.article-modal-side {
  display: grid;
  flex: 0 1 auto;
  min-width: 0;
  width: fit-content;
  max-width: min(32ch, 40%);
  gap: 8px;
  justify-items: end;
  text-align: right;
}

.article-modal.has-modal-side .article-modal-side {
  flex: 1 1 0;
  width: auto;
}

.article-modal-time {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-modal-summary {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.article-modal-body {
  margin-top: 32px;
  font-size: 1.02rem;
}

.article-card h3 { font-size: 1.15rem; line-height: 1.1; }
.article-card-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 12px;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.article-card-meta .meta-tags {
  grid-column: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-card-meta .meta-time {
  grid-column: 2;
  justify-self: end;
  white-space: nowrap;
  text-align: right;
}

.feature-link-block.is-live-duration {
  justify-content: center;
}

.feature-live-text {
  display: block;
  width: 100%;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  font: inherit;
  text-wrap: pretty;
}

.feature-link-block.is-live-duration > .feature-live-text {
  text-align: center;
}

.article-card-main {
  display: grid;
  grid-template-columns: minmax(220px, auto) minmax(0, 1fr);
  gap: 10px 18px;
  align-items: baseline;
}

.article-card-main p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
  text-align: right;
}

.article-body {
  min-width: 0;
  font-size: 1.02rem;
  overflow-wrap: anywhere;
}

.article-body h2,
.article-body h3,
.article-body h4 { margin-top: 2.1rem; margin-bottom: 0.85rem; }

.article-body p,
.article-body ul,
.article-body ol,
.article-body blockquote,
.article-body pre { margin: 1rem 0; }

.article-body ul,
.article-body ol {
  margin-left: 0;
  padding-left: 0;
  list-style-position: inside;
}
.article-body li { margin: 0.45rem 0; }
.article-body a,
.site-footer a { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }

.article-afterwords {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 16px;
}

.article-afterword {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  background: #fafafa;
}

.article-afterword-time {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  justify-self: start;
}

.article-afterword-content {
  color: var(--text-muted);
  line-height: 1.75;
  white-space: normal;
}

.code-block {
  overflow-x: auto;
  padding: 1rem;
  border: 1px solid var(--line);
  background: #fafafa;
}

.code-block code,
.article-body code { font-family: var(--font-mono); }
.article-body code { background: #f2f2f2; padding: 0.16rem 0.36rem; }
.article-body pre code { padding: 0; background: transparent; }
.article-body .inline-image {
  width: 100%;
  margin: 1.4rem 0;
  border: 1px solid var(--line);
}

.poem-body {
  line-height: 1.95;
}

.poem-body.is-modern-poem .poem-line { text-align: left; }
.poem-body.is-classic-poem .poem-line { text-align: center; }

.poem-line { margin: 0.3rem 0; color: var(--text); }

.site-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 24px 48px;
}

.footer-copy {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
  cursor: pointer;
}

@media (max-width: 1320px) {
  .hero-grid { grid-template-columns: 1.25fr 1.25fr 0.95fr; }
}

@media (max-width: 1180px) {
  .header-inner,
  .hero-grid,
  .directory-layout,
  .site-footer {
    grid-template-columns: 1fr;
  }

  .hero-copy,
  .feature-cluster,
  .algorithm-stack {
    grid-column: auto;
    grid-row: auto;
  }

  .directory-sidebar { position: static; }
  .article-directory { grid-template-columns: 1fr; }
  .article-modal-dialog { margin-top: 72px; }
  .article-card-main { grid-template-columns: 1fr; }
  .article-card-main p { text-align: left; }
}

@media (max-width: 720px) {
  .page-shell,
  .site-footer { padding-left: 16px; padding-right: 16px; }
  .hero-copy,
  .feature-cluster,
  .algorithm-canvas,
  .midline-strip,
  .directory-sidebar,
  .directory-main { padding: 18px; }
  .header-inner { padding-left: 16px; padding-right: 16px; }
  .article-modal-dialog { width: calc(100vw - 24px); margin: 60px auto 24px; }
  .article-modal-header,
  .article-modal-scroll { padding-left: 16px; padding-right: 16px; }
  .article-modal-heading { flex-direction: column; gap: 12px; }
  .article-modal.has-modal-side .article-modal-title { min-width: 0; flex: 1 1 auto; }
  .article-modal.has-modal-side .article-modal-side { width: auto; max-width: none; flex: 1 1 auto; }
  .article-modal-side { justify-items: start; text-align: left; }
}
  `.trim();
}

function copyAlgorithmAssets(algorithmSnapshots) {
  const targetDir = path.join(OUT_DIR, 'assets', 'algorithms');
  restoreDirectoryFiles(targetDir, algorithmSnapshots);
  return Array.from(algorithmSnapshots.keys())
    .map((filePath) => toPosixPath(filePath))
    .filter((filePath) => filePath.toLowerCase().endsWith('.js') && !filePath.toLowerCase().endsWith('.worker.js'))
    .sort();
}

function main() {
  const editableSources = snapshotEditableContentSources();
  const imageSnapshots = snapshotDirectoryFiles(path.join(OUT_DIR, 'assets', 'images'));
  const algorithmSnapshots = snapshotDirectoryFiles(path.join(OUT_DIR, 'assets', 'algorithms'));
  resetOutput();
  restoreDirectoryFiles(path.join(OUT_DIR, 'assets', 'images'), imageSnapshots);
  const assetCollector = new Set();
  const articles = [];

  for (const [slug, source] of editableSources.articles.entries()) {
    const record = buildArticleRecord(source.filePath, slug, source, editableSources.hiddenScripts, assetCollector);
    articles.push(record);
  }

  articles.sort(compareArticlesByDisplayOrder);

  const algorithmScripts = copyAlgorithmAssets(algorithmSnapshots);

  writeFile(path.join(OUT_DIR, 'assets', 'css', 'style.css'), buildStyles());
  writeFile(path.join(OUT_DIR, 'assets', 'js', 'chrome.js'), buildChromeScript());
  writeFile(path.join(OUT_DIR, 'assets', 'js', 'site.js'), buildClientScript());

  const siteData = buildSiteData(articles, algorithmScripts);
  writeFile(path.join(OUT_DIR, 'assets', 'data', 'site-data.js'), `window.__SITE_DATA__ = ${JSON.stringify(siteData, null, 2)};\n`);
  writeFile(path.join(OUT_DIR, 'index.html'), buildHomePage());
  for (const [, source] of editableSources.articles.entries()) {
    writeFile(path.join(OUT_DIR, 'articles', source.mdPath), source.markdown);
  }
  for (const [, source] of editableSources.hiddenScripts.entries()) {
    writeFile(path.join(OUT_DIR, 'articles', source.jsPath), source.content);
  }
  writeFile(
    path.join(OUT_DIR, 'README.md'),
    ['# docs', '', '由 `scripts/build-blog-v2.mjs` 生成。', '', '重新运行：', '', '```bash', 'node scripts/build-blog-v2.mjs', '```', ''].join('\n')
  );
}

main();
