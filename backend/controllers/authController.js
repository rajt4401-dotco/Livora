const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

// Helper: generate JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Helper: send token response
const sendToken = (res, user, statusCode = 200) => {
  const token = generateToken(user);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      room: user.room,
    },
  });
};

// ── Validation rules ──────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'admin', 'warden']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/auth/register
const register = [
  ...registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, course, year, rollNumber } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: role || 'student', phone, course, year, rollNumber });

    sendToken(res, user, 201);
  }),
];

// POST /api/auth/login
const login = [
  ...loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    sendToken(res, user);
  }),
];

// GET /api/auth/me  (protected)
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('room', 'number block floor type amenities');
  res.json({ success: true, user });
});

// PUT /api/auth/update-profile  (protected)
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, course, year } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, course, year },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

// PUT /api/auth/change-password  (protected)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  sendToken(res, user);
});

module.exports = { register, login, getMe, updateProfile, changePassword };
