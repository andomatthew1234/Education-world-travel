# Eduworld Travel Migration Tasks

This is the proposed dependency-aware ticket breakdown derived from `prd.md`. Review and approve the granularity and blocking edges before publishing separate ticket files.

## 1. Validate Firebase and cost assumptions

**Blocked by:** None.

**What it delivers:** A confirmed Firebase configuration for two administrators, drafts, previews, scheduling, exports, and public Firestore reads. Firebase Storage requires Blaze billing before activation.

## 2. Connect the existing site to Firestore

**Blocked by:** Task 1.

**What it delivers:** The existing GitHub Pages site lists and renders published Firestore posts securely.

## 3. Recreate the shared site shell and static pages

**Blocked by:** Task 2.

**What it delivers:** Visitors can use the existing navigation and access the current non-blog pages in the Astro site, with the existing layout and visual language preserved across desktop, tablet, and mobile.

## 4. Configure the Firebase editorial workspace

**Blocked by:** Task 1.

**What it delivers:** Approved administrators can sign in to the custom Firebase CMS and manage authors, categories, tags, posts, cover images, SEO/social fields, YouTube embeds, downloadable files, drafts, previews, scheduling, publishing, and exports.

## 5. Build the CMS-powered article page

**Blocked by:** Tasks 2 and 4.

**What it delivers:** A published Firestore post appears as a responsive, secure article, including its image, author, categories/tags, embedded YouTube content, downloads, and client-side SEO/social metadata.

## 6. Build blog discovery and navigation

**Blocked by:** Task 5.

**What it delivers:** Visitors can browse Firestore blog posts, filter by category, identify featured posts, view author information, and search content.

## 7. Migrate and verify existing content

**Blocked by:** Tasks 4, 5, and 6.

**What it delivers:** The five current posts and their media metadata are imported into Firestore, render correctly, retain their metadata, and are available through the blog listing and search experience.

## 8. Complete SEO, sharing, and legacy URLs

**Blocked by:** Tasks 3, 5, and 7.

**What it delivers:** The deployed website has page-specific editable metadata, Open Graph data, JSON-LD article markup, sitemap, `robots.txt`, canonical URLs, and straightforward redirects from old Wix/query-string post URLs to `/blog/<slug>/`.

## 9. Automate publishing and document ownership operations

**Blocked by:** Tasks 2, 4, and 7.

**What it delivers:** Firestore changes appear directly on the GitHub Pages blog, scheduled posts are promoted on the first due public visit, and administrators have clear documentation for publishing, previewing, exporting content/media, recovering a deployment, and managing access.

## 10. Launch-readiness review

**Blocked by:** Tasks 3, 6, 8, and 9.

**What it delivers:** The migration is checked against the PRD for mobile usability, accessibility, performance, security, CMS administration, cost assumptions, and successful production behavior.

## 11. Add privacy-conscious visitor analytics

**Blocked by:** Task 10.

**What it delivers:** Administrators can see visits, popular pages, and referral sources through Cloudflare Web Analytics or the validated equivalent.

## 12. Add the protected contact and enquiry form

**Blocked by:** Task 10.

**What it delivers:** Visitors can submit enquiries on mobile or desktop, protected by Cloudflare Turnstile, with messages delivered to the agreed email inbox without an always-on custom server.
