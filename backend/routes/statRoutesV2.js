import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { SERVICE_CATALOG } from '../config/catalog.js';

const router = express.Router();
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const isValidUrl = v => {
  if (!v) return true;
  try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
};

router.get('/campus', async (_req, res, next) => {
  try {
    const [impact, completed, active, urgent] = await Promise.all([
      Task.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, minutes: { $sum: '$estimatedMinutes' } } }]),
      Task.countDocuments({ status: 'COMPLETED' }),
      User.countDocuments({ role: 'student', impactMinutes: { $gt: 0 } }),
      Task.countDocuments({ status: 'OPEN', urgency: 'Urgent' })
    ]);
    res.json({ impactMinutes: impact[0]?.minutes || 0, completedTasks: completed, activeVolunteers: active, urgentOpen: urgent });
  } catch (e) { next(e); }
});

// Demand-supply gaps: open tasks vs volunteers per category
router.get('/gaps', async (_req, res, next) => {
  try {
    const [openByCat, vols] = await Promise.all([
      Task.aggregate([{ $match: { status: 'OPEN' } }, { $group: { _id: '$category', open: { $sum: 1 } } }]),
      User.aggregate([{ $match: { role: 'student' } }, { $unwind: '$skills' }, { $group: { _id: '$skills.name', volunteers: { $sum: 1 } } }])
    ]);
    const cats = [...new Set([...openByCat.map(x => x._id), ...vols.map(x => x._id)])];
    const gaps = cats.map(c => ({
      category: c,
      open: openByCat.find(x => x._id === c)?.open || 0,
      volunteers: vols.find(x => x._id === c)?.volunteers || 0
    })).sort((a, b) => (b.open - b.volunteers) - (a.open - a.volunteers));
    res.json({ gaps });
  } catch (e) { next(e); }
});

// Leaderboard: top volunteers + top categories
router.get('/leaderboard', async (_req, res, next) => {
  try {
    const top = await User.find({ role: 'student' }).sort({ impactMinutes: -1 }).limit(10).select('name impactMinutes completedTasks ratingAvg');
    res.json({ top });
  } catch (e) { next(e); }
});

// Certificate data for shareable impact card
router.get('/certificate', protect, async (req, res, next) => {
  try {
    const byCategory = await Task.aggregate([
      { $match: { $or: [{ volunteer: req.user._id }, { volunteers: req.user._id }], status: 'COMPLETED' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 3 }
    ]);
    res.json({
      name: req.user.name,
      completedTasks: req.user.completedTasks,
      impactMinutes: req.user.impactMinutes,
      peopleHelped: req.user.peopleHelped || 0,
      ratingAvg: req.user.ratingAvg || 0,
      topSkills: byCategory.map(x => x._id),
      date: new Date().toLocaleDateString()
    });
  } catch (e) { next(e); }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const match = { $or: [{ volunteer: req.user._id }, { volunteers: req.user._id }], status: 'COMPLETED' };
    const [byCategory, byService] = await Promise.all([
      Task.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 }, minutes: { $sum: '$estimatedMinutes' } } }]),
      Task.aggregate([{ $match: match }, { $group: { _id: '$service', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }])
    ]);
    const countFor = cat => byCategory.find(x => x._id === cat)?.count || 0;
    const badges = [
      { name: 'First Contribution', icon: '🏅', detail: 'Complete your first task.', earned: req.user.completedTasks >= 1, progress: Math.min(req.user.completedTasks, 1), target: 1 },
      { name: 'Design Helper', icon: '🎨', detail: 'Complete 5 design tasks.', earned: countFor('Design') >= 5, progress: Math.min(countFor('Design'), 5), target: 5 },
      { name: 'Video Pro', icon: '🎬', detail: 'Complete 5 video editing tasks.', earned: countFor('Video Editing') >= 5, progress: Math.min(countFor('Video Editing'), 5), target: 5 },
      { name: 'Code Helper', icon: '💻', detail: 'Complete 5 programming tasks.', earned: countFor('Programming') >= 5, progress: Math.min(countFor('Programming'), 5), target: 5 },
      { name: 'Writing Star', icon: '✍️', detail: 'Complete 3 writing tasks.', earned: countFor('Writing') >= 3, progress: Math.min(countFor('Writing'), 3), target: 3 },
      { name: 'Photo Friend', icon: '📸', detail: 'Complete 3 photography tasks.', earned: countFor('Photography') >= 3, progress: Math.min(countFor('Photography'), 3), target: 3 },
      { name: 'Tutor Champ', icon: '📚', detail: 'Complete 3 tutoring tasks.', earned: countFor('Tutoring') >= 3, progress: Math.min(countFor('Tutoring'), 3), target: 3 },
      { name: 'Team Player', icon: '🤝', detail: 'Join a team task.', earned: false, progress: 0, target: 1 },
      { name: 'Trusted Star', icon: '⭐', detail: 'Earn 4.5+ rating (3+ ratings).', earned: (req.user.ratingAvg || 0) >= 4.5 && (req.user.ratingCount || 0) >= 3, progress: Math.min(req.user.ratingCount || 0, 3), target: 3 },
      { name: 'Community Champion', icon: '🌟', detail: 'Complete 20 volunteer tasks.', earned: req.user.completedTasks >= 20, progress: Math.min(req.user.completedTasks, 20), target: 20 }
    ];
    res.json({
      completedTasks: req.user.completedTasks,
      impactMinutes: req.user.impactMinutes,
      peopleHelped: req.user.peopleHelped || 0,
      ratingAvg: req.user.ratingAvg || 0, ratingCount: req.user.ratingCount || 0,
      skillsUsed: byCategory.length,
      servicesProvided: byService.reduce((n, s) => n + s.count, 0),
      byCategory, byService, badges
    });
  } catch (e) { next(e); }
});

