import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRound } from '@/types/game';
import { Song } from '@/data/songBank';
import { defaultSongBank } from '@/data/songBank';
import { mashinaSongs } from "@/data/songs/mashina";
import { adamSongs } from "@/data/songs/adam";
import { gefenSongs } from "@/data/songs/gefen";
import { useToast } from '@/components/ui/use-toast';

interface UseGameRoundProps {
  gameCode: string | null;
  isHost: boolean;
  gameSettings?: {
    songFilter?: string;
  };
}

export const useGameRound = ({ gameCode, isHost, gameSettings }: UseGameRoundProps) => {
  const { toast } = useToast();
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const getFilteredSongs = useCallback(() => {
    if (gameSettings?.songFilter === "mashina") {
      return mashinaSongs;
    }
    if (gameSettings?.songFilter === "adam") {
      return adamSongs;
    }
    if (gameSettings?.songFilter === "gefen") {
      return gefenSongs;
    }
    return defaultSongBank;
  }, [gameSettings?.songFilter]);

  const createGameRound = useCallback((): GameRound => {
    const songList = getFilteredSongs().filter(song => song.embedUrl || song.spotifyUrl);
    const randomIndex = Math.floor(Math.random() * songList.length);
    const correctSong = songList[randomIndex];
    const otherSongs = songList.filter(song => song.id !== correctSong.id && song.title);
    const shuffledWrongSongs = [...otherSongs].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [correctSong, ...shuffledWrongSongs];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    const correctSongTitle = correctSong.title || '';
    const correctIndex = shuffledOptions.findIndex(song => song.title === correctSongTitle);
    return {
      correctSong,
      options: shuffledOptions,
      correctAnswerIndex: correctIndex
    };
  }, [getFilteredSongs]);

  const updateGameRound = useCallback(async (gameRound: GameRound) => {
    if (!isHost || !gameCode) return;
    
    const roundDataString = JSON.stringify(gameRound);
    const { error } = await supabase
      .from('game_state')
      .update({
        current_song_name: roundDataString,
        current_song_url: gameRound.correctSong.embedUrl,
        game_phase: 'playing'
      })
      .eq('game_code', gameCode);

    if (error) {
      console.error('Error storing game round data:', error);
      toast({
        title: "שגיאה בשמירת נתוני הסיבוב",
        description: "אירעה שגיאה בשמירת נתוני הסיבוב",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [gameCode, isHost, toast]);

  return {
    currentRound,
    setCurrentRound,
    currentSong,
    setCurrentSong,
    createGameRound,
    updateGameRound
  };
};
