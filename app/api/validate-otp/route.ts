import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching of sensitive operations
export const dynamic = 'force-dynamic';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 40;
const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

// Clear expired rate limit entries periodically
setInterval(clearExpiredRateLimitEntries, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = request.ip || 'unknown';
    if (isRateLimited(clientId)) {
      return rateLimitExceededResponse();
    }

    // Extract and validate input
    const { otp } = await request.json();
    if (!isValidOTPFormat(otp)) {
      return invalidOTPFormatResponse();
    }

    // Validate OTP
    const { validOTP, successLink } = getEnvironmentVariables();
    const isValid = compareOTP(otp, validOTP);

    // Add a random delay to prevent timing attacks
    await addRandomDelay();

    return isValid ? successResponse(successLink) : invalidOTPResponse(otp);
  } catch (error) {
    return handleError(error);
  }
}

// Helper functions
function clearExpiredRateLimitEntries() {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitMap.entries())) {
    if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const rateLimitKey = `${clientId}:otp`;
  const rateLimit = rateLimitMap.get(rateLimitKey) || { count: 0, timestamp: now };

  if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.count = 0;
    rateLimit.timestamp = now;
  }

  rateLimit.count++;
  rateLimitMap.set(rateLimitKey, rateLimit);

  return rateLimit.count > MAX_REQUESTS;
}

function rateLimitExceededResponse() {
  return NextResponse.json(
    { success: false, message: 'Too many attempts. Please try again later.' },
    { status: 429 }
  );
}

function isValidOTPFormat(otp: any): boolean {
  return typeof otp === 'string' && /^\d{4}$/.test(otp);
}

function invalidOTPFormatResponse() {
  return NextResponse.json(
    { success: false, message: 'Invalid OTP format' },
    { status: 400 }
  );
}

function getEnvironmentVariables() {
  const validOTP = process.env.VALID_OTP;
  const successLink = process.env.SUCCESS_LINK;
  const firstNumber = process.env.FIRST_NUMBER;
  const specialMessage = process.env.SPECIAL_MESSAGE;

  if (!validOTP || !successLink || !firstNumber) {
    throw new Error('Missing environment variables');
  }

  return { validOTP, successLink, firstNumber, specialMessage };
}

function addRandomDelay() {
  return new Promise(resolve => setTimeout(resolve, Math.random() * 100));
}

function successResponse(successLink: string) {
  const response = NextResponse.json({
    success: true,
    link: successLink,
    message: 'Verification successful',
  });

  response.cookies.set('auth_verified', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  return response;
}

function invalidOTPResponse(number: { number?: string }) {
  const { firstNumber, specialMessage } = getEnvironmentVariables();
  console.log(number);

  if (number === firstNumber) {
    return NextResponse.json(
      { success: false, message: specialMessage },
      { status: 401 }
    );
  }else{
    return NextResponse.json(
      { success: false, message: 'Invalid mobile number' },
      { status: 401 }
    );
  }
  }
  
  

function handleError(error: any) {
  console.error('OTP validation error:', error);
  return NextResponse.json(
    { success: false, message: 'Verification failed' },
    { status: 500 }
  );
}

// Constant-time comparison function to prevent timing attacks
function compareOTP(input: string, valid: string): boolean {
  if (input.length !== valid.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ valid.charCodeAt(i);
  }

  return result === 0;
}