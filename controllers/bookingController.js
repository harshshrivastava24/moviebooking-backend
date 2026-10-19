import { lockSeats, releaseSeats } from '../services/seatLockService.js';
import { createBooking, getUserBookings, getBookingById } from '../services/bookingService.js';

export const lockSeatsController = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    const result = await lockSeats(showtimeId, seats, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Seats locked successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    next(error);
  }
};

export const releaseSeatsController = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    const released = await releaseSeats(showtimeId, seats, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Seats released successfully',
      data: { releasedSeats: released },
    });
  } catch (error) {
    next(error);
  }
};

export const createBookingController = async (req, res, next) => {
  try {
    const booking = await createBooking(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    next(error);
  }
};

export const getUserBookingsController = async (req, res, next) => {
  try {
    const bookings = await getUserBookings(req.user._id);
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingByIdController = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(error.statusCode || 404);
    next(error);
  }
};
