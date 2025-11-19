import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, GraduationCap } from "lucide-react";
import StudentRegistration from "./components/StudentRegistration";
import EmployerRegistration from "./components/EmployerRegistration";

const RegisterPage = () => {
  const [activeRole, setActiveRole] = useState<"student" | "employer">("student");

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
            KU CONNECT
          </p>
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
            Join the workflow that connects KU talent with verified employers.
          </h1>
          <p className="text-lg text-slate-500">
            KU Connect bridges current students, alumni, and employers through a single secure
            platform—keeping verification, messaging, and applications organized with calm clarity.
          </p>
        </div>

        <div className="flex-1 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <Tabs
            value={activeRole}
            onValueChange={(value) => setActiveRole(value as "student" | "employer")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100/70 p-1">
              <TabsTrigger
                value="student"
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm data-[state=active]:bg-white data-[state=active]:shadow"
              >
                <GraduationCap className="h-4 w-4" />
                Student / Alumni
              </TabsTrigger>
              <TabsTrigger
                value="employer"
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm data-[state=active]:bg-white data-[state=active]:shadow"
              >
                <Building2 className="h-4 w-4" />
                Employer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl">Student & Alumni access</CardTitle>
                  <CardDescription>
                    Current students use KU Gmail SSO. Alumni can register manually below for
                    transcript verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <StudentRegistration />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employer" className="mt-6">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl">Employer onboarding</CardTitle>
                  <CardDescription>
                    Share your company information and upload verification documents to connect with
                    KU talent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <EmployerRegistration />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
