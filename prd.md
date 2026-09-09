# Product Requirements Document

## Eduworld Travel Website Migration

**Status:** Draft  
**Version:** 1.0  
**Purpose:** Migrate the existing Eduworld Travel website to a fully custom-coded, fast, secure, CMS-managed platform while preserving the current structure and design for the initial release.

## 1. Product Summary

Eduworld Travel needs a content-focused website that is easy for two administrators to manage without manually editing code or republishing files. The visitor-facing website must remain fully custom-built and code-owned, rather than being created with a closed website builder such as Wix.

The initial release will preserve the existing site structure, visual design, and core static pages while migrating the five existing blog posts into a CMS. A larger visual redesign is explicitly out of scope for this phase.

## 2. Goals

- Retain complete ownership and control of the website code.
- Allow two administrators to create, edit, preview, schedule, and publish posts through a simple CMS interface.
- Make the site fast, responsive, secure, mobile-first, and SEO-friendly.
- Preserve the existing information architecture and design as closely as practical.
- Keep ongoing operating costs preferably below AUD $40/year, excluding the domain.
- Ensure content can be exported to reduce vendor lock-in.
- Support future enhancements without requiring a platform migration.

## 3. Proposed Technical Architecture

| Layer | Selected Technology | Responsibility |
|---|---|---|
| CMS | Sanity | Content editing, posts, media metadata, authors, categories, tags, drafts, scheduled publishing, and content API |
| Frontend | Astro | Custom site code, static generation, layouts, SEO pages, performance, and content rendering |
| Hosting | Cloudflare Pages | Global static hosting, Git-connected deployments, HTTPS, CDN, and automated rebuilds |
| Source Control | GitHub | Website code ownership, version history, reviews, and deployment source |
| Spam Protection | Cloudflare Turnstile, later phase | Contact-form protection |
| Analytics | Cloudflare Web Analytics, later/core enhancement | Privacy-conscious visitor and referrer analytics |

### Architecture Flow

```text
Sanity CMS
    |
    | Content API / publish webhook
    v
Astro website source in GitHub
    |
    | Build and deploy
    v
Cloudflare Pages
    |
    v
Visitors
```

## 4. Users

### Site Visitors

Readers using desktop, tablet, and mobile devices who browse travel and education-related posts, static pages, downloads, and other resources.

### CMS Administrators

Two approved users with Sanity administrator access.

Administrators can:

- Create, edit, preview, schedule, publish, unpublish, and delete posts.
- Upload and manage article images.
- Manage categories, tags, featured-post status, and author information.
- Edit post SEO and social-sharing fields.
- Access the CMS content export process.

Both administrators will have publishing permissions. Editorial review is therefore a shared working practice rather than a CMS-enforced approval stage.

## 5. Functional Requirements

### 5.1 Existing Site Migration

The first release must:

- Preserve the existing page structure and navigation as closely as practical.
- Preserve the existing visual design as closely as practical.
- Migrate the five current blog posts from the existing Markdown/Firestore/static-media setup into Sanity.
- Preserve existing post titles, dates, authors, categories, excerpts, cover images, body content, and associated media where available.
- Retain existing static pages, including the homepage, About, Store, Downloads, and other current non-blog content.
- Keep the site usable on mobile phones and tablets.

### 5.2 Blog And CMS Content Model

Each post must support:

- Title.
- URL slug.
- Publication date.
- Author.
- Excerpt.
- Cover image and descriptive alt text.
- Article body.
- Categories.
- Tags.
- Featured-post flag.
- Draft and published states.
- Scheduled publication date/time.
- SEO title.
- SEO meta description.
- Canonical URL override where required.
- Open Graph/social-sharing image.
- Structured article metadata.
- YouTube embeds.
- Downloadable files.

The initial release will not require:

- Interactive maps.
- Social-media embeds.
- Arbitrary custom HTML or JavaScript embeds.
- Complex tables.

These may be added later only where there is a demonstrated content need.

### 5.3 Blog Discovery

The public site must provide:

- A blog listing page.
- Category filtering.
- Tags.
- Featured posts.
- Author details.
- Search for posts.
- Individual article pages at clean canonical URLs:

```text
/blog/<slug>/
```

### 5.4 SEO And Sharing

The site must:

- Generate static, crawlable HTML pages for individual posts.
- Set editable title tags and meta descriptions.
- Set canonical URLs.
- Provide Open Graph and social-sharing metadata.
- Generate article structured data using JSON-LD.
- Generate and publish an XML sitemap.
- Provide a usable `robots.txt`.
- Use descriptive image alt text.
- Avoid the current client-only blog rendering model, which prevents reliable per-article SEO metadata.

### 5.5 URL Preservation

The new canonical blog URL format is:

```text
/blog/<slug>/
```

Where simple and practical, legacy URLs should permanently redirect to the new canonical URL, including:

- Legacy Wix-style routes such as `/post/<slug>`.
- Current query-string routes such as `/pages/blog-post.html?slug=<slug>`.

Redirect work is desirable but must not delay the core migration.

### 5.6 CMS Workflow

The CMS must enable:

- Separate login accounts for the two administrators.
- Draft saving.
- Content previews before publication.
- Scheduled publishing.
- Post editing after publication.
- Media upload and management.
- Content export.

Sanity is the preferred CMS. Before implementation is finalized, its current free-tier support for the required preview and scheduled-publishing workflow must be verified. If a required feature is unavailable at the acceptable cost, select the lowest-maintenance compatible approach without changing the custom-code frontend architecture.

