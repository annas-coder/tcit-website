import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_DIR = path.join(DATA_DIR, 'pages');

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  schema?: any;
}

export interface PageContent {
  html?: string; // Full HTML content (preferred)
  elementorId?: string | null; // Elementor page/post ID for CSS parent selectors
  sections: Array<{
    type: string;
    content: string;
    text: string;
  }>;
  headings: Array<{
    level: number;
    tag: string;
    text: string;
    id: string | null;
  }>;
  paragraphs: string[];
  images: Array<{
    src: string;
    alt: string;
    width: number | null;
    height: number | null;
  }>;
  links: Array<{
    href: string;
    text: string;
  }>;
}

export interface NavigationItem {
  label: string;
  href: string;
}

export interface PageStyles {
  inline: Array<{
    id: string;
    content: string;
  }>;
  external: Array<{
    href: string;
    id: string;
  }>;
}

export interface PageData {
  slug: string;
  path: string;
  metadata: PageMetadata;
  navigation: NavigationItem[];
  content: PageContent;
  styles?: PageStyles;
  extractedAt: string;
}

export interface RoutesData {
  routes: Array<{
    slug: string;
    path: string;
  }>;
  total: number;
}

export interface NavigationData {
  items: NavigationItem[];
  updatedAt: string;
}

export interface FooterData {
  cssFiles: string[];
}

export interface HeaderData {
  cssFiles: string[];
}

/**
 * Load page data by slug
 * This function is server-side only and reads from the file system
 */
export function getPageData(slug: string): PageData | null {
  try {
    // Handle home page
    const fileName = slug === '' || slug === 'index' ? 'home.json' : `${slug}.json`;
    const filePath = path.join(PAGES_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Page data file not found: ${filePath}`);
      return null;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContents) as PageData;
    
    // Validate data structure
    if (!data || !data.metadata || !data.content) {
      console.warn(`Invalid page data structure in: ${filePath}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error loading page data for slug "${slug}":`, error);
    return null;
  }
}

/**
 * Load page data by path
 */
export function getPageDataByPath(pagePath: string): PageData | null {
  try {
    // Normalize path (remove leading and trailing slashes)
    const normalizedPath = pagePath === '/' ? '/' : pagePath.replace(/^\/|\/$/g, '');
    
    // Find matching route by normalizing both paths for comparison
    const routes = getRoutes();
    const route = routes.routes.find(r => {
      // Normalize route path the same way
      const normalizedRoutePath = r.path === '/' ? '/' : r.path.replace(/^\/|\/$/g, '');
      // Match if normalized paths are equal, or if original paths match
      return normalizedRoutePath === normalizedPath || r.path === pagePath;
    });
    
    if (!route) {
      return null;
    }
    
    return getPageData(route.slug);
  } catch (error) {
    console.error(`Error loading page data for path "${pagePath}":`, error);
    return null;
  }
}

/**
 * Get all routes
 */
export function getRoutes(): RoutesData {
  try {
    const filePath = path.join(DATA_DIR, 'routes.json');
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContents) as RoutesData;
  } catch (error) {
    console.error('Error loading routes:', error);
    return { routes: [], total: 0 };
  }
}

/**
 * Get navigation data
 */
export function getNavigation(): NavigationData {
  try {
    const filePath = path.join(DATA_DIR, 'navigation.json');
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContents) as NavigationData;
  } catch (error) {
    console.error('Error loading navigation:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Check if a route exists
 */
export function routeExists(pagePath: string): boolean {
  const routes = getRoutes();
  const normalizedPath = pagePath === '/' ? '/' : pagePath.replace(/^\/|\/$/g, '');
  return routes.routes.some(r => {
    const normalizedRoutePath = r.path === '/' ? '/' : r.path.replace(/^\/|\/$/g, '');
    return normalizedRoutePath === normalizedPath || r.path === pagePath;
  });
}

/**
 * Get footer data
 */
export function getFooter(): FooterData | null {
  try {
    const filePath = path.join(DATA_DIR, 'footer.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Footer data file not found: ${filePath}`);
      return null;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContents) as FooterData;
    
    // Validate data structure
    if (!data || !data.cssFiles) {
      console.warn(`Invalid footer data structure in: ${filePath}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading footer data:', error);
    return null;
  }
}

/**
 * Get header data
 */
export function getHeader(): HeaderData | null {
  try {
    const filePath = path.join(DATA_DIR, 'header.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Header data file not found: ${filePath}`);
      return null;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContents) as HeaderData;
    
    // Validate data structure
    if (!data || !data.cssFiles) {
      console.warn(`Invalid header data structure in: ${filePath}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading header data:', error);
    return null;
  }
}


