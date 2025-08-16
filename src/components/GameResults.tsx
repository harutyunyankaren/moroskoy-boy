import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type GameResult = {
  id: string;
  player_name: string;
  opponent_name: string;
  winner: string;
  game_duration_seconds: number | null;
  player_shots: number;
  computer_shots: number;
  created_at: string;
};

export function GameResults() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: gameResults, isLoading, refetch } = useQuery({
    queryKey: ['game-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching game results:', error);
        toast({
          title: "Սխալ",
          description: "Չհաջողվեց բեռնել խաղի արդյունքները",
          variant: "destructive"
        });
        throw error;
      }
      
      return data as GameResult[];
    },
    enabled: isOpen
  });

  const stats = gameResults ? {
    totalGames: gameResults.length,
    playerWins: gameResults.filter(g => g.winner === 'player').length,
    computerWins: gameResults.filter(g => g.winner === 'computer').length,
    averagePlayerShots: gameResults.length > 0 
      ? Math.round(gameResults.reduce((sum, g) => sum + g.player_shots, 0) / gameResults.length)
      : 0
  } : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hy-AM', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="mb-4"
      >
        Տեսնել խաղի արդյունքները
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Խաղի արդյունքներ</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Փակել
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Բեռնվում է...</div>
        ) : !gameResults || gameResults.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Դեռ խաղեր չեն գրանցվել
          </div>
        ) : (
          <>
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Ընդամենը խաղեր</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.playerWins}</div>
                  <div className="text-sm text-muted-foreground">Խաղացող հաղթանակ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.computerWins}</div>
                  <div className="text-sm text-muted-foreground">Համակարգիչ հաղթանակ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.averagePlayerShots}</div>
                  <div className="text-sm text-muted-foreground">Միջին կրակոցներ</div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Խաղացող</TableHead>
                    <TableHead>Հակառակորդ</TableHead>
                    <TableHead>Հաղթող</TableHead>
                    <TableHead>Կրակոցներ</TableHead>
                    <TableHead>Ժամկանակ</TableHead>
                    <TableHead>Ամսաթիվ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.player_name}</TableCell>
                      <TableCell>{result.opponent_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={result.winner === 'player' ? 'default' : 'destructive'}
                        >
                          {result.winner === 'player' ? 'Խաղացող' : 'Համակարգիչ'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.player_shots} / {result.computer_shots}
                      </TableCell>
                      <TableCell>{formatDuration(result.game_duration_seconds)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(result.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}