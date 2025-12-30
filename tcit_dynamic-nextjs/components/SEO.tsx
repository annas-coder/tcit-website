import Head from 'next/head';
import { PageMetadata, PageStyles } from '@/lib/data-loader';

interface SEOProps {
  metadata: PageMetadata;
  styles?: PageStyles;
}

export default function SEO({ metadata, styles }: SEOProps) {
  const { title, description, canonical, og, twitter, schema } = metadata;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Tags */}
      {og.locale && <meta property="og:locale" content={og.locale} />}
      {og.type && <meta property="og:type" content={og.type} />}
      {og.title && <meta property="og:title" content={og.title} />}
      {og.description && <meta property="og:description" content={og.description} />}
      {og.url && <meta property="og:url" content={og.url} />}
      {og.image && <meta property="og:image" content={og.image} />}
      {og['image:secure_url'] && <meta property="og:image:secure_url" content={og['image:secure_url']} />}
      {og['image:width'] && <meta property="og:image:width" content={og['image:width']} />}
      {og['image:height'] && <meta property="og:image:height" content={og['image:height']} />}
      {og['image:alt'] && <meta property="og:image:alt" content={og['image:alt']} />}
      {og['image:type'] && <meta property="og:image:type" content={og['image:type']} />}
      {og.updated_time && <meta property="og:updated_time" content={og.updated_time} />}
      
      {/* Twitter Card Tags */}
      {twitter.card && <meta name="twitter:card" content={twitter.card} />}
      {twitter.title && <meta name="twitter:title" content={twitter.title} />}
      {twitter.description && <meta name="twitter:description" content={twitter.description} />}
      {twitter.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter.label1 && <meta name="twitter:label1" content={twitter.label1} />}
      {twitter.data1 && <meta name="twitter:data1" content={twitter.data1} />}
      {twitter.label2 && <meta name="twitter:label2" content={twitter.label2} />}
      {twitter.data2 && <meta name="twitter:data2" content={twitter.data2} />}
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      
      {/* External CSS files */}
      {styles?.external.map((css, index) => (
        <link
          key={`css-${index}`}
          rel="stylesheet"
          href={css.href}
          id={css.id || undefined}
          media="all"
        />
      ))}
      
      {/* Inline styles */}
      {styles?.inline.map((style, index) => (
        <style
          key={`style-${index}`}
          id={style.id || undefined}
          dangerouslySetInnerHTML={{ __html: style.content }}
        />
      ))}
    </Head>
  );
}


