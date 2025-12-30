const fs = require('fs');
const path = require('path');
const { downloadAsset, extractExternalUrls, urlToLocalPath, replaceExternalUrls } = require('./download-asset');

const SOURCE_CSS_DIR = path.join(__dirname, '../tcit-website/wp-content/uploads/elementor/css');
const DEST_CSS_DIR = path.join(__dirname, '../public/static/css');
const SOURCE_PLUGIN_CSS_DIR = path.join(__dirname, '../tcit-website/wp-content/plugins');
const SOURCE_THEME_CSS_DIR = path.join(__dirname, '../tcit-website/wp-content/themes');

// Ensure destination directory exists
if (!fs.existsSync(DEST_CSS_DIR)) {
  fs.mkdirSync(DEST_CSS_DIR, { recursive: true });
}

// Copy directory recursively, preserving structure
function copyDirectoryRecursive(src, dest, basePath = '') {
  if (!fs.existsSync(src)) {
    return 0;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let copiedCount = 0;
  const items = fs.readdirSync(src);

  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      // Recursively copy directories
      copiedCount += copyDirectoryRecursive(srcPath, destPath, path.join(basePath, item));
    } else if (item.endsWith('.css')) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied CSS: ${path.join(basePath, item)}`);
        copiedCount++;
      } catch (error) {
        console.error(`✗ Error copying ${item}:`, error.message);
      }
    }
  });

  return copiedCount;
}

// Copy all CSS files from a directory tree, preserving full structure
async function copyAllCssFiles(srcRoot, destRoot, relativePath = '') {
  if (!fs.existsSync(srcRoot)) {
    return 0;
  }

  let copiedCount = 0;
  
  try {
    const items = fs.readdirSync(srcRoot);

    // Use for...of to properly handle async operations
    for (const item of items) {
      const srcPath = path.join(srcRoot, item);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        // Recursively process directories
        const newRelativePath = relativePath ? path.join(relativePath, item) : item;
        copiedCount += await copyAllCssFiles(srcPath, destRoot, newRelativePath);
      } else if (item.endsWith('.css')) {
        // Copy CSS file preserving directory structure
        const destPath = relativePath 
          ? path.join(destRoot, relativePath, item)
          : path.join(destRoot, item);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        try {
          fs.copyFileSync(srcPath, destPath);
          const displayPath = relativePath ? path.join(relativePath, item) : item;
          console.log(`✓ Copied CSS: ${displayPath}`);
          copiedCount++;
          
          // Process external URLs in the copied CSS file
          await processExternalUrlsInCssFile(destPath);
        } catch (error) {
          console.error(`✗ Error copying ${item}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`✗ Error reading directory ${srcRoot}:`, error.message);
  }

  return copiedCount;
}

// Extract @import URLs from CSS content
function extractCssImports(cssContent) {
  const imports = [];
  // Match @import statements: @import url('path') or @import 'path'
  const importRegex = /@import\s+(?:url\()?['"]([^'"]+)['"]\)?/gi;
  let match;
  
  while ((match = importRegex.exec(cssContent)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Process external URLs in CSS file - download assets and replace URLs
async function processExternalUrlsInCssFile(cssFilePath) {
  try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    const baseUrl = 'https://technocit.com';
    
    // Extract external URLs from CSS
    const externalUrls = extractExternalUrls(cssContent, baseUrl);
    
    if (externalUrls.length === 0) {
      return 0;
    }
    
    let downloadedCount = 0;
    
    // Download each asset
    for (const url of externalUrls) {
      try {
        const { localPath } = urlToLocalPath(url, baseUrl);
        await downloadAsset(url, localPath);
        downloadedCount++;
      } catch (error) {
        console.warn(`  ⚠ Failed to download asset ${url}: ${error.message}`);
      }
    }
    
    // Replace external URLs with local paths in CSS content
    const updatedContent = replaceExternalUrls(cssContent, baseUrl);
    
    // Write updated CSS back to file
    fs.writeFileSync(cssFilePath, updatedContent, 'utf8');
    
    if (downloadedCount > 0) {
      const relativePath = path.relative(process.cwd(), cssFilePath);
      console.log(`  → Processed ${downloadedCount} external asset(s) in ${relativePath}`);
    }
    
    return downloadedCount;
  } catch (error) {
    console.error(`✗ Error processing external URLs in ${cssFilePath}:`, error.message);
    return 0;
  }
}

// Process CSS imports and create missing files
function processCssImports(cssFilePath, destRoot) {
  try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    const imports = extractCssImports(cssContent);
    
    if (imports.length === 0) {
      return 0;
    }
    
    const cssDir = path.dirname(cssFilePath);
    let createdCount = 0;
    
    imports.forEach(importPath => {
      // Resolve relative import path
      // Remove query parameters if any
      const cleanImportPath = importPath.split('?')[0];
      // Handle relative paths (../ and ./)
      const resolvedPath = path.resolve(cssDir, cleanImportPath);
      
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        // Create empty placeholder file
        const importDir = path.dirname(resolvedPath);
        if (!fs.existsSync(importDir)) {
          fs.mkdirSync(importDir, { recursive: true });
        }
        
        // Only create if it's a .css file
        if (resolvedPath.endsWith('.css')) {
          const placeholderContent = `/* Empty placeholder for missing CSS import: ${cleanImportPath} */\n`;
          fs.writeFileSync(resolvedPath, placeholderContent, 'utf8');
          
          // Calculate relative path from destRoot for logging
          const relativePath = path.relative(destRoot, resolvedPath);
          console.log(`  → Created missing import: ${relativePath}`);
          createdCount++;
        }
      }
    });
    
    return createdCount;
  } catch (error) {
    console.error(`✗ Error processing imports in ${cssFilePath}:`, error.message);
    return 0;
  }
}

