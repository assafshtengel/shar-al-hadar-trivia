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
import { defaultSongBank, createGameRound, Song } from '@/data/songBank';
import SongPlayer from '@/components/SongPlayer';
import { calculateScore } from '@/utils/scoreCalculator';
import AdSenseAd from '@/components/AdSenseAd';

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
  is_correct: boolean;
  points: number;
}

const songs = defaultSongBank.filter(song => song.embedUrl || song.spotifyUrl);

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
    answerTimeLimit
  } = useGameState();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeLeft, setTimeLeft] = useState(answerTimeLimit);
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
    pendingAnswer: null
  });

  const updateGameState = async (phase: 'waiting' | 'playing' | 'answering' | 'results' | 'end') => {
    if (!isHost || !gameCode) return;
    
    console.log(`Updating game state to ${phase}`);
    try {
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
      } else {
        console.log(`Successfully updated game state to ${phase}`);
      }
    } catch (err) {
      console.error('Exception when updating game state:', err);
    }
  };

  const handleSongPlayback = useCallback(() => {
    if (!gameCode) return;

    console.log('Setting up song playback channel for game:', gameCode);
    const channel = supabase.channel(`game-playback-${gameCode}`)
      .on('broadcast', { event: 'playback-started' }, (payload) => {
        if (payload.payload.song) {
          console.log('Received song playback broadcast:', payload.payload.song.title);
          setCurrentSong(payload.payload.song);
          setIsPlaying(true);
          setShowYouTubeEmbed(true);
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up song playback channel');
      supabase.removeChannel(channel);
    };
  }, [gameCode]);

  useEffect(() => {
    const cleanupFn = handleSongPlayback();
    return cleanupFn; // Return the cleanup function directly
  }, [handleSongPlayback]);

  const handleSongPlaybackEnded = () => {
    setShowYouTubeEmbed(false);
    setIsPlaying(false);
    if (isHost) {
      updateGameState('answering');
    }
    setPhase('answerOptions');
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
    
    const roundDataString = JSON.stringify(gameRound);
    
    const { error: stateError } = await supabase
      .from('game_state')
      .update({
        current_song_name: roundDataString,
        current_song_url: gameRound.correctSong.embedUrl,
        game_phase: 'playing'
      })
      .eq('game_code', gameCode);

    if (stateError) {
      console.error('Error storing game round data:', stateError);
      toast({
        title: "שגיאה בשמירת נתוני הסיבוב",
        description: "אירעה שגיאה בשמירת נתוני הסיבוב",
        variant: "destructive"
      });
      return;
    }

    const channel = supabase.channel(`game-playback-${gameCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'playback-started',
      payload: { song: gameRound.correctSong }
    });

    toast({
      title: "משמיע שיר...",
      description: "מנגן כעת, האזן בקשב"
    });
  };

  const handleTimerTimeout = () => {
    console.log('Timer timeout handler called');
    if (selectedAnswer === null && !currentPlayer.hasAnswered) {
      handleTimeout();
    } else {
      submitAllAnswers();
    }
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
        is_correct: isCorrect,
        points
      });
      setCurrentPlayer(prev => {
        const updatedScore = prev.score + points;
        console.log(`Updating player score: ${prev.score} + ${points} = ${updatedScore}`);
        return {
          ...prev,
          hasAnswered: true,
          lastAnswer: currentRound.options[selectedAnswer].title,
          lastAnswerCorrect: isCorrect,
          lastScore: points,
          score: updatedScore
        };
      });
    }
    setPendingAnswers(pendingUpdates);
    await batchUpdatePlayerScores(pendingUpdates);
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
  };

  const batchUpdatePlayerScores = async (updates: PendingAnswerUpdate[]) => {
    if (!gameCode || updates.length === 0) {
      return;
    }
    console.log('Batch updating player scores:', updates);
    try {
      for (const update of updates) {
        const {
          data: playerData,
          error: fetchError
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', update.player_name).maybeSingle();
        if (fetchError) {
          console.error(`Error fetching player ${update.player_name}:`, fetchError);
          continue;
        }
        if (!playerData) {
          console.error(`Player ${update.player_name} not found`);
          continue;
        }
        const alreadyAnswered = playerData.hasAnswered;
        const currentScore = playerData.score || 0;
        const {
          newScore
        } = calculateScore({
          isCorrect: update.is_correct,
          currentScore,
          alreadyUpdated: alreadyAnswered
        });
        console.log(`Player ${update.player_name}: Current score=${currentScore}, already answered=${alreadyAnswered}, adding ${update.points}, new score=${newScore}`);
        if (!alreadyAnswered) {
          const {
            error: updateError
          } = await supabase.from('players').update({
            score: newScore,
            hasAnswered: true
          }).eq('game_code', gameCode).eq('name', update.player_name);
          if (updateError) {
            console.error(`Error updating player ${update.player_name}:`, updateError);
          } else {
            console.log(`Successfully updated player ${update.player_name} score to ${newScore}`);
          }
        } else {
          console.log(`Skipping score update for ${update.player_name} - already answered`);
        }
      }
    } catch (error) {
      console.error('Error in batchUpdatePlayerScores:', error);
      toast({
        title: "שגיאה בעדכון הניקוד",
        description: "אירעה שגיאה בעדכון הניקוד",
        variant: "destructive"
      });
    }
  };

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered || !currentRound) {
      console.log("Already answered or missing round data - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected answer: ${index}`);
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    let currentScore = 0;
    let alreadyAnswered = false;
    if (gameCode && playerName) {
      try {
        const {
          data
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        currentScore = data?.score || 0;
        alreadyAnswered = data?.hasAnswered || false;
      } catch (err) {
        console.error('Error getting current player score:', err);
      }
    }
    const {
      points,
      newScore
    } = calculateScore({
      isCorrect,
      currentScore,
      alreadyUpdated: alreadyAnswered
    });
    console.log(`Calculating new score: ${currentScore} + ${points} = ${newScore} (already answered: ${alreadyAnswered})`);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[index].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: index,
      score: newScore
    }));
    setShowAnswerConfirmation(true);
    if (gameCode && playerName) {
      try {
        console.log(`Updating hasAnswered status and storing answer for player ${playerName}`);
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: newScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player answer status:', error);
        } else {
          console.log(`Successfully marked ${playerName} as having answered and updated score to ${newScore}`);
        }
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
    if (playerName) {
      if (gameCode) {
        const {
          data
        } = await supabase.from('players').select('hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (data && data.hasAnswered) {
          console.log(`Player ${playerName} already marked as answered, skipping timeout update`);
          return;
        }
      }
      const pendingUpdate: PendingAnswerUpdate = {
        player_name: playerName,
        is_correct: false,
        points: 0
      };
      setPendingAnswers([pendingUpdate]);
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: false,
        lastScore: 0
      }));
      await batchUpdatePlayerScores([pendingUpdate]);
      toast({
        title: "אוי! נגמר הזמן",
        description: "לא הספקת לענות בזמן",
        variant: "destructive"
      });
    }
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
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
        description: "אירעה שגיאה באיפוס סטטוס מוכנות השחקנים",
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

  const resetAllPlayerScores = async () => {
    if (!isHost || !gameCode) return;
    try {
      const {
        error
      } = await supabase.from('players').update({
        score: 0
      }).eq('game_code', gameCode);
      if (error) {
        console.error('Error resetting player scores:', error);
        toast({
          title: "שגיאה באיפוס הניקוד",
          description: "אירעה שגיאה באיפוס ניקוד השחקנים",
          variant: "destructive"
        });
      } else {
        console.log('Successfully reset all player scores to 0');
        toast({
          title: "ניקוד אופס",
          description: "ניקוד כל השחקנים אופס בהצלחה"
        });
      }
    } catch (err) {
      console.error('Exception when resetting player scores:', err);
    }
  };

  useEffect(() => {
    if (phase === 'scoringFeedback') {
      const timer = setTimeout(() => {
        setPhase('leaderboard');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, isHost]);

  useEffect(() => {
    if (phase === 'leaderboard' && gameCode) {
      const fetchPlayers = async () => {
        try {
          console.log('Fetching players for leaderboard display');
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
          } else if (data) {
            console.log('Successfully loaded players for leaderboard:', data.length);
            setPlayers(data);
          }
        } catch (err) {
          console.error('Exception when fetching players:', err);
        }
      };
      
      fetchPlayers();
    }
  }, [phase, gameCode, toast]);

  const nextRound = async () => {
    if (!isHost) return;
    await resetPlayersAnsweredStatus();
    setSelectedAnswer(null);
    setTimerActive(false);
    setPlayerReady(false);
    if (timerRef.current) {
      console.log('Clearing timer before starting next round');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      isReady: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined,
      pendingAnswer: null
    }));
    updateGameState('playing');
    setPhase('songPlayback');
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: "סיבוב חדש עומד להתחיל"
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

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered || !currentRound) {
      console.log("Already answered or missing round data - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected answer: ${index}`);
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    let currentScore = 0;
    let alreadyAnswered = false;
    if (gameCode && playerName) {
      try {
        const {
          data
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        currentScore = data?.score || 0;
        alreadyAnswered = data?.hasAnswered || false;
      } catch (err) {
        console.error('Error getting current player score:', err);
      }
    }
    const {
      points,
      newScore
    } = calculateScore({
      isCorrect,
      currentScore,
      alreadyUpdated: alreadyAnswered
    });
    console.log(`Calculating new score: ${currentScore} + ${points} = ${newScore} (already answered: ${alreadyAnswered})`);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[index].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: index,
      score: newScore
    }));
    setShowAnswerConfirmation(true);
    if (gameCode && playerName) {
      try {
        console.log(`Updating hasAnswered status and storing answer for player ${playerName}`);
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: newScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player answer status:', error);
        } else {
          console.log(`Successfully marked ${playerName} as having answered and updated score to ${newScore}`);
        }
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
    if (playerName) {
      if (gameCode) {
        const {
          data
        } = await supabase.from('players').select('hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (data && data.hasAnswered) {
          console.log(`Player ${playerName} already marked as answered, skipping timeout update`);
          return;
        }
      }
      const pendingUpdate: PendingAnswerUpdate = {
        player_name: playerName,
        is_correct: false,
        points: 0
      };
      setPendingAnswers([pendingUpdate]);
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: false,
        lastScore: 0
      }));
      await batchUpdatePlayerScores([pendingUpdate]);
      toast({
        title: "אוי! נגמר הזמן",
        description: "לא הספקת לענות בזמן",
        variant: "destructive"
      });
    }
    if (isHost) {
      updateGameState('results');
    }
    setPhase('scoringFeedback');
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
        description: "אירעה שגיאה באיפוס סטטוס מוכנות השחקנים",
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

  const resetAllPlayerScores = async () => {
    if (!isHost || !gameCode) return;
    try {
      const {
        error
      } = await supabase.from('players').update({
        score: 0
      }).eq('game_code', gameCode);
      if (error) {
        console.error('Error resetting player scores:', error);
        toast({
          title: "שגיאה באיפוס הניקוד",
          description: "אירעה שגיאה באיפוס ניקוד השחקנים",
          variant: "destructive"
        });
      } else {
        console.log('Successfully reset all player scores to 0');
        toast({
          title: "ניקוד אופס",
          description: "ניקוד כל השחקנים אופס בהצלחה"
        });
      }
    } catch (err) {
      console.error('Exception when resetting player scores:', err);
    }
  };

  useEffect(() => {
    if (phase === 'scoringFeedback') {
      const timer = setTimeout(() => {
        setPhase('leaderboard');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, isHost]);

  useEffect(() => {
    if (phase === 'leaderboard' && gameCode) {
      const fetchPlayers = async () => {
        try {
          console.log('Fetching players for leaderboard display');
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
          } else if (data) {
            console.log('Successfully loaded players for leaderboard:', data.length);
            setPlayers(data);
          }
        } catch (err) {
          console.error('Exception when fetching players:', err);
        }
      };
      
      fetchPlayers();
    }
  }, [phase, gameCode, toast]);

  const nextRound = async () => {
    if (!isHost) return;
    await resetPlayersAnsweredStatus();
    setSelectedAnswer(null);
    setTimerActive(false);
    setPlayerReady(false);
    if (timerRef.current) {
      console.log('Clearing timer before starting next round');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      isReady: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined,
      pendingAnswer: null
    }));
    updateGameState('playing');
    setPhase('songPlayback');
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: "סיבוב חדש עומד להתחיל"
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
        return <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
            
            <SongPlayer song={currentSong} isPlaying={isPlaying && showYouTubeEmbed} onPlaybackEnded={handleSongPlaybackEnded} onPlaybackError={handleSongPlaybackError} />
            
            <AppButton variant="primary" size="lg" onClick={playSong} className="max-w-xs" disabled={!isHost || isPlaying}>
              {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
              <Play className="mr-2" />
            </AppButton>
            
            {isPlaying && !showYouTubeEmbed && <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute w-full h-full">
                  <MusicNote type="note1" className="absolute top-0 right-0 text-primary animate-float" size={32} />
                  <MusicNote type="note2" className="absolute top-10 left-0 text-secondary animate-float-alt" size={28} />
                  <MusicNote type="note3" className="absolute bottom-10 right-10 text-accent animate-float" size={36} />
                </div>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Music className="w-10 h-10 text-primary" />
                </div>
              </div>}
            
            {!isHost && !isPlaying && <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להשמיע את השיר הבא
              </div>}
          </div>;
      case 'answerOptions':
        return <div className="flex flex-col items-center py-6 space-y-6">
            <GameTimer initialSeconds={10} isActive={true} onTimeout={handleTimerTimeout} />
            
            <div className="flex items-center">
              <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
              <SkipForward className="ml-2 text-secondary" />
            </div>
            
            <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
            
            {currentRound ?
