
import React, { useState, useEffect } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import EndGameButton from '@/components/EndGameButton';
import MusicNote from '@/components/MusicNote';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
        // Instead of querying a "questions" table, get the current question data from game_state
        const { data: gameState, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('game_code', gameCode)
          .single();

        if (error) {
          console.error('Error fetching game state:', error);
        } else if (gameState) {
          // For demonstration, we'll create a dummy question based on the game state
          // In a real implementation, you would store questions in game_state or another table
          const dummyQuestion = {
            question_text: `שאלה למשחק בסיבוב ${round}`,
            options: ['תשובה א', 'תשובה ב', 'תשובה ג', 'תשובה ד'],
            correct_answer: 'תשובה א',
            song_name: gameState.current_song_name || 'שיר לדוגמה',
            song_url: gameState.current_song_url || ''
          };
          
          setCurrentQuestion(dummyQuestion);
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

  const handleSelectAnswer = (answer: string) => {
    if (isAnswering) {
      setUserAnswer(answer);
      // In a real implementation, you would send the answer to the server
    }
  };

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
            
            {/* Game info and end game button */}
            <div className="flex justify-between items-center w-full">
              <div className="text-lg text-gray-600">
                קוד משחק: <span className="font-bold">{gameCode}</span>
              </div>
              <EndGameButton gameCode={gameCode} />
            </div>
          </div>
          
          {/* Game content */}
          <Card className="w-full shadow-md">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">טוען שאלה...</div>
              ) : currentQuestion ? (
                <div className="space-y-4">
                  <div className="text-lg font-medium text-center mb-4">
                    סיבוב {round} - {currentQuestion.song_name}
                  </div>
                  
                  {/* Timer */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>זמן נותר</span>
                      <span>{timeRemaining} שניות</span>
                    </div>
                    <Progress value={(timeRemaining / 30) * 100} className="h-2" />
                  </div>
                  
                  {/* Question */}
                  <div className="text-xl font-bold text-center my-6">
                    {currentQuestion.question_text}
                  </div>
                  
                  {/* Answer options */}
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <Button
                        key={index}
                        variant={userAnswer === option ? "default" : "outline"}
                        className="py-6 text-md justify-start"
                        onClick={() => handleSelectAnswer(option)}
                        disabled={!isAnswering}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Results section */}
                  {showResults && (
                    <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                      <div className="text-center font-bold mb-2">
                        {userAnswer === currentQuestion.correct_answer 
                          ? "תשובה נכונה! 🎉" 
                          : "תשובה שגויה! 😕"}
                      </div>
                      <div className="text-center">
                        התשובה הנכונה: {currentQuestion.correct_answer}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  לא נמצאה שאלה לסיבוב הנוכחי
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
