import { Edit, Download, MoreHorizontal, Save, X } from "lucide-react";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/services/profile";

const profileSchema = z.object({
  name: z.string().min(1, "First name is required").max(50),
  surname: z.string().min(1, "Last name is required").max(50),
  // phoneNumber: z.preprocess(
  //   (v) => (v === "" ? undefined : v),
  //   z
  //     .string()
  //     .regex(/^[0-9]+$/, "Phone number must contain only digits")
  //     .min(9, "Phone number must be at least 9 digits")
  //     .max(15, "Phone number must not exceed 15 digits")
  //     .optional()
  // ),
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
    (v) => (v === "" ? undefined : v),
    z.coerce.number().optional()
  ),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const DEGREE_OPTIONS = [
  { id: 1, label: "Bachelor" },
  { id: 2, label: "Master" },
  { id: 3, label: "PhD" },
];

function getDegreeLabel(id?: number) {
  if (!id) return "";
  const found = DEGREE_OPTIONS.find((o) => o.id === id);
  return found ? found.label : "";
}

interface ProfileTabProps {
  userId?: string;
}

const ProfileTab = ({ userId }: ProfileTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
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
      // phoneNumber: undefined,
      address: "",
      gpa: undefined,
      expectedGraduationYear: undefined,
      degreeTypeId: undefined,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        surname: profile.surname || "",
        // phoneNumber: profile.phoneNumber || "",
        address: profile.student?.address || "",
        gpa: profile.student?.gpa,
        expectedGraduationYear: profile.student?.expectedGraduationYear,
        degreeTypeId: profile.student?.degreeTypeId,
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
      degreeTypeId?: number;
      expectedGraduationYear?: number;
      // phoneNumber?: string;
    } = {
      userId: userId!,
      name: data.name.trim(),
      surname: data.surname.trim(),
      address: data.address,
    };

    if (typeof data.gpa === "number" && !Number.isNaN(data.gpa)) {
      payload.gpa = data.gpa;
    }
    if (
      typeof data.degreeTypeId === "number" &&
      !Number.isNaN(data.degreeTypeId)
    ) {
      payload.degreeTypeId = data.degreeTypeId;
    }
    if (
      typeof data.expectedGraduationYear === "number" &&
      !Number.isNaN(data.expectedGraduationYear)
    ) {
      payload.expectedGraduationYear = data.expectedGraduationYear;
    }
    // if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
    //   payload.phoneNumber = data.phoneNumber.trim();
    // }

    mutation.mutate(payload);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="text-center py-8">Loading profile...</div>
      </div>
    );
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
                {/* <FormField
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
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
                          value={field.value?.toString() ?? ""}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select degree type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEGREE_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.id}
                                value={opt.id.toString()}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={getDegreeLabel(form.getValues("degreeTypeId"))}
                          readOnly
                          className="bg-background border-border"
                        />
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

      {/* Resume Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resume</CardTitle>
          <CardDescription>
            Add a resume to save time and autofill certain job applications. You
            can also share it to hear from employers about openings.
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

export default ProfileTab;
