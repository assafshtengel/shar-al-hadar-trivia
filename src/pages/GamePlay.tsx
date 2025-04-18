
case 'scoringFeedback':
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {currentPlayer.lastAnswerCorrect !== undefined ? (
        <>
          <div className={`text-3xl font-bold ${currentPlayer.lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
            {currentPlayer.lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
            <span>נקודות</span>
          </div>
        </>
      ) : null}
    </div>
  );

