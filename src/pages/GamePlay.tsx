import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/contexts/GameStateContext';
import SongPlayer from '@/components/SongPlayer';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import MusicNote from '@/components/MusicNote';
import GameTimer from '@/components/GameTimer';
import EndGameButton from '@/components/EndGameButton';
import GameEndOverlay from '@/components/GameEndOverlay';

const GamePlay = () => {
  const [currentRound, setCurrentRound] = useState({
    songName: '',
    songUrl: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { gameCode, playerName, isHost } = useGameState();
  const [roundTime, setRoundTime] = useState(20); // Time in seconds for each round
  const [timeRemaining, setTimeRemaining] = useState(roundTime);
  const [roundActive, setRoundActive] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [songs, setSongs] = useState<{ songName: string; songUrl: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const songList = data.map(song => ({
            songName: song.song_name,
            songUrl: song.song_url
          }));
          setSongs(songList);
        } else {
          console.warn('No songs found in Supabase.');
          toast({
            title: "אין שירים",
            description: "לא נמצאו שירים, המשחק יסתיים",
            variant: "destructive"
          });
          setGameEnded(true);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
        toast({
          title: "שגיאה בטעינת שירים",
          description: "אירעה שגיאה בטעינת השירים",
          variant: "destructive"
        });
        setGameEnded(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSongs();
  }, [toast]);
  
  useEffect(() => {
    if (!gameCode) {
      console.error('Game code is not available.');
      return;
    }
    
    const fetchRoundData = async () => {
      try {
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .select('*')
          .eq('game_code', gameCode)
          .eq('round_number', currentSongIndex + 1)
          .single();
        
        if (roundError) {
          throw roundError;
        }
        
        if (roundData) {
          setCurrentRound({
            songName: roundData.song_name,
            songUrl: roundData.song_url,
            options: roundData.options,
            correctAnswerIndex: roundData.correct_answer_index,
          });
        } else {
          console.warn(`Round data not found for round ${currentSongIndex + 1}`);
          toast({
            title: "אין נתונים לסיבוב הזה",
            description: "לא נמצאו נתונים לסיבוב הזה, המשחק יסתיים",
            variant: "destructive"
          });
          setGameEnded(true);
        }
      } catch (error) {
        console.error('Error fetching round data:', error);
        toast({
          title: "שגיאה בטעינת נתוני סיבוב",
          description: "אירעה שגיאה בטעינת נתוני הסיבוב",
          variant: "destructive"
        });
        setGameEnded(true);
      }
    };
    
    fetchRoundData();
  }, [gameCode, currentSongIndex, toast]);
  
  useEffect(() => {
    if (songs.length > 0 && currentSongIndex < songs.length) {
      setCurrentRound({
        songName: songs[currentSongIndex].songName,
        songUrl: songs[currentSongIndex].songUrl,
        options: ['', '', '', ''], // Placeholder, will be updated from 'rounds' table
        correctAnswerIndex: 0, // Placeholder, will be updated from 'rounds' table
      });
    }
  }, [songs, currentSongIndex]);
  
  useEffect(() => {
    if (gameCode) {
      const subscription = supabase
        .channel('player_answers')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'players', 
          filter: `game_code=eq.${gameCode}`
        },
        async (payload) => {
          // Fetch all players to check if everyone has answered
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('hasAnswered')
            .eq('game_code', gameCode);
          
          if (playersError) {
            console.error('Error fetching players:', playersError);
            return;
          }
          
          // Check if all players have answered
          const allAnswered = playersData?.every(player => player.hasAnswered) ?? false;
          setAllPlayersAnswered(allAnswered);
          
          if (allAnswered) {
            sonnerToast("כולם ענו!", {
              description: "המתן לסיבוב הבא"
            });
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [gameCode]);
  
  useEffect(() => {
    if (gameCode) {
      const subscription = supabase
        .channel('game_end')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'game_state', 
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          if (payload.new.game_phase === 'ended') {
            setGameEnded(true);
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [gameCode]);
  
  useEffect(() => {
    if (gameEnded) {
      const determineWinners = async () => {
        try {
          const { data: players, error } = await supabase
            .from('players')
            .select('name, score')
            .eq('game_code', gameCode)
            .order('score', { ascending: false });
          
          if (error) {
            throw error;
          }
          
          if (players && players.length > 0) {
            const maxScore = players[0].score;
            const winningPlayers = players
              .filter(player => player.score === maxScore)
              .map(player => player.name);
            
            setWinners(winningPlayers);
          }
        } catch (error) {
          console.error('Error determining winners:', error);
          toast({
            title: "שגיאה בקביעת המנצחים",
            description: "אירעה שגיאה בקביעת המנצחים",
            variant: "destructive"
          });
        }
      };
      
      determineWinners();
    }
  }, [gameEnded, gameCode, toast]);
  
  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    const points = isCorrect ? 10 : 0;
    
    // Update the player's score in Supabase
    try {
      // First get current score
      const {
        data: playerData,
        error: fetchError
      } = await supabase.from('players').select('score').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const currentScore = playerData?.score || 0;
      const updatedScore = currentScore + points;
      
      // Log the score calculation
      console.log(`Calculating points: 
  Current score: ${currentScore}, 
  Points earned: ${points}, 
  New total score: ${updatedScore}`);
      
      // Update the score in the database
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          score: updatedScore,
          hasAnswered: true
        })
        .eq('game_code', gameCode)
        .eq('name', playerName);
      
      if (updateError) throw updateError;
      
      // Show toast based on answer correctness
      if (isCorrect) {
        sonnerToast.success('תשובה נכונה!', {
          description: `קיבלת ${points} נקודות`
        });
        setShowNotes(true);
      } else {
        sonnerToast.error('תשובה שגויה', {
          description: 'נסה שוב בסיבוב הבא'
        });
      }
      
    } catch (error) {
      console.error('Error updating score:', error);
      toast({
        title: 'שגיאה בעדכון הניקוד',
        description: 'אירעה שגיאה בעדכון הניקוד',
        variant: 'destructive'
      });
    }
  };
  
  const nextRound = async () => {
    setShowAnswer(false);
    setSelectedAnswer(null);
    setShowNotes(false);
    setIsTimeUp(false);
    setAllPlayersAnswered(false);
    
    // Reset hasAnswered status for all players
    const { error: resetError } = await supabase
      .from('players')
      .update({ hasAnswered: false })
      .eq('game_code', gameCode);
    
    if (resetError) {
      console.error('Error resetting hasAnswered status:', resetError);
      toast({
        title: 'שגיאה באיפוס סטטוס התשובה',
        description: 'אירעה שגיאה באיפוס סטטוס התשובה',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    } else {
      setGameEnded(true);
      sonnerToast.info("המשחק הסתיים!", {
        description: "כל השירים נוגנו"
      });
    }
  };
  
  const endGame = async () => {
    const { error } = await supabase
      .from('game_state')
      .update({ game_phase: 'ended' })
      .eq('game_code', gameCode);
    
    if (error) {
      console.error('Error ending game:', error);
      toast({
        title: "שגיאה בסיום המשחק",
        description: "אירעה שגיאה בסיום המשחק",
        variant: "destructive"
      });
      return;
    }
    
    setGameEnded(true);
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 min-h-screen">
      {gameEnded ? (
        <GameEndOverlay winners={winners} />
      ) : isLoading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">{currentRound.songName}</h2>
              <SongPlayer songUrl={currentRound.songUrl} autoPlay={true} />
              <GameTimer
                roundTime={roundTime}
                onTimeUp={() => {
                  setIsTimeUp(true);
                  setShowAnswer(true);
                }}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            {currentRound.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null || isTimeUp || allPlayersAnswered}
                variant={selectedAnswer === index ? (index === currentRound.correctAnswerIndex ? "success" : "destructive") : "default"}
              >
                {option}
              </Button>
            ))}
          </div>
          
          {showNotes && (
            <div className="flex justify-center mt-4">
              <MusicNote />
            </div>
          )}
          
          {(selectedAnswer !== null || isTimeUp || allPlayersAnswered) && (
            <div className="flex justify-center mt-4">
              <Button onClick={nextRound}>
                {currentSongIndex < songs.length - 1 ? "סיבוב הבא" : "הצג תוצאות"}
              </Button>
            </div>
          )}
          
          {isHost && (
            <EndGameButton endGame={endGame} />
          )}
        </>
      )}
    </div>
  );
};

export default GamePlay;
