import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";

const sections = [
  {
    title: "Information we collect",
    items: [
      "Identity and contact details such as your name, surname, email, and phone number.",
      "Profile information you provide in your resume, job preferences, or portfolio.",
      "Documents you upload, including resumes, transcripts, and verification files.",
      "Application activity such as the jobs you view, apply to, or save.",
    ],
  },
  {
    title: "How we use your information",
    items: [
      "To create and secure your KU Connect account.",
      "To match you with relevant jobs and employer opportunities.",
      "To power core platform features, analytics, and service improvements.",
      "To communicate about applications, interviews, and account updates.",
      "We retain your personal data only as long as your KU Connect account is active or as required by law.",
      "We share limited information with verified employers and authorized university staff only for job-matching and platform support purposes.",
    ],
  },
  {
    title: "Your privacy rights",
    items: [
      "Access – request a copy of the personal data we store about you.",
      "Correction – update inaccurate or incomplete profile information.",
      "Deletion – permanently delete your account and personal data at any time.",
      "Questions – contact our privacy team for any PDPA/GDPR inquiries.",
    ],
  },
];

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const hasHistory =
      typeof window !== "undefined" ? window.history.length > 1 : false;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Privacy &amp; Data Protection
          </p>
          <h1 className="text-3xl font-bold">KU Connect Privacy Policy</h1>
          <p className="text-muted-foreground">
            KU Connect only collects the information needed to operate a secure
            job-matching platform for Kasetsart University students, alumni, and
            verified employers. This page explains what we collect, how we use
            it, and the controls you have under PDPA/GDPR.
          </p>
        </header>

        <section className="space-y-6 rounded-2xl border border-border bg-card/60 p-6">
          {sections.map((section) => (
            <article key={section.title} className="space-y-2">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold">Need help with your data?</h2>
          <p className="mt-2 text-muted-foreground">
            You can update most information directly from your profile. To
            delete your account, visit the account settings page and use the
            “Delete my account” option. For other privacy questions, contact our
            support team at{" "}
            <a
              href="mailto:privacy@ku-connect.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              privacy@ku-connect.com
            </a>
            .
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Looking to head back?{" "}
            <Link
              to="/"
              onClick={handleBackClick}
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Return to KU Connect
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
