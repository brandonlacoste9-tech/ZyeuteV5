import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular',
  ...props 
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-800",
        variant === 'circular' && "rounded-full",
        variant === 'text' && "rounded-md h-4 w-full",
        variant === 'rectangular' && "rounded-md",
        className
      )}
      {...props}
    />
  );
};

export const AvatarSkeleton: React.FC<{ size?: string; className?: string }> = ({ size = "w-10 h-10", className }) => (
  <Skeleton variant="circular" className={cn(size, className)} />
);

export const TextSkeleton: React.FC<{ width?: string; className?: string }> = ({ width = "w-3/4", className }) => (
  <Skeleton variant="text" className={cn(width, "h-4 my-1", className)} />
);

export const PostSkeleton: React.FC = () => (
    <div className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col items-center justify-center space-y-4">
        <Skeleton variant="rectangular" className="w-full h-full absolute inset-0 opacity-20" />
        <div className="z-10 flex flex-col items-center">
             <div className="text-neutral-700 text-6xl">📷</div>
             <TextSkeleton width="w-24" className="bg-neutral-800"/>
        </div>
    </div>
);

export const FeedPostSkeleton: React.FC = () => (
    <div className="h-screen w-full bg-black relative flex flex-col">
        {/* Simulating video area */}
        <div className="flex-grow relative bg-neutral-900 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-neutral-700 opacity-20"></div>
            </div>
        </div>
        
        {/* Simulating overlay interactive elements */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-4 items-center">
            <AvatarSkeleton size="w-12 h-12" />
            <Skeleton variant="circular" className="w-10 h-10 bg-neutral-800" />
            <Skeleton variant="circular" className="w-10 h-10 bg-neutral-800" />
            <Skeleton variant="circular" className="w-10 h-10 bg-neutral-800" />
        </div>
        
        <div className="absolute bottom-6 left-4 right-16 space-y-2">
            <TextSkeleton width="w-1/2" className="bg-neutral-800 h-5" />
            <TextSkeleton width="w-3/4" className="bg-neutral-800 h-4" />
        </div>
    </div>
);

export const ExploreGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-3 gap-0.5">
    {/* Generate 12 skeletons for the grid */}
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="aspect-[3/4] relative bg-neutral-900 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <div className="w-8 h-8 rounded-full bg-neutral-700" />
          </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black relative">
    {/* Header Cover */}
    <div className="h-48 bg-neutral-900 animate-pulse" />
    
    <div className="px-4 relative z-10 -mt-12">
      <div className="flex justify-between items-end mb-4">
        {/* Avatar */}
        <AvatarSkeleton size="w-24 h-24" className="border-4 border-black" />
        {/* Action Button */}
        <Skeleton className="w-24 h-10 rounded-full" />
      </div>
      
      {/* Name & Bio */}
      <div className="space-y-4 mb-6">
        <div>
          <TextSkeleton width="w-48" className="h-8 mb-2" />
          <TextSkeleton width="w-32" className="h-4" />
        </div>
        <div className="space-y-2">
          <TextSkeleton width="w-full" />
          <TextSkeleton width="w-3/4" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between p-4 bg-neutral-900/50 rounded-xl mb-6">
        <div className="flex flex-col items-center w-1/3">
           <Skeleton className="w-8 h-6 mb-1" />
           <Skeleton className="w-12 h-3" />
        </div>
        <div className="flex flex-col items-center w-1/3 border-l border-neutral-800">
           <Skeleton className="w-8 h-6 mb-1" />
           <Skeleton className="w-12 h-3" />
        </div>
        <div className="flex flex-col items-center w-1/3 border-l border-neutral-800">
           <Skeleton className="w-8 h-6 mb-1" />
           <Skeleton className="w-12 h-3" />
        </div>
      </div>

      {/* Grid */}
      <ExploreGridSkeleton />
    </div>
  </div>
);

export const PostDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black p-4">
     <div className="grid md:grid-cols-2 gap-6">
        {/* Media Skeleton */}
        <div className="aspect-square bg-neutral-900 rounded-2xl animate-pulse" />
        
        {/* Content Skeleton */}
        <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-900">
                <AvatarSkeleton size="w-10 h-10" />
                <div className="flex-1 space-y-2">
                    <TextSkeleton width="w-32" />
                    <TextSkeleton width="w-20" />
                </div>
            </div>
            
            <div className="py-4 space-y-3">
                 <TextSkeleton width="w-full" />
                 <TextSkeleton width="w-5/6" />
                 <TextSkeleton width="w-4/6" />
            </div>
            
            <div className="py-4 border-t border-b border-neutral-900">
                 <div className="flex justify-center gap-4">
                     {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-8 h-8 rounded-full" />)}
                 </div>
            </div>
        </div>
     </div>
  </div>
);
