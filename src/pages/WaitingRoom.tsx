
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MusicNote from '@/components/MusicNote';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

const WaitingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [progressValue, setProgressValue] = useState(10);
  const { gameCode, playerName } = location.state || {};

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue((prevValue) => {
        // Loop between 10% and 90%
        if (prevValue >= 90) {
          return 10;
        }
        return prevValue + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Listen for game start event
  useEffect(() => {
    if (!gameCode) return;

    // TODO: This is a placeholder. In a real implementation, 
    // we would listen for a specific event from the host to start the game
    // For now, we'll add a subscription to check for a game_started field update
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Player update detected:', payload);
          // In a real implementation, we would check if the game has started
          // and navigate to the game screen
          // For now, this just logs changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      {/* Background musical notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote 
          type="note1" 
          className="absolute top-[15%] right-[20%] opacity-20" 
          size={40} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note2" 
          className="absolute top-[30%] left-[15%] opacity-20" 
          size={34} 
          animation="float-alt"
          color="#FFC22A"
        />
        <MusicNote 
          type="note3" 
          className="absolute bottom-[25%] right-[15%] opacity-20" 
          size={44} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="headphones" 
          className="absolute bottom-[20%] left-[20%] opacity-20" 
          size={38} 
          animation="float-alt"
          color="#3DCDC2"
        />
      </div>

      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center relative z-10 text-center">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg animate-fade-in">
          <h1 className="text-3xl font-bold text-primary mb-6">הצטרפת בהצלחה!</h1>
          
          {playerName && (
            <p className="text-lg text-gray-700 mb-4">
              ברוך הבא, <span className="font-semibold">{playerName}</span>!
            </p>
          )}
          
          <p className="text-lg text-gray-700 mb-8">
            ממתינים לשאר המשתתפים... המשחק יתחיל בקרוב
          </p>
          
          {/* Animated loading indicator */}
          <div className="space-y-2 mb-6">
            <Progress value={progressValue} className="h-2 w-full" />
          </div>
          
          {/* Animated musical notes */}
          <div className="flex justify-center gap-4 mt-6">
            <MusicNote 
              type="note1" 
              animation="float" 
              color="#6446D0" 
              size={28} 
            />
            <MusicNote 
              type="note2" 
              animation="float-alt" 
              color="#FFC22A" 
              size={24} 
            />
            <MusicNote 
              type="note3" 
              animation="float" 
              color="#3DCDC2" 
              size={32} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
