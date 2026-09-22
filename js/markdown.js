(function () {
  'use strict';

  const isAbsoluteReference = (value) => /^(https?:)?\/\//i.test(value) || /^(data|mailto|tel):/i.test(value) || value.startsWith('/');

  function resolveReference(value, options) {
    const source = String(value || '').trim().replace(/^['"]|['"]$/g, '');
    if (!source || isAbsoluteReference(source)) return source;

    const contentRoot = options.contentRoot || '../';
    const assetPath = String(options.assetPath || '').replace(/^\/+|\/+$/g, '');
    const prefix = assetPath ? `${assetPath}/` : '';
    return `${contentRoot}${prefix}${source.replace(/^\.\//, '')}`;
  }

  function youtubeId(value) {
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (url.hostname.endsWith('youtube.com')) {
        if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
        return url.searchParams.get('v');
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function render(markdown, options = {}) {
    if (!window.marked || !window.DOMPurify) {
      throw new Error('The Markdown renderer is unavailable.');
    }

    const preparedMarkdown = String(markdown || '').replace(
      /^\s*@\[youtube\]\((https?:\/\/[^\s)]+)\)\s*$/gim,
      (_, url) => `<div data-ewt-youtube="${encodeURIComponent(url)}"></div>`
    );
    const rawHtml = window.marked.parse(preparedMarkdown, {
      gfm: true,
      breaks: false
    });
    const safeHtml = window.DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true }
    });
    const template = document.createElement('template');
    template.innerHTML = safeHtml;

    template.content.querySelectorAll('img[src]').forEach((image) => {
      image.src = resolveReference(image.getAttribute('src'), options);
      image.loading = 'lazy';
      image.decoding = 'async';
    });

    template.content.querySelectorAll('a[href]').forEach((link) => {
      link.href = resolveReference(link.getAttribute('href'), options);
      if (/^https?:\/\//i.test(link.href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });

    template.content.querySelectorAll('[data-ewt-youtube]').forEach((placeholder) => {
      const value = decodeURIComponent(placeholder.getAttribute('data-ewt-youtube') || '');
      const id = youtubeId(value);
      if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
        placeholder.remove();
        return;
      }
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
      iframe.title = 'YouTube video player';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      placeholder.className = 'youtube-embed';
      placeholder.removeAttribute('data-ewt-youtube');
      placeholder.appendChild(iframe);
    });

    template.content.querySelectorAll('p').forEach((paragraph) => {
      const match = paragraph.textContent.trim().match(/^@\[youtube\]\((https?:\/\/[^\s)]+)\)$/i);
      if (!match) return;
      const id = youtubeId(match[1]);
      if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'youtube-embed';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
      iframe.title = 'YouTube video player';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      wrapper.appendChild(iframe);
      paragraph.replaceWith(wrapper);
    });

    return template.innerHTML;
  }

  window.EWTMarkdown = { render, resolveReference };
})();
