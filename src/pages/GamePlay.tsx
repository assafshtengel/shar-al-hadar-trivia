import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy, CheckCircle2, Youtube } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import EndGameButton from '@/components/EndGameButton';
import ExitGameButton from '@/components/ExitGameButton';

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect?: boolean;
  lastScore?: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  youtube_link: string;
  order: number;
}

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

const GamePlay: React.FC = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '',
    name: '',
    score: 0,
    isReady: false,
    hasAnswered: false,
  });
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { gameCode, playerName, isHost } = useGameState();

  const handleAnswerSubmit = useCallback(async (selectedAnswer: string | null) => {
    if (!gameCode || !playerName || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const isCorrect = selectedAnswer === correctAnswer;
    let score = isCorrect ? timeRemaining * 10 : 0;

    try {
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: isCorrect,
        lastScore: score
      }));
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.name === playerName ? { ...p, hasAnswered: true, lastAnswerCorrect: isCorrect, lastScore: score } : p
        )
      );
      setLeaderboard(prevLeaderboard =>
        prevLeaderboard.map(p =>
          p.name === playerName ? { ...p, hasAnswered: true, lastAnswerCorrect: isCorrect, lastScore: score } : p
        )
      );

      const { error } = await supabase
        .from('players')
        .update({ 
          hasAnswered: true,
          score: currentPlayer.score + score
        })
        .eq('game_code', gameCode)
        .eq('name', playerName);

      if (error) {
        console.error('Error updating player score:', error);
        toast({
          title: "שגיאה בשמירת הניקוד",
          description: "אירעה שגיאה בשמירת הניקוד, נסה שוב",
          variant: "destructive"
        });
        return;
      }

      setPhase('scoringFeedback');

      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);

      setTimeout(() => {
        if (round < totalRounds) {
          setRound(prevRound => prevRound + 1);
          setPhase('songPlayback');
          setIsAnswerSubmitted(false);
        } else {
          endGame();
        }
      }, 6000);
    } catch (err) {
      console.error('Exception when submitting answer:', err);
      toast({
        title: "שגיאה בשמירת הניקוד",
        description: "אירעה שגיאה בלתי צפויה, נסה שוב",
        variant: "destructive"
      });
    }
  }, [gameCode, playerName, isAnswerSubmitted, timeRemaining, correctAnswer, currentPlayer, round, totalRounds, toast]);

  const fetchCurrentPlayer = useCallback(async () => {
    if (!gameCode || !playerName) return;

    try {
      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_code', gameCode)
        .eq('name', playerName)
        .single();

      if (error) {
        console.error('Error fetching current player:', error);
        return;
      }

      if (player) {
        setCurrentPlayer(player as Player);
      }
    } catch (err) {
      console.error('Exception when fetching current player:', err);
    }
  }, [gameCode, playerName]);

  const fetchCurrentSong = useCallback(async () => {
    if (!gameCode) return;

    try {
      const { data: song, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current song:', error);
        return;
      }

      if (song && song.current_song_name) {
        setYoutubeVideoId(extractVideoId(song.current_song_url));
      }
    } catch (err) {
      console.error('Exception when fetching current song:', err);
    }
  }, [gameCode]);

  const fetchPlayers = useCallback(async () => {
    if (!gameCode) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_code', gameCode)
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      if (data) {
        setPlayers(data as Player[]);
        setLeaderboard(data as Player[]);
      }
    } catch (err) {
      console.error('Exception when fetching players:', err);
    }
  }, [gameCode]);

  const generateAnswerOptions = useCallback(async (correctTitle: string) => {
    if (!gameCode) return;

    try {
      const options = [correctTitle, 'Alternative Song 1', 'Alternative Song 2'].sort(() => Math.random() - 0.5);
      setAnswerOptions(options);
    } catch (err) {
      console.error('Exception when generating answer options:', err);
    }
  }, [gameCode]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setTimeRemaining(30);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleAnswerSubmit(null);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [handleAnswerSubmit]);

  const endGame = useCallback(async () => {
    if (!gameCode || !isHost) return;

    try {
      const { error } = await supabase
        .from('game_state')
        .update({ game_phase: 'end' })
        .eq('game_code', gameCode);

      if (error) {
        console.error('Error ending game:', error);
        toast({
          title: "שגיאה בסיום המשחק",
          description: "אירעה שגיאה בסיום המשחק, נסה שוב",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Exception when ending game:', err);
      toast({
        title: "שגיאה בסיום המשחק",
        description: "אירעה שגיאה בלתי צפויה, נסה שוב",
        variant: "destructive"
      });
    }
  }, [gameCode, isHost, toast]);

  useEffect(() => {
    fetchCurrentPlayer();
  }, [fetchCurrentPlayer]);

  useEffect(() => {
    fetchCurrentSong();
  }, [fetchCurrentSong]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    if (currentSong) {
      setCorrectAnswer(currentSong.title);
      generateAnswerOptions(currentSong.title);
    }
  }, [currentSong, generateAnswerOptions]);

  useEffect(() => {
    if (phase === 'answerOptions') {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, startTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const extractVideoId = (url: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <h2 className="text-2xl font-bold text-primary">
              {currentSong ? `Round ${round}: Guess the song!` : 'Loading...'}
            </h2>
            {youtubeVideoId && (
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            <AppButton onClick={() => setPhase('answerOptions')} disabled={!currentSong}>
              {currentSong ? 'I know this song!' : 'Loading...'}
            </AppButton>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        );
      
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <h2 className="text-2xl font-bold text-primary">What's the song?</h2>
            <div className="grid grid-cols-2 gap-4">
              {answerOptions.map((option, index) => (
                <AppButton key={index} onClick={() => handleAnswerSubmit(option)}>
                  {option}
                </AppButton>
              ))}
            </div>
            <div className="flex items-center space-x-2 text-lg">
              <Clock className="text-gray-500" size={20} />
              <span>{timeRemaining}</span>
            </div>
          </div>
        );
      
      case 'scoringFeedback':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {currentPlayer.lastAnswerCorrect !== undefined ? (
              <>
                <div className={`text-3xl font-bold ${currentPlayer.lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
                  {currentPlayer.lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xl">
                  <span>קיבלת</span>
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
                  <span>נקודות</span>
                </div>
              </>
            ) : null}
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <h2 className="text-3xl font-bold text-primary mb-4">Leaderboard</h2>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Rank</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p>Next round starting soon...</p>
          </div>
        );
        
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">משחק מנגינות</h1>
        <div className="flex space-x-2">
          {isHost ? (
            <EndGameButton gameCode={gameCode} />
          ) : (
            <ExitGameButton className="ml-2" />
          )}
        </div>
      </div>
      
      {renderPhase()}
    </div>
  );
};

export default GamePlay;
