const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const HTML_FILE = path.join(__dirname, '../tcit-website/index.html');
const JSON_FILE = path.join(__dirname, '../data/pages/home.json');

console.log('=== VERIFYING DOM STRUCTURE ===\n');

// Read static HTML
const html = fs.readFileSync(HTML_FILE, 'utf8');
const $ = cheerio.load(html);

// Read extracted JSON
const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
const extractedHtml = data.content.html || '';

console.log('1. BODY STRUCTURE');
console.log('------------------');
const body = $('body');
console.log('Body classes:', body.attr('class'));
const pageDiv = body.find('#page');
console.log('Page div ID:', pageDiv.attr('id'));
console.log('Page div classes:', pageDiv.attr('class'));
console.log('');

console.log('2. HEADER SECTION (elementor-3080)');
console.log('-----------------------------------');
const header = $('[data-elementor-type="wp-post"][data-elementor-id="3080"]');
console.log('Header found in static:', header.length > 0);
if (header.length > 0) {
  console.log('Header classes:', header.attr('class'));
  console.log('Header data-id:', header.attr('data-elementor-id'));
}
console.log('Header in extracted HTML:', extractedHtml.includes('elementor-3080'));
console.log('');

console.log('3. PAGE CONTENT SECTION (elementor-21317)');
console.log('-------------------------------------------');
const pageContent = $('[data-elementor-type="wp-page"][data-elementor-id="21317"]');
console.log('Page content found in static:', pageContent.length > 0);
if (pageContent.length > 0) {
  console.log('Page content classes:', pageContent.attr('class'));
  console.log('Page content data-id:', pageContent.attr('data-elementor-id'));
  const firstChild = pageContent.children().first();
  console.log('First child classes:', firstChild.attr('class'));
}
console.log('Page content in extracted HTML:', extractedHtml.includes('elementor-21317'));
const extractedWrapperMatch = extractedHtml.match(/<div[^>]*data-elementor-type="wp-page"[^>]*class="([^"]+)"/);
if (extractedWrapperMatch) {
  console.log('Extracted wrapper classes:', extractedWrapperMatch[1]);
}
console.log('');

console.log('4. BUTTON ELEMENT HIERARCHY (elementor-element-e2c091d)');
console.log('--------------------------------------------------------');
const button = $('.elementor-element-e2c091d');
console.log('Button found in static:', button.length > 0);
if (button.length > 0) {
  console.log('Button classes:', button.attr('class'));
  
  // Check if button is inside elementor-21317 wrapper
  const wrapper21317 = $('.elementor-21317');
  const buttonInWrapper = wrapper21317.find('.elementor-element-e2c091d');
  console.log('Button inside elementor-21317 wrapper:', buttonInWrapper.length > 0);
  
  // Trace parent chain
  const parents = [];
  let current = button.parent();
  let depth = 0;
  while (current.length > 0 && depth < 15) {
    const classes = current.attr('class') || '';
    const tag = current[0] ? current[0].tagName : 'unknown';
    if (classes.includes('elementor') || classes.includes('e-con')) {
      parents.push({ depth, tag, classes: classes.substring(0, 150) });
    }
    current = current.parent();
    depth++;
  }
  console.log('Parent chain (top to bottom):');
  parents.reverse().forEach(p => {
    console.log(`  ${p.depth}: <${p.tag}> class="${p.classes}"`);
  });
  
  // Check button link
  const buttonLink = button.find('.elementor-button');
  console.log('Button link (.elementor-button) found:', buttonLink.length > 0);
  if (buttonLink.length > 0) {
    console.log('Button link classes:', buttonLink.attr('class'));
  }
}

// Check in extracted HTML
const $extracted = cheerio.load(extractedHtml);
const extractedButton = $extracted('.elementor-element-e2c091d');
const extractedWrapper = $extracted('.elementor-21317');
const extractedButtonInWrapper = extractedWrapper.find('.elementor-element-e2c091d');
console.log('Button in extracted HTML:', extractedButton.length > 0);
console.log('Wrapper in extracted HTML:', extractedWrapper.length > 0);
console.log('Button inside wrapper in extracted:', extractedButtonInWrapper.length > 0);
console.log('');

console.log('5. STRUCTURE COMPARISON');
console.log('-----------------------');
const staticWrapper = pageContent.length > 0 ? pageContent[0] : null;
if (staticWrapper) {
  const staticClasses = $(staticWrapper).attr('class') || '';
  console.log('Static wrapper classes:', staticClasses);
  
  if (extractedWrapperMatch) {
    const extractedClasses = extractedWrapperMatch[1];
    console.log('Extracted wrapper classes:', extractedClasses);
    console.log('Classes match:', staticClasses === extractedClasses);
    
    // Check if all classes are present
    const staticClassList = staticClasses.split(' ').filter(c => c);
    const extractedClassList = extractedClasses.split(' ').filter(c => c);
    const missingClasses = staticClassList.filter(c => !extractedClassList.includes(c));
    const extraClasses = extractedClassList.filter(c => !staticClassList.includes(c));
    
    if (missingClasses.length > 0) {
      console.log('⚠ Missing classes in extracted:', missingClasses);
    }
    if (extraClasses.length > 0) {
      console.log('⚠ Extra classes in extracted:', extraClasses);
    }
    if (missingClasses.length === 0 && extraClasses.length === 0) {
      console.log('✓ All classes match perfectly');
    }
  }
}

console.log('\n=== VERIFICATION COMPLETE ===');

