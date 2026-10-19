import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const isTls = redisUrl.startsWith('rediss://');

const redisConfig = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  ...(isTls && { tls: { rejectUnauthorized: false } }),
};

export const redisClient = new Redis(redisUrl, redisConfig);

redisClient.on('connect', () => {
  console.log(`Redis Connected successfully [${redisUrl}]`);
  // Enable keyspace notifications for expired keys (Ex)
  redisClient.config('SET', 'notify-keyspace-events', 'Ex').catch((err) => {
    console.warn('Redis keyspace notifications enable notice:', err.message);
  });
});

redisClient.on('error', (err) => {
  console.error(`CRITICAL: Redis Connection Error [${redisUrl}]: ${err.message}`);
  console.error('Real Redis server is required for atomic seat locking concurrency.');
});

// Dedicated subscriber connection for Redis Pub/Sub keyspace notifications
export const redisSubscriber = new Redis(redisUrl, {
  ...redisConfig,
  enableReadyCheck: false,
});

redisSubscriber.on('connect', () => {
  console.log(`Redis Subscriber Connected [${redisUrl}]`);
  redisSubscriber.psubscribe('__keyevent@*__:expired', (err, count) => {
    if (err) {
      console.warn('Redis subscriber psubscribe notice:', err.message);
    } else {
      console.log(`Redis Subscriber active on __keyevent@*__:expired (${count} channels)`);
    }
  });
});

redisSubscriber.on('pmessage', async (pattern, channel, key) => {
  try {
    // Key format: showtime:{showtimeId}:seat:{seatId}
    const match = key.match(/^showtime:([^:]+):seat:(.+)$/);
    if (match) {
      const showtimeId = match[1];
      const seatId = match[2];

      const { broadcastSeatUpdate } = await import('./socket.js');
      broadcastSeatUpdate(showtimeId, 'seat:released', {
        seats: [{ seatId, status: 'AVAILABLE' }],
        expired: true,
      });
      console.log(`Redis TTL Expired for seat [${seatId}] in showtime [${showtimeId}] -> Broadcasted seat:released`);
    }
  } catch (err) {
    console.error('Error handling Redis key expiration event:', err.message);
  }
});

export default redisClient;

