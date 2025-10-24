import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StudentInterest = { id: string; name: string };
type ResumeFile = { id: string; name: string; url: string; mimeType?: string };
type DegreeType = { id: string; name: string };
type UserLite = { id: string; name?: string | null; email?: string | null; image?: string | null };

export type StudentLite = {
  id: string;
  user: UserLite;
  degreeType?: DegreeType | null;
  address?: string | null;
  gpa?: number | null;
  expectedGraduationYear?: number | null;
  interests?: StudentInterest[];
};

export function ApplicantViewModal({
  open,
  onOpenChange,
  student,
  roleLabel,
  submittedAt,
  resumes = [],
  onApprove,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  student: StudentLite;
  roleLabel?: string;
  submittedAt?: string;
  resumes?: ResumeFile[];
  onApprove?: (studentId: string) => void;
  onDelete?: (studentId: string) => void;
}) {
  const title = `${student?.user?.name ?? "Applicant"}${roleLabel ? ` — ${roleLabel}` : ""}`;
  const shortAddress = student?.address ? student.address.split(",")[0]?.trim() : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-none data-[state=closed]:animate-none" />

      <DialogContent
        className="
          sm:max-w-2xl p-4
          data-[state=open]:animate-none data-[state=closed]:animate-none
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          rounded-lg border bg-background shadow-lg outline-none
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {/* Avatar/Logo */}
            {student?.user?.image ? (
              <img
                src={student.user.image}
                alt="avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted" />
            )}
            <span className="truncate">{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {student?.degreeType?.name ?? "Degree"}
            {student?.gpa != null ? ` • GPA ${student.gpa.toFixed(2)}` : ""}
            {student?.expectedGraduationYear ? ` • Grad ${student.expectedGraduationYear}` : ""}
            {shortAddress ? ` • ${shortAddress}` : ""}
            {submittedAt ? ` • Submitted ${submittedAt}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Profile */}
        <section className="rounded-xl border p-3">
          <div className="mb-1 text-sm font-medium">Profile</div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{student?.user?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Degree</dt>
              <dd className="font-medium">{student?.degreeType?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">GPA</dt>
              <dd className="font-medium">
                {student?.gpa != null ? student.gpa.toFixed(2) : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expected Grad</dt>
              <dd className="font-medium">
                {student?.expectedGraduationYear ?? "-"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Interests</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {(student?.interests ?? []).length ? (
                  student!.interests!.map((i) => (
                    <span
                      key={i.id}
                      className="rounded-full border px-2 py-0.5 text-xs"
                    >
                      {i.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Documents (Download only) */}
        <section>
          <div className="mb-2 mt-3 text-sm font-medium">Documents</div>
          {resumes.length ? (
            <ul className="space-y-2">
              {resumes.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    {doc.mimeType ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.mimeType}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <a href={doc.url} download>
                        Download
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          )}
        </section>

        {/* Footer: Close / Approve / Delete */}
        <div className="mt-3 flex items-center justify-between">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onApprove?.(student.id)}
              className="bg-brand-lime text-white hover:bg-brand-lime/90"
            >
              Approve
            </Button>
            <Button variant="destructive" onClick={() => onDelete?.(student.id)}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
