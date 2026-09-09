document.addEventListener('DOMContentLoaded', async () => {
  const page = document.querySelector('.blog-page');
  const grid = document.getElementById('blogGrid');
  const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
  const blogContentRoot = page?.dataset.blogContentRoot || '../';
  const blogPostPage = page?.dataset.blogPostPage || 'blog-post.html';

  const resolvePostAssetPath = (source, post) => {
    const value = source.trim().replace(/^['"]|['"]$/g, '');
    if (/^(https?:)?\/\//.test(value) || /^(data|mailto|tel):/.test(value) || value.startsWith('/')) {
      return value;
    }

    const postDir = post.filename.split('/').slice(0, -1).join('/');
    return `${blogContentRoot}${postDir}/${value.replace(/^\.\//, '')}`;
  };

  const snapshot = await firestore.collection('blogPosts').where('published', '==', true).get();
  const posts = snapshot.docs.map((doc) => doc.data());
  const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const categoryMap = new Map();
  sortedPosts.forEach((post) => {
    post.categories.forEach((category) => {
      categoryMap.set(category, true);
    });
  });

  const renderCard = (post) => {
    const article = document.createElement('article');
    article.className = 'post-card';
    article.innerHTML = `
      <div class="post-card-image"></div>
      <div class="post-card-content">
        <div class="post-card-tag">${post.categories[0] || 'Travel'}</div>
        <div class="post-card-meta">${post.author} &middot; ${new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <h2 class="post-card-title">${post.title}</h2>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <a class="post-card-link" href="${blogPostPage}?slug=${encodeURIComponent(post.slug)}">Read post</a>
      </div>
    `;

    const imageEl = article.querySelector('.post-card-image');
    if (post.cover) {
      imageEl.classList.add('has-image');
      imageEl.style.backgroundImage = `url("${resolvePostAssetPath(post.cover, post)}")`;
      imageEl.setAttribute('aria-label', post.coverAlt || `${post.title} cover image`);
    }

    return article;
  };

  const renderPosts = (filteredPosts) => {
    grid.innerHTML = '';
    if (!filteredPosts.length) {
      grid.innerHTML = '<p class="empty-state">No posts match this category yet.</p>';
      return;
    }
    filteredPosts.forEach((post) => {
      grid.appendChild(renderCard(post));
    });
  };

  const filterBy = (category) => {
    filterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === category);
    });
    if (category === 'all') {
      renderPosts(sortedPosts);
      return;
    }
    const matched = sortedPosts.filter((post) => post.categories.includes(category));
    renderPosts(matched);
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => filterBy(button.dataset.filter));
  });

  renderPosts(sortedPosts);
});
