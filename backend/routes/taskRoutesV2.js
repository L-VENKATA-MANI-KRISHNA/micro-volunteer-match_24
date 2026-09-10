import express from 'express';
import jwt from 'jsonwebtoken';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { CATEGORIES, DIFFICULTIES, SERVICE_CATALOG } from '../config/catalog.js';

const router = express.Router();
const populated = query => query
  .populate('organizer', 'name ratingAvg ratingCount')
  .populate('volunteer', 'name email ratingAvg')
  .populate('volunteers', 'name email ratingAvg')
  .populate('applicants', 'name email')
  .populate('comments.user', 'name role');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Reusable scoring: exact service = 70, parent skill = 20, interest = 5, availability = 5. Max 100.
export const matchFor = (task, user) => {
  const skills = user?.skills || [];
  const interests = user?.interests || [];
  const availability = user?.availability || [];
  const skill = skills.find(item => item.name === task.category);
  const serviceMatch = Boolean(
    skill?.services?.includes(task.service) ||
    skills.some(item => item.services?.includes(task.service))
  );
  const skillMatch = Boolean(
    skill ||
    (task.requiredSkills || []).some(required => skills.some(item => item.name === required))
  );
  const interestMatch = interests.some(item => [task.category, task.service].includes(item));

  let availabilityMatch = false;
  if (!task.preferredTime) {
    availabilityMatch = true;
  } else if (availability.length === 0) {
    availabilityMatch = false;
  } else {
    try {
      const pref = new Date(task.preferredTime);
      const dayName = DAY_NAMES[pref.getDay()];
      const prefMinutes = pref.getHours() * 60 + pref.getMinutes();
      const toMinutes = t => {
        if (!t || typeof t !== 'string' || !t.includes(':')) return null;
        const [h, m] = t.split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
      };
      availabilityMatch = availability.some(slot => {
        if (!slot?.day) return true;
        if (slot.day.toLowerCase() !== dayName.toLowerCase()) return false;
        const start = toMinutes(slot.start);
        const end = toMinutes(slot.end);
        if (start == null || end == null) return true;
        return prefMinutes >= start && prefMinutes <= end;
      });
    } catch {
      availabilityMatch = availability.length > 0;
    }
  }

  const score = Math.min(
    100,
    (serviceMatch ? 70 : 0) + (skillMatch ? 20 : 0) + (interestMatch ? 5 : 0) + (availabilityMatch ? 5 : 0)
  );
  const reasons = [];
  if (serviceMatch) reasons.push(`\u2713 ${task.service}`);
  if (skillMatch) reasons.push(`\u2713 ${task.category}`);
  if (interestMatch) reasons.push('\u2713 Interested in this work');
  if (availabilityMatch) reasons.push(task.preferredTime ? '\u2713 Available at requested time' : '\u2713 No time conflict');
  if (!serviceMatch && skillMatch) reasons.push('Add this exact service to reach 100%');
  if (!skillMatch && !serviceMatch) reasons.push('Select this category + service in your profile');
  return { score, serviceMatch, skillMatch, interestMatch, availabilityMatch, reasons };
};

const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (user) req.user = user;
  } catch { /* public */ }
  next();
};

const withMatch = (taskDoc, user) => {
  const obj = taskDoc.toObject ? taskDoc.toObject() : taskDoc;
  if (user && user.role === 'student') return { ...obj, match: matchFor(obj, user) };
  return obj;
};

const slotsLeft = t => Math.max(0, (t.slotsTotal || 1) - (t.volunteers?.length || (t.volunteer ? 1 : 0)));

async function awardImpact(task) {
  if (task.impactCounted) return;
  const ids = task.volunteers?.length ? task.volunteers.map(String) : (task.volunteer ? [String(task.volunteer._id || task.volunteer)] : []);
  const unique = [...new Set(ids)];
  for (const vid of unique) {
    await User.findByIdAndUpdate(vid, { $inc: { completedTasks: 1, impactMinutes: task.estimatedMinutes, peopleHelped: 1 } });
  }
  task.impactCounted = true;
  await task.save();
}

router.get('/catalog', (_req, res) => res.json({ catalog: SERVICE_CATALOG, categories: CATEGORIES, difficulties: DIFFICULTIES }));

