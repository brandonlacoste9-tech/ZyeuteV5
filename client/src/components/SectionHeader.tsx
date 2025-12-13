/**
 * SectionHeader Component - Premium Gold Themed Section Titles
 * Reusable header component for organizing content sections
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  showArrow?: boolean;
  onArrowClick?: () => void;
  linkTo?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  showArrow = false,
  onArrowClick,
  linkTo,
  className 
}) => {
  const content = (
    <div className={cn('flex items-center gap-2 group', className)}>
      <h2 className="text-lg text-gold-500 font-bold uppercase tracking-wider embossed">
        {title}
      </h2>
      {showArrow && (
        <svg 
          className="w-5 h-5 text-gold-500/70 group-hover:text-gold-400 transition-colors"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block px-4 mb-3 mt-6">
        {content}
      </Link>
    );
  }

  return (
    <div className="px-4 mb-3 mt-6" onClick={onArrowClick}>
      {content}
    </div>
  );
};