// Process all CSS files in a directory for imports
function processAllCssImports(dir, destRoot) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  
  let totalCreated = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        totalCreated += processAllCssImports(itemPath, destRoot);
      } else if (item.endsWith('.css')) {
        totalCreated += processCssImports(itemPath, destRoot);
      }
    });
  } catch (error) {
    console.error(`✗ Error processing directory ${dir}:`, error.message);
  }
  
  return totalCreated;
}

// Copy CSS files
async function copyCssFiles() {
  let totalCopied = 0;

  // Copy Elementor CSS files from uploads/elementor/css to static/css/elementor
  if (fs.existsSync(SOURCE_CSS_DIR)) {
    console.log('Copying Elementor CSS files from uploads...');
    const elementorDest = path.join(DEST_CSS_DIR, 'elementor');
    if (!fs.existsSync(elementorDest)) {
      fs.mkdirSync(elementorDest, { recursive: true });
    }
    // Copy files directly (not recursively since it's already a CSS directory)
    const files = fs.readdirSync(SOURCE_CSS_DIR);
    for (const file of files) {
      const srcPath = path.join(SOURCE_CSS_DIR, file);
      const destPath = path.join(elementorDest, file);
      if (fs.statSync(srcPath).isFile() && file.endsWith('.css')) {
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`✓ Copied CSS: elementor/${file}`);
          totalCopied++;
          
          // Process external URLs in the copied CSS file
          await processExternalUrlsInCssFile(destPath);
        } catch (error) {
          console.error(`✗ Error copying ${file}:`, error.message);
        }
      }
    }
  }

  // Copy ALL CSS files from plugins directory, preserving full structure
  if (fs.existsSync(SOURCE_PLUGIN_CSS_DIR)) {
    console.log('\nCopying plugin CSS files (recursive)...');
    const pluginDirs = fs.readdirSync(SOURCE_PLUGIN_CSS_DIR);
    for (const pluginDir of pluginDirs) {
      const pluginPath = path.join(SOURCE_PLUGIN_CSS_DIR, pluginDir);
      if (fs.statSync(pluginPath).isDirectory()) {
        // Copy all CSS files from this plugin, preserving directory structure
        const pluginDestRoot = path.join(DEST_CSS_DIR, 'plugins', pluginDir);
        totalCopied += await copyAllCssFiles(pluginPath, pluginDestRoot, '');
      }
    }
  }

  // Copy theme CSS files
  if (fs.existsSync(SOURCE_THEME_CSS_DIR)) {
    console.log('\nCopying theme CSS files...');
    const themeDirs = fs.readdirSync(SOURCE_THEME_CSS_DIR);
    for (const themeDir of themeDirs) {
      const themePath = path.join(SOURCE_THEME_CSS_DIR, themeDir);
      if (fs.statSync(themePath).isDirectory()) {
        const destThemeDir = path.join(DEST_CSS_DIR, 'themes', themeDir);
        totalCopied += await copyAllCssFiles(themePath, destThemeDir, '');
      }
    }
  }

  console.log(`\n✅ Copied ${totalCopied} CSS files total`);
  
  // Process CSS imports and create missing files
  console.log('\nProcessing CSS imports...');
  const createdImports = processAllCssImports(DEST_CSS_DIR, DEST_CSS_DIR);
  if (createdImports > 0) {
    console.log(`✅ Created ${createdImports} missing CSS import files`);
  } else {
    console.log('✅ No missing CSS imports found');
  }
}

// Main execution
async function main() {
  console.log('Copying CSS files...\n');
  await copyCssFiles();
}

main().catch(error => {
  console.error('Error in main:', error);
  process.exit(1);
});

