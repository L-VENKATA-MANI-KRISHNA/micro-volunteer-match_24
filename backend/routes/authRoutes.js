import express from 'express'; import jwt from 'jsonwebtoken'; import User from '../models/User.js'; import { protect } from '../middleware/auth.js'; import { SERVICE_CATALOG } from '../config/catalog.js';
const router = express.Router(); const tokenFor = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
router.post('/register', async (req, res, next) => { try { const { name, email, password, role, skills = [], interests = [], availability = [], portfolio = [] } = req.body; if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required' }); if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' }); if (role && !['student', 'organizer'].includes(role)) return res.status(400).json({ message: 'Invalid role' }); const normalizedSkills = (Array.isArray(skills) ? skills : []).map(skill => typeof skill === 'string' ? { name: skill, services: [] } : skill).filter(g => g && SERVICE_CATALOG[g.name]).map(g => ({ name: g.name, services: (Array.isArray(g.services) ? g.services : []).filter(s => SERVICE_CATALOG[g.name].includes(s)) })).filter(g => g.services.length > 0).slice(0, 10); const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role: role || 'student', skills: normalizedSkills, interests: Array.isArray(interests) ? interests.map(String).slice(0, 20) : [], availability: Array.isArray(availability) ? availability.slice(0, 14) : [], portfolio: Array.isArray(portfolio) ? portfolio.slice(0, 12) : [] }); res.status(201).json({ token: tokenFor(user._id), user: { ...user.toObject(), password: undefined } }); } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' }); next(e); } });
router.post('/login', async (req, res, next) => { try { const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() }).select('+password'); if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Incorrect email or password' }); const object = user.toObject(); delete object.password; res.json({ token: tokenFor(user._id), user: object }); } catch (e) { next(e); } });
router.get('/me', protect, (req, res) => res.json({ user: req.user }));
router.patch('/me', protect, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    const user = await (await import('../models/User.js')).default.findByIdAndUpdate(
      req.user._id, { name: name.trim() }, { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (e) { next(e); }
});
export default router;
