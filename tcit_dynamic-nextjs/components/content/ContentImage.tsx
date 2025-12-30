import Image from 'next/image';
import { PageContent } from '@/lib/data-loader';

interface ContentImageProps {
  image: PageContent['images'][0];
  className?: string;
  wrapperClassName?: string;
}

export default function ContentImage({ 
  image, 
  className, 
  wrapperClassName 
}: ContentImageProps) {
  // Normalize image src
  const normalizedSrc = image.src
    .replace(/^\.\/wp-content\/uploads\//, '/static/images/')
    .replace(/^\.\.\/wp-content\/uploads\//, '/static/images/')
    .replace(/^\/wp-content\/uploads\//, '/static/images/')
    .replace(/^wp-content\/uploads\//, '/static/images/');

  // Use Next.js Image if we have dimensions, otherwise use regular img
  if (image.width && image.height) {
    return (
      <div className={wrapperClassName || 'content-image-wrapper'}>
        <Image
          src={normalizedSrc}
          alt={image.alt || ''}
          width={image.width}
          height={image.height}
          className={className || 'content-image'}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName || 'content-image-wrapper'}>
      <img
        src={normalizedSrc}
        alt={image.alt || ''}
        className={className || 'content-image'}
        loading="lazy"
      />
    </div>
  );
}

