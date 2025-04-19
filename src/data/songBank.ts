
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
    id: 160,
    title: "אהבה מנצחת הכל - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/Ga7SO82bcl4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Ga7SO82bcl4"
  },
  {
    id: 161,
    title: "אין לי אותך - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/lE9ItPqGwVw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=lE9ItPqGwVw"
  },
  {
    id: 162,
    title: "אין ייאוש בלילות - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/Lc5wmme_NVQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Lc5wmme_NVQ"
  },
  {
    id: 163,
    title: "פזמון אחר - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/Xv8DqpQfvnI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Xv8DqpQfvnI"
  },
  {
    id: 164,
    title: "מוכר הקסטות - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/VoV4G5IqFzs?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=VoV4G5IqFzs"
  },
  {
    id: 165,
    title: "פחד מפרידות - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/uR_ba5gF_EM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=uR_ba5gF_EM"
  },
  {
    id: 166,
    title: "מחכה לו - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/zVCHto6VPXo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=zVCHto6VPXo"
  },
  {
    id: 167,
    title: "החדר מסתובב - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/FmEqwXz767Q?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=FmEqwXz767Q"
  },
  {
    id: 168,
    title: "לב אחר - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/0SEzqRNkkFc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=0SEzqRNkkFc"
  },
  {
    id: 169,
    title: "שכחתי מזמן - אייל גולן",
    embedUrl: "https://www.youtube.com/embed/r84wVQccj38?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=r84wVQccj38"
  },
  {
    id: 170,
    title: "יש עוד עולם - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/pR1AJJUpzTI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=pR1AJJUpzTI"
  },
  {
    id: 171,
    title: "אין לך לב - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/6_vClLPNWgQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=6_vClLPNWgQ"
  },
  {
    id: 172,
    title: "אמא אמא - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/BwdRD6cKcUw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=BwdRD6cKcUw"
  },
  {
    id: 173,
    title: "אל אל ישראל - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/4MKRr_qbCpA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4MKRr_qbCpA"
  },
  {
    id: 174,
    title: "מגדלים 2 - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/4m8ci3Dn9g0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=4m8ci3Dn9g0"
  },
  {
    id: 175,
    title: "בית ריק - דודו אהרון (עם בן חן)",
    embedUrl: "https://www.youtube.com/embed/5GsY_sAyxpo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=5GsY_sAyxpo"
  },
  {
    id: 176,
    title: "ארץ האבות - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/LVjQizmCC-g?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=LVjQizmCC-g"
  },
  {
    id: 177,
    title: "נושמת אותך - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/ZZFKyCJmWZI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=ZZFKyCJmWZI"
  },
  {
    id: 178,
    title: "מדמיין אותנו - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/SmmDOQHrGjY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=SmmDOQHrGjY"
  },
  {
    id: 179,
    title: "איתך הייתי מלך - דודו אהרון",
    embedUrl: "https://www.youtube.com/embed/E7rhh4UNULU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=E7rhh4UNULU"
  },
  {
    id: 180,
    title: "מלכת השושנים - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/nwpLIXdrHS0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=nwpLIXdrHS0"
  },
  {
    id: 181,
    title: "לזאת שניצחה - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/vTDjXjZO_hk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=vTDjXjZO_hk"
  },
  {
    id: 182,
    title: "מנגינה - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/fMyhIe_bV_s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=fMyhIe_bV_s"
  },
  {
    id: 183,
    title: "תאמין לי - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/TMGMT_0J_nU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=TMGMT_0J_nU"
  },
  {
    id: 184,
    title: "ריגוש זמני - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/2-mr1D8GG0I?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=2-mr1D8GG0I"
  },
  {
    id: 185,
    title: "חורף בלעדיי - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/1Wcys9VZkuk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=1Wcys9VZkuk"
  },
  {
    id: 186,
    title: "מאה קילומטר - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/gI2fEm7-Qyo?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=gI2fEm7-Qyo"
  },
  {
    id: 187,
    title: "מותר לי לנוח - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/DtOmQzmUb80?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=DtOmQzmUb80"
  },
  {
    id: 188,
    title: "מלכת הלבבות - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/HKjJLpsa6G4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=HKjJLpsa6G4"
  },
  {
    id: 189,
    title: "ילד מסוכן - עדן בן זקן",
    embedUrl: "https://www.youtube.com/embed/j7epQOXchJQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=j7epQOXchJQ"
  },
  {
    id: 190,
    title: "געגועים - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/y0c-_wVzTww?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=y0c-_wVzTww"
  },
  {
    id: 191,
    title: "לחיות על אוטומט - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/druoyqhSBrU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=druoyqhSBrU"
  },
  {
    id: 192,
    title: "כשהלב בוכה - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/bBCIefOfUKY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=bBCIefOfUKY"
  },
  {
    id: 193,
    title: "הייתי בגן עדן - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/j2ZJufHIgp8?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=j2ZJufHIgp8"
  },
  {
    id: 194,
    title: "תגיד שאתה כאן - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/pFu6raIvy-Q?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=pFu6raIvy-Q"
  },
  {
    id: 195,
    title: "תצא לי מהראש - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/sZJgIsZI_Sk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=sZJgIsZI_Sk"
  },
  {
    id: 196,
    title: "שיר אהבה - שרית חדד ונרקיס",
    embedUrl: "https://www.youtube.com/embed/e2opfjSRzzk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=e2opfjSRzzk"
  },
  {
    id: 197,
    title: "רק לאהוב - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/FmXT12RGGk4?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=FmXT12RGGk4"
  },
  {
    id: 198,
    title: "לא בשבילי - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/piUs7My1lYg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=piUs7My1lYg"
  },
  {
    id: 199,
    title: "יש לילות - שרית חדד",
    embedUrl: "https://www.youtube.com/embed/KFHEUcPS1_s?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=KFHEUcPS1_s"
  },
  {
    id: 200,
    title: "רק שלך - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/Jw02uPan7RU?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Jw02uPan7RU"
  },
  {
    id: 201,
    title: "אהובתי כבר לא רואה אותי - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/QzDpV_8HVXk?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=QzDpV_8HVXk"
  },
  {
    id: 202,
    title: "תהום - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/L5WSsFFElvw?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=L5WSsFFElvw"
  },
  {
    id: 203,
    title: "טקילה - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/TPs0Fbw1-WY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=TPs0Fbw1-WY"
  },
  {
    id: 204,
    title: "גברת אגו - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/0zurI1x0Bmc?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=0zurI1x0Bmc"
  },
  {
    id: 205,
    title: "תפילה - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/mQiTfvht20I?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=mQiTfvht20I"
  },
  {
    id: 206,
    title: "שני משוגעים - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/kVPnv2d_u5Y?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=kVPnv2d_u5Y"
  },
  {
    id: 207,
    title: "חברות שלך - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/s7juWTpjMMM?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=s7juWTpjMMM"
  },
  {
    id: 208,
    title: "מודה אני - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/YQ5f1OMFFL0?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=YQ5f1OMFFL0"
  },
  {
    id: 209,
    title: "נרקומן של בדידות - עומר אדם",
    embedUrl: "https://www.youtube.com/embed/C3MTKYn6lhI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=C3MTKYn6lhI"
  },
  {
    id: 210,
    title: "נשבע - חיים משה",
    embedUrl: "https://www.youtube.com/embed/X1huVu3GcAg?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=X1huVu3GcAg"
  },
  {
    id: 211,
    title: "אין יפה ממנה - חיים משה",
    embedUrl: "https://www.youtube.com/embed/aAvC2ql3rCI?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=aAvC2ql3rCI"
  },
  {
    id: 212,
    title: "לינדה (ג'אייגולִי) - חיים משה",
    embedUrl: "https://www.youtube.com/embed/hSgTsC3cFDY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=hSgTsC3cFDY"
  },
  {
    id: 213,
    title: "מסע חיי - חיים משה",
    embedUrl: "https://www.youtube.com/embed/Wre-echxRWA?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=Wre-echxRWA"
  },
  {
    id: 214,
    title: "על סף דלתך - חיים משה",
    embedUrl: "https://www.youtube.com/embed/V-82aDOkZOY?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=V-82aDOkZOY"
  },
  {
    id: 215,
    title: "איך שבאת - חיים משה",
    embedUrl: "https://www.youtube.com/embed/8KrpNMZSTVQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=8KrpNMZSTVQ"
  },
  {
    id: 216,
    title: "רואים עליי - חיים משה",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: 217,
    title: "זכיתי בך - חיים משה",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: 218,
    title: "תהילה - חיים משה",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: 219,
    title: "אהבת חיי - חיים משה",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0",
    fullUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
];
