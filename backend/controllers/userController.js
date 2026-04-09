const User = require('../models/User');
const Room = require('../models/Room');
const asyncHandler = require('../middleware/asyncHandler');

// ── Pagination helper ─────────────────────────────────────────────────────────
const paginate = (query, req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/users  (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({}, req);
  const { role, search, block } = req.query;

  const filter = { isActive: true };
  if (role) filter.role = role;
  if (block) filter.block = block;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).populate('room', 'number block').skip(skip).limit(limit).sort('-createdAt'),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    users,
  });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('room', 'number block floor type amenities');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// PUT /api/users/:id  (admin only)
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, course, year, rollNumber, block, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, role, course, year, rollNumber, block, isActive },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// DELETE /api/users/:id  (admin only) — soft delete
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deactivated successfully' });
});

// GET /api/users/stats  (admin/warden)
const getStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalAdmins, totalWardens, rooms] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    User.countDocuments({ role: 'warden', isActive: true }),
    Room.find(),
  ]);

  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'Available').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'Maintenance').length;

  res.json({
    success: true,
    stats: {
      users: { total: totalStudents + totalAdmins + totalWardens, students: totalStudents, admins: totalAdmins, wardens: totalWardens },
      rooms: { total: rooms.length, occupied: occupiedRooms, available: availableRooms, maintenance: maintenanceRooms },
    },
  });
});

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getStats };
