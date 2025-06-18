import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function sendSlackVerificationSuccess({
  clientId,
  verifiedAt,
  slackWebhookUrl,
  ip,
}: {
  clientId: string;
  verifiedAt: Date;
  slackWebhookUrl: string;
  ip: string;
}) {
  // Attempted times from Upstash
  let attemptedTimes = 1;
  try {
    const rateLimit = await redis.get(`ratelimit:${clientId}`);
    if (rateLimit && typeof rateLimit === 'object' && 'count' in rateLimit) {
      attemptedTimes = (rateLimit as any).count;
    }
  } catch (e) {
    // ignore
  }

  // Try to get location info from ip-api.com (free, no key needed)
  let location = '';
  console.log(`Fetching location for IP: ${ip}`);
  
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        location = [data.city, data.regionName, data.country].filter(Boolean).join(', ');
      }
    }
  } catch (e) {
    // ignore
  }

  const text = `✅ OTP Verified\nIP: ${ip}${location ? `\nLocation: ${location}` : ''}\nVerified at: ${verifiedAt.toISOString()}\nAttempted times: ${attemptedTimes}`;

  // Send to Slack webhook
  fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {}); // Fire and forget
}

export async function sendSlackUserBlocked({
  clientId,
  blockedAt,
  slackWebhookUrl,
  ip,
}: {
  clientId: string;
  blockedAt: Date;
  slackWebhookUrl: string;
  ip: string;
}) {
  let attemptedTimes = 1;
  try {
    const rateLimit = await redis.get(`ratelimit:${clientId}`);
    if (rateLimit && typeof rateLimit === 'object' && 'count' in rateLimit) {
      attemptedTimes = (rateLimit as any).count;
    }
  } catch (e) {}

  let location = '';
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        location = [data.city, data.regionName, data.country].filter(Boolean).join(', ');
      }
    }
  } catch (e) {}

  const text = `🚫 User Blocked\nIP: ${ip}${location ? `\nLocation: ${location}` : ''}\nBlocked at: ${blockedAt.toISOString()}\nAttempted times: ${attemptedTimes}`;

  fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}
