
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Award, Star, ListOrdered, Timer } from "lucide-react";
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
                <span className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-amber-500" /> מטרת המשחק
                </span>
                <p className="mr-5">
                  משחק מוזיקלי חברתי שבו תזהו שירים ישראליים, תתחרו על מקום בטבלת המובילים ותגלו עובדות מעניינות על המוזיקה הישראלית.
                </p>
              </div>

              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <ListOrdered className="w-5 h-5 text-violet-600" /> מהלך המשחק
                </span>
                <ol className="list-decimal mr-5 space-y-1">
                  <li>תקשיבו לקטע מהשיר ונסו לזהות אותו.</li>
                  <li>בחרו את התשובה הנכונה מבין האפשרויות - ככל שתענו מהר יותר, תקבלו יותר נקודות!</li>
                  <li>כל 5 סיבובים תופיע שאלת טריוויה מוזיקלית מיוחדת.</li>
                  <li>בסוף כל סיבוב תראו את הניקוד שצברתם ואת מיקומכם בטבלה.</li>
                </ol>
              </div>

              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-yellow-500" /> שיטת הניקוד
                </span>
                <ul className="list-disc mr-5 space-y-1">
                  <li>
                    <strong>15 נקודות</strong> למי שענה נכון ראשון.
                  </li>
                  <li>
                    <strong>12 נקודות</strong> למי שענה נכון שני.
                  </li>
                  <li>
                    תשובות נכונות נוספות מזכות בניקוד יורד: 10, 9, 8... (מינימום נקודה אחת).
                  </li>
                  <li>
                    <span className="text-red-600">-2 נקודות</span> על תשובה שגויה.
                  </li>
                </ul>
              </div>

              <div>
                <span className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <Timer className="w-5 h-5 text-cyan-600" /> טיפים חשובים
                </span>
                <ul className="list-disc mr-5 space-y-1">
                  <li>נסו לענות מהר ככל האפשר - המהירות משתלמת!</li>
                  <li>הימנעו מניחושים - תשובות שגויות עולות בנקודות.</li>
                  <li>שימו לב לשאלות הטריוויה - הן מוסיפות עניין ונקודות נוספות.</li>
                  <li>המשחק הכי כיף כשמשחקים יחד - הזמינו חברים!</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
};

export default HowToPlayDialog;
