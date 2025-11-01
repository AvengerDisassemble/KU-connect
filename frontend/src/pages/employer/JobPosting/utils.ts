import type { JobFormState, JobSubmitPayload } from "./components/JobPostingForm";

export const toSubmitPayload = (formData: JobFormState): JobSubmitPayload => {
  const mapClean = (items: string[]) =>
    items.map((s) => s.trim()).filter(Boolean);

  const min = Number(formData.minSalary);
  const max = Number(formData.maxSalary);

  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    location: formData.location.trim(),
    jobType: formData.jobType,
    workArrangement: formData.workArrangement,
    duration: formData.duration.trim(),
    minSalary: min,
    maxSalary: max,
    application_deadline: `${formData.application_deadline}T23:59:59Z`,
    email: formData.email.trim() || undefined,
    phone_number: formData.phone_number.trim(),
    other_contact_information:
      formData.other_contact_information.trim() || undefined,
    requirements: mapClean(formData.requirements),
    qualifications: mapClean(formData.qualifications),
    responsibilities: mapClean(formData.responsibilities),
    benefits: mapClean(formData.benefits),
    tags: mapClean(formData.tags),
  };
};
