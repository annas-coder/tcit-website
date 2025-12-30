const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Download an asset from a URL and save it to a local path
 * @param {string} url - The URL to download from
 * @param {string} localPath - The local file path to save to
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
function downloadAsset(url, localPath) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Create directory if it doesn't exist
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Skip if file already exists
      if (fs.existsSync(localPath)) {
        console.log(`  ✓ Asset already exists: ${path.relative(process.cwd(), localPath)}`);
        resolve(true);
        return;
      }

      const file = fs.createWriteStream(localPath);
      
      protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(localPath); // Delete the file
          return downloadAsset(response.headers.location, localPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(localPath); // Delete the file
          reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`  ✓ Downloaded: ${path.relative(process.cwd(), localPath)}`);
          resolve(true);
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Extract external asset URLs from CSS content
 * @param {string} cssContent - The CSS content to scan
 * @param {string} baseUrl - Base URL to filter (e.g., 'https://technocit.com')
 * @returns {Array<string>} - Array of unique asset URLs
 */
function extractExternalUrls(cssContent, baseUrl = 'https://technocit.com') {
  const urls = new Set();
  // Match url(https://technocit.com/...) patterns
  const urlPattern = /url\(['"]?(https?:\/\/[^'")]+)['"]?\)/gi;
  let match;

  while ((match = urlPattern.exec(cssContent)) !== null) {
    const url = match[1];
    // Filter by base URL if provided
    if (!baseUrl || url.startsWith(baseUrl)) {
      // Remove query parameters and fragments
      const cleanUrl = url.split('?')[0].split('#')[0];
      urls.add(cleanUrl);
    }
  }

  return Array.from(urls);
}

/**
 * Convert external URL to local path
 * @param {string} url - External URL
 * @param {string} baseUrl - Base URL (e.g., 'https://technocit.com')
 * @param {string} publicDir - Public directory path (e.g., 'public')
 * @returns {Object} - { localPath: string, publicPath: string }
 */
function urlToLocalPath(url, baseUrl = 'https://technocit.com', publicDir = 'public') {
  try {
    const parsedUrl = new URL(url);
    let pathname = parsedUrl.pathname;

    // Remove base URL path if present
    if (pathname.startsWith('/wp-content/uploads/')) {
      // Map wp-content/uploads/ to static/images/
      pathname = pathname.replace('/wp-content/uploads/', '/static/images/');
    } else if (pathname.startsWith('/')) {
      // For other paths, keep them but map to static/images/
      pathname = '/static/images' + pathname;
    }

    // File system path
    const localPath = path.join(process.cwd(), publicDir, pathname);
    
    // Public URL path (for use in CSS)
    const publicPath = pathname;

    return { localPath, publicPath };
  } catch (error) {
    throw new Error(`Invalid URL: ${url} - ${error.message}`);
  }
}

/**
 * Replace external URLs in CSS content with local paths
 * @param {string} cssContent - The CSS content
 * @param {string} baseUrl - Base URL to replace (e.g., 'https://technocit.com')
 * @returns {string} - CSS content with replaced URLs
 */
function replaceExternalUrls(cssContent, baseUrl = 'https://technocit.com') {
  // Replace url(https://technocit.com/wp-content/uploads/...) with url(/static/images/...)
  return cssContent.replace(
    /url\(['"]?(https?:\/\/technocit\.com\/wp-content\/uploads\/([^'")]+))['"]?\)/gi,
    (match, fullUrl, relativePath) => {
      const publicPath = `/static/images/${relativePath}`;
      // Preserve quotes if they were present
      const hasQuotes = match.includes("'") || match.includes('"');
      if (hasQuotes) {
        const quote = match.includes("'") ? "'" : '"';
        return `url(${quote}${publicPath}${quote})`;
      }
      return `url(${publicPath})`;
    }
  );
}

module.exports = {
  downloadAsset,
  extractExternalUrls,
  urlToLocalPath,
  replaceExternalUrls,
};


