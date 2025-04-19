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
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [manualPlayNeeded, setManualPlayNeeded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const ensureEmbedParams = (url: string | undefined): string => {
    if (!url) return '';
    
    if (url.includes('?')) {
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.append('autoplay', '1');
      }
      if (!urlObj.searchParams.has('controls')) {
        urlObj.searchParams.append('controls', '0');
      }
      if (!urlObj.searchParams.has('modestbranding')) {
        urlObj.searchParams.append('modestbranding', '1');
      }
      if (!urlObj.searchParams.has('rel')) {
        urlObj.searchParams.append('rel', '0');
      }
      return urlObj.toString();
    } 
    else {
      return `${url}?autoplay=1&controls=0&modestbranding=1&rel=0`;
    }
  };

  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIsIOS());
  }, []);

  const validateYouTubeUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      if (response.status === 404) {
        console.error('YouTube video not found:', url);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating YouTube URL:', error);
      return false;
    }
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isPlaying && song) {
      if (song.embedUrl) {
        console.log('Starting song playback:', song.title);
        
        validateYouTubeUrl(song.embedUrl).then(isValid => {
          if (!isValid) {
            console.error('Invalid YouTube URL detected for song:', song.title);
            setError('השיר אינו זמין כרגע');
            if (onPlaybackError) {
              onPlaybackError();
            }
            toast.error('השיר אינו זמין', {
              description: 'מנסה לטעון שיר אחר...'
            });
            return;
          }
          
          if (isIOS) {
            setManualPlayNeeded(true);
            setShowYouTubeEmbed(true);
            setError(null);
          } else {
            setShowYouTubeEmbed(true);
            setError(null);
            
            if (onPlaybackStarted) {
              onPlaybackStarted();
            }
            
            timeoutRef.current = setTimeout(() => {
              console.log('Song playback ended:', song.title);
              setShowYouTubeEmbed(false);
              onPlaybackEnded();
            }, duration);
          }
        });
      } else {
        setError('לשיר זה אין קישור השמעה זמין');
        if (onPlaybackError) {
          onPlaybackError();
        }
        toast.error('שגיאה בהשמעת השיר', {
          description: 'אין קישור השמעה זמין לשיר זה'
        });
      }
    } else {
      setShowYouTubeEmbed(false);
      setManualPlayNeeded(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, song, duration, onPlaybackEnded, onPlaybackStarted, onPlaybackError, isIOS]);

  const handleManualPlay = () => {
    setManualPlayNeeded(false);
    
    if (onPlaybackStarted) {
      onPlaybackStarted();
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Song playback ended (iOS):', song?.title);
      setShowYouTubeEmbed(false);
      onPlaybackEnded();
    }, duration);
    
    toast.success('השיר מתנגן', {
      description: 'במכשירי אפל, יש צורך בלחיצה ידנית להפעלת השיר'
    });
  };

  if (!song || !isPlaying) {
    return null;
  }

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
    <div className="relative w-full h-40">
      {showYouTubeEmbed && song.embedUrl ? (
        <>
          <iframe 
            ref={iframeRef}
            width="100%" 
            height="100%" 
            src={ensureEmbedParams(song.embedUrl)} 
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen 
            className="absolute top-0 left-0 z-10"
            onError={() => {
              setError('שגיאה בטעינת השיר');
              if (onPlaybackError) onPlaybackError();
            }}
          />
          
          {manualPlayNeeded && (
            <div className="absolute top-0 left-0 w-full h-full z-30 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <AppButton 
                  variant="primary" 
                  size="lg" 
                  onClick={handleManualPlay}
                  className="flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  לחץ כאן להפעלת השיר
                </AppButton>
                <p className="text-white mt-2 text-sm">במכשירי אפל נדרשת הפעלה ידנית</p>
              </div>
            </div>
          )}
          
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-black"></div>
        </>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-full h-full">
            <MusicNote type="note1" className="absolute top-0 right-0 text-primary animate-float" size={32} />
            <MusicNote type="note2" className="absolute top-10 left-0 text-secondary animate-float-alt" size={28} />
            <MusicNote type="note3" className="absolute bottom-10 right-10 text-accent animate-float" size={36} />
          </div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Music className="w-10 h-10 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SongPlayer;
