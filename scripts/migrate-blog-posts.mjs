import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const projectId = 'educationworldtravel-bbf1e';
const app = initializeApp({ projectId });
const db = getFirestore(app);
const root = resolve(import.meta.dirname, '..');
const posts = JSON.parse(await readFile(resolve(root, 'data/blog-list.json'), 'utf8'));

function markdownBody(markdown) {
  const frontMatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return markdown.slice(frontMatter?.[0].length ?? 0).trim();
}

for (const post of posts) {
  const markdown = await readFile(resolve(root, post.filename), 'utf8');
  const { filename, ...metadata } = post;
  const postDir = filename.split('/').slice(0, -1).join('/');

  await setDoc(doc(db, 'blogPosts', post.slug), {
    ...metadata,
    body: markdownBody(markdown),
    assetPath: postDir,
    published: true
  });
  console.log(`Migrated ${post.slug}`);
}

console.log(`Migrated ${posts.length} published blog posts.`);
