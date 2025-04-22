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

type LocalGamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';
type ServerGamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

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
  const [phase, setPhase] = useState<LocalGamePhase>('songPlayback');
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

  const fetchPlayers = useCallback(async () => {
    if (!gameCode) return;
    try {
      const {
        data,
        error
      } = await supabase.from('players').select('*').eq('game_code', gameCode).order('score', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "שגיאה בטעינת שחקנים",
          description: "אירעה שגיאה בטעינת רשימת השחקנים",
          variant: "destructive"
        });
      } else {
        setPlayers(data);
      }
    } catch (err) {
      console.error('Exception when fetching players:', err);
    }
  }, [gameCode, toast]);
  useEffect(() => {
    fetchPlayers();
    const intervalId = setInterval(fetchPlayers, 5000);
    return () => clearInterval(intervalId);
  }, [fetchPlayers]);

  const updateGameState = async (newServerPhase: ServerGamePhase) => {
    if (!isHost) return;
    try {
      const {
        error
      } = await supabase.from('game_state').update({
        game_phase: newServerPhase
      }).eq('game_code', gameCode);
      if (error) {
        console.error('Error updating game state:', error);
        toast({
          title: "שגיאה בעדכון מצב המשחק",
          description: "אירעה שגיאה בעדכון מצב המשחק",
          variant: "destructive"
        });
      } else {
        console.log(`Game state updated to ${newServerPhase}`);
      }
    } catch (err) {
      console.error('Exception when updating game state:', err);
    }
  };

  const resetPlayersReadyStatus = async () => {
    if (!isHost) return;
    try {
      const {
        error
      } = await supabase.from('players').update({
        isReady: false
      }).eq('game_code', gameCode);
      if (error) {
        console.error('Error resetting player ready status:', error);
        toast({
          title: "שגיאה באיפוס מצב שחקן",
          description: "אירעה שגיאה באיפוס מצב השחקנים",
          variant: "destructive"
        });
      } else {
        console.log('Successfully reset all player ready statuses');
      }
    } catch (err) {
      console.error('Exception when resetting player ready statuses:', err);
    }
  };

  const resetPlayersAnsweredStatus = async () => {
    if (!isHost) return;
    try {
      const {
        error
      } = await supabase.from('players').update({
        hasAnswered: false
      }).eq('game_code', gameCode);
      if (error) {
        console.error('Error resetting player answered status:', error);
        toast({
          title: "שגיאה באיפוס מצב שחקן",
          description: "אירעה שגיאה באיפוס מצב השחקנים",
          variant: "destructive"
        });
      } else {
        console.log('Successfully reset all player answered statuses');
      }
    } catch (err) {
      console.error('Exception when resetting player answered statuses:', err);
    }
  };

  const createGameRound = () => {
    let availableSongs = [...defaultSongBank];
    if (gameSettings?.songFilter === "mashina") {
      availableSongs = [...mashinaSongs];
    } else if (gameSettings?.songFilter === "adam") {
      availableSongs = [...adamSongs];
    }
    const correctSongIndex = Math.floor(Math.random() * availableSongs.length);
    const correctSong = availableSongs[correctSongIndex];
    let options = [correctSong];
    availableSongs.splice(correctSongIndex, 1);
    while (options.length < 4 && availableSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSongs.length);
      options.push(availableSongs[randomIndex]);
      availableSongs.splice(randomIndex, 1);
    }
    options = options.sort(() => Math.random() - 0.5);
    const correctAnswerIndex = options.indexOf(correctSong);
    return {
      correctSong,
      options,
      correctAnswerIndex
    };
  };

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
    try {
      let currentScore = 0;
      let hasAlreadyAnswered = false;
      if (gameCode && playerName) {
        const {
          data,
          error
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (error) {
          console.error('Error getting player score:', error);
          return;
        }
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswerCorrect: isCorrect,
              lastScore: points
            }));
            setShowAnswerConfirmation(true);
            return;
          }
        }
      }
      const updatedScore = currentScore + points;
      console.log(`Answer: ${isCorrect ? 'Correct' : 'Incorrect'}, points: ${points}, new score: ${updatedScore}`);
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: isCorrect,
        lastScore: points,
        score: updatedScore,
        pointsAwarded: true
      }));
      setShowAnswerConfirmation(true);
      if (gameCode && playerName) {
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: updatedScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player score:', error);
        } else {
          console.log(`Successfully updated ${playerName}'s score to ${updatedScore}`);
        }
      }
    } catch (err) {
      console.error('Exception updating player answer:', err);
    }
    setTimeout(() => {
      setShowAnswerConfirmation(false);
    }, 2000);
    toast({
      title: isCorrect ? "כל הכבוד! תשובה נכונה!" : "אופס! תשובה שגויה!",
      description: isCorrect ? `קיבלת ${points} נקודות` : `איבדת ${Math.abs(points)} נקודות`
    });
    submitAllAnswers();
  };

  const handleSkip = async () => {
    if (selectedAnswer !== null || currentPlayer.skipsLeft <= 0 || !currentRound || currentPlayer.pointsAwarded) {
      console.log("Cannot skip: Already answered, no skips left, missing round data, or points already awarded");
      return;
    }
    setUserSkippedQuestion(true);
    try {
      const newSkipsLeft = Math.max(0, currentPlayer.skipsLeft - 1);
      setCurrentPlayer(prev => ({
        ...prev,
        skipsLeft: newSkipsLeft,
        hasAnswered: true,
        lastAnswer: 'skipped',
        lastAnswerCorrect: false,
        lastScore: 0,
        pointsAwarded: true
      }));
      if (gameCode && playerName) {
        const {
          error
        } = await supabase.from('players').update({
          skipsLeft: newSkipsLeft,
          hasAnswered: true
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player skips:', error);
          toast({
            title: "שגיאה בעדכון דילוגים",
            description: "אירעה שגיאה בעדכון מספר הדילוגים",
            variant: "destructive"
          });
        } else {
          console.log(`Successfully updated ${playerName}'s skips to ${newSkipsLeft}`);
        }
      }
      toast({
        title: "דילגת על השאלה",
        description: "עברת לשלב הבא ללא ניקוד"
      });
      submitAllAnswers();
    } catch (err) {
      console.error('Exception when skipping question:', err);
    }
  };

  const handleTriviaAnswer = async (isCorrect: boolean, selectedIndex: number) => {
    if (selectedAnswer !== null || currentPlayer.hasAnswered) {
      console.log("Already answered or missing round data - ignoring trivia selection");
      return;
    }
    setAnsweredEarly(true);
    setSelectedAnswer(selectedIndex);
    let points = isCorrect ? 15 : -5;
    try {
      let currentScore = 0;
      let hasAlreadyAnswered = false;
      if (gameCode && playerName) {
        const {
          data,
          error
        } = await supabase.from('players').select('score, hasAnswered').eq('game_code', gameCode).eq('name', playerName).maybeSingle();
        if (error) {
          console.error('Error getting player score for trivia:', error);
          return;
        }
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered this trivia. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswerCorrect: isCorrect,
              lastScore: points
            }));
            setShowAnswerConfirmation(true);
            return;
          }
        }
      }
      const updatedScore = currentScore + points;
      console.log(`Trivia answer: ${isCorrect ? 'Correct' : 'Incorrect'}, points: ${points}, new score: ${updatedScore}`);
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: isCorrect,
        lastScore: points,
        score: updatedScore,
        pointsAwarded: true
      }));
      setShowAnswerConfirmation(true);
      if (gameCode && playerName) {
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true,
          score: updatedScore
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player score for trivia:', error);
        } else {
          console.log(`Successfully updated ${playerName}'s score to ${updatedScore} for trivia`);
        }
      }
    } catch (err) {
      console.error('Exception updating player trivia answer:', err);
    }
    setTimeout(() => {
      setShowAnswerConfirmation(false);
    }, 2000);
    toast({
      title: isCorrect ? "כל הכבוד! תשובה נכונה!" : "אופס! תשובה שגויה!",
      description: isCorrect ? `קיבלת ${points} נקודות` : `איבדת ${Math.abs(points)} נקודות`
    });
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
    if (newIsTriviaRound) {
      const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
      setCurrentTriviaQuestion(triviaQuestions[randomIndex]);
      setCurrentSong(null);
      updateGameState('answering');
      setPhase('answerOptions');
      setTimerActive(true);
      gameStartTimeRef.current = Date.now();
      toast({
        title: "סיבוב טריוויה!",
        description: "ענה על שאלת הטריוויה וזכה בנקודות"
      });
    } else {
      setCurrentTriviaQuestion(null);
      updateGameState('playing');
      setPhase('songPlayback');
      playSong();
    }
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
  };

  const handleTimeout = async () => {
    if (currentPlayer.hasAnswered || selectedAnswer !== null) {
      console.log("Already answered or selected an answer - ignoring timeout");
      return;
    }
    console.log('Timeout reached - submitting empty answer');
    try {
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswer: 'timeout',
        lastAnswerCorrect: false,
        lastScore: 0,
        pointsAwarded: true
      }));
      if (gameCode && playerName) {
        const {
          error
        } = await supabase.from('players').update({
          hasAnswered: true
        }).eq('game_code', gameCode).eq('name', playerName);
        if (error) {
          console.error('Error updating player on timeout:', error);
          toast({
            title: "שגיאה בעדכון זמן תפוגה",
            description: "אירעה שגיאה בעדכון זמן התפוגה של השחקן",
            variant: "destructive"
          });
        } else {
          console.log(`Successfully updated ${playerName} for timeout`);
        }
      }
      toast({
        title: "הזמן נגמר!",
        description: "לא הספקת לענות בזמן"
      });
      submitAllAnswers();
    } catch (err) {
      console.error('Exception when handling timeout:', err);
    }
  };

  const submitAllAnswers = async () => {
    if (!isHost) return;
    setTimerActive(false);
    try {
      const {
        data,
        error
      } = await supabase.from('players').select('name, hasAnswered').eq('game_code', gameCode);
      if (error) {
        console.error('Error fetching player answer status:', error);
        toast({
          title: "שגיאה בטעינת תשובות",
          description: "אירעה שגיאה בטעינת סטטוס התשובות של השחקנים",
          variant: "destructive"
        });
        return;
      }
      const allAnswered = data.every(player => player.hasAnswered);
      setAllPlayersAnswered(allAnswered);
      if (allAnswered) {
        console.log('All players have answered - showing results');
        updateGameState('results');
        setPhase('scoringFeedback');
      } else {
        console.log('Not all players have answered yet');
        const notAnswered = data.filter(player => !player.hasAnswered).map(player => player.name);
        toast({
          title: "מחכה לשחקנים...",
          description: `מחכה לתשובות מ: ${notAnswered.join(', ')}`
        });
      }
    } catch (err) {
      console.error('Exception when submitting all answers:', err);
    }
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
          <MusicNote isPlaying={isPlaying} className="w-32 h-32 text-primary mb-4" type="note1" />
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
              isActive={timerActive}
              onTimeout={handleTimerTimeout}
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
            <div className={`fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg shadow-lg z-50 ${currentPlayer.lastAnswerCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
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
                      {player.name === playerName && currentPlayer.lastScore !== undefined && (
                        <span className={`${currentPlayer.lastScore > 0 ? 'text-green-500' : currentPlayer.lastScore < 0 ? 'text-red-500' : 'text-gray-500'} font-bold`}>
                          {currentPlayer.lastScore > 0 ? `+${currentPlayer.lastScore}` : currentPlayer.lastScore}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {isHost && (
            <div className="mt-8 flex space-x-4 rtl:space-x-reverse">
              <AppButton onClick={nextRound} className="px-6 py-3 text-lg">
                <Play className="mr-2" />
                סיבוב הבא
              </AppButton>
              <AppButton variant="outline" onClick={resetAllPlayerScores} className="px-6 py-3 text-lg">
                <Clock className="mr-2" />
                איפוס ניקוד
              </AppButton>
            </div>
          )}
          
          {!isHost && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-lg font-medium">ממתין למנחה שיתחיל את הסיבוב הבא...</p>
            </div>
          )}
        </div>
      )}
      
      {showYouTubeEmbed && currentRound?.correctSong.embedUrl && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="relative w-full max-w-3xl">
            <AppButton 
              variant="outline" 
              onClick={() => setShowYouTubeEmbed(false)} 
              className="absolute top-4 right-4 z-10 bg-white/80"
            >
              סגור
            </AppButton>
            <SongPlayer
              url={currentRound.correctSong.embedUrl}
              isPlaying={true}
              onEnded={() => setShowYouTubeEmbed(false)}
              fullWidth={true}
            />
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <LeaveGameButton gameCode={gameCode || ''} />
        {isHost && <EndGameButton gameCode={gameCode} />}
      </div>
    </div>
  );
};

export default GamePlay;
