
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateGame = () => {
    navigate('/host-setup');
  };

  const handleJoinGame = () => {
    toast({
      title: "בקרוב!",
      description: "הצטרפות למשחק תהיה זמינה בקרוב",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      {/* Background musical notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote 
          type="note1" 
          className="absolute top-[10%] right-[15%] opacity-20" 
          size={40} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note2" 
          className="absolute top-[20%] left-[10%] opacity-20" 
          size={34} 
          animation="float-alt"
          color="#FFC22A"
        />
        <MusicNote 
          type="note3" 
          className="absolute bottom-[30%] right-[20%] opacity-20" 
          size={44} 
          animation="float"
          color="#6446D0"
        />
        <MusicNote 
          type="note4" 
          className="absolute bottom-[15%] left-[15%] opacity-20" 
          size={38} 
          animation="float-alt"
          color="#FFC22A"
        />
        <MusicNote 
          type="headphones" 
          className="absolute bottom-[40%] left-[25%] opacity-20" 
          size={50} 
          animation="float"
          color="#3DCDC2"
        />
      </div>

      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          {/* Logo with music icons */}
          <div className="flex items-center justify-center mb-6 relative">
            <MusicNote 
              type="note3" 
              className="absolute -top-10 -right-8 text-primary" 
              size={32} 
              animation="float"
            />
            <h1 className="text-5xl font-bold text-primary text-center">
              שיר על הדרך 🎶
            </h1>
            <MusicNote 
              type="note2" 
              className="absolute -top-6 -left-6 text-secondary" 
              size={28} 
              animation="float-alt"
            />
          </div>

          {/* Description */}
          <p className="text-xl text-center mb-10 text-gray-700">
            משחק טריוויה מוזיקלי משפחתי לנסיעות! מזהים שירים במהירות – ונהנים מכל רגע.
          </p>

          {/* Buttons container */}
          <div className="w-full space-y-4 mb-8">
            <AppButton 
              variant="primary" 
              size="lg"
              onClick={handleCreateGame}
            >
              הקם משחק חדש – פלאפון ראשי
            </AppButton>
            
            <AppButton 
              variant="secondary" 
              size="lg"
              onClick={handleJoinGame}
            >
              הצטרף עם קוד למשחק
            </AppButton>
          </div>

          {/* Decorative car on road illustration */}
          <div className="w-full flex justify-center mt-8">
            <div className="relative">
              <div className="w-16 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-20 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-24 h-1 bg-gray-400 rounded-full mb-1 mx-auto"></div>
              <div className="w-28 h-1 bg-gray-400 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
