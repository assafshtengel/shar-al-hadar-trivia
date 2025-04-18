import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/data/songBank';
import { Youtube, AlertTriangle, Music, Play } from 'lucide-react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

  // Detect iOS devices
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIsIOS());
    console.log("Device is iOS:", checkIsIOS());
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
          setAudioLoadFailed(false);
          
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
              };
              
              audio.onended = () => {
                console.log("Audio playback ended naturally");
                setAudioPlaying(false);
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                onPlaybackEnded();
              };
              
              audio.onerror = (e) => {
                console.error("Audio error:", e);
                setAudioLoadFailed(true);
                if (onPlaybackError) {
                  onPlaybackError();
                }
                toast.error("שגיאה בהשמעת השיר", {
                  description: "לא ניתן להשמיע את השיר דרך נגן השמע"
                });
              };
              
              // Attempt to preload
              audio.load();
            } catch (error) {
              console.error("Error setting up audio element:", error);
              setAudioLoadFailed(true);
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
      
      // Clean up audio element
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
        } catch (error) {
          console.error("Error cleaning up audio element:", error);
        }
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Clean up audio element
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        } catch (error) {
          console.error("Error cleaning up audio element on unmount:", error);
        }
      }
    };
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
                if (audioRef.current) {
                  audioRef.current.pause();
                }
              }, duration);
            })
            .catch(error => {
              console.error('Audio playback failed:', error);
              setAudioLoadFailed(true);
              
              toast.error('השמעת השיר נכשלה', {
                description: 'יש לנסות שוב או להשתמש במכשיר אחר'
              });
              
              if (onPlaybackError) {
                onPlaybackError();
              }
            });
        }
      } catch (error) {
        console.error("Exception during audio play attempt:", error);
        setAudioLoadFailed(true);
        
        if (onPlaybackError) {
          onPlaybackError();
        }
      }
    } else {
      console.error("Cannot play audio: audioRef or song.fullUrl is missing");
      toast.error('השמעת השיר נכשלה', {
        description: 'קישור השיר חסר או לא תקין'
      });
      
      if (onPlaybackError) {
        onPlaybackError();
      }
    }
    
    toast.success('מנסה להשמיע את השיר', {
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
            src={`${song.embedUrl}${manualPlayClicked ? '&autoplay=1' : ''}`}
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen 
            className="absolute top-0 left-0 z-10"
            onError={() => {
              setError('שגיאה בטעינת השיר');
              if (onPlaybackError) onPlaybackError();
            }}
          />
          
          {/* iOS Manual Play Button */}
          {manualPlayNeeded && !manualPlayClicked && (
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
          
          {/* iOS playback indicator */}
          {isIOS && (manualPlayClicked || audioPlaying) && (
            <div className="absolute top-2 right-2 z-40 bg-green-500 text-white px-2 py-1 rounded-md text-sm animate-pulse">
              {audioPlaying ? "השיר מתנגן..." : "מנסה להשמיע..."}
            </div>
          )}
          
          {/* Audio error indicator */}
          {audioLoadFailed && (
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
