
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export const HowToPlayDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          איך משחקים?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary mb-4">
            איך משחקים ב"שיר על הדרך"?
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-right">
            <p className="text-lg font-medium text-gray-700">
              שיר על הדרך הוא משחק מוזיקלי מהיר, תחרותי וכיפי – מושלם לנסיעות משפחתיות ומפגשים חברתיים!
            </p>
            
            <div>
              <h3 className="font-bold text-lg mb-2">מהלך המשחק:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>אחד המשתתפים מקים משחק (מהטלפון שלו – רק באנדרואיד כרגע)</li>
                <li>השאר מצטרפים עם קוד מהטלפונים האישיים שלהם</li>
                <li>המנחה לוחץ על "השמע שיר" – ומתנגן שיר קצר</li>
                <li>כל משתתף מקבל 4 תשובות לבחירה – עליהם לבחור במהירות</li>
                <li>ככל שתענו מהר יותר – תקבלו ניקוד גבוה יותר</li>
                <li>מוצג ניקוד אישי + טבלת מובילים – ואז ממשיכים לשיר הבא!</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-amber-600">חשוב לדעת:</h3>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="font-bold">⚠️ משתמשי אייפון לא יכולים להיות מנחים</p>
                <p className="text-amber-700">
                  עקב הגבלות של אפל, השמעה אוטומטית של שירים אינה מתאפשרת.
                  משתמשי אייפון יכולים להצטרף למשחק כרגיל – אך לא להפעיל שירים.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">מה צריך?</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>טלפון לכל משתתף</li>
                <li>אינטרנט</li>
                <li>שירים בעברית בלב</li>
                <li>מצב רוח טוב 🎶</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
