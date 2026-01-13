// backend/utils/redisScan.js
/**
 * Async generator for SCAN iteration in Redis
 * @param {object} redisClient - ioredis or node-redis v4 client
 * @param {string} pattern - key pattern (e.g. 'realestate:sess:*')
 * @param {number} [count=100] - batch size
 */
async function* scanIterator(redisClient, pattern, count = 100) {
  let cursor = '0';
  do {
    const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    cursor = result[0];
    const keys = result[1];
    for (const key of keys) {
      yield key;
    }
  } while (cursor !== '0');
}

module.exports = { scanIterator };
