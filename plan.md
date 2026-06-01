# Education World Travel Website Rebuild

## What has been done so far
The Education World Travel site is being rebuilt from Wix to vanilla HTML/CSS/JavaScript with a focus on clean responsive design and GitHub Pages deployment.

### Completed work
- Header/navigation built and reused across pages
- Homepage created with hero section and site branding
- About page created as `pages/about.html`
- Blog listing page created as `pages/blog.html`
- Blog post template available in `pages/blog-post.html`
- Store/Downloads placeholder pages added to avoid 404s
- Custom 404 handling page added at `404.html`
- Current GitHub Pages asset path issue fixed for the 404 page
- New site feature page created as `pages/whats-new.html`

### Current progress
- Site skeleton is fully present in the repo
- Most navigation links now resolve correctly
- Blog page content has been updated with the latest copy
- The about page now includes a CTA to the new website features page
- `plan.md` is being updated to show where we are and what comes next

## What still needs to be finished
- Add blog cover images and richer post card content
- Complete `pages/store.html` and `pages/downloads.html` with real content
- Improve blog listing with category filtering, search, or pagination
- Add more polished homepage sections and featured content
- Add accessibility and SEO enhancements
- Deploy final version to GitHub Pages and verify all subpaths

## Project goals
- Preserve the current brand tone and travel-learning message
- Keep the site lightweight and easy to maintain
- Build a static website that can host real stories, travel tips, and resources
- Create a future-ready structure for blog and page content

## Current file structure
```
eduworldtravel/
├── index.html
├── 404.html
├── pages/
│   ├── about.html
│   ├── blog.html
│   ├── blog-post.html
│   ├── store.html
│   ├── downloads.html
│   └── whats-new.html
├── css/
│   └── main.css
├── js/
│   └── main.js
├── assets/
│   ├── about/
│   ├── 404/
│   └── images/
└── plan.md
```

## Notes for the next sprint
1. Finalize the site brand experience on `whats-new.html`
2. Add missing image assets and post covers
3. Build actual store content or Stripe product links
4. Add a footer for contact + copyright information
5. Validate GitHub Pages deployment on the repo URL

## GitHub Pages base URL
The site lives at:

`https://andomatthew1234.github.io/Education-world-travel/`

Use this URL to test page navigation and 404 handling.
