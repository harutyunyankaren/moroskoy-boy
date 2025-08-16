import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GameResults } from "@/components/GameResults";
import { useGameTracking } from "@/hooks/useGameTracking";

// Types
type Coord = { x: number; y: number };
type Cell = { hasShip: boolean; hit: boolean; shipId?: number };
type Board = Cell[][];

type Ship = { id: number; size: number; hits: number };

const BOARD_SIZE = 10;
const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ hasShip: false, hit: false }))
  );
}

function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

function canPlaceShip(board: Board, x: number, y: number, size: number, horizontal: boolean): boolean {
  // ensure no overlap and 1-cell buffer including diagonals
  for (let i = 0; i < size; i++) {
    const cx = horizontal ? x + i : x;
    const cy = horizontal ? y : y + i;
    if (!inBounds(cx, cy)) return false;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (inBounds(nx, ny) && board[ny][nx].hasShip) return false;
      }
    }
  }
  return true;
}

function placeShipsRandomly(): { board: Board; ships: Record<number, Ship> } {
  const board = createEmptyBoard();
  const ships: Record<number, Ship> = {};
  let shipId = 1;

  for (const size of SHIP_SIZES) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const horizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE));
      const y = Math.floor(Math.random() * (horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1));
      if (!canPlaceShip(board, x, y, size, horizontal)) continue;
      for (let i = 0; i < size; i++) {
        const cx = horizontal ? x + i : x;
        const cy = horizontal ? y : y + i;
        board[cy][cx] = { hasShip: true, hit: false, shipId };
      }
      ships[shipId] = { id: shipId, size, hits: 0 };
      shipId++;
      placed = true;
    }
  }

  return { board, ships };
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((c) => ({ ...c })));
}

function coordLabel(x: number, y: number) {
  const letters = "ABCDEFGHIJ";
  return `${letters[x]}${y + 1}`;
}

