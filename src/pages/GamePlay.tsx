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
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-4">
              {isTriviaRound ? 'סיבוב טריוויה' : `סיבוב ${roundCounter}`}
            </h2>
            
            {!isTriviaRound && (
              <SongPlayer 
                song={currentSong} 
                isPlaying={isPlaying} 
                onPlaybackEnded={() => {
                  // Handle playback ended logic
                }}
                onPlaybackStarted={() => {
                  // Handle playback started logic
                }}
                onPlaybackError={() => {
                  // Handle playback error logic
                }}
              />
            )}
            
            {isTriviaRound && currentTriviaQuestion && (
              <TriviaQuestion 
                question={currentTriviaQuestion}
                onAnswer={(isCorrect, selectedIndex) => {
                  // Handle answer logic
                }}
                timeUp={false}
                showOptions={false}
                isFinalPhase={false}
                showQuestion={isPlaying}
              />
            )}
          </div>
        );
        
      case 'answerOptions':
        return (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {isTriviaRound ? 'שאלת טריוויה' : 'בחר את השיר הנכון'}
              </h2>
              
              <GameTimer 
                initialSeconds={timeLeft} 
                isActive={timerActive} 
                onTimeout={() => {
                  // Handle timeout logic
                }}
              />
            </div>
            
            {isTriviaRound && currentTriviaQuestion && (
              <TriviaQuestion 
                question={currentTriviaQuestion}
                onAnswer={(isCorrect, selectedIndex) => {
                  // Handle answer logic
                }}
                timeUp={false}
                showOptions={true}
                isFinalPhase={false}
              />
            )}
            
            {!isTriviaRound && currentRound && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {currentRound.options.map((song, index) => (
                  <AppButton
                    key={index}
                    variant={selectedAnswer === index ? 'primary' : 'secondary'}
                    className="w-full text-start justify-start"
                    onClick={() => {
                      // Handle song selection logic
                    }}
                    disabled={showAnswerConfirmation}
                  >
                    {song.title}
                  </AppButton>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'scoringFeedback':
        return (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-6">תוצאות הסיבוב</h2>
            
            {!isTriviaRound && currentRound && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">השיר הנכון הוא:</h3>
                <div className="bg-green-100 p-4 rounded-lg flex items-center">
                  <CheckCircle2 className="text-green-500 mr-2" />
                  <div>
                    <p className="font-bold">{currentRound.correctSong.title}</p>
                    <p className="text-sm text-gray-600">
                      {currentRound.correctSong.artist} - {currentRound.correctSong.year}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">שחקנים שענו נכון:</h3>
              <div className="space-y-2">
                {/* Players who answered correctly would be rendered here */}
              </div>
            </div>
            
            {isHost && (
              <div className="mt-8">
                <AppButton 
                  variant="primary" 
                  className="w-full" 
                  onClick={() => {
                    // Handle next round logic
                  }}
                >
                  המשך לסבב הבא
                </AppButton>
              </div>
            )}
          </div>
        );
        
      case 'leaderboard':
        return (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              <div className="flex items-center justify-center">
                <Trophy className="text-yellow-500 mr-2" />
                טבלת המובילים
                <Crown className="text-yellow-500 ml-2" />
              </div>
            </h2>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">דירוג</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">ניקוד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.sort((a, b) => b.score - a.score).map((player, index) => (
                  <TableRow key={player.id} className={player.name === playerName ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {isHost && (
              <GameHostControls
                roundCounter={roundCounter}
                isTriviaRound={isTriviaRound}
                onPlayNext={() => {
                  // Handle play next logic
                }}
                onResetScores={() => {
                  // Handle reset scores logic
                }}
                gamePhase={serverGamePhase}
                className="mt-8"
              />
            )}
          </div>
        );
        
      default:
        return null;
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
    </div>
  );
};

export default GamePlay;
