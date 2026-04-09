const express = require('express');
const router = express.Router();
const {
  getAllFees, getFeeById, createFee, updateFeeStatus, deleteFee, getFeeStats, predictDefault,
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin', 'warden'), getFeeStats);
router.post('/predict-default', authorize('admin'), predictDefault);
router.get('/', getAllFees);
router.get('/:id', getFeeById);
router.post('/', authorize('admin'), createFee);
router.put('/:id/status', authorize('admin'), updateFeeStatus);
router.delete('/:id', authorize('admin'), deleteFee);

module.exports = router;
