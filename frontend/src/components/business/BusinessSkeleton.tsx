// src/components/business/BusinessSkeleton.tsx
'use client';

export function BusinessSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
        <div className="relative p-8 space-y-6">
          {/* Title and description skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded-full w-20" />
              ))}
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative animate-pulse">
                <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-2xl border border-white/30" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-16" />
                      <div className="h-8 bg-gray-200 rounded w-12" />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="relative animate-pulse">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative">
              {/* Section header skeleton */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gray-200 rounded" />
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
                  <div className="h-6 bg-gray-200 rounded w-32" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded" />
              </div>

              {/* Section content skeleton */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-28" />
                </div>

                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="relative">
                      <div className="absolute inset-0 bg-white/30 rounded-2xl" />
                      <div className="relative p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional animated elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
