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
        // Fallback for non-quoted categories
        attrs.categories = value.split(',').map(c => c.trim().replace(/^'/, '').replace(/'$/, ''));
      } else {
        attrs.categories = categories;
      }
    } else {
      attrs[key.trim()] = value;
    }
  });
  return { attrs, body };
}

function renderMarkdown(mdText) {
  const lines = mdText.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inOrderedList = false;
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(' ').trim();
    if (text) html.push(`<p>${renderInlineMarkdown(text)}</p>`);
    paragraphLines = [];
  };

  const closeListIfNeeded = () => {
    if (inList) { html.push('</ul>'); inList = false; }
    if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (line.startsWith('### ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      flushParagraph();
      closeListIfNeeded();
      html.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
      if (!inList) { html.push('<ul>'); inList = true; }
      html.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      if (inList) { html.push('</ul>'); inList = false; }
      if (!inOrderedList) { html.push('<ol>'); inOrderedList = true; }
      const itemText = line.replace(/^\d+\. /, '');
      html.push(`<li>${renderInlineMarkdown(itemText)}</li>`);
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

function renderInlineMarkdown(text) {
  let result = text;
  result = result.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="../$2" alt="$1" style="max-width:100%; border-radius:12px; margin: 1.5rem 0;">');
  result = result.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  result = result.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return result;
}

async function loadPost() {
  const slug = getQueryParam('slug');
  const titleEl = document.getElementById('postTitle');
  const metaEl = document.getElementById('postMeta');
  const contentEl = document.getElementById('postContent');

  if (!slug) {
    titleEl.textContent = 'Post not found';
    contentEl.innerHTML = '<p>Sorry, this post cannot be loaded. Please return to the blog list.</p>';
    return;
  }

  try {
    const listResponse = await fetch('../data/blog-list.json');
    if (!listResponse.ok) throw new Error('Failed to load blog list');
    
    const posts = await listResponse.json();
    const postMeta = posts.find((post) => post.slug === slug);
    if (!postMeta) {
      titleEl.textContent = 'Post not found';
      contentEl.innerHTML = '<p>The requested post does not exist.</p>';
      return;
    }

    titleEl.textContent = postMeta.title;
    const categories = postMeta.categories.map((category) => `<span>${category}</span>`).join(' · ');
    metaEl.innerHTML = `${postMeta.author} · ${new Date(postMeta.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${categories ? ` · ${categories}` : ''}`;

    const postPath = `../${postMeta.filename}`;
    const mdResponse = await fetch(postPath);
    
    if (!mdResponse.ok) {
      throw new Error(`Failed to load post content: ${mdResponse.status} ${mdResponse.statusText}`);
    }

    const mdText = await mdResponse.text();
    const { attrs, body } = parseFrontMatter(mdText);

    // Apply cover image if it exists in front-matter
    if (attrs.cover) {
      const coverEl = document.querySelector('.post-hero-cover');
      if (coverEl) {
        coverEl.style.backgroundImage = `url(../${attrs.cover})`;
        coverEl.style.backgroundSize = 'cover';
        coverEl.style.backgroundPosition = 'center';
      }
    }

    const html = renderMarkdown(body);
    contentEl.innerHTML = html;
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
