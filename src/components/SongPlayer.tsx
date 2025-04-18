import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/data/songBank';
import { Youtube, AlertTriangle, Music, Play, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import MusicNote from './MusicNote';
import AppButton from './AppButton';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: any;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

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
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytScriptLoaded = useRef(false);

  // Detect iOS devices
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIsIOS());
  }, []);

  // Load YouTube API
  useEffect(() => {
    if (!ytScriptLoaded.current && isPlaying && song && song.embedUrl) {
      // Extract video ID from embedUrl
      const getYouTubeId = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
      };
      
      const videoId = getYouTubeId(song.embedUrl);
      
      if (!videoId) {
        console.error('Could not extract YouTube video ID from URL:', song.embedUrl);
        setError('שגיאה בטעינת השיר - לא ניתן לזהות את מזהה הסרטון');
        if (onPlaybackError) onPlaybackError();
        return;
      }

      // Only load the script once
      if (!document.getElementById('youtube-api') && !window.YT) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
          setYoutubeReady(true);
          ytScriptLoaded.current = true;
        };
      } else if (window.YT) {
        setYoutubeReady(true);
        ytScriptLoaded.current = true;
      }
    }
  }, [isPlaying, song, onPlaybackError]);

  // Initialize YouTube player when API is ready
  useEffect(() => {
    if (!youtubeReady || !song || !isPlaying || !song.embedUrl || !containerRef.current) return;

    // Extract video ID from embedUrl
    const getYouTubeId = (url: string) => {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return match ? match[1] : null;
    };
    
    const videoId = getYouTubeId(song.embedUrl);
    
    if (!videoId) {
      console.error('Could not extract YouTube video ID from URL:', song.embedUrl);
      return;
    }

    try {
      // Create player div if it doesn't exist
      if (!document.getElementById('youtube-player')) {
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        containerRef.current.appendChild(playerDiv);
      }

      // Initialize YouTube player
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1, // Start muted (required for autoplay on iOS)
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1, // Important for iOS
          fs: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });

      setIframeLoaded(true);
      setManualPlayNeeded(isIOS);
      
      if (onPlaybackStarted) {
        onPlaybackStarted();
      }
    } catch (err) {
      console.error('Error initializing YouTube player:', err);
      setError('שגיאה בטעינת הנגן');
      if (onPlaybackError) onPlaybackError();
    }
  }, [youtubeReady, song, isPlaying, onPlaybackStarted, onPlaybackError, isIOS]);

  const onPlayerReady = (event: any) => {
    try {
      event.target.playVideo();
      console.log('YouTube player ready');
      
      // Set up timer to end playback (even for iOS)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log('Song playback timed out after duration:', duration);
        cleanupPlayer();
        onPlaybackEnded();
      }, duration);
    } catch (error) {
      console.error('Error in onPlayerReady:', error);
      if (onPlaybackError) onPlaybackError();
    }
  };

  const onPlayerStateChange = (event: any) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      console.log('YouTube video ended naturally');
      cleanupPlayer();
      onPlaybackEnded();
    }
  };

  const onPlayerError = (event: any) => {
    console.error('YouTube player error:', event);
    setError('שגיאה בהשמעת השיר');
    cleanupPlayer();
    if (onPlaybackError) onPlaybackError();
  };

  const handleManualPlay = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setManualPlayNeeded(false);
        
        toast.success('השיר מתנגן', {
          description: 'לחצת בהצלחה על כפתור ההפעלה'
        });
      } catch (error) {
        console.error('Error in handleManualPlay:', error);
        toast.error('שגיאה בהשמעת השיר', {
          description: 'נסה לפתוח את הקישור הישיר לשיר'
        });
      }
    }
  };

  const cleanupPlayer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Stop and destroy YouTube player if it exists
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (error) {
        console.error('Error cleaning up YouTube player:', error);
      }
    }
    
    setShowYouTubeEmbed(false);
    setManualPlayNeeded(false);
    setIframeLoaded(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPlayer();
    };
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
        setShowYouTubeEmbed(true);
        setError(null);
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
      cleanupPlayer();
    }
  }, [isPlaying, song, duration, onPlaybackError]);

  // Direct link handler
  const openDirectLink = () => {
    if (song && song.fullUrl) {
      window.open(song.fullUrl, '_blank');
      toast.success('נפתח קישור ישיר לשיר', {
        description: 'השיר ייפתח בחלון או בלשונית חדשה'
      });
    } else if (song && song.embedUrl) {
      // If no full URL, try to open the embed URL directly
      window.open(song.embedUrl, '_blank');
      toast.success('נפתח קישור להשמעת השיר', {
        description: 'השיר ייפתח בחלון או בלשונית חדשה'
      });
    } else {
      toast.error('אין קישור ישיר זמין', {
        description: 'לא ניתן למצוא קישור ישיר לשיר זה'
      });
    }
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
          {song.fullUrl && (
            <AppButton 
              variant="secondary" 
              size="default" 
              onClick={openDirectLink}
              className="mt-2"
            >
              פתח קישור ישיר
              <Youtube className="mr-2" />
            </AppButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-40" ref={containerRef}>
      {showYouTubeEmbed && song.embedUrl ? (
        <>
          <div className="absolute top-0 left-0 w-full h-full z-10"></div>
          
          {/* iOS Manual Play Button */}
          {manualPlayNeeded && (
            <div className="absolute top-0 left-0 w-full h-full z-30 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <AppButton 
                  variant="primary" 
                  size="default" 
                  onClick={handleManualPlay}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  הפעל סאונד
                </AppButton>
                <p className="text-white mt-2 text-sm">במכשירי אפל יש ללחוץ כאן להפעלת השמע</p>
                
                <AppButton 
                  variant="secondary" 
                  size="default" 
                  onClick={openDirectLink}
                  className="mt-4 flex items-center gap-2"
                >
                  <Youtube className="w-5 h-5" />
                  פתח קישור ישיר
                </AppButton>
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
