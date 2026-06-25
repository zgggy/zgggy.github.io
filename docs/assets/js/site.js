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
const ARTICLE_FEATURE_BRIDGE = {
  registrations: [],
  runtimeApi: null,
  appReadyPayload: null
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

function enhanceArticleFeaturePayload(payload) {
  const controller = window.__modalTitleActions__;
  if (!controller || typeof controller.enhancePayload !== 'function') return payload;
  return controller.enhancePayload(payload);
}

function createArticleFeatureApi(siteApi, slug) {
  const targetSlug = String(slug || '').trim();

  return {
    slug: targetSlug,
    get article() {
      return siteApi && typeof siteApi.getArticle === 'function' ? siteApi.getArticle(targetSlug) : null;
    },
    getArticle() {
      return siteApi && typeof siteApi.getArticle === 'function' ? siteApi.getArticle(targetSlug) : null;
    },
    open() {
      if (siteApi && typeof siteApi.openArticle === 'function') siteApi.openArticle(targetSlug);
    },
    openArticle(slugToOpen) {
      if (siteApi && typeof siteApi.openArticle === 'function') siteApi.openArticle(slugToOpen);
    },
    closeArticle() {
      if (siteApi && typeof siteApi.closeArticle === 'function') siteApi.closeArticle();
    },
    onOpen(handler) {
      if (!siteApi || typeof siteApi.onArticleOpen !== 'function' || typeof handler !== 'function') return function noop() {};
      return siteApi.onArticleOpen((payload) => {
        if (!payload || payload.slug !== targetSlug) return;
        handler(enhanceArticleFeaturePayload(payload));
      });
    },
    onClose(handler) {
      if (!siteApi || typeof siteApi.onArticleClose !== 'function' || typeof handler !== 'function') return function noop() {};
      return siteApi.onArticleClose((payload) => {
        if (!payload || payload.slug !== targetSlug) return;
        handler(payload);
      });
    },
    onArticleOpen(handler) {
      if (!siteApi || typeof siteApi.onArticleOpen !== 'function' || typeof handler !== 'function') return function noop() {};
      return siteApi.onArticleOpen((payload) => {
        handler(enhanceArticleFeaturePayload(payload));
      });
    },
    onArticleClose(handler) {
      if (!siteApi || typeof siteApi.onArticleClose !== 'function') return function noop() {};
      return siteApi.onArticleClose(handler);
    },
    onHomeSlotReady(handler) {
      if (!siteApi || typeof siteApi.onHomeSlotReady !== 'function') return function noop() {};
      return siteApi.onHomeSlotReady(handler);
    },
    onAppReady(handler) {
      if (typeof handler !== 'function') return function noop() {};
      if (ARTICLE_FEATURE_BRIDGE.appReadyPayload) {
        queueMicrotask(() => {
          handler(ARTICLE_FEATURE_BRIDGE.appReadyPayload);
        });
        return function noop() {};
      }
      if (!siteApi || typeof siteApi.onAppReady !== 'function') return function noop() {};
      return siteApi.onAppReady(handler);
    },
    onKeydown(handler) {
      if (!siteApi || typeof siteApi.onKeydown !== 'function') return function noop() {};
      return siteApi.onKeydown(handler);
    },
    onDirectoryFilterClick(handler) {
      if (!siteApi || typeof siteApi.onDirectoryFilterClick !== 'function') return function noop() {};
      return siteApi.onDirectoryFilterClick(handler);
    },
    unlockHiddenDirectory() {
      return siteApi && typeof siteApi.unlockHiddenDirectory === 'function' ? siteApi.unlockHiddenDirectory() : false;
    },
    isHiddenDirectoryUnlocked() {
      return siteApi && typeof siteApi.isHiddenDirectoryUnlocked === 'function' ? siteApi.isHiddenDirectoryUnlocked() : false;
    }
  };
}

function mountRegisteredArticleFeature(registration) {
  if (!registration || registration.__mounted || !ARTICLE_FEATURE_BRIDGE.runtimeApi) return;
  registration.__mounted = true;
  try {
    registration.setup(createArticleFeatureApi(ARTICLE_FEATURE_BRIDGE.runtimeApi, registration.slug));
  } catch (error) {
    registration.__mounted = false;
    console.warn('[article-feature] setup failed:', registration.slug, error);
  }
}

window.__registerArticleFeature = function registerArticleFeature(spec) {
  if (!spec || typeof spec.setup !== 'function') return;
  const slug = String(spec.slug || '').trim();
  if (!slug) return;

  const registration = {
    slug,
    setup: spec.setup
  };
  ARTICLE_FEATURE_BRIDGE.registrations.push(registration);
  mountRegisteredArticleFeature(registration);
};

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

const ARTICLE_RENDERER = window.ArticleRenderer.createRenderer({
  escapeHtml,
  buildSiteUrl,
  getSiteRootPath,
  runtimeLinkMap: RUNTIME_LINK_MAP,
  normalizePublishedAt,
  parsePublishedAtSortValue,
  compareAfterwordsByDisplayOrder
});

function compareArticlesByDisplayOrder(left, right) {
  const leftTime = parsePublishedAtSortValue(left.publishedAt);
  const rightTime = parsePublishedAtSortValue(right.publishedAt);
  const leftHasTime = leftTime !== null;
  const rightHasTime = rightTime !== null;

  if (leftHasTime && rightHasTime && leftTime !== rightTime) return rightTime - leftTime;
  if (leftHasTime !== rightHasTime) return leftHasTime ? -1 : 1;

  return String(left.title || '').localeCompare(String(right.title || ''), 'zh-CN-u-co-pinyin', { sensitivity: 'base' });
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
  return ARTICLE_RENDERER.parseRuntimeArticle(entry, markdown, inferArticleSection);
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

      if (resolvedUrl.pathname.endsWith('/')) nestedVisits.push(visit(resolvedUrl.toString()));
    });

    await Promise.all(nestedVisits);
  }

  try {
    await visit(buildSiteUrl('articles/'));
    return {
      articles: Array.from(discoveredArticles.values())
    };
  } catch (error) {
    return { articles: [] };
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
      if (entryPath.startsWith(algorithmPrefix) && /\.js$/i.test(entryPath) && !/\.worker\.js$/i.test(entryPath)) {
        algorithms.add(entryPath.slice(algorithmPrefix.length));
      }
    });

    return {
      articles: Array.from(articles.values()),
      algorithms: Array.from(algorithms).sort()
    };
  } catch (error) {
    return { articles: [], algorithms: [] };
  }
}

