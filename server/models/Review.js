import mongoose from 'mongoose';

const reviewCommentSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },      // file path
    line: { type: Number },                       // line number in diff
    side: { type: String, enum: ['LEFT', 'RIGHT'], default: 'RIGHT' },
    body: { type: String, required: true },       // LLM-generated comment text
    postedToGitHub: { type: Boolean, default: false },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prUrl: {
      type: String,
      required: [true, 'PR URL is required'],
      trim: true,
    },
    owner: { type: String },        // parsed from prUrl
    repo: { type: String },         // parsed from prUrl
    prNumber: { type: Number },     // parsed from prUrl
    prTitle: { type: String },
    prDescription: { type: String },
    status: {
      type: String,
      enum: ['pending', 'streaming', 'done', 'error'],
      default: 'pending',
      index: true,
    },
    model: { type: String, default: 'codellama' },
    rawDiff: { type: String },      // full unified diff (stored for reference)
    comments: [reviewCommentSchema],
    errorMessage: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
