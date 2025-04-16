
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy } from 'lucide-react';
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

interface Song {
  name: string;
  embedUrl: string;
  fullUrl: string;
}

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

interface Player {
  name: string;
  score: number;
  lastScore?: number;
  skipsLeft: number;
  hasAnswered: boolean;
  lastAnswer?: string;
  lastAnswerCorrect?: boolean;
}

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

interface SupabasePlayer {
  id: string;
  name: string;
  score: number;
  game_code: string;
  joined_at: string;
}

const songs: Song[] = [
  {
    name: "עתיד מתוק - משינה",
    embedUrl: "https://www.youtube.com/embed/_3OOrrGxJ1M?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=_3OOrrGxJ1M"
  },
  {
    name: "ריקוד המכונה - משינה",
    embedUrl: "https://www.youtube.com/embed/U0THoV7yTeA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=U0THoV7yTeA"
  },
  {
    name: "אהובתי - משינה",
    embedUrl: "https://www.youtube.com/embed/GgNFq1sSz5s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=GgNFq1sSz5s"
  },
  {
    name: "אחכה לך בשדות - משינה",
    embedUrl: "https://www.youtube.com/embed/aEWr8V-w9yc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=aEWr8V-w9yc"
  },
  {
    name: "אין מקום אחר - משינה",
    embedUrl: "https://www.youtube.com/embed/PVAD3KWgQrQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=PVAD3KWgQrQ"
  },
  {
    name: "אנה - משינה",
    embedUrl: "https://www.youtube.com/embed/35J7emcpOio?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=35J7emcpOio"
  }
];