router.get('/recommendations', protect, authorize('student'), async (req, res, next) => {
  try {
    const tasks = await populated(Task.find({ status: 'OPEN' }).sort({ createdAt: -1 }).limit(100));
    // Respect saved alerts: boost tasks matching alerts
    const alerts = req.user.alerts || [];
    const matchesAlert = t => alerts.some(a =>
      (!a.category || a.category === t.category) &&
      (!a.service || a.service === t.service));
    res.json({
      tasks: tasks
        .map(task => {
          const obj = task.toObject();
          const match = matchFor(obj, req.user);
          if (matchesAlert(obj)) match.score = Math.min(100, match.score + 5);
          return { ...obj, match, slotsLeft: slotsLeft(obj) };
        })
        .sort((a, b) => (b.urgency === 'Urgent') - (a.urgency === 'Urgent') || b.match.score - a.match.score)
        .slice(0, 8)
    });
  } catch (e) { next(e); }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, service, skill, location, status = 'OPEN', remote, difficulty, minMinutes, maxMinutes, search, minMatch, urgency, beginnerFriendly } = req.query;
    const filter = {};
    const andClauses = [];
    if (status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (service) filter.service = new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (skill) {
      const rx = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andClauses.push({ $or: [{ service: rx }, { requiredSkills: rx }, { requiredSkill: rx }, { category: rx }] });
    }
    if (location) filter.location = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (remote !== undefined && remote !== '') filter.isRemote = remote === 'true';
    if (difficulty) filter.difficulty = difficulty;
    if (urgency) filter.urgency = urgency;
    if (beginnerFriendly === 'true') filter.beginnerFriendly = true;
    if (minMinutes || maxMinutes) {
      filter.estimatedMinutes = {
        ...(minMinutes && { $gte: Number(minMinutes) }),
        ...(maxMinutes && { $lte: Number(maxMinutes) })
      };
    }
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andClauses.push({ $or: [{ title: rx }, { description: rx }, { service: rx }, { category: rx }] });
    }
    const finalFilter = andClauses.length ? { ...filter, $and: andClauses } : filter;
    const tasks = await populated(Task.find(finalFilter).sort({ createdAt: -1 }).limit(200));
    let out = tasks.map(t => ({ ...withMatch(t, req.user), slotsLeft: slotsLeft(t) }));
    if (minMatch && req.user) out = out.filter(t => (t.match?.score ?? 0) >= Number(minMatch));
    // Urgent first, then best match for students, newest otherwise
    out = out.sort((a, b) => ((b.urgency === 'Urgent') - (a.urgency === 'Urgent')) || ((req.user?.role === 'student') ? ((b.match?.score ?? 0) - (a.match?.score ?? 0)) : (new Date(b.createdAt) - new Date(a.createdAt))));
    res.json({ tasks: out });
  } catch (e) { next(e); }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const filter = req.user.role === 'organizer'
      ? { organizer: req.user._id }
      : { $or: [{ volunteer: req.user._id }, { volunteers: req.user._id }] };
    const mine = await populated(Task.find(filter).sort({ createdAt: -1 }));
    res.json({ tasks: mine.map(t => ({ ...t.toObject(), slotsLeft: slotsLeft(t) })) });
  } catch (e) { next(e); }
});

