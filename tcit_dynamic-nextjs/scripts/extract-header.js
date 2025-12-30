const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const HTML_DIR = path.join(__dirname, '../tcit-website');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Normalize paths in HTML content
function normalizePaths(html) {
  if (!html) return html;

  return html
    // Image src paths
    .replace(/src="\.\/wp-content\/uploads\//g, 'src="/static/images/')
    .replace(/src="\.\.\/wp-content\/uploads\//g, 'src="/static/images/')
    .replace(/srcset="\.\/wp-content\/uploads\//g, 'srcset="/static/images/')
    .replace(/srcset="\.\.\/wp-content\/uploads\//g, 'srcset="/static/images/')
    // Link href paths
    .replace(/href="\.\//g, 'href="/')
    .replace(/href="\.\.\//g, 'href="/');
}

// Extract header from HTML file
function extractHeader(htmlFilePath) {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const $ = cheerio.load(htmlContent);

  // Find header element with data-elementor-id="3080"
  const headerElement = $('[data-elementor-type="wp-post"][data-elementor-id="3080"]').first();
  
  if (headerElement.length === 0) {
    console.warn(`  ⚠ Header element not found in ${htmlFilePath}`);
    return null;
  }

  // Extract inline styles that contain .elementor-3080
  let inlineStyles = '';
  $('style').each((i, el) => {
    const styleContent = $(el).html() || '';
    if (styleContent.includes('.elementor-3080')) {
      inlineStyles = styleContent;
    }
  });

  // Extract CSS file references from head
  const cssFiles = [];
  $('head link[rel="stylesheet"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    // Look for post-3080.css, custom-pro-widget-nav-menu.min.css, and e-sticky.min.css
    if (
      href.includes('post-3080.css') ||
      href.includes('custom-pro-widget-nav-menu.min.css') ||
      href.includes('e-sticky.min.css')
    ) {
      // Normalize path
      let normalizedPath = href
        .replace(/^\.\//, '/')
        .replace(/^\.\.\//, '/')
        .replace(/wp-content\/uploads\/elementor\/css\//, 'static/css/elementor/')
        .replace(/wp-content\/plugins\/elementor-pro\/assets\/css\/modules\//, 'static/css/plugins/elementor-pro/assets/css/modules/')
        .replace(/wp-content\/plugins\//, 'static/css/plugins/')
        .split('?')[0]; // Remove query params
      
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      
      cssFiles.push(normalizedPath);
    }
  });

  // Get outer HTML of header element
  let headerHtml = $.html(headerElement);
  
  // Remove elementor-invisible class from header HTML
  headerHtml = headerHtml.replace(/elementor-invisible/g, '');

  // Normalize paths in header HTML
  headerHtml = normalizePaths(headerHtml);

  return {
    html: headerHtml,
    inlineStyles: inlineStyles,
    cssFiles: [...new Set(cssFiles)], // Remove duplicates
  };
}

// Main function
function main() {
  console.log('Starting header extraction...\n');

  // Try to find header in index.html first (most reliable)
  const indexHtmlPath = path.join(HTML_DIR, 'index.html');
  let headerData = null;

  if (fs.existsSync(indexHtmlPath)) {
    console.log(`Reading: ${indexHtmlPath}`);
    headerData = extractHeader(indexHtmlPath);
  }

  // If not found, try other HTML files
  if (!headerData || !headerData.html) {
    const htmlFiles = fs.readdirSync(HTML_DIR, { recursive: true })
      .filter(file => file.endsWith('index.html'))
      .map(file => path.join(HTML_DIR, file));

    for (const htmlFile of htmlFiles) {
      console.log(`Trying: ${htmlFile}`);
      headerData = extractHeader(htmlFile);
      if (headerData && headerData.html) {
        break;
      }
    }
  }

  if (!headerData || !headerData.html) {
    console.error('❌ Header not found in any HTML file!');
    process.exit(1);
  }

  // Save header data
  const outputPath = path.join(DATA_DIR, 'header.json');
  fs.writeFileSync(outputPath, JSON.stringify(headerData, null, 2), 'utf-8');

  console.log(`\n✓ Extracted header HTML (${headerData.html.length} characters)`);
  console.log(`✓ Extracted inline styles (${headerData.inlineStyles.length} characters)`);
  console.log(`✓ Found ${headerData.cssFiles.length} CSS file(s): ${headerData.cssFiles.join(', ')}`);
  console.log(`\n✓ Saved to: ${outputPath}`);
  console.log('\n✅ Header extraction complete!');
}

main();


