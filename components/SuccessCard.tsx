import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface SuccessCardProps {
  successRef: React.RefObject<HTMLDivElement>;
  successLink: string;
  resetForm: () => void;
}

export function SuccessCard({
  successRef,
  successLink,
  resetForm,
}: SuccessCardProps) {
  return (
    <Card
      ref={successRef}
      className="bg-gray-900/80 backdrop-blur-xl border-gray-700/50 shadow-2xl opacity-0"
    >
      <CardContent className="text-center space-y-6 p-8">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Verification Successful!
          </h2>
          {/* <p className="text-gray-400">
            Click to read my words
          </p> */}
        </div>
        
        <a
          href={successLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
        >
          
          <span>Open my Second Box</span>
          <ExternalLink className="w-4 h-4 animate-pulse" />
        </a>
        
        <button
          onClick={resetForm}
          className="block mx-auto text-sm text-gray-400 hover:text-white transition-colors duration-200 mt-4"
        >
          Go back
        </button>
      </CardContent>
    </Card>
  );
}
