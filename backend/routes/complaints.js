const express = require('express');
const router = express.Router();
const {
  getAllComplaints, getComplaintById, createComplaint, updateStatus, deleteComplaint, getComplaintStats,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin', 'warden'), getComplaintStats);
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint); // All roles can submit
router.put('/:id/status', authorize('admin', 'warden'), updateStatus);
router.delete('/:id', deleteComplaint);

module.exports = router;
