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
    }, 2000); // Check every 2 seconds

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

  function createGameRound(): GameRound {
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
        if (!isHost) {
          console.log('Setting timer active after YouTube embed finishes (non-host)');
          setTimerActive(true);
        }
      }, 12000); // Changed to 12 seconds
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
    gameStartTimeRef.current = Date.now(); // Set start time for scoring
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

  const handleTimerTimeout = () => {
    console.log('Timer timeout handler called');
    if (selectedAnswer === null && !currentPlayer.hasAnswered) {
      if (timeLeft <= 0 && phase === 'answerOptions') {
        handleTimeout();
      } else {
        console.log('Timer ended but not submitting answers yet - showing 50-50 options');
      }
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
    if (!currentPlayer.pointsAwarded && playerName && selectedAnswer !== null) {
      console.log(`Processing answer for ${playerName} - points not yet awarded`);
      const isCorrect = selectedAnswer === currentRound.correctAnswerIndex;
      const points = isCorrect ? 10 : 0;
      const pendingUpdate: PendingAnswerUpdate = {
        player_name: playerName,
        is_correct: isCorrect,
        points
      };
      setPendingAnswers([pendingUpdate]);
      setCurrentPlayer(prev => {
        const updatedScore = prev.score + points;
        console.log(`Updating player score: ${prev.score} + ${points} = ${updatedScore} (first calculation)`);
        return {
          ...prev,
          hasAnswered: true,
          lastAnswer: currentRound.options[selectedAnswer].title,
          lastAnswerCorrect: isCorrect,
          lastScore: points,
          score: updatedScore,
          pointsAwarded: true
        };
      });
      await batchUpdatePlayerScores([pendingUpdate]);
    } else {
      console.log(`Skipping answer processing for ${playerName} - points already awarded or no answer selected`);
    }
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
        if (playerData.hasAnswered) {
          console.log(`Player ${update.player_name} has already answered this round. Skipping score update.`);
          continue;
        }
        const currentScore = playerData.score || 0;
        const newScore = currentScore + update.points;
        console.log(`Player ${update.player_name}: Current score=${currentScore}, adding ${update.points}, new score=${newScore}`);
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

  const handleAnswer = async (isCorrect: boolean, selectedIndex: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered || !currentRound || currentPlayer.pointsAwarded) {
      console.log("Already answered or missing round data or points already awarded - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected answer: ${selectedIndex}`);
    setSelectedAnswer(selectedIndex);
    const currentTime = Date.now();
    const timeSinceStart = (currentTime - (gameStartTimeRef.current || currentTime)) / 1000;
    if (timeSinceStart <= 12) {
      setAnsweredEarly(true);
    }
    let points = 0;
    const isFinalPhase = timeSinceStart > 8; // Final phase (after timer reached 0)

    if (isFinalPhase) {
      // Final phase scoring
      points = isCorrect ? 4 : -2;
    } else {
      // Dynamic scoring based on time
      if (timeSinceStart <= 3) {
        points = 13; // Maximum points for quick answers
      } else if (timeSinceStart <= 8) {
        points = Math.max(13 - Math.floor(timeSinceStart - 2), 5); // Decreasing points
      }
    }
    if (!isCorrect) {
      points = isFinalPhase ? -2 : 0;
    }
    let currentScore = 0;
    let hasAlreadyAnswered = false;
    if (gameCode && playerName) {
      try {
        const {
          data
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered this round. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswer: currentRound.options[selectedIndex].title,
              lastAnswerCorrect: isCorrect,
              lastScore: points,
              pendingAnswer: selectedIndex,
              pointsAwarded: true
            }));
            setShowAnswerConfirmation(true);
            return;
          }
        }
      } catch (err) {
        console.error('Error getting current player score:', err);
      }
    }
    const updatedScore = currentScore + points;
    console.log(`Calculating new score: ${currentScore} + ${points} = ${updatedScore}`);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[selectedIndex].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: selectedIndex,
      score: updatedScore,
      pointsAwarded: true
    }));
    setShowAnswerConfirmation(true);
    if (gameCode && playerName) {
      try {
        console.log(`Updating hasAnswered status and storing answer for player ${playerName}`);
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: updatedScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player answer status:', error);
        } else {
          console.log(`Successfully marked ${playerName} as having answered and updated score to ${updatedScore}`);
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
    if (timeLeft <= 0 || isFinalPhase) {
      submitAllAnswers();
    }
  };

  const handleSkip = async () => {
    if (selectedAnswer !== null || currentPlayer.skipsLeft <= 0 || !currentRound || currentPlayer.pointsAwarded) {
      console.log("Cannot skip: Already answered, no skips left, missing round data, or points already awarded");
      return;
    }
    const skipPoints = 3;
    let currentScore = 0;
    let hasAlreadyAnswered = false;
    if (gameCode && playerName) {
      try {
        const {
          data
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered this round. Not updating score for skip.`);
            setSelectedAnswer(null);
            setCurrentPlayer(prev => ({
              ...prev,
              skipsLeft: prev.skipsLeft - 1,
              pointsAwarded: true
            }));
            return;
          }
        }
      } catch (err) {
        console.error('Error getting current player score for skip:', err);
      }
    }
    const updatedScore = currentScore + skipPoints;
    console.log(`Skip calculation: ${currentScore} + ${skipPoints} = ${updatedScore}`);
    setSelectedAnswer(null);
    setCurrentPlayer(prev => ({
      ...prev,
      skipsLeft: prev.skipsLeft - 1,
      lastScore: skipPoints,
      score: updatedScore,
      hasAnswered: true,
      pointsAwarded: true
    }));
    if (gameCode && playerName) {
      try {
        console.log(`Updating for skip: player ${playerName}`);
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: updatedScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player skip status:', error);
        } else {
          console.log(`Successfully marked ${playerName} as having skipped and updated score to ${updatedScore}`);
        }
      } catch (err) {
        console.error('Exception when updating player skip status:', err);
      }
    }
    toast({
      title: "דילגת על השאלה",
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילו������ם`
    });
  };

  const handleTimeout = async () => {
    console.log('Timeout reached without selection');
    if (selectedAnswer !== null || currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log('Player already answered or points already awarded, skipping timeout handler');
      return;
    }

    // When timer runs out and no answer was selected, directly skip to results
    // instead of going to 50-50 options
    console.log('No answer selected after timeout, moving to results');

    // Submit all answers and transition to scoring feedback
    submitAllAnswers();
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
    } else {
      console.log('Successfully reset all players answered status');
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
      }, 6000); // Changed to 6 seconds
      return () => clearTimeout(timer);
    }
  }, [phase, isHost]);

  const nextRound = async () => {
    if (!isHost) return;
    setAnsweredEarly(false);
    setSelectedAnswer(null);
    setTimerActive(false);
    setPlayerReady(false);
    setRoundCounter(prev => prev + 1);
    const newRoundCounter = roundCounter + 1;
    const newIsTriviaRound = newRoundCounter % 5 === 0;
    setIsTriviaRound(newIsTriviaRound);
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
      pendingAnswer: null,
      pointsAwarded: false
    }));
    updateGameState('playing');
    setPhase('songPlayback');
    if (newIsTriviaRound) {
      const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
      setCurrentTriviaQuestion(triviaQuestions[randomIndex]);
    }
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: newIsTriviaRound ? "סיבוב טריוויה ע��מד להתחיל" : "סיבוב חדש עומד להתחיל"
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

  const handleTriviaAnswer = (isCorrect: boolean, selectedIndex: number) => {
    if (currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log("Already answered or points already awarded - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected trivia answer: ${selectedIndex}, correct: ${isCorrect}`);
    const currentTime = Date.now();
    const timeSinceStart = (currentTime - (gameStartTimeRef.current || Date.now())) / 1000;
    if (timeSinceStart <= 12) {
      setAnsweredEarly(true);
    }
    let points = 0;
    const isFinalPhase = timeSinceStart > 8; // Final 50-50 phase

    if (isFinalPhase) {
      points = isCorrect ? 4 : -2;
    } else {
      if (timeSinceStart <= 3) {
        points = 13;
      } else if (timeSinceStart <= 8) {
        points = Math.max(13 - Math.floor(timeSinceStart - 2), 5);
      }
    }
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: prev.score + points,
      pointsAwarded: true
    }));
    if (gameCode && playerName) {
      try {
        console.log(`Updating score for player ${playerName} after trivia answer`);
        supabase.from('players').update({
          hasAnswered: true,
          score: currentPlayer.score + points
        }).eq('game_code', gameCode).eq('name', playerName).then(({
          error
        }) => {
          if (error) {
            console.error('Error updating player after trivia answer:', error);
          } else {
            console.log(`Successfully updated ${playerName} score after trivia answer`);
          }
        });
      } catch (err) {
        console.error('Exception when updating player after trivia answer:', err);
      }
    }
    toast({
      title: isCorrect ? "כל הכבוד!" : "אופס!",
      description: isCorrect ? "תשובה נכונה!" : "התשובה ��גויה, נסה ב��עם הבאה"
    });
    if (isFinalPhase) {
      submitAllAnswers();
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        if (isTriviaRound && currentTriviaQuestion) {
          return (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary">שאלת טריוויה במוזיקה</h2>
              {isHost ? (
                <AppButton 
                  variant="primary" 
                  size="lg" 
                  onClick={() => {
                    updateGameState('answering');
                    setPhase('answerOptions');
                    gameStartTimeRef.current = Date.now(); // Set start time for trivia question
                  }} 
                  className="max-w-xs"
                >
                  הצג שאלת טריוויה
                  <Play className="mr-2" />
                </AppButton>
              ) : (
                <div className="text-lg text-gray-600 text-center">
                  המתן למנהל המשחק להציג את שאלת הטריוויה
                </div>
              )}
              {currentTriviaQuestion && (
                <TriviaQuestion 
                  question={currentTriviaQuestion} 
                  onAnswer={(isCorrect, selectedIndex) => handleTriviaAnswer(isCorrect, selectedIndex)} 
                  timeUp={false} 
                  answerStartTime={gameStartTimeRef.current || Date.now()} 
                  elapsedTime={0} 
                  showOptions={true}
                  isFinalPhase={false} 
                  showQuestion={true} 
                />
              )}
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
            <SongPlayer 
              song={currentSong} 
              isPlaying={isPlaying && showYouTubeEmbed} 
              onPlaybackEnded={handleSongPlaybackEnded} 
              onPlaybackError={handleSongPlaybackError} 
              onPlaybackStarted={() => {
                if (currentRound) {
                  gameStartTimeRef.current = Date.now();
                }
              }} 
              showOverlay={true}
            />
            {currentRound && (
              <TriviaQuestion 
                question={{
                  question: "מה השיר?",
                  options: currentRound.options.map(song => song.title || ''),
                  correctAnswerIndex: currentRound.correctAnswerIndex
                }} 
                onAnswer={(isCorrect, selectedIndex) => handleAnswer(isCorrect, selectedIndex)} 
                timeUp={timeLeft <= 0} 
                answerStartTime={gameStartTimeRef.current || Date.now()} 
                elapsedTime={(Date.now() - (gameStartTimeRef.current || Date.now())) / 1000} 
                showOptions={true} // Always show all 4 options during song playback
                isFinalPhase={false} 
                showQuestion={true} 
              />
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
            {!isHost && !isPlaying && (
              <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להשמיע את השיר הבא
              </div>
            )}
          </div>
        );

      case 'answerOptions': {
        const timeSinceStart = (Date.now() - (gameStartTimeRef.current || Date.now())) / 1000;
        const isFinalPhase = true; // כל הזמן עכשיו זה Final Phase — 8 שניות בלבד

        if (
          isHost &&
          currentPlayer.hasAnswered &&
          isFinalPhase
        ) {
          return (
            <div className="flex flex-col items-center py-6 space-y-6">
              <GameTimer initialSeconds={8} isActive={true} onTimeout={handleTimerTimeout} />
              <div className="text-xl font-semibold text-primary">
                הבחירה שלך נקלטה! ממתין לשאר המשתתפים...
              </div>
              <div className="text-md text-gray-600 bg-gray-100 rounded-lg border p-5 max-w-xl mt-8 text-center">
                לאחר שכל המשתתפים יענו או שייגמר הזמן, יעברו כל השחקנים לצפייה בתוצאה, ניקוד, ושם השיר הנכון כולל אפשרות להשמעתו.
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <GameTimer initialSeconds={8} isActive={timerActive} onTimeout={handleTimerTimeout} />

            <div className="text-xl font-semibold text-primary">
              הניקוד שלך בסיבוב זה: {currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}
            </div>

            <div className="flex items-center">
              <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
              <SkipForward className="ml-2 text-secondary" />
            </div>

            {isTriviaRound && currentTriviaQuestion ? (
              <TriviaQuestion
                question={currentTriviaQuestion}
                onAnswer={(isCorrect, selectedIndex) => handleTriviaAnswer(isCorrect, selectedIndex)}
                timeUp={timeLeft <= 0}
                answerStartTime={gameStartTimeRef.current || Date.now()}
                elapsedTime={timeSinceStart}
                showOptions={true}
                isFinalPhase={isFinalPhase}
                hasAnsweredEarly={answeredEarly}
                onTimeUp={() => {
                  if (isFinalPhase) {
                    submitAllAnswers();
                  }
                }}
              />
            ) : currentRound ? (
              <TriviaQuestion
                question={{
                  question: "מה השיר?",
                  options: currentRound.options.map(song => song.title || ''),
                  correctAnswerIndex: currentRound.correctAnswerIndex
                }}
                onAnswer={(isCorrect, selectedIndex) => handleAnswer(isCorrect, selectedIndex)}
                timeUp={timeLeft <= 0}
                answerStartTime={gameStartTimeRef.current || Date.now()}
                elapsedTime={timeSinceStart}
                showOptions={true}
                isFinalPhase={isFinalPhase}
                hasAnsweredEarly={answeredEarly}
                onTimeUp={() => {
                  if (isFinalPhase) {
                    submitAllAnswers();
                  }
                }}
              />
            ) : (
              <div className="text-lg text-gray-600 animate-pulse">
                טוען אפשרויות...
              </div>
            )}

            {!currentPlayer.hasAnswered && (
              <AppButton variant="secondary" className="mt-4 max-w-xs" disabled={selectedAnswer !== null || currentPlayer.skipsLeft <= 0} onClick={handleSkip}>
                דלג ({currentPlayer.skipsLeft})
                <SkipForward className="mr-2" />
              </AppButton>
            )}

            {selectedAnswer !== null && (
              <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
                הבחירה שלך נקלטה! ממתין לסיום הזמן...
              </div>
            )}
          </div>
        );
      }
      
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
                
                {currentPlayer.lastAnswer && (
                  <div className="text-lg">
                    {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
                  </div>
                )}
                
                {!currentPlayer.lastAnswerCorrect && currentRound && !isTriviaRound && (
                  <div className="text-lg font-semibold text-green-500">
                    התשובה הנכונה: {currentRound.correctSong.title}
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
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
                  <span>נקודות</span>
                </div>
              </>
            )}
            
            {isHost && currentRound && !isTriviaRound && (
              <AppButton 
                variant="secondary" 
                size="lg" 
                onClick={playFullSong} 
                className="max-w-xs mt-4"
              >
                השמע את השיר המלא
                <Youtube className="mr-2" />
              </AppButton>
            )}
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-2xl font-bold text-primary mb-6">טבלת המובילים</h2>

            <div className="w-full max-w-md">
              <Table>
                <TableHeader>
                  <TableRow className="py-[32px]">
                    <TableHead className="text-right">מיקום</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">ניקוד</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, idx) => (
                    <TableRow key={player.id} className={player.name === playerName ? "bg-primary/10" : ""}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{player.name}</TableCell>
                      <TableCell className={`font-bold ${(player.score || 0) < 0 ? "text-red-500" : ""}`}>
                        {player.score || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                        {idx === 1 && <Award className="h-5 w-5 text-gray-400" />}
                        {idx === 2 && <Award className="h-5 w-5 text-amber-700" />}
                        {player.name === playerName && idx > 2 && <CheckCircle2 className="h-5 w-5 text-primary my-[30px]" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isHost ? (
              <AppButton 
                variant="primary" 
                size="lg" 
                className="mt-4" 
                onClick={nextRound}
              >
                התחל סיבוב חדש
              </AppButton>
            ) : (
              <div className="text-sm text-gray-500 mt-4">
                המתן למארח להתחיל סיבוב חדש
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-lg text-gray-600 animate-pulse">
              טוען...
            </div>
          </div>
        );
    }
  };

  useEffect(() => {
    if (phase === 'answerOptions' && timeLeft <= 0.1) {
      submitAllAnswers();
    }
  }, [phase, timeLeft]);
  
  useEffect(() => {
    if (isHost && serverGamePhase === "playing") {
      playSong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, serverGamePhase]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10">
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 order-1 md:order-none">
            <LeaveGameButton gameCode={gameCode || ''} isHost={isHost} />
            {isHost && <EndGameButton gameCode={gameCode} />}
          </div>
          
          <h1 className="flex items-center justify-center text-5xl font-bold text-primary text-center order-0 md:order-none relative">
            <div className="flex items-center justify-center gap-3">
              <MusicNote type="note3" className="absolute -top-6 -right-8 text-primary" size={32} animation="float" />
              <MusicNote type="note2" className="absolute -top-4 -left-6 text-secondary" size={28} animation="float-alt" />
              שיר על הדרך 🎶
            </div>
          </h1>
          
          <div className="flex flex-col md:flex-row items-center gap-4 order-2 md:order-none">
            {isHost && <div className="text-sm text-gray-600">מנחה</div>}
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
              <span className="text-sm text-gray-600">קוד משחק: </span>
              <span className="font-mono font-bold text-lg">{gameCode}</span>
            </div>
          </div>
        </div>
        
        {renderPhase()}
      </div>
      
      <div className="w-full max-w-4xl mx-auto p-4 mb-8">
        
      </div>
    </div>
  );
};

export default GamePlay;
