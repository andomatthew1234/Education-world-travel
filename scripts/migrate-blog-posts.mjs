import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const firebaseAuth = require('firebase-tools/lib/auth');
const scopes = require('firebase-tools/lib/scopes');

const projectId = 'educationworldtravel-bbf1e';
const databaseId = '(default)';
const root = resolve(import.meta.dirname, '..');
const posts = JSON.parse(await readFile(resolve(root, 'data/blog-list.json'), 'utf8'));

function markdownBody(markdown) {
  const frontMatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return markdown.slice(frontMatter?.[0].length ?? 0).trim();
}

function field(value) {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } };
  return { stringValue: String(value ?? '') };
}

function firestoreDocument(post, body, now) {
  const publishAt = new Date(post.date);
  const postDir = post.filename.split('/').slice(0, -1).join('/');
  const values = {
    title: post.title,
    slug: post.slug,
    author: post.author || 'Karen Anderson',
    excerpt: post.excerpt || '',
    body,
    // Preserve the legacy array during migration so the currently deployed
    // GitHub Pages bundle stays compatible. The CMS normalizes it to a
    // validated comma-delimited string on the first editorial save.
    categories: post.categories || [],
    tags: '',
    cover: post.cover || '',
    coverAlt: post.coverAlt || '',
    featured: false,
    status: 'published',
    published: true,
    publishAt,
    seoTitle: post.title,
    seoDescription: (post.excerpt || '').slice(0, 320),
    canonicalUrl: '',
    ogImage: post.cover || '',
    assetPath: postDir,
    legacyUrl: post.link || '',
    readTime: post.readTime || '',
    date: publishAt.toUTCString(),
    createdAt: publishAt,
    updatedAt: now,
    createdBy: 'migration',
    updatedBy: 'migration'
  };
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, field(value)]));
}

const account = firebaseAuth.getProjectDefaultAccount(root) || firebaseAuth.getGlobalDefaultAccount();
if (!account?.tokens?.refresh_token) {
  throw new Error('Firebase CLI login required. Run: npx firebase-tools login');
}

const token = await firebaseAuth.getAccessToken(account.tokens.refresh_token, [scopes.CLOUD_PLATFORM]);
const now = new Date();
const writes = [];

for (const post of posts) {
  const markdown = await readFile(resolve(root, post.filename), 'utf8');
  writes.push({
    update: {
      name: `projects/${projectId}/databases/${databaseId}/documents/blogPosts/${post.slug}`,
      fields: firestoreDocument(post, markdownBody(markdown), now)
    }
  });
}

const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents:commit`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ writes })
});

if (!response.ok) {
  throw new Error(`Firestore migration failed (${response.status}): ${await response.text()}`);
}

const result = await response.json();
posts.forEach((post) => console.log(`Migrated ${post.slug}`));
console.log(`Migrated ${result.writeResults?.length || posts.length} published blog posts into ${projectId}/${databaseId}.`);
