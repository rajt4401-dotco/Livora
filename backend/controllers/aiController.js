const asyncHandler = require('../middleware/asyncHandler');
const { analyzeComplaint, analyzeSentiment, predictFeeDefault, autoAllocateRooms } = require('../services/aiService');
const Complaint = require('../models/Complaint');

// POST /api/ai/analyze-complaint
const analyzeComplaintEndpoint = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide at least 5 characters of complaint text' });
  }
  const result = await analyzeComplaint(text);
  res.json({ success: true, result });
});

// POST /api/ai/sentiment
const sentimentEndpoint = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
  const result = await analyzeSentiment(text);
  res.json({ success: true, result });
});

// POST /api/ai/predict-fee
const predictFeeEndpoint = asyncHandler(async (req, res) => {
  const result = await predictFeeDefault(req.body);
  res.json({ success: true, result });
});

// POST /api/ai/room-allocation
const roomAllocationEndpoint = asyncHandler(async (req, res) => {
  const { students, rooms } = req.body;
  if (!students || !rooms) {
    return res.status(400).json({ success: false, message: 'students and rooms arrays are required' });
  }
  const result = await autoAllocateRooms(students, rooms);
  res.json({ success: true, result });
});

// GET /api/ai/dashboard  (overall AI insights for admin dashboard)
const aiDashboard = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find();

  const sentimentBreakdown = {
    positive: complaints.filter((c) => c.sentiment === 'positive').length,
    negative: complaints.filter((c) => c.sentiment === 'negative').length,
    neutral: complaints.filter((c) => c.sentiment === 'neutral').length,
  };

  const categoryBreakdown = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const priorityBreakdown = {
    High: complaints.filter((c) => c.priority === 'High').length,
    Medium: complaints.filter((c) => c.priority === 'Medium').length,
    Low: complaints.filter((c) => c.priority === 'Low').length,
  };

  const aiClassified = complaints.filter((c) => c.aiCategory).length;
  const classificationRate = complaints.length ? Math.round((aiClassified / complaints.length) * 100) : 0;

  res.json({
    success: true,
    insights: {
      totalComplaints: complaints.length,
      sentimentBreakdown,
      categoryBreakdown,
      priorityBreakdown,
      aiClassified,
      classificationRate,
    },
  });
});

module.exports = { analyzeComplaintEndpoint, sentimentEndpoint, predictFeeEndpoint, roomAllocationEndpoint, aiDashboard };
