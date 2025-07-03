const cron = require("node-cron");
const { sendEmail } = require("../services/emailService");
const Bug = require("../models/BugReportSchema");
const User = require("../models/UserSchema");

//Critical bug closure request not acted upon for more than 2 hours will be alerted
const CRITICAL_CLOSURE_ALERT_HOURS = 2;

const runCriticalBugClosureAlertJob = () => {
  //Runs every 2 hours from 9AM to 5PM on weekdays
  cron.schedule("0 9-17/2 * * 1-5", async () => {
    try {
      const threshold = new Date(
        Date.now() - CRITICAL_CLOSURE_ALERT_HOURS * 60 * 60 * 1000
      );

      //Find critical bugs in Ready For Closure status
      const criticalBugs = await Bug.find({
        priority: "Critical",
        status: "Ready For Closure",
        statusLastUpdated: { $lt: threshold },
      });

      if (criticalBugs.length === 0) {
        console.log("No critical bugs to alert for closure.");
        return;
      }

      //Notify the team lead and admin
      const emialMap = {};

      for (const bug of criticalBugs) {
        const { bugId, title, application, assignedTeam } = bug;
        const summary = `${bugId} - ${title}`;

        const lead = await User.findOne({
          "roles.application": application,
          "roles.team": assignedTeam,
          "roles.role": "teamlead",
        }).select("fullName email");

        if (lead) {
          if (!emialMap[lead.email])
            emialMap[lead.email] = { name: lead.fullName, bugs: [] };
          emialMap[lead.email].bugs.push(summary);
        }
      }

      const adminEmail = "adm1n.bugtrackr@gmail.com";
      const adminName = "Admin";
      const adminBugSummaries = criticalBugs.map(
        (bug) => `${bug.bugId} - ${bug.title}`
      );
      emialMap[adminEmail] = {
        name: adminName,
        bugs: adminBugSummaries,
      };

      //Send Emails
      for (const email in emialMap) {
        const { name, bugs } = emialMap[email];
        await sendEmail({
          toEmail: email,
          subject: "Urgent- Critical Bugs Waiting for Closure",
          html: `
            <p>Dear ${name},</p>
            <p>The following Critical bugs have been in "Ready for Closure" status for more than ${CRITICAL_CLOSURE_ALERT_HOURS} hours:</p>
            <ul>${bugs.map((b) => `<li>${b}</li>`).join("")}</ul>
            <p><strong>Please take action soon to close them or send them back for refixing/retesting.</strong></p>
          `,
        });
      }
    } catch (err) {
      console.error(
        "Failed to run critical bug closure alert job",
        err.message
      );
    }
  });
};

module.exports = { runCriticalBugClosureAlertJob };
