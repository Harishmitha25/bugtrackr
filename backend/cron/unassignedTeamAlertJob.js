const cron = require("node-cron");
const { sendEmail } = require("../services/emailService");
const Bug = require("../models/BugReportSchema");

//Bugs not assigned to a team for 2 hours will be alerted
const UNASSIGNED_HOURS = 2;

//Runs every 2 hours from 9AM to 5PM on weekdays
const runUnassignedBugAlertJob = () => {
  cron.schedule("0 9-17/2 * * 1-5", async () => {
    try {
      //Get the time that was 2 hours ago
      const threshold = new Date(
        Date.now() - UNASSIGNED_HOURS * 60 * 60 * 1000
      );

      //Get unasisgned bugs that was created before the threshold time
      const unassignedBugs = await Bug.find({
        assignedTeam: "unassigned",
        createdAt: { $lt: threshold },
      });

      if (unassignedBugs.length === 0) {
        console.log("No unassigned bugs older than 2 hours.");
        return;
      }

      const bugList = unassignedBugs
        .map((bug) => `${bug.bugId} - ${bug.title}`)
        .join("<br>");
      await sendEmail({
        toEmail: "adm1n.bugtrackr@gmail.com",
        subject: "Unassigned Bugs Alert",
        html: `
          <p>Dear Admin,</p>
          <p>The following bugs have not been assigned to any team for over 2 hours</p>
          <p>${bugList}</p>
        `,
      });
    } catch (err) {
      console.error("Failed to run unassigned team alert job ", err.message);
    }
  });
};

module.exports = { runUnassignedBugAlertJob };
