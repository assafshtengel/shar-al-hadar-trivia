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
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [iframeCreated, setIframeCreated] = useState(false);
  const [localVideoCreated, setLocalVideoCreated] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
          // For iOS, show placeholder instead of iframe
          setShowPlaceholder(true);
          setShowYouTubeEmbed(false);
          setIframeCreated(false);
          setLocalVideoCreated(false);
          setError(null);
        } else {
          // For non-iOS, proceed as normal with YouTube embed
          setShowYouTubeEmbed(true);
          setShowPlaceholder(false);
          setError(null);
          
          if (onPlaybackStarted) {
            onPlaybackStarted();
          }
          
          // Set up timer to end playback
          timeoutRef.current = setTimeout(() => {
            console.log('Song playback ended:', song.title);
            setShowYouTubeEmbed(false);
            setShowPlaceholder(false);
            setIframeCreated(false);
            setLocalVideoCreated(false);
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
      setShowPlaceholder(false);
      setIframeCreated(false);
      setLocalVideoCreated(false);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, song, duration, onPlaybackEnded, onPlaybackStarted, onPlaybackError, isIOS]);

  // Function to handle iOS play button click with local video element
  const handleiOSPlay = () => {
    if (!song || !song.embedUrl) return;
    
    console.log('iOS play button clicked, creating local video element...');
    setLocalVideoCreated(true);
    setShowPlaceholder(false);
    
    if (onPlaybackStarted) {
      onPlaybackStarted();
    }
    
    // After the video element is created, we'll set a timeout to end playback
    // This happens in the useEffect that monitors localVideoCreated
    
    toast.success('השיר מתנגן', {
      description: 'במכשירי אפל, השיר מתנגן כעת'
    });
  };

  // Set up playback timer when local video is created and starts playing
  useEffect(() => {
    if (localVideoCreated && song) {
      // Set up timer to end playback
      timeoutRef.current = setTimeout(() => {
        console.log('Song playback ended (iOS local video):', song.title);
        setShowYouTubeEmbed(false);
        setShowPlaceholder(false);
        setIframeCreated(false);
        setLocalVideoCreated(false);
        onPlaybackEnded();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [localVideoCreated, song, duration, onPlaybackEnded]);

  // Function to play video when it's loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          console.log('Local video playing successfully');
        })
        .catch(err => {
          console.error('Error playing local video:', err);
          if (onPlaybackError) {
            onPlaybackError();
          }
          toast.error('שגיאה בהשמעת השיר', {
            description: 'לא ניתן להשמיע את השיר על מכשיר זה'
          });
        });
    }
  };

  // Create YouTube embed URL with autoplay for iOS
  const createYouTubeUrl = (embedUrl: string) => {
    // Check if the URL already has parameters
    const hasParams = embedUrl.includes('?');
    const connector = hasParams ? '&' : '?';
    
    // For iOS devices, the iframe creation happens within a touch event, so we can use autoplay
    if (isIOS) {
      return `${embedUrl}${connector}autoplay=1&mute=0&playsinline=1`;
    } 
    
    // For non-iOS devices, use the original URL
    return embedUrl;
  };

  // Convert YouTube embed URL to direct MP4 URL
  // This is just a placeholder - in a real app, you would need to use a proper service
  // to get the actual video file or host your own video files
  const getLocalVideoUrl = (youtubeEmbedUrl: string) => {
    // This is a mock URL - in a real app, you would need to replace this
    // with a service that provides actual MP4 files
    return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
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

  // Derive YouTube video ID from embedUrl to create thumbnail
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="relative w-full h-40">
      {/* Show placeholder for iOS devices */}
      {isIOS && showPlaceholder && song.embedUrl && !localVideoCreated && !iframeCreated && (
        <div 
          className="absolute top-0 left-0 w-full h-full bg-black flex items-center justify-center cursor-pointer z-10"
          onClick={handleiOSPlay}
        >
          {/* YouTube thumbnail as background */}
          {getYouTubeVideoId(song.embedUrl) && (
            <img 
              src={`https://img.youtube.com/vi/${getYouTubeVideoId(song.embedUrl)}/hqdefault.jpg`}
              alt="YouTube Thumbnail"
              className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
            />
          )}
          
          <div className="relative z-20 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-md">הפעל שיר</span>
          </div>
        </div>
      )}
      
      {/* Local video element for iOS */}
      {isIOS && localVideoCreated && song.embedUrl && (
        <>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover z-5"
            playsInline
            controls={false}
            muted={false}
            src={getLocalVideoUrl(song.embedUrl)}
            onLoadedData={handleVideoLoaded}
            onError={() => {
              setError('שגיאה בטעינת השיר');
              if (onPlaybackError) onPlaybackError();
            }}
            onEnded={() => {
              setLocalVideoCreated(false);
              onPlaybackEnded();
            }}
          />
          
          {/* Visual overlay to hide video but keep audio playing */}
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-black"></div>
        </>
      )}
      
      {/* Show YouTube iframe for non-iOS or after play button clicked on iOS */}
      {showYouTubeEmbed && song.embedUrl && (!isIOS || (isIOS && iframeCreated)) && (
        <>
          <iframe 
            width="100%" 
            height="100%" 
            src={createYouTubeUrl(song.embedUrl)} 
            frameBorder="0" 
            allow="autoplay; encrypted-media; playsinline" 
            allowFullScreen 
            className="absolute top-0 left-0 z-10"
            onError={() => {
              setError('שגיאה בטעינת השיר');
              if (onPlaybackError) onPlaybackError();
            }}
          />
          
          {/* Visual overlay to hide video but keep audio playing */}
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-black"></div>
        </>
      )}
      
      {/* Fallback music note animation when nothing is shown */}
      {!showYouTubeEmbed && !showPlaceholder && !localVideoCreated && (
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
