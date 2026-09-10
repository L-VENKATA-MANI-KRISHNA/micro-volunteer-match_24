import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: { type: String, required: true, trim: true, maxlength: 500 } }, { timestamps: { createdAt: true, updatedAt: false } });
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: { type: String, required: true, trim: true },
  category: { type: String, required: true }, service: { type: String, required: true }, requiredSkills: [String], requiredSkill: String,
  estimatedMinutes: { type: Number, required: true, min: 10, max: 15 }, location: { type: String, required: true }, isRemote: { type: Boolean, default: false },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' }, preferredTime: Date,
  // Impact additions (all optional, backward compatible)
  urgency: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' },
  deadline: Date,
  beginnerFriendly: { type: Boolean, default: false },
  slotsTotal: { type: Number, default: 1, min: 1, max: 5 },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Proof + approval
  proofUrl: String, proofNote: String, submittedAt: Date,
  requiresApproval: { type: Boolean, default: false },
  impactCounted: { type: Boolean, default: false },
  // Ratings (1-5)
  volunteerRating: Number, volunteerReview: String,
  organizerRating: Number, organizerReview: String,
  comments: [commentSchema],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['OPEN', 'IN-PROGRESS', 'PENDING_REVIEW', 'COMPLETED'], default: 'OPEN' }, completedAt: Date
}, { timestamps: true });
export default mongoose.model('Task', taskSchema);
