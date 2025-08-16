import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGameTracking() {
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState("Խաղացող");
  const [playerShots, setPlayerShots] = useState(0);
  const [computerShots, setComputerShots] = useState(0);
  const gameStartTime = useRef<Date | null>(null);

  const startGame = () => {
    gameStartTime.current = new Date();
    setPlayerShots(0);
    setComputerShots(0);
  };

  const incrementPlayerShots = () => {
    setPlayerShots(prev => prev + 1);
  };

  const incrementComputerShots = () => {
    setComputerShots(prev => prev + 1);
  };

  const saveGameResult = async (winner: "player" | "cpu") => {
    try {
      if (!gameStartTime.current) return;

      const gameEndTime = new Date();
      const gameDurationSeconds = Math.floor(
        (gameEndTime.getTime() - gameStartTime.current.getTime()) / 1000
      );

      const { error } = await supabase
        .from('game_results')
        .insert({
          player_name: playerName,
          opponent_name: 'Համակարգիչ',
          winner: winner === "player" ? "player" : "computer",
          game_duration_seconds: gameDurationSeconds,
          player_shots: playerShots,
          computer_shots: computerShots
        });

      if (error) {
        console.error('Error saving game result:', error);
        toast({
          title: "Սխալ",
          description: "Չհաջողվեց պահպանել խաղի արդյունքը",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Պահպանված",
          description: "Խաղի արդյունքը գրանցված է",
        });
      }
    } catch (error) {
      console.error('Unexpected error saving game result:', error);
    }
  };

  return {
    playerName,
    setPlayerName,
    playerShots,
    computerShots,
    startGame,
    incrementPlayerShots,
    incrementComputerShots,
    saveGameResult
  };
}