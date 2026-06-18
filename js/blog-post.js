function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function parseFrontMatter(mdText) {
  const frontMatterMatch = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatterMatch) {
    return { attrs: {}, body: mdText };
  }

  const rawFront = frontMatterMatch[1];
  const body = mdText.slice(frontMatterMatch[0].length).trim();
  const attrs = {};

  rawFront.split(/\r?\n/).forEach((line) => {
    const [key, ...rest] = line.split(':');
    if (!key || !rest.length) return;

    const value = rest.join(':').trim().replace(/^'/, '').replace(/'$/, '').replace(/^"/, '').replace(/"$/, '');
    if (key.trim() === 'categories') {
      const categories = Array.from(value.matchAll(/'([^']+)'/g)).map((m) => m[1]);
      if (categories.length === 0) {
        attrs.categories = value.split(',').map((category) => category.trim().replace(/^'/, '').replace(/'$/, ''));
      } else {
        attrs.categories = categories;
      }
    } else {
      attrs[key.trim()] = value;
    }
  });

  return { attrs, body };
}

function resolvePostAssetPath(source, postMeta, contentRoot) {
  const value = source.trim().replace(/^['"]|['"]$/g, '');
  if (/^(https?:)?\/\//.test(value) || /^(data|mailto|tel):/.test(value) || value.startsWith('/')) {
    return value;
  }

  const postDir = postMeta.filename.split('/').slice(0, -1).join('/');
  return `${contentRoot}${postDir}/${value.replace(/^\.\//, '')}`;
}

function renderImageMarkdown(altText, source, postMeta, contentRoot) {
  const src = resolvePostAssetPath(source, postMeta, contentRoot);
  const alt = altText.replace(/"/g, '&quot;');
  return `<figure class="post-image"><img src="${src}" alt="${alt}" loading="lazy"></figure>`;
}

function renderInlineMarkdown(text, postMeta, contentRoot) {
  let result = text;
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, altText, source) => {
    const src = resolvePostAssetPath(source, postMeta, contentRoot);
    const alt = altText.replace(/"/g, '&quot;');
    return `<img class="post-inline-image" src="${src}" alt="${alt}" loading="lazy">`;
  });
  result = result.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  result = result.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return result;
}

function renderMarkdown(mdText, postMeta, contentRoot) {
  const lines = mdText.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inOrderedList = false;
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;

    const text = paragraphLines.join(' ').trim();
    if (text) html.push(`<p>${renderInlineMarkdown(text, postMeta, contentRoot)}</p>`);
    paragraphLines = [];
  };

  const closeListIfNeeded = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
    if (inOrderedList) {
      html.push('</ol>');
      inOrderedList = false;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);

    if (line.startsWith('### ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h3>${renderInlineMarkdown(line.slice(4), postMeta, contentRoot)}</h3>`);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h2>${renderInlineMarkdown(line.slice(3), postMeta, contentRoot)}</h2>`);
    } else if (line.startsWith('# ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h1>${renderInlineMarkdown(line.slice(2), postMeta, contentRoot)}</h1>`);
    } else if (imageMatch) {
      flushParagraph();
      closeListIfNeeded();
      html.push(renderImageMarkdown(imageMatch[1], imageMatch[2], postMeta, contentRoot));
    } else if (line.startsWith('- ')) {
      flushParagraph();
      if (inOrderedList) {
        html.push('</ol>');
        inOrderedList = false;
      }
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(line.slice(2), postMeta, contentRoot)}</li>`);
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      if (!inOrderedList) {
        html.push('<ol>');
        inOrderedList = true;
      }
      html.push(`<li>${renderInlineMarkdown(line.replace(/^\d+\. /, ''), postMeta, contentRoot)}</li>`);
    } else if (line === '') {
      flushParagraph();
      closeListIfNeeded();
    } else {
      paragraphLines.push(line);
    }
  });

  flushParagraph();
  closeListIfNeeded();
  return html.join('\n');
}

async function loadPost() {
  const slug = getQueryParam('slug');
  const page = document.querySelector('.post-page');
  const blogIndexPath = page?.dataset.blogIndexPath || '../data/blog-list.json';
  const blogContentRoot = page?.dataset.blogContentRoot || '../';
  const titleEl = document.getElementById('postTitle');
  const metaEl = document.getElementById('postMeta');
  const contentEl = document.getElementById('postContent');

  if (!slug) {
    titleEl.textContent = 'Post not found';
    contentEl.innerHTML = '<p>Sorry, this post cannot be loaded. Please return to the blog list.</p>';
    return;
  }

  try {
    const listResponse = await fetch(blogIndexPath);
    if (!listResponse.ok) throw new Error('Failed to load blog list');

    const posts = await listResponse.json();
    const postMeta = posts.find((post) => post.slug === slug);
    if (!postMeta) {
      titleEl.textContent = 'Post not found';
      contentEl.innerHTML = '<p>The requested post does not exist.</p>';
      return;
    }

    titleEl.textContent = postMeta.title;
    const categories = postMeta.categories.map((category) => `<span>${category}</span>`).join(' &middot; ');
    metaEl.innerHTML = `${postMeta.author} &middot; ${new Date(postMeta.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${categories ? ` &middot; ${categories}` : ''}`;

    const mdResponse = await fetch(`${blogContentRoot}${postMeta.filename}`);
    if (!mdResponse.ok) {
      throw new Error(`Failed to load post content: ${mdResponse.status} ${mdResponse.statusText}`);
    }

    const mdText = await mdResponse.text();
    const { attrs, body } = parseFrontMatter(mdText);

    if (attrs.cover) {
      const coverEl = document.querySelector('.post-hero-cover');
      if (coverEl) {
        const coverUrl = resolvePostAssetPath(attrs.cover, postMeta, blogContentRoot);
        coverEl.style.backgroundImage = `linear-gradient(180deg, rgba(17, 24, 39, 0.16), rgba(17, 24, 39, 0.6)), url("${coverUrl}")`;
        coverEl.style.backgroundSize = 'cover';
        coverEl.style.backgroundPosition = 'center';
      }
    }

    contentEl.innerHTML = renderMarkdown(body, postMeta, blogContentRoot);

    // Sidebar Links Extraction
    const links = contentEl.querySelectorAll('a');
    const sidebarLinksContainer = document.getElementById('sidebarLinks');
    const sidebarLinksCard = document.getElementById('sidebarLinksCard');

    if (links.length > 0 && sidebarLinksContainer) {
      const uniqueLinks = new Map();
      links.forEach((link) => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        if (text && href && !uniqueLinks.has(href)) {
          uniqueLinks.set(href, text);
        }
      });

      if (uniqueLinks.size > 0) {
        sidebarLinksContainer.innerHTML = Array.from(uniqueLinks.entries())
          .map(([href, text]) => `<li><a href="${href}" target="_blank">${text}</a></li>`)
          .join('');
        sidebarLinksCard.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error loading blog post:', error);
    titleEl.textContent = 'Unable to load post';
    contentEl.innerHTML = `<div class="error-message">
      <p><strong>Error:</strong> ${error.message}</p>
      <p>We are sorry for the inconvenience. The file path might have changed during recent site updates.</p>
      <a href="blog.html" class="button">Return to Blog</a>
    </div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadPost);
