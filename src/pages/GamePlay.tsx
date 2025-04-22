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
  const [userSkippedQuestion, setUserSkippedQuestion] = useState(false);

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
  }, [gameCode, isHost]);

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
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined,
      pendingAnswer: null,
      pointsAwarded: false
    }));
    
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
    if (selectedAnswer !== null || currentPlayer.hasAnswered) {
      console.log("Already answered or missing round data - ignoring selection");
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
    if (!isCorrect) {
      points = isFinalPhase ? -2 : 0;
    }
    
    let currentScore = 0;
    let hasAlreadyAnswered = false;
    
    if (gameCode && playerName) {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('score, hasAnswered')
          .eq('game_code', gameCode)
          .eq('name', playerName)
          .maybeSingle();
          
        if (error) {
          console.error('Error getting player score:', error);
          return;
        }
        
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered this round. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswer: currentRound?.options[selectedIndex].title,
              lastAnswerCorrect: isCorrect,
              lastScore: points
            }));
            setShowAnswerConfirmation(true);
            return;
          }
        }
      } catch (err) {
        console.error('Exception when getting player score:', err);
      }
    }
    
    const updatedScore = currentScore + points;
    console.log(`Calculating new score: ${currentScore} + ${points} = ${updatedScore}`);
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound?.options[selectedIndex].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: selectedIndex,
      score: updatedScore,
      pointsAwarded: true
    }));
    
    setShowAnswerConfirmation(true);
    
    if (gameCode && playerName) {
      try {
        const { error } = await supabase
          .from('players')
          .update({
            hasAnswered: true,
            score: updatedScore
          })
          .eq('game_code', gameCode)
          .eq('name', playerName);
          
        if (error) {
          console.error('Error updating player score:', error);
        } else {
          console.log(`Successfully updated ${playerName}'s score to ${updatedScore}`);
        }
      } catch (err) {
        console.error('Error updating player data:', err);
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
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase, isHost]);

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
      
      toast({
        title: "שאלת טריוויה",
        description: "מציג שאלת טריוויה"
      });
      
    } else {
      playSong();
    }
  };

  const handleTriviaAnswer = async (isCorrect: boolean, selectedIndex: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered) {
      console.log("Already answered trivia question - ignoring selection");
      return;
    }
    
    console.log(`Player ${playerName} selected trivia answer: ${selectedIndex}, isCorrect: ${isCorrect}`);
    setSelectedAnswer(selectedIndex);
    
    const points = isCorrect ? 15 : -5;
    let currentScore = 0;
    
    try {
      if (gameCode && playerName) {
        const { data, error } = await supabase
          .from('players')
          .select('score, hasAnswered')
          .eq('game_code', gameCode)
          .eq('name', playerName)
          .maybeSingle();
          
        if (error) {
          console.error('Error getting player score for trivia:', error);
          return;
        }
        
        if (data) {
          currentScore = data.score || 0;
          
          if (data.hasAnswered) {
            console.log(`Player ${playerName} has already answered this trivia question. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswerCorrect: isCorrect,
              lastScore: points
            }));
            return;
          }
        }
      }
    } catch (err) {
      console.error('Exception when getting player score for trivia:', err);
    }
    
    const updatedScore = currentScore + points;
    console.log(`Trivia answer score calculation: ${currentScore} + ${points} = ${updatedScore}`);
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: updatedScore,
      pointsAwarded: true
    }));
    
    if (gameCode && playerName) {
      try {
        const { error } = await supabase
          .from('players')
          .update({
            hasAnswered: true,
            score: updatedScore
          })
          .eq('game_code', gameCode)
          .eq('name', playerName);
          
        if (error) {
          console.error('Error updating player score for trivia:', error);
        } else {
          console.log(`Successfully updated ${playerName}'s score to ${updatedScore} after trivia answer`);
        }
      } catch (err) {
        console.error('Error updating player data for trivia:', err);
      }
    }
    
    toast({
      title: isCorrect ? "נכון מאוד!" : "לא נכון",
      description: isCorrect ? "תשובה נכונה לשאלת הטריוויה!" : "תשובה שגויה לשאלת הטריוויה"
    });
    
    setTimeout(() => {
      submitAllAnswers();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-center p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">קוד משחק: {gameCode}</h2>
          {isHost && <p className="text-sm text-muted-foreground">אתה המנחה</p>}
        </div>
        <div className="flex flex-col items-end">
          <h2 className="text-2xl font-bold text-primary">שלום, {playerName}</h2>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <p className="text-lg text-secondary-foreground">ניקוד: <span className="font-bold">{currentPlayer.score}</span></p>
            {currentPlayer.lastScore !== undefined && (
              <span className={`${currentPlayer.lastScore > 0 ? 'text-green-500' : currentPlayer.lastScore < 0 ? 'text-red-500' : 'text-gray-500'} font-bold text-sm`}>
                {currentPlayer.lastScore > 0 ? `+${currentPlayer.lastScore}` : currentPlayer.lastScore}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {phase === 'songPlayback' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <MusicNote isPlaying={isPlaying} className="w-32 h-32 text-primary mb-4" />
          
          {isPlaying && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">האזינו בקשב!</h2>
              <p className="text-xl">זהו את השיר...</p>
            </div>
          )}
          
          {showYouTubeEmbed && currentSong?.embedUrl && !isTriviaRound && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
              <SongPlayer 
                url={currentSong.embedUrl} 
                isPlaying={isPlaying}
                onEnded={handleSongPlaybackEnded}
                onError={handleSongPlaybackError}
              />
            </div>
          )}
          
          {!isPlaying && isHost && (
            <div className="flex flex-col items-center space-y-4 mt-12">
              <AppButton onClick={playSong} className="px-6 py-3 text-lg">
                <Play className="mr-2" />
                השמע שיר
              </AppButton>
              
              <p className="text-gray-500 mt-2">לחץ כדי להתחיל את הסיבוב</p>
            </div>
          )}
          
          {!isPlaying && !isHost && (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">ממתין למנחה שיתחיל את הסיבוב...</h3>
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-2 rtl:space-x-reverse">
                  <div className="h-3 w-3 bg-primary rounded-full"></div>
                  <div className="h-3 w-3 bg-primary rounded-full delay-75"></div>
                  <div className="h-3 w-3 bg-primary rounded-full delay-150"></div>
                </div>
              </div>
            </div>
          )}
          
          {isTriviaRound && currentTriviaQuestion && (
            <div className="w-full max-w-4xl mx-auto">
              <TriviaQuestion 
                question={currentTriviaQuestion}
                onAnswer={handleTriviaAnswer}
                timeUp={false}
                showOptions={true}
                isFinalPhase={false}
                showQuestion={true}
              />
            </div>
          )}
        </div>
      )}
      
      {phase === 'answerOptions' && !isTriviaRound && currentRound && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">מה השם של השיר ששמעת?</h2>
          
          {timerActive && (
            <GameTimer 
              initialSeconds={answerTimeLimit || 20} 
              onTimerEnd={handleTimerTimeout}
              setTimeLeft={setTimeLeft}
            />
          )}
          
          {currentPlayer.hasAnswered && !userSkippedQuestion ? (
            <div className="p-4 bg-gray-100 rounded-md mb-6">
              <p className="font-medium">כבר ענית על השאלה. ממתין לשאר השחקנים...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-6">
              {currentRound.options.map((option, index) => (
                <AppButton
                  key={index}
                  className={`p-4 text-lg ${selectedAnswer === index ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleAnswer(index === currentRound.correctAnswerIndex, index)}
                  disabled={currentPlayer.hasAnswered || timeLeft <= 0}
                >
                  {option.title}
                </AppButton>
              ))}
            </div>
          )}
          
          {!currentPlayer.hasAnswered && currentPlayer.skipsLeft > 0 && (
            <AppButton 
              variant="outline" 
              onClick={handleSkip}
              className="mt-2"
              disabled={timeLeft <= 0}
            >
              <SkipForward className="mr-2" />
              דלג ({currentPlayer.skipsLeft} נותרו)
            </AppButton>
          )}
          
          {showAnswerConfirmation && (
            <div className={`fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg shadow-lg z-50 ${
              currentPlayer.lastAnswerCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <p className="text-xl font-bold">
                {currentPlayer.lastAnswerCorrect ? '✓ תשובה נכונה!' : '✗ תשובה שגויה!'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {phase === 'answerOptions' && isTriviaRound && currentTriviaQuestion && (
        <div className="w-full max-w-4xl mx-auto">
          <TriviaQuestion 
            question={currentTriviaQuestion}
            onAnswer={handleTriviaAnswer}
            timeUp={timeLeft <= 0}
            showOptions={true}
            isFinalPhase={timeLeft <= 0}
            hasAnsweredEarly={answeredEarly}
          />
        </div>
      )}
      
      {phase === 'scoringFeedback' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary mb-6">תוצאות</h2>
          
          {isTriviaRound && currentTriviaQuestion ? (
            <div className="bg-white rounded-lg shadow-md p-6 w-full mb-8">
              <h3 className="text-xl font-bold mb-3">שאלת טריוויה</h3>
              <p className="text-lg mb-4">{currentTriviaQuestion.question}</p>
              <p className="font-medium">התשובה הנכונה: {currentTriviaQuestion.options[currentTriviaQuestion.correctAnswerIndex]}</p>
            </div>
          ) : currentRound ? (
            <div className="bg-white rounded-lg shadow-md p-6 w-full mb-8">
              <h3 className="text-xl font-bold mb-3">השיר הנכון הוא:</h3>
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{currentRound.correctSong.title}</p>
                  <p className="text-lg">{currentRound.correctSong.artist}</p>
                </div>
                
                {currentRound.correctSong.embedUrl && (
                  <AppButton variant="outline" onClick={() => setShowYouTubeEmbed(true)} className="mt-4 md:mt-0">
                    <Youtube size={20} className="mr-2" />
                    צפה בקליפ המלא
                  </AppButton>
                )}
              </div>
            </div>
          ) : null}
          
          <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">ניקוד שחקנים</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שחקן</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
                  <TableHead className="text-right">שינוי</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className={player.name === playerName ? 'bg-primary/10' : ''}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.score}</TableCell>
                    <TableCell>
                      {player.name === playerName && currentPlayer.lastScore !== undefined ? (
                        <span className={`font-bold ${
                          currentPlayer.lastScore > 0 ? 'text-green-600' : 
                          currentPlayer.lastScore < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {currentPlayer.lastScore > 0 ? `+${currentPlayer.lastScore}` : currentPlayer.lastScore}
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {phase === 'leaderboard' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Trophy className="text-yellow-500 w-8 h-8 mr-2" />
            <h2 className="text-3xl font-bold text-primary">טבלת המובילים</h2>
          </div>
          
          <div className="w-full mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">דירוג</TableHead>
                  <TableHead className="text-right">שחקן</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id} className={player.name === playerName ? 'bg-primary/10' : ''}>
                    <TableCell>
                      <div className="flex items-center">
                        {index === 0 && <Crown className="text-yellow-500 w-5 h-5 mr-1" />}
                        {index === 1 && <Award className="text-gray-400 w-5 h-5 mr-1" />}
                        {index === 2 && <Award className="text-amber-600 w-5 h-5 mr-1" />}
                        {index > 2 && <span>{index + 1}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {isHost && (
            <div className="flex flex-col md:flex-row gap-4">
              <AppButton onClick={nextRound}>
                סיבוב הבא
              </AppButton>
              <AppButton variant="outline" onClick={resetAllPlayerScores}>
                אפס ניקוד
              </AppButton>
              <EndGameButton gameCode={gameCode} />
            </div>
          )}
          
          {!isHost && (
            <div className="text-center mt-4">
              <p className="mb-4">ממתין למנחה שיתחיל את הסיבוב הבא...</p>
              <LeaveGameButton />
            </div>
          )}
        </div>
      )}
      
      {showYouTubeEmbed && currentSong?.embedUrl && phase === 'scoringFeedback' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="relative w-full max-w-3xl">
            <button 
              onClick={() => setShowYouTubeEmbed(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md"
            >
              ✕
            </button>
            <SongPlayer 
              url={currentSong.embedUrl} 
              isPlaying={true}
              onEnded={() => setShowYouTubeEmbed(false)}
              fullWidth={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
