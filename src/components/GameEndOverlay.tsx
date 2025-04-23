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
  const { clearGameData, gameSettings, gameCode } = useGameState();
  const lastVisibilityChange = useRef<number>(Date.now());
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangesRef = useRef<number>(0);
  const [isScoreLimitReached, setIsScoreLimitReached] = useState(false);
  const [isTimeLimitReached, setIsTimeLimitReached] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);
  
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
      if (!gameCode) return;

      try {
        console.log('Fetching final scores for game end overlay');
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
          console.log('Final game scores retrieved:', data);
          setPlayers(data);
          setScoresLoaded(true);
          
          // Check if score limit reached
          if (gameSettings.scoreLimit && data.length > 0) {
            const highestScore = data[0].score;
            setIsScoreLimitReached(highestScore >= gameSettings.scoreLimit);
          }
        }
      } catch (err) {
        console.error('Exception fetching final scores:', err);
      }
    };

    if (showOverlay) {
      fetchFinalScores();
    }
  }, [showOverlay, gameSettings, gameCode]);
  
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
      setScoresLoaded(false);
    }
  }, [isVisible]);
  
  useEffect(() => {
    if (showOverlay) {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      
      // Only setup auto-redirect for final game end
      if (isScoreLimitReached || isTimeLimitReached) {
        redirectTimerRef.current = setTimeout(() => {
          handleCloseOverlay();
          redirectTimerRef.current = null;
        }, 10000);
      }
    }
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [showOverlay, isScoreLimitReached, isTimeLimitReached]);

  const handleCloseOverlay = () => {
    // Only clear game data after ensuring scores are loaded and displayed
    if (scoresLoaded) {
      toast('המשחק הסתיים', {
        description: 'חוזר לדף הבית',
      });
      clearGameData(); // Only reset scores when actually leaving the game
      navigate('/');
      setShowOverlay(false);
    } else {
      console.log('Not clearing game data yet - scores have not been loaded');
      // Give more time for scores to load
      setTimeout(() => {
        if (!scoresLoaded) {
          console.log('Scores still not loaded after timeout, proceeding with navigation');
          clearGameData();
          navigate('/');
          setShowOverlay(false);
        }
      }, 2000);
    }
  };
  
  const handleNextRound = async () => {
    console.log('Starting next round');
    setShowOverlay(false);
    
    if (isHost) {
      // Update game state to start a new round
      try {
        if (!gameCode) return;
        
        const { error } = await supabase
          .from('game_state')
          .update({ game_phase: 'playing' })
          .eq('game_code', gameCode);
          
        if (error) {
          console.error('Error updating game state for next round:', error);
          toast('שגיאה בהתחלת סיבוב חדש', {
            description: 'אירעה שגיאה בהתחלת סיבוב חדש',
          });
        } else {
          toast('מתחיל סיבוב חדש', {
            description: 'סיבוב חדש מתחיל עכשיו',
          });
        }
      } catch (err) {
        console.error('Exception when starting next round:', err);
      }
    }
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

        <h2 className="text-2xl font-bold text-primary mb-4">טבלת המובילים</h2>

        {players.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-primary">טוען נתונים...</div>
          </div>
        ) : (
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
        )}

        <div className="text-sm text-gray-500 mb-3">
          {players.length > 0 && `המנצח: ${players[0].name} עם ${players[0].score} נקודות`}
        </div>
        
        {isHost && !isScoreLimitReached && (
          <AppButton 
            variant="primary" 
            size="lg"
            className="mt-4"
            onClick={handleNextRound}
          >
            התחל סיבוב חדש
          </AppButton>
        )}
        
        {isScoreLimitReached && (
          <div className="text-sm text-gray-500 mb-3">
            הגעת למגבלת הניקוד. המשחק הסתיים!
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEndOverlay;
