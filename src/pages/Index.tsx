import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { useToast } from '@/components/ui/use-toast';
import { useGameState } from '@/contexts/GameStateContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LiveStats from '@/components/LiveStats';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Info } from 'lucide-react';
import { HowToPlayDialog } from "@/components/HowToPlayDialog";
import { ImprovementDialog } from "@/components/ImprovementDialog";
const Index = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    clearGameData
  } = useGameState();
  const {
    isIOS
  } = useIsMobile();
  const handleCreateGame = () => {
    if (isIOS) {
      return;
    }
    clearGameData();
    navigate('/host-setup');
  };
  const handleJoinGame = () => {
    clearGameData();
    navigate('/join-game');
  };
  const handleReportIssue = () => {
    toast({
      title: "תודה על הדיווח",
      description: "נבדוק את הנושא בהקדם"
    });
  };
  return <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote type="note1" className="absolute top-[10%] right-[15%] opacity-20" size={40} animation="float" color="#6446D0" />
        <MusicNote type="note2" className="absolute top-[20%] left-[10%] opacity-20" size={34} animation="float-alt" color="#FFC22A" />
        <MusicNote type="note3" className="absolute bottom-[30%] right-[20%] opacity-20" size={44} animation="float" color="#6446D0" />
        <MusicNote type="note4" className="absolute bottom-[15%] left-[15%] opacity-20" size={38} animation="float-alt" color="#FFC22A" />
        <MusicNote type="headphones" className="absolute bottom-[40%] left-[25%] opacity-20" size={50} animation="float" color="#3DCDC2" />
      </div>

      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center my-0 mx-[18px] px-[20px]">
          <div className="flex items-center justify-center mb-6 relative">
            <MusicNote type="note3" className="absolute -top-10 -right-8 text-primary" size={32} animation="float" />
            <h1 className="text-5xl font-bold text-primary text-center">
              שיר על הדרך 🎶
            </h1>
            <MusicNote type="note2" className="absolute -top-6 -left-6 text-secondary" size={28} animation="float-alt" />
          </div>

          <p className="text-xl text-center mb-6 text-gray-700">
            המשחק המוזיקלי שכולם מדברים עליו – לנסיעות, ערבי שישי ומפגשים עם חברים. 
            מזהים שירים, מתחרים, צוחקים ושרים ביחד - רק מוזיקה ישראלית.
          </p>

          <LiveStats />

          {isIOS && <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <Info size={20} />
                <span className="font-semibold">הערה חשובה למשתמשי iPhone</span>
              </div>
              <p className="text-sm text-amber-700">
                בשל הגבלות של Apple, משתמשי iPhone יכולים להשתתף במשחק כשחקנים בלבד, ולא כמנחים.
              </p>
              <AlertDialog>
                <AlertDialogTrigger className="text-sm text-primary underline mt-2">
                  אין לי iPhone אבל אני לא מצליח/ה להיות מנחה
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>דיווח על בעיה טכנית</AlertDialogTitle>
                    <AlertDialogDescription>
                      אנו מצטערים על אי הנוחות. אם אין ברשותך iPhone אך אינך מצליח/ה להיות מנחה, נשמח לקבל את הדיווח שלך כדי שנוכל לטפל בבעיה.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReportIssue}>
                      דווח/י על הבעיה
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>}

          <div className="w-full space-y-4 mb-8">
            <AppButton variant={isIOS ? "secondary" : "primary"} size="lg" onClick={handleCreateGame} disabled={isIOS} className="px-[71px] py-[28px]">
              {isIOS ? "לא זמין למשתמשי iPhone" : "הקם משחק חדש – פלאפון ראשי"}
            </AppButton>
            
            <AppButton variant="secondary" size="lg" onClick={handleJoinGame} className="my-[33px] mx-0 px-[99px]">
              הצטרף עם קוד למשחק
            </AppButton>
          </div>

          <div className="w-full flex justify-center mt-8">
            <div className="relative">
              <div className="w-16 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-20 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-24 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-28 h-1 bg-gray-400 rounded-full mx-auto"></div>
            </div>
          </div>

          <div className="w-full flex flex-col items-center mt-16 mb-8">
            <div className="relative flex items-center justify-center mb-2">
              <MusicNote type="headphones" className="absolute -left-8 text-primary/60" size={24} animation="float" />
              <div className="bg-gradient-to-r from-primary/80 via-accent/80 to-secondary/80 text-white px-6 py-2 rounded-full font-bold text-xl tracking-wide">
                Shtengel Games
              </div>
              <MusicNote type="note1" className="absolute -right-6 text-secondary/60" size={20} animation="float-alt" />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Powered by Shtengel Games
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <HowToPlayDialog />
          <ImprovementDialog />
        </div>
      </div>
    </div>;
};
export default Index;