### 5.7 Image Management

The platform must:

- Let administrators upload images through the CMS.
- Automatically serve appropriately sized, optimized image variants.
- Preserve good visual quality while minimizing load time.
- Store or retain source-image information sufficiently to support content export/migration.
- Require alt text for meaningful content images where practical.

### 5.8 Backups And Ownership

The solution must:

- Keep all frontend source code in GitHub.
- Keep deployment configuration in source control.
- Support export of CMS post content and content metadata.
- Maintain a documented media export/recovery process.
- Use automatic backups or an equivalent recoverable source-history mechanism for code and content.
- Avoid making the website dependent on a proprietary visual website builder.

### 5.9 Security

The solution must:

- Use HTTPS by default.
- Avoid exposing CMS write credentials in browser code.
- Restrict CMS editing to approved accounts.
- Use least-privilege access where supported.
- Sanitize content rendering and avoid arbitrary editor-supplied scripts.
- Keep infrastructure maintenance low by using managed services for hosting and CMS operations.
- Use spam protection for the contact form when that feature is added.

### 5.10 Analytics

The site must provide simple analytics showing:

- Visitor count.
- Popular pages/posts.
- Referrer/source information.

Cloudflare Web Analytics is the preferred initial option, subject to confirming it provides sufficient reporting for the required use.

### 5.11 Contact Form

The contact/enquiry form is deferred until after the migration and core CMS/site work.

When implemented, it must:

- Send submissions to one agreed existing email inbox.
- Include spam protection with Cloudflare Turnstile.
- Avoid requiring a custom always-on backend where possible.
- Work well on mobile devices.

## 6. Non-Functional Requirements

### Performance

- Prioritize mobile-first performance.
- Generate static HTML for public pages where possible.
- Minimize client-side JavaScript.
- Serve assets through a CDN.
- Optimize and resize uploaded images.
- Avoid blocking third-party scripts unless necessary.

### Accessibility

- Use semantic HTML.
- Maintain keyboard-accessible navigation.
- Use sufficient contrast and legible typography.
- Provide alternative text for meaningful images.
- Ensure responsive layouts and touch-friendly controls.

### Reliability

- Use managed hosting with CDN delivery.
- Automatically deploy successful changes from the main GitHub branch.
- Rebuild the public site when CMS content is published or updated.
- Provide a documented recovery process for deployments and content.

### Cost

- Target all operating costs below AUD $40/year, excluding domain registration.
- Free tiers may be used initially.
- A modest budget increase may be considered only if it materially improves reliability, security, CMS workflow, or maintenance.
- Any paid service must be approved before adoption.

## 7. Delivery Scope

### Phase 1: Platform And Content Migration

- Set up Astro project structure.
- Recreate existing static pages and navigation.
- Configure Sanity content models.
- Configure two administrator accounts.
- Migrate the five existing posts and their media.
- Build blog listing and article pages.
- Add categories, tags, featured posts, authors, and search.
- Add SEO metadata, structured data, sitemap, and sharing controls.
- Deploy through Cloudflare Pages.
- Configure CMS publish-to-deploy automation.
- Add straightforward legacy URL redirects.
- Document content export, deployment, and recovery procedures.

### Phase 2: Operational Enhancements

- Add visitor/referrer analytics.
- Add the spam-protected contact/enquiry form.
- Review and improve backups/export workflow.
- Validate performance and accessibility improvements.
- Add only the richer content blocks that prove necessary.

### Out Of Scope For Initial Release

- Full visual redesign.
- Closed website-builder platforms.
- Custom built CMS administration interface.
- Interactive maps.
- Social-media embeds.
- Complex article tables.
- Arbitrary custom code embedded in posts.
- A formal CMS-enforced reviewer/publisher approval workflow.

## 8. Success Criteria

The migration is successful when:

- Both administrators can independently create, edit, preview, schedule, and publish a post without editing website code.
- The five existing posts and their required images are available on the new site.
- The existing site structure and design are recognizably preserved.
- Each article has a clean, unique, crawlable URL.
- Search engines can access article text and SEO metadata without client-side rendering.
- Article pages provide editable titles, descriptions, Open Graph data, sitemap inclusion, and structured article metadata.
- The site works smoothly on phones and tablets.
- Content and code can be exported or recovered without dependence on a single proprietary website builder.
- The deployed system remains within the preferred operating-cost target where free-tier limits permit.
- Contact forms are explicitly deferred rather than silently omitted.

## 9. Risks And Validation Items

| Risk | Mitigation |
|---|---|
| Sanity free tier may not include every desired scheduling/preview feature | Validate current plan capability before final CMS configuration; choose the lowest-maintenance compatible alternative if required |
| Free-tier pricing or limits may change | Keep source code in GitHub and content exportable; document migration paths |
| Existing image references may not migrate cleanly | Inventory and migrate media, then validate every imported article |
| Legacy URLs may be difficult to redirect exactly | Implement straightforward redirects first; do not block core launch |
| Both administrators can publish immediately | Establish a shared editorial checklist outside the CMS |
| Existing design may contain non-responsive or inaccessible patterns | Preserve the visual language while correcting clearly necessary mobile and accessibility issues |
| Contact forms may introduce service costs | Defer until the core migration is complete and select a low-cost form delivery service then |
