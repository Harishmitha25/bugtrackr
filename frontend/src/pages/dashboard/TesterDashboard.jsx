import React, { useState, useEffect } from "react";
import ReportedBugsList from "../bugs/ReportedBugs/ReportedBugsList";
import ReportedBugDetails from "../bugs/ReportedBugs/ReportedBugDetails";
import BugReportFormTester from "../bugs/SubmitBugReport/BugReportFormTester";
import TesterAssignedBugsList from "../bugs/AssignedBugs/TesterAssignedBugsList";
import ReallocationRequests from "../bugs/ReallocationRequests/ReallocationRequests";
import TesterTestedBugs from "../bugs/AssignedBugs/TesterTestedBugs";
import ReopenRequests from "../bugs/ReopenRequests/ReopenRequests";
import MentionedBugsList from "../bugs/MentionedBugs/MentionedBugsList";
import MentionedBugsDetials from "../bugs/MentionedBugs/MentionedBugsDetials";
import TesterAnalytics from "../bugs/Analytics/TesterAnalytics";

const TesterDashboard = ({ selectedActivity }) => {
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
        <BugReportFormTester />
      ) : selectedActivity === "View Reported Bugs" ? (
        <ReportedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Assigned Bugs" ? (
        <TesterAssignedBugsList />
      ) : selectedActivity === "Reallocation Requests" ? (
        <ReallocationRequests />
      ) : selectedActivity === "Tested Bugs" ? (
        <TesterTestedBugs />
      ) : selectedActivity === "Reopen Requests" ? (
        <ReopenRequests />
      ) : selectedActivity === "View Mentioned Bugs" ? (
        <MentionedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Analytics" ? (
        <TesterAnalytics />
      ) : (
        <p>Select an option</p>
      )}
    </div>
  );
};

export default TesterDashboard;
