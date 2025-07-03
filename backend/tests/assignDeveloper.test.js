const assignDeveloper = require("../utils/assignDeveloper");
const User = require("../models/UserSchema");

jest.mock("../models/UserSchema");

//Test
describe("assignDeveloper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns null when no developers found", async () => {
    //Checks a case where no developers match the criteria
    User.find.mockResolvedValue([]);
    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Critical"
    );
    expect(result).toBeNull();
  });

  test("assigns a developer with available workload under 40h", async () => {
    //Developer has enough workload capacity (32/40) so can be assigned a critical bug
    User.find.mockResolvedValue([
      {
        fullName: "Harishmitha",
        email: "harishmitha2507@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "senior",
            workloadHours: 32,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Critical"
    );
    expect(result).toMatchObject({
      email: "harishmitha2507@gmail.com",
      seniority: "senior",
      estimatedHours: 6,
      overLoaded: false,
    });
  });

  test("assigns a fallback overloaded developer within buffer", async () => {
    //Developer will slightly exceed the 40 hour limit (39+6=45) so marked as overloaded

    User.find.mockResolvedValue([
      {
        fullName: "Thanigai",
        email: "harishmitha2507+thanigai@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "senior",
            workloadHours: 39,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Critical"
    );
    expect(result.overLoaded).toBe(true);
    expect(result.totalAfterAssignment).toBe(45);
    expect(result.fallbackNotice).toContain("over allocated");
  });

  test("returns null if no devs within max hours buffer", async () => {
    //Developer already exceeds workload buffer so cannot be assigned
    User.find.mockResolvedValue([
      {
        fullName: "Charlie",
        email: "charlie@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "senior",
            workloadHours: 46,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Critical"
    );
    expect(result).toBeNull();
  });

  test("assigns developer with lowest workload among same seniority", async () => {
    //Both developers are senior but one has less workload
    User.find.mockResolvedValue([
      {
        fullName: "Chandler Bing",
        email: "harishmitha2507+chandler@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "senior",
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
            team: "frontend",
            role: "developer",
            seniority: "senior",
            workloadHours: 25,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Critical"
    );
    expect(result.email).toBe("harishmitha2507+joey@gmail.com");
  });

  test("assigns mid-level when seniors are overloaded", async () => {
    //Senior is overloaded so fallback to eligible mid developer
    User.find.mockResolvedValue([
      {
        fullName: "Ross Geller",
        email: "harishmitha2507+ross@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
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
            team: "frontend",
            role: "developer",
            seniority: "mid",
            workloadHours: 20,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "High"
    );
    expect(result.email).toBe("harishmitha2507+rachel@gmail.com");
    expect(result.seniority).toBe("mid");
  });

  test("skips developers flagged as overLoaded", async () => {
    //Developer is overloaded so should not be assigned
    User.find.mockResolvedValue([
      {
        fullName: "Monica Geller",
        email: "harishmitha2507+monica@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "junior",
            workloadHours: 50,
            overLoaded: true,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "Low"
    );
    expect(result).toBeNull();
  });

  test("fallback to next eligible seniority with buffer under max", async () => {
    //Fallback to mid as senior is overloaded
    User.find.mockResolvedValue([
      {
        fullName: "Phoebe Buffay",
        email: "harishmitha2507+phoebe@gmail.com",
        roles: [
          {
            application: "Requirements Management App",
            team: "frontend",
            role: "developer",
            seniority: "senior",
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
            team: "frontend",
            role: "developer",
            seniority: "mid",
            workloadHours: 34,
            overLoaded: false,
          },
        ],
      },
    ]);

    const result = await assignDeveloper(
      "Requirements Management App",
      "frontend",
      "High"
    );
    expect(result).not.toBeNull();
    expect(result.email).toBe("harishmitha2507+peter@gmail.com");
    expect(result.overLoaded).toBe(true);
  });
});
