import React from "react";

const Sidebar = ({ userRole, selectedActivity, setSelectedActivity }) => {
  //The list of activities that can be performed by different user roles
  const activities = {
    user: ["Report a Bug", "View Reported Bugs"],
    developer: [
      "Report a Bug",
      "View Reported Bugs",
      "View Assigned Bugs",
      "View Mentioned Bugs",
      "Reallocation Requests",
      "Fixed Bugs",
      "Reopen Requests",
      "View Analytics",
    ],
    tester: [
      "Report a Bug",
      "View Reported Bugs",
      "View Assigned Bugs",
      "View Mentioned Bugs",
      "Reallocation Requests",
      "Tested Bugs",
      "Reopen Requests",
      "View Analytics",
    ],
    teamlead: [
      "Report a Bug",
      "View Reported Bugs",
      "Bugs Assigned to Team",
      "View Mentioned Bugs",
      "Reallocation Requests",
      "Reopen Requests",
      "View Analytics",
    ],
    admin: [
      "Report a Bug",
      "View Reported Bugs",
      "View Team Assigned Bugs",
      "View Mentioned Bugs",
      "Reallocation Requests",
      "Reopen Requests",
      "View Analytics",
    ],
  };

  return (
    <div className="w-64 bg-white text-black p-5 shadow-md">
      <ul className="space-y-2">
        {activities[userRole]?.map((activity, index) => (
          <li
            key={index}
            className={`p-3 rounded-md cursor-pointer transition-all duration-200 border border-gray-300 shadow-sm 
              ${
                selectedActivity === activity
                  ? "bg-primary text-white font-semibold shadow-md"
                  : "bg-gray-100 text-black hover:bg-primary hover:text-white"
              }`}
            onClick={() => setSelectedActivity(activity)}
          >
            {activity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
