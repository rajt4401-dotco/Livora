const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    fromDate: { type: Date, required: [true, 'Start date is required'] },
    toDate: { type: Date, required: [true, 'End date is required'] },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      maxlength: [1000, 'Reason too long'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    emergencyContact: { type: String },
    destination: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: number of days
leaveSchema.virtual('durationDays').get(function () {
  if (this.fromDate && this.toDate) {
    const diff = this.toDate - this.fromDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
  return null;
});

// Validate date range
leaveSchema.pre('save', function () {
  if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
    throw new Error('End date must be after start date');
  }
  if (this.isModified('status') && this.status !== 'Pending') {
    this.approvedAt = new Date();
  }
});

module.exports = mongoose.model('Leave', leaveSchema);
