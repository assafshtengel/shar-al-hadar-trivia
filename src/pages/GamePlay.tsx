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

  // ... rest of the component code remains unchanged

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
              <LeaveGameButton gameCode={gameCode} />
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
