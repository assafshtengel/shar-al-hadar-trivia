
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/contexts/GameStateContext';

const JoinGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setGameData } = useGameState();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate inputs
    if (!gameCode.trim() || !playerName.trim()) {
      setError('אנא מלאו את כל השדות הנדרשים');
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if game exists in game_state
      const { data: gameStateData, error: gameStateError } = await supabase
        .from('game_state')
        .select('game_phase')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (gameStateError && gameStateError.code !== 'PGRST116') {
        console.error('Error checking game state:', gameStateError);
        setError('שגיאה בבדיקת קיום המשחק, נסו שוב');
        setIsSubmitting(false);
        return;
      }

      // New validation check - if game doesn't exist, show error and stop
      if (!gameStateData) {
        setError('קוד המשחק שהוזן אינו קיים. נסה שוב.');
        setIsSubmitting(false);
        return;
      }

      // Check if game is in "end" state
      if (gameStateData.game_phase === 'end') {
        setError('המשחק הסתיים. אנא הצטרף למשחק אחר או צור משחק חדש.');
        setIsSubmitting(false);
        return;
      }

      // Check if player name already exists in this game
      const { data: existingPlayer, error: checkPlayerError } = await supabase
        .from('players')
        .select('name')
        .eq('game_code', gameCode)
        .eq('name', playerName)
        .maybeSingle();

      if (checkPlayerError && checkPlayerError.code !== 'PGRST116') {
        console.error('Error checking existing player:', checkPlayerError);
        setError('שגיאה בבדיקת שם שחקן, נסו שוב');
        setIsSubmitting(false);
        return;
      }

      if (existingPlayer) {
        setError('שם השחקן כבר קיים במשחק זה. אנא בחר שם אחר.');
        setIsSubmitting(false);
        return;
      }

      console.log("Attempting to insert player:", { name: playerName, game_code: gameCode });

      // Insert player data into Supabase
      const { error: insertError, data: newPlayer } = await supabase
        .from('players')
        .insert([
          { 
            name: playerName,
            game_code: gameCode,
            score: 0,
            hasAnswered: false,
            isReady: false
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting player:', insertError);
        setError('שגיאה בהצטרפות למשחק, נסו שוב');
        setIsSubmitting(false);
        return;
      }

      console.log('Player successfully joined:', newPlayer);

      toast({
        title: "הצטרפת בהצלחה!",
        description: `ברוכים הבאים, ${playerName}!`,
      });
      
      // Set game data in context
      setGameData({ 
        gameCode, 
        playerName,
        isHost: false
      });
      
      // Navigate based on game phase
      if (gameStateData && gameStateData.game_phase) {
        if (gameStateData.game_phase === 'waiting') {
          navigate('/waiting-room');
        } else {
          // Game already started, go directly to gameplay
          navigate('/gameplay');
        }
      } else {
        // No game state yet, go to waiting room
        navigate('/waiting-room');
      }
      
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('שגיאה בהצטרפות למשחק, נסו שוב');
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
