
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Award, CheckCircle2 } from 'lucide-react';
import AppButton from './AppButton';
import { SupabasePlayer } from '@/types/game';

interface GameLeaderboardProps {
  players: SupabasePlayer[];
  playerName: string;
  isHost: boolean;
  onNextRound: () => void;
}

const GameLeaderboard: React.FC<GameLeaderboardProps> = ({ players, playerName, isHost, onNextRound }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h2 className="text-2xl font-bold text-primary mb-6">טבלת המובילים</h2>

      <div className="w-full max-w-md">
        <Table>
          <TableHeader>
            <TableRow className="py-[32px]">
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
                <TableCell className={`font-bold ${(player.score || 0) < 0 ? "text-red-500" : ""}`}>
                  {player.score || 0}
                </TableCell>
                <TableCell className="text-right">
                  {idx === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                  {idx === 1 && <Award className="h-5 w-5 text-gray-400" />}
                  {idx === 2 && <Award className="h-5 w-5 text-amber-700" />}
                  {player.name === playerName && idx > 2 && <CheckCircle2 className="h-5 w-5 text-primary my-[30px]" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isHost ? (
        <AppButton 
          variant="primary" 
          size="lg" 
          className="mt-4" 
          onClick={onNextRound}
        >
          התחל סיבוב חדש
        </AppButton>
      ) : (
        <div className="text-sm text-gray-500 mt-4">
          המתן למארח להתחיל סיבוב חדש
        </div>
      )}
    </div>
  );
};

export default GameLeaderboard;
