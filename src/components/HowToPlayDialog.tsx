
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Award, Star, SkipForward, CircleHelp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const HowToPlayDialog = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border px-4 py-2 bg-primary text-white hover:bg-primary/90 transition"
        >
          <HelpCircle className="w-5 h-5" />
          איך משחקים?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary mb-2 justify-end" dir="rtl">
            <HelpCircle className="w-6 h-6 text-primary" />
            איך משחקים ב"שיר על הדרך"?
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[62vh] mt-2 pr-0.5">
          <DialogDescription>
            <div className="text-right leading-7 space-y-7 text-base" dir="rtl">
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1 justify-end">
                  <Award className="w-5 h-5 text-yellow-500" />
                  מטרת המשחק
                </span>
                <div className="mr-7">
                  לזהות שירים לפי שמיעתם, לבחור את התשובה הנכונה כמה שיותר מהר, ולצבור נקודות.
                </div>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1 justify-end">
                  <CircleHelp className="w-5 h-5 text-violet-600" />
                  שלבי המשחק
                </span>
                <ul className="list-decimal mr-7 space-y-2">
                  <li>
                    <b>האזנה וזיהוי:</b> 
                    <span className="inline-block mr-2">
                      מקשיבים לשיר שמנוגן ומנסים לזהות אותו מבין האפשרויות שמופיעות על המסך.
                    </span>
                  </li>
                  <li>
                    <b>בחירת תשובה:</b>
                    <span className="inline-block mr-2">
                      בוחרים את התשובה הנכונה במהירות – ככל שתענו מהר יותר, תקבלו יותר נקודות.
                    </span>
                  </li>
                  <li>
                    <b>שאלת בונוס – טריוויה מוזיקלית:</b>
                    <span className="inline-block mr-2">
                      בכל 5 סיבובים תופיע שאלה בנושא מוזיקה. גם כאן, מהירות שווה ניקוד גבוה.
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1 justify-end">
                  <SkipForward className="w-5 h-5 text-cyan-600" />
                  כפתור דלג
                </span>
                <ul className="list-disc mr-7 space-y-1">
                  <li>
                    כל שחקן יכול לדלג <span className="font-bold text-primary">עד 3 פעמים</span> במהלך המשחק.
                  </li>
                  <li>
                    <span className="font-medium text-cyan-700">לחיצה על דלג</span> תעביר אתכם לשיר הבא ותקנה לכם <span className="font-medium text-cyan-700">3 נקודות</span>.
                  </li>
                  <li>
                    <span className="font-medium text-rose-700">נגמרו הדילוגים?</span> תצטרכו לבחור תשובה בכל סיבוב.
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1 justify-end">
                  <Star className="w-5 h-5 text-amber-600" />
                  ניקוד
                </span>
                <ul className="list-disc mr-7 space-y-1">
                  <li>
                    <span className="font-bold text-green-700">ניחוש מהיר (עד 3 שניות) – 13 נקודות.</span>
                  </li>
                  <li>
                    <span className="text-primary">ככל שעובר הזמן – הניקוד יורד</span> (מינימום 5 נקודות עד 8 שניות).
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">לא ענית בזמן? יופיע שלב 50-50:</span>
                  </li>
                  <li className="mr-5">
                    <span className="text-green-700">תשובה נכונה – 4 נקודות.</span>
                  </li>
                  <li className="mr-5">
                    <span className="text-red-700">תשובה שגויה – מינוס 2 נקודות.</span>
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1 justify-end">
                  <Star className="w-5 h-5 text-pink-400" />
                  טיפים חשובים
                </span>
                <ul className="list-disc mr-7 space-y-1">
                  <li>
                    בשלב ה-50-50, אם לא עניתם – תוצגנה רק שתי אפשרויות: אחת נכונה ואחת שגויה.
                  </li>
                  <li>
                    השחקן עם <b>הניקוד הגבוה ביותר</b> בסיום המשחק – יזכה לשבחים ויופיע בטבלת המובילים.
                  </li>
                  <li>
                    למנחה יש אפשרות להגדיר מראש את משך המשחק או את הניקוד שאליו משחקים. אם לא – ממשיכים לשחק עד שמחליטים לעצור.
                  </li>
                </ul>
              </div>
              <div>
                <span className="flex items-center gap-2 mb-1 justify-end text-[1rem]">
                  <span className="bg-gradient-to-r from-primary/80 via-accent/80 to-secondary/80 text-white px-3 py-1 rounded-full font-bold">
                    המשחק נוצר ע"י Shtengel Games
                  </span>
                </span>
                <div className="mr-6 mt-2 text-gray-600">
                  אהבתם? שתפו חברים ושחקו ביחד!
                </div>
              </div>
            </div>
          </DialogDescription>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HowToPlayDialog;
