import { useToast } from '@/hooks/use-toast';
import { validateOTP } from '@/lib/validate-otp';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

export function useOTPVerification() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
  }, [cardRef]);

  const handleOTPComplete = async (otpValue: string) => {
    const result = await validateOTP(otpValue);

    if (result.success && result.link) {
      setSuccessLink(result.link);
      setIsSubmitted(true);

      if (cardRef.current) {
        gsap.to(cardRef.current, {
          opacity: 0,
          y: -30,
          scale: 0.9,
          duration: 0.5,
          ease: "power2.in",
        });
      }

      setTimeout(() => {
        if (successRef.current) {
          gsap.fromTo(
            successRef.current,
            {
              opacity: 0,
              y: 30,
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
      }, 500);

      toast({
        title: "Success!",
        description: "OTP verified successfully",
      });
    } else {
      toast({
        title: "Verification Failed",
        description: result.message || "Invalid mobile number",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const result = await validateOTP(otp);

      if (result.success && result.link) {
        setSuccessLink(result.link);
        setIsSubmitted(true);

        if (cardRef.current) {
          gsap.to(cardRef.current, {
            opacity: 0,
            y: -30,
            scale: 0.9,
            duration: 0.5,
            ease: "power2.in",
          });
        }

        setTimeout(() => {
          if (successRef.current) {
            gsap.fromTo(
              successRef.current,
              {
                opacity: 0,
                y: 30,
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
        }, 500);

        toast({
          title: "Success!",
          description: "OTP verified successfully",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Invalid mobile number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOtp('');
    setSuccessLink(null);
    setIsSubmitted(false);
    setLoading(false);

    if (successRef.current) {
      gsap.to(successRef.current, {
        opacity: 0,
        y: -30,
        scale: 0.9,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          if (cardRef.current) {
            gsap.fromTo(
              cardRef.current,
              {
                opacity: 0,
                y: 30,
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
        },
      });
    }
  };

  return {
    otp,
    setOtp,
    loading,
    successLink,
    isSubmitted,
    cardRef,
    successRef,
    handleOTPComplete,
    handleSubmit,
    resetForm,
  };
}
