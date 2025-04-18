import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/data/songBank';
import { Youtube, AlertTriangle, Music, Play } from 'lucide-react';
import { toast } from 'sonner';
import MusicNote from './MusicNote';
import AppButton from './AppButton';

interface SongPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onPlaybackEnded: () => void;
  onPlaybackStarted?: () => void;
  onPlaybackError?: () => void;
  duration?: number;
}

const SongPlayer: React.FC<SongPlayerProps> = ({
  song,
  isPlaying,
  onPlaybackEnded,
  onPlaybackStarted,
  onPlaybackError,
  duration = 8000
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect iOS devices
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    setIsIOS(checkIsIOS());
  }, []);

  // Handle popup window cleanup
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [popupWindow]);

  const getYoutubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const createYoutubeDirectUrl = (embedUrl: string): string => {
    const videoId = getYoutubeVideoId(embedUrl);
    if (!videoId) return '';
    return `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
  };

  const handlePlayback = () => {
    if (!song?.embedUrl) {
      setError('לשיר זה אין קישור השמעה זמין');
      if (onPlaybackError) onPlaybackError();
      return;
    }

    if (onPlaybackStarted) {
      onPlaybackStarted();
    }

    if (isIOS) {
      // For iOS, open in a new window
      const youtubeUrl = createYoutubeDirectUrl(song.embedUrl);
      const newWindow = window.open(youtubeUrl, '_blank');
      setPopupWindow(newWindow);

      // Set timeout to close the window
      timeoutRef.current = setTimeout(() => {
        if (newWindow && !newWindow.closed) {
          newWindow.close();
        }
        setPopupWindow(null);
        onPlaybackEnded();
      }, duration);

      toast.success('השיר מתנגן בחלון חדש');
    } else {
      // For non-iOS, use existing iframe method
      console.log('Starting song playback:', song.title);
        
        // For non-iOS, proceed as normal with YouTube embed
        if (onPlaybackStarted) {
          onPlaybackStarted();
        }
        
        // Set up timer to end playback
        timeoutRef.current = setTimeout(() => {
          console.log('Song playback ended:', song.title);
          onPlaybackEnded();
        }, duration);
    }
  };

  if (error) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-red-50 border border-red-300 rounded-md">
        <div className="flex flex-col items-center text-red-500 gap-2">
          <AlertTriangle size={32} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-40 bg-black/5 rounded-lg overflow-hidden">
      {song && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          {isIOS ? (
            <div 
              className="flex flex-col items-center justify-center cursor-pointer space-y-4"
              onClick={handlePlayback}
            >
              {getYoutubeVideoId(song.embedUrl) && (
                <img 
                  src={`https://img.youtube.com/vi/${getYoutubeVideoId(song.embedUrl)}/hqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              )}
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-md">
                  הפעל שיר
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <MusicNote type="note1" className="absolute top-0 right-0 text-primary animate-float" size={32} />
              <MusicNote type="note2" className="absolute top-10 left-0 text-secondary animate-float-alt" size={28} />
              <MusicNote type="note3" className="absolute bottom-10 right-10 text-accent animate-float" size={36} />
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Music className="w-10 h-10 text-primary" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SongPlayer;