router.post('/', protect, authorize('organizer'), async (req, res, next) => {
  try {
    const { title, description, category, service, requiredSkills = [], estimatedMinutes, location, isRemote, difficulty = 'Beginner', preferredTime, urgency = 'Normal', deadline, beginnerFriendly = false, slotsTotal = 1, requiresApproval = false } = req.body;
    const cleanTitle = String(title || '').trim();
    const cleanDesc = String(description || '').trim();
    const cleanLocation = String(location || '').trim();
    if (!cleanTitle || !cleanDesc || !CATEGORIES.includes(category) || !service || !SERVICE_CATALOG[category]?.includes(service) || !cleanLocation) {
      return res.status(400).json({ message: 'Fill valid fields; service must match the category' });
    }
    if (cleanTitle.length > 120 || cleanDesc.length > 2000) return res.status(400).json({ message: 'Title too long or description too long' });
    if (!Number.isInteger(Number(estimatedMinutes)) || Number(estimatedMinutes) < 10 || Number(estimatedMinutes) > 15) return res.status(400).json({ message: 'Duration must be 10 to 15 minutes' });
    if (!DIFFICULTIES.includes(difficulty)) return res.status(400).json({ message: 'Invalid difficulty' });
    if (!['Normal', 'Urgent'].includes(urgency)) return res.status(400).json({ message: 'Invalid urgency' });
    const slots = Math.min(5, Math.max(1, Number(slotsTotal) || 1));
    let pref = null;
    if (preferredTime) { pref = new Date(preferredTime); if (Number.isNaN(pref.getTime())) return res.status(400).json({ message: 'Invalid preferred date/time' }); }
    let dl = null;
    if (deadline) { dl = new Date(deadline); if (Number.isNaN(dl.getTime())) return res.status(400).json({ message: 'Invalid deadline' }); }
    const cleanRequired = Array.isArray(requiredSkills) ? requiredSkills.map(String).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
    const task = await Task.create({
      title: cleanTitle, description: cleanDesc, category, service,
      requiredSkills: cleanRequired.length ? cleanRequired : [category],
      requiredSkill: service,
      estimatedMinutes: Number(estimatedMinutes), location: cleanLocation,
      isRemote: Boolean(isRemote), difficulty, preferredTime: pref,
      urgency, deadline: dl, beginnerFriendly: Boolean(beginnerFriendly),
      slotsTotal: slots, volunteers: [], requiresApproval: Boolean(requiresApproval),
      organizer: req.user._id
    });
    res.status(201).json({ task });
  } catch (e) { next(e); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const task = await populated(Task.findById(req.params.id));
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task: { ...withMatch(task, req.user), slotsLeft: slotsLeft(task) } });
  } catch (e) { next(e); }
});

// Clone a task (organizer shortcut)
router.post('/:id/clone', protect, authorize('organizer'), async (req, res, next) => {
  try {
    const src = await Task.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!src) return res.status(404).json({ message: 'Task not found' });
    const copy = await Task.create({
      title: src.title, description: src.description, category: src.category, service: src.service,
      requiredSkills: src.requiredSkills, requiredSkill: src.requiredSkill,
      estimatedMinutes: src.estimatedMinutes, location: src.location, isRemote: src.isRemote,
      difficulty: src.difficulty, urgency: src.urgency, beginnerFriendly: src.beginnerFriendly,
      slotsTotal: src.slotsTotal, requiresApproval: src.requiresApproval,
      organizer: req.user._id, status: 'OPEN'
    });
    res.status(201).json({ task: copy });
  } catch (e) { next(e); }
});

