
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
}

export interface PendingAnswerUpdate {
  player_name: string;
  is_correct: boolean;
  points: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  embedUrl?: string;
  fullUrl?: string;
  spotifyUrl?: string;
}
