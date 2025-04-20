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
    pendingAnswer: null,
    pointsAwarded: false
  });
  const [roundCounter, setRoundCounter] = useState<number>(1);
  const [isTriviaRound, setIsTriviaRound] = useState<boolean>(false);
  const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<TriviaQuestionType | null>(null);

  // ... keep existing code (rest of hooks and functions)

  const handleAnswer = async (index: number) => {
    if (currentPlayer.hasAnswered || currentPlayer.pointsAwarded) {
      console.log("Already answered or points already awarded - ignoring selection");
      return;
    }
    
    console.log(`Player ${playerName} selected answer: ${index}`);
    setSelectedAnswer(index);
    
    const isCorrect = currentRound ? index === currentRound.correctAnswerIndex : false;
    const points = isCorrect ? 10 : 0;
    let currentScore = 0;
    let hasAlreadyAnswered = false;
    
    if (gameCode && playerName) {
      try {
        const { data } = await supabase
          .from('players')
          .select('score, hasAnswered')
          .eq('game_code', gameCode)
          .eq('name', playerName)
          .maybeSingle();
          
        if (data) {
          currentScore = data.score || 0;
          hasAlreadyAnswered = data.hasAnswered || false;
          
          if (hasAlreadyAnswered) {
            console.log(`Player ${playerName} has already answered this round. Not updating score.`);
            setCurrentPlayer(prev => ({
              ...prev,
              hasAnswered: true,
              lastAnswer: currentRound?.options[index].title,
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
      lastAnswer: currentRound?.options[index].title,
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
        const { error } = await supabase
          .from('players')
          .update({
            hasAnswered: true,
            score: updatedScore
          })
          .eq('game_code', gameCode)
          .eq('name', playerName);
          
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

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <SongPlayer song={currentSong} isPlaying={isPlaying && showYouTubeEmbed} onPlaybackEnded={handleSongPlaybackEnded} onPlaybackError={handleSongPlaybackError} />
            <AppButton variant="primary" size="lg" onClick={playSong} disabled={!isHost || isPlaying} className="max-w-xs mx-0 px-[48px]">
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
            {currentRound ? (
              <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {currentRound.options.map((song, index) => (
                  <div key={index} className="relative">
                    <AppButton 
                      variant={selectedAnswer === index ? "primary" : "secondary"} 
                      className={`${selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""} w-full`} 
                      disabled={selectedAnswer === index}
                      onClick={() => handleAnswer(index)}
                    >
                      {song.title}
                    </AppButton>
                    {selectedAnswer === index && showAnswerConfirmation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 text-white px-2 py-1 rounded-md animate-fade-in">
                        ✓ הבחירה שלך נקלטה!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-lg text-gray-600 animate-pulse">
                טוען אפשרויות...
              </div>
            )}
            <AppButton 
              variant="secondary" 
              className="mt-4 max-w-xs" 
              disabled={selectedAnswer !== null || currentPlayer.skipsLeft <= 0} 
              onClick={handleSkip}
            >
              דלג ({currentPlayer.skipsLeft})
              <SkipForward className="mr-2" />
            </AppButton>
            {selectedAnswer !== null && (
              <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
                הבחירה שלך נקלטה! ממתין לסיום הזמן...
              </div>
            )}
          </div>
        );
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
                {!currentPlayer.lastAnswerCorrect && currentRound && (
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
            {isHost && currentRound && (
              <AppButton variant="secondary" size="lg" onClick={playFullSong} className="max-w-xs mt-4">
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
                      <TableCell>{player.score}</TableCell>
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
            {isHost && <GameHostControls roundCounter={roundCounter} isTriviaRound={isTriviaRound} onPlayNext={nextRound} onResetScores={resetAllPlayerScores} gamePhase={serverGamePhase} />}
            {!isHost && !playerReady && (
              <AppButton variant="primary" onClick={markPlayerReady} className="mt-8">
                מוכן לסיבוב הבא
                <CheckCircle2 className="mr-2" />
              </AppButton>
            )}
            {!isHost && playerReady && (
              <div className="mt-8 p-4 bg-primary/10 rounded-lg text-center">
                <div className="font-semibold mb-2">אתה מוכן לסיבוב הבא</div>
                <div className="text-sm">ממתין למנהל המשחק להתחיל...</div>
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
