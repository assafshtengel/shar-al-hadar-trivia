
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GameHostSetup from "./pages/GameHostSetup";
import JoinGame from "./pages/JoinGame";
import WaitingRoom from "./pages/WaitingRoom";
import GamePlay from "./pages/GamePlay";
import NotFound from "./pages/NotFound";
import { GameStateProvider } from "./contexts/GameStateContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner closeButton position="top-center" />
      <BrowserRouter>
        <GameStateProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/host-setup" element={<GameHostSetup />} />
            <Route path="/join-game" element={<JoinGame />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/gameplay" element={<GamePlay />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GameStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
