import React, { useState, useEffect } from "react";
import ReportedBugsList from "../bugs/ReportedBugs/ReportedBugsList";
import ReportedBugDetails from "../bugs/ReportedBugs/ReportedBugDetails";
import BugReportFormTeamLead from "../bugs/SubmitBugReport/BugReportFormTeamLead";
import TeamAssignedBugsList from "../bugs/AssignedBugs/TeamAssignedBugsList";
import TeamAssignedBugDetails from "../bugs/AssignedBugs/TeamAssignedBugDetails";
import TeamLeadReallocationRequests from "../bugs/ReallocationRequests/TeamLeadReallocationRequests";
import TeamLeadReopenRequests from "../bugs/ReopenRequests/TeamLeadReopenRequests";
import MentionedBugsList from "../bugs/MentionedBugs/MentionedBugsList";
import MentionedBugsDetials from "../bugs/MentionedBugs/MentionedBugsDetials";
import TeamLeadAnalytics from "../bugs/Analytics/TeamLeadAnalytics";

const TeamLeadDashboard = ({ selectedActivity }) => {
  const [selectedBugId, setSelectedBugId] = useState(null);

  //reset bug id to null when the activity changes
  useEffect(() => {
    setSelectedBugId(null);
  }, [selectedActivity]);
  return (
    <div>
      {selectedBugId ? (
        selectedActivity === "Bugs Assigned to Team" ? (
          <TeamAssignedBugDetails
            bugId={selectedBugId}
            onClickingBack={() => setSelectedBugId(null)}
          />
        ) : selectedActivity === "View Mentioned Bugs" ? (
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
        <BugReportFormTeamLead />
      ) : selectedActivity === "View Reported Bugs" ? (
        <ReportedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "Bugs Assigned to Team" ? (
        <TeamAssignedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "Reallocation Requests" ? (
        <TeamLeadReallocationRequests />
      ) : selectedActivity === "Reopen Requests" ? (
        <TeamLeadReopenRequests />
      ) : selectedActivity === "View Mentioned Bugs" ? (
        <MentionedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Analytics" ? (
        <TeamLeadAnalytics />
      ) : (
        <p>Select an option</p>
      )}
    </div>
  );
};

export default TeamLeadDashboard;
