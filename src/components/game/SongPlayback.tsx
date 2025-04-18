
import React from 'react';
import AppButton from '@/components/AppButton';

interface SongPlaybackProps {
  round: number;
  currentSong: any;
  youtubeVideoId: string | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onContinue: () => void;
}

const SongPlayback: React.FC<SongPlaybackProps> = ({
  round,
  currentSong,
  youtubeVideoId,
  isMuted,
  setIsMuted,
  onContinue
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <h2 className="text-2xl font-bold text-primary text-center">
        {currentSong ? `סיבוב ${round}: נחש את השיר!` : 'ממתין לשיר...'}
      </h2>
      {youtubeVideoId ? (
        <div className="aspect-w-16 aspect-h-9 w-full">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-64"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">אין סרטון זמין</p>
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
