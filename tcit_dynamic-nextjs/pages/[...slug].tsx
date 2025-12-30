import { GetServerSideProps } from 'next';
import { getPageDataByPath, getHeader, getFooter, PageData } from '@/lib/data-loader';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ContentRenderer from '@/components/ContentRenderer';

interface PageProps {
  pageData: PageData | null;
  headerData: ReturnType<typeof getHeader>;
  footerData: ReturnType<typeof getFooter>;
}

export default function DynamicPage({ pageData, headerData, footerData }: PageProps) {
  // Handle 404
  if (!pageData) {
    return (
      <Layout headerData={headerData} footerData={footerData}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <a href="/">Go back home</a>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEO metadata={pageData.metadata} styles={pageData.styles} />
      <Layout headerData={headerData} footerData={footerData}>
        <ContentRenderer content={pageData.content} />
      </Layout>
    </>
  );
}

// Server-side data fetching - this runs on the server only
export const getServerSideProps: GetServerSideProps<PageProps> = async (context: any) => {
  const { slug } = context.params!;
  // Build the path from slug array
  // If slug is undefined or empty, redirect to home
  if (!slug || (Array.isArray(slug) && slug.length === 0)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  const pathArray = Array.isArray(slug) ? slug : [slug];
  const pagePath = `/${pathArray.join('/')}`;
  
  // Load page data server-side (not exposed to client)
  const pageData = getPageDataByPath(pagePath);
  const headerData = getHeader();
  const footerData = getFooter();

  // If page not found, return 404
  if (!pageData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      pageData,
      headerData,
      footerData,
    },
  };
};

