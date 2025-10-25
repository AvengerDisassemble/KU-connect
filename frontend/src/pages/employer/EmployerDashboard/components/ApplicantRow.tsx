import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplicantViewModal } from "./ApplicantViewModal";

export interface Applicant {
  id: string;
  name: string;
  major: string;
  year: number;
  appliedRole: string;
  lastUpdate: string; // submittedAt
}

interface ApplicantRowProps {
  applicant: Applicant;
}

const ApplicantRow = ({
  applicant,
}: ApplicantRowProps) => {
  const [open, setOpen] = useState(false);

  const handleApprove = async (studentId: string) => {
    console.log("approve", studentId);
    setOpen(false);
  };

  const handleDelete = async (studentId: string) => {
    console.log("delete", studentId);
    setOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 border-b border-border py-6 last:border-0 md:grid-cols-12">
        {/* Student */}
        <div className="md:col-span-4">
          <p className="font-semibold text-foreground">
            {applicant.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {applicant.major} • Year {applicant.year}
          </p>
        </div>

        {/* Applied role */}
        <div className="md:col-span-4">
          <p className="text-sm text-foreground">
            {applicant.appliedRole}
          </p>
        </div>

        {/* Submitted time */}
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">
            {applicant.lastUpdate}
          </p>
        </div>

        {/* View (open modal) */}
        <div className="flex items-start justify-end self-start md:col-span-2">
          <Button
            size="sm"
            className="h-8 rounded-full border-transparent bg-primary px-4 text-white hover:bg-primary/90"
            onClick={() => setOpen(true)}
            aria-label={`View ${applicant.name}'s application`}
          >
            View
          </Button>
        </div>
      </div>

      {/* Popup Modal */}
      <ApplicantViewModal
        open={open}
        onOpenChange={setOpen}
        // mock data
        student={{
          id: applicant.id,
          user: { id: "user-" + applicant.id, name: applicant.name, image: null },
          degreeType: { id: "deg-1", name: "Bachelor" },
          address: "Bangkok, Thailand",
          gpa: 3.42,
          expectedGraduationYear: 2026,
          interests: [
            { id: "i1", name: "Frontend" },
            { id: "i2", name: "AI" },
          ],
        }}
        roleLabel={applicant.appliedRole}
        submittedAt={applicant.lastUpdate}
        resumes={[
          { id: "r1", name: "Resume.pdf", url: "#", mimeType: "application/pdf" },
        ]}
        onApprove={handleApprove}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ApplicantRow;
