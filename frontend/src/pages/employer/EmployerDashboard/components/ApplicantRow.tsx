import { useState, type MouseEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { ApplicantViewModal } from "./ApplicantViewModal";
import type { JobApplication } from "@/services/jobs";

const formatDate = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
};

export interface ApplicantRowProps {
  application: JobApplication;
  jobTitle: string;
  onDecision?: (
    applicationId: string,
    status: "QUALIFIED" | "REJECTED"
  ) => Promise<void> | void;
  decisionPending?: boolean;
}

const ApplicantRow: React.FC<ApplicantRowProps> = ({
  application,
  jobTitle,
  onDecision,
  decisionPending = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const student = application.student;
  const user = student?.user;

  const fullName =
    [user?.name, user?.surname].filter(Boolean).join(" ") ||
    "Unknown applicant";

  const degreeName = student?.degreeType?.name ?? "—";

  const statusMeta =
    application.status === "QUALIFIED"
      ? { label: "Qualified", className: "bg-emerald-100 text-emerald-700" }
      : application.status === "REJECTED"
      ? { label: "Rejected", className: "bg-rose-100 text-rose-700" }
      : { label: "Pending", className: "bg-slate-100 text-slate-600" };

  const handleDecision = async (
    status: "QUALIFIED" | "REJECTED"
  ): Promise<void> => {
    if (!onDecision) return;

    try {
      await onDecision(application.id, status);
      setOpen(false);
    } catch {
      // parent handles error feedback
    }
  };

  const handleOpen: MouseEventHandler<HTMLButtonElement> = () => {
    setOpen(true);
  };

  return (
    <>
      <tr className="border-b border-border align-top">
        <td className="px-4 py-4">
          <div className="whitespace-normal font-semibold text-foreground">
            {fullName}
          </div>
          <div className="mt-1 whitespace-normal text-xs text-muted-foreground">
            {degreeName}
          </div>
          <div
            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase leading-snug ${statusMeta.className}`}
          >
            {statusMeta.label}
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="whitespace-normal text-sm text-foreground">
            {jobTitle}
          </div>
        </td>

        <td className="px-4 py-4 text-right text-sm text-muted-foreground">
          {formatDate(application.createdAt)}
        </td>

        <td className="px-4 py-4 text-right">
          <Button
            size="sm"
            className="inline-flex h-8 rounded-full border-transparent bg-primary px-4 text-white hover:bg-primary/90"
            onClick={handleOpen}
            aria-label={`View application of ${fullName}`}
          >
            View
          </Button>
        </td>
      </tr>

      <ApplicantViewModal
        open={open}
        onOpenChange={setOpen}
        student={{
          id: student?.id ?? "",
          user: {
            id: user?.id ?? "",
            name: fullName,
            email: user?.email ?? undefined,
            image: null,
          },
          degreeType: student?.degreeType ?? null,
          address: student?.address ?? undefined,
          gpa: student?.gpa ?? undefined,
          expectedGraduationYear: student?.expectedGraduationYear ?? undefined,
          interests: student?.interests ?? [],
        }}
        roleLabel={jobTitle}
        submittedAt={application.createdAt}
        resumes={
          application.resume
            ? [
                {
                  id: application.resume.id,
                  name: application.resume.link.split("/").pop() ?? "Resume",
                  url: application.resume.link,
                  mimeType: "application/pdf",
                },
              ]
            : []
        }
        onApprove={() => {
          void handleDecision("QUALIFIED");
        }}
        onReject={() => {
          void handleDecision("REJECTED");
        }}
        actionsDisabled={decisionPending}
      />
    </>
  );
};

export default ApplicantRow;
