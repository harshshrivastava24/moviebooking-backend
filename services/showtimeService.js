import Showtime from '../models/Showtime.js';
import Theater from '../models/Theater.js';
import Booking from '../models/Booking.js';
import { getActiveLocksForShowtime } from './seatLockService.js';
import { isShowtimePast, getTodayDateString } from '../utils/dateUtils.js';

export const getShowtimes = async (query = {}) => {
  const { movieId, date, city, format } = query;
  const filter = {};
  const todayStr = getTodayDateString(0);

  if (movieId) filter.movie = movieId;
  if (format) filter.format = format;

  if (date) {
    // If requested date is prior to today, no bookable showtimes exist
    if (date < todayStr) {
      return [];
    }
    filter.date = date;
  } else {
    // Search for current and future dates only
    filter.date = { $gte: todayStr };
  }

  let showtimes = await Showtime.find(filter)
    .populate('movie')
    .populate('theater')
    .sort({ date: 1, startTime: 1 });

  if (city) {
    showtimes = showtimes.filter(
      (s) => s.theater && s.theater.city.toLowerCase() === city.toLowerCase()
    );
  }

  // Filter out past showtimes for today/past dates
  showtimes = showtimes.filter((s) => !isShowtimePast(s.date, s.startTime));

  return showtimes;
};

export const getShowtimeById = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId)
    .populate('movie')
    .populate('theater');

  if (!showtime) {
    throw new Error('Showtime not found');
  }

  if (isShowtimePast(showtime.date, showtime.startTime)) {
    const err = new Error('This showtime is no longer available for booking.');
    err.statusCode = 400;
    throw err;
  }

  return showtime;
};

export const getShowtimeSeatMap = async (showtimeId, currentUserId = null) => {
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

  if (!showtime.theater || !showtime.theater.screens) {
    const err = new Error('Theater layout for this showtime is unavailable');
    err.statusCode = 404;
    throw err;
  }

  // 1. Get screen seat template from theater
  const screen = showtime.theater.screens.find(
    (s) => s._id.toString() === showtime.screenId || s.name === showtime.screenName
  ) || showtime.theater.screens[0];

  if (!screen) {
    const err = new Error('Screen seat layout not found for this showtime');
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch permanently BOOKED seats from MongoDB
  const completedBookings = await Booking.find({
    showtime: showtimeId,
    paymentStatus: 'COMPLETED',
  });

  const bookedSeatSet = new Set();
  completedBookings.forEach((booking) => {
    booking.seats.forEach((seat) => bookedSeatSet.add(seat.seatId));
  });

  // 3. Fetch active Redis locks with try-catch fallback
  let activeLocksMap = {};
  try {
    activeLocksMap = await getActiveLocksForShowtime(showtimeId, currentUserId);
  } catch (err) {
    console.error('Redis lock fetch warning (proceeding with DB seats):', err.message);
  }

  // 4. Combine seat template with current real-time statuses
  const seatMap = screen.seats.map((seat) => {
    const seatId = seat.seatId;
    let status = 'AVAILABLE';
    let isOwnLock = false;
    let lockTtl = 0;

    if (bookedSeatSet.has(seatId)) {
      status = 'BOOKED';
    } else if (activeLocksMap[seatId]) {
      status = 'LOCKED';
      isOwnLock = activeLocksMap[seatId].isOwnLock;
      lockTtl = activeLocksMap[seatId].ttl;
    }

    const tier = seat.tier ? seat.tier.toUpperCase() : 'NORMAL';
    const price = showtime.basePricing[tier] || showtime.basePricing.NORMAL || 200;

    return {
      seatId,
      row: seat.row,
      column: seat.column,
      tier,
      price,
      status,
      isOwnLock,
      lockTtl,
    };
  });

  return {
    showtime: {
      _id: showtime._id,
      movie: showtime.movie,
      theater: showtime.theater,
      screenName: showtime.screenName,
      format: showtime.format,
      language: showtime.language,
      date: showtime.date,
      startTime: showtime.startTime,
      basePricing: showtime.basePricing,
    },
    screenName: screen.name,
    capacity: screen.capacity,
    seatMap,
  };
};
