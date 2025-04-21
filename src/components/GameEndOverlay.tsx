import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/contexts/GameStateContext';
import { toast } from 'sonner';
import { X, Trophy, Award, List } from 'lucide-react';
import AppButton from './AppButton';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GameEndOverlayProps {
  isVisible: boolean;
  isHost: boolean;
}

const GameEndOverlay: React.FC<GameEndOverlayProps> = ({ isVisible, isHost }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [players, setPlayers] = useState<{id: string, name: string, score: number}[]>([]);
  const navigate = useNavigate();
  const { clearGameData } = useGameState();
  const lastVisibilityChange = useRef<number>(Date.now());
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangesRef = useRef<number>(0);
  
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchFinalScores = async () => {
      const { gameCode } = useGameState();
      if (!gameCode) return;

      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, name, score')
          .eq('game_code', gameCode)
          .order('score', { ascending: false });

        if (error) {
          console.error('Error fetching final scores:', error);
          return;
        }

        if (data) {
          console.log('Final game scores:', data);
          setPlayers(data);
        }
      } catch (err) {
        console.error('Exception fetching final scores:', err);
      }
    };

    if (showOverlay) {
      fetchFinalScores();
    }
  }, [showOverlay]);
  
  useEffect(() => {
    const currentTime = Date.now();
    
    if (isVisible !== showOverlay) {
      visibilityChangesRef.current += 1;
      console.log(`Game end visibility changed to ${isVisible}, change #${visibilityChangesRef.current}`);
    }
    
    const requiredInterval = 750; 
    
    if (currentTime - lastVisibilityChange.current < requiredInterval) {
      console.log(`Ignoring rapid game end state change (${currentTime - lastVisibilityChange.current}ms since last change)`);
      return;
    }
    
    lastVisibilityChange.current = currentTime;
    
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    
    if (isVisible) {
      console.log('Game end detected, scheduling overlay display with delay');
      overlayTimerRef.current = setTimeout(() => {
        console.log('Displaying game end overlay');
        setShowOverlay(true);
        overlayTimerRef.current = null;
      }, 1000);
    } else {
      console.log('Game end state cleared');
      setShowOverlay(false);
    }
  }, [isVisible]);
  
  useEffect(() => {
    if (showOverlay) {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      redirectTimerRef.current = setTimeout(() => {
        handleCloseOverlay();
        redirectTimerRef.current = null;
      }, 10000);
    }
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [showOverlay]);

  const handleCloseOverlay = () => {
    toast('המשחק הסתיים', {
      description: 'חוזר לדף הבית',
    });
    clearGameData();
    navigate('/');
    setShowOverlay(false);
  };
  
  if (!showOverlay) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto animate-scale-in">
        <button 
          onClick={handleCloseOverlay}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="סגור"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>

        <div className="w-full mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">מיקום</TableHead>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">ניקוד</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player, idx) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell className="font-semibold">{player.name}</TableCell>
                  <TableCell className={`font-bold ${player.score < 0 ? "text-red-500" : ""}`}>
                    {player.score}
                  </TableCell>
                  <TableCell className="text-right">
                    {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    {idx === 1 && <Award className="h-5 w-5 text-gray-400" />}
                    {idx === 2 && <Award className="h-5 w-5 text-amber-700" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          {players.length > 0 && `המנצח: ${players[0].name} עם ${players[0].score} נקודות`}
        </div>
        <div className="text-sm text-gray-500 mb-3">
          המשחק הסתיים! תועבר אוטומטית לדף הבית בעוד 10 שניות.
        </div>
        <AppButton 
          variant="primary" 
          size="lg"
          className="mt-4"
          onClick={handleCloseOverlay}
        >
          יציאה מהמשחק ולחזור לדף הבית
        </AppButton>
      </div>
    </div>
  );
};

export default GameEndOverlay;
