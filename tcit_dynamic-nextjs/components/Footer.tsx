import { FooterData } from '@/lib/data-loader';

interface FooterProps {
  footerData: FooterData | null;
}

// Helper function to normalize paths in HTML content
function normalizePaths(html: string): string {
  return html
    // Image src paths
    .replace(/src="\.\/wp-content\/uploads\//g, 'src="/static/images/')
    .replace(/src="\.\.\/wp-content\/uploads\//g, 'src="/static/images/')
    .replace(/src="\/wp-content\/uploads\//g, 'src="/static/images/')
    .replace(/src="wp-content\/uploads\//g, 'src="/static/images/')
    // Image srcset paths
    .replace(/srcset="([^"]*wp-content\/uploads[^"]*)"/g, (match, srcset) => {
      const normalized = srcset
        .replace(/\.\/wp-content\/uploads\//g, '/static/images/')
        .replace(/\.\.\/wp-content\/uploads\//g, '/static/images/')
        .replace(/\/wp-content\/uploads\//g, '/static/images/')
        .replace(/wp-content\/uploads\//g, '/static/images/');
      return `srcset="${normalized}"`;
    })
    // CSS url() paths in style attributes
    .replace(/url\(['"]?\.\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?\.\.\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?wp-content\/uploads\//g, 'url(/static/images/')
    // CSS url() paths - external URLs (fallback)
    .replace(/url\(['"]?https?:\/\/technocit\.com\/wp-content\/uploads\/([^'")]+)['"]?\)/gi, (match, relativePath) => {
      const publicPath = `/static/images/${relativePath}`;
      const hasQuotes = match.includes("'") || match.includes('"');
      if (hasQuotes) {
        const quote = match.includes("'") ? "'" : '"';
        return `url(${quote}${publicPath}${quote})`;
      }
      return `url(${publicPath})`;
    })
    // Link href paths
    .replace(/href="\.\//g, 'href="/')
    .replace(/href="\.\.\//g, 'href="/');
}

export default function Footer({ footerData }: FooterProps) {
  if (!footerData) {
    // Fallback if footer data is not available
    return (
      <footer>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} TechnoCIT Software Solutions</p>
        </div>
      </footer>
    );
  }

  return (
    <>
      {/* Include inline styles */}
      {footerData.inlineStyles && (
        <style dangerouslySetInnerHTML={{ __html: footerData.inlineStyles }} />
      )}
      <div
        dangerouslySetInnerHTML={{ __html: normalizePaths(footerData.html) }}
      />
    </>
  );
}
