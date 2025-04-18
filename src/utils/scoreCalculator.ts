
export interface ScoreUpdate {
  isCorrect: boolean;
  currentScore: number;
  timeBonus?: number;
  alreadyUpdated?: boolean;  // מוסיף דגל כדי למנוע עדכונים כפולים
}

export const calculateScore = ({ isCorrect, currentScore, timeBonus = 0, alreadyUpdated = false }: ScoreUpdate) => {
  // אם הניקוד כבר עודכן, נחזיר את הניקוד הנוכחי ללא שינוי
  if (alreadyUpdated) {
    return {
      points: 0,
      newScore: currentScore
    };
  }

  const basePoints = isCorrect ? 10 : 0;
  const totalPoints = basePoints + timeBonus;
  const newScore = currentScore + totalPoints;
  
  console.log(`Score calculation: correct=${isCorrect}, base=${basePoints}, bonus=${timeBonus}, total=${totalPoints}, newScore=${newScore}`);
  
  return {
    points: totalPoints,
    newScore,
  };
};
