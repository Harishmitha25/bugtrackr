const mongoose = require("mongoose");
//Schema for Comments
const CommentSchema = new mongoose.Schema({
  bugId: { type: String, required: true },

  comments: [
    new mongoose.Schema(
      {
        id: { type: String },
        text: { type: String, required: true },
        createdBy: {
          email: { type: String, required: true },
          name: { type: String, required: true },
          role: { type: String, required: true },
        },
        mentionedUsers: { type: [String], default: [] },
        createdAt: { type: Date, default: Date.now },
        editableUntil: { type: Date },
        deleted: { type: Boolean, default: false },
      },
      { _id: false } // To disable "_id" auto generation
    ),
  ],
});

//Generate ID ("CMT-BUG-ID" current date time) when a new comment is added
CommentSchema.pre("save", function (next) {
  if (!this.bugId) {
    return next(new Error("Bug id is required before saving comments"));
  }
  this.comments.forEach((comment) => {
    if (!comment.id) {
      const timestamp = Date.now();
      comment.id = `CMT-${this.bugId}-${timestamp}`;
    }
  });
  next();
});

module.exports = mongoose.model("Comment", CommentSchema);
