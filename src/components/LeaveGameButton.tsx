
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeaveGameDialog from './LeaveGameDialog';

const LeaveGameButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="text-muted-foreground hover:text-primary"
      >
        <LogOut className="h-4 w-4 ml-2" />
        יציאה מהמשחק
      </Button>
      <LeaveGameDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default LeaveGameButton;
