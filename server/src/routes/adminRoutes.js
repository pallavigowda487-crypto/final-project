import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ApiUsage from '../models/ApiUsage.js';
import Exam from '../models/Exam.js';
import QuestionPaper from '../models/QuestionPaper.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

router.post(
  '/seed-admin',
  [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').notEmpty()],
  async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      existing.role = 'admin';
      await existing.save();
      return res.json({ success: true, message: 'User promoted to admin' });
    }
    const admin = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'admin',
    });
    res.status(201).json({ success: true, message: 'Admin created', userId: admin._id });
  }
);

router.use(protect, authorize('admin'));

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

router.patch('/users/:id', async (req, res) => {
  const { isActive, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (role && ['faculty', 'student'].includes(role)) user.role = role;
  await user.save();

  await logAudit({
    userId: req.user._id,
    userEmail: req.user.email,
    role: req.user.role,
    action: 'USER_UPDATE',
    resource: 'User',
    resourceId: user._id.toString(),
    details: { isActive, role },
    req,
  });

  res.json({ success: true, user });
});

router.delete('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'User deactivated' });
});

router.get('/api-usage', async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const usage = await ApiUsage.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 }).limit(500);
  const summary = await ApiUsage.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$endpoint',
        count: { $sum: 1 },
        avgLatency: { $avg: '$latencyMs' },
      },
    },
  ]);
  res.json({ success: true, usage, summary });
});

router.get('/audit-logs', async (req, res) => {
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200).populate('userId', 'name email');
  res.json({ success: true, logs });
});

router.get('/metrics', async (req, res) => {
  const [userCount, facultyCount, studentCount, paperCount, evaluatedExams] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'faculty', isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    QuestionPaper.countDocuments(),
    Exam.find({ status: 'evaluated' }),
  ]);

  const avgEvaluationScore =
    evaluatedExams.length > 0
      ? evaluatedExams.reduce((s, e) => s + (e.percentage || 0), 0) / evaluatedExams.length
      : 0;

  res.json({
    success: true,
    metrics: {
      users: { total: userCount, faculty: facultyCount, students: studentCount },
      questionPapers: paperCount,
      evaluatedExams: evaluatedExams.length,
      averageScore: avgEvaluationScore,
    },
  });
});

export default router;
