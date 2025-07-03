import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import UserDashboard from "./UserDashboard";
import DeveloperDashboard from "./DeveloperDashboard";
import TesterDashboard from "./TesterDashboard";
import TeamLeadDashboard from "./TeamLeadDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);

  const [selectedActivity, setSelectedActivity] = useState("Report a Bug");
  const [selectedBugId, setSelectedBugId] = useState(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("primaryRole"));
    setUserName(localStorage.getItem("loggedInUserFullName"));
  }, []);

  const handleActivityChange = (activity) => {
    console.log(activity);
    setSelectedActivity(activity);
    setSelectedBugId(null);
  };
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header userName={userName} userRole={userRole} />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar
          userRole={userRole}
          setSelectedActivity={handleActivityChange}
          selectedActivity={selectedActivity}
        />
        <div className="flex-1 flex flex-col h-full overflow-hidden p-5">
          <div className="bg-white shadow-md rounded-md flex-1 overflow-auto p-6">
            {userRole === "user" && (
              <UserDashboard
                selectedActivity={selectedActivity}
                onSelectBug={setSelectedBugId}
              />
            )}
            {userRole === "developer" && (
              <DeveloperDashboard
                selectedActivity={selectedActivity}
                onSelectBug={setSelectedBugId}
              />
            )}
            {userRole === "tester" && (
              <TesterDashboard
                selectedActivity={selectedActivity}
                onSelectBug={setSelectedBugId}
              />
            )}
            {userRole === "teamlead" && (
              <TeamLeadDashboard
                selectedActivity={selectedActivity}
                onSelectBug={setSelectedBugId}
              />
            )}
            {userRole === "admin" && (
              <AdminDashboard
                selectedActivity={selectedActivity}
                onSelectBug={setSelectedBugId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
