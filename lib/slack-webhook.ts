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
  } catch (error) {
    console.log('Failed to get rate limit data:', error instanceof Error ? error.message : 'Unknown error');
  }
  // First message - immediate simple notification
  const firstText = "success";

  // Send first Slack message immediately
  fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: firstText }),
  })
  .then(() => {
    console.log('First Slack verification message sent successfully');
  })
  .catch(() => {
    console.log('Failed to send first Slack verification message');
  });

  // Second message - with detailed IP information (fire and forget)
  sendSlackWithLocationDetails(ip, slackWebhookUrl, 'verification', { verifiedAt, attemptedTimes });
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
  } catch (error) {
    console.log('Failed to get rate limit data:', error instanceof Error ? error.message : 'Unknown error');
  }
  // First message - immediate simple notification
  const firstText = "blocked";

  // Send first Slack message immediately
  fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: firstText }),
  })
  .then(() => {
    console.log('First Slack blocked message sent successfully');
  })
  .catch(() => {
    console.log('Failed to send first Slack blocked message');
  });

  // Second message - with detailed IP information (fire and forget)
  sendSlackWithLocationDetails(ip, slackWebhookUrl, 'blocked', { blockedAt, attemptedTimes });
}

// Helper function to send location details as a second message
async function sendSlackWithLocationDetails(
  ip: string, 
  slackWebhookUrl: string, 
  type: 'verification' | 'blocked',
  data: { verifiedAt?: Date; blockedAt?: Date; attemptedTimes: number }
) {
  let location = '';
  console.log(`Fetching location for IP: ${ip}`);
  
  try {
    // Set timeout for the IP API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const apiData = await res.json();
      if (apiData?.country) {
        location = [apiData.city, apiData.regionName, apiData.country].filter(Boolean).join(', ');
      }
    }
  } catch (e) {
    console.log('Failed to fetch location data:', e instanceof Error ? e.message : 'Unknown error');
  }  // Always send second message with IP details (with or without location)
  const emoji = type === 'verification' ? '✅' : '🚫';
  const action = type === 'verification' ? 'OTP Verified' : 'User Blocked';
  const timestamp = type === 'verification' 
    ? data.verifiedAt?.toISOString() 
    : data.blockedAt?.toISOString();
  
  const locationLine = location ? `\nLocation: ${location}` : '';
  const detailsText = `${emoji} ${action}\nIP: ${ip}${locationLine}\nTimestamp: ${timestamp}\nAttempted times: ${data.attemptedTimes}`;

  fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: detailsText }),
  })
  .then(() => {
    console.log(`Second Slack ${type} message with details sent successfully`);
  })
  .catch(() => {
    console.log(`Failed to send second Slack ${type} message with details`);
  });
}
