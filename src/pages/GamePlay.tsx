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
  embedUrl: string;
  order: number;
}

interface RoundData {
  round: number;
  correctSong: Song;
  options: string[];
}

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

const GamePlay: React.FC = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [parseError, setParseError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { gameCode, playerName, isHost } = useGameState();

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
  }, [gameCode, playerName, isAnswerSubmitted, timeRemaining, correctAnswer, currentPlayer, round, totalRounds, toast, endGame]);

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

  const fetchGameRoundData = useCallback(async () => {
    if (!gameCode) return;
    
    setIsLoading(true);
    setParseError(null);

    try {
      console.log('Fetching game round data for game code:', gameCode);
      const { data, error } = await supabase
        .from('game_state')
        .select('current_round, current_song_name, current_song_url')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game round data:', error);
        setIsLoading(false);
        return;
      }

      console.log('Game round data received:', data);

      if (data) {
        if (data.current_round) {
          setRound(data.current_round);
        }

        if (data.current_song_name) {
          try {
            const roundData = JSON.parse(data.current_song_name);
            console.log('Parsed round data:', roundData);
            
            if (roundData && roundData.correctSong) {
              if (roundData.correctSong.name && !roundData.correctSong.title) {
                console.log('Converting name field to title field');
                roundData.correctSong.title = roundData.correctSong.name;
              }
              
              setCurrentRound(roundData);
              setCurrentSong(roundData.correctSong);
              setAnswerOptions(roundData.options || []);
              
              if (roundData.correctSong.title) {
                setCorrectAnswer(roundData.correctSong.title);
              } else {
                console.warn('No title field found in correctSong');
                setCorrectAnswer('Unknown Song');
              }
              
              setYoutubeVideoId(extractVideoId(roundData.correctSong.embedUrl));
            } else {
              console.log('No valid song data in round data');
              createFallbackSongData(data.current_song_url);
            }
          } catch (parseError) {
            console.error('Error parsing round data:', parseError);
            setParseError(`Error parsing JSON: ${parseError.message}`);
            createFallbackSongData(data.current_song_url);
          }
        } else if (isHost) {
          console.log('Host mode: Using demo song data');
          createHostDemoSongData();
        } else {
          console.log('No song data available and not host');
          setCurrentRound(null);
          setCurrentSong(null);
          setAnswerOptions([]);
          setCorrectAnswer(null);
          setYoutubeVideoId(null);
        }
      }
    } catch (err) {
      console.error('Exception when fetching current song:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameCode, isHost]);

  const createFallbackSongData = (songUrl?: string, songName?: string) => {
    const dummySong = {
      id: '1',
      title: songName || 'שיר לא ידוע',
      artist: 'אמן לא ידוע',
      embedUrl: songUrl || '',
      order: 1
    };
    
    setCurrentSong(dummySong);
    setCorrectAnswer(dummySong.title);
    setYoutubeVideoId(extractVideoId(dummySong.embedUrl));
    
    setAnswerOptions([dummySong.title, 'שיר אחר 1', 'שיר אחר 2'].sort(() => Math.random() - 0.5));
  };

  const createHostDemoSongData = () => {
    const demoSong = {
      id: 'demo1',
      title: 'שיר דוגמה למארח',
      artist: 'אמן דוגמה',
      embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      order: 1
    };
    
    setCurrentSong(demoSong);
    setCorrectAnswer(demoSong.title);
    setYoutubeVideoId(extractVideoId(demoSong.embedUrl));
    setAnswerOptions([demoSong.title, 'שיר אחר 1', 'שיר אחר 2'].sort(() => Math.random() - 0.5));
  };

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

  const updateCurrentSong = useCallback(async (song: Song, options: string[]) => {
    if (!gameCode || !isHost) return;

    if (!song.title && (song as any).name) {
      song.title = (song as any).name;
    }

    const roundData: RoundData = {
      round: round,
      correctSong: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        embedUrl: song.embedUrl,
        order: song.order
      },
      options: options
    };

    try {
      console.log('Updating current song with data:', roundData);
      const { error } = await supabase
        .from('game_state')
        .update({ 
          current_song_name: JSON.stringify(roundData),
          current_song_url: song.embedUrl,
          current_round: round
        })
        .eq('game_code', gameCode);

      if (error) {
        console.error('Error updating current song:', error);
        toast({
          title: "שגיאה בעדכון השיר",
          description: "אירעה שגיאה בעדכון השיר הנוכחי",
          variant: "destructive"
        });
      } else {
        toast({
          title: "השיר עודכן",
          description: `השיר "${song.title}" עודכן בהצלחה`
        });
        setCurrentRound(roundData);
        setCurrentSong(roundData.correctSong);
        setAnswerOptions(options);
        setCorrectAnswer(song.title);
        setYoutubeVideoId(extractVideoId(song.embedUrl));
      }
    } catch (err) {
      console.error('Exception when updating current song:', err);
    }
  }, [gameCode, isHost, round, toast]);

  const playDemoSong = useCallback(() => {
    if (!isHost) return;
    
    const demoSong = {
      id: 'demo1',
      title: 'שיר דוגמה למארח',
      artist: 'אמן דוגמה',
      embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      order: 1
    };
    
    const options = [demoSong.title, 'שיר אחר 1', 'שיר אחר 2', 'שיר אחר 4'];
    updateCurrentSong(demoSong, options);
  }, [isHost, updateCurrentSong]);

  useEffect(() => {
    fetchCurrentPlayer();
  }, [fetchCurrentPlayer]);

  useEffect(() => {
    fetchGameRoundData();
  }, [fetchGameRoundData]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

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

  const renderHostControls = () => {
    if (!isHost) return null;
    
    return (
      <div className="mt-4 p-4 border border-primary rounded-md">
        <h3 className="text-xl font-semibold mb-2">בקרות מארח</h3>
        <p className="text-sm mb-4">כרגע אתה צריך להוסיף שירים ישירות דרך Supabase או להשתמש בכפתורים למטה.</p>
        <div className="flex gap-2 flex-wrap">
          <AppButton onClick={() => fetchGameRoundData()}>רענן נתוני שיר</AppButton>
          <AppButton onClick={() => playDemoSong()}>הפעל שיר דוגמה</AppButton>
        </div>
        {parseError && (
          <p className="text-sm text-red-500 mt-2">
            שגיאת פרסור JSON: {parseError}
          </p>
        )}
        <div className="mt-4">
          <p className="text-sm">
            מבנה JSON נכון לשירים:
          </p>
          <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
            {`{
  "round": 1,
  "correctSong": {
    "id": "song1",
    "title": "שם השיר",
    "artist": "שם האמן",
    "embedUrl": "https://youtube.com/...",
    "order": 1
  },
  "options": ["שם השיר", "אפשרות 2", "אפשרות 3", "אפשרות 4"]
}`}
          </pre>
        </div>
      </div>
    );
  };

  const renderPhase = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <h2 className="text-2xl font-bold text-primary">טוען...</h2>
          <div className="w-full max-w-md h-12 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary opacity-50 animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <h2 className="text-2xl font-bold text-primary text-center">
              {currentSong ? `סיבוב ${round}: נחש את השיר!` : 'ממתין לשיר...'}
            </h2>
            {youtubeVideoId ? (
              <div className="aspect-w-16 aspect-h-9 w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-64"
                ></iframe>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">אין סרטון זמין</p>
              </div>
            )}
            <AppButton onClick={() => setPhase('answerOptions')} disabled={!currentSong}>
              {currentSong ? 'אני יודע את השיר!' : 'ממתין לשיר...'}
            </AppButton>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isMuted ? 'בטל השתקה' : 'השתק'}
            </button>
          </div>
        );
      
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <h2 className="text-2xl font-bold text-primary">מהו שם השיר?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
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
            <h2 className="text-3xl font-bold text-primary mb-4">טבלת מובילים</h2>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">דירוג</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
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
            <p>הסיבוב הבא מתחיל בקרוב...</p>
          </div>
        );
        
      default:
        return <div>טוען...</div>;
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
      {renderHostControls()}
    </div>
  );
};

export default GamePlay;
