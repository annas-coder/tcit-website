const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { downloadAsset, extractExternalUrls, urlToLocalPath, replaceExternalUrls } = require('./download-asset');

const HTML_DIR = path.join(__dirname, '../tcit-website');
const DATA_DIR = path.join(__dirname, '../data');
const PAGES_DIR = path.join(DATA_DIR, 'pages');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}

// Remove Elementor lazy loading CSS rules that block background images
function removeLazyLoadingRules(cssContent) {
  if (!cssContent) return cssContent;

  let cleaned = cssContent;

  // Remove multi-line rules with lazy loading selectors and background-image: none
  // This pattern matches rules like:
  // .e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload),
  // .e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload) * {
  //     background-image: none !important;
  // }
  cleaned = cleaned.replace(
    /\.e-con\.e-parent:nth-of-type\(n\+[0-9]+\):not\(\.e-lazyloaded\)(?::not\(\.e-no-lazyload\))?(?:\s*,\s*\.e-con\.e-parent:nth-of-type\(n\+[0-9]+\):not\(\.e-lazyloaded\)(?::not\(\.e-no-lazyload\))?\s*\*)?\s*\{[^}]*background-image:\s*none\s*!important[^}]*\}/g,
    ''
  );

  // Remove media query blocks containing lazy loading rules
  // Match @media ... { ... lazy loading rules ... }
  cleaned = cleaned.replace(
    /@media[^{]*\{[^{}]*(?:\.e-con\.e-parent:nth-of-type\(n\+[0-9]+\):not\(\.e-lazyloaded\)[^{}]*background-image:\s*none\s*!important[^{}]*)+[^}]*\}/gs,
    ''
  );

  // Remove any remaining rules with lazy loading selectors
  cleaned = cleaned.replace(
    /[^{}]*\.e-con\.e-parent[^{}]*:not\(\.e-lazyloaded\)[^{}]*\{[^}]*background-image:\s*none\s*!important[^}]*\}/g,
    ''
  );

  // Clean up empty media queries, empty braces, and excessive whitespace
  cleaned = cleaned.replace(/@media[^{]*\{\s*\}/g, '');
  cleaned = cleaned.replace(/\{\s*\}/g, '');
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim lines

  return cleaned;
}

// Process external URLs in inline styles - download assets and replace URLs
async function processExternalUrlsInStyles(styles) {
  const baseUrl = 'https://technocit.com';
  const downloadedUrls = new Set(); // Track downloaded URLs to avoid duplicates

  // Process each inline style
  for (const style of styles.inline) {
    if (!style.content) continue;

    // Remove lazy loading CSS rules first
    style.content = removeLazyLoadingRules(style.content);

    // Extract external URLs from this style
    const externalUrls = extractExternalUrls(style.content, baseUrl);

    // Download each asset
    for (const url of externalUrls) {
      if (downloadedUrls.has(url)) continue; // Skip if already downloaded

      try {
        const { localPath } = urlToLocalPath(url, baseUrl);
        await downloadAsset(url, localPath);
        downloadedUrls.add(url);
      } catch (error) {
        console.warn(`  ⚠ Failed to download asset ${url}: ${error.message}`);
      }
    }

    // Replace external URLs with local paths in style content
    style.content = replaceExternalUrls(style.content, baseUrl);
  }

  return styles;
}

