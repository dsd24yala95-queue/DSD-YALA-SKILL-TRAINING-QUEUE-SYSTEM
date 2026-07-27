export default function Loading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
        {/* Logo Skeleton */}
        <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
        
        {/* Title Skeleton */}
        <div className="w-3/4 h-8 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        
        {/* Subtitle Skeleton */}
        <div className="w-1/2 h-4 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
        
        {/* Card Skeletons */}
        <div className="w-full flex flex-col gap-4 mt-8">
          <div className="w-full h-24 bg-white/50 dark:bg-gray-800/50 rounded-2xl animate-pulse backdrop-blur-sm border border-gray-200 dark:border-gray-700"></div>
          <div className="w-full h-24 bg-white/50 dark:bg-gray-800/50 rounded-2xl animate-pulse backdrop-blur-sm border border-gray-200 dark:border-gray-700"></div>
          <div className="w-full h-24 bg-white/50 dark:bg-gray-800/50 rounded-2xl animate-pulse backdrop-blur-sm border border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>
    </div>
  );
}
