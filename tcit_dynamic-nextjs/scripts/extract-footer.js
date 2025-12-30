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

// Extract footer from HTML file
function extractFooter(htmlFilePath) {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const $ = cheerio.load(htmlContent);

  // Find footer element with data-elementor-id="3084"
  const footerElement = $('[data-elementor-type="wp-post"][data-elementor-id="3084"]').first();
  
  if (footerElement.length === 0) {
    console.warn(`  ⚠ Footer element not found in ${htmlFilePath}`);
    return null;
  }

  // Extract inline styles that contain .elementor-3084
  let inlineStyles = '';
  $('style').each((i, el) => {
    const styleContent = $(el).html() || '';
    if (styleContent.includes('.elementor-3084')) {
      inlineStyles = styleContent;
    }
  });

  // Extract CSS file references from head
  const cssFiles = [];
  $('head link[rel="stylesheet"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    // Look for post-3.css and post-3084.css
    if (href.includes('post-3.css') || href.includes('post-3084.css')) {
      // Normalize path
      let normalizedPath = href
        .replace(/^\.\//, '/')
        .replace(/^\.\.\//, '/')
        .replace(/wp-content\/uploads\/elementor\/css\//, 'static/css/elementor/')
        .split('?')[0]; // Remove query params
      
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      
      cssFiles.push(normalizedPath);
    }
  });

  // Get outer HTML of footer element
  let footerHtml = $.html(footerElement);
  
  // Remove elementor-invisible class from footer HTML
  footerHtml = footerHtml.replace(/elementor-invisible/g, '');

  // Normalize paths in footer HTML
  footerHtml = normalizePaths(footerHtml);

  return {
    html: footerHtml,
    inlineStyles: inlineStyles,
    cssFiles: [...new Set(cssFiles)], // Remove duplicates
  };
}

// Main function
function main() {
  console.log('Starting footer extraction...\n');

  // Try to find footer in index.html first (most reliable)
  const indexHtmlPath = path.join(HTML_DIR, 'index.html');
  let footerData = null;

  if (fs.existsSync(indexHtmlPath)) {
    console.log(`Reading: ${indexHtmlPath}`);
    footerData = extractFooter(indexHtmlPath);
  }

  // If not found, try other HTML files
  if (!footerData || !footerData.html) {
    const htmlFiles = fs.readdirSync(HTML_DIR, { recursive: true })
      .filter(file => file.endsWith('index.html'))
      .map(file => path.join(HTML_DIR, file));

    for (const htmlFile of htmlFiles) {
      console.log(`Trying: ${htmlFile}`);
      footerData = extractFooter(htmlFile);
      if (footerData && footerData.html) {
        break;
      }
    }
  }

  if (!footerData || !footerData.html) {
    console.error('❌ Footer not found in any HTML file!');
    process.exit(1);
  }

  // Save footer data
  const outputPath = path.join(DATA_DIR, 'footer.json');
  fs.writeFileSync(outputPath, JSON.stringify(footerData, null, 2), 'utf-8');

  console.log(`\n✓ Extracted footer HTML (${footerData.html.length} characters)`);
  console.log(`✓ Extracted inline styles (${footerData.inlineStyles.length} characters)`);
  console.log(`✓ Found ${footerData.cssFiles.length} CSS file(s): ${footerData.cssFiles.join(', ')}`);
  console.log(`\n✓ Saved to: ${outputPath}`);
  console.log('\n✅ Footer extraction complete!');
}

main();


