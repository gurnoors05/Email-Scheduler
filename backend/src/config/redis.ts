import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
};

const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      ...redisOptions
    });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export default redisClient;
