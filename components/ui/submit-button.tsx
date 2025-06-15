"use client";

import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Button } from './button';

interface SubmitButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  className,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  const handleClick = () => {
    if (buttonRef.current && !loading && !disabled) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: onClick,
      });
    } else {
      onClick();
    }
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "w-full px-8 py-6 text-lg font-semibold ",
        "bg-gradient-to-r from-blue-600 to-purple-600",
        "hover:from-blue-700 hover:to-purple-700",
        "focus:ring-2 focus:ring-blue-500/20",
        "transition-all duration-200 ease-in-out",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Verifying...
        </>
      ) : (
        'Verify Code'
      )}
    </Button>
  );
};