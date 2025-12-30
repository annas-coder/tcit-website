const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/pages');

// Update image paths in JSON files
function updateImagePaths() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('Data directory does not exist. Run extract-data.js first.');
    return;
  }

  const files = fs.readdirSync(DATA_DIR);
  let updatedCount = 0;

  files.forEach(file => {
    if (!file.endsWith('.json')) return;

    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    let hasChanges = false;

    // Update image paths in content.images
    if (data.content && data.content.images) {
      data.content.images.forEach(image => {
        if (image.src) {
          // Replace wp-content/uploads paths with /static/images
          const oldSrc = image.src;
          image.src = image.src
            .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
            .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
            .replace(/^\/wp-content\/uploads\//, '/static/images/')
            .replace(/^wp-content\/uploads\//, '/static/images/');
          
          if (oldSrc !== image.src) {
            hasChanges = true;
          }
        }
      });
    }

    // Update image paths in sections HTML content
    if (data.content && data.content.sections) {
      data.content.sections.forEach(section => {
        if (section.content) {
          const oldContent = section.content;
          section.content = section.content
            .replace(/src="\.\/wp-content\/uploads\//g, 'src="/static/images/')
            .replace(/src="\.\.\/wp-content\/uploads\//g, 'src="/static/images/')
            .replace(/src="\/wp-content\/uploads\//g, 'src="/static/images/')
            .replace(/src="wp-content\/uploads\//g, 'src="/static/images/');
          
          if (oldContent !== section.content) {
            hasChanges = true;
          }
        }
      });
    }

    // Update og:image and twitter:image in metadata
    if (data.metadata) {
      if (data.metadata.og && data.metadata.og.image) {
        const oldOgImage = data.metadata.og.image;
        data.metadata.og.image = data.metadata.og.image
          .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\/wp-content\/uploads\//, '/static/images/');
        
        if (oldOgImage !== data.metadata.og.image) {
          hasChanges = true;
        }
      }

      if (data.metadata.og && data.metadata.og['image:secure_url']) {
        const oldSecureUrl = data.metadata.og['image:secure_url'];
        data.metadata.og['image:secure_url'] = data.metadata.og['image:secure_url']
          .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\/wp-content\/uploads\//, '/static/images/');
        
        if (oldSecureUrl !== data.metadata.og['image:secure_url']) {
          hasChanges = true;
        }
      }

      if (data.metadata.twitter && data.metadata.twitter.image) {
        const oldTwitterImage = data.metadata.twitter.image;
        data.metadata.twitter.image = data.metadata.twitter.image
          .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\/wp-content\/uploads\//, '/static/images/');
        
        if (oldTwitterImage !== data.metadata.twitter.image) {
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✓ Updated: ${file}`);
      updatedCount++;
    }
  });

  console.log(`\n✅ Updated ${updatedCount} files`);
}

// Main execution
function main() {
  console.log('Updating image paths in JSON data files...\n');
  updateImagePaths();
  console.log('\n✅ Image path update complete!');
}

main();




