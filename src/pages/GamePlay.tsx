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

  // ... rest of the code remains unchanged until the return statement

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
