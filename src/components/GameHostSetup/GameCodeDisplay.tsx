
import React from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface GameCodeDisplayProps {
  gameCode: string;
}

const GameCodeDisplay: React.FC<GameCodeDisplayProps> = ({ gameCode }) => {
  const { toast } = useToast();

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode).then(() => {
      toast({
        title: "הקוד הועתק!",
        description: "שתף את הקוד עם חברים ומשפחה"
      });
    }).catch(() => {
      toast({
        title: "לא ניתן להעתיק",
        description: "אנא העתק את הקוד ידנית",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-center">קוד המשחק שלך:</h3>
      <div className="flex items-center justify-center gap-2">
        <div className="text-3xl font-bold text-primary tracking-widest">
          {gameCode}
        </div>
        <button onClick={copyGameCode} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="העתק קוד משחק">
          <Copy className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <p className="text-sm text-center text-gray-500 mt-2">
        שתף את הקוד עם חברים ומשפחה כדי שיוכלו להצטרף למשחק
      </p>
    </div>
  );
};

export default GameCodeDisplay;
