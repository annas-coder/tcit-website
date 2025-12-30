const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../tcit-website/wp-content/uploads');
const DEST_DIR = path.join(__dirname, '../public/static/images');
const SOURCE_LOGO_DIR = path.join(__dirname, '../tcit-website/wp-content/uploads/2024/05');
const SOURCE_FAVICON_DIR = path.join(__dirname, '../tcit-website/wp-content/uploads/2024/04');

// Ensure destination directory exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory does not exist: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      // Only copy image files and SVG
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied: ${file}`);
      }
    }
  });
}

// Copy specific logo and favicon files
function copySpecificFiles() {
  // Copy logo files
  if (fs.existsSync(SOURCE_LOGO_DIR)) {
    const logoFiles = fs.readdirSync(SOURCE_LOGO_DIR);
    logoFiles.forEach(file => {
      const srcPath = path.join(SOURCE_LOGO_DIR, file);
      const destPath = path.join(DEST_DIR, file);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied logo: ${file}`);
      }
    });
  }

  // Copy favicon
  if (fs.existsSync(SOURCE_FAVICON_DIR)) {
    const faviconPath = path.join(SOURCE_FAVICON_DIR, 'favicon.png');
    const destFaviconPath = path.join(DEST_DIR, 'favicon.png');
    if (fs.existsSync(faviconPath)) {
      fs.copyFileSync(faviconPath, destFaviconPath);
      console.log(`✓ Copied favicon`);
    }
  }
}

// Main execution
function main() {
  console.log('Starting asset migration...\n');
  
  // Copy all images from uploads directory
  if (fs.existsSync(SOURCE_DIR)) {
    console.log('Copying images from uploads directory...');
    copyDirectory(SOURCE_DIR, DEST_DIR);
  }
  
  // Copy specific logo and favicon files to root of images directory
  console.log('\nCopying logo and favicon files...');
  copySpecificFiles();
  
  console.log('\n✅ Asset migration complete!');
  console.log(`Images are now available at: /static/images/`);
}

main();




