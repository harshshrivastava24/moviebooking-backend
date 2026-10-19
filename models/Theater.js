import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  seatId: { type: String, required: true }, // e.g. "A1", "C5"
  row: { type: String, required: true },    // e.g. "A"
  column: { type: Number, required: true }, // e.g. 1
  tier: {
    type: String,
    enum: ['NORMAL', 'EXECUTIVE', 'VIP'],
    default: 'NORMAL',
  },
});

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Screen 1"
  screenNumber: { type: Number, required: true },
  capacity: { type: Number, required: true },
  seats: [seatSchema],
});

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    screens: [screenSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Theater', theaterSchema);
