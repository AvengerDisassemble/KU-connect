import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/services/profile";
import { fetchDegreeTypes, type DegreeType } from "@/services/degree";
import { phoneSchema } from "@/pages/public/register/components/phoneSchema";
import ResumeSection from "./ResumeSection";
import { ProfileContentSkeleton } from "./LoadingSkeleton";

const profileSchema = z.object({
  name: z.string().min(1, "First name is required").max(50),
  surname: z.string().min(1, "Last name is required").max(50),
  phoneNumber: phoneSchema,
  address: z.string().min(1),
  gpa: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce
      .number()
      .min(0, "GPA must be at least 0.00")
      .max(4, "GPA must not exceed 4.00")
      .optional()
  ),
  expectedGraduationYear: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().min(1988).max(2100).optional()
  ),
  degreeTypeId: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "Degree type is required")
  ),
});
type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  userId?: string;
}

const ProfileTab = ({ userId }: ProfileTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [degreeOptions, setDegreeOptions] = useState<DegreeType[]>([]);
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(false);
  const [degreeError, setDegreeError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId, // Only run query if userId is available
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profile Updated", {
        description: "Your profile information has been saved successfully.",
        duration: 3000,
      });
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile", {
        description: "Please try again.",
        duration: 4000,
      });
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormData>,
    defaultValues: {
      name: "",
      surname: "",
      phoneNumber: "",
      address: "",
      gpa: undefined,
      expectedGraduationYear: undefined,
      degreeTypeId: "",
    },
  });

  const loadDegreeOptions = useCallback(async () => {
    setIsLoadingDegrees(true);
    setDegreeError(null);
    try {
      const types = await fetchDegreeTypes();
      setDegreeOptions(types);
    } catch (err) {
      console.error("Failed to fetch degree types:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load degree types";
      setDegreeError(message);
    } finally {
      setIsLoadingDegrees(false);
    }
  }, []);

  useEffect(() => {
    loadDegreeOptions();
  }, [loadDegreeOptions]);

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        surname: profile.surname || "",
        phoneNumber: profile.phoneNumber ?? "",
        address: profile.student?.address || "",
        gpa: profile.student?.gpa,
        expectedGraduationYear: profile.student?.expectedGraduationYear,
        degreeTypeId: profile.student?.degreeTypeId ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormData) => {
    console.log("SUBMITTING FORM with data:", data);
    const payload: {
      userId: string;
      name: string;
      surname: string;
      address: string;
      gpa?: number;
      degreeTypeId?: string;
      expectedGraduationYear?: number;
      phoneNumber: string;
    } = {
      userId: userId!,
      name: data.name.trim(),
      surname: data.surname.trim(),
      address: data.address,
      phoneNumber: data.phoneNumber.trim(),
    };

    if (typeof data.gpa === "number" && !Number.isNaN(data.gpa)) {
      payload.gpa = data.gpa;
    }
    if (typeof data.degreeTypeId === "string" && data.degreeTypeId.trim()) {
      payload.degreeTypeId = data.degreeTypeId.trim();
    }
    if (
      typeof data.expectedGraduationYear === "number" &&
      !Number.isNaN(data.expectedGraduationYear)
    ) {
      payload.expectedGraduationYear = data.expectedGraduationYear;
    }
    mutation.mutate(payload);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (isLoading) {
    return <ProfileContentSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <div className="text-center py-8 text-destructive">
          Failed to load profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-accent">Profile</h1>
        </div>
      </div>

      {/* My Information Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">My information</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8"
                  aria-label="Edit profile"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    console.log("Save button clicked");
                    form.handleSubmit(
                      (data) => {
                        console.log(
                          "Form is valid, calling onSubmit with data:",
                          data
                        );
                        onSubmit(data);
                      },
                      (errors) => {
                        console.error("Validation errors:", errors);
                      }
                    )();
                  }}
                  className="flex items-center gap-2"
                  disabled={mutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Get the best job matches and a more relevant community experience.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              id="profile-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Row 1: Name & Surname */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Phone Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="e.g. +66912345678"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Address & Degree Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="degreeTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Degree Type <span className="text-red-500">*</span>
                      </FormLabel>
                      {isEditing ? (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) => field.onChange(val)}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="bg-background border-border"
                              disabled={
                                isLoadingDegrees || degreeOptions.length === 0
                              }
                              aria-label="Degree Type"
                            >
                              <SelectValue
                                placeholder={
                                  isLoadingDegrees
                                    ? "Loading degree types..."
                                    : "Select degree type"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {degreeOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={
                            degreeOptions.find(
                              (opt) => opt.id === form.getValues("degreeTypeId")
                            )?.name ||
                            profile?.student?.degreeType?.name ||
                            ""
                          }
                          readOnly
                          className="bg-background border-border"
                        />
                      )}
                      {degreeError && (
                        <div className="text-sm text-destructive flex items-center gap-2">
                          <span>{degreeError}</span>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0"
                            onClick={loadDegreeOptions}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Expected Graduation Year & GPA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expectedGraduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Graduation Year (Actual or Expected){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        GPA <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          {...field}
                          className="bg-background border-border"
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Hidden submit not required since header button uses form attribute */}
            </form>
          </Form>
        </CardContent>
      </Card>

      <ResumeSection
        userId={userId}
        resumeKey={profile?.student?.resumeKey ?? null}
        updatedAt={profile?.student?.updatedAt ?? profile?.updatedAt ?? null}
      />
    </div>
  );
};

export default ProfileTab;
