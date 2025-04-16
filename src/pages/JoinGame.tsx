
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const JoinGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate inputs
    if (!gameCode.trim() || !playerName.trim()) {
      setError('אנא מלאו את כל השדות הנדרשים');
      setIsSubmitting(false);
      return;
    }

    // Simple validation - in a real app, you would check against a backend
    if (gameCode === '123456') {
      toast({
        title: "הצטרפת בהצלחה!",
        description: `ברוכים הבאים, ${playerName}!`,
      });
      
      // In a real app, navigate to waiting room or game
      setTimeout(() => {
        // Navigate to waiting room or game (placeholder for now)
        navigate('/');
        setIsSubmitting(false);
      }, 1500);
    } else {
      // Show error for invalid game code
      setError('קוד שגוי או שהמשחק כבר התחיל');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      {/* Background musical notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote 
          type="note1" 
          className="absolute top-[10%] right-[15%] opacity-20" 
          size={40} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note2" 
          className="absolute top-[20%] left-[10%] opacity-20" 
          size={34} 
          animation="float-alt"
          color="#FFC22A"
        />
        <MusicNote 
          type="note3" 
          className="absolute bottom-[30%] right-[20%] opacity-20" 
          size={44} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="headphones" 
          className="absolute bottom-[15%] left-[15%] opacity-20" 
          size={38} 
          animation="float-alt"
          color="#3DCDC2"
        />
      </div>

      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center max-w-md relative z-10">
        <Card className="w-full bg-white/90 backdrop-blur-sm border-secondary/20 shadow-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              הצטרפות למשחק
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-700 mb-6">
              הכניסו את קוד המשחק ואת שמכם כדי להצטרף לחוויה המוזיקלית!
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4 animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleJoinGame} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="הכנס קוד משחק"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  className="text-right"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="הכנס שם שחקן"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="text-right"
                  maxLength={20}
                />
              </div>

              <div className="pt-4">
                <AppButton
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isSubmitting}
                >
                  הצטרף למשחק
                </AppButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decorative musical note icons below the card */}
        <div className="flex justify-center mt-8 gap-4">
          <MusicNote type="note2" animation="float" color="#FFC22A" />
          <MusicNote type="note3" animation="float-alt" color="#6446D0" />
          <MusicNote type="note1" animation="float" color="#3DCDC2" />
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