// Extract styles from HTML
async function extractStyles($) {
  const styles = {
    inline: [],
    external: [],
  };

  // Extract inline styles from head
  $('head style').each((i, el) => {
    const styleContent = $(el).html();
    const styleId = $(el).attr('id') || '';
    if (styleContent) {
      styles.inline.push({
        id: styleId,
        content: styleContent,
      });
    }
  });

  // Extract inline styles from body (Elementor page-specific styles)
  $('body style').each((i, el) => {
    const styleContent = $(el).html();
    if (styleContent) {
      styles.inline.push({
        id: 'body-style-' + i,
        content: styleContent,
      });
    }
  });

  // Extract external CSS files
  $('head link[rel="stylesheet"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href && !href.startsWith('http') && !href.startsWith('//')) {
      // Normalize CSS path - handle relative paths and preserve full directory structure
      let normalizedHref = href
        // Remove leading ./ or ../
        .replace(/^(\.\/|\.\.\/)+/, '/')
        // Normalize wp-content/uploads/elementor/css/ to static/css/elementor/
        .replace(/\/wp-content\/uploads\/elementor\/css\//, '/static/css/elementor/')
        // Normalize wp-content/plugins/ to static/css/plugins/ (preserving full path after plugin name)
        .replace(/\/wp-content\/plugins\//, '/static/css/plugins/')
        // Normalize wp-content/themes/ to static/css/themes/ (preserving full path after theme name)
        .replace(/\/wp-content\/themes\//, '/static/css/themes/')
        // Remove query parameters
        .split('?')[0]
        // Ensure it starts with /
        .replace(/^([^/])/, '/$1');
      
      styles.external.push({
        href: normalizedHref,
        id: $(el).attr('id') || '',
      });
    }
  });

  // Process external URLs in inline styles
  await processExternalUrlsInStyles(styles);

  return styles;
}

// Extract metadata from HTML
function extractMetadata($) {
  const metadata = {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    og: {},
    twitter: {},
    schema: null,
  };

  // Open Graph tags
  $('meta[property^="og:"]').each((i, el) => {
    const property = $(el).attr('property').replace('og:', '');
    const content = $(el).attr('content');
    if (property && content) {
      metadata.og[property] = content;
    }
  });

  // Twitter Card tags
  $('meta[name^="twitter:"]').each((i, el) => {
    const name = $(el).attr('name').replace('twitter:', '');
    const content = $(el).attr('content');
    if (name && content) {
      metadata.twitter[name] = content;
    }
  });

  // Schema.org JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonText = $(el).html();
      if (jsonText) {
        const schema = JSON.parse(jsonText);
        if (!metadata.schema) {
          metadata.schema = schema;
        }
      }
    } catch (e) {
      console.warn('Failed to parse schema.org JSON-LD:', e.message);
    }
  });

  return metadata;
}

// Extract navigation structure
function extractNavigation($) {
  const navItems = [];
  $('.elementor-nav-menu a.elementor-item').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (text && href) {
      // Normalize href
      let normalizedHref = href.replace(/^\.\//, '/').replace(/^\.\.\//, '/');
      if (normalizedHref === './' || normalizedHref === '/') {
        normalizedHref = '/';
      }
      navItems.push({
        label: text,
        href: normalizedHref,
      });
    }
  });
  return navItems;
}

