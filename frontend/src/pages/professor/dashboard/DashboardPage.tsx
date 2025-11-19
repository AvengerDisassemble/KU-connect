import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import ProfessorLayout from "@/components/layout/ProfessorLayout";
import {
  getProfessorDashboardAnalytics,
  getProfessorStudents,
  type ProfessorStudentListItem,
} from "@/services/professor";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProfessorStatCard from "@/pages/professor/dashboard/components/StatCard";
import FilterPanel from "@/pages/professor/dashboard/components/FilterPanel";
import StudentTable from "@/pages/professor/dashboard/components/StudentTable";

type DashboardStatCard = {
  id: string;
  label: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeCaption?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");

const toPercentLabel = (value: number | undefined | null): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
};

const StudentAnalyticsContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("all");
  const [selectedGrad, setSelectedGrad] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("90d");
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["professor-analytics"],
    queryFn: getProfessorDashboardAnalytics,
    staleTime: 60_000,
  });

  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["professor-students", { page: 1, limit: 50 }],
    queryFn: () => getProfessorStudents({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const students: ProfessorStudentListItem[] = studentsResponse?.students ?? [];
  const totalStudents = studentsResponse?.summary.totalStudents ?? 0;

  const degreeOptions = useMemo(() => {
    const map = new Map<string, string>();
    analytics?.degreeTypeBreakdown.forEach((degree) => {
      map.set(degree.degreeTypeId, degree.degreeTypeName);
    });
    students.forEach((student) => {
      const degree = student.degreeType;
      if (degree?.id) {
        map.set(degree.id, degree.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [analytics?.degreeTypeBreakdown, students]);

  const graduationOptions = useMemo(() => {
    const values = new Set<string>();
    students.forEach((student) => {
      if (typeof student.expectedGraduationYear === "number") {
        values.add(String(student.expectedGraduationYear));
      }
    });
    return Array.from(values).sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      if (selectedDegree !== "all" && student.degreeType?.id !== selectedDegree) {
        return false;
      }
      if (selectedGrad !== "all") {
        const gradLabel =
          typeof student.expectedGraduationYear === "number"
            ? String(student.expectedGraduationYear)
            : "";
        if (!gradLabel || gradLabel !== selectedGrad) {
          return false;
        }
      }
      if (term.length > 0) {
        const haystack = `${student.fullName} ${student.studentId} ${student.email ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedDegree, selectedGrad, searchQuery]);

  const activeStudents = useMemo(() => {
    if (!students.length) return 0;
    return students.filter((student) => student.applicationStats.total > 0).length;
  }, [students]);

  const statCards: DashboardStatCard[] = useMemo(() => {
    const summary = analytics?.summary;
    const applicationMetrics = analytics?.applicationMetrics;
    const placementRate = summary?.qualifiedRate ?? 0;
    return [
      {
        id: "students",
        label: "Students Monitored",
        value: numberFormatter.format(summary?.totalStudents ?? totalStudents),
        subtitle: `${activeStudents} active students`,
      },
      {
        id: "applications",
        label: "Job Applications",
        value: numberFormatter.format(summary?.totalApplications ?? 0),
        change: applicationMetrics?.thisMonth.percentChange ?? 0,
        changeCaption: "vs last month",
      },
      {
        id: "placement",
        label: "Placement Success",
        value: toPercentLabel(placementRate),
        subtitle: "Qualified students",
      },
    ];
  }, [activeStudents, analytics, totalStudents]);

  const isLoading = analyticsLoading || studentsLoading;

  const handleRefresh = () => {
    setSelectedDegree("all");
    setSelectedGrad("all");
    setSelectedPeriod("90d");
    setSearchQuery("");
    void refetchAnalytics();
    void refetchStudents();
  };

  const handleExportCsv = () => {
    if (typeof window === "undefined") {
      return;
    }
    if (!filteredStudents.length) {
      toast.info("No students to export with current filters");
      return;
    }

    try {
      setIsExporting(true);
      const headers = [
        "Full Name",
        "Email",
        "Degree",
        "Year",
        "GPA",
        "Applications",
        "Pending",
        "Qualified",
        "Rejected",
      ];
      const rows = filteredStudents.map((student) => [
        student.fullName || `${student.name} ${student.surname}`,
        student.email,
        student.degreeType?.name ?? "",
        student.year ?? "",
        typeof student.gpa === "number" ? student.gpa.toFixed(2) : "",
        student.applicationStats.total,
        student.applicationStats.pending,
        student.applicationStats.qualified,
        student.applicationStats.rejected,
      ]);
      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((value) =>
              typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value,
            )
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-analytics-${Date.now()}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exported student list to CSV");
    } catch (error) {
      console.error(error);
      toast.error("Export failed, please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const periodCopy: Record<string, string> = {
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "12m": "Last 12 months",
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-6">

      {(analyticsError || studentsError) && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load analytics</AlertTitle>
          <AlertDescription>
            {analyticsError?.message || studentsError?.message || "Please try refreshing the page."}
          </AlertDescription>
        </Alert>
      )}

  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {statCards.map((card) =>
          isLoading ? (
    <Skeleton key={card.id} className="h-36 rounded-2xl" />
          ) : (
            <ProfessorStatCard
              key={card.id}
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              change={card.change}
              changeCaption={card.changeCaption}
            />
          ),
        )}
      </div>

      <FilterPanel
        filters={[
      {
        label: "Degree",
        value: selectedDegree,
        onChange: (value) => setSelectedDegree(value),
        options: [
          { value: "all", label: "All Degrees" },
          ...degreeOptions.map((course) => ({
            value: course.id,
            label: course.name,
          })),
        ],
      },
      {
        label: "Graduation",
        value: selectedGrad,
        onChange: (value) => setSelectedGrad(value),
        options: [
          { value: "all", label: "All Years" },
          ...graduationOptions.map((year) => ({
            value: year,
            label: `Grad ${year}`,
          })),
        ],
      },
          {
            label: "Time Period",
            value: selectedPeriod,
            onChange: (value) => setSelectedPeriod(value),
            options: [
              { value: "30d", label: "Last 30 Days" },
              { value: "90d", label: "Last 90 Days" },
              { value: "12m", label: "Last 12 Months" },
            ],
          },
        ]}
        searchValue={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        summary={`Showing insights for ${filteredStudents.length} students · ${periodCopy[selectedPeriod]}`}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      <StudentTable
        students={filteredStudents}
        isLoading={isLoading}
        formatSuccessRate={toPercentLabel}
      />
    </div>
  );
};

const ProfessorDashboardPage = () => (
  <ProfessorLayout
    title="Student Analytics"
    description="Monitor outcomes and guide your students with live career data."
  >
    <StudentAnalyticsContent />
  </ProfessorLayout>
);

export default ProfessorDashboardPage;