function Grid({
  board,
  ships = {},
  revealShips = false,
  disabled = false,
  onCellClick,
  ariaLabel,
  lastShot,
}: {
  board: Board;
  ships?: Record<number, Ship>;
  revealShips?: boolean;
  disabled?: boolean;
  onCellClick?: (x: number, y: number) => void;
  ariaLabel: string;
  lastShot?: Coord | null;
}) {
  console.log('Grid render:', { revealShips, lastShot, boardState: board.map(row => row.map(cell => ({ hit: cell.hit, hasShip: cell.hasShip }))) });
  
  return (
    <div className="inline-block">
      <div className="grid grid-cols-[auto_repeat(10,minmax(28px,1fr))] gap-0">
        <div />
        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
          <div key={`t-${i}`} className="h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm flex items-center justify-center text-muted-foreground">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        {Array.from({ length: BOARD_SIZE }).map((_, y) => (
          <div key={`row-${y}`} className="contents">
            <div className="h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm flex items-center justify-center text-muted-foreground">
              {y + 1}
            </div>
            {Array.from({ length: BOARD_SIZE }).map((_, x) => {
              const cell = board[y][x];
              const hit = cell.hit;
              const hasShip = cell.hasShip;
              const showShip = revealShips && hasShip;
              
              // Check if this cell's ship is completely sunk
              const isShipSunk = hit && hasShip && cell.shipId && ships[cell.shipId] && ships[cell.shipId].hits >= ships[cell.shipId].size;

              const base = "relative h-8 w-8 sm:h-9 sm:w-9 border border-border flex items-center justify-center select-none text-base sm:text-lg font-semibold transition-all duration-300";
              let stateClass = "bg-secondary hover:bg-secondary/80";
              if (isShipSunk) stateClass = "bg-orange-600 text-orange-50 ring-2 ring-orange-400/50 shadow-xl shadow-orange-500/40 border-orange-500/60 scale-105 animate-scale-in";
              else if (hit && hasShip) stateClass = "bg-destructive text-destructive-foreground border-2 border-destructive ring-2 ring-destructive/40 shadow-xl shadow-destructive/50 scale-105 animate-scale-in";
              else if (hit && !hasShip) stateClass = "bg-muted/60 text-muted-foreground border-muted/40 shadow-md";
              else if (showShip) stateClass = "bg-accent text-accent-foreground border-accent/30";

              const aria = coordLabel(x, y);

              console.log(`Cell ${aria}:`, { hit, hasShip, showShip, stateClass });

              return (
                <button
                  key={`c-${x}-${y}`}
                  aria-label={`${ariaLabel} ${aria}`}
                  className={`${base} ${stateClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                  disabled={disabled || hit}
                  onClick={() => onCellClick && onCellClick(x, y)}
                >
                  {hit && hasShip ? "⨉" : hit ? "•" : showShip ? "▢" : ""}
                  {lastShot && lastShot.x === x && lastShot.y === y ? (
                    <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-background animate-ping" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Battleship() {
  const { toast } = useToast();
  const [playerBoard, setPlayerBoard] = useState<Board>(() => createEmptyBoard());
  const [cpuBoard, setCpuBoard] = useState<Board>(() => createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<Record<number, Ship>>({});
  const [cpuShips, setCpuShips] = useState<Record<number, Ship>>({});
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState<null | "player" | "cpu">(null);
  const [cpuLastShot, setCpuLastShot] = useState<Coord | null>(null);
  
  const {
    playerName,
    setPlayerName,
    playerShots,
    computerShots,
    startGame: startGameTracking,
    incrementPlayerShots,
    incrementComputerShots,
    saveGameResult
  } = useGameTracking();
  // signature interaction: pointer-reactive gradient
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const onPointerMove = (e: React.MouseEvent) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pointer-x", `${x}%`);
    el.style.setProperty("--pointer-y", `${y}%`);
  };

  function newGame() {
    const p = placeShipsRandomly();
    const c = placeShipsRandomly();
    setPlayerBoard(p.board);
    setCpuBoard(c.board);
    setPlayerShips(p.ships);
    setCpuShips(c.ships);
    setPlayerTurn(true);
    setGameOver(null);
    setCpuLastShot(null);
    startGameTracking();
    toast({ title: "Նոր խաղ", description: "Նավերը տեղադրված են. քո հերթն է!" });
  }

  useEffect(() => {
    document.title = "Ծովային պատերազմներ — Խաղալ հիմա";
  }, []);

  useEffect(() => { newGame(); }, []);

  const totalPlayerRemaining = useMemo(() => Object.values(playerShips).filter(s => s.hits < s.size).length, [playerShips]);
  const totalCpuRemaining = useMemo(() => Object.values(cpuShips).filter(s => s.hits < s.size).length, [cpuShips]);

  function registerHit(
    board: Board,
    ships: Record<number, Ship>,
    x: number,
    y: number
  ) {
    console.log('registerHit called:', { x, y, cellBefore: board[y][x] });
    const next = cloneBoard(board);
    const cell = next[y][x];
    if (cell.hit) return { board: next, ships, result: "repeat" as const };
    cell.hit = true;
    console.log('Cell after hit:', { x, y, cellAfter: cell });
    if (cell.hasShip && cell.shipId) {
      const ship = { ...ships[cell.shipId] };
      ship.hits += 1;
      const sunk = ship.hits >= ship.size;
      const updated = { ...ships, [ship.id]: ship };
      return { board: next, ships: updated, result: sunk ? ("sunk" as const) : ("hit" as const) };
    }
    return { board: next, ships, result: "miss" as const };
  }

  function checkWin(ships: Record<number, Ship>) {
    return Object.values(ships).every((s) => s.hits >= s.size);
  }

  function playerFire(x: number, y: number) {
    if (gameOver || !playerTurn) return;
    const { board: nb, ships: ns, result } = registerHit(cpuBoard, cpuShips, x, y);
    setCpuBoard(nb);
    setCpuShips(ns);
    incrementPlayerShots();

    if (result === "hit") {
      toast({ title: "Խփած", description: `${coordLabel(x, y)} — լավ կրակոց!` });
    } else if (result === "miss") {
      toast({ title: "Ջուր", description: `${coordLabel(x, y)} — խփած չէ։` });
    } else if (result === "sunk") {
      toast({ title: "Խորտակված նավ", description: `${coordLabel(x, y)} — շարունակիր։` });
    }

    if (checkWin(ns)) {
      setGameOver("player");
      saveGameResult("player");
      toast({ title: "Հաղթանակ", description: "Դու խորտակեցիր բոլոր նավերը!" });
      return;
    }

    if (result === "miss") {
      setPlayerTurn(false);
      setTimeout(cpuFire, 700);
    } else {
      // keep player's turn on hit/sunk
      setPlayerTurn(true);
    }
  }

  function cpuFire() {
    if (gameOver) return;
    console.log('CPU fire starting...');
    
    // Use current state via callback to ensure we have latest values
    setPlayerBoard(currentBoard => {
      const candidates: Coord[] = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (!currentBoard[y][x].hit) candidates.push({ x, y });
        }
      }
      if (!candidates.length) return currentBoard;
      
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      console.log('CPU picked coordinate:', pick);
      setCpuLastShot(pick);
      
      console.log('Player board before CPU hit:', currentBoard[pick.y][pick.x]);
      
      // Use functional update for ships as well
      setPlayerShips(currentShips => {
        const { board: nb, ships: ns, result } = registerHit(currentBoard, currentShips, pick.x, pick.y);
        console.log('CPU hit result:', result, 'new board cell:', nb[pick.y][pick.x]);
        incrementComputerShots();
        
        if (result === "hit" || result === "sunk") {
          toast({ title: "Թշնամու հարված", description: `${coordLabel(pick.x, pick.y)} — խփել է։` });
        }

        if (checkWin(ns)) {
          setGameOver("cpu");
          saveGameResult("cpu");
          toast({ title: "Պարտություն", description: "Թշնամին խորտակեց բոլոր նավերը։" });
        } else if (result === "miss") {
          setPlayerTurn(true);
        } else {
          // CPU keeps turn on hit/sunk
          setPlayerTurn(false);
          setTimeout(cpuFire, 700);
        }
        
        return ns;
      });
      
      // Return the updated board
      const { board: nb } = registerHit(currentBoard, playerShips, pick.x, pick.y);
      return nb;
    });
  }

  return (
    <main className="min-h-screen py-10">
      <section
        ref={surfaceRef}
        onMouseMove={onPointerMove}
        className="surface-gradient rounded-xl border border-border mx-auto max-w-5xl p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold">Ծովային պատերազմներ — Խաղա հիմա</h1>
            <p className="text-muted-foreground">Գուշակիր կոորդինատները և խորտակիր թշնամու նավերը։ Սկզբում քո հերթն է։</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="player-name" className="text-sm">Անուն:</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-32 h-8 text-sm"
                placeholder="Քո անունը"
              />
            </div>
            <Badge variant={playerTurn ? "default" : "secondary"}>{playerTurn ? "Քո հերթն է" : "Թշնամու հերթն է"}</Badge>
            <Button variant="hero" onClick={newGame}>Նոր խաղ</Button>
            <div className="text-sm text-muted-foreground">
              Կրակոցներ՝ {playerShots} • Նավեր՝ {totalPlayerRemaining} / {totalCpuRemaining}
            </div>
          </div>
          
          <GameResults />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Քո դաշտը</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid board={playerBoard} ships={playerShips} revealShips ariaLabel="Քո դաշտ՝ կոորդինատ" disabled lastShot={cpuLastShot} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Թշնամու դաշտը</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid board={cpuBoard} ships={cpuShips} onCellClick={playerFire} ariaLabel="Թշնամու դաշտ՝ կոորդինատ" disabled={!playerTurn || !!gameOver} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Game",
            name: "Ծովային պատերազմներ (Battleship)",
            description: "Ռազմավարական խաղ՝ խորտակելու հակառակորդի նավերը 10x10 ցանցում։",
            genre: "Strategy",
            applicationCategory: "Game",
          }),
        }}
      />
    </main>
  );
}
