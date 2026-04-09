const express = require('express');
const router = express.Router();
const {
  analyzeComplaintEndpoint, sentimentEndpoint, predictFeeEndpoint, roomAllocationEndpoint, aiDashboard,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/analyze-complaint', analyzeComplaintEndpoint);
router.post('/sentiment', analyzeComplaintEndpoint);
router.post('/predict-fee', authorize('admin'), predictFeeEndpoint);
router.post('/room-allocation', authorize('admin'), roomAllocationEndpoint);
router.get('/dashboard', authorize('admin', 'warden'), aiDashboard);

module.exports = router;
