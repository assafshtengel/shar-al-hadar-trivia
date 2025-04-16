
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { Music, Users, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useGameState } from '@/contexts/GameStateContext';
import EndGameButton from '@/components/EndGameButton';

interface Player {
  id: string;
  name: string;
  game_code: string;
  joined_at: string | null;
  score: number | null;
}

const GameHostSetup: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { gameCode: contextGameCode, setGameData } = useGameState();
  const [gameCode] = useState(() => contextGameCode || Math.floor(100000 + Math.random() * 900000).toString());
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostJoined, setHostJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    if (!contextGameCode) {
      setGameData({ gameCode, playerName: hostName || 'מנחה', isHost: true });
    }
  }, [contextGameCode, gameCode]);

  useEffect(() => {
    // Initial fetch of current players
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('game_code', gameCode);

        if (error) {
          console.error('Error fetching players:', error);
          return;
        }

        if (data) {
          console.log('Fetched players:', data);
          setPlayers(data);
        }
      } catch (err) {
        console.error('Exception when fetching players:', err);
      }
    };

    fetchPlayers();

    // Set up realtime subscription for ALL database changes to the players table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Player change detected:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            // Add new player to the list
            setPlayers((prevPlayers) => [...prevPlayers, payload.new as Player]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing player in the list
            setPlayers((prevPlayers) => 
              prevPlayers.map(player => 
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove player from the list
            setPlayers((prevPlayers) => 
              prevPlayers.filter(player => player.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [gameCode]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode).then(() => {
      toast({
        title: "הקוד הועתק!",
        description: "שתף את הקוד עם חברים ומשפחה"
      });
    }).catch(() => {
      toast({
        title: "לא ניתן להעתיק",
        description: "אנא העתק את הקוד ידנית",
        variant: "destructive"
      });
    });
  };

  const startGame = async () => {
    if (players.length === 0) {
      toast({
        title: "אין שחקנים",
        description: "יש להמתין שלפחות שחקן אחד יצטרף למשחק",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('game_state')
      .update({ game_phase: 'playing' })
      .eq('game_code', gameCode);

    if (error) {
      console.error('Error updating game state:', error);
      toast({
        title: "שגיאה בהתחלת המשחק",
        description: "אירעה שגיאה בהתחלת המשחק, נסה שוב",
        variant: "destructive"
      });
      return;
    }

    setGameStarted(true);
    toast({
      title: "המשחק התחיל!",
      description: "כעת אתה יכול להשמיע שירים"
    });

    navigate('/gameplay');
  };

  const handleHostJoin = async () => {
    if (!hostName.trim()) {
      toast({
        title: "שם לא תקין",
        description: "אנא הכנס את שמך",
        variant: "destructive"
      });
      return;
    }

    setJoinLoading(true);

    const { data, error } = await supabase
      .from('players')
      .insert([
        { name: hostName, game_code: gameCode }
      ]);

    setJoinLoading(false);

    if (error) {
      console.error('Error joining host:', error);
      toast({
        title: "שגיאה בהצטרפות",
        description: "לא ניתן להצטרף למשחק, נסה שוב",
        variant: "destructive"
      });
      return;
    }

    setGameData({ gameCode, playerName: hostName, isHost: true });
    
    setHostJoined(true);
    toast({
      title: "הצטרפת למשחק!",
      description: "אתה מופיע ברשימת השחקנים"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote type="note1" className="absolute top-[10%] right-[15%] opacity-20" size={36} animation="float" color="#6446D0" />
        <MusicNote type="note4" className="absolute bottom-[15%] left-[15%] opacity-20" size={32} animation="float-alt" color="#FFC22A" />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          <div className="mb-8 text-center relative w-full">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            <h2 className="text-lg text-gray-600">מסך מנהל המשחק</h2>
            
            <div className="absolute top-0 right-0">
              <EndGameButton />
            </div>
          </div>

          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-center">קוד המשחק שלך:</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="text-3xl font-bold text-primary tracking-widest">
                {gameCode}
              </div>
              <button onClick={copyGameCode} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="העתק קוד משחק">
                <Copy className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">
              שתף את הקוד עם חברים ומשפחה כדי שיוכלו להצטרף למשחק
            </p>
          </div>

          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-center">הצטרף למשחק כמנחה</h3>
            <Input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="הכנס את שמך (כדי להצטרף למשחק)"
              disabled={hostJoined}
              className="mb-3 text-right"
            />
            <AppButton
              variant="secondary"
              size="default"
              onClick={handleHostJoin}
              disabled={hostJoined || joinLoading}
              className="w-full"
            >
              {joinLoading ? "מצטרף..." : hostJoined ? "הצטרפת למשחק" : "הצטרף גם אני"}
            </AppButton>
          </div>

          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">שחקנים שהצטרפו:</h3>
            </div>
            
            <div className="min-h-[120px] border border-gray-200 rounded-md p-2 bg-white">
              {players.length > 0 ? (
                <ul className="space-y-1">
                  {players.map((player) => (
                    <li key={player.id} className="py-2 px-3 bg-gray-50 rounded-md animate-fade-in flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{player.name}</span>
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

          <div className="w-full space-y-4 mt-2">
            <AppButton variant="primary" size="lg" onClick={startGame} disabled={gameStarted}>
              {gameStarted ? "המשחק כבר התחיל" : "התחל משחק"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHostSetup;
