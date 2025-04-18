
export interface ScoreUpdate {
  isCorrect: boolean;
  currentScore: number;
  timeBonus?: number;
}

export const calculateScore = ({ isCorrect, currentScore, timeBonus = 0 }: ScoreUpdate) => {
  const basePoints = isCorrect ? 10 : 0;
  const totalPoints = basePoints + timeBonus;
  const newScore = currentScore + totalPoints;
  
  return {
    points: totalPoints,
    newScore,
  };
};
