/**
 * Livora Database Seeder
 * Run: npm run seed
 * Seeds the database with realistic sample data for all modules
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Leave = require('../models/Leave');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const clearDB = async () => {
  await Promise.all([User.deleteMany(), Room.deleteMany(), Fee.deleteMany(), Complaint.deleteMany(), Leave.deleteMany()]);
  console.log('🗑️  Cleared existing data');
};

const seed = async () => {
  await connectDB();
  await clearDB();

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const roomsData = [
    { number: 101, block: 'A', floor: 1, type: 'Single',  capacity: 1, amenities: ['AC','WiFi','Attached Bath'], monthlyRent: 12000 },
    { number: 102, block: 'A', floor: 1, type: 'Double',  capacity: 2, amenities: ['WiFi','Common Bath'],        monthlyRent: 10000 },
    { number: 103, block: 'A', floor: 1, type: 'Triple',  capacity: 3, amenities: ['WiFi','Common Bath'],        monthlyRent: 8000  },
    { number: 201, block: 'B', floor: 2, type: 'Single',  capacity: 1, amenities: ['AC','WiFi','Attached Bath'], monthlyRent: 12000 },
    { number: 202, block: 'B', floor: 2, type: 'Double',  capacity: 2, amenities: ['WiFi','Common Bath'],        monthlyRent: 10000 },
    { number: 203, block: 'B', floor: 2, type: 'Double',  capacity: 2, amenities: ['AC','WiFi'],                 monthlyRent: 10000 },
    { number: 301, block: 'C', floor: 3, type: 'Triple',  capacity: 3, amenities: ['WiFi','Common Bath'],        monthlyRent: 8000  },
    { number: 302, block: 'C', floor: 3, type: 'Single',  capacity: 1, amenities: ['AC','WiFi','Attached Bath'], monthlyRent: 12000, status: 'Maintenance' },
    { number: 401, block: 'D', floor: 4, type: 'Single',  capacity: 1, amenities: ['AC','WiFi','Attached Bath'], monthlyRent: 12000 },
    { number: 402, block: 'D', floor: 4, type: 'Double',  capacity: 2, amenities: ['WiFi','Common Bath'],        monthlyRent: 10000 },
  ];
  const rooms = await Room.insertMany(roomsData);
  console.log(`🛏️  Created ${rooms.length} rooms`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const hashedPw = await bcrypt.hash('hostel@123', 12);

  const usersData = [
    // Admins
    { name: 'Dr. Amit Kumar', email: 'admin@livora.edu', password: hashedPw, role: 'admin', phone: '9800000001' },
    // Wardens
    { name: 'Prof. Priya Singh', email: 'warden@livora.edu', password: hashedPw, role: 'warden', phone: '9800000002' },
    // Students (will get rooms assigned)
    { name: 'Rahul Sharma',  email: 'rahul@livora.edu',  password: hashedPw, role: 'student', phone: '9876543210', course: 'B.Tech CSE', year: 2, rollNumber: 'CS2022001' },
    { name: 'Priya Patel',   email: 'priya@livora.edu',  password: hashedPw, role: 'student', phone: '9876543211', course: 'B.Tech ECE', year: 1, rollNumber: 'EC2023001' },
    { name: 'Ankit Verma',   email: 'ankit@livora.edu',  password: hashedPw, role: 'student', phone: '9876543212', course: 'B.Tech ME',  year: 3, rollNumber: 'ME2021001' },
    { name: 'Sneha Roy',     email: 'sneha@livora.edu',  password: hashedPw, role: 'student', phone: '9876543213', course: 'B.Sc Physics', year: 2, rollNumber: 'PH2022001' },
    { name: 'Mohit Gupta',   email: 'mohit@livora.edu',  password: hashedPw, role: 'student', phone: '9876543214', course: 'B.Tech IT',   year: 4, rollNumber: 'IT2020001' },
    { name: 'Divya Nair',    email: 'divya@livora.edu',  password: hashedPw, role: 'student', phone: '9876543215', course: 'MBA',         year: 1, rollNumber: 'MB2023001' },
  ];
  const users = await User.insertMany(usersData);
  console.log(`👤 Created ${users.length} users`);

  const [admin, warden, rahul, priya, ankit, sneha, mohit, divya] = users;
  const students = [rahul, priya, ankit, sneha, mohit, divya];

  // Assign students to rooms
  const assignments = [
    [rooms[0], rahul],  // 101 → Rahul
    [rooms[1], priya],  // 102 → Priya
    [rooms[2], ankit],  // 103 → Ankit
    [rooms[3], sneha],  // 201 → Sneha
    [rooms[4], mohit],  // 202 → Mohit
    [rooms[5], divya],  // 203 → Divya
  ];

  for (const [room, student] of assignments) {
    room.occupants.push(student._id);
    await room.save();
    student.room = room._id;
    student.block = room.block;
    await User.findByIdAndUpdate(student._id, { room: room._id, block: room.block });
  }
  console.log('🔗 Assigned students to rooms');

  // ── Fees ──────────────────────────────────────────────────────────────────
  const feesData = students.map((student, i) => ({
    student: student._id,
    room: rooms[i]._id,
    amount: rooms[i].monthlyRent,
    semester: 'Sem 1 2024',
    dueDate: new Date('2024-08-01'),
    status: i % 3 === 1 ? 'Unpaid' : 'Paid',
    paidDate: i % 3 === 1 ? null : new Date('2024-07-28'),
    receiptNumber: i % 3 === 1 ? null : `RCP-2024-${1000 + i}`,
    paymentMethod: 'Online',
  }));
  const fees = await Fee.insertMany(feesData);
  console.log(`💰 Created ${fees.length} fee records`);

  // ── Complaints ────────────────────────────────────────────────────────────
  const complaintsData = [
    { student: rahul._id, room: rooms[0]._id, title: 'Water leakage in bathroom', description: 'There is a water leak under the sink causing water to accumulate on the floor.', category: 'Plumbing', priority: 'High', status: 'Resolved', sentiment: 'negative', aiCategory: 'Plumbing', aiPriority: 'High', aiConfidence: 0.9, resolvedBy: warden._id, resolvedAt: new Date() },
    { student: priya._id, room: rooms[1]._id, title: 'WiFi not working', description: 'The WiFi has been down since yesterday. Cannot attend online classes.', category: 'Network', priority: 'High', status: 'In Progress', sentiment: 'negative', aiCategory: 'Network', aiPriority: 'High', aiConfidence: 0.88 },
    { student: ankit._id, room: rooms[2]._id, title: 'Room cleaning request', description: 'Room is cleaned only once a week. Can we increase the frequency?', category: 'Housekeeping', priority: 'Low', status: 'Pending', sentiment: 'neutral', aiCategory: 'Housekeeping', aiPriority: 'Low', aiConfidence: 0.75 },
    { student: sneha._id, room: rooms[3]._id, title: 'AC not cooling', description: 'The AC has been blowing warm air for 3 days. Very uncomfortable.', category: 'Electrical', priority: 'High', status: 'Pending', sentiment: 'negative', aiCategory: 'Electrical', aiPriority: 'High', aiConfidence: 0.85 },
    { student: rahul._id, room: rooms[0]._id, title: 'Mess food quality improved', description: 'The food quality and variety has improved significantly this week. Great work!', category: 'Mess', priority: 'Low', status: 'Acknowledged', sentiment: 'positive', aiCategory: 'Mess', aiPriority: 'Low', aiConfidence: 0.72 },
  ];
  const complaints = await Complaint.insertMany(complaintsData);
  console.log(`📝 Created ${complaints.length} complaints`);

  // ── Leave Requests ────────────────────────────────────────────────────────
  const leaveData = [
    { student: rahul._id, room: rooms[0]._id, fromDate: new Date('2024-08-05'), toDate: new Date('2024-08-10'), reason: 'Family function at home', status: 'Approved', approvedBy: warden._id, approvedAt: new Date() },
    { student: priya._id, room: rooms[1]._id, fromDate: new Date('2024-08-12'), toDate: new Date('2024-08-14'), reason: 'Medical appointment', status: 'Pending' },
    { student: ankit._id, room: rooms[2]._id, fromDate: new Date('2024-08-18'), toDate: new Date('2024-08-20'), reason: "Sister's wedding", status: 'Pending' },
    { student: sneha._id, room: rooms[3]._id, fromDate: new Date('2024-08-08'), toDate: new Date('2024-08-09'), reason: 'University sports event outstation', status: 'Rejected', approvedBy: warden._id },
  ];
  const leaves = await Leave.insertMany(leaveData);
  console.log(`✈️  Created ${leaves.length} leave requests`);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Default login credentials:');
  console.log('  Admin:   admin@livora.edu  / hostel@123');
  console.log('  Warden:  warden@livora.edu / hostel@123');
  console.log('  Student: rahul@livora.edu  / hostel@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.stack);
  process.exit(1);
});
