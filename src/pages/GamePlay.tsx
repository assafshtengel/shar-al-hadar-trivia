import React, { useState, useEffect } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import EndGameButton from '@/components/EndGameButton';
import MusicNote from '@/components/MusicNote';

const GamePlay = () => {
  const { gameCode, playerName, isHost, gamePhase } = useGameState();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [round, setRound] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [hostSelectedAnswer, setHostSelectedAnswer] = useState(false);

  useEffect(() => {
    if (!gameCode) {
      console.log('No game code found, navigating to home');
      return;
    }

    const fetchQuestion = async () => {
      setLoading(true);
      try {
        const { data: question, error } = await supabase
          .from('questions')
          .select('*')
          .eq('round', round)
          .eq('game_code', gameCode)
          .single();

        if (error) {
          console.error('Error fetching question:', error);
        } else {
          setCurrentQuestion(question);
        }
      } catch (err) {
        console.error('Unexpected error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
    setHostSelectedAnswer(false);
  }, [gameCode, round]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isAnswering && timeRemaining > 0) {
      timerInterval = setTimeout(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsAnswering(false);
      setShowResults(true);
    }

    return () => clearTimeout(timerInterval);
  }, [isAnswering, timeRemaining]);

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
          <div className="mb-4 text-center relative w-full">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            
            {/* Add game info and end game button */}
            <div className="flex justify-between items-center w-full">
              <div className="text-lg text-gray-600">
                קוד משחק: <span className="font-bold">{gameCode}</span>
              </div>
              <EndGameButton gameCode={gameCode} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
