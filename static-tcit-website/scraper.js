
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const BASE_URL = 'https://technocit.com';
const ROOT_DIR = __dirname;
const downloadedAssets = new Set();

async function downloadFile(url, targetPath) {
    if (downloadedAssets.has(targetPath)) return;
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        const writer = fs.createWriteStream(targetPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                downloadedAssets.add(targetPath);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}`);
    }
}

async function getUrlsFromSitemap(sitemapUrl) {
    try {
        const response = await axios.get(sitemapUrl);
        const parser = new XMLParser();
        const jsonObj = parser.parse(response.data);
        const urls = jsonObj.urlset.url.map(u => u.loc);
        return Array.isArray(urls) ? urls : [urls];
    } catch (error) {
        console.error(`Failed to fetch sitemap ${sitemapUrl}: ${error.message}`);
        return [];
    }
}

async function processCss(cssUrl, cssContent) {
    const urlMatches = cssContent.matchAll(/url\(['"]?([^'"]+)['"]?\)/g);
    for (const match of urlMatches) {
        let assetUrl = match[1];
        if (assetUrl.startsWith('data:')) continue;

        if (assetUrl.startsWith('//')) {
            assetUrl = 'https:' + assetUrl;
        } else if (assetUrl.startsWith('/')) {
            assetUrl = BASE_URL + assetUrl;
        } else if (!assetUrl.startsWith('http')) {
            // Relative to CSS location
            const cssDir = path.posix.dirname(cssUrl.replace(BASE_URL, ''));
            assetUrl = BASE_URL + path.posix.normalize(cssDir + '/' + assetUrl);
        }

        if (assetUrl.startsWith(BASE_URL)) {
            const cleanUrl = assetUrl.split('?')[0].split('#')[0];
            const assetRelativePath = cleanUrl.replace(BASE_URL, '');
            const assetTargetPath = path.join(ROOT_DIR, assetRelativePath);
            if (!fs.existsSync(assetTargetPath)) {
                console.log(`Downloading CSS asset: ${cleanUrl}`);
                await downloadFile(cleanUrl, assetTargetPath);
            }
        }
    }
}

async function scrapePage(pageUrl) {
    try {
        console.log(`Scraping: ${pageUrl}`);
        const response = await axios.get(pageUrl);
        const $ = cheerio.load(response.data);

        let relativePath = pageUrl.replace(BASE_URL, '');
        if (relativePath === '' || relativePath === '/') {
            relativePath = 'index.html';
        } else {
            if (relativePath.endsWith('/')) {
                relativePath += 'index.html';
            } else if (!relativePath.includes('.')) {
                relativePath += '/index.html';
            }
        }

        const targetPath = path.join(ROOT_DIR, relativePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        const depth = relativePath.split('/').filter(p => p !== '').length;
        const relativePrefix = depth <= 1 ? './' : '../'.repeat(depth - 1);

        let htmlContent = response.data.replaceAll(BASE_URL + '/', relativePrefix);
        htmlContent = htmlContent.replaceAll(BASE_URL, relativePrefix);

        fs.writeFileSync(targetPath, htmlContent);

        const assets = new Set();
        function addAsset(attr) {
            if (!attr) return;
            let assetUrl = attr;
            if (assetUrl.startsWith('/')) {
                assetUrl = BASE_URL + assetUrl;
            } else if (!assetUrl.startsWith('http')) {
                if (assetUrl.startsWith('wp-content') || assetUrl.startsWith('wp-includes')) {
                    assetUrl = BASE_URL + '/' + assetUrl;
                } else {
                    return;
                }
            }

            if (assetUrl.startsWith(BASE_URL)) {
                const cleanUrl = assetUrl.split('?')[0].split('#')[0];
                assets.add(cleanUrl);
            }
        }

        $('img, source').each((i, el) => {
            addAsset($(el).attr('src'));
            const srcset = $(el).attr('srcset');
            if (srcset) {
                srcset.split(',').forEach(s => {
                    const url = s.trim().split(' ')[0];
                    addAsset(url);
                });
            }
        });

        $('link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"]').each((i, el) => {
            addAsset($(el).attr('href'));
        });

        $('script[src]').each((i, el) => {
            addAsset($(el).attr('src'));
        });

        $('[style]').each((i, el) => {
            const style = $(el).attr('style');
            const urlMatches = style.matchAll(/url\(['"]?([^'"]+)['"]?\)/g);
            for (const match of urlMatches) {
                addAsset(match[1]);
            }
        });

        for (const assetUrl of assets) {
            const assetRelativePath = assetUrl.replace(BASE_URL, '');
            const assetTargetPath = path.join(ROOT_DIR, assetRelativePath);
            if (!fs.existsSync(assetTargetPath)) {
                console.log(`Downloading asset: ${assetUrl}`);
                await downloadFile(assetUrl, assetTargetPath);

                // If it's a CSS file, parse it for more assets
                if (assetUrl.endsWith('.css')) {
                    try {
                        const cssRes = await axios.get(assetUrl);
                        await processCss(assetUrl, cssRes.data);
                    } catch (e) {
                        console.error(`Failed to process CSS ${assetUrl}: ${e.message}`);
                    }
                }
            }
        }

    } catch (error) {
        console.error(`Failed to scrape page ${pageUrl}: ${error.message}`);
    }
}

async function main() {
    const sitemaps = [
        'https://technocit.com/page-sitemap.xml',
        'https://technocit.com/post-sitemap.xml'
    ];

    let allUrls = [];
    for (const sitemap of sitemaps) {
        const urls = await getUrlsFromSitemap(sitemap);
        allUrls = allUrls.concat(urls);
    }

    console.log(`Found ${allUrls.length} URLs to scrape.`);

    for (const url of allUrls) {
        await scrapePage(url);
    }

    console.log('Scraping complete!');
}

main();
