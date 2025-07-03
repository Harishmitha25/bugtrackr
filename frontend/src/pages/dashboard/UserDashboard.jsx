import React, { useState, useEffect } from "react";
import ReportedBugsList from "../bugs/ReportedBugs/ReportedBugsList";
import ReportedBugDetails from "../bugs/ReportedBugs/ReportedBugDetails";
import BugReportFormUser from "../bugs/SubmitBugReport/BugReportFormUser";

const UserDashboard = ({ selectedActivity }) => {
  const [selectedBugId, setSelectedBugId] = useState(null);

  //reset bug id to null when the activity changes
  useEffect(() => {
    setSelectedBugId(null);
  }, [selectedActivity]);
  return (
    <div>
      {selectedBugId ? (
        <ReportedBugDetails
          bugId={selectedBugId}
          onClickingBack={() => setSelectedBugId(null)}
        />
      ) : selectedActivity === "Report a Bug" ? (
        <BugReportFormUser />
      ) : selectedActivity === "View Reported Bugs" ? (
        <ReportedBugsList onSelectBug={setSelectedBugId} />
      ) : (
        <p>Select an option</p>
      )}
    </div>
  );
};

export default UserDashboard;
