import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false }, role: { type: String, enum: ['student', 'organizer'], default: 'student' },
  skills: [{ name: { type: String, trim: true }, services: [{ type: String, trim: true }] }],
  interests: [String],
  availability: [{ day: String, start: String, end: String }],
  portfolio: [{ title: String, url: String }],
  alerts: [{ category: String, service: String, minMatch: { type: Number, default: 80 } }],
  ratingAvg: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 },
  noShowCount: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 }, impactMinutes: { type: Number, default: 0 },
  peopleHelped: { type: Number, default: 0 }
}, { timestamps: true });
userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function(password) { return bcrypt.compare(password, this.password); };
export default mongoose.model('User', userSchema);
