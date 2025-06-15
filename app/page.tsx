"use client";

import { BackgroundDecoration } from '@/components/BackgroundDecoration';
import { SuccessCard } from '@/components/SuccessCard';
import { Toaster } from '@/components/ui/sonner';
import { VerificationCard } from '@/components/VerificationCard';
import { useOTPVerification } from '@/hooks/use-otp-verification';
import gsap from 'gsap';
import { useEffect } from 'react';

export default function Home() {
  const {
    otp,
    // setOtp,
    loading,
    successLink,
    isSubmitted,
    cardRef,
    successRef,
    handleOTPComplete,
    handleSubmit,
    resetForm,
  } = useOTPVerification();

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 50,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundDecoration />
      
      <div className="w-full max-w-md relative z-10">
        {!successLink ? (

          <VerificationCard
            cardRef={cardRef}
            otp={otp}
            loading={loading}
            isSubmitted={isSubmitted}
            handleOTPComplete={handleOTPComplete}
            handleSubmit={handleSubmit}
          />
        ) : (
          <SuccessCard
            successRef={successRef}
            successLink={successLink}
            resetForm={resetForm}
          />
        )}
      </div>
      
      <Toaster />
    </div>
  );
}