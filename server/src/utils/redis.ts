import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379', // Redis 默认地址
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// 连接 Redis
redisClient.connect().catch(console.error);

export const redis = redisClient;
