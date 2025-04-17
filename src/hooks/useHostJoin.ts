
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { checkPlayerExists, verifyHostInPlayersTable } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

interface UseHostJoinParams {
  gameCode: string;
  setGameData: (data: { gameCode: string; playerName: string; isHost: boolean }) => void;
  playerName?: string | null;
}

export const useHostJoin = ({ gameCode, setGameData, playerName: contextPlayerName }: UseHostJoinParams) => {
  const { toast } = useToast();
  const [hostName, setHostName] = useState(contextPlayerName || '');
  const [hostJoined, setHostJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [startGameDisabled, setStartGameDisabled] = useState(true);

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

    try {
      // First check if host already exists as a player
      const { exists } = await checkPlayerExists({
        game_code: gameCode,
        player_name: hostName
      });

      if (exists) {
        // Host already joined, just update the UI state
        setHostJoined(true);
        setStartGameDisabled(false);
        setGameData({ gameCode, playerName: hostName, isHost: true });
        
        toast({
          title: "הצטרפת למשחק!",
          description: "אתה כבר מופיע ברשימת השחקנים"
        });
        
        // Debug verification - silent
        await verifyHostInPlayersTable({ game_code: gameCode, player_name: hostName });
        
        setJoinLoading(false);
        return;
      }

      // Host doesn't exist yet, add them to players table
      const { error } = await supabase
        .from('players')
        .insert([
          { 
            name: hostName, 
            game_code: gameCode,
            score: 0,
            hasAnswered: false,
            isReady: false
          }
        ]);

      if (error) {
        console.error('Error joining host:', error);
        toast({
          title: "שגיאה בהצטרפות",
          description: "לא ניתן להצטרף למשחק, נסה שוב",
          variant: "destructive"
        });
        setJoinLoading(false);
        return;
      }

      setGameData({ gameCode, playerName: hostName, isHost: true });
      
      setHostJoined(true);
      setStartGameDisabled(false);
      toast({
        title: "הצטרפת למשחק!",
        description: "אתה מופיע ברשימת השחקנים"
      });
      
      // Add the debug verification after trying to insert the host
      const isHostAdded = await verifyHostInPlayersTable({ game_code: gameCode, player_name: hostName });
      
      // Show an alert if the host verification fails
      if (!isHostAdded) {
        toast({
          title: "שגיאה",
          description: "שגיאה: המנחה לא נוסף לרשימת השחקנים",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Exception during host join:', err);
      toast({
        title: "שגיאה בהצטרפות",
        description: "אירעה שגיאה בלתי צפויה, נסה שוב",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(false);
    }
  };

  return {
    hostName,
    setHostName,
    hostJoined,
    setHostJoined,
    joinLoading,
    handleHostJoin,
    startGameDisabled,
    setStartGameDisabled
  };
};
