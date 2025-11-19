import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyInsight } from "@/types/professorDashboardAnalytics";

interface TopCompaniesCardProps {
  companies?: CompanyInsight[];
  isLoading?: boolean;
}

const TopCompaniesCard: React.FC<TopCompaniesCardProps> = ({ companies, isLoading }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>Top Hiring Companies</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : companies && companies.length ? (
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.companyName}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{company.companyName}</p>
                <p className="text-xs text-muted-foreground">{company.jobCount} open roles</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{company.applicationCount}</p>
                <p className="text-xs text-muted-foreground">applications</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No company insights available.</p>
      )}
    </CardContent>
  </Card>
);

export default TopCompaniesCard;