// Saved alerts CRUD (high-match notifications)
router.get('/alerts', protect, async (req, res) => res.json({ alerts: req.user.alerts || [] }));
router.post('/alerts', protect, async (req, res, next) => {
  try {
    const { category = '', service = '', minMatch = 80 } = req.body;
    req.user.alerts.push({ category, service, minMatch: Number(minMatch) || 80 });
    req.user.alerts = req.user.alerts.slice(-10);
    await req.user.save();
    res.status(201).json({ alerts: req.user.alerts });
  } catch (e) { next(e); }
});
router.delete('/alerts/:idx', protect, async (req, res, next) => {
  try {
    req.user.alerts.splice(Number(req.params.idx), 1);
    await req.user.save();
    res.json({ alerts: req.user.alerts });
  } catch (e) { next(e); }
});

router.patch('/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['skills', 'interests', 'availability', 'portfolio'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

    if (updates.skills !== undefined) {
      if (!Array.isArray(updates.skills)) return res.status(400).json({ message: 'Skills must be an array' });
      for (const g of updates.skills) {
        if (!g || !SERVICE_CATALOG[g.name]) return res.status(400).json({ message: `Unknown skill: ${g?.name}` });
        if (!Array.isArray(g.services)) return res.status(400).json({ message: 'Services must be an array' });
        for (const s of g.services) {
          if (!SERVICE_CATALOG[g.name].includes(s)) return res.status(400).json({ message: `"${s}" is not a valid ${g.name} service` });
        }
      }
      updates.skills = updates.skills.filter(g => g.services && g.services.length > 0).slice(0, 10);
    }
    if (updates.interests !== undefined) {
      if (!Array.isArray(updates.interests)) return res.status(400).json({ message: 'Interests must be an array' });
      updates.interests = [...new Set(updates.interests.map(String).map(s => s.trim()).filter(Boolean))].slice(0, 20);
    }
    if (updates.availability !== undefined) {
      if (!Array.isArray(updates.availability)) return res.status(400).json({ message: 'Availability must be an array' });
      for (const a of updates.availability) {
        if (!a?.day || !VALID_DAYS.includes(a.day)) return res.status(400).json({ message: 'Availability day must be Monday-Sunday' });
        if (a.start && !/^\d{2}:\d{2}$/.test(a.start)) return res.status(400).json({ message: 'Start time must be HH:MM' });
        if (a.end && !/^\d{2}:\d{2}$/.test(a.end)) return res.status(400).json({ message: 'End time must be HH:MM' });
      }
      updates.availability = updates.availability.slice(0, 14);
    }
    if (updates.portfolio !== undefined) {
      if (!Array.isArray(updates.portfolio)) return res.status(400).json({ message: 'Portfolio must be an array' });
      if (updates.portfolio.length > 12) return res.status(400).json({ message: 'Portfolio limited to 12 links' });
      for (const p of updates.portfolio) {
        if (!p?.title?.trim() && !p?.url?.trim()) continue;
        if (p.url && p.url.trim() && !isValidUrl(p.url.trim())) return res.status(400).json({ message: `Invalid portfolio URL: ${p.url}` });
      }
      updates.portfolio = updates.portfolio
        .map(p => ({ title: String(p.title || '').trim().slice(0, 80), url: String(p.url || '').trim().slice(0, 500) }))
        .filter(p => p.title || p.url);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
