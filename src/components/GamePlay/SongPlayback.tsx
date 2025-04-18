
import React from 'react';
import { Play, Trophy, Music } from 'lucide-react';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import SongPlayer from '@/components/SongPlayer';
import { Song } from '@/data/songBank';

interface SongPlaybackProps {
  isHost: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  showYouTubeEmbed: boolean;
  onPlaySong: () => void;
  onShowLeaderboard: () => void;
  onPlaybackEnded: () => void;
  onPlaybackError: () => void;
}

const SongPlayback: React.FC<SongPlaybackProps> = ({
  isHost,
  currentSong,
  isPlaying,
  showYouTubeEmbed,
  onPlaySong,
  onShowLeaderboard,
  onPlaybackEnded,
  onPlaybackError
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      <h2 className="text-2xl font-bold text-primary">השמעת שיר</h2>
      
      <SongPlayer 
        song={currentSong} 
        isPlaying={isPlaying && showYouTubeEmbed} 
        onPlaybackEnded={onPlaybackEnded} 
        onPlaybackError={onPlaybackError} 
      />
      
      <AppButton 
        variant="primary" 
        size="lg" 
        onClick={onPlaySong} 
        className="max-w-xs" 
        disabled={!isHost || isPlaying}
      >
        {isPlaying ? "שיר מתנגן..." : "השמע שיר"}
        <Play className="mr-2" />
      </AppButton>
      
      {isHost && (
        <AppButton 
          variant="secondary" 
          size="lg" 
          onClick={onShowLeaderboard} 
          className="max-w-xs"
        >
          הצג טבלת מובילים
          <Trophy className="mr-2" />
        </AppButton>
      )}

      {isPlaying && !showYouTubeEmbed && (
        <div className="relative w-40 h-40 flex items-center justify-center">
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
      
      {!isHost && !isPlaying && (
        <div className="text-lg text-gray-600 text-center">
          המתן למנהל המשחק להשמיע את השיר הבא
        </div>
      )}
    </div>
  );
};

export default SongPlayback;
