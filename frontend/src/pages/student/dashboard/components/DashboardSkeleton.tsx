import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border/80 bg-card shadow-sm">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/60 bg-muted/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-border/80 bg-card shadow-sm">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((__, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="rounded-xl border border-border/60 bg-muted/30 p-4"
                  >
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                    <Skeleton className="mt-2 h-3 w-1/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
