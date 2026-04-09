const Room = require('../models/Room');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { autoAllocateRooms } = require('../services/aiService');

// GET /api/rooms  (all authenticated users)
const getAllRooms = asyncHandler(async (req, res) => {
  const { status, block, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (block) filter.block = block.toUpperCase();
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [rooms, total] = await Promise.all([
    Room.find(filter).populate('occupants', 'name email avatar').skip(skip).limit(parseInt(limit)).sort('number'),
    Room.countDocuments(filter),
  ]);

  res.json({ success: true, count: rooms.length, total, rooms });
});

// GET /api/rooms/:id
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('occupants', 'name email avatar course year');
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, room });
});

// POST /api/rooms  (admin only)
const createRoom = asyncHandler(async (req, res) => {
  const { number, block, floor, type, capacity, amenities, monthlyRent } = req.body;

  const existing = await Room.findOne({ number });
  if (existing) return res.status(409).json({ success: false, message: `Room #${number} already exists` });

  const room = await Room.create({ number, block, floor, type, capacity, amenities, monthlyRent });
  res.status(201).json({ success: true, message: 'Room created successfully', room });
});

// PUT /api/rooms/:id  (admin only)
const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, room });
});

// DELETE /api/rooms/:id  (admin only)
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (room.occupants.length > 0) {
    return res.status(400).json({ success: false, message: 'Cannot delete a room with occupants. Please reassign them first.' });
  }
  await room.deleteOne();
  res.json({ success: true, message: 'Room deleted successfully' });
});

// POST /api/rooms/:id/assign  (admin only) — assign student to room
const assignStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (room.status === 'Maintenance') return res.status(400).json({ success: false, message: 'Room is under maintenance' });
  if (room.occupants.length >= room.capacity) return res.status(400).json({ success: false, message: 'Room is already at full capacity' });

  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  if (student.room) return res.status(400).json({ success: false, message: 'Student is already assigned to a room' });

  room.occupants.push(studentId);
  await room.save();

  student.room = room._id;
  student.block = room.block;
  await student.save();

  res.json({ success: true, message: `${student.name} assigned to Room #${room.number}`, room });
});

// DELETE /api/rooms/:id/remove/:studentId  (admin only)
const removeStudent = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  room.occupants = room.occupants.filter((id) => id.toString() !== req.params.studentId);
  await room.save();

  await User.findByIdAndUpdate(req.params.studentId, { room: null, block: null });
  res.json({ success: true, message: 'Student removed from room', room });
});

// POST /api/rooms/auto-allocate  (admin only — AI powered)
const autoAllocate = asyncHandler(async (req, res) => {
  const [unassignedStudents, availableRooms] = await Promise.all([
    User.find({ role: 'student', room: null, isActive: true }),
    Room.find({ status: 'Available' }),
  ]);

  if (unassignedStudents.length === 0) {
    return res.json({ success: true, message: 'All students are already assigned to rooms', assignments: [] });
  }

  const result = await autoAllocateRooms(unassignedStudents, availableRooms);

  // Apply the assignments
  const applied = [];
  for (const a of result.assignments) {
    try {
      const room = await Room.findById(a.roomId);
      const student = await User.findById(a.studentId);
      if (room && student && room.occupants.length < room.capacity) {
        room.occupants.push(student._id);
        await room.save();
        student.room = room._id;
        student.block = room.block;
        await student.save();
        applied.push({ student: student.name, room: room.number, block: room.block });
      }
    } catch (_) {}
  }

  res.json({ success: true, message: `AI assigned ${applied.length} student(s) to rooms`, assignments: applied, source: result.source });
});

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, assignStudent, removeStudent, autoAllocate };
