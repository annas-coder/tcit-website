# TCIT Next.js Website

A Next.js application converted from static HTML files with Server-Side Rendering (SSR), dynamic routing, and JSON-based data storage.

## Features

- ✅ Server-Side Rendering (SSR) for all pages
- ✅ Dynamic routing based on page structure
- ✅ JSON data files for page content (fetched server-side only)
- ✅ React components converted from HTML structure
- ✅ SEO metadata support (Open Graph, Twitter Cards, Schema.org)
- ✅ No data exposure in network tab (all data loaded server-side)

## Project Structure

```
tcit_nextjs/
├── data/                    # JSON data files (not exposed to client)
│   ├── pages/              # Page data files
│   ├── navigation.json     # Navigation structure
│   └── routes.json         # Route mapping
├── components/             # React components
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── SEO.tsx
│   └── ContentRenderer.tsx
├── lib/                    # Utility functions
│   └── data-loader.ts     # Server-side data loader
├── pages/                 # Next.js pages
│   ├── index.tsx          # Home page
│   ├── [...slug].tsx      # Dynamic route handler
│   ├── 404.tsx            # 404 page
│   └── _app.tsx           # App wrapper
├── public/                 # Static assets
│   └── static/
│       └── images/        # Images from tcit-website
├── scripts/                # Build scripts
│   ├── extract-data.js    # Extract data from HTML
│   ├── migrate-assets.js  # Copy assets to public
│   └── update-image-paths.js # Update image paths in JSON
└── styles/                 # Global styles
    └── globals.css
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Extract Data from HTML Files

This script parses all HTML files in `tcit-website/` and generates JSON data files:

```bash
npm run extract-data
```

This will:
- Parse all HTML files
- Extract metadata, content, navigation, and images
- **Preserve full HTML structure** (Elementor containers, widgets, inline styles)
- Generate JSON files in `data/pages/`
- Create `data/navigation.json` and `data/routes.json`

**Important:** The extraction now preserves the complete HTML structure from the original site, including all Elementor classes and inline styles.

### 3. Migrate Assets

Copy images and static assets from `tcit-website/` to `public/static/`:

```bash
npm run migrate-assets
npm run copy-css
```

### 4. Update Image Paths

Update all image references in JSON data to use the new paths:

```bash
npm run update-paths
```

### 5. Run All Setup Steps

Or run all setup steps at once:

```bash
npm run setup
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

### Data Flow

1. **Data Extraction**: HTML files are parsed and converted to JSON
2. **Server-Side Loading**: `getServerSideProps` reads JSON files using `fs.readFileSync`
3. **Component Rendering**: React components render the data
4. **Client Delivery**: Only the rendered HTML is sent to the client

### Security

- JSON files are stored in `data/` directory (not in `public/`)
- Data is loaded only server-side via `fs.readFileSync`
- No API routes exposing JSON data
- No client-side data fetching (no network tab exposure)

### Dynamic Routing

- `/` → Home page (from `pages/index.tsx`)
- `/[slug]` → Dynamic pages (from `pages/[...slug].tsx`)
- Routes are mapped from `data/routes.json`

## Available Routes

After running `npm run extract-data`, check `data/routes.json` for all available routes.

Common routes:
- `/` - Home
- `/about-us-2` - About Us
- `/services` - Services
- `/our-works` - Our Works
- `/contact` - Contact
- `/blog` - Blog
- `/cbd-case-study` - Case Studies
- And more...

## Build for Production

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run extract-data` - Extract data from HTML files
- `npm run migrate-assets` - Copy assets to public directory
- `npm run update-paths` - Update image paths in JSON data
- `npm run setup` - Run all setup steps

## Technologies Used

- Next.js 14 (Pages Router)
- React 18
- TypeScript
- Cheerio (for HTML parsing)
- Server-Side Rendering (SSR)

## Notes

- All data is loaded server-side only
- No data is exposed in the browser's network tab
- Images are optimized using Next.js Image component
- SEO metadata is properly rendered in the HTML head


