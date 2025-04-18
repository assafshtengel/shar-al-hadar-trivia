
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Song {
  id?: string;
  title?: string;
  name?: string;
  artist?: string;
  embedUrl: string;
  order?: number;
}

interface RoundData {
  round?: number;
  correctSong: Song;
  options: string[];
}

export const useGameRound = (gameCode: string | null, isHost: boolean) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [round, setRound] = useState<number>(1);

  const extractVideoId = (url: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const createFallbackSongData = (songUrl?: string, songName?: string) => {
    const dummySong = {
      id: '1',
      title: songName || 'שיר לא ידוע',
      name: songName || 'שיר לא ידוע',
      artist: 'אמן לא ידוע',
      embedUrl: songUrl || '',
      order: 1
    };
    
    setCurrentSong(dummySong);
    setCorrectAnswer(dummySong.title || dummySong.name);
    setYoutubeVideoId(extractVideoId(dummySong.embedUrl));
    setAnswerOptions([dummySong.title || dummySong.name, 'שיר אחר 1', 'שיר אחר 2'].sort(() => Math.random() - 0.5));
  };

  const createHostDemoSongData = () => {
    const demoSong = {
      id: 'demo1',
      title: 'שיר דוגמה למארח',
      name: 'שיר דוגמה למארח',
      artist: 'אמן דוגמה',
      embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      order: 1
    };
    
    setCurrentSong(demoSong);
    setCorrectAnswer(demoSong.title || demoSong.name);
    setYoutubeVideoId(extractVideoId(demoSong.embedUrl));
    setAnswerOptions([demoSong.title || demoSong.name, 'שיר אחר 1', 'שיר אחר 2'].sort(() => Math.random() - 0.5));
  };

  const fetchGameRoundData = useCallback(async () => {
    if (!gameCode) return;
    
    setIsLoading(true);
    setParseError(null);

    try {
      console.log('Fetching game round data for game code:', gameCode);
      const { data, error } = await supabase
        .from('game_state')
        .select('current_round, current_song_name, current_song_url')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game round data:', error);
        setIsLoading(false);
        return;
      }

      console.log('Game round data received:', data);

      if (data) {
        if (data.current_round) {
          setRound(data.current_round);
        }

        if (data.current_song_name) {
          try {
            const roundData = JSON.parse(data.current_song_name);
            console.log('Parsed round data:', roundData);
            
            if (roundData && roundData.correctSong) {
              // Handle both title and name field formats
              if (roundData.correctSong.name && !roundData.correctSong.title) {
                console.log('Converting name field to title field');
                roundData.correctSong.title = roundData.correctSong.name;
              } else if (roundData.correctSong.title && !roundData.correctSong.name) {
                roundData.correctSong.name = roundData.correctSong.title;
              }
              
              setCurrentRound(roundData);
              setCurrentSong(roundData.correctSong);
              setAnswerOptions(roundData.options || []);
              
              // Set correct answer based on available field
              if (roundData.correctSong.title) {
                setCorrectAnswer(roundData.correctSong.title);
              } else if (roundData.correctSong.name) {
                setCorrectAnswer(roundData.correctSong.name);
              } else {
                console.warn('No title/name field found in correctSong');
                setCorrectAnswer('Unknown Song');
              }
              
              // Handle embedUrl properly
              setYoutubeVideoId(extractVideoId(roundData.correctSong.embedUrl || data.current_song_url));
            } else {
              console.log('No valid song data in round data');
              createFallbackSongData(data.current_song_url);
            }
          } catch (parseError) {
            console.error('Error parsing round data:', parseError);
            setParseError(`Error parsing JSON: ${parseError.message}`);
            createFallbackSongData(data.current_song_url);
          }
        } else if (isHost) {
          console.log('Host mode: Using demo song data');
          createHostDemoSongData();
        } else {
          console.log('No song data available and not host');
          setCurrentRound(null);
          setCurrentSong(null);
          setAnswerOptions([]);
          setCorrectAnswer(null);
          setYoutubeVideoId(null);
        }
      }
    } catch (err) {
      console.error('Exception when fetching current song:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameCode, isHost]);

  return {
    currentSong,
    currentRound,
    answerOptions,
    correctAnswer,
    youtubeVideoId,
    isLoading,
    parseError,
    round,
    setRound,
    fetchGameRoundData,
    createHostDemoSongData
  };
};
