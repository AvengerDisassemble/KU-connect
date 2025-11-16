import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Building2,
  Star,
  ArrowRight,
  CheckCircle,
  Shield,
  ChevronDown,
} from "lucide-react";

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Check which sections are visible
      const sections = document.querySelectorAll("[data-section]");
      const newVisibleSections = new Set<string>();

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isVisible =
          rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
        if (isVisible) {
          newVisibleSections.add(section.getAttribute("data-section") || "");
        }
      });

      setVisibleSections(newVisibleSections);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section
        data-section="hero"
        className={`min-h-screen flex items-center justify-center px-4 transition-all duration-1000 ${
          visibleSections.has("hero")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div
            className="space-y-6"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block text-foreground">Your Career Journey</span>
              <span className="block text-primary">Starts Here</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect with top employers, discover opportunities, and launch
              your career with KU's trusted professional network.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              onClick={() => (window.location.href = "/register")}
              size="lg"
              className="w-full sm:w-auto h-14 text-lg bg-primary hover:bg-primary/90 px-8 group"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 text-lg px-8 border-border hover:bg-muted"
            >
              How It Works
            </Button>
          </div>

          <div className="mt-12 flex justify-center">
            <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        data-section="stats"
        className={`py-20 px-4 bg-card/50 transition-all duration-1000 delay-200 ${
          visibleSections.has("stats")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto"></div>
      </section>

      {/* Features Section */}
      <section
        data-section="features"
        className={`py-20 px-4 transition-all duration-1000 delay-300 ${
          visibleSections.has("features")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose KU-Connect?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The premier platform connecting KU talent with meaningful
              opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: "For Students",
                description:
                  "Access exclusive opportunities, build your profile, and connect with top employers looking for KU talent.",
                features: [
                  "Personalized job matches",
                  "Career resources",
                  "Alumni network",
                ],
              },
              {
                icon: Building2,
                title: "For Employers",
                description:
                  "Find qualified candidates from one of Thailand's top universities. Post jobs and manage applications seamlessly.",
                features: [
                  "Verified talent pool",
                  "Advanced filtering",
                  "Direct messaging",
                ],
              },
              {
                icon: Shield,
                title: "Trusted Platform",
                description:
                  "University-backed verification ensures quality connections and protects all users in the hiring process.",
                features: [
                  "Identity verification",
                  "Safe messaging",
                  "Quality assurance",
                ],
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                  visibleSections.has("features")
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150 + 400}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        data-section="how-it-works"
        className={`py-20 px-4 bg-muted/30 transition-all duration-1000 delay-500 ${
          visibleSections.has("how-it-works")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and find your perfect opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your account with KU Gmail verification",
              },
              {
                step: "2",
                title: "Build Profile",
                description: "Showcase your skills and experience",
              },
              {
                step: "3",
                title: "Explore",
                description: "Browse jobs and discover opportunities",
              },
              {
                step: "4",
                title: "Connect",
                description: "Apply and connect with employers",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center"
                style={{ transitionDelay: `${index * 100 + 600}ms` }}
              >
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        data-section="testimonials"
        className={`py-20 px-4 transition-all duration-1000 delay-700 ${
          visibleSections.has("testimonials")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear from our community of students and employers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Computer Engineering '24",
                company: "Tech Corp",
                content:
                  "KU-Connect helped me land my dream internship. The platform made it easy to find relevant opportunities and connect with recruiters.",
                rating: 5,
              },
              {
                name: "John Smith",
                role: "HR Manager",
                company: "StartupHub",
                content:
                  "We've hired several talented KU students through this platform. The quality of candidates is exceptional and the process is seamless.",
                rating: 5,
              },
              {
                name: "Emily Johnson",
                role: "Software Engineering '23",
                company: "Digital Agency",
                content:
                  "The personalized job recommendations and career resources helped me prepare for interviews and land a great position.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                  visibleSections.has("testimonials")
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150 + 800}ms` }}
              >
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        data-section="cta"
        className={`py-20 px-4 bg-primary text-primary-foreground transition-all duration-1000 delay-900 ${
          visibleSections.has("cta")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-xl opacity-90">
            Join thousands of students and employers building meaningful
            connections
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => (window.location.href = "/register")}
              size="lg"
              variant="secondary"
              className="h-14 text-lg px-8 group"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-lg px-8 border-primary-foreground/20 text-accent hover:bg-primary-foreground/10"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
