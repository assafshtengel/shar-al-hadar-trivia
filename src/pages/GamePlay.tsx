import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Play, SkipForward, Clock, Award, Crown, Trophy } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Song, createGameRound, defaultSongBank } from '@/data/songBank';

type GamePhase = 'songPlayback' | 'answerOptions' | 'scoringFeedback' | 'leaderboard';

interface Player {
  name: string;
  score: number;
  lastScore?: number;
  skipsLeft: number;
  hasAnswered: boolean;
  lastAnswer?: string;
  lastAnswerCorrect?: boolean;
}

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

const GamePlay: React.FC = () => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<GamePhase>('songPlayback');
  const [isHost, setIsHost] = useState(true); // For demo purposes, assume we're the host
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [currentRound, setCurrentRound] = useState<GameRound>(() => {
    const { correctSong, options } = createGameRound();
    return {
      correctSong,
      options,
      correctAnswerIndex: options.findIndex(song => song.id === correctSong.id)
    };
  });
  
  const [players, setPlayers] = useState<Player[]>([
    { name: "אמא", score: 12, skipsLeft: 3, hasAnswered: false },
    { name: "אבא", score: 10, skipsLeft: 2, hasAnswered: false },
    { name: "סבתא", score: 8, skipsLeft: 3, hasAnswered: false },
    { name: "דניאל", score: 6, skipsLeft: 1, hasAnswered: false },
    { name: "רותם", score: 4, skipsLeft: 0, hasAnswered: false },
  ]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({ 
    name: "שחקן נוכחי", 
    score: 0, 
    skipsLeft: 3, 
    hasAnswered: false 
  });

  // Hide YouTube embed after song finishes
  useEffect(() => {
    if (showYouTubeEmbed) {
      const timer = setTimeout(() => {
        setShowYouTubeEmbed(false);
        setIsPlaying(false);
        setPhase('answerOptions');
        startTimer();
      }, 4000); // Hide after 4 seconds (same as original timeout)
      
      return () => clearTimeout(timer);
    }
  }, [showYouTubeEmbed]);

  // Handle playing song
  const playSong = () => {
    if (!isHost) return;
    
    setIsPlaying(true);
    setShowYouTubeEmbed(true);
    
    toast({
      title: "משמיע שיר...",
      description: "מנגן כעת, האזן בקשב",
    });
  };

  // Handle timer for answer phase
  const startTimer = () => {
    setTimeLeft(15);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!currentPlayer.hasAnswered) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // Handle answer selection
  const handleAnswer = (index: number) => {
    if (currentPlayer.hasAnswered) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === currentRound.correctAnswerIndex;
    const points = isCorrect ? 10 : 0;
    
    // Update current player
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswer: currentRound.options[index].title,
      lastAnswerCorrect: isCorrect,
      lastScore: points,
      score: prev.score + points
    }));
    
    // Simulate other players answering
    setTimeout(() => {
      setPhase('scoringFeedback');
      
      // After showing feedback, move to leaderboard
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  // Handle skip
  const handleSkip = () => {
    if (currentPlayer.hasAnswered || currentPlayer.skipsLeft <= 0) return;
    
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      skipsLeft: prev.skipsLeft - 1,
      lastScore: 2,
      score: prev.score + 2
    }));
    
    toast({
      title: "דילגת על השאלה",
      description: `נותרו ${currentPlayer.skipsLeft - 1} דילוגים`,
    });
    
    setTimeout(() => {
      setPhase('scoringFeedback');
      
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  // Handle timeout
  const handleTimeout = () => {
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: true,
      lastAnswerCorrect: false,
      lastScore: 0
    }));
    
    toast({
      title: "אוי! נגמר הזמן",
      description: "לא הספקת לענות בזמן",
      variant: "destructive",
    });
    
    setTimeout(() => {
      setPhase('scoringFeedback');
      
      setTimeout(() => {
        setPhase('leaderboard');
      }, 3000);
    }, 1000);
  };

  // Handle next round
  const nextRound = () => {
    if (!isHost) return;
    
    // Create a new round with fresh song options
    const { correctSong, options } = createGameRound();
    setCurrentRound({
      correctSong,
      options,
      correctAnswerIndex: options.findIndex(song => song.id === correctSong.id)
    });
    
    // Reset for next round
    setSelectedAnswer(null);
    setCurrentPlayer(prev => ({
      ...prev,
      hasAnswered: false,
      lastAnswer: undefined,
      lastAnswerCorrect: undefined,
      lastScore: undefined
    }));
    
    setPhase('songPlayback');
    
    toast({
      title: "מתכוננים לסיבוב הבא",
      description: "סיבוב חדש עומד להתחיל",
    });
  };
  
  // Play full song
  const playFullSong = () => {
    if (!isHost) return;
    
    toast({
      title: "משמיע את השיר המלא",
      description: "השיר המלא מתנגן כעת",
    });
    
    // If we had actual player integration, we'd use the Spotify URL here
    console.log(`Playing full song: ${currentRound.correctSong.spotifyUrl}`);
    
    // In a real implementation, we might redirect to Spotify or use an embedded player
    window.open(currentRound.correctSong.spotifyUrl, '_blank');
  };

  // Render the current phase
  const renderPhase = () => {
    switch (phase) {
      case 'songPlayback':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
            
            {showYouTubeEmbed && (
              <div className="w-full max-w-sm overflow-hidden rounded-lg shadow-md">
                <iframe 
                  width="100%" 
                  height="150"
                  src="https://www.youtube.com/embed/hecv4GDaUsA?autoplay=1&controls=0&modestbranding=1&rel=0&start=0"
                  frameBorder="0" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                  className="w-full"
                ></iframe>
              </div>
            )}
            
            {isHost && (
              <AppButton 
                variant="primary" 
                size="lg"
                onClick={playSong}
                className="max-w-xs"
                disabled={isPlaying}
              >
                {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
                <Play className="mr-2" />
              </AppButton>
            )}
            
            {isPlaying && !showYouTubeEmbed && (
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute w-full h-full">
                  <MusicNote 
                    type="note1" 
                    className="absolute top-0 right-0 text-primary animate-float" 
                    size={32} 
                  />
                  <MusicNote 
                    type="note2" 
                    className="absolute top-10 left-0 text-secondary animate-float-alt" 
                    size={28} 
                  />
                  <MusicNote 
                    type="note3" 
                    className="absolute bottom-10 right-10 text-accent animate-float" 
                    size={36} 
                  />
                </div>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Music className="w-10 h-10 text-primary" />
                </div>
              </div>
            )}
            
            {!isHost && (
              <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להשמיע את השיר הבא
              </div>
            )}
          </div>
        );
      
      case 'answerOptions':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center">
                <Clock className="mr-2 text-primary" />
                <span className="font-bold">{timeLeft} שניות</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
                <SkipForward className="ml-2 text-secondary" />
              </div>
            </div>
            
            <Progress value={(timeLeft / 15) * 100} className="w-full h-2" />
            
            <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
            
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
              {currentRound.options.map((song, index) => (
                <AppButton
                  key={song.id}
                  variant={selectedAnswer === index ? "primary" : "secondary"}
                  className={selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""}
                  disabled={currentPlayer.hasAnswered}
                  onClick={() => handleAnswer(index)}
                >
                  {song.title} {song.artist ? `- ${song.artist}` : ''}
                </AppButton>
              ))}
            </div>
            
            <AppButton
              variant="secondary"
              className="mt-4 max-w-xs"
              disabled={currentPlayer.hasAnswered || currentPlayer.skipsLeft <= 0}
              onClick={handleSkip}
            >
              דלג ({currentPlayer.skipsLeft})
              <SkipForward className="mr-2" />
            </AppButton>
            
            {currentPlayer.hasAnswered && (
              <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
                המתן לסיום השלב...
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
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore}</span>
                  <span>נקודות</span>
                </div>
                
                {currentPlayer.lastAnswer && (
                  <div className="text-lg">
                    {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
                  </div>
                )}
                
                {!currentPlayer.lastAnswerCorrect && (
                  <div className="text-lg">
                    תשובה נכונה: {currentRound.correctSong.title} {currentRound.correctSong.artist ? `- ${currentRound.correctSong.artist}` : ''}
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
                  <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore}</span>
                  <span>נקודות</span>
                </div>
                
                <div className="text-lg">
                  נותרו לך {currentPlayer.skipsLeft} דילוגים
                </div>
              </>
            )}
            
            <div className="text-gray-500 animate-pulse">
              עובר ללוח התוצאות...
            </div>
          </div>
        );
      
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="flex items-center gap-2">
              <Trophy className="text-secondary" />
              <h2 className="text-2xl font-bold text-primary">טבלת מובילים</h2>
              <Trophy className="text-secondary" />
            </div>
            
            <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>שחקן</TableHead>
                    <TableHead className="text-right">נקודות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((player, index) => (
                    <TableRow key={index} className={player.name === currentPlayer.name ? 'bg-primary/10' : ''}>
                      <TableCell className="text-center font-medium">
                        {index === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> : index + 1}
                      </TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell className="text-right font-bold">{player.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {isHost && (
              <div className="w-full flex flex-col items-center gap-4 max-w-xs">
                <AppButton 
                  variant="primary" 
                  onClick={nextRound}
                  size="lg"
                >
                  המשך לשיר הבא
                </AppButton>
                
                <AppButton 
                  variant="secondary"
                  onClick={playFullSong}
                >
                  השמע את כל השיר
                </AppButton>
              </div>
            )}
            
            {!isHost && (
              <div className="text-lg text-gray-600 text-center">
                המתן למנהל המשחק להמשיך לשיר הבא
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      {/* Background musical notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote 
          type="note1" 
          className="absolute top-[10%] right-[15%] opacity-20" 
          size={36} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note4" 
          className="absolute bottom-[15%] left-[15%] opacity-20" 
          size={32} 
          animation="float-alt"
          color="#FFC22A"
        />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            <h2 className="text-lg text-gray-600">
              {isHost ? 'מסך מנהל המשחק' : 'מסך משחק'}
            </h2>
          </div>

          {/* Game content */}
          <div className="w-full bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md mb-4">
            {renderPhase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
