const express = require('express');
const router = express.Router();
const {
  getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom,
  assignStudent, removeStudent, autoAllocate,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', authorize('admin'), createRoom);
router.put('/:id', authorize('admin'), updateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);
router.post('/:id/assign', authorize('admin'), assignStudent);
router.delete('/:id/remove/:studentId', authorize('admin'), removeStudent);
router.post('/auto-allocate', authorize('admin'), autoAllocate);

module.exports = router;
