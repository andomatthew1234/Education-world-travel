# Plan: Rebuild EWT Website from Wix to Vanilla JS

## TL;DR
Rebuild educationworldtravel.com from Wix to vanilla HTML/CSS/JavaScript, maintaining the light/minimalistic design. Build in phases: (1) Header + Footer components, (2) Homepage/landing page, (3) About page, (4) Blog listing and detail pages, (5) Store page with Stripe integration. Deploy to GitHub Pages.

## Site Structure (from Wix analysis)

**Key Pages:**
- Homepage (landing page with hero "Educate your kids as you travel")
- Blog (listing + individual post pages)
- About/What is Education World Travel?
- Store (products with Stripe buy links)
- Downloads (listed in nav)

**Navigation:**
- Logo: "happy TRAVELERS" with image
- Primary nav: Home, Blog, Store, What is Education World Travel?, Downloads
- Login option (defer for now, future feature)

**Design Observations:**
- Light, minimalistic, chill aesthetic
- Tagline: "Expand your horizons"
- Main call-to-action: "Educate your kids as you travel!"
- Featured blog posts displayed on homepage
- Footer with copyright and links

## Implementation Phases

### Phase 1: Setup & Header/Footer Components
1. Initialize project structure in existing repo (c:\Users\muman\OneDrive\Other\Documents\Coding\eduworldtravel)
2. Create core folder structure: `css/`, `js/`, `pages/`, `assets/`, `blog/`
3. Build reusable header component with navigation (static HTML/CSS first)
4. Build reusable footer component with links and copyright
5. Create base stylesheet with light theme colors and typography
6. **Dependencies:** None (can run in parallel with other discovery)

### Phase 2: Homepage/Landing Page
1. Create homepage layout with hero section ("Educate your kids as you travel")
2. Tagline section ("Expand your horizons")
3. Featured blog posts section (pull post data - decide: hardcoded JSON vs. separate files)
4. Call-to-action sections
5. Integrate header and footer components
6. **Depends on:** Phase 1 header/footer

### Phase 3: About Page
1. Create "What is Education World Travel?" page
2. Match Wix content and layout
3. **Depends on:** Phase 1 header/footer

### Phase 4: Blog
1. Create blog listing page with post previews
2. Create individual blog post template page
3. Decide on blog data structure (static JSON file, markdown files with JS parser, hardcoded HTML)
4. Populate with existing blog posts (Legendary London, Outstanding Oxford, etc.)
5. **Depends on:** Phase 1 header/footer

### Phase 5: Store Page
1. Create store page layout
2. Integrate Stripe buy links for products
3. Display product cards with images and pricing
4. **Depends on:** Phase 1 header/footer

## Current Workspace Structure
```
eduworldtravel/
├── index.html (homepage)
├── response.txt (current file)
├── resources/
│   ├── export/
│   └── homepage/
└── [To be created:] css/, js/, pages/, assets/, blog/
```

## Technology Stack
- **HTML5** - semantic markup
- **CSS3** - vanilla, no build tools (consider organizing by component)
- **JavaScript (Vanilla ES6+)** - navigation interactivity, dynamic content loading
- **No build tools** - deploy directly to GitHub Pages
- **Stripe** - for store buy links (embedded or redirects)

## Decisions & Scope

**Included:**
- Header, Footer, Homepage, About, Blog (listing + detail), Store
- Light theme, minimalistic design matching Wix
- Responsive design
- Static blog posts (no database)
- Stripe buy links for products

**Excluded (for now):**
- User authentication/login
- User profiles
- Dynamic blog creation/admin panel
- Newsletter signup (mention in planning if user wants)
- Search functionality
- Comments on blog posts

**Deployment:** GitHub Pages (requires GitHub repo setup)

## Critical Files to Create/Modify
- `index.html` — homepage
- `css/main.css` — global styles and variables (light theme)
- `css/components.css` — header, footer, nav styles
- `js/main.js` — global JS and navigation
- `pages/about.html` — about page
- `pages/blog.html` — blog listing
- `pages/blog-post.html` — blog post detail template
- `pages/store.html` — store/products page
- `data/blog-posts.json` — blog post data (or similar structure)
- `.github/workflows/deploy.yml` — GitHub Pages deployment (if needed)

## Color Palette (Confirmed)
- **Primary Background:** Light (off-white/white)
- **Text:** Black
- **Accent Colors:** 
  - #2573DA (primary blue)
  - #194D91 (darker blue)
  - #10B058 (green)

## Content Note: CMS Future Consideration
User wants a CMS system for writers to quickly edit/write content. **Phase 1 will use a simple JSON-based structure**, but the data format should support future CMS migration. Document the schema clearly for later CMS integration.

## Next Steps Before Implementation
1. ✅ Color palette confirmed (#2573DA, #194D91, #10B058)
2. Gather actual blog post content and images from Wix
3. Gather store product data and images
4. Confirm Stripe integration approach (buy links vs. checkout)
5. GitHub repo setup (can do later)
