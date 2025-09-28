import { Edit, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ProfileTab = () => {
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
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">My information</CardTitle>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardDescription>
            Get the best job matches and a more relevant community experience.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Row 1: Employment Status & Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employment-status" className="text-sm font-medium">
                Employment status <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="employment-status"
                value="Student" 
                className="bg-background border-border"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-sm font-medium">
                Full name
              </Label>
              <Input 
                id="full-name"
                value="Phantawat Organ" 
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Row 2: Location & Major */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="location"
                value="Bangkok, Thailand" 
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="major" className="text-sm font-medium">
                Major
              </Label>
              <Input 
                id="major"
                value="Software Engineering" 
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Row 3: Graduation Date & GPA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="graduation-date" className="text-sm font-medium">
                Graduation Date/ Expected Graduation
              </Label>
              <Input 
                id="graduation-date"
                value="May 2025" 
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gpa" className="text-sm font-medium">
                GPA
              </Label>
              <Input 
                id="gpa"
                value="3.75" 
                className="bg-background border-border"
              />
            </div>
          </div>
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