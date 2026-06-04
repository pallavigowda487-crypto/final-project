import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signPasswordResetToken = (id) =>
  jwt.sign({ id, purpose: 'password-reset' }, process.env.JWT_SECRET, {
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '15m',
  });

const formatValidationErrors = (errors) =>
  errors
    .array()
    .map((e) => e.msg)
    .filter(Boolean)
    .join('. ');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'faculty', 'student']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const message = formatValidationErrors(errors);
        return res.status(400).json({ success: false, message, errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please sign in instead.',
        });
      }

      const allowedRole = role === 'admin' ? 'student' : role || 'student';
      const user = await User.create({ name, email, password, role: allowedRole });
      const token = signToken(user._id, user.role);

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        role: user.role,
        action: 'USER_REGISTER',
        resource: 'User',
        resourceId: user._id.toString(),
        req,
      });

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please sign in instead.',
        });
      }
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      await logAudit({
        action: 'LOGIN_FAILED',
        details: { email: req.body.email },
        req,
        status: 'failure',
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }
    const token = signToken(user._id, user.role);
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      role: user.role,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      req,
    });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  }
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findOne({ email: req.body.email, isActive: true });
    const message = 'If an active account exists for that email, password reset instructions are available.';
    if (!user) return res.json({ success: true, message });

    const resetToken = signPasswordResetToken(user._id);
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      role: user.role,
      action: 'PASSWORD_RESET_REQUEST',
      resource: 'User',
      resourceId: user._id.toString(),
      req,
    });

    const payload = { success: true, message };
    if (process.env.NODE_ENV !== 'production') {
      payload.resetToken = resetToken;
      payload.resetUrl = resetUrl;
    }

    res.json(payload);
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ success: false, message: 'Invalid reset token' });
      }

      const user = await User.findById(decoded.id).select('+password');
      if (!user || !user.isActive) {
        return res.status(400).json({ success: false, message: 'Invalid reset token' });
      }

      if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
        return res.status(400).json({ success: false, message: 'Reset token has already been used' });
      }

      user.password = req.body.password;
      await user.save();

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        role: user.role,
        action: 'PASSWORD_RESET_COMPLETE',
        resource: 'User',
        resourceId: user._id.toString(),
        req,
      });

      res.json({ success: true, message: 'Password reset successful. Please sign in.' });
    } catch {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
  }
);

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
