import React from 'react';
import { Song } from '@/data/songBank';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import { Music, Play } from 'lucide-react';
import SongPlayer from './SongPlayer';
import TriviaQuestion from './TriviaQuestion';
import AppButton from './AppButton';
import MusicNote from './MusicNote';
import { GameRound } from '@/types/game';

interface SongPlaybackPhaseProps {
  isTriviaRound: boolean;
  currentTriviaQuestion: TriviaQuestionType | null;
  isHost: boolean;
  onStartTrivia: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  showYouTubeEmbed: boolean;
  currentRound: GameRound | null;
  onPlaybackEnded: () => void;
  onPlaybackError: () => void;
  onPlaybackStarted: () => void;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  timeLeft: number;
  onSkip?: () => void;
  skipsLeft?: number;
  hasAnswered?: boolean;
  gameStartTime: number | null;
}

const SongPlaybackPhase: React.FC<SongPlaybackPhaseProps> = ({
  isTriviaRound,
  currentTriviaQuestion,
  isHost,
  onStartTrivia,
  currentSong,
  isPlaying,
  showYouTubeEmbed,
  currentRound,
  onPlaybackEnded,
  onPlaybackError,
  onPlaybackStarted,
  onAnswer,
  timeLeft,
  onSkip,
  skipsLeft = 0,
  hasAnswered = false,
  gameStartTime
}) => {
  if (isTriviaRound && currentTriviaQuestion) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-6">
        <h2 className="text-2xl font-bold text-primary">שאלת טריוויה במוזיקה ישראלית</h2>
        {isHost ? (
          <AppButton 
            variant="primary" 
            size="lg" 
            onClick={onStartTrivia} 
            className="max-w-xs"
          >
            הצג שאלת טריוויה
            <Play className="mr-2" />
          </AppButton>
        ) : (
          <div className="text-lg text-gray-600 text-center">
            המתן למנהל המשחק להציג את שאלת הטריוויה
          </div>
        )}
        {currentTriviaQuestion && (
          <TriviaQuestion 
            question={currentTriviaQuestion} 
            onAnswer={onAnswer}
            timeUp={!isPlaying} 
            answerStartTime={gameStartTime || Date.now()} 
            elapsedTime={gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0}
            showQuestion={true}
            onSkip={onSkip}
            skipsLeft={skipsLeft}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
      
      {currentSong && (
        <SongPlayer 
          song={currentSong} 
          isPlaying={isPlaying && showYouTubeEmbed} 
          onPlaybackEnded={onPlaybackEnded} 
          onPlaybackError={onPlaybackError} 
          onPlaybackStarted={onPlaybackStarted}
          showOverlay={true}
        />
      )}
      
      {currentRound && (
        <TriviaQuestion 
          question={{
            question: "מה השיר?",
            options: currentRound.options.map(song => song.title || ''),
            correctAnswerIndex: currentRound.correctAnswerIndex
          }} 
          onAnswer={onAnswer}
          timeUp={false} 
          answerStartTime={gameStartTime || Date.now()} 
          elapsedTime={gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0}
          showQuestion={true}
          onSkip={onSkip}
          skipsLeft={skipsLeft}
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
      
      {!isHost && !isPlaying && !currentRound && (
        <div className="text-lg text-gray-600 text-center">
          המתן למנהל המשחק להשמיע את השיר הבא
        </div>
      )}
    </div>
  );
};

export default SongPlaybackPhase;
