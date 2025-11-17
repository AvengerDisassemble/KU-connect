import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type ProfessorStudentListItem } from "@/services/professor";

interface StudentTableProps {
  students: ProfessorStudentListItem[];
  isLoading: boolean;
  formatSuccessRate: (value: number | undefined | null) => string;
}

const deriveGraduationLabel = (student: ProfessorStudentListItem): string => {
  if (typeof student.expectedGraduationYear === "number") {
    return `Grad ${student.expectedGraduationYear}`;
  }
  if (typeof student.year === "number") {
    return `Grad ${new Date().getFullYear() + (4 - student.year)}`;
  }
  return "Grad —";
};

const StudentTable = ({
  students,
  isLoading,
  formatSuccessRate,
}: StudentTableProps) => {
  return (
    <Card className="border-none bg-card shadow-sm ring-1 ring-border/80">
      <CardHeader className="flex flex-col gap-2 border-b border-border/80 bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Student Job Search Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tracking degree trends, applications, GPA, and success rate.
          </p>
        </div>
        <div className="self-end inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs sm:text-sm font-semibold text-primary-foreground max-w-max">
          {students.length}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* On small screens, show stacked card list to avoid horizontal scrolling. On md+, use table layout */}
        <div className="block md:hidden space-y-3 p-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={`sk-${i}`} className="rounded-lg bg-muted/20 p-3">
                  <Skeleton className="h-4 w-36" />
                  <div className="mt-2 flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            : students.length
            ? students.map((student) => (
                <div key={student.studentId} className="rounded-lg bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {student.fullName || `${student.name ?? ""} ${student.surname ?? ""}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                    </div>
                    <div className="flex-shrink-0 text-sm font-semibold text-right">
                      {formatSuccessRate(student.applicationStats.qualifiedRate)}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {student.degreeType?.name ?? "—"} · {deriveGraduationLabel(student)}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-foreground">{typeof student.gpa === "number" ? student.gpa.toFixed(2) : "—"}</span>
                      <span className="text-muted-foreground">GPA</span>
                    </div>

                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-foreground">{student.applicationStats.total}</span>
                      <span className="text-muted-foreground">Apps</span>
                    </div>

                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground">{student.applicationStats.pending}</span>
                      <span className="text-muted-foreground">Pending</span>
                    </div>

                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-primary">{student.applicationStats.qualified}</span>
                      <span className="text-muted-foreground">Qualified</span>
                    </div>

                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground">{student.applicationStats.rejected}</span>
                      <span className="text-muted-foreground">Rejected</span>
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className="text-center text-sm text-muted-foreground">No students match the current filters.</div>
            )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left align-bottom whitespace-normal leading-tight">Student</th>
                <th className="px-3 py-3 text-left align-bottom whitespace-normal leading-tight">Degree / Graduation</th>
                <th className="px-3 py-3 text-center align-bottom">GPA</th>
                <th className="px-3 py-3 text-center align-bottom">Applications</th>
                <th className="px-3 py-3 text-center align-bottom">Pending</th>
                <th className="px-3 py-3 text-center align-bottom">Qualified</th>
                <th className="px-3 py-3 text-center align-bottom">Rejected</th>
                <th className="px-3 py-3 text-center align-bottom">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-3 py-4">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-2 h-3 w-20" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-10" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-10" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-10" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-10" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-10" />
                    </td>
                    <td className="px-3 py-4">
                      <Skeleton className="mx-auto h-4 w-12" />
                    </td>
                  </tr>
                ))
              ) : students.length ? (
                students.map((student) => {
                  return (
                    <tr key={student.studentId} className="hover:bg-muted/60">
                      <td className="px-3 py-4 text-left">
                        <div className="font-semibold leading-tight text-foreground">
                          {(() => {
                            const baseName =
                              student.fullName?.trim() ||
                              `${student.name ?? ""} ${student.surname ?? ""}`.trim();
                            if (!baseName) {
                              return "—";
                            }
                            const lastSpace = baseName.lastIndexOf(" ");
                            if (lastSpace === -1) {
                              return baseName;
                            }
                            const first = baseName.slice(0, lastSpace).trim();
                            const last = baseName.slice(lastSpace + 1).trim();
                            return (
                              <>
                                <span>{first}</span>
                                {last ? <span className="block">{last}</span> : null}
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-left">
                        <div className="font-medium text-foreground">
                          {student.degreeType?.name ?? "—"}
                        </div>
                      <div className="text-xs text-muted-foreground">
                        {deriveGraduationLabel(student)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center align-middle text-muted-foreground">
                      {typeof student.gpa === "number"
                        ? student.gpa.toFixed(2)
                        : "—"}
                    </td>
                      <td className="px-3 py-4 text-center align-middle font-semibold text-foreground">
                        {student.applicationStats.total}
                      </td>
                      <td className="px-3 py-4 text-center align-middle text-muted-foreground">
                        {student.applicationStats.pending}
                      </td>
                      <td className="px-3 py-4 text-center align-middle text-primary">
                        {student.applicationStats.qualified}
                      </td>
                      <td className="px-3 py-4 text-center align-middle text-muted-foreground">
                        {student.applicationStats.rejected}
                      </td>
                      <td className="px-3 py-4 text-center align-middle font-semibold">
                        {formatSuccessRate(student.applicationStats.qualifiedRate)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentTable;
