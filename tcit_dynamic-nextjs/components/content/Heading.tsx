import { PageContent } from '@/lib/data-loader';

interface HeadingProps {
  heading: PageContent['headings'][0];
  className?: string;
}

export default function Heading({ heading, className }: HeadingProps) {
  const HeadingTag = heading.tag as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag
      id={heading.id || undefined}
      className={className || 'content-heading'}
    >
      {heading.text}
    </HeadingTag>
  );
}

