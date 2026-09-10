import mongoose from 'mongoose';
export default mongoose.model('Organization', new mongoose.Schema({ name: { type: String, required: true }, description: String, organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true }));