const GamePlay: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { gameCode, playerName, isHost, gamePhase: serverGamePhase } = useGameState();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({ 
    name: playerName || "שחקן נוכחי", 
    score: 0, 
    skipsLeft: 3, 
    hasAnswered: false 
  });

  useEffect(() => {
    if (!gameCode) {
      navigate('/');
    }
  }, [gameCode, navigate]);

  useEffect(() => {
    if (!serverGamePhase) return;

    console.log('Server game phase changed:', serverGamePhase);
    
    switch (serverGamePhase) {
      case 'playing':
        setPhase('songPlayback');
        break;
      case 'answering':
        setPhase('answerOptions');
        if (!isHost) {
          startTimer();
        }
        break;
      case 'results':
        setPhase('scoringFeedback');
        break;
      case 'end':
        if (isHost) {
          setPhase('leaderboard');
        }
        break;
    }
  }, [serverGamePhase, isHost]);

  useEffect(() => {
    if (!gameCode) return;

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_code', gameCode)
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "שגיאה בטעינת השחקנים",
          description: "אירעה שגיאה בטעינת רשימת השחקנים",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        console.log('Fetched players:', data);
        setPlayers(data);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Players table changed:', payload);
          
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, toast]);

  // Add a new effect to fetch the current round data when game phase changes
  useEffect(() => {
    if (!gameCode || !serverGamePhase) return;
    
    const fetchGameRoundData = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('current_song_name, current_song_url')
        .eq('game_code', gameCode)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching game round data:', error);
        return;
      }
      
      if (data && data.current_song_name) {
        // Parse the stored game round data
        try {
          const roundData = JSON.parse(data.current_song_name);
          if (roundData && roundData.correctSong && roundData.options) {
            console.log('Fetched game round data:', roundData);
            setCurrentRound(roundData);
            
            if (roundData.correctSong) {
              setCurrentSong(roundData.correctSong);
            }
          }
        } catch (parseError) {
          console.error('Error parsing game round data:', parseError);
        }
      }
    };
    
    fetchGameRoundData();
    
    // Set up real-time subscription for game_state changes
    const gameStateChannel = supabase
      .channel('game-state-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Game state changed:', payload);
          if (payload.new && payload.new.current_song_name) {
            try {
              const roundData = JSON.parse(payload.new.current_song_name);
              if (roundData && roundData.correctSong && roundData.options) {
                console.log('New game round data from real-time update:', roundData);
                setCurrentRound(roundData);
                
                if (roundData.correctSong) {
                  setCurrentSong(roundData.correctSong);
                }
              }
            } catch (parseError) {
              console.error('Error parsing real-time game round data:', parseError);
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(gameStateChannel);
    };
  }, [gameCode, serverGamePhase]);

  const updateGameState = async (phase: string) => {
    if (!isHost || !gameCode) return;

    const { error } = await supabase
      .from('game_state')
      .update({ game_phase: phase })
      .eq('game_code', gameCode);

    if (error) {
      console.error('Error updating game state:', error);
      toast({
        title: "שגיאה בעדכון מצב המשחק",
        description: "אירעה שגיאה בעדכון מצב המשחק",
        variant: "destructive"
      });
    }
  };

  function createGameRound(): GameRound {
    const randomIndex = Math.floor(Math.random() * songs.length);
    const correctSong = songs[randomIndex];
    
    const otherSongs = songs.filter(song => song.name !== correctSong.name);
    
    const shuffledWrongSongs = [...otherSongs].sort(() => Math.random() - 0.5).slice(0, 3);
    
    const allOptions = [correctSong, ...shuffledWrongSongs];
    
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    
    const correctIndex = shuffledOptions.findIndex(song => song.name === correctSong.name);
    
    return {
      correctSong,
      options: shuffledOptions,
      correctAnswerIndex: correctIndex
    };
  }

  useEffect(() => {
    if (showYouTubeEmbed) {
      const timer = setTimeout(() => {
        setShowYouTubeEmbed(false);
        setIsPlaying(false);
        
        if (isHost) {
          updateGameState('answering');
        }
        
        setPhase('answerOptions');
        startTimer();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [showYouTubeEmbed]);

  const playSong = async () => {
    if (!isHost) return;
    
    const gameRound = createGameRound();
    setCurrentRound(gameRound);
    
    setCurrentSong(gameRound.correctSong);
    
    setIsPlaying(true);
    setShowYouTubeEmbed(true);
    
    // Store the game round data in Supabase so non-host players can access it
    const roundDataString = JSON.stringify(gameRound);
    const { error } = await supabase
      .from('game_state')
      .update({ 
        current_song_name: roundDataString,
        current_song_url: gameRound.correctSong.embedUrl,
        game_phase: 'playing'
      })
      .eq('game_code', gameCode);
    
    if (error) {
      console.error('Error storing game round data:', error);
      toast({
        title: "שגיאה בשמירת נתוני הסיבוב",
        description: "אירעה שגיאה בשמירת נתוני הסיבוב",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "משמיע שיר...",
      description: "מנגן כעת, האזן בקשב",
    });
  };

  const startTimer = () => {
    setTimeLeft(15);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!currentPlayer.hasAnswered) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleAnswer = (index: number) => {
    if (currentPlayer.hasAnswered || !currentRound) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    const points = isCorrect ? 10 : 0;
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[index].name,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: prev.score + points
    }));
    
    if (gameCode && playerName) {
      updatePlayerScore(points);
    }
    
    setTimeout(() => {
      if (isHost) {
        updateGameState('results');
      }
      setPhase('scoringFeedback');
      
      setTimeout(() => {
        if (isHost) {
          updateGameState('end');
        }
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  const updatePlayerScore = async (points: number) => {
    if (!gameCode || !playerName) return;

    const { data: playerData, error: fetchError } = await supabase
      .from('players')
      .select('score')
      .eq('game_code', gameCode)
      .eq('name', playerName)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching player:', fetchError);
      return;
    }

    const currentScore = playerData?.score || 0;
    const newScore = currentScore + points;

    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        score: newScore,
        hasAnswered: true
      })
      .eq('game_code', gameCode)
      .eq('name', playerName);

    if (updateError) {
      console.error('Error updating player score:', updateError);
      toast({
        title: "שגיאה בעדכון הניקוד",
        description: "אירעה שגיאה בעדכון הניקוד שלך",
        variant: "destructive"
      });
    }
  };

  const handleSkip = () => {
    if (currentPlayer.hasAnswered || currentPlayer.skipsLeft <= 0 || !currentRound) return;
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      skipsLeft: prev.skipsLeft - 1,
      lastScore: 2,
      score: prev.score + 2
    }));
    
    if (gameCode && playerName) {
      updatePlayerScore(2);
    }
    
    toast({
      title: "דילגת על השאלה",
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילוגים`,
    });
    
    setTimeout(() => {
      setPhase('scoringFeedback');
      
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  const handleTimeout = () => {
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: false,
      lastScore: 0
    }));
    
    toast({
      title: "אוי! נגמר הזמן",
      description: "לא הספקת לענות בזמן",
      variant: "destructive",
    });
    
    setTimeout(() => {
      setPhase('scoringFeedback');
      
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  const resetPlayersAnsweredStatus = async () => {
    if (!isHost || !gameCode) return;
    
    // Reset hasAnswered status for all players in this game
    const { error } = await supabase
      .from('players')
      .update({ hasAnswered: false })
      .eq('game_code', gameCode);
    
    if (error) {
      console.error('Error resetting players answered status:', error);
      toast({
        title: "שגיאה באיפוס סטטוס השחקנים",
        description: "אירעה שגיאה באיפוס סטטוס השחקנים",
        variant: "destructive"
      });
    }
  };

  const nextRound = async () => {
    if (!isHost) return;
    
    // Reset players' answered status before starting new round
    await resetPlayersAnsweredStatus();
    
    setSelectedAnswer(null);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined
    }));
    
    updateGameState('waiting');
    
    setPhase('songPlayback');
    
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: "סיבוב חדש עומד להתחיל",
    });
  };
  
  const playFullSong = () => {
    if (!isHost || !currentRound) return;
    
    toast({
      title: "משמיע את השיר המלא",
      description: "השיר המלא מתנגן כעת",
    });

    if (currentRound.correctSong.fullUrl) {
      console.log(`Playing full song from YouTube: ${currentRound.correctSong.fullUrl}`);
      window.open(currentRound.correctSong.fullUrl, '_blank');
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
            
            {showYouTubeEmbed && currentSong && (
              <div className="relative w-full h-40">
                <iframe 
                  width="100%" 
                  height="100%"
                  src={currentSong.embedUrl}
                  frameBorder="0" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                  className="absolute top-0 left-0 z-10"
                ></iframe>
                
                <div 
                  className="absolute top-0 left-0 w-full h-full z-20 bg-black"
                  style={{ opacity: 0.95 }}
                ></div>
              </div>
            )}
            
            {isHost && (
              <AppButton 
                variant="primary" 
                size="lg"
                onClick={playSong}
                className="max-w-xs"
                disabled={isPlaying}
              >
                {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
                <Play className="mr-2" />
              </AppButton>
            )}
            
            {isPlaying && !showYouTubeEmbed && (
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute w-full h-full">
                  <MusicNote 
                    type="note1" 
                    className="absolute top-0 right-0 text-primary animate-float" 
                    size={32} 
                  />
                  <MusicNote 
                    type="note2" 
                    className="absolute top-10 left-0 text-secondary animate-float-alt" 
                    size={28} 
                  />
                  <MusicNote 
                    type="note3" 
                    className="absolute bottom-10 right-10 text-accent animate-float" 
                    size={36} 
                  />
                </div>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Music className="w-10 h-10 text-primary" />
                </div>
              </div>
            )}
            
            {!isHost && (
              <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להשמיע את השיר הבא
              </div>
            )}
          </div>
        );
      
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center">
                <Clock className="mr-2 text-primary" />
                <span className="font-bold">{timeLeft} שניות</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
                <SkipForward className="ml-2 text-secondary" />
              </div>
            </div>
            
            <Progress value={(timeLeft / 15) * 100} className="w-full h-2" />
            
            <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
            
            {currentRound ? (
              <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {currentRound.options.map((song, index) => (
                  <AppButton
                    key={index}
                    variant={selectedAnswer === index ? "primary" : "secondary"}
                    className={selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""}
                    disabled={currentPlayer.hasAnswered}
                    onClick={() => handleAnswer(index)}
                  >
                    {song.name}
                  </AppButton>
                ))}
              </div>
            ) : (
              <div className="text-lg text-gray-600 animate-pulse">
                טוען אפשרויות...
              </div>
            )}
            
            <AppButton
              variant="secondary"
              className="mt-4 max-w-xs"
              disabled={currentPlayer.hasAnswered || currentPlayer.skipsLeft <= 0}
              onClick={handleSkip}
            >
              דלג ({currentPlayer.skipsLeft})
              <SkipForward className="mr-2" />
            </AppButton>
            
            {currentPlayer.hasAnswered && (
              <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
                המתן לסיום השלב...
              </div>
            )}
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
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore}</span>
                  <span>נקודות</span>
                </div>
                
                {currentPlayer.lastAnswer && (
                  <div className="text-lg">
                    {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
                  </div>
                )}
                
                {!currentPlayer.lastAnswerCorrect && currentRound && (
                  <div className="text-lg">
                    תשובה נכונה: {currentRound.correctSong.name}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-secondary text-center">
                  דילגת על השאלה
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xl">
                  <span>קיבלת</span>
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore}</span>
                  <span>נקודות</span>
                </div>
                
                <div className="text-lg">
                  נותרו לך {currentPlayer.skipsLeft} דילוגים
                </div>
              </>
            )}
            
            <div className="text-gray-500 animate-pulse">
              עובר ללוח התוצאות...
            </div>
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="flex items-center gap-2">
              <Trophy className="text-secondary" />
              <h2 className="text-2xl font-bold text-primary">טבלת מובילים</h2>
              <Trophy className="text-secondary" />
            </div>
            
            <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>שחקן</TableHead>
                    <TableHead className="text-right">נקודות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id} className={player.name === playerName ? 'bg-primary/10' : ''}>
                      <TableCell className="text-center font-medium">
                        {index === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> : index + 1}
                      </TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell className="text-right font-bold">{player.score}</TableCell>
                    </TableRow>
                  ))}
                  {players.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        טוען שחקנים...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {isHost && (
              <div className="w-full flex flex-col items-center gap-4 max-w-xs">
                <AppButton 
                  variant="primary" 
                  onClick={nextRound}
                  size="lg"
                >
                  המשך לשיר הבא
                </AppButton>
                
                <AppButton 
                  variant="secondary"
                  onClick={playFullSong}
                >
                  השמע את כל השיר
                </AppButton>
              </div>
            )}
            
            {!isHost && (
              <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להמשיך לשיר הבא
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote 
          type="note1" 
          className="absolute top-[10%] right-[15%] opacity-20" 
          size={36} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note4" 
          className="absolute bottom-[15%] left-[15%] opacity-20" 
          size={32} 
          animation="float-alt"
          color="#FFC22A"
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
              {isHost ? 'מסך מנהל המשחק' : 'מסך משחק'}
            </h2>
            
            <div className="absolute top-0 right-0">
              <EndGameButton />
            </div>
          </div>

          <div className="w-full bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md mb-4">
            {renderPhase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
