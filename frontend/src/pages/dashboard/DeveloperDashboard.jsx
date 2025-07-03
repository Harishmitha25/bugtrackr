import React, { useState, useEffect } from "react";
import ReportedBugsList from "../bugs/ReportedBugs/ReportedBugsList";
import ReportedBugDetails from "../bugs/ReportedBugs/ReportedBugDetails";
import BugReportFormDeveloper from "../bugs/SubmitBugReport/BugReportFormDeveloper";
import DeveloperAssignedBugsList from "../bugs/AssignedBugs/DeveloperAssignedBugsList";
import ReallocationRequests from "../bugs/ReallocationRequests/ReallocationRequests";
import DeveloperFixedBugs from "../bugs/AssignedBugs/DeveloperFixedBugs";
import ReopenRequests from "../bugs/ReopenRequests/ReopenRequests";
import MentionedBugsList from "../bugs/MentionedBugs/MentionedBugsList";
import MentionedBugsDetials from "../bugs/MentionedBugs/MentionedBugsDetials";
import DeveloperAnalytics from "../bugs/Analytics/DeveloperAnalytics";

const DeveloperDashboard = ({ selectedActivity }) => {
  const [selectedBugId, setSelectedBugId] = useState(null);

  //reset bug id to null when the activity changes
  useEffect(() => {
    setSelectedBugId(null);
  }, [selectedActivity]);
  return (
    <div>
      {selectedBugId ? (
        selectedActivity === "View Mentioned Bugs" ? (
          <MentionedBugsDetials
            bugId={selectedBugId}
            onClickingBack={() => setSelectedBugId(null)}
          />
        ) : (
          <ReportedBugDetails
            bugId={selectedBugId}
            onClickingBack={() => setSelectedBugId(null)}
          />
        )
      ) : selectedActivity === "Report a Bug" ? (
        <BugReportFormDeveloper />
      ) : selectedActivity === "View Reported Bugs" ? (
        <ReportedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Assigned Bugs" ? (
        <DeveloperAssignedBugsList />
      ) : selectedActivity === "Reallocation Requests" ? (
        <ReallocationRequests />
      ) : selectedActivity === "Fixed Bugs" ? (
        <DeveloperFixedBugs />
      ) : selectedActivity === "Reopen Requests" ? (
        <ReopenRequests />
      ) : selectedActivity === "View Mentioned Bugs" ? (
        <MentionedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Analytics" ? (
        <DeveloperAnalytics />
      ) : (
        <p>Select an option</p>
      )}
    </div>
  );
};

export default DeveloperDashboard;
