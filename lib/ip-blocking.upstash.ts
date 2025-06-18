import { sendSlackUserBlocked } from '@/lib/slack-webhook';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const RATE_LIMIT_KEY_PREFIX = 'ratelimit:';
const BLOCKED_IP_KEY_PREFIX = 'blocked:';
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = Number(process.env.MAX_REQUESTS_PER_MINUTE) || 10;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_VIOLATIONS = Number(process.env.MAX_VIOLATIONS) || 2;

interface RateLimitEntry {
  count: number;
  timestamp: number;
  violations: number;
}

interface BlockedIPEntry {
  timestamp: number;
  reason: string;
  unblockAt: number;
}

export async function getClientIdentifier(request: Request | { headers: any }) {
  const forwardedFor = request.headers.get
    ? request.headers.get('x-forwarded-for')
    : request.headers['x-forwarded-for'];
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get
    ? request.headers.get('user-agent')
    : (request.headers['user-agent'] ?? 'unknown');
  return `${clientIp}:${userAgent}`;
}

export async function isIPBlocked(clientId: string): Promise<boolean> {
  const blockedData = await redis.get(`${BLOCKED_IP_KEY_PREFIX}${clientId}`);
  if (!blockedData) return false;
  const { unblockAt } = blockedData as any;
  if (Date.now() > unblockAt) {
    await redis.del(`${BLOCKED_IP_KEY_PREFIX}${clientId}`);
    return false;
  }
  return true;
}

export async function checkRateLimit(clientId: string, opts?: { ip?: string }): Promise<boolean> {
  const now = Date.now();
  const key = `${RATE_LIMIT_KEY_PREFIX}${clientId}`;
  let rateLimit = await redis.get(key) as any;
  rateLimit ??= { count: 0, timestamp: now, violations: 0 };
  if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.count = 0;
    rateLimit.timestamp = now;
  }
  rateLimit.count++;
  const isRateLimited = rateLimit.count > MAX_REQUESTS;
  if (isRateLimited) {
    rateLimit.violations++;
    if (rateLimit.violations >= MAX_VIOLATIONS) {
      const unblockAt = now + BLOCK_DURATION_MS;
      await redis.set(`${BLOCKED_IP_KEY_PREFIX}${clientId}`,
        {
          timestamp: now,
          reason: 'Exceeded rate limit multiple times',
          unblockAt,
        }
      );
      // Send Slack notification for user block (fire and forget)
      if (process.env.SLACK_WEBHOOK_URL && opts?.ip) {
        sendSlackUserBlocked({
          clientId,
          blockedAt: new Date(now),
          slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
          ip: opts.ip,
        });
      }
    }
  }
  await redis.set(key, rateLimit, { ex: Math.ceil(RATE_LIMIT_WINDOW / 1000) * 2 });
  return isRateLimited;
}

export function getBlockedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      message: `Your access has been blocked due to suspicious activity. ${process.env.BLOCKED_IP_MESSAGE}`
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function getRateLimitedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      message: `Rate limit exceeded. don't try again later. ${process.env.RATE_LIMIT_MESSAGE} `
    }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
