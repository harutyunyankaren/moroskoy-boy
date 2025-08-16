-- Create game results table to track wins and losses
CREATE TABLE public.game_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  opponent_name TEXT NOT NULL DEFAULT 'Computer',
  winner TEXT NOT NULL CHECK (winner IN ('player', 'computer')),
  game_duration_seconds INTEGER,
  player_shots INTEGER NOT NULL DEFAULT 0,
  computer_shots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (games can be viewed by everyone for public leaderboard)
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view game results for public leaderboard
CREATE POLICY "Anyone can view game results" 
ON public.game_results 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert game results (for anonymous play)
CREATE POLICY "Anyone can create game results" 
ON public.game_results 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance on queries
CREATE INDEX idx_game_results_created_at ON public.game_results(created_at DESC);
CREATE INDEX idx_game_results_winner ON public.game_results(winner);