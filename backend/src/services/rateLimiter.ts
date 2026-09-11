import redisClient from '../config/redis';

// Lua script for atomic hourly rate limiting
// KEYS[1] = ratelimit key (e.g., ratelimit:sender@test.com:2026-09-10T14)
// ARGV[1] = max limit (not used in script, checked in TS to keep script simple)
const hourlyRateLimitScript = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], 3600)
  end
  return current
`;

// Lua script for atomic minimum delay check
// KEYS[1] = delay key (e.g., lastsend:sender@test.com)
// ARGV[1] = min delay in ms
// ARGV[2] = current timestamp in ms
const minDelayScript = `
  local lastSend = redis.call('GET', KEYS[1])
  if lastSend then
    local timePassed = tonumber(ARGV[2]) - tonumber(lastSend)
    if timePassed < tonumber(ARGV[1]) then
      return tonumber(ARGV[1]) - timePassed -- return remaining ms needed
    end
  end
  redis.call('SET', KEYS[1], ARGV[2])
  return 0 -- allowed, timestamp updated
`;

redisClient.defineCommand('incrementHourlyLimit', {
  numberOfKeys: 1,
  lua: hourlyRateLimitScript
});

redisClient.defineCommand('checkMinDelay', {
  numberOfKeys: 1,
  lua: minDelayScript
});

export async function checkAndIncrementRateLimit(senderEmail: string, maxEmails: number): Promise<{allowed: boolean; nextWindowStart?: Date}> {
  const now = new Date();
  // Construct bucket string: YYYY-MM-DDTHH
  const hourBucket = now.toISOString().slice(0, 13); 
  const key = `ratelimit:${senderEmail}:${hourBucket}`;
  
  // @ts-ignore (dynamic method added by defineCommand)
  const currentCount = await redisClient.incrementHourlyLimit(key);
  
  if (currentCount > maxEmails) {
    // Determine the start of the next hour
    const nextWindowStart = new Date(now);
    nextWindowStart.setUTCHours(nextWindowStart.getUTCHours() + 1, 0, 0, 0);
    return { allowed: false, nextWindowStart };
  }
  
  return { allowed: true };
}

export async function checkMinimumDelay(senderEmail: string): Promise<{allowed: boolean; delayMs?: number}> {
  const minDelayStr = process.env.MIN_DELAY_BETWEEN_EMAILS_SECONDS || '2';
  const minDelayMs = parseInt(minDelayStr, 10) * 1000;
  
  const key = `lastsend:${senderEmail}`;
  const nowMs = Date.now();
  
  // @ts-ignore
  const result = await redisClient.checkMinDelay(key, minDelayMs, nowMs);
  
  if (result > 0) {
    return { allowed: false, delayMs: result };
  }
  
  return { allowed: true };
}
