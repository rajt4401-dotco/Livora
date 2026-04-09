const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All user routes require auth

router.get('/stats', authorize('admin', 'warden'), getStats);
router.get('/', authorize('admin', 'warden'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
