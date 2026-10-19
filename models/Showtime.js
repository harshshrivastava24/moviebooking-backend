import mongoose from 'mongoose';

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie is required'],
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater is required'],
    },
    screenId: {
      type: String,
      required: [true, 'Screen ID is required'],
    },
    screenName: {
      type: String,
      default: 'Screen 1',
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX', '70MM', 'LUXE'],
      default: '2D',
    },
    language: {
      type: String,
      default: 'English',
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Date string is required'],
    },
    startTime: {
      type: String, // Format: "14:30" or "07:15 PM"
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
    },
    basePricing: {
      NORMAL: { type: Number, required: true, default: 200 },
      EXECUTIVE: { type: Number, required: true, default: 350 },
      VIP: { type: Number, required: true, default: 500 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Showtime', showtimeSchema);
