const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    amount: { type: Number, required: true, min: 0 },
    semester: { type: String, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partial', 'Waived'],
      default: 'Unpaid',
    },
    receiptNumber: { type: String },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online', 'DD', 'Cheque'],
      default: 'Online',
    },
    remarks: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Auto-generate receipt number on payment
feeSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'Paid' && !this.receiptNumber) {
    this.receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.paidDate = new Date();
  }
});

module.exports = mongoose.model('Fee', feeSchema);
