import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, ArrowRight } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground">
              Welcome to <span className="text-primary">KU-Connect</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Connecting Kasetsart University talent with verified employers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button 
              onClick={() => window.location.href = "/register"}
              size="lg"
              className="w-full sm:w-auto h-14 text-lg bg-primary hover:bg-primary/90 px-8"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 text-lg px-8 border-border hover:bg-muted"
            >
              Learn More
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 text-left hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Students & Alumni</h3>
              <p className="text-muted-foreground">
                Access exclusive job opportunities from verified employers. Build your career with KU's trusted network.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 text-left hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Employers</h3>
              <p className="text-muted-foreground">
                Connect with talented KU students and alumni. Post jobs and find the perfect candidates for your team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
