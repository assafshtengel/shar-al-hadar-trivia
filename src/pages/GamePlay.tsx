import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Music, Play } from 'lucide-react';
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import { defaultSongBank } from '@/data/songBank';
import SongPlayer from '@/components/SongPlayer';
import TriviaQuestion from '@/components/TriviaQuestion';
import { triviaQuestions, TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import { mashinaSongs } from "@/data/songs/mashina";
import { adamSongs } from "@/data/songs/adam";
import MusicNote from '@/components/MusicNote';
import GameTimer from '@/components/GameTimer';
import { GamePhase, GameRound, PendingAnswerUpdate } from '@/types/game';
import { useGamePlayPlayers } from '@/hooks/useGamePlayPlayers';
import GameHeader from '@/components/GameHeader';
import GameLeaderboard from '@/components/GameLeaderboard';
import ScoringFeedback from '@/components/ScoringFeedback';
import SongPlaybackPhase from '@/components/SongPlaybackPhase';
import AnswerOptionsPhase from '@/components/AnswerOptionsPhase';
import { useGameRound } from '@/hooks/useGameRound';
import { toast } from 'sonner';

const GamePlay: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    gameCode,
    playerName,
    isHost,
    gamePhase: serverGamePhase,
    gameSettings
  } = useGameState();

  const { players, currentPlayer, setCurrentPlayer, setPlayers } = useGamePlayPlayers(gameCode, playerName);
  const { 
    currentRound,
    setCurrentRound,
    currentSong,
    setCurrentSong,
    createGameRound,
    updateGameRound
  } = useGameRound({ gameCode, isHost, gameSettings });
  
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeLeft, setTimeLeft] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showAnswerConfirmation, setShowAnswerConfirmation] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswerUpdate[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roundCounter, setRoundCounter] = useState<number>(1);
  const [isTriviaRound, setIsTriviaRound] = useState<boolean>(false);
  const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<TriviaQuestionType | null>(null);
  const [answeredEarly, setAnsweredEarly] = useState(false);
  const [userSkippedQuestion, setUserSkippedQuestion] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          pendingAnswer: null,
          pointsAwarded: false
        }));
        break;
      case 'answering':
        setPhase('answerOptions');
        setSelectedAnswer(null);
        setAnsweredEarly(false);
        if (!isHost) {
          setTimerActive(true);
        }
        break;
      case 'results': {
        if (selectedAnswer !== null || currentPlayer.hasAnswered) {
          setPhase('scoringFeedback');
        } else {
          if (!isHost) {
            setPhase('answerOptions');
            setTimerActive(true);
          } else {
            setPhase('scoringFeedback');
          }
        }
        break;
      }
      case 'end':
        setPhase('leaderboard');
        break;
    }
  }, [serverGamePhase, isHost, selectedAnswer, currentPlayer.hasAnswered, setCurrentPlayer]);

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
  }, [gameCode, toast, playerName, setCurrentPlayer, setPlayers]);

  useEffect(() => {
    if (!gameCode) return;
    const fetchGameRoundData = async () => {
      const {
        data,
        error
      } = await supabase.from('game_state').select('current_song_name, current_song_url, game_phase').eq('game_code', gameCode).maybeSingle();
      if (error) {
        console.error('Error fetching game round data:', error);
        return;
      }
      if (data) {
        const fetchCurrentRoundNumber = async () => {
          try {
            const { data, error } = await supabase
              .from('game_state')
              .select('current_round')
              .eq('game_code', gameCode)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching current round:', error);
              return 1;
            }
            
            return data?.current_round || 1;
          } catch (err) {
            console.error('Exception fetching round number:', err);
            return 1;
          }
        };
        
        const roundCounter = await fetchCurrentRoundNumber();
        const isTrivia = roundCounter % 5 === 0;
        setIsTriviaRound(isTrivia);
        
        if (isTrivia) {
          console.log('Fetching trivia question for all participants');
          try {
            if (data.current_song_name && data.current_song_name.includes("trivia")) {
              const triviaData = JSON.parse(data.current_song_name);
              setCurrentTriviaQuestion(triviaData.question);
            } else if (!isHost) {
              const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
              setCurrentTriviaQuestion(triviaQuestions[randomIndex]);
            }
          } catch (parseError) {
            console.error('Error parsing trivia data:', parseError);
            const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
            setCurrentTriviaQuestion(triviaQuestions[randomIndex]);
          }
        } else if (data.current_song_name) {
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
      if (payload.new) {
        if (payload.new.game_phase === 'answering' || payload.new.game_phase === 'playing') {
          fetchGameRoundData();
        }
        
        if (payload.new.current_song_name && payload.new.current_song_name.includes("trivia")) {
          try {
            const triviaData = JSON.parse(payload.new.current_song_name);
            setCurrentTriviaQuestion(triviaData.question);
            setIsTriviaRound(true);
          } catch (parseError) {
            console.error('Error parsing trivia data from real-time update:', parseError);
          }
        } else if (payload.new.current_song_name) {
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
    }).subscribe();
    
    return () => {
      supabase.removeChannel(gameStateChannel);
    };
  }, [gameCode, isHost, setCurrentRound, setCurrentSong]);

  const updateGameState = async (phase: string) => {
    if (!isHost || !gameCode) return;
    const { error } = await supabase.from('game_state').update({
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
  }, [showYouTubeEmbed, isHost, updateGameState]);

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
    
    submitAllAnswers();
    setPhase('scoringFeedback');
    
    if (isHost) {
      updateGameState('results');
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
    submitAllAnswers();
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
    
    setUserSkippedQuestion(false);
    
    console.log(`Player ${playerName} selected answer: ${selectedIndex}`);
    setSelectedAnswer(selectedIndex);
    const currentTime = Date.now();
    const timeSinceStart = (currentTime - (gameStartTimeRef.current || currentTime)) / 1000;
    if (timeSinceStart <= 12) {
      setAnsweredEarly(true);
    }
    let points = 0;
    const isFinalPhase = timeSinceStart > 11.9;

    if (isFinalPhase) {
      points = isCorrect ? 4 : -2;
    } else {
      if (timeSinceStart <= 3) {
        points = 13;
      } else if (timeSinceStart <= 8) {
        points = Math.max(13 - Math.floor(timeSinceStart - 2), 5);
      }
    }
    if (!isCorrect && !isFinalPhase) {
      points = 0;
    }

    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[selectedIndex].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: selectedIndex,
      score: prev.score + points,
      pointsAwarded: true
    }));
    setShowAnswerConfirmation(true);
    if (gameCode && playerName) {
      try {
        console.log(`Updating score for player ${playerName} after answer`);
        supabase.from('players').update({
          hasAnswered: true,
          score: currentPlayer.score + points
        }).eq('game_code', gameCode).eq('name', playerName).then(({
          error
        }) => {
          if (error) {
            console.error('Error updating player after answer:', error);
          } else {
            console.log(`Successfully updated ${playerName} score after answer`);
          }
        });
      } catch (err) {
        console.error('Exception when updating player after answer:', err);
      }
    }
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
    
    setUserSkippedQuestion(true);
    
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
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילוגים`
    });
  };

  const handleTimeout = async () => {
    console.log('Timeout reached without selection');
    if (selectedAnswer !== null || currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log('Player already answered or points already awarded, skipping timeout handler');
      return;
    }

    console.log('No answer selected after timeout, moving to results');

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
      }, 4000); // Consistent 4-second delay
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const nextRound = async () => {
    if (!isHost) return;
    setAnsweredEarly(false);
    setSelectedAnswer(null);
    setTimerActive(false);
    setPlayerReady(false);
    setUserSkippedQuestion(false);
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
    
    try {
      const { error: roundUpdateError } = await supabase
        .from('game_state')
        .update({ current_round: newRoundCounter })
        .eq('game_code', gameCode);
        
      if (roundUpdateError) {
        console.error('Error updating round number:', roundUpdateError);
      }
    } catch (err) {
      console.error('Exception updating round number:', err);
    }
    
    if (newIsTriviaRound) {
      const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
      const selectedQuestion = triviaQuestions[randomIndex];
      setCurrentTriviaQuestion(selectedQuestion);
      
      const triviaData = {
        type: "trivia",
        question: selectedQuestion
      };
      
      const { error } = await supabase.from('game_state').update({
        current_song_name: JSON.stringify(triviaData),
        game_phase: 'playing'
      }).eq('game_code', gameCode);
      
      if (error) {
        console.error('Error storing trivia data:', error);
        toast({
          title: "שגיאה בשמירת נתוני הטריוויה",
          description: "אירעה שגיאה בשמירת נתוני הטריוויה",
          variant: "destructive"
        });
        return;
      }
    } else {
      updateGameState('playing');
    }
    
    setPhase('songPlayback');
    
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: newIsTriviaRound ? "סיבוב טריוויה עומד להתחיל" : "סיבוב חדש עומד להתחיל"
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
    
    setUserSkippedQuestion(false);
    
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
      description: isCorrect ? "תשובה נכונה!" : "התשובה שגויה, נסה בפעם הבאה"
    });
    if (isFinalPhase) {
      submitAllAnswers();
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <SongPlaybackPhase
            isTriviaRound={isTriviaRound}
            currentTriviaQuestion={currentTriviaQuestion}
            isHost={isHost}
            onStartTrivia={() => {
              updateGameState('answering');
              setPhase('answerOptions');
              gameStartTimeRef.current = Date.now();
            }}
            currentSong={currentSong}
            isPlaying={isPlaying}
            showYouTubeEmbed={showYouTubeEmbed}
            currentRound={currentRound}
            onPlaybackEnded={handleSongPlaybackEnded}
            onPlaybackError={handleSongPlaybackError}
            onPlaybackStarted={() => {
              if (currentRound) {
                gameStartTimeRef.current = Date.now();
              }
            }}
            onAnswer={handleAnswer}
            timeLeft={timeLeft}
            onSkip={handleSkip}
            skipsLeft={currentPlayer.skipsLeft}
            hasAnswered={currentPlayer.hasAnswered}
            gameStartTime={gameStartTimeRef.current}
          />
        );

      case 'answerOptions':
        const timeSinceStart = (Date.now() - (gameStartTimeRef.current || Date.now())) / 1000;
        const isFinalPhase = timeSinceStart > 8 || timeLeft <= 6;

        return (
          <AnswerOptionsPhase
            isTriviaRound={isTriviaRound}
            currentTriviaQuestion={currentTriviaQuestion}
            currentRound={currentRound}
            timerActive={timerActive}
            timeLeft={timeLeft}
            onTimerTimeout={handleTimerTimeout}
            isHost={isHost}
            currentPlayerScore={currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}
            skipsLeft={currentPlayer.skipsLeft}
            hasAnswered={currentPlayer.hasAnswered}
            selectedAnswer={selectedAnswer}
            isFinalPhase={isFinalPhase}
            answeredEarly={answeredEarly}
            onAnswer={isTriviaRound ? handleTriviaAnswer : handleAnswer}
            onSkip={handleSkip}
            gameStartTime={gameStartTimeRef.current}
          />
        );

      case 'scoringFeedback':
        return (
          <ScoringFeedback
            userSkippedQuestion={userSkippedQuestion}
            lastScore={currentPlayer.lastScore}
            lastAnswerCorrect={currentPlayer.lastAnswerCorrect}
            lastAnswer={currentPlayer.lastAnswer}
            currentRound={currentRound}
            isTriviaRound={isTriviaRound}
            isHost={isHost}
            onPlayFullSong={playFullSong}
          />
        );
      
      case 'leaderboard':
        return (
          <GameLeaderboard
            players={players}
            playerName={playerName || ''}
            isHost={isHost}
            onNextRound={nextRound}
            lastRoundScore={currentPlayer.lastScore}
            onPlayLastSong={isHost ? playFullSong : undefined}
          />
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
    if (phase === 'songPlayback') {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
    } else if (phase === 'scoringFeedback') {
      const timer = setTimeout(() => {
        setPhase('leaderboard');
      }, 100);
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (isHost && serverGamePhase === "playing") {
      playSong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, serverGamePhase]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10">
      <div className="container mx-auto px-4 py-6 relative z-10">
        <GameHeader gameCode={gameCode} isHost={isHost} />
        {renderPhase()}
      </div>
      <div className="w-full max-w-4xl mx-auto p-4 mb-8"></div>
    </div>
  );
};

export default GamePlay;
