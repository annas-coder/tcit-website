import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HeaderData } from '@/lib/data-loader';

interface HeaderProps {
  headerData: HeaderData | null;
}

interface MenuItem {
  href: string;
  label: string;
}

export default function Header({ headerData }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Menu items matching the structure from header.json
  const menuItems: MenuItem[] = [
    { href: '/', label: 'Home' },
    { href: '/services/', label: 'Services' },
    { href: '/our-works/', label: 'Our Works' },
    { href: '/about-us-2/', label: 'About Us' },
    { href: '/contact/', label: 'Contact' },
  ];

  // Determine active menu item based on current route
  const getActiveClass = (href: string) => {
    if (href === '/' && router.pathname === '/') {
      return 'active';
    }
    if (href !== '/' && router.pathname.startsWith(href)) {
      return 'active';
    }
    return '';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!headerData) {
    // Fallback if header data is not available
    return (
      <div className="elementor elementor-3080">
        <div className="elementor-element elementor-element-433ca67c e-flex e-con-boxed e-con e-parent">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-7e925246 elementor-widget">
              <div className="elementor-widget-container">
                <Link href="/">
                  <p>TechnoCIT Software Solutions</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="elementor elementor-3080" data-elementor-type="wp-post" data-elementor-id="3080" data-elementor-post-type="wcf-addons-template">
      <div className="elementor-element elementor-element-433ca67c e-flex e-con-boxed e-con e-parent" data-id="433ca67c" data-element_type="container">
        <div className="e-con-inner">
          {/* Logo */}
          <div className="elementor-element elementor-element-7e925246 elementor-widget elementor-widget-theme-site-logo elementor-widget-image" data-id="7e925246" data-element_type="widget">
            <div className="elementor-widget-container">
              <Link href="/">
                <img
                  width={124}
                  height={60}
                  src="/static/images/2024/05/Logo.svg"
                  className="attachment-full size-full wp-image-15862"
                  alt=""
                />
              </Link>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="elementor-element elementor-element-609ca708 elementor-nav-menu--dropdown-mobile elementor-nav-menu--stretch elementor-nav-menu__align-end elementor-nav-menu__text-align-aside elementor-nav-menu--toggle elementor-nav-menu--burger elementor-widget elementor-widget-nav-menu" data-id="609ca708" data-element_type="widget">
            <div className="elementor-widget-container">
              <nav aria-label="Menu" className="elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-horizontal e--pointer-none">
                <ul id="menu-1-609ca708" className="elementor-nav-menu">
                  {menuItems.map((item) => (
                    <li key={item.href} className={`menu-item menu-item-type-post_type menu-item-object-page ${router.pathname === item.href ? 'current-menu-item page_item current_page_item' : ''}`}>
                      <Link
                        href={item.href}
                        className={`elementor-item ${router.pathname === item.href ? 'elementor-item-active' : ''}`}
                        aria-current={router.pathname === item.href ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile Menu Toggle */}
              <button
                className="elementor-menu-toggle"
                type="button"
                role="button"
                aria-label="Menu Toggle"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
              >
                <svg
                  aria-hidden="true"
                  role="presentation"
                  className="elementor-menu-toggle__icon--open e-font-icon-svg e-fas-bars"
                  viewBox="0 0 448 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
                </svg>
                <svg
                  aria-hidden="true"
                  role="presentation"
                  className="elementor-menu-toggle__icon--close e-font-icon-svg e-eicon-close"
                  viewBox="0 0 1000 1000"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path>
                </svg>
              </button>

              {/* Mobile Dropdown Menu */}
              <nav className={`elementor-nav-menu--dropdown elementor-nav-menu__container ${isMenuOpen ? '' : 'elementor-nav-menu--dropdown-hidden'}`} aria-hidden={!isMenuOpen}>
                <ul id="menu-2-609ca708" className="elementor-nav-menu">
                  {menuItems.map((item) => (
                    <li key={item.href} className={`menu-item menu-item-type-post_type menu-item-object-page ${router.pathname === item.href ? 'current-menu-item page_item current_page_item' : ''}`}>
                      <Link
                        href={item.href}
                        className={`elementor-item ${router.pathname === item.href ? 'elementor-item-active' : ''}`}
                        tabIndex={isMenuOpen ? 0 : -1}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* CTA Button */}
          <div className="elementor-element elementor-element-2a6eb88 elementor-align-center elementor-hidden-tablet_extra elementor-hidden-tablet elementor-hidden-mobile_extra elementor-hidden-mobile elementor-widget elementor-widget-button" data-id="2a6eb88" data-element_type="widget">
            <div className="elementor-widget-container">
              <div className="elementor-button-wrapper">
                <Link href="/contact/" className="elementor-button elementor-button-link elementor-size-sm">
                  <span className="elementor-button-content-wrapper">
                    <span className="elementor-button-icon">
                      <svg aria-hidden="true" className="e-font-icon-svg e-fas-arrow-right" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path>
                      </svg>
                    </span>
                    <span className="elementor-button-text">Lets Talk</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
