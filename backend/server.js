require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const roomRoutes      = require('./routes/rooms');
const feeRoutes       = require('./routes/fees');
const complaintRoutes = require('./routes/complaints');
const leaveRoutes     = require('./routes/leave');
const aiRoutes        = require('./routes/ai');

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking — server starts even if DB is down)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ─── Security & Utility Middleware ───────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏠 Livora API — Hostel Management System',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth:       '/api/auth',
      users:      '/api/users',
      rooms:      '/api/rooms',
      fees:       '/api/fees',
      complaints: '/api/complaints',
      leave:      '/api/leave',
      ai:         '/api/ai',
    },
  });
});

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    status: 'healthy',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime().toFixed(2) + 's',
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/rooms',      roomRoutes);
app.use('/api/fees',       feeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leave',      leaveRoutes);
app.use('/api/ai',         aiRoutes);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log(`║   🏠 Livora API running on port ${PORT}   ║`);
    console.log(`║   🌍 http://localhost:${PORT}             ║`);
    console.log(`║   📦 Environment: ${(process.env.NODE_ENV || 'development').padEnd(13)}      ║`);
    console.log('╚═══════════════════════════════════════╝\n');
  });
}

module.exports = app;
