/**
 * Image Component - Sharp image wrapper with responsive scaling
 * Enforces high-quality display and handles responsive images
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // Base image source (1x resolution)
  src: string;
  // Optional high-DPI sources for Retina displays
  src2x?: string;
  src3x?: string;
  // Object fit for image scaling
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  // Additional className
  className?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  src2x,
  src3x,
  objectFit = 'cover',
  className = '',
  ...rest
}) => {
  // Construct the srcset string for responsive images
  const srcSet = [
    src2x ? `${src2x} 2x` : '',
    src3x ? `${src3x} 3x` : '',
  ]
    .filter(Boolean)
    .join(', ');

  // Enforce sharp display CSS properties
  const cssClasses = cn(
    'w-full',
    'h-full',
    `object-${objectFit}`,
    'will-change-transform', // Performance hint for smooth scaling
    className
  );

  return (
    <img
      src={src} // 1x source
      srcSet={srcSet || undefined} // Responsive sources
      className={cssClasses}
      loading="lazy" // Improves initial load performance
      {...rest}
    />
  );
};

