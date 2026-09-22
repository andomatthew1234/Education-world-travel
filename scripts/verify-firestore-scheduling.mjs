import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const firebaseAuth = require('firebase-tools/lib/auth');
const scopes = require('firebase-tools/lib/scopes');
const projectId = 'educationworldtravel-bbf1e';
const databaseId = '(default)';
const apiKey = 'AIzaSyBwvu__CbEtGBGaiEeOj9n0lBepzWaXdYA';
const probeId = 'cms-schedule-security-probe';
const root = resolve(import.meta.dirname, '..');
const account = firebaseAuth.getProjectDefaultAccount(root) || firebaseAuth.getGlobalDefaultAccount();
const token = await firebaseAuth.getAccessToken(account.tokens.refresh_token, [scopes.CLOUD_PLATFORM]);
const databaseName = `projects/${projectId}/databases/${databaseId}`;
const documents = `https://firestore.googleapis.com/v1/${databaseName}/documents`;
const postName = `${databaseName}/documents/blogPosts/${probeId}`;
const scheduleName = `${databaseName}/documents/publicationSchedule/${probeId}`;
const adminHeaders = { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' };

async function adminCommit(writes) {
  const response = await fetch(`${documents}:commit`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ writes }) });
  if (!response.ok) throw new Error(`Admin commit failed (${response.status}): ${await response.text()}`);
}

function timestamp(value) { return { timestampValue: value }; }
function string(value) { return { stringValue: value }; }

const sourceResponse = await fetch(`${documents}/blogPosts/legendary-london`, { headers: adminHeaders });
if (!sourceResponse.ok) throw new Error(`Could not read source post: ${await sourceResponse.text()}`);
const source = await sourceResponse.json();
const fields = structuredClone(source.fields);
fields.title = string('CMS schedule security probe');
fields.slug = string(probeId);
fields.status = string('scheduled');
fields.published = { booleanValue: false };
fields.categories = string('Test');
fields.createdBy = string('security-probe');
fields.updatedBy = string('security-probe');

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 60000).toISOString();

try {
  fields.publishAt = timestamp(future);
  await adminCommit([
    { update: { name: postName, fields } },
    { update: { name: scheduleName, fields: { slug: string(probeId), publishAt: timestamp(future) } } }
  ]);

  const hiddenRead = await fetch(`${documents}/blogPosts/${probeId}?key=${apiKey}`);
  const queryResponse = await fetch(`${documents}:runQuery?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: 'blogPosts' }],
      where: { compositeFilter: { op: 'AND', filters: [
        { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
        { fieldFilter: { field: { fieldPath: 'publishAt' }, op: 'LESS_THAN_OR_EQUAL', value: timestamp(new Date().toISOString()) } }
      ] } },
      orderBy: [{ field: { fieldPath: 'publishAt' }, direction: 'DESCENDING' }]
    } })
  });
  const queryBody = await queryResponse.json();
  const publicCount = queryBody.filter((item) => item.document).length;

  fields.publishAt = timestamp(past);
  await adminCommit([
    { update: { name: postName, fields } },
    { update: { name: scheduleName, fields: { slug: string(probeId), publishAt: timestamp(past) } } }
  ]);
  const promoteResponse = await fetch(`${documents}:commit?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [
      {
        update: { name: postName, fields: {
          status: string('published'), published: { booleanValue: true }, updatedBy: string('public-scheduler')
        } },
        updateMask: { fieldPaths: ['status', 'published', 'updatedBy'] },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
      },
      { delete: scheduleName }
    ] })
  });
  const publishedRead = await fetch(`${documents}/blogPosts/${probeId}?key=${apiKey}`);
  const result = {
    futureRead: hiddenRead.status,
    publicQuery: queryResponse.status,
    publicPostCount: publicCount,
    duePromotion: promoteResponse.status,
    promotedRead: publishedRead.status
  };
  console.log(JSON.stringify(result));
  if (hiddenRead.status !== 403 || queryResponse.status !== 200 || publicCount !== 5 || promoteResponse.status !== 200 || publishedRead.status !== 200) {
    console.error(await promoteResponse.text());
    process.exitCode = 1;
  }
} finally {
  await adminCommit([{ delete: postName }, { delete: scheduleName }]);
}
