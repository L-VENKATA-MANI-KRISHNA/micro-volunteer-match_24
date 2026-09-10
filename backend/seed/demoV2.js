import dotenv from 'dotenv'; dotenv.config();
import connectDB from '../config/db.js'; import User from '../models/User.js'; import Task from '../models/Task.js'; import Organization from '../models/Organization.js';
await connectDB(); await Promise.all([User.deleteMany(), Task.deleteMany(), Organization.deleteMany()]);
const organizer = await User.create({ name: 'Asha Rao', email: 'organizer@micromatch.demo', password: 'demo123', role: 'organizer', ratingAvg: 4.8, ratingCount: 5 });
const student = await User.create({
  name: 'Rahul Mehta', email: 'student@micromatch.demo', password: 'demo123', role: 'student',
  skills: [
    { name: 'Design', services: ['Poster Design', 'Instagram Post Design', 'Presentation/PPT Design'] },
    { name: 'Video Editing', services: ['Instagram Reel Editing'] },
    { name: 'Programming', services: ['Python Help', 'Bug Fixing'] },
    { name: 'Tutoring', services: ['Python', 'Mathematics'] }
  ],
  interests: ['Design', 'Poster Design', 'event work'],
  availability: [
    { day: 'Monday', start: '17:00', end: '19:00' },
    { day: 'Wednesday', start: '16:00', end: '18:00' },
    { day: 'Saturday', start: '10:00', end: '13:00' }
  ],
  portfolio: [{ title: 'Tech Fest Poster', url: 'https://example.com/poster' }],
  alerts: [{ category: 'Design', service: 'Poster Design', minMatch: 80 }],
  ratingAvg: 4.9, ratingCount: 4
});
await Organization.create({ name: 'Coding Club', description: 'Building campus community through technology.', organizer: organizer._id });
await Task.insertMany([
  { title: 'URGENT: Need poster for blood donation camp TODAY', description: 'Create a simple promotional poster. Needed in 3 hours!', category: 'Design', service: 'Poster Design', requiredSkills: ['Design'], estimatedMinutes: 15, location: 'Online', isRemote: true, difficulty: 'Beginner', urgency: 'Urgent', beginnerFriendly: true, requiresApproval: true, organizer: organizer._id },
  { title: 'Design an Instagram post for Tech Fest', description: 'Create a clean, square announcement graphic using the provided event copy.', category: 'Design', service: 'Instagram Post Design', requiredSkills: ['Design'], estimatedMinutes: 15, location: 'Online', isRemote: true, difficulty: 'Beginner', beginnerFriendly: true, organizer: organizer._id },
  { title: 'Edit a 30-second event reel', description: 'Trim clips and add captions for the campus event reel.', category: 'Video Editing', service: 'Instagram Reel Editing', requiredSkills: ['Video Editing'], estimatedMinutes: 15, location: 'Online', isRemote: true, difficulty: 'Intermediate', requiresApproval: true, organizer: organizer._id },
  { title: 'Add subtitles to welcome video', description: 'Add English captions to a 2-minute orientation clip.', category: 'Video Editing', service: 'Subtitle/Caption Addition', requiredSkills: ['Video Editing'], estimatedMinutes: 10, location: 'Online', isRemote: true, difficulty: 'Beginner', beginnerFriendly: true, organizer: organizer._id },
  { title: 'Fix a small bug on club site', description: 'One button breaks on mobile. Quick 15-minute fix.', category: 'Programming', service: 'Bug Fixing', requiredSkills: ['Programming'], estimatedMinutes: 15, location: 'Online', isRemote: true, difficulty: 'Intermediate', organizer: organizer._id },
  { title: 'Proofread event announcement', description: 'Proofread a 200-word announcement for errors.', category: 'Writing', service: 'Proofreading', requiredSkills: ['Writing'], estimatedMinutes: 10, location: 'Online', isRemote: true, difficulty: 'Beginner', beginnerFriendly: true, organizer: organizer._id },
  { title: 'Event photography team (need 3)', description: 'Take photos during Saturday seminar. Team of 3, 15 mins each.', category: 'Photography', service: 'Event Photography', requiredSkills: ['Photography'], estimatedMinutes: 15, location: 'Seminar Hall', isRemote: false, difficulty: 'Beginner', beginnerFriendly: true, slotsTotal: 3, organizer: organizer._id },
  { title: 'Explain one Python problem', description: 'Help a first-year student understand a worked example.', category: 'Tutoring', service: 'Python', requiredSkills: ['Tutoring'], estimatedMinutes: 10, location: 'Learning Center', isRemote: false, difficulty: 'Beginner', beginnerFriendly: true, organizer: organizer._id },
  { title: 'Translate welcome note to Hindi', description: 'Translate a short welcome note for incoming students.', category: 'Translation', service: 'English -> Hindi', requiredSkills: ['Translation'], estimatedMinutes: 10, location: 'Online', isRemote: true, difficulty: 'Beginner', beginnerFriendly: true, organizer: organizer._id },
  { title: 'Sort donated books (team)', description: 'Sort 2 boxes of donated books by subject. 2 volunteers needed.', category: 'Logistics', service: 'Book Sorting', requiredSkills: ['Logistics'], estimatedMinutes: 15, location: 'Library, Ground Floor', isRemote: false, difficulty: 'Beginner', beginnerFriendly: true, slotsTotal: 2, organizer: organizer._id }
]); console.log('Demo data ready. Student: student@micromatch.demo / demo123; Organizer: organizer@micromatch.demo / demo123'); process.exit();