async function discoverArticleEntries() {
  const local = await discoverArticleEntriesFromDirectory();
  if (local.articles.length) return local;
  const remote = await discoverSiteEntriesFromGitHub();
  return {
    articles: remote.articles
  };
}

async function discoverAlgorithmEntries() {
  const local = await discoverAlgorithmEntriesFromDirectory();
  if (local.length) return local;
  const remote = await discoverSiteEntriesFromGitHub();
  return remote.algorithms || [];
}

async function discoverScriptEntriesFromDirectory(rootRelativePath) {
  const rootUrl = buildSiteUrl(rootRelativePath);
  const rootPath = new URL(rootUrl, window.location.href).pathname;
  const normalizedRoot = normalizeArticleMdPath(rootRelativePath);
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
        if (scriptPath) discoveredScripts.add(normalizedRoot + scriptPath);
        return;
      }

      if (resolvedUrl.pathname.endsWith('/')) nestedVisits.push(visit(resolvedUrl.toString()));
    });

    await Promise.all(nestedVisits);
  }

  try {
    await visit(rootUrl);
    return Array.from(discoveredScripts);
  } catch (error) {
    return [];
  }
}

async function discoverFeatureEntriesFromDirectory() {
  const entries = await Promise.all([
    discoverScriptEntriesFromDirectory('assets/features/'),
    discoverScriptEntriesFromDirectory('articles/')
  ]);
  return Array.from(new Set(entries.flat())).sort();
}

async function discoverFeatureEntries() {
  const local = await discoverFeatureEntriesFromDirectory();
  if (local.length) return local;
  const docsRoot = normalizeArticleMdPath(SITE_GITHUB_SOURCE.docsDir) + '/';
  const prefixes = [docsRoot + 'assets/features/', docsRoot + 'articles/'];
  const tree = await fetchGitHubTree().catch(() => []);
  return tree
    .filter((entry) => {
      return entry &&
        entry.type === 'blob' &&
        entry.path &&
        prefixes.some((prefix) => entry.path.startsWith(prefix)) &&
        /\.js$/i.test(entry.path) &&
        !/\.worker\.js$/i.test(entry.path);
    })
    .map((entry) => entry.path.slice(docsRoot.length))
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
      mdUrl: entry.mdUrl || buildSiteUrl('articles/' + entry.mdPath)
    });
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
    .map((item) => ({ ...item }));
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
  const root = /** @type {any} */ (window);
  if (!Array.isArray(root.__SITE_RUNTIME_FEATURES__)) {
    root.__SITE_RUNTIME_FEATURES__ = [];
  }

  root.__registerSiteFeature = (factory) => {
    if (typeof factory !== 'function') return;
    root.__SITE_RUNTIME_FEATURES__.push(factory);
  };

  return root.__SITE_RUNTIME_FEATURES__;
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
    const scriptUrl = new URL(buildSiteUrl(normalizedPath), window.location.href);
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
  ARTICLE_FEATURE_BRIDGE.runtimeApi = api;
  factories.forEach((factory) => {
    try {
      factory(api);
    } catch (error) {
      console.warn('[site-feature] setup failed:', error);
    }
  });
  ARTICLE_FEATURE_BRIDGE.registrations.forEach((registration) => {
    mountRegisteredArticleFeature(registration);
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
  var L = window.__loading;
  // 同步内联脚本设置的主题到 body
  if (document.documentElement.classList.contains('dark-mode')) {
    document.body.classList.add('dark-mode');
  }

  syncLayoutMetrics();
  L && await L.update(10);
  try { await loadAlgorithmScripts(); } catch (e) { console.warn('[algorithms]', e); }
  L && await L.update(20);
  try { await loadFeatureScripts(); } catch (e) { console.warn('[features]', e); }
  L && await L.update(30);
  initAlgorithms();
  window.addEventListener('resize', syncLayoutMetrics);
  try {
    L && await L.update(40);
    const runtimeData = await loadRuntimeArticles();
    L && await L.update(70);
    const modalControls = initArticleModal(runtimeData);
    initHomeDirectory(runtimeData);
    L && await L.update(80);
    initSiteFeatures(runtimeData, modalControls);
    initHomeSlots(runtimeData);
    L && await L.update(90);
    ARTICLE_FEATURE_BRIDGE.appReadyPayload = {
      runtimeData,
      openArticle: modalControls.openArticle,
      closeArticle: modalControls.closeArticle
    };
    emitHiddenRuntimeListeners(HIDDEN_RUNTIME_BRIDGE.appReadyListeners, ARTICLE_FEATURE_BRIDGE.appReadyPayload);
  } catch (error) {
    console.error(error);
    showRuntimeLoadError(error);
  }

  L && await L.update(100);
  if (L) {
    setTimeout(function() { L.hide(); }, 300);
  } else {
    var fallback = document.getElementById('loading-overlay');
    if (fallback) {
      fallback.classList.add('is-hidden');
      setTimeout(function() { fallback.remove(); }, 600);
    }
  }
});
