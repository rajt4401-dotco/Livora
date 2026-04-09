const Leave = require('../models/Leave');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/leave
const getAllLeave = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = {};

  // Students can only see their own
  if (req.user.role === 'student') filter.student = req.user.id;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [leaves, total] = await Promise.all([
    Leave.find(filter)
      .populate('student', 'name email avatar room')
      .populate('approvedBy', 'name role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt'),
    Leave.countDocuments(filter),
  ]);

  res.json({ success: true, count: leaves.length, total, totalPages: Math.ceil(total / limit), page: parseInt(page), leaves });
});

// GET /api/leave/:id
const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('student', 'name email avatar room')
    .populate('approvedBy', 'name role');
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  if (req.user.role === 'student' && leave.student._id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, leave });
});

// POST /api/leave  (students)
const applyLeave = asyncHandler(async (req, res) => {
  const { fromDate, toDate, reason, emergencyContact, destination } = req.body;

  // Check for date conflicts with existing leaves
  const conflict = await Leave.findOne({
    student: req.user.id,
    status: 'Approved',
    $or: [
      { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } },
    ],
  });

  if (conflict) {
    return res.status(400).json({ success: false, message: 'You already have an approved leave overlapping with these dates' });
  }

  const leave = await Leave.create({
    student: req.user.id,
    room: req.user.room,
    fromDate,
    toDate,
    reason,
    emergencyContact,
    destination,
  });

  await leave.populate('student', 'name email avatar');
  res.status(201).json({ success: true, message: 'Leave application submitted successfully', leave });
});

// PUT /api/leave/:id/action  (admin/warden — approve or reject)
const processLeave = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  if (leave.status !== 'Pending') {
    return res.status(400).json({ success: false, message: `Leave has already been ${leave.status.toLowerCase()}` });
  }

  leave.status = action === 'approve' ? 'Approved' : 'Rejected';
  leave.approvedBy = req.user.id;
  leave.approvedAt = new Date();
  if (action === 'reject' && rejectionReason) leave.rejectionReason = rejectionReason;

  await leave.save();
  await leave.populate('student', 'name email');
  await leave.populate('approvedBy', 'name role');

  res.json({
    success: true,
    message: `Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    leave,
  });
});

// DELETE /api/leave/:id  (student — cancel while Pending)
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  if (leave.student.toString() !== req.user.id && req.user.role === 'student') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave requests can be cancelled' });
  }

  await leave.deleteOne();
  res.json({ success: true, message: 'Leave request cancelled' });
});

// GET /api/leave/stats  (admin/warden)
const getLeaveStats = asyncHandler(async (req, res) => {
  const [all, pending, approved, rejected] = await Promise.all([
    Leave.countDocuments(),
    Leave.countDocuments({ status: 'Pending' }),
    Leave.countDocuments({ status: 'Approved' }),
    Leave.countDocuments({ status: 'Rejected' }),
  ]);

  res.json({ success: true, stats: { total: all, pending, approved, rejected } });
});

module.exports = { getAllLeave, getLeaveById, applyLeave, processLeave, cancelLeave, getLeaveStats };
