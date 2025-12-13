import React from 'react';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  const sizeClasses = {
    sm: 'spinner-gold',
    md: 'spinner-gold',
    lg: 'spinner-gold spinner-gold-lg',
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={sizeClasses[size]} />
      {label && (
        <p className="text-sm text-gold-400/80 font-medium animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
}) => {
  const variantClasses = {
    text: 'h-4 w-full',
    circle: 'rounded-full aspect-square',
    rect: '',
  };

  return (
    <div
      className={cn('skeleton', variantClasses[variant], className)}
    />
  );
};

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Ça charge...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <div className="spinner-gold spinner-gold-lg" />
        <div className="absolute inset-0 spinner-gold spinner-gold-lg opacity-30 blur-sm" />
      </div>
      <p className="text-gold-400/80 font-medium">{message}</p>
    </div>
  );
};

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4 stagger-children">
      {[1, 2, 3].map((i) => (
        <div key={i} className="leather-card stitched p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-24 h-24" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="flex justify-around">
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
};
