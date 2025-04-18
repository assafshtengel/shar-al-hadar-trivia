
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  if (hostJoined) return null;

  return (
    <div className="w-full space-y-4 mb-6">
      <Input
        type="text"
        placeholder="הזן שם מנחה"
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        disabled={playerLimitReached}
        className={playerLimitReached ? "cursor-not-allowed opacity-50" : ""}
      />
      <Button 
        onClick={handleHostJoin} 
        disabled={!hostName || joinLoading || playerLimitReached}
        className="w-full"
      >
        {playerLimitReached ? "המשחק מלא" : "הצטרף כמנחה"}
      </Button>
      {playerLimitReached && (
        <p className="text-sm text-red-500 text-center">
          מספר השחקנים המרבי הושג. לא ניתן להצטרף כעת.
        </p>
      )}
    </div>
  );
};

export default HostJoinForm;

