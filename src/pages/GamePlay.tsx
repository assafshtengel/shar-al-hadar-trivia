import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import GameTimer from '@/components/GameTimer';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy, CheckCircle2, Youtube, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useGameState } from '@/contexts/GameStateContext';
import { supabase, fetchSongsFromSupabase } from '@/integrations/supabase/client';
import EndGameButton from '@/components/EndGameButton';
import { 
  defaultSongBank, 
  createGameRound, 
  Song, 
  convertSupabaseSongToSong,
  fetchSongsForGame
} from '@/data/songBank';
import SongPlayer from '@/components/SongPlayer';
import LeaveGameButton from '@/components/LeaveGameButton';

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
  const [songsLoaded, setSongsLoaded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    name: playerName || "שחקן נוכחי",
    score: 0,
    skipsLeft: 3,
    hasAnswered: false,
    isReady: false,
    pendingAnswer: null,
    pointsAwarded: false
  });

  const checkAllPlayersAnswered = useCallback(async () => {
    if (!gameCode) return false;
    const { data, error } = await supabase
      .from('players')
      .select('hasAnswered')
      .eq('game_code', gameCode);
    
    if (error || !data) {
      console.error('Error checking if all players answered:', error);
      return false;
    }
    
    return data.every(player => player.hasAnswered);
  }, [gameCode]);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const loadedSongs = await fetchSongsForGame(100);
        if (loadedSongs.length === 0) {
          console.warn('No songs found in Supabase, using default song bank');
          setSongs(defaultSongBank.filter(song => song.embedUrl || song.spotifyUrl));
        } else {
          console.log(`Loaded ${loadedSongs.length} songs from Supabase`);
          setSongs(loadedSongs.filter(song => song.embedUrl));
        }
        setSongsLoaded(true);
      } catch (error) {
        console.error('Error loading songs from Supabase:', error);
        setSongs(defaultSongBank.filter(song => song.embedUrl || song.spotifyUrl));
        setSongsLoaded(true);
      }
    };

    loadSongs();
  }, []);

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
    console.log('Server game phase changed:', serverGamePhase);
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
          console.log('Setting timer active for non-host in answering phase');
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

  function createGameRound(): GameRound {
    if (songs.length === 0) {
      console.warn('No songs available to create a round');
      return {
        correctSong: defaultSongBank[0],
        options: defaultSongBank.slice(0, 4),
        correctAnswerIndex: 0
      };
    }

    const randomIndex = Math.floor(Math.random() * songs.length);
    const correctSong = songs[randomIndex];
    const otherSongs = songs.filter(song => song.id !== correctSong.id && song.title);
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
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showYouTubeEmbed, isHost]);

  const playSong = async () => {
    if (!isHost) return;
    
    if (!songsLoaded) {
      toast({
        title: "ממתין לטעינת השירים",
        description: "אנא המתן מספר שניות לסיום טעינת השירים"
      });
      return;
    }
    
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

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered || !currentRound || currentPlayer.pointsAwarded) {
      console.log("Already answered or missing round data or points already awarded - ignoring selection");
      return;
    }
    console.log(`Player ${playerName} selected answer: ${index}`);
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    const points = isCorrect ? 10 : 0;
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
              lastAnswer: currentRound.options[index].title,
              lastAnswerCorrect: isCorrect,
              lastScore: points,
              pendingAnswer: index,
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
      lastAnswer: currentRound.options[index].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      pendingAnswer: index,
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
    if (timeLeft <= 0) {
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
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילוגים`
    });
  };

  const handleTimeout = async () => {
    console.log('Timeout reached without selection');
    if (selectedAnswer !== null || currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log('Player already answered or points already awarded, skipping timeout handler');
      return;
    }
    if (playerName && gameCode) {
      const {
        data
      } = await supabase.from('players').select('hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
      if (data && data.hasAnswered) {
        console.log(`Player ${playerName} already marked as answered, skipping timeout update`);
        setCurrentPlayer(prev => ({
          ...prev,
          hasAnswered: true,
          lastAnswerCorrect: false,
          lastScore: 0,
          pointsAwarded: true
        }));
        return;
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
        lastScore: 0,
        pointsAwarded: true
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
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, isHost]);

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
      pendingAnswer: null,
      pointsAwarded: false
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
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
            
            <SongPlayer 
              song={currentSong} 
              isPlaying={isPlaying && showYouTubeEmbed} 
              onPlaybackEnded={handleSongPlaybackEnded} 
              onPlaybackError={handleSongPlaybackError} 
            />
            
            <AppButton 
              variant="primary" 
              size="lg" 
              onClick={playSong} 
              className="max-w-xs" 
              disabled={!isHost || isPlaying}
            >
              {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
              <Play className="mr-2" />
            </AppButton>
            
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
        
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <GameTimer initialSeconds={10} isActive={true} onTimeout={handleTimerTimeout} />
            
            <div className="flex items-center">
              <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
              <SkipForward className="ml-2 text-secondary" />
            </div>
            
            <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
            
            {currentRound && (
              <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {currentRound.options.map((song, index) => (
                  <div key={index} className="relative">
                    <AppButton 
                      variant={selectedAnswer === index ? "primary" : "secondary"} 
                      className={`${selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""} w-full`} 
                      disabled={selectedAnswer !== null} 
                      onClick={() => handleAnswer(index)}
                    >
                      {song.title}
                    </AppButton>
                    {selectedAnswer === index && showAnswerConfirmation && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {currentPlayer.lastAnswerCorrect ? (
                          <CheckCircle2 className="text-green-500 w-6 h-6" />
                        ) : (
                          <div className="text-red-500 w-6 h-6">✗</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <AppButton 
              variant="secondary" 
              onClick={handleSkip} 
              disabled={currentPlayer.skipsLeft <= 0 || selectedAnswer !== null || currentPlayer.hasAnswered}
              className="max-w-xs"
            >
              דלג על השאלה
              <SkipForward className="mr-2" />
            </AppButton>
          </div>
        );
        
      case 'scoringFeedback':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-8">
            <h2 className="text-3xl font-bold text-primary">תוצאות</h2>
            
            {currentRound && (
              <div className="bg-primary/5 p-6 rounded-xl w-full max-w-md">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">השיר הנכון:</h3>
                  <div className="text-2xl font-bold text-primary mb-4">{currentRound.correctSong.title}</div>
                  <div className="text-lg text-gray-600 mb-2">
                    {currentRound.correctSong.artist && `מאת: ${currentRound.correctSong.artist}`}
                  </div>
                  {currentRound.correctSong.fullUrl && isHost && (
                    <AppButton 
                      variant="secondary" 
                      onClick={playFullSong} 
                      className="mt-4"
                    >
                      <Youtube className="mr-2" />
                      השמע את השיר המלא
                    </AppButton>
                  )}
                </div>
                
                {playerName && currentPlayer.lastAnswerCorrect !== undefined && (
                  <div className={`mt-6 p-4 rounded-lg text-center ${currentPlayer.lastAnswerCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h4 className="font-bold mb-2">
                      {currentPlayer.lastAnswerCorrect ? 'כל הכבוד!' : 'לא נורא...'}
                    </h4>
                    <p>
                      {currentPlayer.lastAnswerCorrect 
                        ? `זיהית נכון וקיבלת ${currentPlayer.lastScore} נקודות` 
                        : 'לא הצלחת לזהות את השיר הפעם'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-4">טבלת ניקוד</h2>
            
            <div className="relative overflow-x-auto rounded-lg shadow-md w-full max-w-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">דירוג</TableHead>
                    <TableHead>שם</TableHead>
                    <TableHead className="text-center">ניקוד</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id} className={playerName === player.name ? 'bg-primary/10' : ''}>
                      <TableCell className="text-center font-bold">
                        {index === 0 ? <Crown className="inline-block text-yellow-500 h-5 w-5" /> : index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-center">{player.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {isHost && (
              <div className="flex flex-col space-y-4 w-full max-w-md">
                <AppButton 
                  variant="primary" 
                  onClick={nextRound}
                >
                  התחל סיבוב חדש
                  <Play className="mr-2" />
                </AppButton>
                
                <AppButton 
                  variant="secondary" 
                  onClick={resetAllPlayerScores}
                >
                  אפס ניקוד לכולם
                  <Award className="mr-2" />
                </AppButton>
                
                <EndGameButton gameCode={gameCode || ""} />
              </div>
            )}
            
            {!isHost && (
              <div className="text-center mt-4">
                <p className="text-gray-600 mb-4">ממתין למנהל המשחק להתחיל סיבוב חדש...</p>
                <LeaveGameButton gameCode={gameCode || ""} />
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">טוען משחק...</h2>
              <p>אנא המתן</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">משחק השירים</h1>
            <p className="text-gray-600">קוד משחק: {gameCode}</p>
          </div>
          {playerName && (
            <div className="text-right">
              <div className="text-xl font-bold">{playerName}</div>
              <div className="flex items-center justify-end">
                <span className="text-primary font-bold">{currentPlayer.score} נקודות</span>
                <Trophy className="ml-2 text-primary h-5 w-5" />
              </div>
            </div>
          )}
        </div>
        
        {renderPhase()}
      </div>
    </div>
  );
};

export default GamePlay;
