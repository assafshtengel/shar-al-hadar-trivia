import { fetchSongsFromSupabase, SupabaseSong } from '@/integrations/supabase/client';

export interface Song {
  id: number;
  title: string;
  artist?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  fullUrl?: string;
}

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
  },
  {
    id: 50,
    title: "רכבת לילה לקהיר - משינה",
    embedUrl: "https://www.youtube.com/embed/IOSmBOsGRMc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=IOSmBOsGRMc"
  },
  {
    id: 51,
    title: "אין מקום אחר - משינה",
    embedUrl: "https://www.youtube.com/embed/PVAD3KWgQrQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=PVAD3KWgQrQ"
  },
  {
    id: 52,
    title: "הכוכבים דולקים על אש קטנה - משינה",
    embedUrl: "https://www.youtube.com/embed/-ozbcdJ9he0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=-ozbcdJ9he0"
  },
  {
    id: 53,
    title: "בן המלך - משינה",
    embedUrl: "https://www.youtube.com/embed/CAFC1onZdQI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=CAFC1onZdQI"
  },
  {
    id: 54,
    title: "שלח לי מלאך - משינה",
    embedUrl: "https://www.youtube.com/embed/UCH8WMIhvF4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=UCH8WMIhvF4"
  },
  {
    id: 55,
    title: "בואי וניפול - משינה",
    embedUrl: "https://www.youtube.com/embed/CqCt0UeHLGA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=CqCt0UeHLGA"
  },
  {
    id: 56,
    title: "BMW שחורה - אתניקס",
    embedUrl: "https://www.youtube.com/embed/IhD0BKCDRB4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=IhD0BKCDRB4"
  },
  {
    id: 57,
    title: "כי החיים כל-כך יפים - אתניקס",
    embedUrl: "https://www.youtube.com/embed/1VWT_MWF3Ws?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=1VWT_MWF3Ws"
  },
  {
    id: 58,
    title: "מסע - אתניקס",
    embedUrl: "https://www.youtube.com/embed/H7-t1YQ937A?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=H7-t1YQ937A"
  },
  {
    id: 59,
    title: "מקדש האהבה - אתניקס",
    embedUrl: "https://www.youtube.com/embed/bLi6ZX1CNes?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=bLi6ZX1CNes"
  },
  {
    id: 60,
    title: "אדמת האהבה - אתניקס",
    embedUrl: "https://www.youtube.com/embed/jRYuuHVoD8s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=jRYuuHVoD8s"
  },
  {
    id: 61,
    title: "איש קש - מוניקה סקס",
    embedUrl: "https://www.youtube.com/embed/-32TOD2kg3g?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=-32TOD2kg3g"
  },
  {
    id: 62,
    title: "פצעים ונשיקות - מוניקה סקס",
    embedUrl: "https://www.youtube.com/embed/z7tHTgp2l6k?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=z7tHTgp2l6k"
  },
  {
    id: 63,
    title: "מכה אפורה - מוניקה סקס",
    embedUrl: "https://www.youtube.com/embed/DV55unut3oI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=DV55unut3oI"
  },
  {
    id: 64,
    title: "על הרצפה - מוניקה סקס",
    embedUrl: "https://www.youtube.com/embed/dVwE5u1xFLw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=dVwE5u1xFLw"
  },
  {
    id: 65,
    title: "גשם חזק - מוניקה סקס",
    embedUrl: "https://www.youtube.com/embed/0gDOtz-V4PE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=0gDOtz-V4PE"
  },
  {
    id: 66,
    title: "פאוץ' - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/K9qQNAdiXHI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=K9qQNAdiXHI"
  },
  {
    id: 67,
    title: "טרילילי טרללה - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/QB8NuvDML2I?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=QB8NuvDML2I"
  },
  {
    id: 68,
    title: "Unicorn - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/r4wbdKmM3bQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=r4wbdKmM3bQ"
  },
  {
    id: 69,
    title: "מיליון דולר - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/oQbh5Kvet04?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=oQbh5Kvet04"
  },
  {
    id: 70,
    title: "אני - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/jmSuPQu7xNA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=jmSuPQu7xNA"
  },
  {
    id: 71,
    title: "הכי ישראלי - התקווה 6",
    embedUrl: "https://www.youtube.com/embed/oYZvPnxDbX0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=oYZvPnxDbX0"
  },
  {
    id: 72,
    title: "בעולם שלה - התקווה 6",
    embedUrl: "https://www.youtube.com/embed/DgXHhNpA6L8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=DgXHhNpA6L8"
  },
  {
    id: 73,
    title: "מה שיהיה יהיה - התקווה 6",
    embedUrl: "https://www.youtube.com/embed/b3JRw1KhbYA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=b3JRw1KhbYA"
  },
  {
    id: 74,
    title: "קופנגן - התקווה 6",
    embedUrl: "https://www.youtube.com/embed/mMPos85fvb8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=mMPos85fvb8"
  },
  {
    id: 75,
    title: "רץ אלייך - עילי בוטנר",
    embedUrl: "https://www.youtube.com/embed/1pVcgz9Jv-U?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=1pVcgz9Jv-U"
  },
  {
    id: 76,
    title: "טיפות - עילי בוטנר",
    embedUrl: "https://www.youtube.com/embed/-EiNeISPjZY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=-EiNeISPjZY"
  },
  {
    id: 77,
    title: "בוא אליי - עילי בוטנר",
    embedUrl: "https://www.youtube.com/embed/YOcMyGr9HqU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=YOcMyGr9HqU"
  },
  {
    id: 78,
    title: "ילדים של אף אחד - עילי בוטנר",
    embedUrl: "https://www.youtube.com/embed/4QZ3xAQRJMc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4QZ3xAQRJMc"
  },
  {
    id: 79,
    title: "בזמן האחרון - עידן עמדי",
    embedUrl: "https://www.youtube.com/embed/f5fTCR7TOEU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=f5fTCR7TOEU"
  },
  {
    id: 80,
    title: "נשכח או נסלח - עידן עמדי",
    embedUrl: "https://www.youtube.com/embed/KfE_reB9EDY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=KfE_reB9EDY"
  },
  {
    id: 81,
    title: "כל הציפורים - הראל סקעת",
    embedUrl: "https://www.youtube.com/embed/V_FJDCsXXLc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=V_FJDCsXXLc"
  },
  {
    id: 82,
    title: "ואת - הראל סקעת",
    embedUrl: "https://www.youtube.com/embed/AcpgsbFvnbM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=AcpgsbFvnbM"
  },
  {
    id: 83,
    title: "הכל או כלום - ברי סחרוף",
    embedUrl: "https://www.youtube.com/embed/0HEmJzYrsR0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=0HEmJzYrsR0"
  },
  {
    id: 84,
    title: "חלליות - ברי סחרוף",
    embedUrl: "https://www.youtube.com/embed/m87iJUQme6w?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=m87iJUQme6w"
  },
  {
    id: 85,
    title: "עיר מקלט - ברי סחרוף",
    embedUrl: "https://www.youtube.com/embed/RepkQVYTH-k?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=RepkQVYTH-k"
  },
  {
    id: 86,
    title: "לב שלם - ברי סחרוף",
    embedUrl: "https://www.youtube.com/embed/bErZt-l8qRM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=bErZt-l8qRM"
  },
  {
    id: 87,
    title: "נכנע לך - ברי סחרוף",
    embedUrl: "https://www.youtube.com/embed/JqcVZkUsdcE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=JqcVZkUsdcE"
  },
  {
    id: 88,
    title: "מי אוהב אותך יותר ממני - ארקדי דוכין",
    embedUrl: "https://www.youtube.com/embed/l0WYMRSs9C4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=l0WYMRSs9C4"
  },
  {
    id: 89,
    title: "מרוב אהבתי - ארקדי דוכין",
    embedUrl: "https://www.youtube.com/embed/EuYPBIoiNn4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=EuYPBIoiNn4"
  },
  {
    id: 90,
    title: "אם את לבדך - ארקדי דוכין",
    embedUrl: "https://www.youtube.com/embed/BCXyAolCVL8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=BCXyAolCVL8"
  },
  {
    id: 91,
    title: "חכי לי אהובה - ארקדי דוכין",
    embedUrl: "https://www.youtube.com/embed/Cdnrde4WFC8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Cdnrde4WFC8"
  },
  {
    id: 92,
    title: "רשימת קניות - נס וסטילה",
    embedUrl: "https://www.youtube.com/embed/kYntjh4XEto?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=kYntjh4XEto"
  },
  {
    id: 93,
    title: "מגדלים - נס וסטילה",
    embedUrl: "https://www.youtube.com/embed/bWz97rgzxLE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=bWz97rgzxLE"
  },
  {
    id: 94,
    title: "תיק קטן - נס וסטילה",
    embedUrl: "https://www.youtube.com/embed/pVaeEK1WC2M?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=pVaeEK1WC2M"
  },
  {
    id: 95,
    title: "באמפרים - נס וסטילה",
    embedUrl: "https://www.youtube.com/embed/_I56eDHwQr8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=_I56eDHwQr8"
  },
  {
    id: 96,
    title: "עד מחר - אביתר בנאי",
    embedUrl: "https://www.youtube.com/embed/g_gFnDyi2Ho?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=g_gFnDyi2Ho"
  },
  {
    id: 97,
    title: "כל יום כמו נס - אביתר בנאי",
    embedUrl: "https://www.youtube.com/embed/8beg1Kj43Cs?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=8beg1Kj43Cs"
  },
  {
    id: 98,
    title: "לא רואה אותי - אביתר בנאי",
    embedUrl: "https://www.youtube.com/embed/hVUlJWkT2Jo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=hVUlJWkT2Jo"
  },
  {
    id: 99,
    title: "מתי נתנשק - אביתר בנאי",
    embedUrl: "https://www.youtube.com/embed/mwFjgtidDDA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=mwFjgtidDDA"
  },
  {
    id: 100,
    title: "לשונות של אש - אביתר בנאי",
    embedUrl: "https://www.youtube.com/embed/cTsJuLlmySs?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=cTsJuLlmySs"
  },
  {
    id: 101,
    title: "Thought About That - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/TwZP2BErikM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=TwZP2BErikM"
  },
  {
    id: 102,
    title: "Unicorn (Hope Version) - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/KON8O5H1yMY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=KON8O5H1yMY"
  },
  {
    id: 103,
    title: "אין אותי - נועה קירל ואושר כהן",
    embedUrl: "https://www.youtube.com/embed/h3iqvIWAfck?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=h3iqvIWAfck"
  },
  {
    id: 104,
    title: "אם אתה גבר - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/9on_1WpYvAY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=9on_1WpYvAY"
  },
  {
    id: 105,
    title: "אמא שלי - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/Qpdq37kHE2s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Qpdq37kHE2s"
  },
  {
    id: 106,
    title: "אמבולנס - נועה קירל ומרגי",
    embedUrl: "https://www.youtube.com/embed/T8cC6YWUHPc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=T8cC6YWUHPc"
  },
  {
    id: 107,
    title: "אני - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/fY_UOsz8jNI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=fY_UOsz8jNI"
  },
  {
    id: 108,
    title: "אתה אני אולי - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/i0tFsOAMmBs?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=i0tFsOAMmBs"
  },
  {
    id: 109,
    title: "בא לי אותך - נועה קירל",
    embedUrl: "https://www.youtube.com/embed/Iv2hNKdCRl4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Iv2hNKdCRl4"
  },
  {
    id: 110,
    title: "עומר אדם - אהובתי כבר לא רואה אותי - (Prod By. Bleu)",
    embedUrl: "https://www.youtube.com/embed/QzDpV_8HVXk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://m.youtube.com/watch?v=QzDpV_8HVXk"
  },
  {
    id: 111,
    title: "עומר אדם - טקילה - (Prod By. Bleu)",
    embedUrl: "https://www.youtube.com/embed/4HXpfAZZF0E?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4HXpfAZZF0E"
  },
  {
    id: 112,
    title: "עומר אדם - רק שלך (By Osher Cohen)",
    embedUrl: "https://www.youtube.com/embed/Jw02uPan7RU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Jw02uPan7RU"
  },
  {
    id: 113,
    title: "עומר אדם – תהום (Prod.by Guy Dan & Shrek & Tzukush)",
    embedUrl: "https://www.youtube.com/embed/L5WSsFFElvw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=L5WSsFFElvw"
  },
  {
    id: 114,
    title: "עומר אדם - שתי טיפות (Prod. By Jo Cohen)",
    embedUrl: "https://www.youtube.com/embed/AfkoTBgdwqw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=AfkoTBgdwqw"
  },
  {
    id: 115,
    title: "עומר אדם - מלאך של כבוד (prod by. or cohen)",
    embedUrl: "https://www.youtube.com/embed/4HXpfAZZF0E?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4HXpfAZZF0E"
  },
  {
    id: 130,
    title: "כוורת - היא כל כך יפה",
    embedUrl: "https://www.youtube.com/embed/zAaHhoNMXS0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=zAaHhoNMXS0"
  },
  {
    id: 140,
    title: "Noa Kirel - Unicorn – Israel 🇮🇱 - Official Music Video - Eurovision 2023",
    embedUrl: "https://www.youtube.com/embed/r4wbdKmM3bQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=r4wbdKmM3bQ"
  },
  {
    id: 141,
    title: "Noa Kirel - Thought About That (Official Music Video)",
    embedUrl: "https://www.youtube.com/embed/RdVx-GrnQzk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://m.youtube.com/watch?v=RdVx-GrnQzk"
  },
  {
    id: 142,
    title: "Noa Kirel - Like What You See",
    embedUrl: "https://www.youtube.com/embed/_dpNA4LOv14?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=_dpNA4LOv14"
  },
  {
    id: 143,
    title: "Noa Kirel - BA DA BING",
    embedUrl: "https://www.youtube.com/embed/9l4ihhIzH8Q?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=9l4ihhIzH8Q"
  },
  {
    id: 144,
    title: "נועה קירל - אתה אני אולי (Prod. by Jordi)",
    embedUrl: "https://www.youtube.com/embed/66NhRMqw0yU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=66NhRMqw0yU"
  },
  {
    id: 145,
    title: "Noa Kirel - Please Don't Suck (Official Music Video)",
    embedUrl: "https://www.youtube.com/embed/mZo94QhrX7k?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://m.youtube.com/watch?v=mZo94QhrX7k"
  },
  {
    id: 150,
    title: "החברים של נטאשה - אם כבר לבד",
    embedUrl: "https://www.youtube.com/embed/9SLwwFWV9K0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=9SLwwFWV9K0"
  },
  {
    id: 151,
    title: "פרדי על הבוקר - החברים של נטאשה (הקליפ הרשמי, 'רדיו בלה בלה')",
    embedUrl: "https://www.youtube.com/embed/F_zZtiYNNuE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=F_zZtiYNNuE"
  },
  {
    id: 152,
    title: "עכשיו אני - החברים של נטאשה (הקליפ הרשמי, 'רדיו בלה בלה')",
    embedUrl: "https://www.youtube.com/embed/2zfu7njbiM4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=2zfu7njbiM4"
  },
  {
    id: 153,
    title: "יש זמן - קליפ רשמי של החברים של נטאשה",
    embedUrl: "https://www.youtube.com/embed/Nb27S8j_yL8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Nb27S8j_yL8"
  },
  {
    id: 158,
    title: "החברים של נטאשה - סדר עולמי חדש",
    embedUrl: "https://www.youtube.com/embed/JPphOPZYHtI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=JPphOPZYHtI"
  },
  {
    id: 160,
    title: "תתארו לכם - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/Y0KxZz5k-RE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Y0KxZz5k-RE"
  },
  {
    id: 161,
    title: "היא לא יודעת מה עובר עלי - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/WHDQ-JHI6Z8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=WHDQ-JHI6Z8"
  },
  {
    id: 162,
    title: "האהבה הישנה - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/02uV8M6XSto?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=02uV8M6XSto"
  },
  {
    id: 163,
    title: "נוף ילדות - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/OER8dtQPF14?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=OER8dtQPF14"
  },
  {
    id: 164,
    title: "ירח - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/hGiNUsSHkr0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=hGiNUsSHkr0"
  },
  {
    id: 165,
    title: "לא עוזב את העיר - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/wtX3AzE0ozw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=wtX3AzE0ozw"
  },
  {
    id: 166,
    title: "אהבתיה - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/19qoWmBJVRc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=19qoWmBJVRc"
  },
  {
    id: 167,
    title: "בואי ניקח לנו יום - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/Up4FLZad54s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Up4FLZad54s"
  },
  {
    id: 168,
    title: "והאמת - שלמה ארצי עם ישי ריבו",
    embedUrl: "https://www.youtube.com/embed/ZUPP10SvO3g?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=ZUPP10SvO3g"
  },
  {
    id: 169,
    title: "זה מה שנשאר - שלמה ארצי",
    embedUrl: "https://www.youtube.com/embed/2zk_cTSeLUk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=2zk_cTSeLUk"
  },
  {
    id: 170,
    title: "אני ואתה - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/gP6PS-poyMg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=gP6PS-poyMg"
  },
  {
    id: 171,
    title: "עוף גוזל - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/kxDBpbMDsZA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=kxDBpbMDsZA"
  },
  {
    id: 172,
    title: "סע לאט - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/ZwTbFd8kdII?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=ZwTbFd8kdII"
  },
  {
    id: 173,
    title: "אוהב להיות בבית - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/N_elLKPF7u0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=N_elLKPF7u0"
  },
  {
    id: 174,
    title: "יש בי אהבה - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/99yXtc_s_v4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=99yXtc_s_v4"
  },
  {
    id: 175,
    title: "עטור מצחך - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/WZM4iXT3-ic?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=WZM4iXT3-ic"
  },
  {
    id: 176,
    title: "בגללך - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/5WEggKymynE?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=5WEggKymynE"
  },
  {
    id: 177,
    title: "גיטרה וכינור - אריק איינשטיין ושלום חנוך",
    embedUrl: "https://www.youtube.com/embed/6UltSHD_BbM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=6UltSHD_BbM"
  },
  {
    id: 178,
    title: "יושב על הגדר - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/mchgrIehDT0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=mchgrIehDT0"
  },
  {
    id: 179,
    title: "כמה טוב שבאת הביתה - אריק איינשטיין",
    embedUrl: "https://www.youtube.com/embed/Che2jea8z_Q?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Che2jea8z_Q"
  },
  {
    id: 180,
    title: "מחכים למשיח - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/-0i3mev5EvQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=-0i3mev5EvQ"
  },
  {
    id: 181,
    title: "הדרכים הידועות - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/nUI_OMbzVR8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=nUI_OMbzVR8"
  },
  {
    id: 182,
    title: "ככה וככה - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/kKTyqRlBNJI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=kKTyqRlBNJI"
  },
  {
    id: 183,
    title: "נגד הרוח - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/0VkHJwmzRQw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=0VkHJwmzRQw"
  },
  {
    id: 184,
    title: "מאיה - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/CeE_zuoGTqs?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=CeE_zuoGTqs"
  },
  {
    id: 185,
    title: "לילה - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/mnkE_XJdAMc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=mnkE_XJdAMc"
  },
  {
    id: 186,
    title: "אדם בתוך עצמו - שלום חנוך",
    embedUrl: "https://www.youtube.com/embed/vjEbQr56ty4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=vjEbQr56ty4"
  }
];
