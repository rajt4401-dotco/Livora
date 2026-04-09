const express = require('express');
const router = express.Router();
const {
  getAllLeave, getLeaveById, applyLeave, processLeave, cancelLeave, getLeaveStats,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin', 'warden'), getLeaveStats);
router.get('/', getAllLeave);
router.get('/:id', getLeaveById);
router.post('/', authorize('student'), applyLeave);
router.put('/:id/action', authorize('admin', 'warden'), processLeave);
router.delete('/:id', cancelLeave);

module.exports = router;
