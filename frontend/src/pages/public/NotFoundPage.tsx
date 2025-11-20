import { Link } from "react-router-dom";
import { Home, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NotFoundPage = () => {
  const reminders = [
    {
      title: "Double-check the link",
      detail: "A quick glance at the URL often fixes accidental typos or outdated bookmarks.",
    },
    {
      title: "Start fresh from home",
      detail:
        "Use the primary navigation on the homepage to reach dashboards, profiles, or job listings.",
    },
    {
      title: "Need a hand?",
      detail: "Let us know if you believe this page should exist and we’ll investigate.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5f0] px-4 py-16 text-slate-900">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-sm">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400">
            <span>KU CONNECT</span>
            <span className="text-slate-300">/</span>
            <span>WAYFINDING</span>
          </div>

          <div className="mt-6 space-y-5">
            <Badge
              variant="outline"
              className="rounded-full border-slate-200 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-500"
            >
              404 not found
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900">
                We couldn&apos;t find that page.
              </h1>
              <p className="text-base leading-relaxed text-slate-600">
                The link you followed may have moved, been renamed, or isn&apos;t available anymore.
                Try the suggestions below or head back to a familiar place.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {reminders.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 px-5 py-4 transition hover:border-slate-300"
              >
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-2xl">
              <Link to="/">
                <Home className="mr-2 size-4" />
                Back to home
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 rounded-2xl text-slate-600 hover:bg-slate-50"
            >
              <a href="mailto:support@ku-connect.com">
                <Mail className="mr-2 size-4" />
                Contact support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
