"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function FieldLabel({
  htmlFor,
  required,
  children,
  className = "text-sm font-medium",
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className={className} aria-required={required}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

const JobPostingForm = () => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobType: "",
    workArrangement: "",
    experienceLevel: "Student/No Experience Required",
    department: "",
    jobDescription: "",
    salaryMin: "",
    salaryMax: "",
    duration: "",
    benefits: "",
    requiredSkills: "",
    preferredSkills: "",
    additionalRequirements: "",
    targetPrograms: [] as string[],
    deadline: "",
  });

  const targetPrograms = [
    "Software Engineering",
    "Computer Engineering",
    "Knowledge Engineering",
    "Data Science",
    "Cybersecurity",
    "AI Programs",
  ];

  const handleTargetProgramChange = (program: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      targetPrograms: checked
        ? [...prev.targetPrograms, program]
        : prev.targetPrograms.filter((p) => p !== program),
    }));
  };

  return (
    <div className="rounded-2xl bg-bg-2 p-6">
      <form className="flex flex-col gap-8">
        {/* Job Details */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Job Details</CardTitle>
            <p className="text-muted-foreground text-sm">
              Tell others about this specific role
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <FieldLabel htmlFor="jobTitle" required>
                Job Title
              </FieldLabel>
              <Input
                id="jobTitle"
                placeholder="e.g. Frontend Developer Intern"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                }
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="jobType" required>
                  Job Type
                </FieldLabel>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, jobType: value }))
                  }
                >
                  <SelectTrigger id="jobType" className="mt-2">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="workArrangement" required>
                  Work Arrangement
                </FieldLabel>
                <Select
                  value={formData.workArrangement}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, workArrangement: value }))
                  }
                >
                  <SelectTrigger id="workArrangement" className="mt-2">
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="experienceLevel">Experience Level</FieldLabel>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, experienceLevel: value }))
                  }
                >
                  <SelectTrigger id="experienceLevel" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student/No Experience Required">
                      Student/No Experience Required
                    </SelectItem>
                    <SelectItem value="1-2 years">1-2 years</SelectItem>
                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                    <SelectItem value="5+ years">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="department">Department/Team</FieldLabel>
                <Input
                  id="department"
                  placeholder="e.g. Engineering, Product, Marketing"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value }))
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="jobDescription" required>
                Job Description
              </FieldLabel>
              <Textarea
                id="jobDescription"
                placeholder="What will the student do day-to-day? What will they learn? What impact will they have?"
                value={formData.jobDescription}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobDescription: e.target.value }))
                }
                className="mt-2 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Benefits */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Compensation & Benefits
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Help students understand the financial and career benefits
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <FieldLabel>Salary Range</FieldLabel>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  placeholder="15000"
                  value={formData.salaryMin}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, salaryMin: e.target.value }))
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  placeholder="25000"
                  value={formData.salaryMax}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, salaryMax: e.target.value }))
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground font-medium">THB</span>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="duration">
                Duration (for internships/contracts)
              </FieldLabel>
              <Input
                id="duration"
                placeholder="e.g. 3-6 months, 1 year"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <FieldLabel htmlFor="benefits">Benefits & Perks</FieldLabel>
              <Textarea
                id="benefits"
                placeholder="e.g. Health insurance, flexible working hours, mentorship program, free meals..."
                value={formData.benefits}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, benefits: e.target.value }))
                }
                className="mt-2 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements & Skills */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Requirements & Skills
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Specify what students need to succeed in this role
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <FieldLabel htmlFor="requiredSkills">
                Required Skills & Technologies
              </FieldLabel>
              <Input
                id="requiredSkills"
                placeholder="Type a skill and press Enter (e.g. React, Python, SQL)"
                value={formData.requiredSkills}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiredSkills: e.target.value,
                  }))
                }
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add the essential skills students must have. Press Enter to add
                each skill
              </p>
            </div>

            <div>
              <FieldLabel htmlFor="preferredSkills">
                Preferred Skills (Nice to have)
              </FieldLabel>
              <Input
                id="preferredSkills"
                placeholder="Type a skill and press Enter"
                value={formData.preferredSkills}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preferredSkills: e.target.value,
                  }))
                }
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add bonus skills that would make candidates stand out
              </p>
            </div>

            <div>
              <FieldLabel htmlFor="additionalRequirements">
                Additional Requirements
              </FieldLabel>
              <Textarea
                id="additionalRequirements"
                placeholder="e.g. Must be currently enrolled at KU, available for full-time during summer, portfolio required..."
                value={formData.additionalRequirements}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    additionalRequirements: e.target.value,
                  }))
                }
                className="mt-2 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Programs */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Target Programs</CardTitle>
          </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetPrograms.map((program) => (
                <div key={program} className="flex items-center space-x-2">
                  <Checkbox
                    id={program}
                    checked={formData.targetPrograms.includes(program)}
                    onCheckedChange={(checked) =>
                      handleTargetProgramChange(program, checked as boolean)
                    }
                  />
                  <Label htmlFor={program} className="text-sm">
                    {program}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <FieldLabel htmlFor="deadline">Application Deadline</FieldLabel>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Preview */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Job Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {formData.jobTitle || "Job Title"}
                </h3>
                <p className="text-brand-teal font-medium">Company Name</p>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{formData.experienceLevel || "Experience Level"}</span>
                <span>•</span>
                <span>
                  {formData.salaryMin && formData.salaryMax
                    ? `${formData.salaryMin} - ${formData.salaryMax} THB`
                    : "Salary Range"}
                </span>
                <span>•</span>
                <span>{formData.jobType || "Job Type"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-between">
          <Button
            variant="outline"
            type="button"
            className="px-8 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
          >
            Save Draft
          </Button>

          <Button
            type="submit"
            className="px-8 bg-brand-teal hover:bg-brand-teal-dark"
          >
            Post Job
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
