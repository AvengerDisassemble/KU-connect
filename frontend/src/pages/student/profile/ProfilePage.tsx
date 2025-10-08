import { useState } from "react";
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileTab from "./components/ProfileTab";
import JobPreferencesTab from "./components/JobPreferencesTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "job-preferences">(
    "profile"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar is always visible */}
        <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        <main className="flex-1 p-8">
          {activeTab === "profile" ? <ProfileTab /> : <JobPreferencesTab />}
        </main>
      </div>
    </div>
  );
};

export default Index;
