export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export const triviaQuestions: TriviaQuestion[] = [
  {
    question: "איזה שיר של עומר אדם יצא בשנת 2015?",
    options: ["נועצת מבטים", "אחרי כל השנים", "מודה אני", "בניתי עלייך"],
    correctAnswerIndex: 3,
  },
  {
    question: "איזה שיר של אייל גולן יצא בשנת 2008?",
    options: ["יפה שלי", "דמעות", "מטורף", "צללים"],
    correctAnswerIndex: 0,
  },
  {
    question: "איזה שיר של שרית חדד יצא בשנת 2003?",
    options: ["כשהלב בוכה", "קצת משוגעת", "זה ששומר עליי", "לך תלך"],
    correctAnswerIndex: 2,
  },
  {
    question: "איזה שיר של שלמה ארצי יצא בשנת 1992?",
    options: ["ירח", "אף פעם לא תדעי", "לא עוזב את העיר", "צוות מצומצם"],
    correctAnswerIndex: 1,
  },
  {
    question: "איזה שיר של ריטה יצא בשנת 1988?",
    options: ["ימי התום", "שיר אהובת הספן", "מחכה", "בוא"],
    correctAnswerIndex: 0,
  },
  {
    question: "איזה שיר של אביב גפן יצא בשנת 1993?",
    options: ["האם להיות בך מאוהב", "עונות", "אור הירח", "מחר"],
    correctAnswerIndex: 3,
  },
  {
    question: "איזה שיר של משינה יצא בשנת 1995?",
    options: ["רכבות", "את לא כמו כולם", "בדרך אל הים", "נגעה בשמיים"],
    correctAnswerIndex: 0,
  },
  {
    question: "איזה שיר של כוורת יצא בשנת 1973?",
    options: ["המגפיים של ברוך", "נתתי לה חיי", "גוליית", "שיר המכולת"],
    correctAnswerIndex: 3,
  },
  {
    question: "איזה שיר של אריק איינשטיין יצא בשנת 1971?",
    options: ["אני ואתה", "פגשתי אותה בשוק", "אמא אדמה", "כשאת בוכה את לא יפה"],
    correctAnswerIndex: 0,
  },
  {
    question: "איזה שיר של יהודה פוליקר יצא בשנת 1990?",
    options: ["עיניים שלי", "פחות אבל כואב", "הצל שלי ואני", "יום שישי"],
    correctAnswerIndex: 0,
  },
];
