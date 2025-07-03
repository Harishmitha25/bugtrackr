import React, { useState, useEffect } from "react";
import ReportedBugsList from "../bugs/ReportedBugs/ReportedBugsList";
import ReportedBugDetails from "../bugs/ReportedBugs/ReportedBugDetails";
import BugReportFormAdmin from "../bugs/SubmitBugReport/BugReportFormAdmin";
import BugsViewAdmin from "../bugs/AssignedBugs/BugsViewAdmin";
import AdminReallocationRequests from "../bugs/ReallocationRequests/AdminReallocationRequests";
import BugDetailsViewAdmin from "../bugs/AssignedBugs/BugDetailsViewAdmin";
import AdminReopenRequests from "../bugs/ReopenRequests/AdminReopenRequests";
import MentionedBugsList from "../bugs/MentionedBugs/MentionedBugsList";
import MentionedBugsDetials from "../bugs/MentionedBugs/MentionedBugsDetials";
import AdminAnalytics from "../bugs/Analytics/AdminAnalytics";

const AdminDashboard = ({ selectedActivity }) => {
  const [selectedBugId, setSelectedBugId] = useState(null);

  //reset bug id to null when the activity changes
  useEffect(() => {
    setSelectedBugId(null);
  }, [selectedActivity]);

  return (
    <div>
      {selectedBugId ? (
        selectedActivity === "View Team Assigned Bugs" ? (
          <BugDetailsViewAdmin
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
        <BugReportFormAdmin />
      ) : selectedActivity === "View Reported Bugs" ? (
        <ReportedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Team Assigned Bugs" ? (
        <BugsViewAdmin onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "Reallocation Requests" ? (
        <AdminReallocationRequests />
      ) : selectedActivity === "Reopen Requests" ? (
        <AdminReopenRequests />
      ) : selectedActivity === "View Mentioned Bugs" ? (
        <MentionedBugsList onSelectBug={setSelectedBugId} />
      ) : selectedActivity === "View Analytics" ? (
        <AdminAnalytics />
      ) : (
        <p>Select an option</p>
      )}
    </div>
  );
};

export default AdminDashboard;
