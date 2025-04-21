import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import GameTimer from '@/components/GameTimer';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy, CheckCircle2, Youtube } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import EndGameButton from '@/components/EndGameButton';
import { defaultSongBank, Song } from '@/data/songBank';
import SongPlayer from '@/components/SongPlayer';
import LeaveGameButton from '@/components/LeaveGameButton';
import GameHostControls from '@/components/GameHostControls';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import TriviaQuestion from '@/components/TriviaQuestion';
import { triviaQuestions } from '@/data/triviaQuestions';
import { mashinaSongs } from "@/data/songs/mashina";
import { adamSongs } from "@/data/songs/adam";

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
  pointsAwarded?: boolean;
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
  is_correct: boolean;
  points: number;
}

const GamePlay: React.FC = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    gameCode,
    playerName,
    isHost,
    gamePhase: serverGamePhase,
    answerTimeLimit,
    gameSettings
  } = useGameState();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeLeft, setTimeLeft] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showAnswerConfirmation, setShowAnswerConfirmation] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswerUpdate[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    name: playerName || "שחקן נוכחי",
    score: 0,
    skipsLeft: 3,
    hasAnswered: false,
    isReady: false,
    pendingAnswer: null,
    pointsAwarded: false
  });
  const [roundCounter, setRoundCounter] = useState<number>(1);
  const [isTriviaRound, setIsTriviaRound] = useState<boolean>(false);
  const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<TriviaQuestionType | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const [answeredEarly, setAnsweredEarly] = useState(false);
  
  const [phaseTimerActive, setPhaseTimerActive] = useState(false);
  
  const getTimerDurationForPhase = (phase: GamePhase): number => {
    switch (phase) {
      case 'songPlayback':
        return 9.5;
      case 'answerOptions':
        return 8.0;
      case 'scoringFeedback':
        return 9.0;
      case 'leaderboard':
        return 0;
      default:
        return 0;
    }
  };
  
  const handlePhaseTimeout = () => {
    console.log(`Phase timer ended for ${phase} phase`);
    
    switch (phase) {
      case 'songPlayback':
        handleSongPlaybackEnded();
        break;
      case 'answerOptions':
        if (!currentPlayer.hasAnswered) {
          console.log("Timer ended for answer options - showing 50-50 phase");
          setTimeLeft(0); // Just mark the time as up, don't change phase yet
          // We don't call submitAllAnswers here to allow the 50-50 phase to show
        } else {
          submitAllAnswers();
        }
        break;
      case 'scoringFeedback':
        setPhase('leaderboard');
        break;
      default:
        break;
    }
    
    setPhaseTimerActive(false);
  };
  
  useEffect(() => {
    if (phase === 'leaderboard') return;
    
    const duration = getTimerDurationForPhase(phase);
    if (duration > 0) {
      console.log(`Starting phase timer for ${phase} with duration ${duration} seconds`);
      setPhaseTimerActive(true);
    }
    
  }, [phase]);

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
    return () => {
      if (timerRef.current) {
        console.log('Cleaning up timer on component unmount');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!serverGamePhase) return;
    setTimerActive(false);
    switch (serverGamePhase) {
      case 'playing':
        setPhase('songPlayback');
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
        if (!isHost) {
          setTimerActive(true);
        }
        break;
      case 'results':
        setPhase('scoringFeedback');
        break;
      case 'end':
        setPhase('leaderboard');
        break;
    }
  }, [serverGamePhase, isHost]);

  useEffect(() => {
    if (!gameCode || phase !== 'answerOptions' || !timerActive) return;
    const interval = setInterval(async () => {
      const allAnswered = await checkAllPlayersAnswered();
      if (allAnswered) {
        setAllPlayersAnswered(true);
        clearInterval(interval);
        if (isHost) {
          updateGameState('results');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameCode, phase, timerActive, checkAllPlayersAnswered, isHost]);

  useEffect(() => {
    if (!gameCode) return;
    const fetchPlayers = async () => {
      const {
        data,
        error
      } = await supabase.from('players').select('*').eq('game_code', gameCode).order('score', {
        ascending: false
      });
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
    };
    fetchPlayers();
    const channel = supabase.channel('players-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `game_code=eq.${gameCode}`
    }, payload => {
      console.log('Players table changed:', payload);
      fetchPlayers();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
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
    const gameStateChannel = supabase.channel('game-state-changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_state',
      filter: `game_code=eq.${gameCode}`
    }, payload => {
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
    }).subscribe();
    return () => {
      supabase.removeChannel(gameStateChannel);
    };
  }, [gameCode]);

  const updateGameState = async (phase: string) => {
    if (!isHost || !gameCode) return;
    const {
      error
    } = await supabase.from('game_state').update({
      game_phase: phase
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error updating game state:', error);
      toast({
        title: "שגיאה בעדכון מצב המשחק",
        description: "אירעה שגיאה בעדכון מצב המשחק",
        variant: "destructive"
      });
    }
  };

  const getFilteredSongs = () => {
    if (gameSettings?.songFilter === "mashina") {
      return mashinaSongs;
    }
    if (gameSettings?.songFilter === "adam") {
      return adamSongs;
    }
    return defaultSongBank;
  };

  const createGameRound = () => {
    const songList = getFilteredSongs().filter(song => song.embedUrl || song.spotifyUrl);
    const randomIndex = Math.floor(Math.random() * songList.length);
    const correctSong = songList[randomIndex];
    const otherSongs = songList.filter(song => song.id !== correctSong.id && song.title);
    const shuffledWrongSongs = [...otherSongs].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [correctSong, ...shuffledWrongSongs];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    const correctSongTitle = correctSong.title || '';
    const correctIndex = shuffledOptions.findIndex(song => song.title === correctSongTitle);
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
          updateGameState('results');
        }
        setPhase('scoringFeedback');
        if (!isHost) {
          console.log('Setting timer active after YouTube embed finishes (non-host)');
          setTimerActive(true);
        }
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [showYouTubeEmbed, isHost]);

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
    gameStartTimeRef.current = Date.now();
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

  const handleAnswer = (isCorrect: boolean, selectedIndex: number) => {
    if (currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log("Already answered or points already awarded - ignoring selection");
      return;
    }
    
    console.log(`Player ${playerName} selected answer: ${selectedIndex}, correct: ${isCorrect}`);
    const currentTime = Date.now();
    const timeSinceStart = (currentTime - (gameStartTimeRef.current || Date.now())) / 1000;
    
    if (timeSinceStart <= 12) {
      setAnsweredEarly(true);
    }
    
    let points = 0;
    const isFinalPhase = timeSinceStart > 8;
    
    if (isFinalPhase) {
      points = isCorrect ? 4 : -2;
    } else {
      if (timeSinceStart <= 3) {
        points = 13;
      } else if (timeSinceStart <= 8) {
        points = Math.max(13 - Math.floor(timeSinceStart - 2), 5);
      }
    }
    
    setSelectedAnswer(selectedIndex);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: prev.score + points,
      pointsAwarded: true
    }));
    
    setShowAnswerConfirmation(true);
    
    // Update the player's score in the database
    if (gameCode && playerName) {
      (async () => {
        try {
          const { error } = await supabase
            .from('players')
            .update({
              hasAnswered: true,
              score: currentPlayer.score + points
            })
            .eq('game_code', gameCode)
            .eq('name', playerName);
          
          if (error) {
            throw error;
          }
          console.log("Score updated successfully");
        } catch (err) {
          console.error('Error updating player score after answer:', err);
        }
      })();
    }
    
    toast({
      title: isCorrect ? "כל הכבוד!" : "אופס!",
      description: isCorrect ? "תשובה נכונה!\" : \"התשובה שגויה"
    });
  };

  const resetPlayersReadyStatus = async () => {
    if (!gameCode) return;
    const {
      error
    } = await supabase.from('players').update({
      isReady: false
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players ready status:', error);
      toast({
        title: "שגיאה באיפוס מצב השחקנים",
        description: "אירעה שגיאה באיפוס מצב השחקנים",
        variant: "destructive"
      });
    }
  };

  const resetPlayersAnsweredStatus = async () => {
    if (!gameCode) return;
    const {
      error
    } = await supabase.from('players').update({
      hasAnswered: false
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players answered status:', error);
      toast({
        title: "שגיאה באיפוס מצב השחקנים",
        description: "אירעה שגיאה באיפוס מצב השחקנים",
        variant: "destructive"
      });
    }
  };

  const resetAllPlayerScores = async () => {
    if (!gameCode) return;
    const {
      error
    } = await supabase.from('players').update({
      score: 0
    }).eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players scores:', error);
      toast({
        title: "שגיאה באיפוס ניקוד השחקנים",
        description: "אירעה שגיאה באיפוס ניקוד השחקנים",
        variant: "destructive"
      });
    }
  };

  const handleSkip = async () => {
    if (currentPlayer.skipsLeft <= 0 || currentPlayer.hasAnswered) return;
    const newSkipsLeft = currentPlayer.skipsLeft - 1;
    setCurrentPlayer(prev => ({
      ...prev,
      skipsLeft: newSkipsLeft,
      hasAnswered: true
    }));
    if (gameCode && playerName) {
      const {
        error
      } = await supabase.from('players').update({
        hasAnswered: true
      }).eq('game_code', gameCode).eq('name', playerName);
      if (error) {
        console.error('Error updating player skip status:', error);
      }
    }
    toast({
      title: "דילגת על השאלה",
      description: `נותרו לך ${newSkipsLeft} דילוגים`,
      duration: 3000
    });
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
  };

  const handleTimeout = async () => {
    console.log('Handling final timeout after 50-50 phase - no answer submitted');
    if (currentPlayer.hasAnswered) {
      console.log('Player already answered - ignoring timeout');
      return;
    }
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: undefined,
      lastAnswerCorrect: false,
      lastScore: 0,
      pointsAwarded: true
    }));
    if (gameCode && playerName) {
      try {
        const { error } = await supabase
          .from('players')
          .update({
            hasAnswered: true
          })
          .eq('game_code', gameCode)
          .eq('name', playerName);
          
        if (error) {
          console.error('Error updating player timeout status:', error);
        }
      } catch (err) {
        console.error('Exception when updating player timeout status:', err);
      }
    }
    toast({
      title: "הזמן נגמר!",
      description: "לא הספקת לענות בזמן",
      duration: 3000
    });
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
  };

  const nextRound = async () => {
    setRoundCounter(prev => prev + 1);
    setIsTriviaRound(roundCounter % 3 === 0);
    if (roundCounter % 3 === 0) {
      const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
      setCurrentTriviaQuestion(triviaQuestions[randomIndex]);
    } else {
      setCurrentTriviaQuestion(null);
    }
    await playSong();
  };

  const playFullSong = () => {
    if (currentRound && currentRound.correctSong.fullUrl) {
      window.open(currentRound.correctSong.fullUrl, '_blank');
    } else {
      toast({
        title: "שגיאה בהשמעת השיר המלא",
        description: "לא נמצא קישור לשיר המלא",
        variant: "destructive"
      });
    }
  };

  const handleTriviaAnswer = (isCorrect: boolean, selectedIndex: number) => {
    if (currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log("Already answered or points already awarded - ignoring trivia selection");
      return;
    }
    
    console.log(`Player ${playerName} selected trivia answer: ${selectedIndex}, correct: ${isCorrect}`);
    const currentTime = Date.now();
    const timeSinceStart = (currentTime - (gameStartTimeRef.current || Date.now())) / 1000;
    
    if (timeSinceStart <= 12) {
      setAnsweredEarly(true);
    }
    
    let points = 0;
    const isFinalPhase = timeSinceStart > 8;
    
    if (isFinalPhase) {
      points = isCorrect ? 4 : -2;
    } else {
      if (timeSinceStart <= 3) {
        points = 13;
      } else if (timeSinceStart <= 8) {
        points = Math.max(13 - Math.floor(timeSinceStart - 2), 5);
      }
    }
    
    setSelectedAnswer(selectedIndex);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: prev.score + points,
      pointsAwarded: true
    }));
    
    setShowAnswerConfirmation(true);
    
    // Update the player's score in the database
    if (gameCode && playerName) {
      (async () => {
        try {
          const { error } = await supabase
            .from('players')
            .update({
              hasAnswered: true,
              score: currentPlayer.score + points
            })
            .eq('game_code', gameCode)
            .eq('name', playerName);
          
          if (error) {
            throw error;
          }
          console.log("Trivia score updated successfully");
        } catch (err) {
          console.error('Error updating player score after trivia answer:', err);
        }
      })();
    }
    
    toast({
      title: isCorrect ? "כל הכבוד!" : "אופס!",
      description: isCorrect ? "תשובה נכונה!" : "התשובה שגויה"
    });
  };

  const submitAllAnswers = async () => {
    console.log('Timer ended, submitting all answers');
    if (!currentRound || !gameCode) {
      console.error('Missing current round data or game code');
      return;
    }
    
    // Check if all players have answered and proceed to results phase
    const allAnswered = await checkAllPlayersAnswered();
    if (allAnswered || isHost) {
      console.log('All players have answered or host is forcing results');
      updateGameState('results');
    }
    
    // Calculate and update player scores if not already done
    if (!currentPlayer.pointsAwarded && playerName && selectedAnswer !== null) {
      const isCorrect = selectedAnswer === currentRound.correctAnswerIndex;
      let points = isCorrect ? 4 : -2; // Basic points for final phase
      
      setCurrentPlayer(prev => ({
        ...prev,
        lastAnswerCorrect: isCorrect,
        lastScore: points,
        score: prev.score + points,
        pointsAwarded: true
      }));
      
      // Update the player's score in the database
      if (gameCode) {
        try {
          const { error } = await supabase
            .from('players')
            .update({
              score: currentPlayer.score + points
            })
            .eq('game_code', gameCode)
            .eq('name', playerName);
          
          if (error) {
            console.error('Error updating player score during submitAllAnswers:', error);
          } else {
            console.log('Score updated during bulk submission');
          }
        } catch (err) {
          console.error('Exception during submission score update:', err);
        }
      }
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            {phaseTimerActive && (
              <div className="mb-4 w-full flex justify-center">
                <GameTimer 
                  initialSeconds={getTimerDurationForPhase('songPlayback')}
                  isActive={phaseTimerActive}
                  onTimeout={handlePhaseTimeout}
                />
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-6 text-center">האזינו לשיר</h2>
            <div className="w-full p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
              <SongPlayer
                song={currentSong}
                isPlaying={isPlaying}
                onPlaybackEnded={handleSongPlaybackEnded}
                onPlaybackError={handleSongPlaybackError}
              />
              <div className="text-center mt-6">
                <h3 className="text-xl font-semibold">מה השיר?</h3>
              </div>
            </div>
            
            {currentRound && (
              <div className="mt-6 w-full">
                <TriviaQuestion
                  question={{
                    question: "מה השיר?",
                    options: currentRound.options.map(s => s.title || ""),
                    correctAnswerIndex: currentRound.correctAnswerIndex
                  }}
                  onAnswer={(isCorrect, selectedIndex) => 
                    handleAnswer(isCorrect, selectedIndex)
                  }
                  timeUp={!phaseTimerActive}
                  showOptions={true}
                  isFinalPhase={false}
                  hasAnsweredEarly={answeredEarly}
                />
                
                {!currentPlayer.hasAnswered && currentPlayer.skipsLeft > 0 && (
                  <AppButton 
                    variant="outline" 
                    className="mt-4" 
                    onClick={handleSkip}
                  >
                    דלג ({currentPlayer.skipsLeft} נותרו) <SkipForward className="mr-2 h-4 w-4" />
                  </AppButton>
                )}
              </div>
            )}
          </div>
        );
        
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            {phaseTimerActive && (
              <div className="mb-4 w-full flex justify-center">
                <GameTimer 
                  initialSeconds={getTimerDurationForPhase('answerOptions')}
                  isActive={phaseTimerActive} 
                  onTimeout={handlePhaseTimeout}
                />
              </div>
            )}
            
            {isTriviaRound && currentTriviaQuestion ? (
              <TriviaQuestion
                question={currentTriviaQuestion}
                onAnswer={handleTriviaAnswer}
                timeUp={!phaseTimerActive}
                showOptions={true}
                isFinalPhase={true}
                hasAnsweredEarly={answeredEarly}
                onTimeUp={handleTimeout}
              />
            ) : currentRound && (
              <TriviaQuestion
                question={{
                  question: "מה השיר?",
                  options: currentRound.options.map(s => s.title || ""),
                  correctAnswerIndex: currentRound.correctAnswerIndex
                }}
                onAnswer={(isCorrect, selectedIndex) => 
                  handleAnswer(isCorrect, selectedIndex)
                }
                timeUp={!phaseTimerActive}
                showOptions={true}
                isFinalPhase={true}
                hasAnsweredEarly={answeredEarly}
                onTimeUp={handleTimeout}
              />
            )}
            
            {!currentPlayer.hasAnswered && currentPlayer.skipsLeft > 0 && (
              <AppButton 
                variant="outline" 
                className="mt-4" 
                onClick={handleSkip}
              >
                דלג ({currentPlayer.skipsLeft} נותרו) <SkipForward className="mr-2 h-4 w-4" />
              </AppButton>
            )}
            
            {showAnswerConfirmation && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-center">תשובה נשלחה!</p>
              </div>
            )}
          </div>
        );
        
      case 'scoringFeedback':
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            {phaseTimerActive && (
              <div className="mb-4 w-full flex justify-center">
                <GameTimer 
                  initialSeconds={getTimerDurationForPhase('scoringFeedback')}
                  isActive={phaseTimerActive} 
                  onTimeout={handlePhaseTimeout}
                />
              </div>
            )}
            
            <div className="w-full p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isTriviaRound ? "תוצאות שאלת הטריוויה" : "תוצאות הסיבוב"}
              </h2>
              
              {currentRound && (
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {isTriviaRound ? "התשובה הנכונה" : "השיר הנכון"}
                  </h3>
                  <p className="text-lg font-bold text-primary">
                    {isTriviaRound && currentTriviaQuestion 
                      ? currentTriviaQuestion.options[currentTriviaQuestion.correctAnswerIndex]
                      : currentRound.correctSong.title}
                    {currentRound.correctSong.artist && ` - ${currentRound.correctSong.artist}`}
                  </p>
                  
                  {isHost && currentRound.correctSong.fullUrl && (
                    <AppButton 
                      variant="outline" 
                      className="mt-4" 
                      onClick={playFullSong}
                    >
                      השמע שיר מלא <Youtube className="mr-2 h-4 w-4" />
                    </AppButton>
                  )}
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-4 text-center">התוצאות שלך</h3>
                <div className={`p-4 rounded-lg ${
                  currentPlayer.lastAnswerCorrect ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <p className="text-center mb-2">
                    {currentPlayer.lastAnswerCorrect 
                      ? "כל הכבוד! ענית נכון" 
                      : "לא נורא, פעם הבאה תצליח"}
                  </p>
                  <p className="text-center font-bold">
                    {currentPlayer.lastScore !== undefined 
                      ? `${currentPlayer.lastScore > 0 ? '+' : ''}${currentPlayer.lastScore} נקודות` 
                      : "לא נוספו נקודות"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">טבלת המובילים</h2>
            <div className="w-full bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">דירוג</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">ניקוד</TableHead>
                    <TableHead className="text-right">השיב</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id} className={
                      player.name === playerName ? "bg-primary/10" : ""
                    }>
                      <TableCell className="font-medium">
                        {index === 0 && <Trophy className="inline mr-1 text-yellow-500" size={16} />}
                        {index === 1 && <Trophy className="inline mr-1 text-gray-400" size={16} />}
                        {index === 2 && <Trophy className="inline mr-1 text-amber-700" size={16} />}
                        {index > 2 && `${index + 1}`}
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.score}</TableCell>
                      <TableCell>
                        {player.hasAnswered ? (
                          <CheckCircle2 className="text-green-500" size={16} />
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {isHost && (
              <div className="mt-6">
                <GameHostControls
                  roundCounter={roundCounter}
                  isTriviaRound={isTriviaRound}
                  onPlayNext={nextRound}
                  onResetScores={resetAllPlayerScores}
                  gamePhase={serverGamePhase}
                />
              </div>
            )}
          </div>
        );
      
      default:
        return <div>לא נמצא שלב תקין</div>;
    }
  };

  const handleSongPlaybackEnded = () => {
    setShowYouTubeEmbed(false);
    setIsPlaying(false);
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
    if (!isHost) {
      console.log('Setting timer active after YouTube embed finishes (non-host)');
      setTimerActive(true);
    }
  };

  const handleSongPlaybackError = () => {
    toast({
      title: "שגיאה בהשמעת השיר",
      description: "אירעה שגיאה בהשמעת השיר, בחר שיר אחר",
      variant: "destructive"
    });
    setIsPlaying(false);
    setShowYouTubeEmbed(false);
  };

  const handleTimerTimeout = () => {
    console.log('Timer timeout handler called');
    if (selectedAnswer === null && !currentPlayer.hasAnswered) {
      if (phase === 'answerOptions') {
        console.log('Timer ended and no answer selected - handling timeout now');
        handleTimeout();
      } else {
        console.log('Timer ended but not in answer options phase');
      }
    } else {
      console.log('Timer ended but user already answered - submitting answers');
      submitAllAnswers();
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">מה השיר?</h1>
          <p className="text-sm text-gray-600">סיבוב {roundCounter} {isTriviaRound && "- טריוויה"}</p>
        </div>
        <div className="flex gap-2">
          <LeaveGameButton />
          {isHost && <EndGameButton />}
        </div>
      </div>
      
      {renderPhase()}
    </div>
  );
};

export default GamePlay;
