import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { FooterData, HeaderData } from '@/lib/data-loader';

interface LayoutProps {
  children: ReactNode;
  headerData: HeaderData | null;
  footerData: FooterData | null;
}

export default function Layout({ children, headerData, footerData }: LayoutProps) {
  return (
    <div className="layout">
      <Header headerData={headerData} />
      <main className="main-content">{children}</main>
      <Footer footerData={footerData} />
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html,
        body {
          font-family: 'Poppins', 'Lato', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main-content {
          flex: 1;
        }
        
        a {
          color: inherit;
          text-decoration: none;
        }
        
        img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}



