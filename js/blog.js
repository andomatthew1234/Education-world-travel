document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('blogGrid');
  const filterButtons = Array.from(document.querySelectorAll('.filter-button'));

  const response = await fetch('../data/blog-list.json');
  const posts = await response.json();
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
        <div class="post-card-meta">${post.author} · ${new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <h2 class="post-card-title">${post.title}</h2>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <a class="post-card-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">Read post</a>
      </div>
    `;
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
