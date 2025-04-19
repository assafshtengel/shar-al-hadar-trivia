
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface HostJoinFormProps {
  hostName: string;
  setHostName: (name: string) => void;
  handleHostJoin: () => Promise<void>;
  hostJoined: boolean;
  joinLoading: boolean;
  playerLimitReached?: boolean;
}

const HostJoinForm: React.FC<HostJoinFormProps> = ({
  hostName,
  setHostName,
  handleHostJoin,
  hostJoined,
  joinLoading,
  playerLimitReached = false
}) => {
  const { isIOS } = useIsMobile();
  const [showIOSWarning, setShowIOSWarning] = React.useState(false);
  const { toast } = useToast();
  
  if (hostJoined) return null;

  const handleHostJoinClick = async () => {
    if (isIOS) {
      setShowIOSWarning(true);
      return;
    }
    await handleHostJoin();
  };

  const handleReportIssue = () => {
    toast({
      title: "תודה על הדיווח",
      description: "נבדוק את הנושא בהקדם",
    });
    setShowIOSWarning(false);
  };

  return (
    <div className="w-full space-y-4 mb-6">
      <Input
        type="text"
        placeholder="הזן שם מנחה"
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        disabled={playerLimitReached || isIOS}
        className={playerLimitReached || isIOS ? "cursor-not-allowed opacity-50" : ""}
      />
      <Button 
        onClick={handleHostJoinClick}
        disabled={!hostName || joinLoading || playerLimitReached || isIOS}
        className="w-full"
      >
        {playerLimitReached ? "המשחק מלא" : 
         isIOS ? "לא זמין למשתמשי iPhone" : "הצטרף כמנחה"}
      </Button>

      <AlertDialog open={showIOSWarning} onOpenChange={setShowIOSWarning}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>הערה למשתמשי iPhone</AlertDialogTitle>
            <AlertDialogDescription>
              בשל הגבלות של Apple, משתמשי iPhone יכולים להשתתף במשחק כשחקנים בלבד, ולא כמנחים. אם אין ברשותך iPhone אך אינך מצליח/ה להיות מנחה, אנא דווח/י לנו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>הבנתי</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportIssue}>
              דווח/י על בעיה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {playerLimitReached && (
        <p className="text-sm text-red-500 text-center">
          מספר השחקנים המרבי הושג. לא ניתן להצטרף כעת.
        </p>
      )}
    </div>
  );
};

export default HostJoinForm;
