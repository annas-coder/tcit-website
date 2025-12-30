import Layout from '@/components/Layout';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Layout headerData={null} footerData={null}>
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', marginBottom: '20px', color: '#1C244B' }}>404</h1>
        <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#333' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '40px', color: '#666' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 30px',
            backgroundColor: '#467FF7',
            color: 'white',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'background-color 0.3s',
          }}
        >
          Go Back Home
        </Link>
      </div>
    </Layout>
  );
}

