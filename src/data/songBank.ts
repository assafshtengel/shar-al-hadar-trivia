export interface Song {
  id: number;
  title: string;
  artist?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  fullUrl?: string;
}

export const defaultSongBank: Song[] = [
  {
    id: 30,
    title: "אגם בוחבוט – אם זה זה – זה זה",
    embedUrl: "https://www.youtube.com/embed/PMKjbR5LQKo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=PMKjbR5LQKo"
  },
  {
    id: 31,
    title: "הדג נחש, איילה אינגדשט, רודי ביינס – בצאת ישראל",
    embedUrl: "https://www.youtube.com/embed/2iAySYnfeAg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=2iAySYnfeAg"
  },
  {
    id: 32,
    title: "הפרויקט של עידן רייכל – ארץ",
    embedUrl: "https://www.youtube.com/embed/QbtaJt2D4OY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=QbtaJt2D4OY"
  },
  {
    id: 33,
    title: "יובל דיין – הנה באו הימים",
    embedUrl: "https://www.youtube.com/embed/gMbVg47BpHQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=gMbVg47BpHQ"
  },
  {
    id: 34,
    title: "רון חיון – אחת ממיליון",
    embedUrl: "https://www.youtube.com/embed/c_Uq3XnjzOc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=c_Uq3XnjzOc"
  },
  {
    id: 35,
    title: "אניה בוקשטיין – חופש",
    embedUrl: "https://www.youtube.com/embed/89gD7qdUOCg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=89gD7qdUOCg"
  },
  {
    id: 36,
    title: "נס & סטילה X אודיה – רשימת קניות",
    embedUrl: "https://www.youtube.com/embed/kYntjh4XEto?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=kYntjh4XEto"
  },
  {
    id: 37,
    title: "עידן עמדי, רותם סלע, דני קושמרו – לדפוק ת'ראש",
    embedUrl: "https://www.youtube.com/embed/5VSXxVHrycw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=5VSXxVHrycw"
  },
  {
    id: 38,
    title: "Dennis Lloyd – Mad World",
    embedUrl: "https://www.youtube.com/embed/5xFI-FWmPAg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=5xFI-FWmPAg"
  },
  {
    id: 39,
    title: "בוצר – ארץ אהובה שלי",
    embedUrl: "https://www.youtube.com/embed/m40vNrAaXWA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=m40vNrAaXWA"
  },
  {
    id: 40,
    title: "נונו – פופסטאר",
    embedUrl: "https://www.youtube.com/embed/bzPgBFPFvHw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=bzPgBFPFvHw"
  },
  {
    id: 41,
    title: "עילי בוטנר והילדים החדשים – עד הסוף",
    embedUrl: "https://www.youtube.com/embed/qZYaBVVDvf4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=qZYaBVVDvf4"
  },
  {
    id: 42,
    title: "איתי לוי – נחלת בנימין",
    embedUrl: "https://www.youtube.com/embed/3v_vYnzWTpI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=3v_vYnzWTpI"
  },
  {
    id: 43,
    title: "נועם קלינשטיין – תן לי זמן",
    embedUrl: "https://www.youtube.com/embed/xmX4Z4G0jG8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=xmX4Z4G0jG8"
  },
  {
    id: 44,
    title: "שלמה ארצי – אותיות נחמה",
    embedUrl: "https://www.youtube.com/embed/xKTk0ov_kYM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=xKTk0ov_kYM"
  },
  {
    id: 45,
    title: "אודיה – פרפרים",
    embedUrl: "https://www.youtube.com/embed/GmagbJ_bGZI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=GmagbJ_bGZI"
  },
  {
    id: 46,
    title: "יובל רפאל – New Day Will Rise",
    embedUrl: "https://www.youtube.com/embed/4Hi_lIujAdI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4Hi_lIujAdI"
  },
  {
    id: 47,
    title: "ענר שפירא – מחפש אהבה",
    embedUrl: "https://www.youtube.com/embed/l5ZOMI36RH0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=l5ZOMI36RH0"
  },
  {
    id: 48,
    title: "אליעד – להיות אבא",
    embedUrl: "https://www.youtube.com/embed/jcpOb-DwvZo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=jcpOb-DwvZo"
  },
  {
    id: 49,
    title: "שולי רנד – שבע השנים הטובות",
    embedUrl: "https://www.youtube.com/embed/uqmLzAuVyew?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=uqmLzAuVyew"
  }
];

/**
 * Generates a set of possible answers for a given song including the correct answer
 * @param correctSong The correct song
 * @param allSongs All available songs to choose incorrect answers from
 * @param numOptions Number of options to generate (default: 4)
 * @returns Array of song options with the correct song included
 */
export function generateAnswerOptions(
  correctSong: Song,
  allSongs: Song[],
  numOptions: number = 4
): Song[] {
  // Create a copy of all songs excluding the correct one
  const otherSongs = allSongs.filter(song => song.id !== correctSong.id);
  
  // Shuffle the array to get random songs
  const shuffledSongs = [...otherSongs].sort(() => Math.random() - 0.5);
  
  // Take n-1 songs for wrong answers
  const wrongAnswers = shuffledSongs.slice(0, numOptions - 1);
  
  // Combine correct and wrong answers, then shuffle
  const options = [correctSong, ...wrongAnswers];
  
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Gets a random song from the song bank
 * @param songs Array of songs to select from
 * @returns A randomly selected song
 */
export function getRandomSong(songs: Song[] = defaultSongBank): Song {
  const randomIndex = Math.floor(Math.random() * songs.length);
  return songs[randomIndex];
}

/**
 * Creates a game round with a correct song and answer options
 * @param songBank Array of songs to use (defaults to the built-in song bank)
 * @returns An object with the correct song and answer options
 */
export function createGameRound(songBank: Song[] = defaultSongBank) {
  const correctSong = getRandomSong(songBank);
  const options = generateAnswerOptions(correctSong, songBank);
  
  return {
    correctSong,
    options,
    correctAnswerIndex: options.findIndex(song => song.id === correctSong.id)
  };
}

/**
 * Find a song by its ID
 * @param songId The ID of the song to find
 * @param songBank Array of songs to search in
 * @returns The song with the given ID or undefined if not found
 */
export function findSongById(songId: number, songBank: Song[] = defaultSongBank): Song | undefined {
  return songBank.find(song => song.id === songId);
}
