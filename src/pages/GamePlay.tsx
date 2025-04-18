import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy, CheckCircle2, Youtube } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import EndGameButton from '@/components/EndGameButton';
import ExitGameButton from '@/components/ExitGameButton';
import { usePlayerManagement } from '@/hooks/usePlayerManagement';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';

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
  isReady: boolean;
  lastAnswer?: string;
  lastAnswerCorrect?: boolean;
  pendingAnswer?: number | null;
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
  hasAnswered: boolean;
  isReady: boolean;
}
interface PendingAnswerUpdate {
  player_name: string;
  selectedAnswer: number | null;
  is_correct: boolean;
  points: number;
}

const songs: Song[] = [{
  name: "עתיד מתוק - משינה",
  embedUrl: "https://www.youtube.com/embed/_3OOrrGxJ1M?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=_3OOrrGxJ1M"
}, {
  name: "ריקוד המכונה - משינה",
  embedUrl: "https://www.youtube.com/embed/U0THoV7yTeA?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=U0THoV7yTeA"
}, {
  name: "אהובתי - משינה",
  embedUrl: "https://www.youtube.com/embed/GgNFq1sSz5s?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=GgNFq1sSz5s"
}, {
  name: "אחכה לך בשדות - משינה",
  embedUrl: "https://www.youtube.com/embed/aEWr8V-w9yc?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=aEWr8V-w9yc"
}, {
  name: "אין מקום אחר - משינה",
  embedUrl: "https://www.youtube.com/embed/PVAD3KWgQrQ?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=PVAD3KWgQrQ"
}, {
  name: "אנה - משינה",
  embedUrl: "https://www.youtube.com/embed/35J7emcpOio?autoplay=1&controls=0&modestbranding=1&rel=0",
  fullUrl: "https://www.youtube.com/watch?v=35J7emcpOio"
}];

