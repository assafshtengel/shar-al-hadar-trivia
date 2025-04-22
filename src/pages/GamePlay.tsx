import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Badge } from "@/components/ui/badge";

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

  const fetchPlayers = useCallback(async () => {
    if (!gameCode) return;

    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('game_code', gameCode)
      .order('score', { ascending: false });

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return;
    }

    if (playersData) {
      setPlayers(playersData);
    }
  }, [gameCode]);

  const updatePlayerReadiness = useCallback(async (isReady: boolean) => {
    if (!gameCode || !playerName) return;

    const { error } = await supabase
      .from('players')
      .update({ isReady })
      .eq('game_code', gameCode)
      .eq('name', playerName);

    if (error) {
      console.error("Error updating player readiness:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון המוכנות שלך",
        variant: "destructive"
      });
    } else {
      setPlayerReady(isReady);
      toast({
        title: "מוכנות עודכנה",
        description: `השתנת ל ${isReady ? 'מוכן' : 'לא מוכן'}`,
      });
    }
  }, [gameCode, playerName, toast]);

  const startGameRound = useCallback(async () => {
    if (!isHost || !gameCode) return;

    // Determine if this round should be a trivia round
    const shouldBeTrivia = Math.random() < (gameSettings?.triviaRoundChance || 0.2);
    setIsTriviaRound(shouldBeTrivia);

    let song: Song;
    let triviaQuestion: TriviaQuestionType | null = null;

    if (shouldBeTrivia) {
      // Select a random trivia question
      const randomIndex = Math.floor(Math.random() * triviaQuestions.length);
      triviaQuestion = triviaQuestions[randomIndex];
      setCurrentTriviaQuestion(triviaQuestion);

      // Ensure the correct answer index is within the bounds of the options array
      if (triviaQuestion && triviaQuestion.correctAnswerIndex >= triviaQuestion.options.length) {
        console.error("Invalid correctAnswerIndex in trivia question:", triviaQuestion);
        toast({
          title: "שגיאה",
          description: "שאלת טריוויה לא תקינה",
          variant: "destructive"
        });
        return;
      }

      // Create a dummy song object for trivia rounds
      song = {
        id: 'trivia',
        title: 'Trivia Round',
        artist: 'Trivia',
        embedUrl: '', // No song to play
      };
    } else {
      // Select a random song
      const songBank = gameSettings?.songList === 'mashina' ? mashinaSongs : gameSettings?.songList === 'adam' ? adamSongs : defaultSongBank;
      const randomIndex = Math.floor(Math.random() * songBank.length);
      song = songBank[randomIndex];
      setCurrentTriviaQuestion(null);
    }

    setCurrentSong(song);

    // Generate answer options
    const options = [song];
    while (options.length < 4) {
      const randomSong = defaultSongBank[Math.floor(Math.random() * defaultSongBank.length)];
      if (!options.find(s => s.id === randomSong.id)) {
        options.push(randomSong);
      }
    }
    options.sort(() => Math.random() - 0.5);

    const correctAnswerIndex = options.findIndex(s => s.id === song.id);
    const round: GameRound = {
      correctSong: song,
      options,
      correctAnswerIndex,
    };
    setCurrentRound(round);

    // Update game state on the server
    const { data, error } = await supabase
      .from('game_state')
      .update({
        game_phase: 'songPlayback',
        current_song_id: song.id,
        current_round: round,
        round_counter: roundCounter,
        is_trivia_round: shouldBeTrivia,
        current_trivia_question: triviaQuestion,
      })
      .eq('game_code', gameCode);

    if (error) {
      console.error("Error starting game round:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בתחילת הסיבוב",
        variant: "destructive"
      });
    } else {
      setRoundCounter(prev => prev + 1);
    }
  }, [gameCode, isHost, toast, gameSettings?.songList, gameSettings?.triviaRoundChance, roundCounter]);

  const handleAnswerSelection = useCallback(async (selectedIndex: number, isCorrect: boolean) => {
    if (!gameCode || !playerName || !currentRound) return;

    setAnsweredEarly(timerActive);

    // Optimistically update the local state
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[selectedIndex].title,
      lastAnswerCorrect: isCorrect,
      pendingAnswer: isCorrect ? 1 : 0,
      pointsAwarded: false
    }));

    // Update player state on the server
    const points = isCorrect ? 1 : 0;
    const { error } = await supabase
      .from('players')
      .update({
        hasAnswered: true,
        score: currentPlayer.score + points,
      })
      .eq('game_code', gameCode)
      .eq('name', playerName);

    if (error) {
      console.error("Error updating player answer:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון התשובה שלך",
        variant: "destructive"
      });

      // Revert the optimistic update
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: false,
        lastAnswer: undefined,
        lastAnswerCorrect: undefined,
        pendingAnswer: null
      }));
    } else {
      // Fetch the updated player list
      fetchPlayers();
    }
  }, [gameCode, playerName, currentPlayer.score, fetchPlayers, toast, currentRound, timerActive]);

  const handleTimeUp = useCallback(async () => {
    if (!gameCode || !playerName) return;

    // Optimistically update the local state
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: undefined,
      lastAnswerCorrect: false,
      pendingAnswer: 0,
      pointsAwarded: false
    }));

    // Update player state on the server to reflect that the player has "answered" (ran out of time)
    const { error } = await supabase
      .from('players')
      .update({
        hasAnswered: true,
      })
      .eq('game_code', gameCode)
      .eq('name', playerName);

    if (error) {
      console.error("Error updating player after time up:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הסטטוס שלך",
        variant: "destructive"
      });

      // Revert the optimistic update
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: false,
        lastAnswer: undefined,
        lastAnswerCorrect: undefined,
        pendingAnswer: null
      }));
    } else {
      // Fetch the updated player list
      fetchPlayers();
    }
  }, [gameCode, playerName, fetchPlayers, toast]);

  const advanceToNextPhase = useCallback(async () => {
    if (!isHost || !gameCode) return;

    let nextPhase: GamePhase;
    switch (phase) {
      case 'songPlayback':
        nextPhase = 'answerOptions';
        break;
      case 'answerOptions':
        nextPhase = 'scoringFeedback';
        break;
      case 'scoringFeedback':
        nextPhase = 'leaderboard';
        break;
      case 'leaderboard':
        nextPhase = 'songPlayback';
        break;
      default:
        nextPhase = 'songPlayback';
    }

    const { error } = await supabase
      .from('game_state')
      .update({ game_phase: nextPhase })
      .eq('game_code', gameCode);

    if (error) {
      console.error("Error advancing to next phase:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במעבר לשלב הבא",
        variant: "destructive"
      });
    }
  }, [gameCode, isHost, phase, toast]);

  const resetPlayerAnswers = useCallback(async () => {
    if (!isHost || !gameCode) return;

    const { error } = await supabase
      .from('players')
      .update({ hasAnswered: false })
      .eq('game_code', gameCode);

    if (error) {
      console.error("Error resetting player answers:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באיפוס התשובות של השחקנים",
        variant: "destructive"
      });
    }
  }, [gameCode, isHost, toast]);

  const handleSkipSong = useCallback(async () => {
    if (!gameCode || !playerName) return;

    // Optimistically update the local state
    setCurrentPlayer(prev => ({
      ...prev,
      skipsLeft: Math.max(0, prev.skipsLeft - 1),
    }));
    setUserSkippedQuestion(true);

    // Update player skipsLeft on the server
    const { error } = await supabase
      .from('players')
      .update({
        skipsLeft: currentPlayer.skipsLeft - 1,
      })
      .eq('game_code', gameCode)
      .eq('name', playerName);

    if (error) {
      console.error("Error updating player skips:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הדילוגים שלך",
        variant: "destructive"
      });

      // Revert the optimistic update
      setCurrentPlayer(prev => ({
        ...prev,
        skipsLeft: prev.skipsLeft + 1,
      }));
      setUserSkippedQuestion(false);
    } else {
      // Fetch the updated player list
      fetchPlayers();
    }
  }, [gameCode, playerName, currentPlayer.skipsLeft, fetchPlayers, toast]);

  useEffect(() => {
    if (serverGamePhase) {
      setPhase(serverGamePhase);
    }
  }, [serverGamePhase]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    const gameStateSubscription = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state', filter: `game_code=eq.${gameCode}` },
        (payload) => {
          if (payload.new) {
            const newGameState = payload.new;
            setPhase(newGameState.game_phase);
            if (newGameState.current_song_id) {
              const songBank = gameSettings?.songList === 'mashina' ? mashinaSongs : gameSettings?.songList === 'adam' ? adamSongs : defaultSongBank;
              const newSong = songBank.find(song => song.id === newGameState.current_song_id) || null;
              setCurrentSong(newSong);
            }
            if (newGameState.current_round) {
              setCurrentRound(newGameState.current_round);
            }
            if (newGameState.round_counter) {
              setRoundCounter(newGameState.round_counter);
            }
            if (newGameState.is_trivia_round !== undefined) {
              setIsTriviaRound(newGameState.is_trivia_round);
            }
             if (newGameState.current_trivia_question) {
              setCurrentTriviaQuestion(newGameState.current_trivia_question);
            }
          }
        }
      )
      .subscribe();

    const playersSubscription = supabase
      .channel('players_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_code=eq.${gameCode}` },
        (payload) => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameStateSubscription);
      supabase.removeChannel(playersSubscription);
    };
  }, [gameCode, fetchPlayers, gameSettings?.songList]);

  useEffect(() => {
    const currentPlayer = players.find(p => p.name === playerName);
    if (currentPlayer) {
      setCurrentPlayer(prev => ({
        ...prev,
        score: currentPlayer.score,
        skipsLeft: currentPlayer.skipsLeft !== undefined ? currentPlayer.skipsLeft : 3,
        hasAnswered: currentPlayer.hasAnswered,
        isReady: currentPlayer.isReady,
      }));
      setPlayerReady(currentPlayer.isReady);
    }
  }, [players, playerName]);

  useEffect(() => {
    if (phase === 'songPlayback') {
      setAllPlayersAnswered(false);
      setAnsweredEarly(false);
      setUserSkippedQuestion(false);
      resetPlayerAnswers();
    }
  }, [phase, resetPlayerAnswers]);

  useEffect(() => {
    if (phase === 'answerOptions') {
      setTimeLeft(answerTimeLimit || 10);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [phase, answerTimeLimit]);

  useEffect(() => {
    if (phase === 'scoringFeedback') {
      const now = Date.now();
      gameStartTimeRef.current = now;
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'leaderboard') {
      const now = Date.now();
      gameStartTimeRef.current = now;
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'songPlayback') {
      const now = Date.now();
      gameStartTimeRef.current = now;
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'songPlayback' && isHost) {
      const now = Date.now();
      gameStartTimeRef.current = now;
      startGameRound();
    }
  }, [phase, isHost, startGameRound]);

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">
              {isTriviaRound ? 'שאלה טריוויה' : 'השמעת שיר'}
              <span className="ml-2">{roundCounter}</span>
            </h2>
            {isTriviaRound && currentTriviaQuestion ? (
              <TriviaQuestion
                question={currentTriviaQuestion}
                onAnswer={handleAnswerSelection}
                timeUp={false}
                showOptions={false}
                isFinalPhase={false}
                showQuestion={true}
              />
            ) : (
              currentSong && (
                <SongPlayer
                  song={currentSong}
                  isPlaying={true}
                  duration={8000}
                  onPlaybackEnded={advanceToNextPhase}
                />
              )
            )}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <AppButton
                  variant="outline"
                  onClick={() => updatePlayerReadiness(!playerReady)}
                >
                  {playerReady ? 'מחכה' : 'מוכן'}
                </AppButton>
                <span className="text-sm text-gray-500">
                  {players.filter(p => p.isReady).length} / {players.length} מוכנים
                </span>
              </div>
              {currentPlayer.skipsLeft > 0 && !userSkippedQuestion && (
                <AppButton
                  variant="secondary"
                  onClick={handleSkipSong}
                  leftIcon={<SkipForward size={16} />}
                >
                  דלג ({currentPlayer.skipsLeft})
                </AppButton>
              )}
            </div>
          </div>
        );
      case 'answerOptions':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">
              {isTriviaRound ? 'שאלה טריוויה' : 'בחר את התשובה הנכונה'}
              <span className="ml-2">{roundCounter}</span>
            </h2>
            <GameTimer
              initialSeconds={answerTimeLimit || 10}
              isActive={timerActive}
              onTimeout={handleTimeUp}
            />
            {isTriviaRound && currentTriviaQuestion ? (
              <TriviaQuestion
                question={currentTriviaQuestion}
                onAnswer={handleAnswerSelection}
                timeUp={!timerActive}
                answerStartTime={gameStartTimeRef.current || 0}
                elapsedTime={Date.now() - (gameStartTimeRef.current || 0)}
                showOptions={true}
                isFinalPhase={true}
                hasAnsweredEarly={answeredEarly}
                onTimeUp={handleTimeUp}
              />
            ) : (
              currentRound && (
                <TriviaQuestion
                  question={{
                    question: "מה השיר?",
                    options: currentRound.options.map(song => song.title),
                    correctAnswerIndex: currentRound.correctAnswerIndex,
                  }}
                  onAnswer={handleAnswerSelection}
                  timeUp={!timerActive}
                  answerStartTime={gameStartTimeRef.current || 0}
                  elapsedTime={Date.now() - (gameStartTimeRef.current || 0)}
                  showOptions={true}
                  isFinalPhase={true}
                  hasAnsweredEarly={answeredEarly}
                  onTimeUp={handleTimeUp}
                />
              )
            )}
          </div>
        );
      case 'scoringFeedback':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">
              תוצאות
              <span className="ml-2">{roundCounter - 1}</span>
            </h2>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">שחקן</TableHead>
                  <TableHead>תשובה</TableHead>
                  <TableHead>תוצאה</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const isCurrentPlayer = player.name === playerName;
                  const playerDetails = isCurrentPlayer ? currentPlayer : {
                    name: player.name,
                    score: player.score,
                    lastAnswer: undefined,
                    lastAnswerCorrect: undefined,
                    pendingAnswer: null
                  };

                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        {playerDetails.lastAnswer ? playerDetails.lastAnswer : 'לא ענה'}
                      </TableCell>
                      <TableCell>
                        {playerDetails.lastAnswerCorrect === true ? (
                          <CheckCircle2 className="text-green-500 inline-block align-middle" size={20} />
                        ) : playerDetails.lastAnswerCorrect === false ? (
                          <XCircle className="text-red-500 inline-block align-middle" size={20} />
                        ) : (
                          'לא ענה'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{player.score}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <AppButton onClick={advanceToNextPhase}>
                לשלב הבא
              </AppButton>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">
              <Award className="inline-block mr-2" />
              טבלת המובילים
            </h2>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">מקום</TableHead>
                  <TableHead>שחקן</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {index === 0 ? (
                        <Crown className="text-yellow-500 inline-block align-middle" size={20} />
                      ) : index === 1 ? (
                        <Award className="text-gray-500 inline-block align-middle" size={20} />
                      ) : index === 2 ? (
                        <Trophy className="text-orange-500 inline-block align-middle" size={20} />
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell className="text-right">{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <AppButton onClick={advanceToNextPhase}>
                לסיבוב הבא
              </AppButton>
            </div>
          </div>
        );
      default:
        return <div>שלב לא ידוע</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10">
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-6 bg-white/30 backdrop-blur-sm p-2 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <LeaveGameButton 
              gameCode={gameCode || ''} 
              isHost={isHost} 
              className="rounded-full p-1.5 hover:bg-destructive/10 transition-colors" 
            />
            
            <div className="bg-primary/5 px-2.5 py-1 rounded-full text-sm font-mono">
              <span className="text-xs text-gray-600 mr-1">קוד:</span>
              {gameCode}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-primary text-center flex-grow relative">
            <MusicNote type="note3" className="absolute -top-4 -right-6 text-primary opacity-50" size={24} animation="float" />
            <MusicNote type="note2" className="absolute -top-3 -left-4 text-secondary opacity-50" size={20} animation="float-alt" />
            שיר על הדרך 🎶
          </h1>
          
          {isHost && (
            <Badge variant="secondary" className="text-sm">
              מנחה
            </Badge>
          )}
        </div>
        
        {renderPhase()}
      </div>
    </div>
  );
};

export default GamePlay;
