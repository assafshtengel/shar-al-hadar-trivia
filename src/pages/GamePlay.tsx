
import React, { useState, useEffect } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useGameRound } from '@/hooks/useGameRound';
import { useGameAnswer } from '@/hooks/useGameAnswer';
import { supabase } from '@/integrations/supabase/client';
import SongPlayback from '@/components/game/SongPlayback';
import AnswerOptions from '@/components/game/AnswerOptions';
import ScoringFeedback from '@/components/game/ScoringFeedback';
import Leaderboard from '@/components/game/Leaderboard';
import EndGameButton from '@/components/EndGameButton';
import ExitGameButton from '@/components/ExitGameButton';

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

interface Song {
  name: string;
  embedUrl: string;
}

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect?: boolean;
  lastScore?: number;
}

// Restore static song list
const songs: Song[] = [
  { name: "עתיד מתוק - משינה", embedUrl: "https://www.youtube.com/embed/_3OOrrGxJ1M?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "ריקוד המכונה - משינה", embedUrl: "https://www.youtube.com/embed/U0THoV7yTeA?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "שוב היא כאן - יוני רכטר", embedUrl: "https://www.youtube.com/embed/RBwWNIzzXEQ?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "תיק קטן - סטילה ונס", embedUrl: "https://www.youtube.com/embed/U6eXRzDkifw?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "מה שעובר עליי - משינה", embedUrl: "https://www.youtube.com/embed/dkKiw9Wbz-E?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "תגידי לי את - מרסדס בנד", embedUrl: "https://www.youtube.com/embed/C_3x6vcMWJQ?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "יש לי חור בלב בצורה שלך - דני רובס", embedUrl: "https://www.youtube.com/embed/FCc08_GQByw?autoplay=1&controls=0&modestbranding=1&rel=0" },
  { name: "ככה זה - ברי סחרוף", embedUrl: "https://www.youtube.com/embed/adeK7hFr8LM?autoplay=1&controls=0&modestbranding=1&rel=0" }
];

// Restore original createGameRound function
function createGameRound(): GameRound {
  const idx = Math.floor(Math.random() * songs.length);
  const correctSong = songs[idx];
  const wrong = songs.filter((_, i) => i !== idx)
                   .sort(() => Math.random() - 0.5)
                   .slice(0, 3);
  const options = [correctSong, ...wrong]
                  .sort(() => Math.random() - 0.5);
  const correctIndex = options.findIndex(s => s.name === correctSong.name);
  return { correctSong, options, correctAnswerIndex: correctIndex };
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
  const [currentGameRound, setCurrentGameRound] = useState<GameRound | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  const {
    currentSong,
    currentRound,
    answerOptions,
    correctAnswer,
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
    if (currentRound && currentRound.correctSong) {
      if (currentRound.correctSong.embedUrl) {
        const videoId = extractVideoId(currentRound.correctSong.embedUrl);
        setYoutubeVideoId(videoId);
      }
    }
  }, [currentRound]);

  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const playSong = async () => {
    if (!isHost) return;
    
    const round = createGameRound();
    setCurrentGameRound(round);
    
    const embed = round.correctSong.embedUrl;
    const videoId = extractVideoId(embed);
    setYoutubeVideoId(videoId);
    
    await supabase
      .from('game_state')
      .update({
        current_song_name: JSON.stringify({
          round: round.correctAnswerIndex,
          correctSong: {
            id: "local",
            title: round.correctSong.name,
            artist: "",
            embedUrl: round.correctSong.embedUrl,
            order: 1
          },
          options: round.options.map(s => s.name)
        }),
        current_song_url: embed,
        game_phase: 'playing'
      })
      .eq('game_code', gameCode);
  };

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
          <div className="flex flex-col items-center justify-center">
            {isHost && (
              <AppButton
                onClick={playSong}
                className="mb-6"
              >
                השמע שיר
              </AppButton>
            )}
            <SongPlayback
              round={round}
              currentSong={currentSong}
              youtubeVideoId={youtubeVideoId}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              onContinue={() => setPhase('answerOptions')}
              isHost={isHost}
            />
          </div>
        );
      case 'answerOptions':
        return (
          <AnswerOptions
            options={answerOptions?.length ? answerOptions : currentGameRound?.options.map(s => s.name) || []}
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
