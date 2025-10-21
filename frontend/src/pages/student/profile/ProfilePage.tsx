import { useState } from "react";
import { useParams } from "react-router-dom";
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileTab from "./components/ProfileTab";
import JobPreferencesTab from "./components/JobPreferencesTab";

const StudentProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<"profile" | "job-preferences">(
    "profile"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar is always visible */}
        <ProfileSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userId={userId}
        />

        {/* Tab content */}
        <main className="flex-1 p-8">
          {activeTab === "profile" ? (
            <ProfileTab userId={userId} />
          ) : (
            <JobPreferencesTab />
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentProfilePage;
