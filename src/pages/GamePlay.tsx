import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Music, Play, SkipForward } from 'lucide-react';
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import { defaultSongBank } from '@/data/songBank';
import SongPlayer from '@/components/SongPlayer';
import TriviaQuestion from '@/components/TriviaQuestion';
import { triviaQuestions } from '@/data/triviaQuestions';
import { mashinaSongs } from "@/data/songs/mashina";
import { adamSongs } from "@/data/songs/adam";
import { GamePhase, GameRound, PendingAnswerUpdate } from '@/types/game';
import { useGamePlayPlayers } from '@/hooks/useGamePlayPlayers';
import GameHeader from '@/components/GameHeader';
import GameLeaderboard from '@/components/GameLeaderboard';
import ScoringFeedback from '@/components/ScoringFeedback';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import GameTimer from '@/components/GameTimer';
import { Song } from '@/types/game';
import { Clock, Award, Crown, Trophy, CheckCircle2, Youtube } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface SongPlaybackProps {
  currentSong: Song | null;
  isPlaying: boolean;
  showYouTubeEmbed: boolean;
  isHost: boolean;
  currentRound: GameRound | null;
  handleSongPlaybackEnded: () => void;
  handleSongPlaybackError: () => void;
  gameStartTimeRef: React.MutableRefObject<number | null>;
  updateGameState: (phase: string) => Promise<void>;
  setPhase: React.Dispatch<React.SetStateAction<GamePhase>>;
}

const SongPlayback: React.FC<SongPlaybackProps> = ({
  currentSong,
  isPlaying,
  showYouTubeEmbed,
  isHost,
  currentRound,
  handleSongPlaybackEnded,
  handleSongPlaybackError,
  gameStartTimeRef,
  updateGameState,
  setPhase
}) => {
  const [isTriviaRound, setIsTriviaRound] = useState<boolean>(false);
  const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<any | null>(null);

  useEffect(() => {
    if (currentRound) {
      setIsTriviaRound(false);
      setCurrentTriviaQuestion(null);
    }
  }, [currentRound]);

  useEffect(() => {
    if (currentTriviaQuestion) {
      setIsTriviaRound(true);
    } else {
      setIsTriviaRound(false);
    }
  }, [currentTriviaQuestion]);

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
          onAnswer={() => {}}
          timeUp={false} 
          answerStartTime={gameStartTimeRef.current || Date.now()} 
          elapsedTime={(Date.now() - (gameStartTimeRef.current || Date.now())) / 1000}
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
};

interface AnswerOptionsProps {
  timerActive: boolean;
  currentPlayer: any;
  currentRound: GameRound | null;
  isTriviaRound: boolean;
  timeLeft: number;
  selectedAnswer: number | null;
  answeredEarly: boolean;
  handleSkip: () => Promise<void>;
  handleAnswer: (isCorrect: boolean, selectedIndex: number) => Promise<void>;
  submitAllAnswers: () => Promise<void>;
  gameStartTimeRef: React.MutableRefObject<number | null>;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  timerActive,
  currentPlayer,
  currentRound,
  isTriviaRound,
  timeLeft,
  selectedAnswer,
  answeredEarly,
  handleSkip,
  handleAnswer,
  submitAllAnswers,
  gameStartTimeRef
}) => {
  const timeSinceStart = (Date.now() - (gameStartTimeRef.current || Date.now())) / 1000;
  const isFinalPhase = timeSinceStart > 8 || timeLeft <= 6;

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <GameTimer initialSeconds={8} isActive={timerActive} onTimeout={submitAllAnswers} />

      <div className="text-xl font-semibold text-primary">
        הניקוד שלך בסיבוב זה: {currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}
      </div>

      <div className="flex items-center">
        <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
        <SkipForward className="ml-2 text-secondary" />
      </div>

      {isTriviaRound ? (
        <TriviaQuestion
          question={{
            question: "שאלת טריוויה",
            options: [],
            correctAnswerIndex: 0
          }}
          onAnswer={() => {}}
          timeUp={timeLeft <= 0}
          answerStartTime={gameStartTimeRef.current || Date.now()}
          elapsedTime={timeSinceStart}
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

      {currentPlayer.hasAnswered && !isFinalPhase && (
        <div className="text-lg text-yellow-700 bg-yellow-100 border border-yellow-300 mt-4 p-4 rounded-md w-full text-center">
          בחרת תשובה בסיבוב זה , אנו מחכים לתשובות משאר המשתתפים .
        </div>
      )}
    </div>
  );
};

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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roundCounter, setRoundCounter] = useState<number>(1);
  const [isTriviaRound, setIsTriviaRound] = useState<boolean>(false);
  const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<any | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const [answeredEarly, setAnsweredEarly] = useState(false);
  const [userSkippedQuestion, setUserSkippedQuestion] = useState(false);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    players,
    setPlayers,
    currentPlayer,
    setCurrentPlayer,
    checkAllPlayersAnswered,
    checkAllPlayersReady,
    resetPlayersAnsweredStatus,
    resetPlayersReadyStatus,
    resetAllPlayerScores,
    batchUpdatePlayerScores
  } = useGamePlayPlayers(gameCode, playerName);

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
  }, [serverGamePhase, isHost, selectedAnswer, currentPlayer.hasAnswered]);

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
  }, [showYouTubeEmbed, isHost, updateGameState, setPhase]);

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

  useEffect(() => {
    if (phase === 'scoringFeedback') {
      const timer = setTimeout(() => {
        setPhase('leaderboard');
      }, 100);
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
