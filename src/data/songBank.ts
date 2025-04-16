export interface Song {
  id: number;
  title: string;
  artist?: string;
  spotifyUrl: string;
  youtubeUrl?: string;
}

export const defaultSongBank: Song[] = [
  {
    id: 1,
    title: "שוב היא כאן",
    artist: "יוני רכטר",
    spotifyUrl: "https://open.spotify.com/track/0G8ooolx3x5DNkKkcZ19zp"
  },
  {
    id: 2,
    title: "תיק קטן",
    artist: "סטילה ונס",
    spotifyUrl: "https://open.spotify.com/track/3mCCFs2hdDM2mObzARzxOg"
  },
  {
    id: 3,
    title: "מה שעובר עליי",
    spotifyUrl: "https://open.spotify.com/track/3JYl8RFEzfCLMDWwJuCxNo"
  },
  {
    id: 4,
    title: "תגידי לי את",
    artist: "מרסדס בנד",
    spotifyUrl: "https://open.spotify.com/track/5VisjHZA1nYyQAjq6lWn0f"
  },
  {
    id: 5,
    title: "יש לי חור בלב בצורה שלך",
    spotifyUrl: "https://open.spotify.com/track/0tx3OWVFMJ5GgrGa9QGFaQ"
  },
  {
    id: 6,
    title: "ככה זה",
    artist: "ברי סחרוף",
    spotifyUrl: "https://open.spotify.com/track/2eq2T5nu5NBvHYKzDatmt3"
  },
  {
    id: 7,
    title: "הכי יפה בעולם",
    artist: "מאור כהן",
    spotifyUrl: "https://open.spotify.com/track/2kwDpzImeK3RAnwKMJ7Kue"
  },
  {
    id: 8,
    title: "חולמת",
    artist: "אודיה",
    spotifyUrl: "https://open.spotify.com/track/3N48942rc1DKId7vmDDcy0"
  },
  {
    id: 9,
    title: "רשימת קניות",
    artist: "סטילה, נס",
    spotifyUrl: "https://open.spotify.com/track/5AjrNeUIzRkWzMz5hgujD2"
  },
  {
    id: 10,
    title: "בחיבוק",
    artist: "תמר ריליי",
    spotifyUrl: "https://open.spotify.com/track/0OIq7kRsGg7UkLKtO7Srqd"
  },
  {
    id: 11,
    title: "נחלת בנימין",
    artist: "איתי לוי",
    spotifyUrl: "https://open.spotify.com/track/2H84mdRphvQn5QniG3v07a"
  },
  {
    id: 12,
    title: "אחת ממיליון",
    artist: "רון חיון",
    spotifyUrl: "https://open.spotify.com/track/7kFo0ivGlvuzIWmODfmrjF"
  },
  {
    id: 13,
    title: "מטורפת",
    artist: "רואי אדם",
    spotifyUrl: "https://open.spotify.com/track/7LA51LhQTW9tulMfS3IhiL"
  },
  {
    id: 14,
    title: "החדר מסתובב",
    artist: "אייל גולן",
    spotifyUrl: "https://open.spotify.com/track/5MjRIL2ySrPGoATyTk2ZT9"
  },
  {
    id: 15,
    title: "מאחל לך טוב",
    artist: "אושר כהן",
    spotifyUrl: "https://open.spotify.com/track/2RNGK9C5zMQhKMTiPL5Q0T"
  },
  {
    id: 16,
    title: "יובל רפאל",
    spotifyUrl: "https://open.spotify.com/track/1H5GUNNCrurtyoOKbS2tT8"
  },
  {
    id: 17,
    title: "סיפורי צדיקים",
    artist: "אודיה",
    spotifyUrl: "https://open.spotify.com/track/5wXHoXp3DCnzuqZOE6rY0a"
  },
  {
    id: 18,
    title: "טאטע תטהר",
    artist: "יאיר אליצור",
    spotifyUrl: "https://open.spotify.com/track/5bFrsEk5efTVlOTwtLBLn2"
  },
  {
    id: 19,
    title: "את לא יודעת כמה",
    artist: "אודיה",
    spotifyUrl: "https://open.spotify.com/track/0sMyBmtyp4riKYNpDVNSH4"
  },
  {
    id: 20,
    title: "לא לפנות אליי",
    artist: "אודיה",
    spotifyUrl: "https://open.spotify.com/track/42jtELiUhOQ9hiWjPyV0ih"
  },
  {
    id: 21,
    title: "תתארו לכם",
    artist: "שלמה ארצי",
    spotifyUrl: "https://open.spotify.com/track/2gK92y6pVz6ygq8Fc7N2xL"
  },
  {
    id: 22,
    title: "האהבה הישנה",
    artist: "שלמה ארצי",
    spotifyUrl: "https://open.spotify.com/track/1oRsIlMA0T7jphxwP6mz8o"
  },
  {
    id: 23,
    title: "מישהו פעם",
    spotifyUrl: "https://open.spotify.com/track/44a0iyAfqhRnL5IV0oMPEx"
  },
  {
    id: 24,
    title: "לעוף",
    artist: "הראל סקעת",
    spotifyUrl: "https://open.spotify.com/track/4J5HgYfF7EJqbZhxtkjzpP"
  },
  {
    id: 25,
    title: "אור הירח",
    artist: "אביב גפן",
    spotifyUrl: "https://open.spotify.com/track/2wuXk3gEzfgeV1qEcEmuRB"
  },
  {
    id: 26,
    title: "מכה אפורה",
    artist: "מוניקה סקס",
    spotifyUrl: "https://open.spotify.com/track/4PA5UwwLNIPUoAoIkwBTjr"
  },
  {
    id: 27,
    title: "השמלה ממדריד",
    artist: "מוניקה סקס",
    spotifyUrl: "https://open.spotify.com/track/3NYqUxgU0z8ed9MHzymIqm"
  },
  {
    id: 28,
    title: "רכבת לילה לקהיר",
    spotifyUrl: "https://open.spotify.com/track/0EJekbVYUm30jaM7E4VPaw"
  },
  {
    id: 29,
    title: "שלח לי מלאך",
    artist: "משינה",
    spotifyUrl: "https://open.spotify.com/track/65KZbzkia4D1g6U1yTKREM"
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
