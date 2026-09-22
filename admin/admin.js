(function () {
  'use strict';

  const auth = firebase.auth(firebaseApp);
  const db = firestore;
  const storage = firebase.storage(firebaseApp);
  const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
  const Timestamp = firebase.firestore.Timestamp;

  const elements = {};
  const fieldIds = [
    'title', 'slug', 'author', 'excerpt', 'body', 'status', 'publishAt',
    'categories', 'tags', 'readTime', 'cover', 'coverAlt', 'seoTitle',
    'seoDescription', 'canonicalUrl', 'ogImage'
  ];
  let posts = [];
  let selectedId = null;
  let selectedPost = null;
  let postUnsubscribe = null;
  let adminUnsubscribe = null;
  let activeStatus = 'all';
  let slugWasEdited = false;
  let dirty = false;
  let toastTimer = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    [
      'authShell', 'cms', 'signInButton', 'signOutButton', 'authMessage', 'signedInAs',
      'exportButton',
      'newPostButton', 'postSearch', 'statusTabs', 'postList', 'postForm', 'saveState',
      'postIdentity', 'deleteButton', 'saveDraftButton', 'saveButton', 'publishButton',
      'writeTab', 'previewTab', 'markdownToolbar', 'markdownPreview', 'excerptCount',
      'coverPreview', 'coverUpload', 'bodyImageUpload', 'downloadUpload', 'uploadState',
      'youtubeButton', 'addAdminButton', 'adminUid', 'adminName', 'adminList', 'toast'
    ].concat(fieldIds).forEach((id) => { elements[id] = document.getElementById(id); });
    elements.featured = document.getElementById('featured');

    elements.signInButton.addEventListener('click', signInOrOut);
    elements.signOutButton.addEventListener('click', () => auth.signOut());
    elements.exportButton.addEventListener('click', exportContent);
    elements.newPostButton.addEventListener('click', newPost);
    elements.postSearch.addEventListener('input', renderPostList);
    elements.statusTabs.addEventListener('click', setStatusFilter);
    elements.saveDraftButton.addEventListener('click', () => savePost('draft'));
    elements.saveButton.addEventListener('click', () => savePost());
    elements.publishButton.addEventListener('click', () => savePost('published'));
    elements.deleteButton.addEventListener('click', deletePost);
    elements.writeTab.addEventListener('click', () => setEditorView('write'));
    elements.previewTab.addEventListener('click', () => setEditorView('preview'));
    elements.markdownToolbar.addEventListener('click', applyMarkdownFormat);
    elements.youtubeButton.addEventListener('click', insertYouTube);
    elements.coverUpload.addEventListener('change', () => uploadFile(elements.coverUpload, 'images', 'cover'));
    elements.bodyImageUpload.addEventListener('change', () => uploadFile(elements.bodyImageUpload, 'images', 'body-image'));
    elements.downloadUpload.addEventListener('change', () => uploadFile(elements.downloadUpload, 'downloads', 'download'));
    elements.addAdminButton.addEventListener('click', addAdmin);
    elements.title.addEventListener('input', syncSlugFromTitle);
    elements.slug.addEventListener('input', () => { slugWasEdited = true; elements.slug.value = slugify(elements.slug.value); });
    elements.excerpt.addEventListener('input', updateExcerptCount);
    elements.cover.addEventListener('input', updateCoverPreview);
    elements.publishAt.addEventListener('change', syncStatusForDate);
    elements.status.addEventListener('change', syncStatusForDate);
    elements.postForm.addEventListener('input', markDirty);
    elements.postForm.addEventListener('change', markDirty);
    elements.postForm.addEventListener('submit', (event) => { event.preventDefault(); savePost(); });
    window.addEventListener('beforeunload', (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        savePost();
      }
    });

    auth.onAuthStateChanged(handleAuthState);
    newPost();
  }

  async function signInOrOut() {
    elements.authMessage.textContent = '';
    if (auth.currentUser) {
      await auth.signOut();
      return;
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await auth.signInWithPopup(provider);
    } catch (error) {
      elements.authMessage.textContent = friendlyError(error);
    }
  }

  async function handleAuthState(user) {
    stopListeners();
    if (!user) {
      elements.authShell.hidden = false;
      elements.cms.hidden = true;
      elements.signInButton.textContent = 'Sign in with Google';
      elements.authMessage.textContent = '';
      return;
    }

    elements.signInButton.textContent = 'Sign out';
    try {
      await db.collection('blogPosts').limit(1).get();
      elements.authShell.hidden = true;
      elements.cms.hidden = false;
      elements.signedInAs.textContent = user.displayName || user.email || user.uid;
      subscribeToPosts();
      subscribeToAdmins();
    } catch (error) {
      elements.authShell.hidden = false;
      elements.cms.hidden = true;
      elements.authMessage.textContent = `This account is not approved. Ask an administrator to add UID: ${user.uid}`;
    }
  }

  function stopListeners() {
    if (postUnsubscribe) postUnsubscribe();
    if (adminUnsubscribe) adminUnsubscribe();
    postUnsubscribe = null;
    adminUnsubscribe = null;
  }

  function subscribeToPosts() {
    postUnsubscribe = db.collection('blogPosts').onSnapshot((snapshot) => {
      posts = snapshot.docs.map((document) => ({ id: document.id, ...normalizePost(document.data()) }));
      posts.sort((a, b) => toDate(b.publishAt) - toDate(a.publishAt));
      renderPostList();
      if (selectedId) {
        const fresh = posts.find((post) => post.id === selectedId);
        if (fresh && !dirty) {
          selectedPost = fresh;
          fillForm(fresh);
        }
      }
    }, (error) => showToast(friendlyError(error), true));
  }

  function subscribeToAdmins() {
    adminUnsubscribe = db.collection('adminUsers').onSnapshot((snapshot) => {
      elements.adminList.innerHTML = '';
      if (snapshot.empty) {
        elements.adminList.textContent = 'No additional administrators yet.';
        return;
      }
      snapshot.docs.forEach((document) => {
        const data = document.data();
        const wrapper = window.document.createElement('div');
        wrapper.className = 'admin-row';
        const label = window.document.createElement('span');
        label.textContent = `${data.displayName} · ${document.id.slice(0, 8)}…`;
        const toggle = window.document.createElement('button');
        toggle.className = 'button button-quiet';
        toggle.type = 'button';
        toggle.textContent = data.enabled ? 'Disable' : 'Enable';
        toggle.addEventListener('click', () => document.ref.update({ enabled: !data.enabled }));
        wrapper.append(label, toggle);
        elements.adminList.appendChild(wrapper);
      });
    }, () => {
      elements.adminList.textContent = 'Administrator list unavailable.';
    });
  }

  function normalizePost(data) {
    const categories = Array.isArray(data.categories) ? data.categories.join(', ') : (data.categories || '');
    const tags = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');
    const publishAt = data.publishAt || data.date || new Date();
    return {
      title: '', slug: '', author: 'Karen Anderson', excerpt: '', body: '', categories, tags,
      cover: '', coverAlt: '', featured: false, status: data.published ? 'published' : 'draft',
      published: Boolean(data.published), publishAt, seoTitle: '', seoDescription: '',
      canonicalUrl: '', ogImage: '', assetPath: '', legacyUrl: '', readTime: '',
      createdAt: null, updatedAt: null, createdBy: 'migration', updatedBy: 'migration',
      ...data, categories, tags, publishAt
    };
  }

  function renderPostList() {
    const query = elements.postSearch.value.trim().toLowerCase();
    const visible = posts.filter((post) => {
      const statusMatches = activeStatus === 'all' || post.status === activeStatus;
      const haystack = `${post.title} ${post.author} ${post.categories} ${post.tags}`.toLowerCase();
      return statusMatches && haystack.includes(query);
    });
    elements.postList.innerHTML = '';
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-library';
      empty.textContent = 'No posts match this filter.';
      elements.postList.appendChild(empty);
      return;
    }
    visible.forEach((post) => {
      const button = document.createElement('button');
      button.className = `post-list-item${post.id === selectedId ? ' active' : ''}`;
      button.type = 'button';
      const title = document.createElement('strong');
      title.textContent = post.title || 'Untitled post';
      const meta = document.createElement('span');
      meta.className = 'post-list-meta';
      const status = document.createElement('span');
      status.className = 'status-dot';
      status.dataset.status = post.status;
      status.textContent = post.status;
      const date = document.createElement('span');
      date.textContent = formatShortDate(post.publishAt);
      meta.append(status, date);
      button.append(title, meta);
      button.addEventListener('click', () => selectPost(post.id));
      elements.postList.appendChild(button);
    });
  }

  function selectPost(id) {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return;
    const post = posts.find((item) => item.id === id);
    if (!post) return;
    selectedId = id;
    selectedPost = post;
    slugWasEdited = true;
    fillForm(post);
    dirty = false;
    updateSaveState('All changes saved');
    elements.deleteButton.disabled = false;
    renderPostList();
    if (window.innerWidth < 800) elements.postForm.scrollIntoView({ behavior: 'smooth' });
  }

  function newPost() {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return;
    selectedId = null;
    selectedPost = null;
    slugWasEdited = false;
    elements.postForm?.reset();
    if (!elements.postForm) return;
    elements.author.value = 'Karen Anderson';
    elements.status.value = 'draft';
    elements.publishAt.value = toLocalInput(new Date());
    elements.body.value = '';
    elements.featured.checked = false;
    elements.deleteButton.disabled = true;
    elements.postIdentity.textContent = 'New post';
    updateSaveState('Unsaved new post');
    updateExcerptCount();
    updateCoverPreview();
    setEditorView('write');
    dirty = false;
    renderPostList();
  }

  function fillForm(post) {
    fieldIds.forEach((id) => {
      if (id === 'publishAt') return;
      elements[id].value = post[id] ?? '';
    });
    elements.publishAt.value = toLocalInput(toDate(post.publishAt));
    elements.featured.checked = Boolean(post.featured);
    elements.postIdentity.textContent = `Document: blogPosts/${post.id}`;
    updateExcerptCount();
    updateCoverPreview();
    if (!elements.markdownPreview.hidden) renderPreview();
  }

  async function savePost(statusOverride) {
    if (!auth.currentUser) return;
    const status = statusOverride || elements.status.value;
    const slug = slugify(elements.slug.value || elements.title.value);
    elements.slug.value = slug;
    elements.status.value = status;
    if (!elements.title.value.trim() || !slug || !elements.author.value.trim() || !elements.body.value.trim()) {
      showToast('Title, slug, author, and article body are required.', true);
      return;
    }
    if (!elements.postForm.reportValidity()) return;

    const publishDate = new Date(elements.publishAt.value);
    if (Number.isNaN(publishDate.getTime())) {
      showToast('Choose a valid publication date and time.', true);
      return;
    }
    if (status === 'scheduled' && publishDate <= new Date()) {
      showToast('A scheduled publication time must be in the future.', true);
      return;
    }
    if (status === 'published' && statusOverride === 'published') {
      const now = new Date();
      elements.publishAt.value = toLocalInput(now);
      publishDate.setTime(now.getTime());
    }

    setButtonsDisabled(true);
    updateSaveState('Saving…');
    try {
      const newRef = db.collection('blogPosts').doc(slug);
      if (selectedId && selectedId !== slug) {
        const collision = await newRef.get();
        if (collision.exists) throw new Error('Another post already uses that URL slug.');
      }

      const isExistingSameDocument = selectedId === slug && selectedPost;
      const data = buildPostData(status, publishDate, isExistingSameDocument);
      const batch = db.batch();
      batch.set(newRef, data);
      if (selectedId && selectedId !== slug) batch.delete(db.collection('blogPosts').doc(selectedId));
      await batch.commit();
      selectedId = slug;
      selectedPost = { id: slug, ...data, publishAt: Timestamp.fromDate(publishDate) };
      dirty = false;
      slugWasEdited = true;
      elements.deleteButton.disabled = false;
      elements.postIdentity.textContent = `Document: blogPosts/${slug}`;
      updateSaveState(status === 'draft' ? 'Draft saved' : status === 'scheduled' ? 'Post scheduled' : 'Post published');
      showToast(status === 'draft' ? 'Draft saved.' : status === 'scheduled' ? 'Post scheduled.' : 'Post published.');
    } catch (error) {
      updateSaveState('Save failed');
      showToast(friendlyError(error), true);
    } finally {
      setButtonsDisabled(false);
    }
  }

  function buildPostData(status, publishDate, existing) {
    const body = elements.body.value.trim();
    const excerpt = elements.excerpt.value.trim() || plainTextExcerpt(body);
    const uid = auth.currentUser.uid;
    return {
      title: elements.title.value.trim(),
      slug: elements.slug.value,
      author: elements.author.value.trim(),
      excerpt,
      body,
      categories: cleanListString(elements.categories.value, 500),
      tags: cleanListString(elements.tags.value, 1000),
      cover: elements.cover.value.trim(),
      coverAlt: elements.coverAlt.value.trim(),
      featured: elements.featured.checked,
      status,
      published: status !== 'draft',
      publishAt: Timestamp.fromDate(publishDate),
      seoTitle: elements.seoTitle.value.trim(),
      seoDescription: elements.seoDescription.value.trim(),
      canonicalUrl: elements.canonicalUrl.value.trim(),
      ogImage: elements.ogImage.value.trim(),
      assetPath: existing?.assetPath || selectedPost?.assetPath || '',
      legacyUrl: existing?.legacyUrl || selectedPost?.legacyUrl || `https://www.educationworldtravel.com/post/${elements.slug.value}`,
      readTime: elements.readTime.value.trim() || estimateReadTime(body),
      date: publishDate.toUTCString(),
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: existing?.createdBy || uid,
      updatedBy: uid
    };
  }

  async function deletePost() {
    if (!selectedId || !window.confirm(`Permanently delete “${elements.title.value || selectedId}”?`)) return;
    setButtonsDisabled(true);
    try {
      await db.collection('blogPosts').doc(selectedId).delete();
      showToast('Post deleted.');
      dirty = false;
      newPost();
    } catch (error) {
      showToast(friendlyError(error), true);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function addAdmin() {
    const uid = elements.adminUid.value.trim();
    const displayName = elements.adminName.value.trim();
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(uid) || !displayName) {
      showToast('Enter the editor’s valid Firebase UID and display name.', true);
      return;
    }
    try {
      await db.collection('adminUsers').doc(uid).set({
        enabled: true,
        displayName,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      elements.adminUid.value = '';
      elements.adminName.value = '';
      showToast(`${displayName} can now use the CMS.`);
    } catch (error) {
      showToast(friendlyError(error), true);
    }
  }

  async function uploadFile(input, folder, purpose) {
    let file = input.files?.[0];
    if (!file) return;
    if (folder === 'images') file = await optimizeImage(file);
    const safeName = file.name.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    const path = `cms/${folder}/${Date.now()}-${safeName || 'upload'}`;
    elements.uploadState.textContent = `Uploading ${file.name}…`;
    try {
      const snapshot = await storage.ref(path).put(file, { contentType: file.type || undefined });
      const url = await snapshot.ref.getDownloadURL();
      if (purpose === 'cover') {
        elements.cover.value = url;
        if (!elements.ogImage.value) elements.ogImage.value = url;
        if (!elements.coverAlt.value) elements.coverAlt.focus();
        updateCoverPreview();
      } else if (purpose === 'body-image') {
        insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${url})`);
      } else {
        insertAtCursor(`[Download ${file.name}](${url})`);
      }
      markDirty();
      elements.uploadState.textContent = `${file.name} uploaded.`;
      showToast('Upload complete.');
    } catch (error) {
      elements.uploadState.textContent = '';
      showToast(friendlyError(error), true);
    } finally {
      input.value = '';
    }
  }

  async function optimizeImage(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size < 450000) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
    } catch (_) {
      return file;
    }
  }

  function exportContent() {
    const serializable = posts.map((post) => ({
      ...post,
      publishAt: toDate(post.publishAt).toISOString(),
      createdAt: post.createdAt ? toDate(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? toDate(post.updatedAt).toISOString() : null
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), posts: serializable }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `education-world-travel-posts-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${posts.length} posts.`);
  }

  function applyMarkdownFormat(event) {
    const button = event.target.closest('button');
    if (!button || button === elements.youtubeButton) return;
    if (button.dataset.line) {
      const start = elements.body.selectionStart;
      const before = elements.body.value.slice(0, start);
      const prefix = start === 0 || before.endsWith('\n') ? '' : '\n';
      insertAtCursor(`${prefix}${button.dataset.line}`);
      return;
    }
    wrapSelection(button.dataset.before || '', button.dataset.after || '');
  }

  function wrapSelection(before, after) {
    const start = elements.body.selectionStart;
    const end = elements.body.selectionEnd;
    const selected = elements.body.value.slice(start, end) || 'text';
    elements.body.setRangeText(`${before}${selected}${after}`, start, end, 'end');
    elements.body.focus();
    markDirty();
  }

  function insertAtCursor(text) {
    const start = elements.body.selectionStart;
    const end = elements.body.selectionEnd;
    const prefix = start > 0 && !elements.body.value.slice(0, start).endsWith('\n') ? '\n\n' : '';
    elements.body.setRangeText(`${prefix}${text}\n\n`, start, end, 'end');
    elements.body.focus();
    markDirty();
  }

  function insertYouTube() {
    const url = window.prompt('Paste a YouTube video URL:');
    if (url) insertAtCursor(`@[youtube](${url.trim()})`);
  }

  function setEditorView(view) {
    const preview = view === 'preview';
    elements.body.hidden = preview;
    elements.markdownPreview.hidden = !preview;
    elements.markdownToolbar.hidden = preview;
    elements.writeTab.classList.toggle('active', !preview);
    elements.previewTab.classList.toggle('active', preview);
    elements.writeTab.setAttribute('aria-selected', String(!preview));
    elements.previewTab.setAttribute('aria-selected', String(preview));
    if (preview) renderPreview();
  }

  function renderPreview() {
    elements.markdownPreview.innerHTML = window.EWTMarkdown.render(elements.body.value, {
      contentRoot: '../',
      assetPath: selectedPost?.assetPath || ''
    });
  }

  function setStatusFilter(event) {
    const button = event.target.closest('button[data-status]');
    if (!button) return;
    activeStatus = button.dataset.status;
    elements.statusTabs.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    renderPostList();
  }

  function syncSlugFromTitle() {
    if (!slugWasEdited || !elements.slug.value) elements.slug.value = slugify(elements.title.value);
  }

  function syncStatusForDate() {
    const date = new Date(elements.publishAt.value);
    if (elements.status.value === 'scheduled' && date <= new Date()) elements.status.value = 'draft';
  }

  function updateCoverPreview() {
    const value = elements.cover.value.trim();
    if (!value) {
      elements.coverPreview.style.backgroundImage = '';
      elements.coverPreview.textContent = 'No cover selected';
      return;
    }
    const url = window.EWTMarkdown.resolveReference(value, { contentRoot: '../', assetPath: selectedPost?.assetPath || '' });
    elements.coverPreview.style.backgroundImage = `url("${url.replace(/["\\]/g, '\\$&')}")`;
    elements.coverPreview.textContent = '';
  }

  function markDirty() {
    dirty = true;
    updateSaveState('Unsaved changes');
    if (!elements.markdownPreview.hidden) renderPreview();
  }

  function updateExcerptCount() {
    elements.excerptCount.textContent = `${elements.excerpt.value.length.toLocaleString()} / 1,000`;
  }

  function updateSaveState(message) {
    elements.saveState.textContent = message;
  }

  function setButtonsDisabled(disabled) {
    [elements.saveDraftButton, elements.saveButton, elements.publishButton, elements.deleteButton].forEach((button) => {
      button.disabled = disabled || (button === elements.deleteButton && !selectedId);
    });
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle('error', isError);
    elements.toast.classList.add('show');
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 4500);
  }

  function cleanListString(value, maxLength) {
    return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))].join(', ').slice(0, maxLength);
  }

  function slugify(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  }

  function plainTextExcerpt(markdown) {
    return String(markdown).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
  }

  function estimateReadTime(markdown) {
    const words = String(markdown).trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 220))} min read`;
  }

  function toDate(value) {
    if (value?.toDate) return value.toDate();
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  function toLocalInput(value) {
    const date = toDate(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function formatShortDate(value) {
    const date = toDate(value);
    if (!date.getTime()) return 'No date';
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function friendlyError(error) {
    const code = error?.code || '';
    if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
    if (code.includes('unauthorized-domain')) return 'This website domain must be added to Firebase Authentication’s authorized domains.';
    if (code.includes('permission-denied') || code.includes('unauthorized')) return 'Firebase denied this action. Check that your account is an approved administrator.';
    return error?.message || 'Something went wrong. Please try again.';
  }
})();
