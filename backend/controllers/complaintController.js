const Complaint = require('../models/Complaint');
const asyncHandler = require('../middleware/asyncHandler');
const { analyzeComplaint, analyzeSentiment } = require('../services/aiService');

// GET /api/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, page = 1, limit = 10, search } = req.query;
  const filter = {};

  // Students see only their own complaints
  if (req.user.role === 'student') filter.student = req.user.id;

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('student', 'name email avatar room')
      .populate('resolvedBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt'),
    Complaint.countDocuments(filter),
  ]);

  res.json({ success: true, count: complaints.length, total, totalPages: Math.ceil(total / limit), page: parseInt(page), complaints });
});

// GET /api/complaints/:id
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('student', 'name email avatar room')
    .populate('resolvedBy', 'name')
    .populate('history.changedBy', 'name');
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  if (req.user.role === 'student' && complaint.student._id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, complaint });
});

// POST /api/complaints  (any authenticated user)
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // AI classification runs in parallel
  const [classResult, sentimentResult] = await Promise.all([
    analyzeComplaint(description),
    analyzeSentiment(description),
  ]);

  const complaint = await Complaint.create({
    student: req.user.id,
    room: req.user.room,
    title,
    description,
    category: classResult.category,
    priority: classResult.priority,
    sentiment: sentimentResult.sentiment,
    aiCategory: classResult.category,
    aiPriority: classResult.priority,
    aiConfidence: classResult.confidence,
  });

  await complaint.populate('student', 'name email avatar');

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    aiClassification: { category: classResult.category, priority: classResult.priority, source: classResult.source },
    complaint,
  });
});

// PUT /api/complaints/:id/status  (admin/warden only)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, resolution } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  const prevStatus = complaint.status;
  complaint.status = status;
  if (resolution) complaint.resolution = resolution;
  if (status === 'Resolved') {
    complaint.resolvedBy = req.user.id;
  }
  await complaint.save();

  await complaint.populate('student', 'name email');
  res.json({ success: true, message: `Status updated: ${prevStatus} → ${status}`, complaint });
});

// DELETE /api/complaints/:id  (admin or complaint owner)
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  const isOwner = complaint.student.toString() === req.user.id;
  if (!isOwner && req.user.role === 'student') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
  }

  await complaint.deleteOne();
  res.json({ success: true, message: 'Complaint deleted' });
});

// GET /api/complaints/stats  (admin/warden)
const getComplaintStats = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find();
  const byStatus = {}, byCategory = {}, bySentiment = { positive: 0, negative: 0, neutral: 0 };

  complaints.forEach((c) => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    if (bySentiment[c.sentiment] !== undefined) bySentiment[c.sentiment]++;
  });

  res.json({ success: true, stats: { total: complaints.length, byStatus, byCategory, bySentiment } });
});

module.exports = { getAllComplaints, getComplaintById, createComplaint, updateStatus, deleteComplaint, getComplaintStats };
