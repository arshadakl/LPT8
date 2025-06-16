import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OTPInput } from '@/components/ui/otp-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Smartphone } from 'lucide-react';

interface VerificationCardProps {
  cardRef: React.RefObject<HTMLDivElement>;
  otp: string;
  loading: boolean;
  isSubmitted: boolean;
  handleOTPComplete: (otpValue: string) => void;
  handleSubmit: () => void;
}

export function VerificationCard({
  cardRef,
  otp,
  loading,
  isSubmitted,
  handleOTPComplete,
  handleSubmit,
}: Readonly<VerificationCardProps>) {
  return (
    <Card
      ref={cardRef}
      className="bg-gray-900/80 backdrop-blur-xl border-gray-700/50 shadow-2xl"
    >
      <CardHeader className="text-center space-y-4 pb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Verification
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Enter your last 4 digits of mobile number
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <OTPInput
            onComplete={handleOTPComplete}
            onSubmit={handleSubmit}
            disabled={loading || isSubmitted}
          />
        </div>
        
        <SubmitButton
          onClick={handleSubmit}
          loading={loading}
          disabled={otp.length !== 4 || isSubmitted}
        />
        
        <p className="text-xs text-gray-500 text-center">
        To ensure the correct person is accessing this, please enter the last 4 digits of your mobile number.
        </p>
      </CardContent>
    </Card>
  );
}
