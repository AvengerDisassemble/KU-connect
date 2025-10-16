import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Building2 } from "lucide-react";
import StudentRegistration from "./components/StudentRegistration";
import EmployerRegistration from "./components/EmployerRegistration";

const RegisterPage = () => {
  const [activeRole, setActiveRole] = useState<"student" | "employer">("student");

  return (
    <main className="min-h-screen bg-background py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Join <span className="text-primary">KU-Connect</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect Kasetsart University students and alumni with verified employers
          </p>
        </header>

        {/* Role Selection */}
        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as "student" | "employer")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-card border border-border">
            <TabsTrigger 
              value="student" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Student
            </TabsTrigger>
            <TabsTrigger 
              value="employer"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Employer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="mt-0">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Student Registration</CardTitle>
                <CardDescription>
                  Current students use KU Gmail. Alumni can register with email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employer" className="mt-0">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Employer Registration</CardTitle>
                <CardDescription>
                  Complete the verification process to post jobs and connect with talent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployerRegistration />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
