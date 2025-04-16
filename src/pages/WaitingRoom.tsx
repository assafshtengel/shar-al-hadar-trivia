import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MusicNote from '@/components/MusicNote';
import { Progress } from '@/components/ui/progress';
import { useGameState } from '@/contexts/GameStateContext';
import EndGameButton from '@/components/EndGameButton';
import { Link } from 'react-router-dom';
import Music from '@/components/Music';

const WaitingRoom = () => {
  const navigate = useNavigate();
  const { gameCode, playerName, isHost } = useGameState();
  const [progressValue, setProgressValue] = useState(10);

  useEffect(() => {
    if (!gameCode) {
      navigate('/join-game');
    }
  }, [gameCode, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue((prevValue) => {
        if (prevValue >= 90) {
          return 10;
        }
        return prevValue + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
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

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          <div className="mb-8 text-center relative w-full">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            <h2 className="text-lg text-gray-600">
              {isHost ? 'חדר המתנה - מסך מנהל' : 'חדר המתנה - שחקן'}
            </h2>
            
            <div className="absolute top-0 right-0">
              <EndGameButton />
            </div>
          </div>

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
            
            <div className="space-y-2 mb-6">
              <Progress value={progressValue} className="h-2 w-full" />
            </div>
            
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
    </div>
  );
};

export default WaitingRoom;
