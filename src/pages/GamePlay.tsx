import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Music, Users, Trophy, ArrowLeft } from 'lucide-react';
import { useGameState } from '@/contexts/GameStateContext';
import { useGameData } from '@/hooks/useGameData';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useGameRound } from '@/hooks/useGameRound';
import { useAnswerSubmission } from '@/hooks/useAnswerSubmission';
import { useScoreCalculation } from '@/hooks/useScoreCalculation';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import GameHeader from '@/components/GamePlay/GameHeader';
import PlayerScores from '@/components/GamePlay/PlayerScores';
import RoundInfo from '@/components/GamePlay/RoundInfo';
import AnswerForm from '@/components/GamePlay/AnswerForm';
import RoundResults from '@/components/GamePlay/RoundResults';
import GameControls from '@/components/GamePlay/GameControls';
import LoadingScreen from '@/components/LoadingScreen';
import EndGameButton from '@/components/EndGameButton';
import LeaveGameButton from '@/components/LeaveGameButton';
import MusicNote from '@/components/MusicNote';
import AppButton from '@/components/AppButton';

const GamePlay = () => {
  const navigate = useNavigate();
  const { gameCode: urlGameCode } = useParams();
  const { gameCode: contextGameCode, playerName, isHost } = useGameState();
  const gameCode = urlGameCode || contextGameCode;
  const { isIOS } = useIsMobile();
  const [showIOSWarning, setShowIOSWarning] = useState(false);
  const { toast } = useToast();

  const {
    gameData,
    gameStatus,
    currentRound,
    isLoading: gameDataLoading,
    error: gameDataError
  } = useGameData(gameCode);

  const {
    players,
    isLoading: playersLoading,
    error: playersError
  } = usePlayerData(gameCode);

  const {
    roundData,
    isLoading: roundDataLoading,
    error: roundDataError
  } = useGameRound(gameCode, currentRound);

  const {
    answer,
    setAnswer,
    hasAnswered,
    submitAnswer,
    isSubmitting
  } = useAnswerSubmission(gameCode, playerName, currentRound);

  const {
    scores,
    roundResults,
    showResults,
    calculateScores,
    hideResults
  } = useScoreCalculation(gameCode, currentRound, players);

  const {
    timeRemaining,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer
  } = useRoundTimer(roundData?.duration || 30);

  const isLoading = gameDataLoading || playersLoading || roundDataLoading;
  const hasError = gameDataError || playersError || roundDataError;

  useEffect(() => {
    if (!gameCode) {
      navigate('/');
    }
  }, [gameCode, navigate]);

  useEffect(() => {
    if (roundData && gameStatus === 'in_progress' && isHost) {
      startTimer();
    }
  }, [roundData, gameStatus, isHost, startTimer]);

  const handleStartNextRound = () => {
    hideResults();
    resetTimer();
    // Logic to start the next round
  };

  const handleEndGame = () => {
    // Logic to end the game
    navigate(`/game-results/${gameCode}`);
  };

  const handleStartAsHost = () => {
    if (isIOS) {
      setShowIOSWarning(true);
      return;
    }
    // הלוגיקה הקיימת להתחלת המשחק כמנחה
  };

  const handleReportIssue = () => {
    toast({
      title: "תודה על הדיווח",
      description: "נבדוק את הנושא בהקדם",
    });
    setShowIOSWarning(false);
  };

  if (isLoading) {
    return <LoadingScreen message="טוען את המשחק..." />;
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה בטעינת המשחק</h1>
        <p className="text-gray-700 mb-6">לא ניתן לטעון את נתוני המשחק. אנא נסה שוב מאוחר יותר.</p>
        <AppButton onClick={() => navigate('/')}>חזרה לדף הבית</AppButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote type="note1" className="absolute top-[10%] right-[15%] opacity-20" size={36} animation="float" color="#6446D0" />
        <MusicNote type="note4" className="absolute bottom-[15%] left-[15%] opacity-20" size={32} animation="float-alt" color="#FFC22A" />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <GameHeader 
          gameCode={gameCode}
          currentRound={currentRound}
          totalRounds={gameData?.totalRounds || 0}
        />

        <div className="absolute top-6 right-4 flex items-center gap-2">
          <LeaveGameButton />
          {isHost && <EndGameButton gameCode={gameCode} />}
        </div>

        {showResults ? (
          <RoundResults 
            roundResults={roundResults}
            onNextRound={handleStartNextRound}
            isLastRound={currentRound >= (gameData?.totalRounds || 0)}
            onEndGame={handleEndGame}
            isHost={isHost}
          />
        ) : (
          <>
            <PlayerScores players={players} />
            
            <RoundInfo 
              roundNumber={currentRound}
              totalRounds={gameData?.totalRounds || 0}
              songTitle={roundData?.songTitle || ''}
              artist={roundData?.artist || ''}
              timeRemaining={timeRemaining}
              isTimerRunning={isTimerRunning}
              isHost={isHost}
            />
            
            <AnswerForm 
              answer={answer}
              setAnswer={setAnswer}
              onSubmit={submitAnswer}
              hasAnswered={hasAnswered}
              isSubmitting={isSubmitting}
              disabled={timeRemaining <= 0 || gameStatus !== 'in_progress'}
            />
            
            {isHost && (
              <GameControls 
                onCalculateScores={calculateScores}
                timeRemaining={timeRemaining}
                isTimerRunning={isTimerRunning}
                startTimer={startTimer}
                stopTimer={stopTimer}
                resetTimer={resetTimer}
              />
            )}
          </>
        )}
      </div>

      <AlertDialog open={showIOSWarning} onOpenChange={setShowIOSWarning}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>הערה למשתמשי iPhone</AlertDialogTitle>
            <AlertDialogDescription>
              בשל הגבלות של Apple, משתמשי iPhone יכולים להשתתף במשחק כשחקנים בלבד, ולא כמנחים. אם אין ברשותך iPhone אך אינך מצליח/ה להיות מנחה, אנא דווח/י לנו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>הבנתי</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportIssue}>
              דווח/י על בעיה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GamePlay;
