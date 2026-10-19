import jwt from 'jsonwebtoken';
import { getShowtimes, getShowtimeById, getShowtimeSeatMap } from '../services/showtimeService.js';

export const getShowtimesList = async (req, res, next) => {
  try {
    const showtimes = await getShowtimes(req.query);
    res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtime = async (req, res, next) => {
  try {
    const showtime = await getShowtimeById(req.params.id);
    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

export const getSeats = async (req, res, next) => {
  try {
    let currentUserId = null;
    let token = req.cookies.jwt;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }

    const seatData = await getShowtimeSeatMap(req.params.id, currentUserId);
    res.status(200).json({
      success: true,
      data: seatData,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    next(error);
  }
};
