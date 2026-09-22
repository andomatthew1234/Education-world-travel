# Education World Travel

![Education World Travel Logo](assets/images/favicon.png)

Welcome to the Education World Travel website rebuild. This project is a vanilla HTML/CSS/JavaScript version of the Education World Travel site, designed to replace the Wix site with a lightweight, responsive, and GitHub Pages–friendly experience.

## What this project is
This repository contains the static website for Education World Travel, including:

- `index.html` — homepage and hero experience
- `pages/about.html` — About page describing the mission and story
- `pages/blog.html` — blog listing page with posts and filters
- `pages/blog-post.html` — blog post detail template
- `pages/store.html` — store placeholder page
- `pages/downloads.html` — downloads placeholder page
- `404.html` — custom page-not-found experience
- `pages/whats-new.html` — new website feature page

## About Education World Travel
Education World Travel is built around the idea of using travel to educate children and families. It belongs to an educational speech pathologist and mother of four who enjoys traveling with her family and turning every trip into a learning opportunity.

### About page content
- **What is Education World Travel?**
  - The site explains how travel becomes a live classroom for children and parents.
  - It describes the joy of seeing real-world places after reading stories or watching films.
  - The goal is to help families make the most of travel experiences together.

- **About Me**
  - I am an Educational Speech Pathologist and a mum to four beautiful boys — three of whom are now grown up.
  - We live in Australia and love traveling here and around the world.
  - I have homeschooled my children for many years and always look for ways to educate them (and myself) whenever we travel.
  - If this is your passion too, welcome aboard!

## What the GitHub Page is for
This GitHub Pages site is the public home for the Education World Travel rebuild. It is used to:

- host the website online with Github Pages
- share the current site progress and feature updates
- hosts all of the pages and static images on the website
- make it easy for us to publish the latest updates in a few clicks
- allow users to contribute to the project, or report bugs

## Visual features
The site now includes:

- responsive navigation with a mobile hamburger menu
- a custom `whats-new` feature page with animation and highlight cards
- a custom GitHub Pages-friendly 404 page
- placeholder pages for Store and Downloads to avoid broken links

## Blog post structure
Each blog post lives in its own folder under `blog/`. Keep the Markdown file and any images for that post together:

```text
blog/
  capering-about-the-cotswolds/
    capering-about-the-cotswolds.md
    cover.jpg
    village-street.jpg
```

Use post-folder-relative image paths in the Markdown:

```md
---
title: 'Capering about the Cotswolds'
cover: 'cover.jpg'
coverAlt: 'Cotswolds village street'
---

![Arlington Row cottages](village-street.jpg)
```

The Markdown files are now the migration/archive source. Live content is stored in the `blogPosts` collection in Firestore and managed through the custom CMS.

## Firebase CMS

The private editorial workspace is deployed at:

```text
https://educationworldtravel-bbf1e.web.app/admin/
```

It supports:

- Google sign-in and approved administrator accounts
- drafts, immediate publishing, and scheduled publishing
- full GitHub-flavoured Markdown with a sanitised live preview
- cover images, article images, file downloads, and YouTube embeds
- categories, tags, featured posts, author and reading-time fields
- SEO titles/descriptions, canonical URLs, and social images
- content search, mobile editing, and JSON content export

The bootstrap administrator is the verified Firebase account configured in `firestore.rules`. Additional administrators sign in once, copy the UID shown on the access screen, and are approved from the Administrators panel in the CMS.

Scheduled posts remain private until `publishAt`. The first public blog visit after that time performs a tightly restricted, atomic promotion validated by Firestore Security Rules, so no paid scheduler or server process is required.

### Media setup

Cloud Storage for Firebase now requires the Blaze billing plan for new projects. The CMS upload controls and secure `storage.rules` are implemented, but the project owner must activate Storage and link billing before uploads can be deployed. Existing repository images and external HTTPS image URLs continue to work without Storage.

### Migration and deployment

Re-import the five archived posts with the full CMS metadata schema:

```text
node scripts/migrate-blog-posts.mjs
```

Deploy authentication, Firestore, and the Firebase-hosted CMS:

```text
npx firebase-tools deploy --only auth,firestore,hosting
```

After Storage has been activated, deploy its rules with:

```text
npx firebase-tools deploy --only storage
```

The public GitHub Pages site reads only published, non-future posts directly from Firestore. Firebase write credentials are never present in public JavaScript.

## Project status
The rebuild is actively being built. Current progress includes:

- About page complete
- Blog listing page live
- 404 page fixed for GitHub Pages asset paths
- New website feature page created
- Store/Downloads placeholders in place

What we're planning to add soon:
- Static article generation for stronger search-engine and social-card crawling
- Activate Firebase Storage after billing approval
- Easy bug-reporting page 
- improved images
- dark theme option

## How to view the site
Standard use-case:
Head to our site at https://andomatthew1234.github.io/Education-world-travel/
For developers: Run the index.html file in your browser.

---


![About Image](assets/about/1.png)

*Site created by Matthew Anderson*
