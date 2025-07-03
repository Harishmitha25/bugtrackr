const mongoose = require("mongoose");

//Schema for Bug Report
const BugReportSchema = new mongoose.Schema(
  {
    bugId: { type: String, unique: true },
    application: { type: String, required: true },
    issueType: { type: String, required: true },
    otherIssueDescription: { type: String, default: null },
    title: { type: String, required: true },
    description: { type: String, required: true },

    stepsToReproduce: { type: String },
    userSteps: {
      step1: { type: String },
      step2: { type: String },
    },

    browser: { type: String },
    os: { type: String },
    errorLogs: { type: String },
    stackTrace: { type: String },

    attachments: { type: [String], default: [] },

    reportedBy: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },

    assignedTeam: { type: String, default: null },
    assignedTo: {
      developer: { type: String, default: null },
      tester: { type: String, default: null },
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
    },
    developerResolutionHours: {
      type: Number,
      default: null,
    },
    testerValidationHours: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      default: "Open",
      enum: [
        "Open",
        "Assigned",
        "Fix In Progress",
        "Fixed (Testing Pending)",
        "Tester Assigned",
        "Testing In Progress",
        "Tested & Verified",
        "Ready For Closure",
        "Closed",
        "Duplicate",
      ],
    },
    statusReason: { type: String, default: null },
    reopened: { type: Boolean, default: false },
    changeHistory: [
      {
        type: { type: String, required: true }, // "Status Change", "Assignment", "Priority Change", "Duplicate Mark", "Undo Duplicate", "Reallocation Request", "Reopen Request", "Reallocation Request Decision", "Reopen Request Decision",
        previousStatus: { type: String },
        newStatus: { type: String },
        developer: { type: String },
        tester: { type: String },
        priority: { type: String },
        changedOn: { type: Date, required: true },
        changedBy: { type: String, required: true },
        changedByRole: { type: String },
        reallocationRequestDecision: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
        },
        reopenRequestDecision: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
        },
        reason: { type: String },
      },
    ],
    statusLastUpdated: {
      type: Date,
    },
    additionalInfo: [
      {
        date: { type: String },
        info: { type: String },
      },
    ],
    isDuplicate: { type: Boolean, default: false },
    originalBugId: { type: String, default: null },

    duplicateExplanation: { type: String, default: null },
    isPotentialDuplicate: { type: Boolean, default: false },
    similarTo: [{ type: String, default: [] }],
    duplicateDetectionDone: { type: Boolean, default: false },
    reallocationRequests: {
      developer: [
        {
          requestedBy: { type: String, required: true },
          reason: { type: String, required: true },
          requestStatus: {
            type: String,
            default: "Pending",
            enum: ["Pending", "Approved", "Rejected"],
          },
          reviewedBy: { type: String, default: null },
          reviewedOn: { type: Date, default: null },
        },
      ],
      tester: [
        {
          requestedBy: { type: String, required: true },
          reason: { type: String, required: true },
          requestStatus: {
            type: String,
            default: "Pending",
            enum: ["Pending", "Approved", "Rejected"],
          },
          reviewedBy: { type: String, default: null },
          reviewedOn: { type: Date, default: null },
        },
      ],
    },
    reopenRequests: [
      {
        requestedBy: { type: String, required: true },
        role: { type: String, enum: ["developer", "tester"], required: true },
        reason: { type: String, required: true },
        requestedOn: { type: Date, required: true },
        requestStatus: {
          type: String,
          default: "Pending",
          enum: ["Pending", "Approved", "Rejected"],
        },
        reviewedBy: { type: String, default: null },
        reviewedOn: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

//Generate ID ("BUG-" highest existing bug id + 1) when a new bug report is submitted
BugReportSchema.pre("save", async function (next) {
  if (!this.bugId) {
    // Find the highest existing bug id
    const latestBug = await mongoose
      .model("BugReport")
      .findOne({}, { bugId: 1 }) //Find one bug report with just the bugId field
      .sort({ createdAt: -1 }); //Sort in descending order based on report submitted tiem

    if (latestBug && latestBug.bugId) {
      const lastBugNumber = parseInt(latestBug.bugId.split("-")[1], 10);
      this.bugId = `BUG-${lastBugNumber + 1}`;
    } else {
      this.bugId = "BUG-1";
    }
  }
  next();
});

BugReportSchema.index({ title: "text", description: "text" });
BugReportSchema.index({ "assignedTo.developer": 1 });
BugReportSchema.index({ "assignedTo.tester": 1 });
BugReportSchema.index({ application: 1 });
BugReportSchema.index({ createdAt: -1 });
BugReportSchema.index({ status: 1 });
BugReportSchema.index({ assignedTeam: 1 });

//Combinations can be added based on most used combos for filtering
BugReportSchema.index({
  application: 1,
  assignedTeam: 1,
});
BugReportSchema.index({
  priority: 1,
  status: 1,
});

BugReportSchema.index({
  priority: 1,
  "assignedTo.developer": 1,
  status: 1,
  "assignedTo.tester": 1,
});

module.exports = mongoose.model("BugReport", BugReportSchema);
