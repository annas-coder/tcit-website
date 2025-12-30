import Link from 'next/link';

interface ContentLinkProps {
  link: {
    href: string;
    text: string;
  };
  className?: string;
}

export default function ContentLink({ link, className }: ContentLinkProps) {
  // Normalize href
  const normalizedHref = link.href
    .replace(/^\.\//, '/')
    .replace(/^\.\.\//, '/');

  // Check if it's an external link (starts with http:// or https://)
  const isExternal = /^https?:\/\//.test(normalizedHref);
  
  // Check if it's a mailto or tel link
  const isSpecialLink = normalizedHref.startsWith('mailto:') || normalizedHref.startsWith('tel:');

  // For external or special links, use regular <a> tag
  if (isExternal || isSpecialLink) {
    return (
      <a 
        href={normalizedHref} 
        className={className || 'content-link'}
        {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {link.text}
      </a>
    );
  }

  // For internal links, use Next.js Link
  // In Next.js 13+, Link automatically renders an <a> tag, so no need to wrap
  return (
    <Link href={normalizedHref} className={className || 'content-link'}>
      {link.text}
    </Link>
  );
}

