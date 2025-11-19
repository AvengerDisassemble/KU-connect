import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <aside className="w-72 bg-card border-r border-border p-6 space-y-8">
        {/* Avatar */}
        <div className="text-center space-y-2">
          <div className="relative inline-block mb-2">
            <Skeleton className="w-20 h-20 rounded-full mx-auto" />
            <Skeleton className="w-6 h-6 rounded-full absolute -bottom-1 -right-1" />
          </div>
          <Skeleton className="h-4 w-12 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        {/* Tab Buttons */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl space-y-6">
          {/* Page Heading */}
          <div>
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Card with Fields */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64 mt-1" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const ProfileContentSkeleton = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-1 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
};
