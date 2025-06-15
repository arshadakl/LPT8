export interface OTPValidationResponse {
  success: boolean;
  message?: string;
  link?: string;
}

export async function validateOTP(otp: string): Promise<OTPValidationResponse> {
  try {
    // Input validation
    if (!otp || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return {
        success: false,
        message: "Please enter a valid 4-digit code"
      };
    }

    const response = await fetch('/api/validate-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp }),
      // Prevent caching of responses
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('OTP validation error:', error);
    return {
      success: false,
      message: "Verification failed. Please try again."
    };
  }
}