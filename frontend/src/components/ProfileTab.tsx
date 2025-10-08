import { Pencil, Download, MoreHorizontal, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

const profileSchema = z.object({
  employmentStatus: z.string().min(1, "Employment status is required"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
  location: z.string().min(1, "Location is required"),
  major: z.string().optional(),
  graduationDate: z.string().optional(),
  gpa: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      employmentStatus: "Student",
      fullName: "Phantawat Organ",
      location: "Bangkok, Thailand",
      major: "Software Engineering",
      graduationDate: "May 2025",
      gpa: "3.75",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    console.log("Profile data:", data);
    setIsEditing(false);
  
    toast.success("Profile Updated", {
      description: "Your profile information has been saved successfully.",
      duration: 3000, // optional, default set in <Toaster />
    });
  };
  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

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
                  <Pencil className="w-4 h-4 text-muted-foreground" />
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
                  onClick={form.handleSubmit(onSubmit)}
                  className="flex items-center gap-2"
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: Employment Status & Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Employment status <span className="text-red-500">*</span>
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Full name <span className="text-red-500">*</span>
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
              </div>

              {/* Row 2: Location & Major */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Location <span className="text-red-500">*</span>
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
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Major
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
              </div>

              {/* Row 3: Graduation Date & GPA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="graduationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Graduation Date/ Expected Graduation
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
                        GPA
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

export default ProfileTab;