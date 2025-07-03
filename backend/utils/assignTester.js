const User = require("../models/UserSchema");

//Estimated testing hours per priority (can be adjusted as needed)
const PRIORITY_TESTING_HOURS = {
  Critical: 4,
  High: 5,
  Medium: 2,
  Low: 1,
};

//Priority assignment order
const PRIORITY_SENIORITY_ORDER = {
  Critical: ["senior", "mid", "junior"],
  High: ["senior", "mid", "junior"],
  Medium: ["mid", "junior", "senior"],
  Low: ["junior", "mid", "senior"],
};

//Max buffer hours
const PRIORITY_MAX_HOURS = {
  Critical: 43,
  High: 42,
  Medium: 41,
  Low: 40,
};

//Assign tester based on the team, wrokload, priority and seniority
const assignTester = async (application, team, priority) => {
  const estimatedHours = PRIORITY_TESTING_HOURS[priority] || 2;
  const seniorityOrder = PRIORITY_SENIORITY_ORDER[priority] || [
    "mid",
    "junior",
    "senior",
  ];

  //Get all testers assigned to this app and team
  const testers = await User.find({
    roles: {
      $elemMatch: {
        application,
        team,
        role: "tester",
      },
    },
  });

  if (!testers.length) return null;

  //Map to include workload and seniority
  const testerList = testers
    .map((tester) => {
      const role = tester.roles.find(
        (r) =>
          r.application === application &&
          r.team === team &&
          r.role === "tester" &&
          r.overLoaded === false
      );
      if (!role) return null;

      return {
        fullName: tester.fullName,
        email: tester.email,
        seniority: role.seniority,
        workloadHours: role.workloadHours,
      };
    })
    .filter(Boolean);
  let strictEligible;
  //Loop by seniority preference for the priority level
  for (const level of seniorityOrder) {
    //Among testers of this level find someone with capacity for this bug
    const eligible = testerList
      .filter((t) => t.seniority === level)
      .filter((t) => t.workloadHours + estimatedHours <= 40)
      .sort((a, b) => a.workloadHours - b.workloadHours)[0];
    console.log(eligible);
    if (eligible) {
      strictEligible = eligible;
      const expectedFirstChoice = seniorityOrder[0];
      const fallbackNotice =
        eligible.seniority !== expectedFirstChoice
          ? `Bug assigned to a ${eligible.seniority} tester instead of a ${expectedFirstChoice} due to full capacity.`
          : null;

      return {
        email: eligible.email,
        fullName: eligible.fullName,
        priority,
        seniority: eligible.seniority,
        estimatedHours,
        fallbackNotice,
        overLoaded: false,
      };
    }
  }
  if (!strictEligible) {
    //Loop by seniority preference for the priority level
    for (const level of seniorityOrder) {
      //Fallback - buffer asisgnment
      let bufferedTEsters = testerList.filter((d) => d.seniority === level);

      bufferedTEsters = bufferedTEsters.map((tester) => {
        const total = tester.workloadHours + estimatedHours;
        return {
          ...tester,
          totalWorkloadAfterAssignment: total,
          overLoaded: total > 40,
        };
      });

      const maxAllowedHours = PRIORITY_MAX_HOURS[priority];

      const bufferedEligible = bufferedTEsters
        .filter(
          (d) =>
            d.totalWorkloadAfterAssignment <= maxAllowedHours && d.overLoaded
        )
        .sort((a, b) => a.workloadHours - b.workloadHours)[0];

      if (bufferedEligible) {
        const expectedFirstChoice = seniorityOrder[0];

        const fallbackNotice =
          bufferedEligible.seniority !== expectedFirstChoice
            ? `Expected to assign a ${expectedFirstChoice} tester but no one was available within workload. Assigned a ${bufferedEligible.seniority} tester who is slightly over allocated (total after assignment: ${bufferedEligible.totalWorkloadAfterAssignment} hours).`
            : `Tester is slightly over allocated (total after assignment: ${bufferedEligible.totalWorkloadAfterAssignment} hours) due to no available tester under the 40-hour limit.`;

        return {
          email: bufferedEligible.email,
          fullName: bufferedEligible.fullName,
          priority,
          seniority: bufferedEligible.seniority,
          estimatedHours,
          fallbackNotice,
          overLoaded: true,
          totalAfterAssignment: bufferedEligible.workloadHours + estimatedHours,
        };
      }
    }
  }

  return null; // No eligible tester found
};

module.exports = assignTester;
