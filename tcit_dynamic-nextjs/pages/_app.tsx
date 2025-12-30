import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Preloader functionality - hide preloader after page load
    const initPreloader = () => {
      const preloader = document.getElementById('the-preloader-element');
      if (!preloader) return;

      const hidePreloader = async () => {
        // Wait 500ms before starting fade
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fade out over 0.5s
        preloader.style.transition = 'opacity 0.5s ease-in-out';
        preloader.style.opacity = '0';

        // Remove from DOM after fade completes
        setTimeout(() => {
          preloader.style.display = 'none';
          preloader.remove();
        }, 550);
      };

      // Wait for window load event
      if (document.readyState === 'complete') {
        hidePreloader();
      } else {
        window.addEventListener('load', hidePreloader);
      }
    };

    // Disable Elementor lazy loading by immediately marking all containers as loaded
    // This ensures all background images display immediately
    const enableAllBackgrounds = () => {
      // Find all Elementor containers that don't have the lazyloaded class
      const containers = document.querySelectorAll('.e-con.e-parent:not(.e-lazyloaded)');
      containers.forEach((container) => {
        container.classList.add('e-lazyloaded');
      });
    };

    // Remove elementor-invisible class from all elements
    const removeInvisibleClass = () => {
      const invisibleElements = document.querySelectorAll('.elementor-invisible');
      invisibleElements.forEach((element) => {
        element.classList.remove('elementor-invisible');
      });
    };

    // Initialize Elementor menu toggle functionality
    const initMenuToggle = () => {
      const menuToggles = document.querySelectorAll('.elementor-menu-toggle');
      
      menuToggles.forEach((toggle) => {
        // Remove existing listeners by cloning and replacing
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode?.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isExpanded = newToggle.getAttribute('aria-expanded') === 'true';
          const newExpanded = !isExpanded;
          
          // Update aria-expanded
          newToggle.setAttribute('aria-expanded', String(newExpanded));
          
          // Find the dropdown menu (sibling nav with class elementor-nav-menu--dropdown)
          const navMenu = newToggle.closest('.elementor-widget-nav-menu');
          if (navMenu) {
            const dropdownMenu = navMenu.querySelector('.elementor-nav-menu--dropdown');
            if (dropdownMenu) {
              if (newExpanded) {
                dropdownMenu.removeAttribute('aria-hidden');
                dropdownMenu.classList.remove('elementor-nav-menu--dropdown-hidden');
              } else {
                dropdownMenu.setAttribute('aria-hidden', 'true');
                dropdownMenu.classList.add('elementor-nav-menu--dropdown-hidden');
              }
            }
            
            // Toggle icon visibility
            const openIcon = newToggle.querySelector('.elementor-menu-toggle__icon--open');
            const closeIcon = newToggle.querySelector('.elementor-menu-toggle__icon--close');
            
            if (openIcon && closeIcon) {
              if (newExpanded) {
                openIcon.classList.add('elementor-hidden');
                closeIcon.classList.remove('elementor-hidden');
              } else {
                openIcon.classList.remove('elementor-hidden');
                closeIcon.classList.add('elementor-hidden');
              }
            }
          }
        });
      });
    };

    // Initialize sticky header behavior
    const initStickyHeader = () => {
      const header = document.querySelector('[data-elementor-id="3080"]');
      if (!header) return;

      const headerContainer = header.querySelector('[data-id="433ca67c"]');
      if (!headerContainer) return;

      // Check if sticky is enabled in data-settings
      const dataSettings = headerContainer.getAttribute('data-settings');
      if (!dataSettings || !dataSettings.includes('"sticky":"top"')) return;

      let lastScrollTop = 0;
      let ticking = false;

      const handleScroll = () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const headerHeight = headerContainer.getBoundingClientRect().height;
          
          if (scrollTop > headerHeight) {
            headerContainer.classList.add('elementor-sticky');
            headerContainer.classList.add('elementor-sticky--active');
          } else {
            headerContainer.classList.remove('elementor-sticky');
            headerContainer.classList.remove('elementor-sticky--active');
          }

          lastScrollTop = scrollTop;
          ticking = false;
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial check
      handleScroll();

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    };

    // Initialize preloader
    initPreloader();

    // Run immediately and also on DOMContentLoaded
    enableAllBackgrounds();
    removeInvisibleClass();
    initMenuToggle();
    initStickyHeader();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        enableAllBackgrounds();
        removeInvisibleClass();
        initMenuToggle();
        initStickyHeader();
      });
    }

    // Also run after a short delay to catch any dynamically added containers
    const timeoutId = setTimeout(() => {
      enableAllBackgrounds();
      removeInvisibleClass();
      initMenuToggle();
      initStickyHeader();
    }, 100);

    return () => {
      document.removeEventListener('DOMContentLoaded', enableAllBackgrounds);
      clearTimeout(timeoutId);
    };
  }, []);

  return <Component {...pageProps} />;
}