// Claim (atomic for single-slot, best-effort for team slots)
router.patch('/:id/claim', protect, authorize('student'), async (req, res, next) => {
  try {
    // Fast atomic path for classic 1-slot tasks: prevents double-claim races.
    const single = await populated(Task.findOneAndUpdate(
      { _id: req.params.id, status: 'OPEN', volunteer: null, $or: [{ slotsTotal: 1 }, { slotsTotal: { $exists: false } }] },
      { status: 'IN-PROGRESS', volunteer: req.user._id, $addToSet: { volunteers: req.user._id } },
      { new: true }
    ));
    if (single) return res.json({ task: single });

    const task = await Task.findById(req.params.id);
    if (!task || !['OPEN', 'IN-PROGRESS'].includes(task.status)) return res.status(409).json({ message: 'This task is no longer available' });
    if ((task.slotsTotal || 1) <= 1) return res.status(409).json({ message: 'This task is no longer available' });
    const vols = (task.volunteers || []).map(String);
    if (vols.includes(String(req.user._id)) || String(task.volunteer) === String(req.user._id)) return res.status(409).json({ message: 'You already claimed this task' });
    if (vols.length + (task.volunteer && !vols.includes(String(task.volunteer)) ? 1 : 0) >= (task.slotsTotal || 1)) return res.status(409).json({ message: 'All slots are filled' });
    task.volunteers.push(req.user._id);
    if (!task.volunteer) task.volunteer = req.user._id; // backward compat
    task.applicants = (task.applicants || []).filter(a => String(a) !== String(req.user._id));
    task.status = 'IN-PROGRESS';
    await task.save();
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Request to join (applicant queue when full or approval-based)
router.post('/:id/request', protect, authorize('student'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.status === 'COMPLETED') return res.status(409).json({ message: 'Task not available' });
    if ((task.volunteers || []).map(String).includes(String(req.user._id))) return res.status(409).json({ message: 'Already a volunteer' });
    if (!(task.applicants || []).map(String).includes(String(req.user._id))) task.applicants.push(req.user._id);
    await task.save();
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Organizer picks an applicant
router.post('/:id/pick', protect, authorize('organizer'), async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const vols = (task.volunteers || []).map(String);
    if (vols.length >= (task.slotsTotal || 1)) return res.status(409).json({ message: 'All slots filled' });
    if (!vols.includes(String(userId))) task.volunteers.push(userId);
    if (!task.volunteer) task.volunteer = userId;
    task.applicants = (task.applicants || []).filter(a => String(a) !== String(userId));
    task.status = 'IN-PROGRESS';
    await task.save();
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Volunteer submits proof
router.patch('/:id/submit', protect, authorize('student'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isVol = (task.volunteers || []).map(String).includes(String(req.user._id)) || String(task.volunteer) === String(req.user._id);
    if (!isVol || task.status !== 'IN-PROGRESS') return res.status(403).json({ message: 'Only the assigned volunteer can submit proof' });
    const { proofUrl = '', proofNote = '' } = req.body;
    if (!String(proofUrl).trim() && !String(proofNote).trim()) return res.status(400).json({ message: 'Add a link or note as proof' });
    task.proofUrl = String(proofUrl).slice(0, 500);
    task.proofNote = String(proofNote).slice(0, 1000);
    task.submittedAt = new Date();
    if (task.requiresApproval) {
      task.status = 'PENDING_REVIEW';
      await task.save();
    } else {
      task.status = 'COMPLETED';
      task.completedAt = new Date();
      await task.save();
      await awardImpact(task);
    }
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Organizer approves proof -> COMPLETED + impact
router.patch('/:id/approve', protect, authorize('organizer'), async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!['PENDING_REVIEW', 'IN-PROGRESS'].includes(task.status)) return res.status(409).json({ message: 'Nothing to approve' });
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();
    await awardImpact(task);
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

router.patch('/:id/reject', protect, authorize('organizer'), async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!task || task.status !== 'PENDING_REVIEW') return res.status(409).json({ message: 'Nothing to reject' });
    task.status = 'IN-PROGRESS';
    task.submittedAt = null;
    await task.save();
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Legacy direct complete (no-approval tasks)
router.patch('/:id/complete', protect, authorize('student'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isVol = (task.volunteers || []).map(String).includes(String(req.user._id)) || String(task.volunteer) === String(req.user._id);
    if (!isVol || !['IN-PROGRESS', 'PENDING_REVIEW'].includes(task.status)) return res.status(403).json({ message: 'Only the assigned volunteer can complete an in-progress task' });
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();
    await awardImpact(task);
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Ratings after completion
router.post('/:id/rate', protect, async (req, res, next) => {
  try {
    const { score, review = '' } = req.body;
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ message: 'Score must be 1-5' });
    const task = await Task.findById(req.params.id);
    if (!task || task.status !== 'COMPLETED') return res.status(409).json({ message: 'Can only rate completed tasks' });
    const isOrganizer = String(task.organizer) === String(req.user._id);
    const isVol = (task.volunteers || []).map(String).includes(String(req.user._id)) || String(task.volunteer) === String(req.user._id);
    if (!isOrganizer && !isVol) return res.status(403).json({ message: 'Not part of this task' });
    let ratedUserId;
    if (isOrganizer) {
      task.volunteerRating = score;
      task.volunteerReview = String(review).slice(0, 500);
      ratedUserId = task.volunteer || task.volunteers?.[0];
    } else {
      task.organizerRating = score;
      task.organizerReview = String(review).slice(0, 500);
      ratedUserId = task.organizer;
    }
    await task.save();
    if (ratedUserId) {
      const u = await User.findById(ratedUserId);
      if (u) {
        const total = (u.ratingAvg || 0) * (u.ratingCount || 0) + score;
        u.ratingCount = (u.ratingCount || 0) + 1;
        u.ratingAvg = Math.round((total / u.ratingCount) * 10) / 10;
        await u.save();
      }
    }
    res.json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

// Comments / Q&A
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!String(text || '').trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ user: req.user._id, text: String(text).trim().slice(0, 500) });
    await task.save();
    res.status(201).json({ task: await populated(Task.findById(task._id)) });
  } catch (e) { next(e); }
});

export default router;
