
import { fetchSongsFromSupabase, SupabaseSong } from '@/integrations/supabase/client';
import { Song } from './songs/types';
import { noaKirelSongs } from './songs/noaKirel';
import { mashinaSongs } from './songs/mashina';
import { ethnixSongs } from './songs/ethnix';
import { monicaSexSongs } from './songs/monicaSex';
import { hatikva6Songs } from './songs/hatikva6';
import { botnerSongs } from './songs/botner';
import { otherSongs } from './songs/others';
import { artziSongs } from './songs/artzi';
import { einsteinSongs } from './songs/einstein';
import { mosheSongs } from './songs/moshe';
import { adamSongs } from './songs/adam';
import { golanSongs } from './songs/golan';
import { aharonSongs } from './songs/aharon';
import { hanochSongs } from './songs/hanoch';
import { gefenSongs } from './songs/gefen';

export type { Song } from './songs/types';

export const convertSupabaseSongToSong = (supabaseSong: SupabaseSong): Song => {
  return {
    id: supabaseSong.id,
    title: supabaseSong.title,
    artist: supabaseSong.artist,
    embedUrl: supabaseSong.embed_url,
    fullUrl: supabaseSong.full_url || supabaseSong.youtube_url,
    youtubeUrl: supabaseSong.youtube_url
  };
};

export const defaultSongBank: Song[] = [
  ...noaKirelSongs,
  ...mashinaSongs,
  ...ethnixSongs,
  ...monicaSexSongs,
  ...hatikva6Songs,
  ...botnerSongs,
  ...otherSongs,
  ...artziSongs,
  ...einsteinSongs,
  ...mosheSongs,
  ...adamSongs,
  ...golanSongs,
  ...aharonSongs,
  ...hanochSongs,
  ...gefenSongs
];
