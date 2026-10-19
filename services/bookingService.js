import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import { verifyLocksOwnership, releaseSeats } from './seatLockService.js';
import { calculateBookingPrices } from '../utils/pricing.js';
import { processMockPayment } from './paymentService.js';
import { generateBookingQRCode } from '../utils/qrcode.js';
import { broadcastSeatUpdate } from '../config/socket.js';
import { isShowtimePast } from '../utils/dateUtils.js';

export const createBooking = async (userId, { showtimeId, seats: seatIdsInput, paymentMethod }) => {
  if (!seatIdsInput || !Array.isArray(seatIdsInput) || seatIdsInput.length === 0) {
    throw new Error('Please select at least one seat to book.');
  }

  const seatIds = seatIdsInput.map((s) => (typeof s === 'string' ? s : s.seatId));

  // 1. Fetch showtime with movie and theater
  const showtime = await Showtime.findById(showtimeId)
    .populate('movie')
    .populate('theater');

  if (!showtime) {
    const err = new Error('Showtime not found');
    err.statusCode = 404;
    throw err;
  }

  if (isShowtimePast(showtime.date, showtime.startTime)) {
    const err = new Error('This showtime is no longer available for booking.');
    err.statusCode = 400;
    throw err;
  }

  // 2. SERVER-SIDE LOCK VERIFICATION: Ensure locks are valid and owned by this user
  const ownsLocks = await verifyLocksOwnership(showtimeId, seatIds, userId);
  if (!ownsLocks) {
    const err = new Error('Your temporary seat lock has expired or is invalid. Please select your seats again.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Double-check MongoDB to ensure no race condition with existing completed booking
  const existingBooked = await Booking.find({
    showtime: showtimeId,
    paymentStatus: 'COMPLETED',
    'seats.seatId': { $in: seatIds },
  });

  if (existingBooked.length > 0) {
    const err = new Error('One or more selected seats have already been booked.');
    err.statusCode = 409;
    throw err;
  }

  // 4. Find screen seats layout to match tiers
  const screen = showtime.theater.screens.find(
    (s) => s._id.toString() === showtime.screenId || s.name === showtime.screenName
  ) || showtime.theater.screens[0];

  const fullSeatObjects = seatIds.map((id) => {
    const matched = screen.seats.find((s) => s.seatId === id);
    return {
      seatId: id,
      row: matched ? matched.row : id.charAt(0),
      column: matched ? matched.column : parseInt(id.slice(1)) || 1,
      tier: matched ? matched.tier : 'NORMAL',
    };
  });

  // 5. Server-calculated total pricing
  const pricing = calculateBookingPrices(fullSeatObjects, showtime.basePricing);

  // 6. Process mock payment
  const paymentResult = await processMockPayment({
    amount: pricing.totalAmount,
    paymentMethod: paymentMethod || 'CREDIT_CARD',
  });

  if (!paymentResult.success) {
    const err = new Error(paymentResult.error || 'Payment failed. Booking was not completed.');
    err.statusCode = 400;
    throw err;
  }

  // 7. Persist Booking to MongoDB
  const booking = new Booking({
    user: userId,
    showtime: showtime._id,
    movie: showtime.movie._id,
    theater: showtime.theater._id,
    seats: pricing.seats,
    subtotal: pricing.subtotal,
    convenienceFee: pricing.convenienceFee,
    gst: pricing.gst,
    totalAmount: pricing.totalAmount,
    paymentStatus: 'COMPLETED',
    transactionId: paymentResult.transactionId,
  });

  await booking.save();

  // 8. Generate QR Code
  const qrCodeUrl = await generateBookingQRCode({
    _id: booking._id,
    transactionId: booking.transactionId,
    movie: showtime.movie,
    seats: pricing.seats,
    totalAmount: pricing.totalAmount,
    createdAt: booking.createdAt,
  });

  booking.qrCodeUrl = qrCodeUrl;
  await booking.save();

  // 9. Release Redis temporary locks
  await releaseSeats(showtimeId, seatIds, userId);

  // 10. Broadcast seat:confirmed to all clients viewing this showtime
  broadcastSeatUpdate(showtimeId, 'seat:confirmed', {
    seats: seatIds.map((seatId) => ({ seatId, status: 'BOOKED' })),
    bookingId: booking._id,
  });

  // Populate booking details for response
  const populatedBooking = await Booking.findById(booking._id)
    .populate('movie')
    .populate('theater')
    .populate('showtime');

  return populatedBooking;
};

export const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .populate('movie')
    .populate('theater')
    .populate('showtime')
    .sort({ createdAt: -1 });

  return bookings;
};

export const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('movie')
    .populate('theater')
    .populate('showtime');

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (booking.user.toString() !== userId.toString()) {
    const err = new Error('Unauthorized to view this booking');
    err.statusCode = 403;
    throw err;
  }

  return booking;
};
