
import React from 'react';
import { Trophy, Award, Crown, Play } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppButton from '@/components/AppButton';
import AdSenseAd from '@/components/AdSenseAd';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardProps {
  isHost: boolean;
  players: Player[];
  playerName: string;
  onNextRound: () => void;
  onResetScores: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  isHost,
  players,
  playerName,
  onNextRound,
  onResetScores
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h2 className="text-2xl font-bold text-primary mb-6">טבלת המובילים</h2>
      
      <div className="w-full max-w-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מיקום</TableHead>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">ניקוד</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player, idx) => (
              <TableRow key={player.id} className={player.name === playerName ? "bg-primary/10" : ""}>
                <TableCell className="font-medium">{idx + 1}</TableCell>
                <TableCell className="font-semibold">{player.name}</TableCell>
                <TableCell>{player.score}</TableCell>
                <TableCell className="text-right">
                  {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                  {idx === 1 && <Award className="h-5 w-5 text-gray-400" />}
                  {idx === 2 && <Crown className="h-5 w-5 text-orange-400" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="w-full max-w-md my-6">
        <AdSenseAd
          format="fluid"
          layout="in-article"
          style={{ minHeight: '100px' }}
        />
      </div>
      
      {isHost && (
        <div className="mt-8 flex flex-col gap-4 w-full max-w-xs">
          <AppButton variant="primary" size="lg" onClick={onNextRound}>
            התחל סיבוב חדש
            <Play className="mr-2" />
          </AppButton>
          <AppButton variant="secondary" onClick={onResetScores}>
            איפוס ניקוד לכולם
          </AppButton>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
