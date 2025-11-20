import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.png";

const navLinks = [
  { label: "Students", href: "#students" },
  { label: "Employers", href: "#employers" },
  { label: "Career Center", href: "#career-center" },
];

const highlightMetrics = [
  { value: "42K+", label: "Active KU students" },
  { value: "320+", label: "Partner employers" },
  { value: "12", label: "Faculties represented" },
];

const jobCards = [
  {
    role: "Product Design Intern",
    company: "TikTok",
    location: "Bangkok · Hybrid",
    tags: ["Design", "Internship"],
  },
  {
    role: "Software Engineer",
    company: "Meta",
    location: "Remote · Asia",
    tags: ["Full-time", "React"],
  },
  {
    role: "Marketing Analyst",
    company: "Spotify",
    location: "Singapore",
    tags: ["Growth", "Data"],
  },
  {
    role: "People Operations",
    company: "Grab",
    location: "Bangkok",
    tags: ["People", "Graduate"],
  },
];

const featureCards = [
  {
    title: "Guided student journeys",
    copy: "Playbooks, reminders, and curated roles help KU students focus on what actually moves the needle.",
  },
  {
    title: "Employer-ready tools",
    copy: "Share updates, review profiles, and nudge shortlists from one shared workspace built for hiring teams.",
  },
  {
    title: "Career center clarity",
    copy: "Dashboards show which cohorts engaged, who needs support, and how outcomes improve over time.",
  },
];

const guidePoints = [
  "Verified KU accounts keep the community focused and safe.",
  "Smart job boards remix roles, events, and faculty resources.",
  "Integrated messaging means fewer tabs for recruiters and students.",
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
  viewport: { once: true, amount: 0.4 },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f6f5f0] text-[#1c1d17]">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f5f0]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
          <img src={Logo} alt="KU Connect" className="h-10 w-auto" />
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="transition hover:text-[#1c1d17]">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-[#1c1d17] hover:bg-gray-100 hover:text-[#1c1d17]"
              onClick={() => (window.location.href = "/login")}
            >
              Sign in
            </Button>
            <Button
              className="hidden h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:inline-flex"
              onClick={() => (window.location.href = "/register")}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-24 pt-12 md:px-6">
        <motion.section
          id="students"
          {...fadeUp}
          className="mx-auto grid max-w-6xl gap-12 rounded-[32px] border border-slate-200 bg-white px-6 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Kasetsart University Careers</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-[#1b1c13] sm:text-5xl">
              A calm space for KU students, employers, and advisors to meet.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Discover curated opportunities, stay close to your faculty career teams, and hire verified talent with less noise.
              Simple tools, shared context, and a neutral palette keep the focus on the work ahead.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                className="h-12 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/register?role=student")}
              >
                Explore roles <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-full border border-slate-300 bg-white px-8 text-base font-semibold text-[#1c1d17] hover:bg-white"
                onClick={() => (window.location.href = "/register?role=employer")}
              >
                I hire KU talent
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {highlightMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-[#f9f8f3] p-4">
                  <p className="text-2xl font-semibold text-[#1b1c13]">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fdfcf8] p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Weekly highlight</p>
              <h3 className="mt-4 text-2xl font-semibold text-[#1b1c13]">A board that feels handcrafted</h3>
              <p className="mt-3 text-sm text-slate-600">
                Each student sees roles, events, and nudges selected by their faculty mentors. Employers see trusted profiles without digging through feeds.
              </p>
            </div>
            <div className="space-y-4">
              {jobCards.slice(0, 2).map((job) => (
                <div key={job.role} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    <span>{job.company}</span>
                    <span>{job.location}</span>
                  </div>
                  <p className="mt-4 text-xl font-semibold text-[#1b1c13]">{job.role}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    {job.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-200 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="mx-auto mt-16 max-w-6xl border-y border-slate-200/80 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">Trusted by hiring teams</p>
          <p className="mt-4 text-sm text-slate-600">
            KU faculties, research centers, and partner employers rely on KU Connect to run recruiting moments with calm,
            shared context.
          </p>
        </section>

        <motion.section
          id="career-center"
          {...fadeUp}
          className="mx-auto mt-16 max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Career teams</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-semibold text-[#1b1c13]">Modern guidance, but still personal.</h2>
              <p className="mt-4 text-slate-600">
                KU advisors share templates, track check-ins, and collaborate with employers in one tranquil dashboard. Everyone stays aligned without extra slides or messages.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#f9f8f3] p-6">
              <blockquote className="text-lg text-[#1b1c13]">“Our students finally have a home that feels like KU. Clean, helpful, and calm.”</blockquote>
              <p className="mt-6 text-sm font-medium text-[#1b1c13]">Career Studio KU</p>
              <p className="text-sm text-slate-600">Faculty of Engineering</p>
            </div>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            {guidePoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#b2bb1e]" />
                {point}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section id="jobs" {...fadeUp} className="mx-auto mt-16 max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Opportunities</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1b1c13]">Fresh roles added every week.</h2>
            </div>
            <Button
              variant="ghost"
              className="h-11 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-[#1c1d17] hover:bg-white"
              onClick={() => (window.location.href = "/jobs")}
            >
              View board
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {jobCards.map((job) => (
              <article key={job.role} className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  <span>{job.company}</span>
                  <span>{job.location}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#1b1c13]">{job.role}</h3>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section id="employers" {...fadeUp} className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Toolkit</p>
                <h3 className="mt-4 text-xl font-semibold text-[#1b1c13]">{card.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{card.copy}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} className="mx-auto mt-16 max-w-5xl rounded-[32px] border border-slate-200 bg-white px-8 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Ready?</p>
          <h3 className="mt-4 text-3xl font-semibold text-[#1b1c13]">Open the door to KU careers.</h3>
          <p className="mt-4 text-slate-600">
            Create your space in minutes. Invite teammates, send your first posting, or share the board with your cohort.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              className="h-12 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => (window.location.href = "/register")}
            >
              Create account
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-full border border-slate-300 bg-white px-8 text-base font-semibold text-[#1c1d17] hover:bg-white"
              onClick={() => (window.location.href = "mailto:support@kuconnect.co")}
            >
              Talk with our team
            </Button>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200/80 bg-[#f6f5f0] px-4 py-12 text-sm text-slate-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-[#1c1d17]">KU Connect</p>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Kasetsart University. Built for students, employers, and advisors.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
            {navLinks.map((link) => (
              <a key={`footer-${link.label}`} href={link.href} className="hover:text-[#1c1d17]">
                {link.label}
              </a>
            ))}
            <a href="mailto:support@kuconnect.co" className="hover:text-[#1c1d17]">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
