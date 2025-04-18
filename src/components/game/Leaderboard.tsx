
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Player {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardProps {
  players: Player[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <h2 className="text-3xl font-bold text-primary mb-4">טבלת מובילים</h2>
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">דירוג</TableHead>
            <TableHead className="text-right">שם</TableHead>
            <TableHead className="text-right">ניקוד</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{player.name}</TableCell>
              <TableCell>{player.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>הסיבוב הבא מתחיל בקרוב...</p>
    </div>
  );
};

export default Leaderboard;
