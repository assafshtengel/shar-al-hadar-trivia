
import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/data/songBank';
import { Youtube, AlertTriangle, Music, Play, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import MusicNote from './MusicNote';
import AppButton from './AppButton';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [manualPlayClicked, setManualPlayClicked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoadFailed, setAudioLoadFailed] = useState(false);
  const [directLinkShown, setDirectLinkShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();
  const audioAttemptsRef = useRef(0);

  // Detect iOS devices
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIsIOS());
    console.log("Device is iOS:", checkIsIOS());
  }, []);

  // Clean up function to handle all resources
  const cleanupResources = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (audioRef.current) {
      try {
        const audio = audioRef.current;
        
        // Remove all event listeners to prevent memory leaks
        audio.oncanplay = null;
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
        audio.onpause = null;
        
        audio.pause();
        audio.src = '';
        audio.load();
      } catch (error) {
        console.error("Error cleaning up audio element:", error);
      }
    }
  };

  useEffect(() => {
    // Clean up any existing timeout
    cleanupResources();

    if (isPlaying && song) {
      if (song.embedUrl) {
        console.log('Starting song playback:', song.title);
        
        if (isIOS) {
          // For iOS, we need manual user interaction
          setManualPlayNeeded(true);
          setShowYouTubeEmbed(true);
          setError(null);
          setAudioLoadFailed(false);
          setDirectLinkShown(false);
          audioAttemptsRef.current = 0;
          
          // Create an audio element for iOS as a fallback
          if (!audioRef.current && song.fullUrl) {
            try {
              const audio = new Audio();
              audio.src = song.fullUrl;
              audio.preload = 'auto';
              audioRef.current = audio;
              
              audio.oncanplay = () => {
                console.log("Audio can be played now");
                setAudioLoadFailed(false);
              };
              
              audio.onplaying = () => {
                console.log("Audio is now playing");
                setAudioPlaying(true);
                if (onPlaybackStarted) {
                  onPlaybackStarted();
                }
                
                // Set timer for ending playback automatically
                timeoutRef.current = setTimeout(() => {
                  console.log('Song playback ended (audio timer):', song.title);
                  cleanupResources();
                  onPlaybackEnded();
                  setShowYouTubeEmbed(false);
                  setAudioPlaying(false);
                }, duration);
              };
              
              audio.onended = () => {
                console.log("Audio playback ended naturally");
                setAudioPlaying(false);
                cleanupResources();
                onPlaybackEnded();
              };
              
              audio.onerror = (e) => {
                console.error("Audio error:", e);
                audioAttemptsRef.current += 1;
                
                if (audioAttemptsRef.current >= 2) {
                  setAudioLoadFailed(true);
                  setDirectLinkShown(true);
                  
                  toast.error("שגיאה בהשמעת השיר", {
                    description: "לא ניתן להשמיע את השיר באופן אוטומטי, נסה ללחוץ על הקישור הישיר"
                  });
                  
                  if (onPlaybackError) {
                    onPlaybackError();
                  }
                } else {
                  // Try one more time with a short delay
                  setTimeout(() => {
                    if (audioRef.current) {
                      console.log("Retrying audio play...");
                      audioRef.current.load();
                    }
                  }, 500);
                }
              };
              
              // Attempt to preload
              audio.load();
            } catch (error) {
              console.error("Error setting up audio element:", error);
              setAudioLoadFailed(true);
              setDirectLinkShown(true);
            }
          }
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
      setManualPlayClicked(false);
      setAudioPlaying(false);
      setDirectLinkShown(false);
      
      // Remove audio element reference
      audioRef.current = null;
    }

    // Cleanup function
    return cleanupResources;
  }, [isPlaying, song, duration, onPlaybackEnded, onPlaybackStarted, onPlaybackError, isIOS]);

  const handleManualPlay = () => {
    console.log('Manual play button clicked');
    setManualPlayNeeded(false);
    setManualPlayClicked(true);
    
    // Try both YouTube iframe and direct audio playback for iOS
    if (iframeRef.current) {
      try {
        // Force reload the iframe with autoplay=1
        const src = iframeRef.current.src;
        iframeRef.current.src = '';
        setTimeout(() => {
          if (iframeRef.current) {
            // Add or update autoplay parameter
            const newSrc = src.includes('autoplay=') 
              ? src.replace('autoplay=0', 'autoplay=1') 
              : `${src}&autoplay=1`;
            iframeRef.current.src = newSrc;
            console.log('Updated iframe src with autoplay:', newSrc);
          }
        }, 100);
      } catch (error) {
        console.error("Error updating iframe:", error);
      }
    }
    
    // Try audio fallback for iOS - this is the critical part
    if (audioRef.current && song?.fullUrl) {
      console.log('Attempting to play audio directly from URL:', song.fullUrl);
      
      try {
        // Reset audio element to ensure we have a fresh start
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
              setAudioPlaying(true);
              
              if (onPlaybackStarted) {
                onPlaybackStarted();
              }
              
              // Set up timer to end playback
              timeoutRef.current = setTimeout(() => {
                console.log('Song playback ended (iOS timer):', song?.title);
                setShowYouTubeEmbed(false);
                setAudioPlaying(false);
                onPlaybackEnded();
                
                // Stop audio if it's playing
                cleanupResources();
              }, duration);
            })
            .catch(error => {
              console.error('Audio playback failed:', error);
              setAudioLoadFailed(true);
              setDirectLinkShown(true);
              
              toast.error('השמעת השיר נכשלה', {
                description: 'אנא נסה ללחוץ על הקישור הישיר להשמעת השיר'
              });
              
              if (onPlaybackError) {
                onPlaybackError();
              }
            });
        }
      } catch (error) {
        console.error("Exception during audio play attempt:", error);
        setAudioLoadFailed(true);
        setDirectLinkShown(true);
        
        if (onPlaybackError) {
          onPlaybackError();
        }
      }
    } else {
      console.error("Cannot play audio: audioRef or song.fullUrl is missing");
      setDirectLinkShown(true);
      toast.error('השמעת השיר נכשלה', {
        description: 'אנא נסה ללחוץ על הקישור הישיר להשמעת השיר'
      });
      
      if (onPlaybackError) {
        onPlaybackError();
      }
    }
    
    toast.success('מנסה להשמיע את השיר', {
      description: 'במכשירי אפל, יתכן שתצטרך להשתמש בקישור הישיר'
    });
  };

  const openDirectLink = () => {
    if (song?.fullUrl) {
      // Open in a new tab and focus on it
      const newWindow = window.open(song.fullUrl, '_blank');
      if (newWindow) newWindow.focus();
      
      // Set a timer for ending the game round
      timeoutRef.current = setTimeout(() => {
        console.log('Song playback ended (external link timer):', song?.title);
        setShowYouTubeEmbed(false);
        setAudioPlaying(false);
        onPlaybackEnded();
        
        cleanupResources();
      }, duration);
      
      if (onPlaybackStarted) {
        onPlaybackStarted();
      }
      
      toast.success('קישור ישיר נפתח', {
        description: 'השיר יושמע בחלון חדש'
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
            src={`${song.embedUrl}${manualPlayClicked ? '&autoplay=1' : ''}`}
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen 
            className="absolute top-0 left-0 z-10"
            onError={() => {
              setError('שגיאה בטעינת השיר');
              setDirectLinkShown(true);
              if (onPlaybackError) onPlaybackError();
            }}
          />
          
          {/* iOS Manual Play Button */}
          {manualPlayNeeded && !manualPlayClicked && (
            <div className="absolute top-0 left-0 w-full h-full z-30 flex flex-col items-center justify-center bg-black/70">
              <div className="text-center">
                <AppButton 
                  variant="primary" 
                  size="lg" 
                  onClick={handleManualPlay}
                  className="flex items-center gap-2 mb-4"
                >
                  <Play className="w-5 h-5" />
                  לחץ כאן להפעלת השיר
                </AppButton>
                {song.fullUrl && (
                  <AppButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={openDirectLink}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    פתח קישור ישיר
                  </AppButton>
                )}
                <p className="text-white mt-2 text-sm">במכשירי אפל נדרשת הפעלה ידנית</p>
              </div>
            </div>
          )}
          
          {/* Direct link option when automatic playback fails */}
          {directLinkShown && song.fullUrl && (
            <div className="absolute top-12 left-0 w-full z-40 flex justify-center">
              <AppButton 
                variant="primary" 
                size="sm" 
                onClick={openDirectLink}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 animate-pulse"
              >
                <ExternalLink className="w-4 h-4" />
                לחץ כאן לפתיחת השיר בחלון חדש
              </AppButton>
            </div>
          )}
          
          {/* iOS playback indicator */}
          {isIOS && (manualPlayClicked || audioPlaying) && (
            <div className="absolute top-2 right-2 z-40 bg-green-500 text-white px-2 py-1 rounded-md text-sm animate-pulse">
              {audioPlaying ? "השיר מתנגן..." : "מנסה להשמיע..."}
            </div>
          )}
          
          {/* Audio error indicator */}
          {audioLoadFailed && !directLinkShown && (
            <div className="absolute top-2 left-2 z-40 bg-red-500 text-white px-2 py-1 rounded-md text-sm">
              לא ניתן להשמיע את השיר
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
      
      {/* Hidden audio element for iOS fallback - moved outside to prevent hiding issues */}
      {isIOS && song.fullUrl && (
        <audio 
          ref={(el) => { audioRef.current = el; }}
          src={song.fullUrl}
          preload="auto"
          style={{ display: 'none' }}
          controls={false}
        />
      )}
    </div>
  );
};

export default SongPlayer;
