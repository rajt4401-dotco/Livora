const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [200, 'Title too long'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description too long'],
    },
    category: {
      type: String,
      enum: ['Plumbing', 'Network', 'Electrical', 'Mess', 'Furniture', 'Housekeeping', 'Noise', 'Security', 'General'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Low',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Acknowledged', 'Rejected'],
      default: 'Pending',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },
    // AI classification result
    aiCategory: { type: String },
    aiPriority: { type: String },
    aiConfidence: { type: Number, min: 0, max: 1 },
    // Resolution
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: { type: String },
    // Activity log
    history: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Add history entry on status change
complaintSchema.pre('save', function () {
  if (this.isModified('status') && !this.isNew) {
    this.history.push({ status: this.status, changedAt: new Date() });
    if (this.status === 'Resolved') this.resolvedAt = new Date();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
