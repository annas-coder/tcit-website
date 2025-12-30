import { GetServerSideProps } from 'next';
import { getPageData, getHeader, getFooter, PageData } from '@/lib/data-loader';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ContentRenderer from '@/components/ContentRenderer';

interface HomePageProps {
  pageData: PageData | null;
  headerData: ReturnType<typeof getHeader>;
  footerData: ReturnType<typeof getFooter>;
}

export default function HomePage({ pageData, headerData, footerData }: HomePageProps) {
  if (!pageData) {
    return (
      <Layout headerData={headerData} footerData={footerData}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1>Loading...</h1>
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

// Server-side data fetching
export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  // Load home page data server-side
  const pageData = getPageData('home');
  const headerData = getHeader();
  const footerData = getFooter();

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

