
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
  duration = 8000 // Default to 8 seconds
}) => {
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [manualPlayNeeded, setManualPlayNeeded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [playButtonClicked, setPlayButtonClicked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect iOS devices
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIsIOS());
  }, []);

  useEffect(() => {
    // Clean up any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isPlaying && song) {
      if (song.embedUrl) {
        console.log('Starting song playback:', song.title);
        
        if (isIOS) {
          // For iOS, we need manual user interaction
          setManualPlayNeeded(true);
          setShowYouTubeEmbed(true);
          setError(null);
        } else {
          // For non-iOS, proceed as normal
          setShowYouTubeEmbed(true);
          setError(null);
          
          if (onPlaybackStarted) {
            onPlaybackStarted();
          }
          
          // Set up timer to end playback
          timeoutRef.current = setTimeout(() => {
            console.log('Song playback ended:', song.title);
            setShowYouTubeEmbed(false);
            setIframeLoaded(false);
            setPlayButtonClicked(false);
            onPlaybackEnded();
          }, duration);
        }
      } else {
        // Handle case where song doesn't have an embed URL
        console.error('Song has no embed URL:', song);
        setError('לשיר זה אין קישור השמעה זמין');
        if (onPlaybackError) {
          onPlaybackError();
        }
        toast.error('לא ניתן להשמיע את השיר', {
          description: 'אין קישור השמעה זמין לשיר זה'
        });
      }
    } else {
      setShowYouTubeEmbed(false);
      setManualPlayNeeded(false);
      setIframeLoaded(false);
      setPlayButtonClicked(false);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, song, duration, onPlaybackEnded, onPlaybackStarted, onPlaybackError, isIOS]);

  const handleManualPlay = () => {
    setManualPlayNeeded(false);
    setPlayButtonClicked(true);
    setIframeLoaded(true);
    
    if (onPlaybackStarted) {
      onPlaybackStarted();
    }
    
    // Set up timer to end playback
    timeoutRef.current = setTimeout(() => {
      console.log('Song playback ended (iOS):', song?.title);
      setShowYouTubeEmbed(false);
      setIframeLoaded(false);
      setPlayButtonClicked(false);
      onPlaybackEnded();
    }, duration);
    
    toast.success('השיר מתנגן', {
      description: 'במכשירי אפל, יש צורך בלחיצה ידנית להפעלת השיר'
    });
  };

  // Create YouTube embed URL with autoplay disabled for iOS (will be enabled on click)
  const createYouTubeUrl = (embedUrl: string) => {
    // Check if the URL already has parameters
    const hasParams = embedUrl.includes('?');
    const connector = hasParams ? '&' : '?';
    
    // For iOS devices that have clicked play, enable sound with mute=0
    if (isIOS && playButtonClicked) {
      return `${embedUrl}${connector}autoplay=1&mute=0`;
    } 
    
    // For non-iOS devices, use the original URL
    return embedUrl;
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
          {/* Show iframe only if non-iOS or if play button has been clicked on iOS */}
          {(!isIOS || (isIOS && iframeLoaded)) && (
            <iframe 
              ref={iframeRef}
              width="100%" 
              height="100%" 
              src={createYouTubeUrl(song.embedUrl)} 
              frameBorder="0" 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              className="absolute top-0 left-0 z-10"
              onError={() => {
                setError('שגיאה בטעינת השיר');
                if (onPlaybackError) onPlaybackError();
              }}
            />
          )}
          
          {/* iOS Manual Play Button */}
          {manualPlayNeeded && !playButtonClicked && (
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
          
          {/* Visual overlay to hide video but keep audio playing */}
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