// Extract page content structure
function extractContent($) {
  const content = {
    html: '', // Full HTML content
    elementorId: null, // Elementor page/post ID
    sections: [],
    headings: [],
    paragraphs: [],
    images: [],
    links: [],
  };

  // Extract main content area (skip header/footer)
  // Check for both wp-page (regular pages) and wp-post (blog posts)
  // For blog posts, specifically look for data-elementor-post-type="post" to exclude header templates
  let mainContent = $('body').find('[data-elementor-type="wp-page"]').first();
  if (mainContent.length === 0) {
    mainContent = $('body').find('[data-elementor-type="wp-post"][data-elementor-post-type="post"]').first();
  }
  if (mainContent.length === 0) {
    mainContent = $('body').find('main, .page-content, #content').first();
  }
  
  if (mainContent.length === 0) {
    // Fallback: get everything between header and footer
    const header = $('body').find('[data-elementor-type="wp-post"]').first();
    const footer = $('body').find('footer, .site-footer').first();
    if (header.length && footer.length) {
      mainContent = header.nextUntil(footer);
    } else {
      mainContent = $('body').children().not('header, footer, script, style');
    }
  }

  // Extract full HTML content (preserve structure including wrapper)
  if (mainContent.length > 0) {
    let htmlContent = '';
    let elementorId = null;
    
    // Try to get the full elementor page wrapper with its classes
    // Check for both wp-page (regular pages) and wp-post (blog posts)
    // For blog posts, specifically look for data-elementor-post-type="post" to exclude header templates
    let elementorPage = $('body').find('[data-elementor-type="wp-page"]').first();
    if (elementorPage.length === 0) {
      elementorPage = $('body').find('[data-elementor-type="wp-post"][data-elementor-post-type="post"]').first();
    }
    if (elementorPage.length > 0) {
      // Clone the elementor page to avoid modifying the original
      const clonedPage = elementorPage.clone();
      
      // Remove header-like sections (containers with logo and/or navigation menu)
      // These are typically the first container(s) in the page content
      clonedPage.find('.elementor-element').each((i, el) => {
        const $el = $(el);
        // Check if this element contains header-like widgets
        const hasLogo = $el.find('.elementor-widget-theme-site-logo, .elementor-widget-image[data-id*="logo"]').length > 0;
        const hasNavMenu = $el.find('.elementor-widget-nav-menu, .elementor-nav-menu').length > 0;
        const hasHeaderButton = $el.find('.elementor-widget-button').length > 0 && 
                                ($el.text().includes('Lets Talk') || $el.text().includes('Contact'));
        
        // If this container has logo and/or nav menu, it's likely a header section
        if ((hasLogo && hasNavMenu) || (hasLogo && hasHeaderButton)) {
          // Check if this is a top-level container (direct child of page wrapper)
          const parent = $el.parent();
          if (parent.is('[data-elementor-type="wp-page"], [data-elementor-type="wp-post"]') || 
              parent.closest('[data-elementor-type="wp-page"], [data-elementor-type="wp-post"]').length > 0) {
            // Remove this header-like container
            $el.remove();
          }
        }
      });
      
      // Also remove any containers that are direct children and contain only header elements
      clonedPage.children('.elementor-element').each((i, el) => {
        const $el = $(el);
        const hasLogo = $el.find('.elementor-widget-theme-site-logo').length > 0;
        const hasNavMenu = $el.find('.elementor-widget-nav-menu').length > 0;
        if (hasLogo || hasNavMenu) {
          // Check if this container is primarily header content
          const hasPageContent = $el.find('h1, h2, h3, p').length > 2; // Has substantial content
          if (!hasPageContent && (hasLogo || hasNavMenu)) {
            $el.remove();
          }
        }
      });
      
      // Remove footer-like sections (containers with contact info, email, phone, address)
      clonedPage.find('.elementor-element').each((i, el) => {
        const $el = $(el);
        const textContent = $el.text().toLowerCase();
        
        // Check for footer indicators
        const hasContactUs = textContent.includes('contact us') || textContent.includes("let's build together");
        const hasEmail = /info@technocit\.com|[\w\.-]+@[\w\.-]+\.\w+/.test(textContent);
        const hasPhone = /\+971[\s\d]+|\+[\d\s-]+/.test(textContent);
        const hasAddress = /saheel tower|dubai|uae|p\.o\.box/i.test(textContent);
        const hasCopyright = /©\s*\d{4}|copyright/i.test(textContent);
        const hasSocialLinks = $el.find('a[href*="linkedin"], a[href*="youtube"], a[href*="facebook"]').length > 0;
        
        // If this container has multiple footer indicators, it's likely a footer section
        const footerIndicators = [hasContactUs, hasEmail, hasPhone, hasAddress, hasCopyright, hasSocialLinks].filter(Boolean).length;
        
        if (footerIndicators >= 2) {
          // Check if this is primarily footer content (not page content)
          const hasPageContent = $el.find('h1, h2, h3, p').length > 3; // Has substantial content
          if (!hasPageContent) {
            // Remove this footer-like container
            $el.remove();
          }
        }
      });
      
      // Also check direct children for footer sections
      clonedPage.children('.elementor-element').each((i, el) => {
        const $el = $(el);
        const textContent = $el.text().toLowerCase();
        const hasFooterContent = /contact us|info@technocit|saheel tower|©\s*\d{4}/i.test(textContent);
        const hasPageContent = $el.find('h1, h2, h3, p').length > 3;
        
        if (hasFooterContent && !hasPageContent) {
          $el.remove();
        }
      });
      
      // Reconstruct with proper attributes
      const wrapper = elementorPage[0];
      const tagName = wrapper.tagName.toLowerCase();
      const attrs = [];
      
      // Get all attributes and properly escape values
      if (wrapper.attribs) {
        for (const [key, value] of Object.entries(wrapper.attribs)) {
          // Escape quotes in attribute values
          const escapedValue = String(value).replace(/"/g, '&quot;');
          attrs.push(`${key}="${escapedValue}"`);
        }
      }
      
      const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      const innerHTML = clonedPage.html() || '';
      
      // Reconstruct the full wrapper element with all attributes
      htmlContent = `<${tagName}${attrString}>${innerHTML}</${tagName}>`;
      
      // Extract elementor ID for reference
      elementorId = elementorPage.attr('data-elementor-id') || null;
    } else {
      // Fallback: get inner HTML if no elementor wrapper found
      htmlContent = mainContent.html() || '';
    }
    
    // Normalize paths in HTML
    htmlContent = htmlContent
      .replace(/src="\.\/wp-content\/uploads\//g, 'src="/static/images/')
      .replace(/src="\.\.\/wp-content\/uploads\//g, 'src="/static/images/')
      .replace(/src="\/wp-content\/uploads\//g, 'src="/static/images/')
      .replace(/src="wp-content\/uploads\//g, 'src="/static/images/')
      .replace(/href="\.\//g, 'href="/')
      .replace(/href="\.\.\//g, 'href="/')
      .replace(/url\(['"]?\.\/wp-content\/uploads\//g, 'url(/static/images/')
      .replace(/url\(['"]?\.\.\/wp-content\/uploads\//g, 'url(/static/images/')
      .replace(/url\(['"]?\/wp-content\/uploads\//g, 'url(/static/images/')
      // Remove elementor-invisible class from HTML
      .replace(/\s*elementor-invisible\s*/g, ' ')
      .replace(/\s{2,}/g, ' '); // Clean up extra spaces
    
    content.html = htmlContent;
    content.elementorId = elementorId; // Store elementor ID for reference
  }

  // Extract headings for SEO/metadata purposes
  mainContent.find('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().trim();
    if (text) {
      content.headings.push({
        level: parseInt(tag.charAt(1)),
        tag,
        text,
        id: $(el).attr('id') || null,
      });
    }
  });

  // Extract paragraphs for metadata
  mainContent.find('p').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20) {
      content.paragraphs.push(text);
    }
  });

  // Extract images for metadata
  mainContent.find('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const width = $(el).attr('width') || null;
    const height = $(el).attr('height') || null;
    
    if (src && !src.startsWith('data:')) {
      let normalizedSrc = src.replace(/^\.\//, '/').replace(/^\.\.\//, '/');
      if (normalizedSrc.startsWith('/wp-content/')) {
        normalizedSrc = normalizedSrc.replace('/wp-content/uploads/', '/static/images/');
      }
      
      content.images.push({
        src: normalizedSrc,
        alt,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
      });
    }
  });

  // Extract links for metadata
  mainContent.find('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      let normalizedHref = href.replace(/^\.\//, '/').replace(/^\.\.\//, '/');
      content.links.push({
        href: normalizedHref,
        text: text || href,
      });
    }
  });

  return content;
}

// Process a single HTML file
async function processHtmlFile(filePath, relativePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Determine slug and path
    let slug = '';
    let pagePath = '/';
    
    if (relativePath === 'index.html' || relativePath.endsWith('/index.html')) {
      slug = 'index';
      pagePath = '/';
    } else {
      const dirName = path.dirname(relativePath);
      slug = dirName === '.' ? 'index' : dirName.replace(/\/$/, '');
      pagePath = slug === 'index' ? '/' : `/${slug}`;
    }

    // Extract data
    const metadata = extractMetadata($);
    const navigation = extractNavigation($);
    const content = extractContent($);
    const styles = await extractStyles($);

    const pageData = {
      slug,
      path: pagePath,
      metadata,
      navigation,
      content,
      styles,
      extractedAt: new Date().toISOString(),
    };

    // Save to JSON file
    const outputFile = path.join(PAGES_DIR, `${slug === 'index' ? 'home' : slug}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(pageData, null, 2), 'utf-8');
    
    console.log(`✓ Extracted: ${slug} -> ${outputFile}`);
    
    return { slug, path: pagePath, ...pageData };
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return null;
  }
}

// Find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      const relativePath = path.relative(HTML_DIR, filePath);
      fileList.push({ filePath, relativePath });
    }
  });
  
  return fileList;
}

// Main execution
async function main() {
  console.log('Starting data extraction...\n');
  
  const htmlFiles = findHtmlFiles(HTML_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  const routes = [];
  const allNavItems = new Set();
  
  // Process files sequentially to avoid overwhelming with downloads
  for (const { filePath, relativePath } of htmlFiles) {
    const pageData = await processHtmlFile(filePath, relativePath);
    if (pageData) {
      routes.push({
        slug: pageData.slug,
        path: pageData.path,
      });
      
      // Collect navigation items
      if (pageData.navigation) {
        pageData.navigation.forEach(item => {
          allNavItems.add(JSON.stringify(item));
        });
      }
    }
  }

  // Create routes.json
  const routesData = {
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    total: routes.length,
  };
  fs.writeFileSync(
    path.join(DATA_DIR, 'routes.json'),
    JSON.stringify(routesData, null, 2),
    'utf-8'
  );
  console.log(`\n✓ Created routes.json with ${routes.length} routes`);

  // Create navigation.json (use the most complete navigation from home page)
  const homePageData = JSON.parse(
    fs.readFileSync(path.join(PAGES_DIR, 'home.json'), 'utf-8')
  );
  const navigationData = {
    items: homePageData.navigation || [],
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(DATA_DIR, 'navigation.json'),
    JSON.stringify(navigationData, null, 2),
    'utf-8'
  );
  console.log(`✓ Created navigation.json with ${navigationData.items.length} items`);

  console.log('\n✅ Data extraction complete!');
}

main().catch(error => {
  console.error('Error in main:', error);
  process.exit(1);
});


