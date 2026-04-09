const Fee = require('../models/Fee');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { predictFeeDefault } = require('../services/aiService');

// GET /api/fees  (admin/warden — all fees; student — own fees)
const getAllFees = asyncHandler(async (req, res) => {
  const { status, semester, page = 1, limit = 10, search } = req.query;
  const filter = {};

  // Students only see their own fees
  if (req.user.role === 'student') filter.student = req.user.id;

  if (status) filter.status = status;
  if (semester) filter.semester = semester;

  let query = Fee.find(filter).populate('student', 'name email avatar room').populate('room', 'number block');

  if (search) {
    const matchingStudents = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    filter.student = { $in: matchingStudents.map((s) => s._id) };
  }

  const skip = (page - 1) * limit;
  const [fees, total] = await Promise.all([
    Fee.find(filter).populate('student', 'name email avatar').populate('room', 'number block').skip(skip).limit(parseInt(limit)).sort('-createdAt'),
    Fee.countDocuments(filter),
  ]);

  const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
  const collectedAmount = fees.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);

  res.json({
    success: true,
    count: fees.length,
    total,
    totalPages: Math.ceil(total / limit),
    page: parseInt(page),
    summary: { totalAmount, collectedAmount, pendingAmount: totalAmount - collectedAmount },
    fees,
  });
});

// GET /api/fees/:id
const getFeeById = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id).populate('student', 'name email avatar').populate('room', 'number block');
  if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

  // Students can only view their own
  if (req.user.role === 'student' && fee.student._id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, fee });
});

// POST /api/fees  (admin only)
const createFee = asyncHandler(async (req, res) => {
  const { studentId, roomId, amount, semester, dueDate, remarks } = req.body;

  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const fee = await Fee.create({
    student: studentId,
    room: roomId || student.room,
    amount,
    semester,
    dueDate,
    remarks,
  });

  await fee.populate('student', 'name email');
  res.status(201).json({ success: true, message: 'Fee record created', fee });
});

// PUT /api/fees/:id/status  (admin only — toggle paid/unpaid)
const updateFeeStatus = asyncHandler(async (req, res) => {
  const { status, paymentMethod, remarks } = req.body;
  const fee = await Fee.findById(req.params.id);
  if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });

  fee.status = status;
  if (paymentMethod) fee.paymentMethod = paymentMethod;
  if (remarks) fee.remarks = remarks;
  await fee.save();

  await fee.populate('student', 'name email avatar');
  res.json({ success: true, message: `Fee marked as ${status}`, fee });
});

// DELETE /api/fees/:id  (admin only)
const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
  res.json({ success: true, message: 'Fee record deleted' });
});

// GET /api/fees/stats  (admin/warden)
const getFeeStats = asyncHandler(async (req, res) => {
  const [all, paid, unpaid] = await Promise.all([
    Fee.find(),
    Fee.find({ status: 'Paid' }),
    Fee.find({ status: 'Unpaid' }),
  ]);

  const collectionRate = all.length ? Math.round((paid.length / all.length) * 100) : 0;

  res.json({
    success: true,
    stats: {
      total: all.length,
      paid: paid.length,
      unpaid: unpaid.length,
      totalAmount: all.reduce((s, f) => s + f.amount, 0),
      collectedAmount: paid.reduce((s, f) => s + f.amount, 0),
      pendingAmount: unpaid.reduce((s, f) => s + f.amount, 0),
      collectionRate,
    },
  });
});

// POST /api/fees/predict-default  (admin — AI prediction)
const predictDefault = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const [student, fees] = await Promise.all([
    User.findById(studentId),
    Fee.find({ student: studentId }),
  ]);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const unpaidCount = fees.filter((f) => f.status === 'Unpaid').length;
  const result = await predictFeeDefault({ studentId, name: student.name, unpaidCount, totalFees: fees.length });

  res.json({ success: true, prediction: result });
});

module.exports = { getAllFees, getFeeById, createFee, updateFeeStatus, deleteFee, getFeeStats, predictDefault };
