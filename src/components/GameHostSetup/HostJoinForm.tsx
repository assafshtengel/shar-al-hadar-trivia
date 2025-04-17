
import React from 'react';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';

interface HostJoinFormProps {
  hostName: string;
  setHostName: (name: string) => void;
  handleHostJoin: () => void;
  hostJoined: boolean;
  joinLoading: boolean;
}

const HostJoinForm: React.FC<HostJoinFormProps> = ({ 
  hostName, 
  setHostName, 
  handleHostJoin, 
  hostJoined, 
  joinLoading 
}) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-center">הצטרף למשחק כמנחה</h3>
      <Input
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        placeholder="הכנס את שמך (כדי להצטרף למשחק)"
        disabled={hostJoined}
        className="mb-3 text-right"
      />
      <AppButton
        variant="secondary"
        size="default"
        onClick={handleHostJoin}
        disabled={hostJoined || joinLoading}
        className="w-full"
      >
        {joinLoading ? "מצטרף..." : hostJoined ? "הצטרפת למשחק" : "הצטרף גם אני"}
      </AppButton>
    </div>
  );
};

export default HostJoinForm;
