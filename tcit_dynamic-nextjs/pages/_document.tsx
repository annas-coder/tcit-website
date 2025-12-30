import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.png" sizes="32x32" />
        <link rel="icon" href="/favicon.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        {/* Preload fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Lato:wght@100;300;400;700;900&display=swap"
          rel="stylesheet"
        />
        {/* Header CSS files - loaded globally since header appears on all pages */}
        <link
          rel="stylesheet"
          href="/static/css/elementor/post-3080.css"
          media="all"
        />
        <link
          rel="stylesheet"
          href="/static/css/elementor/custom-pro-widget-nav-menu.min.css"
          media="all"
        />
        <link
          rel="stylesheet"
          href="/static/css/plugins/elementor-pro/assets/css/modules/sticky.min.css"
          media="all"
        />
        {/* Footer CSS files - loaded globally since footer appears on all pages */}
        <link
          rel="stylesheet"
          href="/static/css/elementor/post-3.css"
          media="all"
        />
        <link
          rel="stylesheet"
          href="/static/css/elementor/post-3084.css"
          media="all"
        />
        {/* Preloader CSS */}
        <link
          rel="stylesheet"
          href="/static/css/plugins/the-preloader/css/templates/image.css"
          media="all"
        />
      </Head>
      <body className="elementor-default elementor-kit-3">
        <div
          id="the-preloader-element"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <div
            className="the-preloader-image"
            style={{
              background:
                'url(/static/images/plugins/the-preloader/includes/admin-assets/images/preloader.gif) no-repeat 50%',
              backgroundSize: '100% 100%',
              width: '64px',
              height: '64px',
            }}
          />
        </div>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


