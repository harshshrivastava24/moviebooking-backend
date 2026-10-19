import redisClient from '../config/redis.js';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import { broadcastSeatUpdate } from '../config/socket.js';
import { isShowtimePast } from '../utils/dateUtils.js';

const LOCK_TTL_SECONDS = 600; // 10 minutes

/**
 * Helper to construct Redis lock key for a seat in a showtime
 */
const getSeatLockKey = (showtimeId, seatId) => `showtime:${showtimeId}:seat:${seatId}`;

/**
 * Lock seats atomically in Redis for a specific user
 */
export const lockSeats = async (showtimeId, seatIdsInput, userId) => {
  if (!seatIdsInput || !Array.isArray(seatIdsInput) || seatIdsInput.length === 0) {
    throw new Error('No seats specified for locking');
  }

  // 0. Verify that the showtime is valid and has not passed
  const showtime = await Showtime.findById(showtimeId);
  if (!showtime || isShowtimePast(showtime.date, showtime.startTime)) {
    const err = new Error('This showtime is no longer available for booking.');
    err.statusCode = 400;
    throw err;
  }

  const seatIds = seatIdsInput.map((s) => (typeof s === 'string' ? s : s.seatId));

  if (seatIds.length > 8) {
    throw new Error('Cannot lock more than 8 seats per request');
  }

  // 1. Check if any seat is already permanently BOOKED in MongoDB
  const bookedCheck = await Booking.find({
    showtime: showtimeId,
    paymentStatus: 'COMPLETED',
    'seats.seatId': { $in: seatIds },
  });

  if (bookedCheck.length > 0) {
    const alreadyBookedSeats = [];
    bookedCheck.forEach((b) => {
      b.seats.forEach((s) => {
        if (seatIds.includes(s.seatId)) {
          alreadyBookedSeats.push(s.seatId);
        }
      });
    });
    const seatListStr = [...new Set(alreadyBookedSeats)].join(', ');
    const err = new Error(`Seat(s) ${seatListStr} are already booked.`);
    err.statusCode = 409;
    throw err;
  }

  // 2. Attempt atomic Redis locking using pipeline & NX
  const lockedKeys = [];
  try {
    for (const seatId of seatIds) {
      const key = getSeatLockKey(showtimeId, seatId);
      // SET key userId EX 600 NX
      const result = await redisClient.set(key, userId.toString(), 'EX', LOCK_TTL_SECONDS, 'NX');

      if (result === 'OK') {
        lockedKeys.push(key);
      } else {
        // Conflict! Check if it's already owned by the current user
        const existingOwner = await redisClient.get(key);
        if (existingOwner === userId.toString()) {
          // Re-extend TTL for own lock
          await redisClient.expire(key, LOCK_TTL_SECONDS);
          lockedKeys.push(key);
        } else {
          // Conflict with another user! Rollback locks acquired in this loop
          for (const keyToRelease of lockedKeys) {
            await redisClient.del(keyToRelease);
          }
          const err = new Error(`Seat ${seatId} was just taken by another user. Please choose another seat.`);
          err.statusCode = 409;
          throw err;
        }
      }
    }

    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000).toISOString();

    // 3. Broadcast real-time Socket.io event to showtime room
    broadcastSeatUpdate(showtimeId, 'seat:locked', {
      seats: seatIds.map((seatId) => ({ seatId, status: 'LOCKED', userId })),
      lockedBy: userId,
      expiresAt,
    });

    return {
      success: true,
      showtimeId,
      lockedSeats: seatIds,
      expiresAt,
      ttlSeconds: LOCK_TTL_SECONDS,
    };
  } catch (error) {
    // Ensure cleanup if unexpected failure
    if (lockedKeys.length > 0 && error.statusCode !== 409) {
      for (const keyToRelease of lockedKeys) {
        await redisClient.del(keyToRelease);
      }
    }
    throw error;
  }
};

/**
 * Release seats owned by user or on explicit cancellation
 */
export const releaseSeats = async (showtimeId, seatIdsInput, userId) => {
  if (!seatIdsInput || !Array.isArray(seatIdsInput) || seatIdsInput.length === 0) return [];

  const seatIds = seatIdsInput.map((s) => (typeof s === 'string' ? s : s.seatId));

  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const releasedSeats = [];
  for (const seatId of seatIds) {
    const key = getSeatLockKey(showtimeId, seatId);
    if (userId) {
      const res = await redisClient.eval(luaScript, 1, key, userId.toString());
      if (res === 1) releasedSeats.push(seatId);
    } else {
      await redisClient.del(key);
      releasedSeats.push(seatId);
    }
  }

  if (releasedSeats.length > 0) {
    broadcastSeatUpdate(showtimeId, 'seat:released', {
      seats: releasedSeats.map((seatId) => ({ seatId, status: 'AVAILABLE' })),
    });
  }

  return releasedSeats;
};

/**
 * Verify that all specified seats are locked by the authenticated user
 */
export const verifyLocksOwnership = async (showtimeId, seatIdsInput, userId) => {
  if (!seatIdsInput || !Array.isArray(seatIdsInput) || seatIdsInput.length === 0) return false;
  const seatIds = seatIdsInput.map((s) => (typeof s === 'string' ? s : s.seatId));
  for (const seatId of seatIds) {
    const key = getSeatLockKey(showtimeId, seatId);
    const owner = await redisClient.get(key);
    if (owner !== userId.toString()) {
      return false;
    }
  }
  return true;
};

/**
 * Fetch all currently active Redis locks for a showtime
 */
export const getActiveLocksForShowtime = async (showtimeId, currentUserId = null) => {
  const pattern = `showtime:${showtimeId}:seat:*`;
  const keys = await redisClient.keys(pattern);

  const locksMap = {};
  for (const key of keys) {
    const seatId = key.split(':seat:')[1];
    const owner = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);

    if (owner && ttl > 0) {
      locksMap[seatId] = {
        seatId,
        status: 'LOCKED',
        isOwnLock: currentUserId ? owner === currentUserId.toString() : false,
        ttl,
      };
    }
  }
  return locksMap;
};
