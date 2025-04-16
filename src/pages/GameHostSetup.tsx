
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Users, Copy } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GameHostSetup: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [players, setPlayers] = useState<string[]>([]);
  const [musicSource, setMusicSource] = useState<string>("");
  const [gameStarted, setGameStarted] = useState(false);

  // Mock function to simulate players joining
  useEffect(() => {
    const mockPlayerNames = [
      "אמא", "אבא", "סבתא", "דניאל", "רותם", "נועה", "עידן", "שירה", "יובל"
    ];
    
    const interval = setInterval(() => {
      if (players.length < 5) {
        const randomIndex = Math.floor(Math.random() * mockPlayerNames.length);
        const newPlayer = mockPlayerNames[randomIndex];
        
        if (!players.includes(newPlayer)) {
          setPlayers(prev => [...prev, newPlayer]);
        }
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [players]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode)
      .then(() => {
        toast({
          title: "הקוד הועתק!",
          description: "שתף את הקוד עם חברים ומשפחה",
        });
      })
      .catch(() => {
        toast({
          title: "לא ניתן להעתיק",
          description: "אנא העתק את הקוד ידנית",
          variant: "destructive",
        });
      });
  };

  const startGame = () => {
    if (!musicSource) {
      toast({
        title: "אנא בחר מקור שירים",
        description: "יש לבחור מקור שירים לפני תחילת המשחק",
        variant: "destructive",
      });
      return;
    }
    
    if (players.length === 0) {
      toast({
        title: "אין שחקנים",
        description: "יש להמתין שלפחות שחקן אחד יצטרף למשחק",
        variant: "destructive",
      });
      return;
    }

    setGameStarted(true);
    toast({
      title: "המשחק התחיל!",
      description: "כעת אתה יכול להשמיע שירים",
    });
    
    // Navigate to gameplay screen
    navigate('/gameplay');
  };

  const playNextSong = () => {
    if (!gameStarted) return;
    
    toast({
      title: "משמיע שיר...",
      description: "השיר הבא יושמע בקרוב",
    });
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

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            <h2 className="text-lg text-gray-600">הגדרות משחק חדש</h2>
          </div>

          {/* Game Code */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-center">קוד המשחק שלך:</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="text-3xl font-bold text-primary tracking-widest">
                {gameCode}
              </div>
              <button 
                onClick={copyGameCode}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="העתק קוד משחק"
              >
                <Copy className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">
              שתף את הקוד עם חברים ומשפחה כדי שיוכלו להצטרף למשחק
            </p>
          </div>

          {/* Players List */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">שחקנים שהצטרפו:</h3>
            </div>
            
            <div className="min-h-[120px] border border-gray-200 rounded-md p-2 bg-white">
              {players.length > 0 ? (
                <ul className="space-y-1">
                  {players.map((player, index) => (
                    <li 
                      key={index} 
                      className="py-2 px-3 bg-gray-50 rounded-md animate-fade-in flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{player}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  ממתין לשחקנים...
                </div>
              )}
            </div>
          </div>

          {/* Music Source Selection */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3">בחר מקור שירים:</h3>
            <Select value={musicSource} onValueChange={setMusicSource}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר מקור שירים..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="playlist">🎵 פלייליסט מיוטיוב או ספוטיפיי</SelectItem>
                <SelectItem value="random">📄 רשימת שירים אקראית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-4 mt-2">
            <AppButton 
              variant="primary" 
              size="lg"
              onClick={startGame}
              disabled={gameStarted}
            >
              {gameStarted ? "המשחק כבר התחיל" : "התחל משחק"}
            </AppButton>
            
            <AppButton 
              variant="secondary" 
              size="lg"
              onClick={playNextSong}
              disabled={!gameStarted}
            >
              השמע שיר
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHostSetup;
