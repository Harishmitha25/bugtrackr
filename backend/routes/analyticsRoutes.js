const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const BugReport = require("../models/BugReportSchema");
const User = require("../models/UserSchema");
const router = express.Router();
const dayjs = require("dayjs");

const {
  checkIfTeamLeadForAppAndTeam,
  checkIfDeveloperForAppAndTeam,
  checkIfTesterForAppAndTeam,
  checkIfAdmin,
} = require("../middlewares/bugMiddleware");

//API endpoint for team lead analytics
router.get(
  "/teamlead/:application/:team",
  authenticateUser,
  checkIfTeamLeadForAppAndTeam,
  async (req, res) => {
    try {
      //Get params and query which contains the details and filters (if provided) (from API call)
      const { application, team } = req.params;
      console.log(req.query);
      const {
        priority,
        developerEmail,
        testerEmail,
        status,
        startDate,
        endDate,
      } = req.query;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const userEmail = req.user.email;

      const user = await User.findOne({ email: userEmail });
      if (!user) return res.status(401).json({ error: "User not found" });

      //Check if the person getting the analytics is a team lead
      const isTeamLead = user.roles.some(
        (role) =>
          role.role === "teamlead" &&
          role.application === application &&
          role.team === team
      );

      if (!isTeamLead) {
        return res.status(403).json({
          error:
            "Unauthorized. You must be a team lead to can access analytics data.",
        });
      }

      //Get priority as array or single value
      const priorityArray = Array.isArray(priority)
        ? priority
        : priority
        ? [priority]
        : null;
      console.log(priority);

      //Filter for getting bugs with team lead's app and team
      const bugFilter = { application, assignedTeam: team };
      if (priorityArray?.length > 0) {
        bugFilter.priority = { $in: priorityArray };
      }

      //Get bugs with the filer
      const bugs = await BugReport.find(bugFilter);

      //Estimated hours for development and testing hours for each priority
      const PRIORITY_DEVELOPER_HOURS = {
        Critical: 6,
        High: 9,
        Medium: 3,
        Low: 1,
      };

      const PRIORITY_TESTER_HOURS = {
        Critical: 4,
        High: 5,
        Medium: 2,
        Low: 1,
      };

      //Current workload of developer and tester
      const devWorkload = {};
      const testerWorkload = {};

      bugs.forEach((bug) => {
        const { assignedTo, status, priority } = bug;

        if (!priority || !(priority in PRIORITY_DEVELOPER_HOURS)) return;
        if (priorityArray && !priorityArray.includes(priority)) return;

        //Developer workload (Assigned / Fix In Progress)
        if (
          assignedTo?.developer &&
          ["Assigned", "Fix In Progress"].includes(status) &&
          (!developerEmail || assignedTo.developer === developerEmail)
        ) {
          const dev = assignedTo.developer;
          const estHours = PRIORITY_DEVELOPER_HOURS[priority];

          if (!devWorkload[dev]) {
            devWorkload[dev] = {
              bugCount: 0,
              totalHours: 0,
              bugs: [],
            };
          }

          devWorkload[dev].bugCount++;
          devWorkload[dev].totalHours += estHours;
          devWorkload[dev].bugs.push({
            bugId: bug.bugId,
            priority,
            estimatedHours: estHours,
            status,
          });
        }

        console.log(
          JSON.stringify(devWorkload) +
            " skdjfnskd\n" +
            JSON.stringify(testerWorkload)
        );
        console.log("-------------------------------------------------");
        //Tester workload (Tester Assigned / Testing In Progress)
        if (
          assignedTo?.tester &&
          ["Tester Assigned", "Testing In Progress"].includes(status) &&
          (!testerEmail || assignedTo.tester === testerEmail)
        ) {
          const tester = assignedTo.tester;
          const estHours = PRIORITY_TESTER_HOURS[priority];

          if (!testerWorkload[tester]) {
            testerWorkload[tester] = {
              bugCount: 0,
              totalHours: 0,
              bugs: [],
            };
          }

          testerWorkload[tester].bugCount++;
          testerWorkload[tester].totalHours += estHours;
          testerWorkload[tester].bugs.push({
            bugId: bug.bugId,
            priority,
            estimatedHours: estHours,
            status,
          });
        }
      });

      //Bug Distribution

      const bugDistribution = {
        developers: {},
        testers: {},
      };

      bugs.forEach((bug) => {
        const { assignedTo } = bug;

        if (
          assignedTo?.developer &&
          (!developerEmail || assignedTo.developer === developerEmail)
        ) {
          const dev = assignedTo.developer;
          if (!bugDistribution.developers[dev]) {
            bugDistribution.developers[dev] = {
              Critical: 0,
              High: 0,
              Medium: 0,
              Low: 0,
            };
          }
          if (bug.priority) {
            bugDistribution.developers[dev][bug.priority]++;
          }
        }

        if (
          assignedTo?.tester &&
          (!testerEmail || assignedTo.tester === testerEmail)
        ) {
          const tester = assignedTo.tester;
          if (!bugDistribution.testers[tester]) {
            bugDistribution.testers[tester] = {
              Critical: 0,
              High: 0,
              Medium: 0,
              Low: 0,
            };
          }
          if (bug.priority) {
            bugDistribution.testers[tester][bug.priority]++;
          }
        }
      });

      //Fix efficiency (Developer)
      const fixEffiecincy = {};

      bugs.forEach((bug) => {
        const {
          assignedTo,
          priority,
          developerResolutionHours,
          changeHistory,
        } = bug;

        if (!assignedTo?.developer) return;
        if (developerEmail && assignedTo.developer !== developerEmail) return;
        if (priorityArray && !priorityArray.includes(priority)) return;
        if (
          developerResolutionHours === null ||
          developerResolutionHours === undefined
        )
          return;

        const fixedChange = changeHistory.find(
          (ch) => ch.newStatus === "Fixed (Testing Pending)"
        );
        //Apply date range based on when the bug was fixed
        if (fixedChange) {
          const fixedAt = new Date(fixedChange.changedOn);
          if (start && fixedAt < start) return;
          if (end && fixedAt > end) return;
        }

        const dev = assignedTo.developer;

        if (!fixEffiecincy[dev]) {
          fixEffiecincy[dev] = {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            bugs: [],
          };
        }

        fixEffiecincy[dev].count++;
        fixEffiecincy[dev].totalTime += developerResolutionHours;
        fixEffiecincy[dev].bugs.push({
          bugId: bug.bugId,
          priority,
          timeTakenHours: developerResolutionHours.toFixed(2),
        });
      });

      //Compute average
      for (const dev in fixEffiecincy) {
        const stat = fixEffiecincy[dev];
        stat.avgTime = (stat.totalTime / stat.count).toFixed(2);
      }

      //Validation Efficiency (Tester)
      const validationEfficiency = {};

      bugs.forEach((bug) => {
        const { assignedTo, priority, testerValidationHours, changeHistory } =
          bug;

        if (!assignedTo?.tester) return;
        if (testerEmail && assignedTo.tester !== testerEmail) return;
        if (priorityArray && !priorityArray.includes(priority)) return;

        let timeTakenHours = null;

        if (
          testerValidationHours !== null &&
          testerValidationHours !== undefined
        ) {
          timeTakenHours = testerValidationHours;
        } else {
          const fixedChange = changeHistory.find(
            (ch) => ch.newStatus === "Fixed (Testing Pending)"
          );
          const validatedChange = changeHistory.find(
            (ch) => ch.newStatus === "Tested & Verified"
          );

          if (!fixedChange || !validatedChange) return;

          const fixedAt = new Date(fixedChange.changedOn);
          const validatedAt = new Date(validatedChange.changedOn);

          timeTakenHours = (validatedAt - fixedAt) / (1000 * 60 * 60);
        }

        //Apply date range based on "Tested & Verified" timestamp
        const validatedChange = changeHistory.find(
          (ch) => ch.newStatus === "Tested & Verified"
        );
        if (validatedChange) {
          const validatedAt = new Date(validatedChange.changedOn);
          if (start && validatedAt < start) return;
          if (end && validatedAt > end) return;
        }

        const tester = assignedTo.tester;

        if (!validationEfficiency[tester]) {
          validationEfficiency[tester] = {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            bugs: [],
          };
        }

        validationEfficiency[tester].count++;
        validationEfficiency[tester].totalTime += timeTakenHours;
        validationEfficiency[tester].bugs.push({
          bugId: bug.bugId,
          priority,
          timeTakenHours: timeTakenHours.toFixed(2),
        });
      });

      //Compute average
      for (const tester in validationEfficiency) {
        const stat = validationEfficiency[tester];
        stat.avgTime = (stat.totalTime / stat.count).toFixed(2);
      }

      //Stuck on Assigned, Fix In Progress, Fixed, Testing Assigned and Testing In Progress
      const stuck = [];
      const threshold = req.query.threshold
        ? parseInt(req.query.threshold, 10)
        : 2; //in days

      bugs.forEach((bug) => {
        const { status, priority, assignedTo, statusLastUpdated } = bug;

        if (!statusLastUpdated) return;

        if (req.query.status && status !== req.query.status) return;
        if (priorityArray && !priorityArray.includes(priority)) return;
        if (developerEmail && assignedTo?.developer !== developerEmail) return;
        if (testerEmail && assignedTo?.tester !== testerEmail) return;

        const lastUpdatedAt = new Date(statusLastUpdated);
        const now = new Date();
        const diffDays = (now - lastUpdatedAt) / (1000 * 60 * 60 * 24);

        if (diffDays >= threshold) {
          stuck.push({
            bugId: bug.bugId,
            priority,
            currentStatus: status,
            assignedDeveloper: assignedTo?.developer || null,
            assignedTester: assignedTo?.tester || null,
            lastUpdated: lastUpdatedAt.toISOString(),
            daysStuck: Math.floor(diffDays),
          });
        }
      });

      //Resolution trend over days (Fixed, Verified, Cloed)
      const resolutionTrend = {};

      bugs.forEach((bug) => {
        const { assignedTo, priority, changeHistory } = bug;

        if (priorityArray && !priorityArray.includes(priority)) return;
        if (developerEmail && assignedTo?.developer !== developerEmail) return;

        const closedChange = changeHistory.find(
          (ch) => ch.newStatus === "Closed"
        );
        if (closedChange) {
          const closedAt = new Date(closedChange.changedOn);

          const isAfterStart = !start || closedAt >= start;
          const isBeforeEnd = !end || closedAt <= end;

          if (isAfterStart && isBeforeEnd) {
            const dateKey = closedAt.toISOString().split("T")[0];

            if (!resolutionTrend[dateKey]) {
              resolutionTrend[dateKey] = {
                closed: 0,
                fixed: 0,
                verified: 0,
              };
            }

            resolutionTrend[dateKey].closed =
              resolutionTrend[dateKey].closed + 1;
          }
        }

        const fixedChange = changeHistory.find(
          (ch) => ch.newStatus === "Fixed (Testing Pending)"
        );

        if (fixedChange) {
          const fixedAt = new Date(fixedChange.changedOn);

          const isAfterStart = !start || fixedAt >= start;
          const isBeforeEnd = !end || fixedAt <= end;

          if (isAfterStart && isBeforeEnd) {
            const dateKey = fixedAt.toISOString().split("T")[0];

            if (!resolutionTrend[dateKey]) {
              resolutionTrend[dateKey] = {
                closed: 0,
                fixed: 0,
                verified: 0,
              };
            }

            resolutionTrend[dateKey].fixed = resolutionTrend[dateKey].fixed + 1;
          }
        }

        const verifiedChange = changeHistory.find(
          (ch) => ch.newStatus === "Tested & Verified"
        );

        if (verifiedChange) {
          const verifiedAt = new Date(verifiedChange.changedOn);

          const isAfterStart = !start || verifiedAt >= start;
          const isBeforeEnd = !end || verifiedAt <= end;

          if (isAfterStart && isBeforeEnd) {
            const dateKey = verifiedAt.toISOString().split("T")[0];

            if (!resolutionTrend[dateKey]) {
              resolutionTrend[dateKey] = {
                closed: 0,
                fixed: 0,
                verified: 0,
              };
            }

            resolutionTrend[dateKey].verified =
              resolutionTrend[dateKey].verified + 1;
          }
        }
      });

      //SLA breaches (more than estimated housr)
      const devSlaBreaches = [];
      const testerSlaBreaches = [];

      bugs.forEach((bug) => {
        const {
          priority,
          assignedTo,
          changeHistory,
          developerResolutionHours,
          testerValidationHours,
        } = bug;

        if (!priority || !(priority in PRIORITY_DEVELOPER_HOURS)) return;
        if (priorityArray && !priorityArray.includes(priority)) return;

        if (
          assignedTo?.developer &&
          (!developerEmail || assignedTo.developer === developerEmail)
        ) {
          const startDev = changeHistory.find(
            (ch) =>
              ch.newStatus === "Assigned" || ch.newStatus === "Fix In Progress"
          );
          const endDev = changeHistory.find(
            (ch) => ch.newStatus === "Fixed (Testing Pending)"
          );

          if (startDev && endDev) {
            const startedAt = new Date(startDev.changedOn);
            const fixedAt = new Date(endDev.changedOn);

            if (start && fixedAt < start) return;
            if (end && fixedAt > end) return;

            const hoursTaken = developerResolutionHours;
            const allowedHours = PRIORITY_DEVELOPER_HOURS[priority];

            if (hoursTaken > allowedHours) {
              devSlaBreaches.push({
                bugId: bug.bugId,
                priority,
                assignedDeveloper: assignedTo.developer,
                startedAt: startedAt.toISOString(),
                fixedAt: fixedAt.toISOString(),
                hoursTaken: hoursTaken.toFixed(2),
                allowedHours,
              });
            }
          }
        }

        if (
          assignedTo?.tester &&
          (!testerEmail || assignedTo.tester === testerEmail)
        ) {
          const startTester = changeHistory.find(
            (ch) => ch.newStatus === "Fixed (Testing Pending)"
          );
          const endTester = changeHistory.find(
            (ch) => ch.newStatus === "Closed"
          );

          if (startTester && endTester) {
            const fixedAt = new Date(startTester.changedOn);
            const closedAt = new Date(endTester.changedOn);

            //Date range check based on closure time
            if (start && closedAt < start) return;
            if (end && closedAt > end) return;

            const hoursTaken = testerValidationHours;
            const allowedHours = PRIORITY_TESTER_HOURS[priority];

            if (hoursTaken > allowedHours) {
              testerSlaBreaches.push({
                bugId: bug.bugId,
                priority,
                assignedTester: assignedTo.tester,
                fixedAt: fixedAt.toISOString(),
                closedAt: closedAt.toISOString(),
                hoursTaken: hoursTaken.toFixed(2),
                allowedHours,
              });
            }
          }
        }
      });

      return res.status(200).json({
        devWorkload,
        testerWorkload,
        bugDistribution,
        fixEffiecincy,
        validationEfficiency,
        stuck,
        resolutionTrend,
        devSlaBreaches,
        testerSlaBreaches,
      });
    } catch (err) {
      console.error("Error ", err.message);
      res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  }
);
//API endpoint for developer summary
router.get(
  "/developer/summary/:developerEmail",
  authenticateUser,
  checkIfDeveloperForAppAndTeam,
  async (req, res) => {
    try {
      const { developerEmail } = req.params;
      const { application, team } = req.query;

      const dev = await User.findOne({ email: developerEmail });
      if (!dev) return res.status(404).json({ error: "Developer not found" });

      if (!application || !team)
        return res
          .status(400)
          .json({ error: "Developer is not assigned to any app/team" });

      //Get all the bugsassigned to the developer
      const allBugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.developer": developerEmail,
      });

      const fixedStatuses = [
        "Fixed (Testing Pending)",
        "Tester Assigned",
        "Testing In Progress",
        "Tested & Verified",
        "Closed",
      ];
      const fixedBugs = allBugs.filter((b) => fixedStatuses.includes(b.status));

      const totalFixed = fixedBugs.length;
      const totalAssigned = allBugs.length;

      const bugFixRate = totalAssigned
        ? ((totalFixed / totalAssigned) * 100).toFixed(1)
        : 0.0;
      console.log("Bug fix rate -------- " + bugFixRate);
      const timelyFixes = fixedBugs.filter((b) => {
        const expected = { Critical: 6, High: 9, Medium: 3, Low: 1 }[
          b.priority
        ];
        return (b.developerResolutionHours || 0) <= expected;
      });
      const timelyFixRate = totalFixed
        ? ((timelyFixes.length / totalFixed) * 100).toFixed(1)
        : 0.0;
      const priorities = ["Critical", "High", "Medium", "Low"];

      const fixRateByPriority = {};

      priorities.forEach((priority) => {
        const assigned = allBugs.filter((bug) => bug.priority === priority);
        const fixed = fixedBugs.filter((bug) => bug.priority === priority);

        const assignedCount = assigned.length;
        const fixedCount = fixed.length;

        if (assignedCount > 0) {
          const rate = (fixedCount / assignedCount) * 100;
          fixRateByPriority[priority] = rate.toFixed(1);
        }
      });
      console.log("fixRateByPriority" + JSON.stringify(fixRateByPriority));
      const workload = dev.roles.find(
        (r) =>
          r.role === "developer" &&
          r.application === application &&
          r.team === team
      )?.workloadHours;

      const response = {
        totalFixed: totalFixed,
        totalAssigned: totalAssigned,
        bugFixRate: parseFloat(bugFixRate),
        timelyFixRate: parseFloat(timelyFixRate),
        fixRateByPriority,
        workload: {
          current: workload,
          max: 40,
        },
      };
      return res.json(response);
    } catch (err) {
      console.error("Error ", err.message);
      return res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  }
);
//API endpoint for developer fix trend (number of bugs fixed each day)
router.get(
  "/developer/fix-trend/:developerEmail",
  authenticateUser,
  checkIfDeveloperForAppAndTeam,
  async (req, res) => {
    try {
      const { developerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const dev = await User.findOne({ email: developerEmail });
      if (!dev) {
        return res.status(404).json({ error: "Developer not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.developer": developerEmail,
      });

      const fixedStatuses = [
        "Fixed (Testing Pending)",
        "Tester Assigned",
        "Testing In Progress",
        "Tested & Verified",
        "Closed",
      ];

      const start = startDate ? dayjs(startDate) : dayjs().subtract(6, "day");
      const end = endDate ? dayjs(endDate) : dayjs();

      const rangeDays = end.diff(start, "day") + 1;

      const fixesOverTime = [];

      for (let i = 0; i < rangeDays; i++) {
        const date = dayjs(start).add(i, "day").format("YYYY-MM-DD");
        console.log("fix trend date value ----- " + date);
        let count = 0;

        bugs.forEach((bug) => {
          if (bug.changeHistory && Array.isArray(bug.changeHistory)) {
            bug.changeHistory.forEach((change) => {
              if (fixedStatuses.indexOf(change.newStatus) !== -1) {
                const fixedDate = dayjs(change.changedOn).format("YYYY-MM-DD");
                if (fixedDate === date) {
                  count++;
                }
              }
            });
          }
        });

        fixesOverTime.push({ date: date, count: count });
      }

      return res.json(fixesOverTime);
    } catch (err) {
      console.error("Error", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for developer average fix time
router.get(
  "/developer/avg-fix-time/:developerEmail",
  authenticateUser,
  checkIfDeveloperForAppAndTeam,
  async (req, res) => {
    try {
      const { developerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const developer = await User.findOne({ email: developerEmail });
      if (!developer) {
        return res.status(404).json({ error: "Developer not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.developer": developerEmail,
      });

      const fixedStatuses = [
        "Fixed (Testing Pending)",
        "Tester Assigned",
        "Testing In Progress",
        "Tested & Verified",
        "Closed",
      ];

      const start = startDate ? dayjs(startDate) : null;
      const end = endDate ? dayjs(endDate) : null;

      const filteredFixed = bugs.filter((bug) => {
        if (!fixedStatuses.includes(bug.status)) return false;
        if (bug.developerResolutionHours === undefined) return false;

        const fixedChange = bug.changeHistory.find(
          (ch) => ch.newStatus === "Fixed (Testing Pending)"
        );
        if (!fixedChange) return false;

        const fixedDate = dayjs(fixedChange.changedOn);
        if (start && fixedDate.isBefore(start)) return false;
        if (end && fixedDate.isAfter(end)) return false;

        return true;
      });

      const avgFixTimeByPriority = {};
      ["Critical", "High", "Medium", "Low"].forEach((priority) => {
        const bugsForPriority = filteredFixed.filter(
          (bug) => bug.priority === priority
        );

        let totalHours = 0;
        bugsForPriority.forEach((bug) => {
          totalHours += bug.developerResolutionHours || 0;
        });

        avgFixTimeByPriority[priority] = {
          avgHours: bugsForPriority.length
            ? parseFloat((totalHours / bugsForPriority.length).toFixed(2))
            : 0.0,
          count: bugsForPriority.length,
        };
      });

      return res.json(avgFixTimeByPriority);
    } catch (err) {
      console.error("Error", err.message);
      return res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  }
);

//API endpoint for developer sla breaches
router.get(
  "/developer/sla-breaches/:developerEmail",
  authenticateUser,
  checkIfDeveloperForAppAndTeam,
  async (req, res) => {
    try {
      const { developerEmail } = req.params;
      const { startDate, endDate, priority, application, team } = req.query;

      const developer = await User.findOne({ email: developerEmail });
      if (!developer) {
        return res.status(404).json({ error: "Developer not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.developer": developerEmail,
      });

      const SLA_HOURS = {
        Critical: 6,
        High: 9,
        Medium: 3,
        Low: 1,
      };

      const breaches = [];

      bugs.forEach((bug) => {
        const {
          changeHistory,
          priority: bugPriority,
          developerResolutionHours,
        } = bug;
        console.log(developerResolutionHours);
        if (!bugPriority || !SLA_HOURS[bugPriority]) return;
        if (priority && bugPriority !== priority) return;

        const assignedChange = changeHistory.find(
          (ch) =>
            ch.newStatus === "Assigned" || ch.newStatus === "Fix In Progress"
        );
        const fixedChange = changeHistory.find(
          (ch) => ch.newStatus === "Fixed (Testing Pending)"
        );

        if (!assignedChange || !fixedChange) return;

        const start = new Date(assignedChange.changedOn);
        const end = new Date(fixedChange.changedOn);

        if (startDate && new Date(startDate) > end) return;
        if (endDate && new Date(endDate) < start) return;

        //Using developerResolutionHours instead of timestamp difference necause it includes non-working hours, breaks, weekends, meetings etc.,
        const hoursTaken = developerResolutionHours;

        const allowedHours = SLA_HOURS[bugPriority];

        if (hoursTaken > allowedHours) {
          breaches.push({
            bugId: bug.bugId,
            title: bug.title,
            priority: bugPriority,
            startedAt: dayjs(start).format("DD/MM/YYYY - HH:mm"),
            fixedAt: dayjs(end).format("DD/MM/YYYY - HH:mm"),
            hoursTaken: hoursTaken,
            allowedHours,
          });
        }
      });

      return res.json(breaches);
    } catch (err) {
      console.error("Error ", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);
//API endpoint for developer status overview
router.get(
  "/developer/bug-status-overview/:developerEmail",
  authenticateUser,
  checkIfDeveloperForAppAndTeam,
  async (req, res) => {
    try {
      const { developerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const developer = await User.findOne({ email: developerEmail });
      if (!developer) {
        return res.status(404).json({ error: "Developer not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.developer": developerEmail,
      });

      const start = startDate ? dayjs(startDate) : null;
      const end = endDate ? dayjs(endDate) : null;

      const filteredBugs = bugs.filter((bug) => {
        if (!bug.statusLastUpdated) return true;
        const updated = dayjs(bug.statusLastUpdated);
        return (
          (!start || updated.isSameOrAfter(start)) &&
          (!end || updated.isSameOrBefore(end))
        );
      });

      const statusCounts = {};

      filteredBugs.forEach((bug) => {
        const bugStatus = bug.status;
        const bugId = bug.bugId;

        if (bugStatus) {
          if (!statusCounts[bugStatus]) {
            statusCounts[bugStatus] = { count: 0, bugIds: [] };
          }
          statusCounts[bugStatus].count++;
          statusCounts[bugStatus].bugIds.push(bugId);
        }
      });

      let total = 0;
      Object.values(statusCounts).forEach((item) => {
        total += item.count;
      });

      statusCounts.total = total;

      return res.json(statusCounts);
    } catch (err) {
      console.error("Error ", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for tester summary
router.get(
  "/tester/summary/:testerEmail",
  authenticateUser,
  checkIfTesterForAppAndTeam,
  async (req, res) => {
    try {
      const { testerEmail } = req.params;
      const { application, team } = req.query;

      const tester = await User.findOne({ email: testerEmail });
      if (!tester) return res.status(404).json({ error: "Tester not found" });

      if (!application || !team)
        return res
          .status(400)
          .json({ error: "Tester is not assigned to any app/team" });

      //Get all the bugsassigned to the tester
      const allBugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.tester": testerEmail,
      });

      const testedStatuses = ["Tested & Verified", "Closed"];
      const testedBugs = allBugs.filter((b) =>
        testedStatuses.includes(b.status)
      );

      const totalTetsed = testedBugs.length;
      const totalAssigned = allBugs.length;

      const bugTestRate = totalAssigned
        ? ((totalTetsed / totalAssigned) * 100).toFixed(1)
        : 0.0;
      const timelyFixes = testedBugs.filter((b) => {
        const expected = { Critical: 6, High: 9, Medium: 3, Low: 1 }[
          b.priority
        ];
        return (b.testerValidationHours || 0) <= expected;
      });
      const timelyTestRate = totalTetsed
        ? ((timelyFixes.length / totalTetsed) * 100).toFixed(1)
        : 0.0;

      const avgTestTimeByPriority = {};
      const priorities = ["Critical", "High", "Medium", "Low"];

      priorities.forEach((priority) => {
        const priorityBugs = testedBugs.filter(
          (bug) => bug.priority === priority
        );
        let totalHours = 0;
        console.log("Priority bugs" + priorityBugs + "----------------");

        priorityBugs.forEach((bug) => {
          if (
            bug.testerValidationHours !== undefined &&
            bug.testerValidationHours !== null
          ) {
            totalHours += bug.testerValidationHours;
          }
        });

        if (priorityBugs.length > 0) {
          console.log("Length" + priorityBugs.length);
          console.log("hours" + totalHours);

          const average = totalHours / priorityBugs.length;
          console.log("Avg" + average);

          avgTestTimeByPriority[priority] = average;
        }
      });
      console.log(
        "avgTestTimeByPriority sdjb jksndf kjds" +
          JSON.stringify(avgTestTimeByPriority)
      );
      const testRateByPriority = {};

      priorities.forEach((priority) => {
        const assigned = allBugs.filter((bug) => bug.priority === priority);
        const tested = testedBugs.filter((bug) => bug.priority === priority);

        const assignedCount = assigned.length;
        const testedCount = tested.length;

        if (assignedCount > 0) {
          const rate = (testedCount / assignedCount) * 100;
          testRateByPriority[priority] = rate.toFixed(1);
        }
      });

      console.log("TESter" + tester);
      const workload = tester.roles.find(
        (r) =>
          r.role === "tester" &&
          r.application === application &&
          r.team === team
      )?.workloadHours;

      const response = {
        totalTetsed: totalTetsed,
        totalAssigned: totalAssigned,
        bugTestRate: parseFloat(bugTestRate),
        timelyTestRate: parseFloat(timelyTestRate),
        avgTestTimeByPriority,
        testRateByPriority,
        workload: {
          current: workload,
          max: 40,
        },
      };
      return res.json(response);
    } catch (err) {
      console.error("Error ", err.message);
      return res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  }
);
//API endpoint for tester fix trend (number of bugs tested each day)
router.get(
  "/tester/test-trend/:testerEmail",
  authenticateUser,
  checkIfTesterForAppAndTeam,
  async (req, res) => {
    try {
      const { testerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const tester = await User.findOne({ email: testerEmail });
      if (!tester) {
        return res.status(404).json({ error: "Tester not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.tester": testerEmail,
      });

      const testedStatuses = ["Tested & Verified", "Closed"];

      const start = startDate ? dayjs(startDate) : dayjs().subtract(6, "day");
      const end = endDate ? dayjs(endDate) : dayjs();

      const rangeDays = end.diff(start, "day") + 1;

      const testsOverTime = [];

      for (let i = 0; i < rangeDays; i++) {
        const date = dayjs(start).add(i, "day").format("YYYY-MM-DD");
        let count = 0;

        bugs.forEach((bug) => {
          if (bug.changeHistory && Array.isArray(bug.changeHistory)) {
            bug.changeHistory.forEach((change) => {
              if (testedStatuses.indexOf(change.newStatus) !== -1) {
                const testedDate = dayjs(change.changedOn).format("YYYY-MM-DD");
                if (testedDate === date) {
                  count++;
                }
              }
            });
          }
        });

        testsOverTime.push({ date: date, count: count });
      }

      return res.json(testsOverTime);
    } catch (err) {
      console.error("Error", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for tester average test time
router.get(
  "/tester/avg-test-time/:testerEmail",
  authenticateUser,
  checkIfTesterForAppAndTeam,
  async (req, res) => {
    try {
      const { testerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const tester = await User.findOne({ email: testerEmail });
      if (!tester) {
        return res.status(404).json({ error: "Tester not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.tester": testerEmail,
      });

      const testedStatuses = ["Tested & Verified", "Closed"];

      const start = startDate && startDate !== "" ? dayjs(startDate) : null;
      const end = endDate && endDate !== "" ? dayjs(endDate) : null;

      const filteredTested = bugs.filter((bug) => {
        if (!testedStatuses.includes(bug.status)) return false;
        if (bug.testerValidationHours === undefined) return false;

        const testedChange = bug.changeHistory.find(
          (ch) => ch.newStatus === "Tested & Verified"
        );
        if (!testedChange) return false;

        const testedDate = dayjs(testedChange.changedOn);

        if (start && testedDate.isBefore(start)) return false;
        if (end && testedDate.isAfter(end)) return false;

        return true;
      });

      const avgTestTimeByPriority = {};

      ["Critical", "High", "Medium", "Low"].forEach((priority) => {
        const bugsForPriority = filteredTested.filter(
          (bug) => bug.priority === priority
        );

        let totalHours = 0;
        bugsForPriority.forEach((bug) => {
          totalHours += bug.testerValidationHours || 0;
        });

        avgTestTimeByPriority[priority] = {
          avgHours: bugsForPriority.length
            ? parseFloat((totalHours / bugsForPriority.length).toFixed(2))
            : 0.0,
          count: bugsForPriority.length,
        };
      });

      return res.json(avgTestTimeByPriority);
    } catch (err) {
      console.error("Error ", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for tester sla breaches
router.get(
  "/tester/sla-breaches/:testerEmail",
  authenticateUser,
  checkIfTesterForAppAndTeam,
  async (req, res) => {
    try {
      const { testerEmail } = req.params;
      const { startDate, endDate, priority, application, team } = req.query;

      const tester = await User.findOne({ email: testerEmail });
      if (!tester) {
        return res.status(404).json({ error: "Tester not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.tester": testerEmail,
      });

      const SLA_HOURS = {
        Critical: 3,
        High: 4,
        Medium: 2,
        Low: 1,
      };

      const breaches = [];

      bugs.forEach((bug) => {
        const {
          changeHistory,
          priority: bugPriority,
          testerValidationHours,
        } = bug;

        if (!bugPriority || !SLA_HOURS[bugPriority]) return;
        if (priority && bugPriority !== priority) return;

        const assignedChange = changeHistory.find(
          (ch) =>
            ch.newStatus === "Tester Assigned" ||
            ch.newStatus === "Testing In Progress"
        );
        const testedChange = changeHistory.find(
          (ch) => ch.newStatus === "Tested & Verified"
        );

        if (!assignedChange || !testedChange) return;

        const start = new Date(assignedChange.changedOn);
        const end = new Date(testedChange.changedOn);

        if (startDate && new Date(startDate) > end) return;
        if (endDate && new Date(endDate) < start) return;

        //Using testerValidationHours instead of timestamp difference necause it includes non-working hours, breaks, weekends, meetings etc.,
        const hoursTaken = testerValidationHours;

        const allowedHours = SLA_HOURS[bugPriority];

        if (hoursTaken > allowedHours) {
          breaches.push({
            bugId: bug.bugId,
            title: bug.title,
            priority: bugPriority,
            startedAt: dayjs(start).format("DD/MM/YYYY - HH:mm"),
            testeAt: dayjs(end).format("DD/MM/YYYY - HH:mm"),
            hoursTaken: hoursTaken,
            allowedHours,
          });
        }
      });

      return res.json(breaches);
    } catch (err) {
      console.error("Error ", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);
//API endpoint for tester status overview
router.get(
  "/tester/bug-status-overview/:testerEmail",
  authenticateUser,
  checkIfTesterForAppAndTeam,
  async (req, res) => {
    try {
      const { testerEmail } = req.params;
      const { startDate, endDate, application, team } = req.query;

      const tester = await User.findOne({ email: testerEmail });
      if (!tester) {
        return res.status(404).json({ error: "Tester not found" });
      }

      const bugs = await BugReport.find({
        application,
        assignedTeam: team,
        "assignedTo.tester": testerEmail,
      });

      const start = startDate ? dayjs(startDate) : null;
      const end = endDate ? dayjs(endDate) : null;

      const filteredBugs = bugs.filter((bug) => {
        if (!bug.statusLastUpdated) return true;
        const updated = dayjs(bug.statusLastUpdated);
        return (
          (!start || updated.isSameOrAfter(start)) &&
          (!end || updated.isSameOrBefore(end))
        );
      });

      const statusCounts = {};

      filteredBugs.forEach((bug) => {
        const bugStatus = bug.status;
        const bugId = bug.bugId;

        if (bugStatus) {
          if (!statusCounts[bugStatus]) {
            statusCounts[bugStatus] = { count: 0, bugIds: [] };
          }
          statusCounts[bugStatus].count++;
          statusCounts[bugStatus].bugIds.push(bugId);
        }
      });

      let total = 0;
      Object.values(statusCounts).forEach((item) => {
        total += item.count;
      });

      statusCounts.total = total;

      return res.json(statusCounts);
    } catch (err) {
      console.error("Error ", err.message);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get total bugs in each app
router.get(
  "/admin/total-bugs",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { startDate, endDate } = req.query;

      const query = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(query, "application assignedTeam");

      // console.log(JSON.stringify(bugs));
      let totalCount = 0;
      const bugsbyApplication = {};
      const bugsbyTeamPerApp = {};

      bugs.forEach((bug) => {
        totalCount++;

        const app = bug.application;
        const team = bug.assignedTeam?.toLowerCase();

        //Count by application
        if (app) {
          bugsbyApplication[app] = (bugsbyApplication[app] || 0) + 1;
        }
        // console.log(
        //   "bugs by applicatuin -----------------" +
        //     JSON.stringify(bugsbyApplication)
        // );

        //Count by team inside each app
        if (app && ["frontend", "backend", "devops"].includes(team)) {
          if (!bugsbyTeamPerApp[app]) {
            bugsbyTeamPerApp[app] = { frontend: 0, backend: 0, devops: 0 };
          }
          bugsbyTeamPerApp[app][team]++;
        }
        // console.log(
        //   "bugs by team -----------------" + JSON.stringify(bugsbyTeamPerApp)
        // );
      });

      return res.json({
        totalCount,
        bugsbyApplication,
        bugsbyTeamPerApp,
      });
    } catch (err) {
      console.error("Error ", err);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get bugs by priority
router.get(
  "/admin/bugs-by-priority",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, startDate, endDate } = req.query;

      const query = {};
      if (app) {
        query.application = app;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(query, "priority");

      const priorityCount = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      };

      bugs.forEach((bug) => {
        const p = bug.priority;
        if (p) {
          priorityCount[p]++;
        }
      });

      return res.json(priorityCount);
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get bugs by stasut
router.get(
  "/admin/bugs-by-status",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, startDate, endDate } = req.query;

      const query = {};
      if (app) {
        query.application = app;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(query, "status");

      const statusCount = {};

      bugs.forEach((bug) => {
        const status = bug.status;
        if (status) {
          statusCount[status] = (statusCount[status] || 0) + 1;
        }
      });

      return res.json(statusCount);
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get unasisgned bugs
router.get(
  "/admin/unassigned-bugs",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, team, priority, startDate, endDate } = req.query;

      const query = {};

      if (app) query.application = app;
      if (team) query.assignedTeam = team;
      if (priority) query.priority = priority;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(
        query,
        "bugId application assignedTeam assignedTo priority createdAt"
      );

      const unasisgnedToTeam = [];
      const unassignedToDeveloper = [];

      bugs.forEach((bug) => {
        // console.log("Priority --------------- " + bug.priority);

        if (!bug.assignedTeam || bug.assignedTeam === "Unassigned") {
          console.log("Priority --------------- " + bug.priority);
          unasisgnedToTeam.push({
            bugId: bug.bugId,
            application: bug.application,
            priority: bug.priority,
            createdAt: bug.createdAt,
          });
          console.log("unasisgend to team -----------" + unasisgnedToTeam);
        } else if (!bug.assignedTo?.developer) {
          unassignedToDeveloper.push({
            bugId: bug.bugId,
            application: bug.application,
            team: bug.assignedTeam,
            priority: bug.priority,
            createdAt: bug.createdAt,
          });
        }
      });

      return res.json({
        unasisgnedToTeam,
        unassignedToDeveloper,
      });
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get SLA breaches
router.get(
  "/admin/sla-breaches",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const {
        app,
        team,
        priority,
        threshold = 2,
        startDate,
        endDate,
      } = req.query;

      const query = {};
      if (app) query.application = app;
      if (team) query.assignedTeam = team;
      if (priority) query.priority = priority;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(
        query,
        "bugId application assignedTeam assignedTo priority status statusLastUpdated"
      );

      const now = new Date();
      const delayedBugs = [];

      bugs.forEach((bug) => {
        if (!bug.statusLastUpdated) return;

        const updatedAt = new Date(bug.statusLastUpdated);
        const diffinDays = (now - updatedAt) / (1000 * 60 * 60 * 24);

        if (diffinDays >= threshold) {
          console.log("inside if condition of sla breaches");
          delayedBugs.push({
            bugId: bug.bugId,
            application: bug.application,
            team: bug.assignedTeam,
            priority: bug.priority,
            currentStatus: bug.status,
            daysSinceUpdate: Math.floor(diffinDays),
            lastUpdated: updatedAt.toISOString(),
          });
        }
      });
      // console.log(delayedBugs);

      return res.json({ delayedBugs });
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get fixed vs reproted trend on each day
router.get(
  "/admin/fix-vs-report-trend",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, startDate, endDate } = req.query;

      const query = {};
      if (app) query.application = app;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const bugs = await BugReport.find(query, "createdAt changeHistory");

      const trend = {};

      bugs.forEach((bug) => {
        //Count reported
        const createdAt = new Date(bug.createdAt);
        const dateKey = createdAt.toISOString().split("T")[0];

        if (!trend[dateKey]) {
          trend[dateKey] = { reported: 0, fixed: 0, tested: 0 };
        }
        trend[dateKey].reported++;

        //Count fixed (Fixed (Testing Pending))
        const fixedChange = bug.changeHistory.find(
          (ch) => ch.newStatus === "Fixed (Testing Pending)"
        );

        if (fixedChange) {
          const fixedAt = new Date(fixedChange.changedOn);
          const fixedKey = fixedAt.toISOString().split("T")[0];
          console.log(fixedAt);
          console.log(fixedKey);
          if (!trend[fixedKey]) {
            trend[fixedKey] = { reported: 0, fixed: 0, tested: 0 };
          }
          trend[fixedKey].fixed++;
        }

        //Count tested (Tested & Verified)
        const testedChange = bug.changeHistory.find(
          (ch) => ch.newStatus === "Tested & Verified"
        );

        if (testedChange) {
          const testedAt = new Date(testedChange.changedOn);
          const testedKey = testedAt.toISOString().split("T")[0];

          if (!trend[testedKey]) {
            trend[testedKey] = { reported: 0, fixed: 0, tested: 0 };
          }
          trend[testedKey].tested++;
        }
      });

      return res.json(trend);
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get high priority bugs still open
router.get(
  "/admin/high-priority-bugs",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, team } = req.query;
      const query = {
        priority: { $in: ["Critical", "High"] },
        status: { $ne: "Closed" },
      };

      if (app) query.application = app;
      if (team) query.assignedTeam = team;

      const bugs = await BugReport.find(
        query,
        "bugId application priority assignedTeam title createdAt"
      );

      const summary = {
        Critical: 0,
        High: 0,
      };

      bugs.forEach((bug) => {
        if (bug.priority && summary[bug.priority] !== undefined) {
          summary[bug.priority]++;
        }
      });

      return res.json({
        summary,
        bugs,
      });
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get current workload
router.get(
  "/admin/current-workload",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      console.log("inside current wokrload endpoint");

      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, team, role } = req.query;
      console.log(app, team, role);

      const query = {};
      if (app) query.application = app;
      if (team) query.assignedTeam = team;
      if (role === "developer") {
        query["assignedTo.developer"] = { $ne: null };
        query.status = { $in: ["Assigned", "Fix In Progress"] };
      } else if (role === "tester") {
        query["assignedTo.tester"] = { $ne: null };
        query.status = { $in: ["Tester Assigned", "Testing In Progress"] };
      }

      console.log(
        "current worklaod query -----------------------" + JSON.stringify(query)
      );
      const bugs = await BugReport.find(
        query,
        "application assignedTeam assignedTo priority status bugId"
      );
      // console.log(bugs);
      const PRIORITY_HOURS = {
        developer: { Critical: 6, High: 9, Medium: 3, Low: 1 },
        tester: { Critical: 4, High: 5, Medium: 2, Low: 1 },
      };

      const workload = {};
      const bugDistribution = {};

      bugs.forEach((bug) => {
        const { application, assignedTeam, assignedTo, status, priority } = bug;
        const appName = application;
        const teamName = assignedTeam?.toLowerCase();
        if (!appName || !teamName || !priority) return;

        //Developer workload
        if (
          assignedTo?.developer &&
          ["Assigned", "Fix In Progress"].includes(status)
        ) {
          const dev = assignedTo.developer;
          const hours = PRIORITY_HOURS.developer[priority] || 0;

          if (!workload[appName]) workload[appName] = {};
          if (!workload[appName][teamName])
            workload[appName][teamName] = { developers: {}, testers: {} };
          if (!workload[appName][teamName].developers[dev]) {
            workload[appName][teamName].developers[dev] = {
              bugCount: 0,
              totalHours: 0,
            };
          }

          workload[appName][teamName].developers[dev].bugCount++;
          workload[appName][teamName].developers[dev].totalHours += hours;

          if (!bugDistribution[appName]) bugDistribution[appName] = {};
          if (!bugDistribution[appName][teamName])
            bugDistribution[appName][teamName] = {
              developers: {},
              testers: {},
            };
          if (!bugDistribution[appName][teamName].developers[dev]) {
            bugDistribution[appName][teamName].developers[dev] = {
              Critical: 0,
              High: 0,
              Medium: 0,
              Low: 0,
            };
          }
          bugDistribution[appName][teamName].developers[dev][priority]++;
        }

        //Tester workload
        if (
          assignedTo?.tester &&
          ["Tester Assigned", "Testing In Progress"].includes(status)
        ) {
          const tester = assignedTo.tester;
          const hours = PRIORITY_HOURS.tester[priority] || 0;

          if (!workload[appName]) workload[appName] = {};
          if (!workload[appName][teamName])
            workload[appName][teamName] = { developers: {}, testers: {} };
          if (!workload[appName][teamName].testers[tester]) {
            workload[appName][teamName].testers[tester] = {
              bugCount: 0,
              totalHours: 0,
            };
          }

          workload[appName][teamName].testers[tester].bugCount++;
          workload[appName][teamName].testers[tester].totalHours += hours;

          if (!bugDistribution[appName]) bugDistribution[appName] = {};
          if (!bugDistribution[appName][teamName])
            bugDistribution[appName][teamName] = {
              developers: {},
              testers: {},
            };
          if (!bugDistribution[appName][teamName].testers[tester]) {
            bugDistribution[appName][teamName].testers[tester] = {
              Critical: 0,
              High: 0,
              Medium: 0,
              Low: 0,
            };
          }
          bugDistribution[appName][teamName].testers[tester][priority]++;
        }
      });

      return res.json({ workload, bugDistribution });
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

//API endpoint for admin to get bugs that are stuck
router.get(
  "/admin/stuck-bugs",
  authenticateUser,
  checkIfAdmin,
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      const user = await User.findOne({ email: userEmail });

      const isAdmin = user?.roles.some((r) => r.role === "admin");
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only admins can access this data." });
      }

      const { app, team, priority, threshold } = req.query;
      const thresholdDays = threshold ? parseInt(threshold, 10) : 2;

      const query = {
        status: {
          $in: [
            "Assigned",
            "Fix In Progress",
            "Fixed (Testing Pending)",
            "Tester Assigned",
            "Testing In Progress",
          ],
        },
      };
      if (app) query.application = app;
      if (team) query.assignedTeam = team;
      if (priority) query.priority = priority;

      console.log(JSON.stringify(query));
      const bugs = await BugReport.find(query, {
        bugId: 1,
        application: 1,
        assignedTeam: 1,
        assignedTo: 1,
        priority: 1,
        status: 1,
        statusLastUpdated: 1,
        title: 1,
      });
      // console.log(JSON.stringify(bugs));

      const now = new Date();
      const stuckBugs = [];

      bugs.forEach((bug) => {
        if (!bug.statusLastUpdated) return;

        const lastUpdated = new Date(bug.statusLastUpdated);
        const daysStuck = Math.floor(
          (now - lastUpdated) / (1000 * 60 * 60 * 24)
        );

        if (daysStuck >= thresholdDays) {
          stuckBugs.push({
            bugId: bug.bugId,
            title: bug.title,
            application: bug.application,
            team: bug.assignedTeam,
            priority: bug.priority,
            currentStatus: bug.status,
            assignedDeveloper: bug.assignedTo?.developer || null,
            assignedTester: bug.assignedTo?.tester || null,
            lastUpdated: lastUpdated.toISOString(),
            daysStuck,
          });
        }
      });

      res.json({ bugs: stuckBugs });
    } catch (err) {
      console.error("Error ", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);
module.exports = router;
