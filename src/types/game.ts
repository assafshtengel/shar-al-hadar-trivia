
import { Song } from '@/data/songBank';
import { TriviaQuestion } from '@/data/triviaQuestions';

export type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

export interface Player {
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

export interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

export interface SupabasePlayer {
  id: string;
  name: string;
  score: number;
  game_code: string;
  joined_at: string;
  hasAnswered: boolean;
  isReady: boolean;
  lastanswercorrect: boolean | null;
}

export interface PendingAnswerUpdate {
  player_name: string;
  is_correct: boolean;
  points: number;
}
