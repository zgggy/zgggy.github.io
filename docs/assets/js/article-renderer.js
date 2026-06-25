(function attachArticleRenderer(global) {
  const PINYIN_ANNOTATION_PATTERN = /([\u3400-\u4dbf\u4e00-\u9fff])<([A-Za-z0-9:üÜvV]+)>/g;
  const BACKTICK = String.fromCharCode(96);
  const CODE_FENCE = BACKTICK.repeat(3);
  const TONE_MARKS = {
    a: ['a', 'ā', 'á', 'ǎ', 'à'],
    e: ['e', 'ē', 'é', 'ě', 'è'],
    i: ['i', 'ī', 'í', 'ǐ', 'ì'],
    o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
    u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
    ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
  };

  function normalizeWhitespace(input) {
    return String(input || '').replace(/\s+/g, ' ').trim();
  }

  function normalizePinyinUmlaut(value) {
    return String(value || '')
      .replace(/u:|v/g, 'ü')
      .replace(/U:|V/g, 'Ü');
  }

  function applyToneMarkToPinyin(raw) {
    const input = normalizePinyinUmlaut(raw).trim();
    if (!input) return '';

    const toneMatch = input.match(/[1-5]/);
    if (!toneMatch) return input;

    const tone = Number(toneMatch[0]);
    const base = input.replace(/[1-5]/g, '');
    if (tone === 5 || tone === 0) return base;

    const lower = base.toLowerCase();
    let targetIndex = -1;

    if (lower.includes('a')) {
      targetIndex = lower.indexOf('a');
    } else if (lower.includes('e')) {
      targetIndex = lower.indexOf('e');
    } else {
      const ouIndex = lower.indexOf('ou');
      if (ouIndex >= 0) {
        targetIndex = ouIndex;
      } else {
        for (let index = lower.length - 1; index >= 0; index -= 1) {
          if ('aeiouü'.includes(lower[index])) {
            targetIndex = index;
            break;
          }
        }
      }
    }

    if (targetIndex < 0) return base;

    const chars = base.split('');
    const original = chars[targetIndex];
    const lowerOriginal = original.toLowerCase();
    const marked = (TONE_MARKS[lowerOriginal] || [])[tone] || original;
    chars[targetIndex] = original === lowerOriginal ? marked : marked.toUpperCase();
    return chars.join('');
  }

  function createRenderer(deps) {
    const {
      escapeHtml,
      buildSiteUrl,
      getSiteRootPath,
      runtimeLinkMap,
      normalizePublishedAt,
      parsePublishedAtSortValue,
      compareAfterwordsByDisplayOrder
    } = deps || {};

    function stripMarkdown(input) {
      return normalizeWhitespace(
        String(input || '')
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
      const trimmed = String(line || '').trim();
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
      const sanitized = new URL(String(href || '').trim(), window.location.href).pathname;
      const siteRootPath = getSiteRootPath();
      const normalized = siteRootPath && sanitized.startsWith(siteRootPath + '/')
        ? sanitized.slice(siteRootPath.length)
        : sanitized;
      return runtimeLinkMap[sanitized] || runtimeLinkMap[normalized];
    }

    function resolveRuntimeAsset(rawHref, article) {
      if (/^(https?:)?\/\//.test(rawHref)) return rawHref;
      const cleanHref = String(rawHref || '').trim().replace(/\s+"[^"]*"$/, '');
      if (cleanHref.startsWith('/')) return cleanHref;
      const fileName = cleanHref.split('/').pop();
      return buildSiteUrl('assets/images/articles/' + article.slug + '/' + fileName);
    }

    function createInlineConverter(article) {
      return function convertInline(input) {
        const tokens = [];
        let output = String(input || '');

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

        output = output.replace(PINYIN_ANNOTATION_PATTERN, (_, han, pinyin) => {
          const token = '__HTML_TOKEN_' + tokens.length + '__';
          tokens.push(
            '<ruby class="inline-pinyin"><span class="inline-pinyin-char">' +
              escapeHtml(han) +
              '</span><rt class="inline-pinyin-note">' +
              escapeHtml(applyToneMarkToPinyin(pinyin)) +
              '</rt></ruby>'
          );
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
      const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
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

    function parseDocumentParts(markdown, fallbackTitle) {
      const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
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

    function parseRuntimeArticle(entry, markdown, inferArticleSection) {
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

    return {
      parseRuntimeArticle
    };
  }

  global.ArticleRenderer = {
    createRenderer
  };
})(window);
