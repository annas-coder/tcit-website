# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Cheerio (for HTML parsing)
- All required type definitions

### 2. Extract Data from HTML

Run the data extraction script to parse all HTML files and generate JSON data:

```bash
npm run extract-data
```

**What this does:**
- Scans all HTML files in `tcit-website/` directory
- Extracts metadata (SEO, Open Graph, Twitter Cards, Schema.org)
- Extracts page content (headings, paragraphs, images, links)
- Extracts navigation structure
- Generates JSON files in `data/pages/`
- Creates `data/navigation.json` and `data/routes.json`

**Expected output:**
```
Starting data extraction...

Found X HTML files

✓ Extracted: home -> data/pages/home.json
✓ Extracted: about-us-2 -> data/pages/about-us-2.json
✓ Extracted: services -> data/pages/services.json
...

✓ Created routes.json with X routes
✓ Created navigation.json with X items

✅ Data extraction complete!
```

### 3. Migrate Assets

Copy all images and static assets to the public directory:

```bash
npm run migrate-assets
npm run copy-css
```

**What this does:**
- Copies all images from `tcit-website/wp-content/uploads/` to `public/static/images/`
- Copies logo files to `public/static/images/`
- Copies favicon to `public/static/images/`
- Copies CSS files from Elementor to `public/static/css/` (for styling)

**Expected output:**
```
Starting asset migration...

Copying images from uploads directory...
✓ Copied: Logo.svg
✓ Copied: favicon.png
...

Copying logo and favicon files...
✓ Copied logo: Logo.svg
✓ Copied favicon

✅ Asset migration complete!
Images are now available at: /static/images/
```

### 4. Update Image Paths

Update all image references in JSON data files to use the new paths:

```bash
npm run update-paths
```

**What this does:**
- Updates image paths in `data/pages/*.json` files
- Replaces `wp-content/uploads/` with `/static/images/`
- Updates metadata image paths (og:image, twitter:image)

**Expected output:**
```
Updating image paths in JSON data files...

✓ Updated: home.json
✓ Updated: about-us-2.json
✓ Updated: services.json
...

✅ Updated X files

✅ Image path update complete!
```

### 5. Run All Setup Steps (Alternative)

Instead of running steps 2-4 individually, you can run them all at once:

```bash
npm run setup
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verify Setup

After setup, you should have:

1. ✅ `data/pages/` directory with JSON files for each page
2. ✅ `data/navigation.json` with navigation structure
3. ✅ `data/routes.json` with all available routes
4. ✅ `public/static/images/` with all images
5. ✅ No errors when running `npm run dev`

## Troubleshooting

### Issue: "Cannot find module 'next'"

**Solution:** Run `npm install` to install all dependencies.

### Issue: "Error loading page data"

**Solution:** Make sure you've run `npm run extract-data` first.

### Issue: Images not loading

**Solution:** 
1. Run `npm run migrate-assets` to copy images
2. Run `npm run update-paths` to update image paths in JSON

### Issue: TypeScript errors

**Solution:** 
1. Make sure `npm install` completed successfully
2. The `next-env.d.ts` file should be auto-generated
3. If errors persist, try deleting `.next` folder and running `npm run dev` again

## Next Steps

- Customize components in `components/` directory
- Modify styles in `styles/globals.css`
- Add new pages by adding HTML files to `tcit-website/` and re-running `npm run extract-data`

## Production Build

When ready to deploy:

```bash
npm run build
npm start
```

This will create an optimized production build with:
- Server-side rendering enabled
- All data loaded server-side (not exposed to client)
- Optimized images and assets
- SEO metadata properly rendered


