import { useEffect, useState } from "react";
import {
  Edit,
  Download,
  MoreHorizontal,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchStudentPreferences,
  updateStudentPreferences,
  type StudentPreference,
  type StudentPreferenceUpdatePayload,
} from "@/services/studentPreferences";

const NO_PREFERENCE = "none";

const INDUSTRY_OPTIONS = [
  { value: NO_PREFERENCE, label: "No preference" },
  { value: "IT_SOFTWARE", label: "IT Software" },
  { value: "IT_SERVICES", label: "IT Services" },
  { value: "IT_HARDWARE_AND_DEVICES", label: "IT Hardware & Devices" },
  { value: "NETWORK_SERVICES", label: "Network Services" },
  { value: "EMERGING_TECH", label: "Emerging Tech" },
  { value: "E_COMMERCE", label: "E-Commerce" },
  { value: "OTHER", label: "Other" },
];

const JOB_TYPE_OPTIONS = [
  { value: NO_PREFERENCE, label: "No preference" },
  { value: "internship", label: "Internship" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "contract", label: "Contract" },
];

const REMOTE_WORK_OPTIONS = [
  { value: NO_PREFERENCE, label: "No preference" },
  { value: "on-site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const jobPreferencesSchema = z.object({
  minSalary: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+$/g.test(value.trim()),
      "Minimum salary must be a valid number"
    ),
  desiredLocation: z
    .string()
    .max(255, "Desired location cannot exceed 255 characters")
    .optional(),
  industry: z.union([
    z.literal(NO_PREFERENCE),
    z.enum([
      "IT_SOFTWARE",
      "IT_SERVICES",
      "IT_HARDWARE_AND_DEVICES",
      "NETWORK_SERVICES",
      "EMERGING_TECH",
      "E_COMMERCE",
      "OTHER",
    ]),
  ]),
  jobType: z.union([
    z.literal(NO_PREFERENCE),
    z.enum(["internship", "part-time", "full-time", "contract"]),
  ]),
  remoteWork: z.union([
    z.literal(NO_PREFERENCE),
    z.enum(["on-site", "remote", "hybrid"]),
  ]),
});

const PREFERENCES_QUERY_KEY = ["student", "preferences"] as const;

const mapPreferenceToFormValues = (
  preference?: StudentPreference | null
): z.infer<typeof jobPreferencesSchema> => ({
  minSalary:
    typeof preference?.minSalary === "number"
      ? String(preference.minSalary)
      : "",
  desiredLocation: preference?.desiredLocation ?? "",
  industry: preference?.industry ?? NO_PREFERENCE,
  jobType: preference?.jobType ?? NO_PREFERENCE,
  remoteWork: preference?.remoteWork ?? NO_PREFERENCE,
});

const JobPreferencesTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
    isError,
    error,
  } = useQuery<StudentPreference | null, Error>({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: fetchStudentPreferences,
    staleTime: 2 * 60 * 1000,
  });
  
  const form = useForm<z.infer<typeof jobPreferencesSchema>>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      minSalary: "",
      desiredLocation: "",
      industry: NO_PREFERENCE,
      jobType: NO_PREFERENCE,
      remoteWork: NO_PREFERENCE,
    },
  });

  useEffect(() => {
    if (isLoadingPreferences) return;
    form.reset(mapPreferenceToFormValues(preferences));
  }, [preferences, isLoadingPreferences, form]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload: StudentPreferenceUpdatePayload) =>
      updateStudentPreferences(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, updated);
      form.reset(mapPreferenceToFormValues(updated));
      setIsEditing(false);
      toast.success("Job preferences saved.");
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to save preferences.";
      toast.error(message);
    },
  });

  const onSubmit = (values: z.infer<typeof jobPreferencesSchema>) => {
    const payload: StudentPreferenceUpdatePayload = {
      minSalary: values.minSalary
        ? Number(values.minSalary.trim())
        : null,
      desiredLocation: values.desiredLocation?.trim()
        ? values.desiredLocation.trim()
        : null,
      industry: values.industry === NO_PREFERENCE ? null : values.industry,
      jobType: values.jobType === NO_PREFERENCE ? null : values.jobType,
      remoteWork:
        values.remoteWork === NO_PREFERENCE ? null : values.remoteWork,
    };

    updatePreferencesMutation.mutate(payload);
  };

  const handleCancel = () => {
    form.reset(mapPreferenceToFormValues(preferences));
    setIsEditing(false);
  };

  const isFormDisabled =
    !isEditing || updatePreferencesMutation.isPending || isLoadingPreferences;

  const errorMessage = isError
    ? error?.message || "Failed to load job preferences."
    : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Job preferences</h1>
        {isLoadingPreferences ? (
          <p className="text-sm text-muted-foreground mt-2">
            Loading your preferences…
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-destructive mt-2">{errorMessage}</p>
        ) : null}
      </div>

      {/* Job Goals Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Job goals</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoadingPreferences}
                  className="h-6 w-6"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={updatePreferencesMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  {updatePreferencesMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Get customized job recommendations by keeping your preferences updated.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: Salary, Currency, Pay Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired minimum salary</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input 
                            {...field}
                            value={field.value ?? ""}
                            disabled={isFormDisabled}
                            className="pl-7 bg-background border-border"
                            placeholder="Desired minimum salary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred industry</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isFormDisabled}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isFormDisabled}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Location & Remote Work */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="desiredLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired location</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value ?? ""}
                          disabled={isFormDisabled}
                          className="bg-background border-border"
                          placeholder="e.g. Bangkok, Thailand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="remoteWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open to remote work</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isFormDisabled}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REMOTE_WORK_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Resume Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resume</CardTitle>
          <CardDescription>
            Add a resume to save time and autofill certain job applications. You can also share it to hear from employers about openings.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-background">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold">📄</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">Resume.pdf</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobPreferencesTab;
