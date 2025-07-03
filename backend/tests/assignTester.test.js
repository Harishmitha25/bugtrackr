const assignTester = require("../utils/assignTester");
const User = require("../models/UserSchema");

jest.mock("../models/UserSchema");

describe("assignTester", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns null when no testers found", async () => {
    //Checks a case where no testers match the criteria
    User.find.mockResolvedValue([]);
    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result).toBeNull();
  });

  test("assigns a tester with workload under 40h", async () => {
    //Tester has enough workload capacity (25/40) so can be assigned a critical bug
    User.find.mockResolvedValue([
      {
        fullName: "John",
        email: "harishmitha2507+john@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "mid",
            workloadHours: 25,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result).toMatchObject({
      email: "harishmitha2507+john@gmail.com",
      seniority: "mid",
      estimatedHours: 4,
      overLoaded: false,
    });
  });

  test("assigns a fallback overloaded tester within buffer", async () => {
    //Tester will slightly exceed the 40 hour limit (38+4=42) so marked as overloaded
    User.find.mockResolvedValue([
      {
        fullName: "Meera",
        email: "harishmitha2507+meera@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "senior",
            workloadHours: 38,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result.overLoaded).toBe(true);
    expect(result.totalAfterAssignment).toBe(42);
    expect(result.fallbackNotice).toContain("over allocated");
  });

  test("returns null if no testers are eligible within max buffer", async () => {
    //Tester already exceeds workload buffer so cannot be assigned
    User.find.mockResolvedValue([
      {
        fullName: "Dhanush",
        email: "harishmitha2507+dhanush@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "junior",
            workloadHours: 50,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result).toBeNull();
  });
  test("assigns tester with lowest workload among same seniority", async () => {
    //Both testers are mid but one has less workload
    User.find.mockResolvedValue([
      {
        fullName: "Chandler Bing",
        email: "harishmitha2507+chandler@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "mid",
            workloadHours: 30,
            overLoaded: false,
          },
        ],
      },
      {
        fullName: "Joey Tribbian",
        email: "harishmitha2507+joey@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "mid",
            workloadHours: 25,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result.email).toBe("harishmitha2507+joey@gmail.com");
  });

  test("assigns junior-level tester when seniors are overloaded", async () => {
    //Senior is overloaded so fallback to eligible junior tester
    User.find.mockResolvedValue([
      {
        fullName: "Ross Geller",
        email: "harishmitha2507+ross@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "senior",
            workloadHours: 41,
            overLoaded: false,
          },
        ],
      },
      {
        fullName: "Rachel Green",
        email: "harishmitha2507+rachel@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "junior",
            workloadHours: 20,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "Medium"
    );
    expect(result.email).toBe("harishmitha2507+rachel@gmail.com");
    expect(result.seniority).toBe("junior");
  });

  test("skips testers flagged as overLoaded", async () => {
    //Tester is overloaded so should not be assigned
    User.find.mockResolvedValue([
      {
        fullName: "Monica Geller",
        email: "harishmitha2507+monica@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "mid",
            workloadHours: 50,
            overLoaded: true,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "Low"
    );
    expect(result).toBeNull();
  });

  test("fallback to next eligible seniority with buffer under max", async () => {
    //Fallback to junior as mid is overloaded
    User.find.mockResolvedValue([
      {
        fullName: "Phoebe Buffay",
        email: "harishmitha2507+phoebe@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "mid",
            workloadHours: 41,
            overLoaded: false,
          },
        ],
      },
      {
        fullName: "Peter Parker",
        email: "harishmitha2507+peter@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "devops",
            role: "tester",
            seniority: "junior",
            workloadHours: 37,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignTester(
      "Requirements Management App",
      "devops",
      "High"
    );
    expect(result).not.toBeNull();
    expect(result.email).toBe("harishmitha2507+peter@gmail.com");
    expect(result.overLoaded).toBe(true);
  });
});
