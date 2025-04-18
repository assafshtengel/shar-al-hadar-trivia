
import React, { useState, useEffect } from 'react';
import AppButton from '@/components/AppButton';

interface SongPlaybackProps {
  round: number;
  currentSong: any;
  youtubeVideoId: string | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onContinue: () => void;
  isHost: boolean;
}

const SongPlayback: React.FC<SongPlaybackProps> = ({
  round,
  currentSong,
  youtubeVideoId,
  isMuted,
  setIsMuted,
  onContinue,
  isHost
}) => {
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(8);

  useEffect(() => {
    if (youtubeVideoId) {
      setShowYouTubeEmbed(true);
      setTimeLeft(8);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowYouTubeEmbed(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Hide video after 8 seconds
      const hideTimer = setTimeout(() => {
        setShowYouTubeEmbed(false);
      }, 8000);
      
      return () => {
        clearInterval(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [youtubeVideoId]);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <h2 className="text-2xl font-bold text-primary text-center">
        {currentSong ? `סיבוב ${round}: נחש את השיר!` : 'ממתין לשיר...'}
      </h2>
      
      {youtubeVideoId ? (
        <div className="aspect-w-16 aspect-h-9 w-full relative">
          {showYouTubeEmbed && (
            <div className="relative">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-64 opacity-0" // Make video invisible but audio still plays
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                <p className="text-primary text-2xl font-bold">מנגן... {timeLeft} שניות</p>
              </div>
            </div>
          )}
          
          {!showYouTubeEmbed && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-primary text-xl">השיר הושמע! עכשיו נחש!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">המארח יבחר שיר בקרוב...</p>
        </div>
      )}
      
      <AppButton onClick={onContinue} disabled={!currentSong}>
        {currentSong ? 'אני יודע את השיר!' : 'ממתין לשיר...'}
      </AppButton>
      
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        {isMuted ? 'בטל השתקה' : 'השתק'}
      </button>
    </div>
  );
};

export default SongPlayback;
