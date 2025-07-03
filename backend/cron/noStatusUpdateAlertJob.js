const cron = require("node-cron");
const Bug = require("../models/BugReportSchema");
const User = require("../models/UserSchema");
const { sendEmail } = require("../services/emailService");

//Bugs not updated for 24 hours will be alerted
const ALERT_AFTER_HOURS = 24;

const runNoStatusAlertJob = () => {
  //Runs every day at 10am on weekdays
  cron.schedule("0 10 * * 1-5", async () => {
    try {
      //Get the time that was 24 hours ago
      const deadlineTime = new Date(
        Date.now() - ALERT_AFTER_HOURS * 60 * 60 * 1000
      );

      //Find bugs that are not updated recently and not already closed or marked as duplicate
      const oldBugs = await Bug.find({
        statusLastUpdated: { $lt: deadlineTime },
        status: { $nin: ["Closed", "Duplicate"] },
      });

      if (oldBugs.length === 0) {
        console.log("No bugs to alert for status update.");
        return;
      }

      const emialMap = {};
      for (const bug of oldBugs) {
        const { bugId, title, application, assignedTeam, status, assignedTo } =
          bug;

        const summary = `${bugId} - ${title} (Status: ${status})`;

        //Notify the developer
        if (assignedTo?.developer) {
          const dev = await User.findOne({
            email: assignedTo.developer,
          }).select("fullName email");
          if (dev) {
            if (!emialMap[dev.email]) {
              emialMap[dev.email] = { name: dev.fullName, bugs: [] };
            }
            emialMap[dev.email].bugs.push(summary);
          }
        }

        //Notify the tester
        if (assignedTo?.tester) {
          const tester = await User.findOne({
            email: assignedTo.tester,
          }).select("fullName email");
          if (tester) {
            if (!emialMap[tester.email]) {
              emialMap[tester.email] = { name: tester.fullName, bugs: [] };
            }
            emialMap[tester.email].bugs.push(summary);
          }
        }

        //Notify the team lead
        const lead = await User.findOne({
          "roles.application": application,
          "roles.team": assignedTeam,
          "roles.role": "teamlead",
        }).select("fullName email");

        if (lead) {
          if (!emialMap[lead.email]) {
            emialMap[lead.email] = { name: lead.fullName, bugs: [] };
          }
          emialMap[lead.email].bugs.push(summary);
        }
      }

      //Notify the admin(get all bugs)
      const adminEmail = "adm1n.bugtrackr@gmail.com";
      const adminName = "Admin";
      const adminBugSummaries = oldBugs.map(
        (bug) => `${bug.bugId} - ${bug.title} (Status: ${bug.status})`
      );
      emialMap[adminEmail] = {
        name: adminName,
        bugs: adminBugSummaries,
      };

      //Send emails
      for (const email in emialMap) {
        const { name, bugs } = emialMap[email];

        await sendEmail({
          toEmail: email,
          subject: "No Status Update Alert",
          html: `
            <p>Dear ${name},</p>
            <p>The following bugs havent had a status update in the last ${ALERT_AFTER_HOURS} hours</p>
            <ul>
              ${bugs.map((b) => `<li>${b}</li>`).join("")}
            </ul>
            <p>Please review them.</p>
          `,
        });
      }
    } catch (err) {
      console.error(
        "Failed to run no status update bug alert job ",
        err.message
      );
    }
  });
};

module.exports = { runNoStatusAlertJob };
