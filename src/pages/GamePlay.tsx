
import React, { useState, useEffect } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useGameRound } from '@/hooks/useGameRound';
import { useGameAnswer } from '@/hooks/useGameAnswer';
import SongPlayback from '@/components/game/SongPlayback';
import AnswerOptions from '@/components/game/AnswerOptions';
import ScoringFeedback from '@/components/game/ScoringFeedback';
import Leaderboard from '@/components/game/Leaderboard';
import EndGameButton from '@/components/EndGameButton';
import ExitGameButton from '@/components/ExitGameButton';

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect?: boolean;
  lastScore?: number;
}

const GamePlay: React.FC = () => {
  const { gameCode, playerName, isHost } = useGameState();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '',
    name: '',
    score: 0,
    isReady: false,
    hasAnswered: false,
  });
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const {
    currentSong,
    currentRound,
    answerOptions,
    correctAnswer,
    youtubeVideoId,
    isLoading,
    round,
    fetchGameRoundData
  } = useGameRound(gameCode, isHost);

  const {
    isAnswerSubmitted,
    setIsAnswerSubmitted,
    handleAnswerSubmit,
    timerRef
  } = useGameAnswer(
    gameCode,
    playerName,
    round,
    timeRemaining,
    correctAnswer,
    currentPlayer,
    setCurrentPlayer,
    setPlayers,
    setLeaderboard,
    () => {}
  );

  useEffect(() => {
    fetchGameRoundData();
  }, [fetchGameRoundData]);

  useEffect(() => {
    if (phase === 'answerOptions') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setTimeRemaining(30);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleAnswerSubmit(null);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, handleAnswerSubmit]);

  const handleAnswerOptionSelected = async (selectedAnswer: string) => {
    const result = await handleAnswerSubmit(selectedAnswer);
    if (result) {
      setPhase('scoringFeedback');
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <h2 className="text-2xl font-bold text-primary">טוען...</h2>
          <div className="w-full max-w-md h-12 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary opacity-50 animate-pulse"></div>
          </div>
        </div>
      );
    }

    switch (phase) {
      case 'songPlayback':
        return (
          <SongPlayback
            round={round}
            currentSong={currentSong}
            youtubeVideoId={youtubeVideoId}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onContinue={() => setPhase('answerOptions')}
          />
        );
      case 'answerOptions':
        return (
          <AnswerOptions
            options={answerOptions}
            timeRemaining={timeRemaining}
            onAnswer={handleAnswerOptionSelected}
          />
        );
      case 'scoringFeedback':
        return (
          <ScoringFeedback
            lastAnswerCorrect={currentPlayer.lastAnswerCorrect}
            lastScore={currentPlayer.lastScore}
          />
        );
      case 'leaderboard':
        return <Leaderboard players={leaderboard} />;
      default:
        return <div>טוען...</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">משחק מנגינות</h1>
        <div className="flex space-x-2">
          {isHost ? (
            <EndGameButton gameCode={gameCode} />
          ) : (
            <ExitGameButton className="ml-2" />
          )}
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default GamePlay;
