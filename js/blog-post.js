(function () {
  'use strict';

  const getQueryParam = (name) => new URLSearchParams(window.location.search).get(name);
  const toDate = (value) => value?.toDate ? value.toDate() : new Date(value);
  const splitTerms = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

  function upsertMeta(selector, attribute, value, content) {
    if (!content) return;
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, value);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  function setSeo(post, coverUrl) {
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt;
    document.title = `${title} — Education World Travel`;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', coverUrl);
    if (post.canonicalUrl) {
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = post.canonicalUrl;
    }
  }

  function showError(title, message) {
    document.getElementById('postTitle').textContent = title;
    document.getElementById('postContent').textContent = message;
  }

  async function loadPost() {
    const slug = getQueryParam('slug');
    const page = document.querySelector('.post-page');
    const contentRoot = page?.dataset.blogContentRoot || '../';
    const title = document.getElementById('postTitle');
    const meta = document.getElementById('postMeta');
    const content = document.getElementById('postContent');
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      showError('Post not found', 'Sorry, this post cannot be loaded. Please return to the blog list.');
      return;
    }
    try {
      const snapshot = await firestore.collection('blogPosts').doc(slug).get();
      if (!snapshot.exists) {
        showError('Post not found', 'The requested post does not exist or is not yet published.');
        return;
      }
      const post = snapshot.data();
      const publishDate = toDate(post.publishAt || post.date);
      const categories = splitTerms(post.categories);
      const tags = splitTerms(post.tags);
      title.textContent = post.title;
      meta.innerHTML = '';
      [post.author, publishDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), post.readTime, ...categories]
        .filter(Boolean).forEach((value) => {
          const span = document.createElement('span');
          span.textContent = value;
          meta.appendChild(span);
        });
      const coverSource = post.cover || '';
      const coverUrl = coverSource ? window.EWTMarkdown.resolveReference(coverSource, { contentRoot, assetPath: post.assetPath || '' }) : '';
      const hero = document.querySelector('.post-hero-cover');
      if (coverUrl) {
        hero.style.backgroundImage = `linear-gradient(180deg, rgba(17, 24, 39, 0.16), rgba(17, 24, 39, 0.6)), url("${coverUrl.replace(/["\\]/g, '\\$&')}")`;
        hero.setAttribute('role', 'img');
        hero.setAttribute('aria-label', post.coverAlt || `${post.title} cover image`);
      }
      content.innerHTML = window.EWTMarkdown.render(post.body, { contentRoot, assetPath: post.assetPath || '' });
      setSeo(post, post.ogImage ? window.EWTMarkdown.resolveReference(post.ogImage, { contentRoot, assetPath: post.assetPath || '' }) : coverUrl);
      const sidebarLinks = document.getElementById('sidebarLinks');
      const sidebarCard = document.getElementById('sidebarLinksCard');
      [...content.querySelectorAll('h2, h3')].forEach((heading, index, headings) => {
        heading.id = heading.id || `section-${index + 1}`;
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        item.appendChild(link);
        sidebarLinks.appendChild(item);
        if (index === headings.length - 1) sidebarCard.style.display = 'block';
      });
      if (tags.length) {
        const tagCard = document.getElementById('postTagsCard');
        const tagList = document.getElementById('postTags');
        tags.forEach((tag) => {
          const span = document.createElement('span');
          span.textContent = `#${tag}`;
          tagList.appendChild(span);
        });
        tagCard.hidden = false;
      }
    } catch (error) {
      console.error('Error loading blog post:', error);
      showError('Unable to load post', 'The post could not be loaded right now. Please try again shortly.');
    }
  }

  document.addEventListener('DOMContentLoaded', loadPost);
})();