const GamePlay: React.FC = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    gameCode,
    playerName,
    isHost,
    gamePhase: serverGamePhase,
    setGamePhase,
    setHostReady,
    clearGameData
  } = useGameState();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeLeft, setTimeLeft] = useState(21);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showAnswerConfirmation, setShowAnswerConfirmation] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswerUpdate[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    name: playerName || "שחקן נוכחי",
    score: 0,
    skipsLeft: 3,
    hasAnswered: false,
    isReady: false,
    pendingAnswer: null
  });
  const {
    players,
    updatePlayer
  } = usePlayerManagement({
    gameCode: gameCode || '',
    playerName,
    setHostJoined: () => {},
    setStartGameDisabled: () => {}
  });
  const {
    updateGameState
  } = useGameStateSubscription({
    gameCode,
    isHost,
    setGamePhase,
    setHostReady,
    clearGameData,
    navigate
  });

  const checkAllPlayersAnswered = useCallback(async () => {
    if (!gameCode) return false;
    const {
      data
    } = await supabase.from('players').select('hasAnswered').eq('game_code', gameCode);
    if (!data) return false;
    return data.every(player => player.hasAnswered === true);
  }, [gameCode]);

  const checkAllPlayersReady = useCallback(async () => {
    if (!gameCode) return false;
    const {
      data
    } = await supabase.from('players').select('isReady').eq('game_code', gameCode);
    if (!data) return false;
    return data.every(player => player.isReady === true);
  }, [gameCode]);

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
        setTimerActive(false);
        setSelectedAnswer(null);
        setCurrentPlayer(prev => ({
          ...prev,
          hasAnswered: false,
          lastAnswer: undefined,
          lastAnswerCorrect: undefined,
          pendingAnswer: null
        }));
        break;
      case 'answering':
        setPhase('answerOptions');
        setSelectedAnswer(null);
        setTimeLeft(21);
        setTimerActive(false);
        startTimer();
        break;
      case 'results':
        setPhase('scoringFeedback');
        setTimerActive(false);
        setTimeout(() => {
          setPhase('leaderboard');
        }, 1500);
        break;
      case 'end':
        setPhase('leaderboard');
        setTimerActive(false);
        break;
    }
  }, [serverGamePhase, timerActive]);

  useEffect(() => {
    if (!gameCode || phase !== 'answerOptions' || !timerActive) return;
    const interval = setInterval(async () => {
      const allAnswered = await checkAllPlayersAnswered();
      if (allAnswered) {
        setAllPlayersAnswered(true);
        clearInterval(interval);
        if (isHost) {
          updateGameState({
            game_phase: 'results'
          });
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [gameCode, phase, timerActive, checkAllPlayersAnswered, isHost, updateGameState]);

  useEffect(() => {
    if (!gameCode) return;
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const fetchPlayers = async () => {
      try {
        console.log(`Fetching players for game ${gameCode}, attempt ${retryCount + 1}`);
        const {
          data,
          error
        } = await supabase.from('players').select('*').eq('game_code', gameCode).order('score', {
          ascending: false
        });
        if (error) {
          console.error('Error fetching players:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying fetch players (${retryCount}/${maxRetries})...`);
            setTimeout(fetchPlayers, 2000); // Retry after 2 seconds
          } else {
            toast({
              title: "שגיאה בטעינת השחקנים",
              description: "אירעה שגיאה בטעינת רשימת השחקנים",
              variant: "destructive"
            });
          }
          return;
        }
        if (data && isMounted) {
          console.log('Fetched players:', data);
          if (playerName) {
            const currentPlayerData = data.find(p => p.name === playerName);
            if (currentPlayerData) {
              console.log('Found current player in database:', currentPlayerData);
              setCurrentPlayer(prev => ({
                ...prev,
                name: currentPlayerData.name,
                score: currentPlayerData.score || 0,
                hasAnswered: currentPlayerData.hasAnswered || false,
                isReady: currentPlayerData.isReady || false
              }));
            } else {
              console.log('Current player not found in database. Player name:', playerName);
            }
          }
        }
      } catch (err) {
        console.error('Exception when fetching players:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchPlayers, 2000); // Retry after 2 seconds
        }
      }
    };
    fetchPlayers();
    return () => {
      console.log('Cleaning up players effect in GamePlay');
      isMounted = false;
    };
  }, [gameCode, toast, playerName]);

  useEffect(() => {
    if (!gameCode) return;
    const fetchGameRoundData = async () => {
      const {
        data,
        error
      } = await supabase.from('game_state').select('current_song_name, current_song_url').eq('game_code', gameCode).maybeSingle();
      if (error) {
        console.error('Error fetching game round data:', error);
        return;
      }
      if (data && data.current_song_name) {
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
    return () => {};
  }, [gameCode]);

  const createGameRound = () => {
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
  };

  useEffect(() => {
    if (showYouTubeEmbed) {
      const timer = setTimeout(() => {
        setShowYouTubeEmbed(false);
        setIsPlaying(false);
        if (isHost) {
          updateGameState({
            game_phase: 'answering'
          });
        }
        setPhase('answerOptions');
        startTimer();
        setTimerActive(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showYouTubeEmbed, isHost, updateGameState]);

  const startTimer = () => {
    if (timerActive) {
      console.log('Clearing existing timer before starting a new one');
      setTimerActive(false);
      setTimeLeft(21);
      return;
    }
    setTimeLeft(21);
    setTimerActive(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          if (selectedAnswer === null && !currentPlayer.hasAnswered) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      console.log('Clearing timer in cleanup function');
      clearInterval(timer);
    };
  };

  const submitAllAnswers = async () => {
    console.log('Timer ended, submitting all answers');
    if (!currentRound || !gameCode) {
      console.error('Missing current round data or game code');
      return;
    }
    const pendingUpdates: PendingAnswerUpdate[] = [];
    if (playerName && selectedAnswer !== null) {
      const isCorrect = selectedAnswer === currentRound.correctAnswerIndex;
      const points = isCorrect ? 10 : 0;
      pendingUpdates.push({
        player_name: playerName,
        selectedAnswer: selectedAnswer,
        is_correct: isCorrect,
        points
      });
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswer: currentRound.options[selectedAnswer].name,
        lastAnswerCorrect: isCorrect,
        lastScore: points,
        score: prev.score + points
      }));
    }
    setPendingAnswers(pendingUpdates);
    if (isHost) {
      updateGameState({
        game_phase: 'results'
      });
    }
    setPhase('scoringFeedback');
  };

  const handleAnswer = async index => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered || !currentRound || !gameCode || !playerName) {
      console.log("Already answered or missing round data - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected answer: ${index}`);
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    const points = isCorrect ? 10 : 0;
    const newScore = currentPlayer.score + points;
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[index].name,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: index,
      score: newScore
    }));
    setShowAnswerConfirmation(true);
    const player = players.find(p => p.name === playerName);
    if (player) {
      try {
        await updatePlayer(player.id, {
          hasAnswered: true,
          score: newScore
        });
        console.log(`Successfully marked ${playerName} as having answered and updated score`);
      } catch (err) {
        console.error('Exception when updating player answer status:', err);
      }
    }
    setTimeout(() => {
      setShowAnswerConfirmation(false);
    }, 2000);
    toast({
      title: isCorrect ? "כל הכבוד!" : "אופס!",
      description: isCorrect ? "בחרת בתשובה הנכונה!" : "התשובה שגויה, נסה בפעם הבאה"
    });
    if (timeLeft <= 0) {
      submitAllAnswers();
    }
    const allAnswered = await checkAllPlayersAnswered();
    if (allAnswered) {
      setAllPlayersAnswered(true);
      if (isHost) {
        updateGameState({
          game_phase: 'results'
        });
      }
    }
  };

  const handleSkip = async () => {
    if (selectedAnswer !== null || currentPlayer.skipsLeft <= 0 || !currentRound) return;
    setSelectedAnswer(null);
    setCurrentPlayer(prev => ({
      ...prev,
      skipsLeft: prev.skipsLeft - 1
    }));
    toast({
      title: "דילגת על השאלה",
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילוגים`
    });
  };

  const handleTimeout = async () => {
    console.log('Timeout reached without selection');
    if (selectedAnswer !== null || currentPlayer.hasAnswered) {
      console.log('Player already answered, skipping timeout handler');
      return;
    }
    if (playerName && gameCode) {
      const {
        data
      } = await supabase.from('players').select('hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
      if (data && data.hasAnswered) {
        console.log(`Player ${playerName} already marked as answered, skipping timeout update`);
        return;
      }
      toast({
        title: "אוי! נגמר הזמן",
        description: "לא הספקת לענות בזמן",
        variant: "destructive"
      });
    }
    setPhase('scoringFeedback');
    setTimeout(() => {
      setPhase('leaderboard');
    }, 1500);
    if (isHost) {
      updateGameState({
        game_phase: 'results'
      });
    }
  };

  const resetPlayersAnsweredStatus = async () => {
    if (!isHost || !gameCode) return;
    const {
      error
    } = await supabase.from('players').update({
      hasAnswered: false
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players answered status:', error);
      toast({
        title: "שגיאה באיפוס סטטוס השחקנים",
        description: "אירעה שגיאה באיפוס סטטוס השחקנים",
        variant: "destructive"
      });
    }
  };

  const resetPlayersReadyStatus = async () => {
    if (!isHost || !gameCode) return;
    const {
      error
    } = await supabase.from('players').update({
      isReady: false
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players ready status:', error);
      toast({
        title: "שגיאה באיפוס סטטוס מוכנות השחקנים",
        description: "אירעה שגיאה באיפוס סטטוס השחקנים",
        variant: "destructive"
      });
    }
  };

  const markPlayerReady = async () => {
    if (!gameCode || !playerName) return;
    setPlayerReady(true);
    const {
      error
    } = await supabase.from('players').update({
      isReady: true
    }).eq('game_code', gameCode).eq('name', playerName);
    if (error) {
      console.error('Error marking player as ready:', error);
      setPlayerReady(false);
      toast({
        title: "שגיאה בסימון מוכנות",
        description: "אירעה שגיאה בסימון המוכנות שלך",
        variant: "destructive"
      });
    }
  };

  const nextRound = async () => {
    if (!isHost) return;
    await resetPlayersAnsweredStatus();
    setSelectedAnswer(null);
    setTimerActive(false);
    setTimeLeft(21);
    setPlayerReady(false);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      isReady: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined,
      pendingAnswer: null
    }));
    updateGameState({
      game_phase: 'playing'
    });
    setPhase('songPlayback');
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: "סיבוב חדש עומד להתחיל"
    });
  };

  const playSong = async () => {
    if (!isHost) return;
    await resetPlayersReadyStatus();
    await resetPlayersAnsweredStatus();
    const gameRound = createGameRound();
    setCurrentRound(gameRound);
    setCurrentSong(gameRound.correctSong);
    setSelectedAnswer(null);
    setIsPlaying(true);
    setShowYouTubeEmbed(true);
    setAllPlayersAnswered(false);
    setTimerActive(false);
    setTimeLeft(21);
    const roundDataString = JSON.stringify(gameRound);
    const {
      error
    } = await supabase.from('game_state').update({
      current_song_name: roundDataString,
      current_song_url: gameRound.correctSong.embedUrl,
      game_phase: 'playing'
    }).eq('game_code', gameCode);
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
      description: "מנגן כעת, האזן בקשב"
    });
  };

  const playFullSong = () => {
    if (!isHost || !currentRound) return;
    toast({
      title: "משמיע את השיר המלא",
      description: "השיר המלא מתנגן כעת"
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
                <iframe width="100%" height="100%" src={currentSong.embedUrl} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen className="absolute top-0 left-0 z-10"></iframe>
                <div className="absolute top-0 left-0 w-full h-full z-20 bg-black" style={{
                  opacity: 0.95
                }}></div>
              </div>
            )}
            {isHost && (
              <AppButton variant="primary" size="lg" onClick={playSong} className="max-w-xs" disabled={isPlaying}>
                {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
                <Play className="mr-2" />
              </AppButton>
            )}
            {isPlaying && !showYouTubeEmbed && (
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute w-full h-full">
                  <MusicNote type="note1" className="absolute top-0 right-0 text-primary animate-float" size={32} />
                  <MusicNote type="note2" className="absolute top-10 left-0 text-secondary animate-float-alt" size={28} />
                  <MusicNote type="note3" className="absolute bottom-10 right-10 text-accent animate-float" size={36} />
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
            <Progress value={timeLeft / 21 * 100} className="w-full h-2" />
            <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
            {currentRound ? <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {currentRound.options.map((song, index) => <div key={index} className="relative">
                    <AppButton variant={selectedAnswer === index ? "primary" : "secondary"} className={`${selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""} w-full`} disabled={selectedAnswer !== null} onClick={() => handleAnswer(index)}>
                      {song.name}
                    </AppButton>
                    {selectedAnswer === index && showAnswerConfirmation && <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 text-white px-2 py-1 rounded-md animate-fade-in">
                        ✓ הבחירה שלך נקלטה!
                      </div>}
                  </div>)}
              </div> : <div className="text-lg text-gray-600 animate-pulse">
                טוען אפשרויות...
              </div>}
            <AppButton variant="secondary" className="mt-4 max-w-xs" disabled={selectedAnswer !== null || currentPlayer.skipsLeft <= 0} onClick={handleSkip}>
              דלג ({currentPlayer.skipsLeft})
              <SkipForward className="mr-2" />
            </AppButton>
            {selectedAnswer !== null && <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
                הבחירה שלך נקלטה! ממתין לסיום הזמן...
              </div>}
          </div>
        );
      case 'scoringFeedback':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {currentPlayer.lastAnswerCorrect !== undefined ? <>
                <div className={`text-3xl font-bold ${currentPlayer.lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
                  {currentPlayer.lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
                </div>
                <div className="flex items-center justify-center gap-2 text-xl">
                  <span>קיבלת</span>
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
                  <span>נקודות</span>
                </div>
                {currentPlayer.lastAnswer && <div className="text-lg">
                    {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
                  </div>}
                {!currentPlayer.lastAnswerCorrect && currentRound && <div className="text-lg font-semibold text-green-500">
                    תשובה נכונה: {currentRound.correctSong.name}
                  </div>}
              </> : <>
                <div className="text-2xl font-bold text-secondary text-center">
                  דילגת על השאלה
                </div>
                <div className="flex items-center justify-center gap-2 text-xl">
                  <span>קיבלת</span>
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
                  <span>נקודות</span>
                </div>
                {currentRound && <div className="text-lg font-semibold text-green-500">
                    התשובה הנכונה הייתה: {currentRound.correctSong.name}
                  </div>}
                <div className="text-lg">
                  נותרו לך {currentPlayer.skipsLeft} דילוגים
                </div>
              </>}
            <div className="bg-gray-100 p-4 rounded-lg text-center animate-pulse">
              עובר ללוח התוצאות בקרוב...
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">לוח תוצאות</h2>
            <div className="w-full max-w-md bg-white/90 rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">#</TableHead>
                    <TableHead>שחקן</TableHead>
                    <TableHead className="text-right">ניקוד</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id} className={player.name === playerName ? "bg-primary/10" : ""}>
                      <TableCell className="font-medium text-center">
                        {index === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> : <span>{index + 1}</span>}
                      </TableCell>
                      <TableCell className="font-bold">{player.name}</TableCell>
                      <TableCell className="text-right">{player.score || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
              {isHost && (
                <AppButton 
                  variant="primary" 
                  className="flex-1" 
                  onClick={nextRound}
                >
                  סיבוב הבא
                  <Play className="mr-2" />
                </AppButton>
              )}
              
              {isHost && currentRound && (
                <AppButton 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={playFullSong}
                >
                  השמע שיר מלא
                  <Youtube className="mr-2" />
                </AppButton>
              )}
              
              {!isHost && (
                <AppButton 
                  variant="primary" 
                  className="flex-1" 
                  onClick={markPlayerReady}
                  disabled={playerReady}
                >
                  {playerReady ? "מוכן לסיבוב הבא" : "מוכן לסיבוב הבא"}
                  <CheckCircle2 className="mr-2" />
                </AppButton>
              )}
            </div>
            
            <div className="w-full max-w-md flex justify-between mt-4">
              {isHost ? (
                <EndGameButton gameCode={gameCode} />
              ) : (
                <ExitGameButton />
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">משחק השירים</h1>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{currentPlayer.name}</span>
          <span className="bg-primary text-white px-3 py-1 rounded-full">{currentPlayer.score} נקודות</span>
        </div>
      </header>

      <main>
        {renderPhase()}
      </main>
    </div>
  );
};

export default GamePlay;
