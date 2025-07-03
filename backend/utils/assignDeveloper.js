const User = require("../models/UserSchema");

//Estimated development hours per priority (can be adjusted as needed)
const PRIORITY_DEVELOPER_HOURS = {
  Critical: 6,
  High: 9,
  Medium: 3,
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
  Critical: 45,
  High: 43,
  Medium: 42,
  Low: 40,
};
//Assign developer based on the team, wrokload, priority and seniority
const assignDeveloper = async (application, team, priority) => {
  const estimatedHours = PRIORITY_DEVELOPER_HOURS[priority];
  const seniorityOrder = PRIORITY_SENIORITY_ORDER[priority];

  //Get all developers assigned to this app and team
  const developers = await User.find({
    roles: {
      $elemMatch: {
        application,
        team,
        role: "developer",
      },
    },
  });

  if (!developers.length) return null;

  //Map to include workload and seniority
  const devList = developers
    .map((dev) => {
      const role = dev.roles.find(
        (r) =>
          r.application === application &&
          r.team === team &&
          r.role === "developer" &&
          r.overLoaded === false
      );

      if (!role) return null;
      return {
        fullName: dev.fullName,
        email: dev.email,
        seniority: role.seniority,
        workloadHours: role.workloadHours,
      };
    })
    .filter(Boolean);

  let strictEligible;
  //Loop by seniority preference for the priority level
  for (const level of seniorityOrder) {
    //Among devs of this level find someone with capacity for this bug
    const eligible = devList
      .filter((d) => d.seniority === level)
      .filter((d) => d.workloadHours + estimatedHours <= 40)
      .sort((a, b) => a.workloadHours - b.workloadHours)[0];

    if (eligible) {
      strictEligible = eligible;
      const expectedFirstChoice = seniorityOrder[0];
      const fallbackNotice =
        eligible.seniority !== expectedFirstChoice
          ? `Bug assigned to a ${eligible.seniority} developer instead of a ${expectedFirstChoice} due to full capacity of all developers with this seniorty`
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
    if (!strictEligible) {
      //Loop by seniority preference for the priority level
      for (const level of seniorityOrder) {
        //Fallback - buffer asisgnment
        let bufferedDevs = devList.filter((d) => d.seniority === level);

        bufferedDevs = bufferedDevs.map((dev) => {
          const total = dev.workloadHours + estimatedHours;
          return {
            ...dev,
            totalWorkloadAfterAssignment: total,
            overLoaded: total > 40,
          };
        });

        const maxAllowedHours = PRIORITY_MAX_HOURS[priority];

        const bufferedEligible = bufferedDevs
          .filter(
            (d) =>
              d.totalWorkloadAfterAssignment <= maxAllowedHours && d.overLoaded
          )
          .sort((a, b) => a.workloadHours - b.workloadHours)[0];

        if (bufferedEligible) {
          const expectedFirstChoice = seniorityOrder[0];

          const fallbackNotice =
            bufferedEligible.seniority !== expectedFirstChoice
              ? `Expected to assign a ${expectedFirstChoice} developer but no one was available within workload. Assigned a ${bufferedEligible.seniority} developer who is slightly over allocated (total after assignment: ${bufferedEligible.totalWorkloadAfterAssignment} hours).`
              : `Developer is slightly over allocated (total after assignment: ${bufferedEligible.totalWorkloadAfterAssignment} hours) due to no available developer under the 40-hour limit.`;

          return {
            email: bufferedEligible.email,
            fullName: bufferedEligible.fullName,
            priority,
            seniority: bufferedEligible.seniority,
            estimatedHours,
            fallbackNotice,
            overLoaded: true,
            totalAfterAssignment: bufferedEligible.totalWorkloadAfterAssignment,
          };
        }
      }
    }
  }

  return null; //No eligible developer found
};

module.exports = assignDeveloper;
