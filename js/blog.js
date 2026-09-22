document.addEventListener('DOMContentLoaded', async () => {
  const page = document.querySelector('.blog-page');
  const grid = document.getElementById('blogGrid');
  const filters = document.getElementById('blogFilters');
  const search = document.getElementById('blogSearch');
  const status = document.getElementById('blogStatus');
  const blogContentRoot = page?.dataset.blogContentRoot || '../';
  const blogPostPage = page?.dataset.blogPostPage || 'blog-post.html';
  let posts = [];
  let activeCategory = 'all';

  const toDate = (value) => {
    if (value?.toDate) return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  };
  const splitTerms = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  const resolvePostAssetPath = (source, post) => window.EWTMarkdown.resolveReference(source, {
    contentRoot: blogContentRoot,
    assetPath: post.assetPath || ''
  });

  function addTextElement(parent, tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  function renderCard(post) {
    const article = document.createElement('article');
    article.className = `post-card${post.featured ? ' featured' : ''}`;
    const image = document.createElement('div');
    image.className = 'post-card-image';
    if (post.cover) {
      image.classList.add('has-image');
      image.style.backgroundImage = `url("${resolvePostAssetPath(post.cover, post).replace(/["\\]/g, '\\$&')}")`;
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', post.coverAlt || `${post.title} cover image`);
    }
    const content = document.createElement('div');
    content.className = 'post-card-content';
    const categories = splitTerms(post.categories);
    const tags = splitTerms(post.tags);
    const label = post.featured ? `Featured · ${categories[0] || 'Travel'}` : (categories[0] || 'Travel');
    addTextElement(content, 'div', 'post-card-tag', label);
    const meta = addTextElement(content, 'div', 'post-card-meta', '');
    addTextElement(meta, 'span', '', post.author || 'Education World Travel');
    addTextElement(meta, 'span', '', toDate(post.publishAt || post.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }));
    if (post.readTime) addTextElement(meta, 'span', '', post.readTime);
    addTextElement(content, 'h2', 'post-card-title', post.title || 'Untitled post');
    addTextElement(content, 'p', 'post-card-excerpt', post.excerpt || '');
    if (tags.length) {
      const tagList = document.createElement('div');
      tagList.className = 'post-card-tags';
      tags.slice(0, 4).forEach((tag) => addTextElement(tagList, 'span', '', `#${tag}`));
      content.appendChild(tagList);
    }
    const link = document.createElement('a');
    link.className = 'post-card-link';
    link.href = `${blogPostPage}?slug=${encodeURIComponent(post.slug)}`;
    link.textContent = 'Read post';
    content.appendChild(link);
    article.append(image, content);
    return article;
  }

  function renderPosts() {
    const query = search.value.trim().toLowerCase();
    const visible = posts.filter((post) => {
      const categories = splitTerms(post.categories);
      const categoryMatches = activeCategory === 'all' || categories.includes(activeCategory);
      const haystack = `${post.title} ${post.author} ${post.excerpt} ${categories.join(' ')} ${splitTerms(post.tags).join(' ')}`.toLowerCase();
      return categoryMatches && haystack.includes(query);
    });
    grid.innerHTML = '';
    status.textContent = `${visible.length} ${visible.length === 1 ? 'post' : 'posts'}`;
    if (!visible.length) {
      addTextElement(grid, 'p', 'empty-state', 'No posts match your search or category.');
      return;
    }
    visible.forEach((post) => grid.appendChild(renderCard(post)));
  }

  function renderFilters() {
    const categories = [...new Set(posts.flatMap((post) => splitTerms(post.categories)))].sort((a, b) => a.localeCompare(b));
    filters.innerHTML = '';
    ['all', ...categories].forEach((category) => {
      const button = document.createElement('button');
      button.className = `filter-button${category === activeCategory ? ' active' : ''}`;
      button.type = 'button';
      button.dataset.filter = category;
      button.textContent = category === 'all' ? 'All posts' : category;
      button.addEventListener('click', () => {
        activeCategory = category;
        renderFilters();
        renderPosts();
      });
      filters.appendChild(button);
    });
  }

  search.addEventListener('input', renderPosts);
  status.textContent = 'Loading posts…';
  try {
    const snapshot = await firestore.collection('blogPosts')
      .where('published', '==', true)
      .where('status', 'in', ['published', 'scheduled'])
      .where('publishAt', '<=', firebase.firestore.Timestamp.now())
      .orderBy('publishAt', 'desc')
      .get();
    posts = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    renderFilters();
    renderPosts();
  } catch (error) {
    console.error('Unable to load blog posts:', error);
    status.textContent = '';
    grid.innerHTML = '';
    addTextElement(grid, 'p', 'empty-state error-message', 'The blog could not be loaded right now. Please try again shortly.');
  }
});
