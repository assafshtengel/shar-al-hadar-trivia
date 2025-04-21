import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Award, Star, CircleHelp, SkipForward } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
const HowToPlayDialog = () => {
  const [open, setOpen] = React.useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border px-4 py-2 bg-primary text-white hover:bg-primary/90 transition mx-[72px]">
          <HelpCircle className="w-5 h-5" />
          איך משחקים?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary mb-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            איך לשחק ב"שיר על הדרך"?
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-2 pr-0.5">
          <DialogDescription>
            <div className="text-right leading-7 space-y-6 text-base">
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1"><Award className="w-5 h-5 text-yellow-500" /> ניקוד</span>
                <ul className="list-disc mr-5 space-y-1">
                  <li>
                    <strong>ניקוד מהיר = יותר נקודות:</strong> ענה כמה שיותר מהר כדי להרוויח&nbsp;
                    <span className="inline-flex items-center"><Star className="w-4 h-4 text-amber-500 inline mr-1" />13 נקודות</span> (בתוך 3 שניות).
                  </li>
                  <li>
                    <strong>ניקוד יורד:</strong> ככל שעובר הזמן מקבלים פחות (מינימום 5 נקודות עד 8 שניות).
                  </li>
                  <li>
                    <strong>בשלב 50-50 או בתשובה אחרי 8 שניות:</strong>
                    תקבל&nbsp;
                    <span className="font-medium text-green-600">4 נקודות על תשובה נכונה</span>
                    &nbsp;ו-<span className="font-medium text-red-600">-2 נקודות על תשובה שגויה</span>.
                  </li>
                  <li>
                    <strong>על דילוג: </strong>
                    <span className="font-medium text-cyan-700">3&nbsp;נקודות</span> ותעבור לשאלה הבאה.
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1"><CircleHelp className="w-5 h-5 text-violet-600" /> שלבי המשחק</span>
                <ol className="list-decimal mr-5 space-y-1">
                  <li>מקשיבים לשיר ומנסים לזהות אותו.</li>
                  <li>בוחרים תשובה נכונה מהר ככל האפשר מהאפשרויות המוצגות.</li>
                  <li>כל חמישה סיבובים מופיעה שאלת <span className="inline-flex items-center text-sky-700 font-medium">טריוויה מוזיקלית</span> (&quot;שאלת בונוס&quot;).</li>
                  <li>בטריוויה – ככל שתענו מהר יותר, כך תקבלו יותר נקודות, ובשלב הסופי האפשרויות יצטמצמו ל-2.</li>
                </ol>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1"><SkipForward className="w-5 h-5 text-cyan-600" /> כפתור דלג</span>
                <ul className="list-disc mr-5 space-y-1">
                  <li>
                    לכל שחקן&nbsp;
                    <span className="font-medium text-primary">3 דילוגים בלבד</span>&nbsp;למשחק.
                  </li>
                  <li>
                    השתמש בדילוג כאשר אינך מזהה את השיר ותרצה לעבור ישר לסיבוב הבא ולקבל 3 נק'.
                  </li>
                  <li>
                    סיים את הדילוגים? תצטרך לבחור תשובה בכל סיבוב.
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1"><Star className="w-5 h-5 text-amber-600" /> טיפים</span>
                <ul className="list-disc mr-5 space-y-1">
                  <li>בשלב ה-50-50 אם לא בחרת תשובה, תוצגנה רק שתי אפשרויות (אחת נכונה ואחת שגויה).</li>
                  <li>הניקוד הגבוה ביותר יזכה בסיום לשבחים וטבלת מובילים.</li>
                  <li>אל תשכחו להנות ולפצח כמה שיותר שירים וטריוויה!</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
};
export default HowToPlayDialog;