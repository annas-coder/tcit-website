import { PageContent } from '@/lib/data-loader';

interface ContentRendererProps {
  content: PageContent;
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
    // CSS url() paths in style attributes - relative paths
    .replace(/url\(['"]?\.\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?\.\.\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?\/wp-content\/uploads\//g, 'url(/static/images/')
    .replace(/url\(['"]?wp-content\/uploads\//g, 'url(/static/images/')
    // CSS url() paths - external URLs (fallback for any missed during extraction)
    .replace(/url\(['"]?https?:\/\/technocit\.com\/wp-content\/uploads\/([^'")]+)['"]?\)/gi, (match, relativePath) => {
      const publicPath = `/static/images/${relativePath}`;
      // Preserve quotes if they were present
      const hasQuotes = match.includes("'") || match.includes('"');
      if (hasQuotes) {
        const quote = match.includes("'") ? "'" : '"';
        return `url(${quote}${publicPath}${quote})`;
      }
      return `url(${publicPath})`;
    })
    // Link href paths
    .replace(/href="\.\//g, 'href="/')
    .replace(/href="\.\.\//g, 'href="/')
    // Add loading="lazy" to img tags without loading attribute
    .replace(/<img\s+((?:(?!\s+loading=)[^>])*?)(\s*\/?>)/gi, (match, attrs, closing) => {
      if (/loading\s*=/i.test(attrs)) {
        return match; // Already has loading attribute, keep as is
      }
      return `<img ${attrs} loading="lazy"${closing}`;
    });
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  // If we have full HTML content, render it directly (preserves Elementor structure)
  // The HTML already includes the full wrapper element with classes like "elementor elementor-21317"
  // so we render it without an additional wrapper to preserve parent selector relationships
  if (content.html) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: normalizePaths(content.html) }}
      />
    );
  }

  // Fallback: render individual elements (for backwards compatibility)
  return (
    <div className="content-renderer">
      {/* Render headings */}
      {content.headings.map((heading, index) => {
        const HeadingTag = heading.tag as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            key={`heading-${index}`}
            id={heading.id || undefined}
            className="content-heading"
          >
            {heading.text}
          </HeadingTag>
        );
      })}

      {/* Render paragraphs */}
      {content.paragraphs.map((paragraph, index) => (
        <p key={`paragraph-${index}`} className="content-paragraph">
          {paragraph}
        </p>
      ))}

      {/* Render images */}
      {content.images.map((image, index) => {
        // Normalize image src
        const normalizedSrc = image.src
          .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
          .replace(/^\/wp-content\/uploads\//, '/static/images/')
          .replace(/^wp-content\/uploads\//, '/static/images/');

        return (
          <div key={`image-${index}`} className="content-image-wrapper">
            <img
              src={normalizedSrc}
              alt={image.alt || ''}
              className="content-image"
              loading="lazy"
            />
          </div>
        );
      })}

      {/* Render sections with HTML content */}
      {content.sections.map((section, index) => (
        <div
          key={`section-${index}`}
          className="content-section"
          dangerouslySetInnerHTML={{ __html: normalizePaths(section.content) }}
        />
      ))}

      <style jsx global>{`
        .page-content-wrapper {
          width: 100%;
        }
        
        .page-content-wrapper :global(img) {
          max-width: 100%;
          height: auto;
        }
        
        .page-content-wrapper :global(a) {
          color: #467FF7;
          text-decoration: none;
        }
        
        .page-content-wrapper :global(a:hover) {
          text-decoration: underline;
        }
        
        .content-renderer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 8%;
        }
        
        .content-heading {
          font-family: 'Poppins', sans-serif;
          margin: 30px 0 20px;
          color: #1C244B;
        }
        
        .content-heading:first-child {
          margin-top: 0;
        }
        
        .content-paragraph {
          font-family: 'Lato', sans-serif;
          line-height: 1.8;
          margin-bottom: 20px;
          color: #333;
        }
        
        .content-image-wrapper {
          margin: 30px 0;
          text-align: center;
        }
        
        .content-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        
        .content-section {
          margin: 40px 0;
        }
        
        .content-section :global(img) {
          max-width: 100%;
          height: auto;
        }
        
        .content-section :global(a) {
          color: #467FF7;
          text-decoration: none;
        }
        
        .content-section :global(a:hover) {
          text-decoration: underline;
        }
        
        @media (max-width: 767px) {
          .content-renderer {
            padding: 20px 5%;
          }
        }
      `}</style>
    </div>
  );
}

