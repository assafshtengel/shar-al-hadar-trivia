
export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export const triviaQuestions: TriviaQuestion[] = [
  {
    id: 1,
    question: "מי כתב את השיר 'הלוואי' המפורסם?",
    options: ["אהוד מנור", "נעמי שמר", "אהוד בנאי", "יהונתן גפן"],
    correctAnswerIndex: 0
  },
  {
    id: 2,
    question: "באיזו שנה הוקמה להקת תיסלם?",
    options: ["1975", "1980", "1983", "1978"],
    correctAnswerIndex: 1
  },
  {
    id: 3,
    question: "מי שר את השיר 'בגלל הרוח'?",
    options: ["אריק איינשטיין", "מתי כספי", "שלמה ארצי", "יהודה פוליקר"],
    correctAnswerIndex: 2
  },
  {
    id: 4,
    question: "מה היה שמה הראשון של להקת 'משינה'?",
    options: ["מגפיים", "קצת אחרת", "המכונה", "הקליקה"],
    correctAnswerIndex: 2
  },
  {
    id: 5,
    question: "איזה זמר הישראלי הוציא את האלבום 'חלון לים התיכון'?",
    options: ["שלום חנוך", "דויד ברוזה", "יזהר אשדות", "מאיר אריאל"],
    correctAnswerIndex: 1
  },
  {
    id: 6,
    question: "מי כתב את המילים לשיר 'זמר נוגה' (השיר על הדבש ועל העוקץ)?",
    options: ["חיים נחמן ביאליק", "רחל", "נתן אלתרמן", "לאה גולדברג"],
    correctAnswerIndex: 2
  },
  {
    id: 7,
    question: "מי מבין האמנים הבאים לא היה חבר בשלישיית גשר הירקון?",
    options: ["אריק איינשטיין", "בני אמדורסקי", "יהורם גאון", "אלונה טוראל"],
    correctAnswerIndex: 2
  },
  {
    id: 8,
    question: "באיזו שנה ייצגה שירי מימון את ישראל באירוויזיון עם השיר 'השקט שנשאר'?",
    options: ["2003", "2005", "2008", "2010"],
    correctAnswerIndex: 2
  },
  {
    id: 9,
    question: "מי מבין האמנים הבאים לא היה חבר בלהקת 'כוורת'?",
    options: ["גידי גוב", "אלון אולארצ'יק", "דני סנדרסון", "שלום חנוך"],
    correctAnswerIndex: 3
  },
  {
    id: 10,
    question: "מי שרה את השיר 'כמו צמח בר'?",
    options: ["רונה קינן", "קרן פלס", "דנה ברגר", "רותם אבוהב"],
    correctAnswerIndex: 0
  },
  {
    id: 11,
    question: "מי כתב את השיר 'יש בי אהבה' שבוצע על ידי יהודית רביץ?",
    options: ["אהוד מנור", "יענקל'ה רוטבליט", "יונה וולך", "רחל שפירא"],
    correctAnswerIndex: 1
  },
  {
    id: 12,
    question: "איזה להקה הוציאה את האלבום 'אלטע זאכן'?",
    options: ["אתניקס", "תיסלם", "בנזין", "פורטיסחרוף"],
    correctAnswerIndex: 0
  },
  {
    id: 13,
    question: "מי הלחין את השיר 'ירושלים של זהב'?",
    options: ["סשה ארגוב", "נורית הירש", "נחום היימן", "משה וילנסקי"],
    correctAnswerIndex: 1
  },
  {
    id: 14,
    question: "באיזו שנה זכתה נטע ברזילי באירוויזיון עם השיר 'טוי'?",
    options: ["2017", "2018", "2019", "2020"],
    correctAnswerIndex: 1
  },
  {
    id: 15,
    question: "מי שר את השיר 'מילים יפות מאלה'?",
    options: ["עברי לידר", "אביב גפן", "רמי קליינשטיין", "דני רובס"],
    correctAnswerIndex: 0
  }
];
