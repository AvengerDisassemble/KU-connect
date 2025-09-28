import { useState } from "react";
import ProfileSidebar from "@/components/ProfileSidebar";
import ProfileTab from "@/components/ProfileTab";
import JobPreferencesTab from "@/components/JobPreferencesTab";

const StudentProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "job-preferences">("profile");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <ProfileSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 p-8">
          {activeTab === "profile" ? <ProfileTab /> : <JobPreferencesTab />}
        </main>
      </div>
    </div>
  );
};

export default StudentProfilePage;
