import { NavLink } from "react-router-dom";

export default function EmployerSidebar() {
  const navItems = [
    { label: "Dashboard",            to: "/employer",                     end: true  },
    { label: "Post New Job",         to: "/employer/job-postings/create", end: true  },
    { label: "Company Profile",      to: "/employer/profile",             end: true  },
    { label: "Preview Job Listings", to: "/employer/job-postings",        end: true },
    { label: "Settings",             to: "/employer/settings",            end: true  },
  ] as const;

  return (
    <aside className="w-60 bg-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-8 pt-12 border-b border-gray-200 text-center">
        <div className="text-2xl font-bold">
          <span className="text-brand-teal">K</span>
          <span className="text-brand-lime">U</span>{" "}
          <span className="text-black">Connect</span>
        </div>
        <div className="text-sm text-brand-lime font-medium">for employer</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 space-y-2 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
                `block px-8 py-4 font-medium transition-colors border-l-3 ${
                    isActive
                    ? "bg-teal-700 text-white border-l-brand-lime"
                    : "text-gray-600 hover:bg-gray-50 border-l-transparent"
                }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
