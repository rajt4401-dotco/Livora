const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, 'Room number is required'],
      unique: true,
    },
    block: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D', 'E'],
      uppercase: true,
    },
    floor: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ['Single', 'Double', 'Triple'],
      default: 'Double',
    },
    capacity: { type: Number, required: true, min: 1, max: 4 },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance'],
      default: 'Available',
    },
    amenities: [{ type: String }],
    monthlyRent: { type: Number, default: 10000 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: how many spots are occupied
roomSchema.virtual('occupied').get(function () {
  return this.occupants ? this.occupants.length : 0;
});

// Auto-update status based on occupancy
roomSchema.pre('save', function () {
  if (this.status !== 'Maintenance') {
    this.status = this.occupants.length >= this.capacity ? 'Occupied' : 'Available';
  }
});

module.exports = mongoose.model('Room', roomSchema);
