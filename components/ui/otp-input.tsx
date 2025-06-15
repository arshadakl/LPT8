"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { validateOTP } from "@/lib/validate-otp";
import gsap from 'gsap';
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onSubmit?: () => void;
  className?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  onComplete,
  onSubmit,
  className,
  disabled = false,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        {
          scale: 0.8,
          opacity: 0,
          y: 20,
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    
    const newValue = value.replace(/[^0-9]/g, '');
    if (newValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      
      // Animate the current input
      gsap.to(inputRefs.current[index], {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    }

    // Check if OTP is complete
    const otpString = newOtp.join('');
    if (otpString.length === length) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const pastedArray = pastedText.slice(0, length).split('');
    
    const newOtp = [...otp];
    pastedArray.forEach((digit, index) => {
      if (index < length) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    
    const lastFilledIndex = Math.min(pastedArray.length - 1, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
    
    if (pastedArray.length === length) {
      onComplete(pastedArray.join(''));
    }
  };

  const handleOTPComplete = async (otpValue: string) => {
    const result = await validateOTP(otpValue);
    
    if (result && result.success && result.link) {
      // Navigate to success page if OTP is valid
      router.push(result.link);
    }
    // If invalid, the toast is already shown by validateOTP function
    // and we don't reload or navigate away
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center justify-center gap-3 sm:gap-4",
        className
      )}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 text-center text-lg sm:text-2xl font-bold",
            "bg-gray-800/50 border-2 border-gray-700 rounded-xl",
            "text-white placeholder-gray-500",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
            "transition-all duration-200 ease-in-out",
            "hover:border-gray-600 hover:bg-gray-800/70",
            "backdrop-blur-sm",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

const OTPForm = () => {
  const { toast } = useToast();
  const router = useRouter();

  const handleOTPComplete = async (otpValue: string) => {
    const result = await validateOTP(otpValue);
    
    if (result && result.success && result.link) {
      // Navigate to success page if OTP is valid
      router.push(result.link);
    } else {
      toast({
        title: "Verification Failed",
        description: result.message || "Invalid mobile number",
        variant: "destructive",
      });
    }
    // We don't reload the component for errors
  };

  return (
    <div>
      <OTPInput 
        length={4} 
        onComplete={handleOTPComplete}
        onSubmit={() => {/* optional submit handler */}}
      />
    </div>
  );
};