import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface BlocBlastGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface BlockShape {
  id: string;
  cells: [number, number][];
  color: string;
}

const COLORS = ['#1E6B52', '#D97706', '#2563EB', '#DB2777', '#7C3AED', '#0D9488'];

const EASY_SHAPES: [number, number][][] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
];

const MEDIUM_SHAPES: [number, number][][] = [
  ...EASY_SHAPES,
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [1, 1], [2, 1], [2, 0]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
];

const HARD_SHAPES: [number, number][][] = [
  ...MEDIUM_SHAPES,
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
];

function createRandomRack(difficulty: Difficulty): (BlockShape | null)[] {
  const pool =
    difficulty === 'facile'
      ? EASY_SHAPES
      : difficulty === 'moyen'
      ? MEDIUM_SHAPES
      : HARD_SHAPES;
  return Array.from({ length: 3 }, (_, idx) => {
    const cells = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: `${Date.now()}-${idx}-${Math.random()}`,
      cells,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });
}

function createInitialBoard(difficulty: Difficulty): {
  size: number;
  board: (string | null)[][];
} {
  const size = difficulty === 'expert' ? 9 : 8;
  const board: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null)
  );
  if (difficulty === 'difficile' || difficulty === 'expert') {
    const obstacleCount = difficulty === 'difficile' ? 6 : 10;
    let placed = 0;
    while (placed < obstacleCount) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!board[r][c]) {
        board[r][c] = '#64748B';
        placed++;
      }
    }
  }
  return { size, board };
}

export const BlocBlastGame: React.FC<BlocBlastGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const initial = useMemo(() => createInitialBoard(difficulty), [difficulty, seed]);
  const size = initial.size;

  const [board, setBoard] = useState<(string | null)[][]>(initial.board);
  const [rack, setRack] = useState<(BlockShape | null)[]>(() => createRandomRack(difficulty));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [hintMove, setHintMove] = useState<{ slot: number; r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const targetScore =
    difficulty === 'facile' ? 200 : difficulty === 'moyen' ? 450 : difficulty === 'difficile' ? 750 : 1100;

  useEffect(() => {
    setBoard(initial.board);
    setRack(createRandomRack(difficulty));
    setSelectedSlot(0);
    setHoverCell(null);
    setHintMove(null);
    setScore(0);
    setLinesClearedTotal(0);
    setGoalReached(false);
    setGameOver(false);
    setFeedback(null);
  }, [difficulty, initial]);

  const canPlaceAt = useCallback(
    (grid: (string | null)[][], shape: BlockShape, r0: number, c0: number): boolean => {
      for (const [dr, dc] of shape.cells) {
        const rr = r0 + dr;
        const cc = c0 + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) return false;
        if (grid[rr][cc] !== null) return false;
      }
      return true;
    },
    [size]
  );

  const hasAnyValidMove = useCallback(
    (grid: (string | null)[][], currentRack: (BlockShape | null)[]): boolean => {
      for (const piece of currentRack) {
        if (!piece) continue;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (canPlaceAt(grid, piece, r, c)) return true;
          }
        }
      }
      return false;
    },
    [canPlaceAt, size]
  );

  const placeSelectedAt = (r0: number, c0: number) => {
    if (gameOver || selectedSlot === null) return;
    const piece = rack[selectedSlot];
    if (!piece) return;

    if (!canPlaceAt(board, piece, r0, c0)) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: 'Emplacement impossible : la pièce déborde ou chevauche déjà un bloc.',
      });
      return;
    }

    const nextBoard = board.map((row) => [...row]);
    for (const [dr, dc] of piece.cells) {
      nextBoard[r0 + dr][c0 + dc] = piece.color;
    }

    // Check completed rows & cols
    const fullRows: number[] = [];
    const fullCols: number[] = [];
    for (let r = 0; r < size; r++) {
      if (nextBoard[r].every((cell) => cell !== null)) fullRows.push(r);
    }
    for (let c = 0; c < size; c++) {
      if (nextBoard.every((row) => row[c] !== null)) fullCols.push(c);
    }

    fullRows.forEach((r) => {
      for (let c = 0; c < size; c++) nextBoard[r][c] = null;
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < size; r++) nextBoard[r][c] = null;
    });

    const clearedCount = fullRows.length + fullCols.length;
    const gained =
      piece.cells.length * 10 + (clearedCount > 0 ? clearedCount * clearedCount * 40 : 0);
    const nextScore = score + gained;

    const nextRack = [...rack];
    nextRack[selectedSlot] = null;
    const allUsed = nextRack.every((p) => p === null);
    const finalRack = allUsed ? createRandomRack(difficulty) : nextRack;

    setBoard(nextBoard);
    setRack(finalRack);
    setScore(nextScore);
    setLinesClearedTotal((l) => l + clearedCount);
    setHintMove(null);
    setHoverCell(null);

    const nextSlot = finalRack.findIndex((p) => p !== null);
    setSelectedSlot(nextSlot === -1 ? null : nextSlot);

    if (clearedCount > 0) {
      soundFX.clear();
      setFeedback({
        type: 'success',
        message: `${clearedCount} ligne${clearedCount > 1 ? 's/colonnes' : ''} libérée${
          clearedCount > 1 ? 's' : ''
        } (+${gained} points) !`,
      });
    } else {
      soundFX.place();
      setFeedback(null);
    }

    if (!goalReached && nextScore >= targetScore) {
      setGoalReached(true);
      soundFX.victory();
      onWin('bloc-blast');
    }

    if (!hasAnyValidMove(nextBoard, finalRack)) {
      setGameOver(true);
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `Plus aucun emplacement libre pour les pièces restantes ! Score final : ${nextScore} pts.`,
      });
    }
  };

  // Compute best move for Indice
  const handleHint = () => {
    if (gameOver) return;
    let best: { slot: number; r: number; c: number; score: number } | null = null;

    rack.forEach((piece, slot) => {
      if (!piece) return;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!canPlaceAt(board, piece, r, c)) continue;
          const test = board.map((row) => [...row]);
          for (const [dr, dc] of piece.cells) test[r + dr][c + dc] = piece.color;
          let clears = 0;
          for (let rr = 0; rr < size; rr++) {
            if (test[rr].every((x) => x !== null)) clears++;
          }
          for (let cc = 0; cc < size; cc++) {
            if (test.every((row) => row[cc] !== null)) clears++;
          }
          const evalScore = clears * 100 + piece.cells.length * 5;
          if (!best || evalScore > best.score) {
            best = { slot, r, c, score: evalScore };
          }
        }
      }
    });

    if (best) {
      const b = best as { slot: number; r: number; c: number; score: number };
      setSelectedSlot(b.slot);
      setHintMove({ slot: b.slot, r: b.r, c: b.c });
      soundFX.hint();
      setFeedback({
        type: 'hint',
        message: `Indice : placez la pièce n°${b.slot + 1} sur les cases dorées clignotantes.`,
      });
    }
  };

  const activePiece = selectedSlot !== null ? rack[selectedSlot] : null;
  const previewResult = useMemo(() => {
    if (!activePiece || !hoverCell) return { cells: new Set<string>(), valid: false };
    const [hr, hc] = hoverCell;
    const valid = canPlaceAt(board, activePiece, hr, hc);
    const cells = new Set<string>();
    for (const [dr, dc] of activePiece.cells) {
      const rr = hr + dr;
      const cc = hc + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
        cells.add(`${rr}-${cc}`);
      }
    }
    return { cells, valid };
  }, [activePiece, board, canPlaceAt, hoverCell, size]);

  const hintCells = useMemo(() => {
    if (!hintMove) return new Set<string>();
    const piece = rack[hintMove.slot];
    if (!piece) return new Set<string>();
    return new Set(piece.cells.map(([dr, dc]) => `${hintMove.r + dr}-${hintMove.c + dc}`));
  }, [hintMove, rack]);

  return (
    <GameLayout
      gameId="bloc-blast"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      hintLabel="Meilleur coup"
      feedback={feedback}
      won={goalReached}
      winSummary={`Objectif de ${targetScore} points atteint (${linesClearedTotal} lignes libérées) — vous pouvez continuer pour battre votre record !`}
      statsNode={
        <div className="flex items-center gap-3 text-sm font-semibold tabular-nums px-2">
          <span className="text-[#1E6B52]">{score} pts</span>
          <span className="text-[#78716C]">Objectif : {targetScore}</span>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Board */}
        <div
          onMouseLeave={() => setHoverCell(null)}
          className="grid gap-1.5 p-3 bg-[#EDE8DF] border border-[#D6D0C4] rounded-2xl w-full max-w-[460px] aspect-square select-none"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {board.map((row, r) =>
            row.map((cellColor, c) => {
              const key = `${r}-${c}`;
              const isPreview = previewResult.cells.has(key);
              const isHint = hintCells.has(key);

              let bg = cellColor || '#FFFFFF';
              let extraClass = 'border border-[#E5E0D8]';
              if (isPreview) {
                if (previewResult.valid && activePiece) {
                  bg = activePiece.color;
                  extraClass = 'opacity-70 ring-2 ring-[#1E6B52]';
                } else {
                  bg = '#FCA5A5';
                  extraClass = 'ring-2 ring-[#DC2626]';
                }
              } else if (isHint) {
                extraClass = 'ring-3 ring-[#D97706] bg-[#FEF3C7]';
              }

              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setHoverCell([r, c])}
                  onClick={() => placeSelectedAt(r, c)}
                  style={{ backgroundColor: isHint && !cellColor ? '#FEF3C7' : bg }}
                  className={`rounded-lg transition-transform cursor-pointer ${extraClass}`}
                  aria-label={`Case ${r + 1},${c + 1}`}
                />
              );
            })
          )}
        </div>

        {/* Piece Rack */}
        <div className="w-full max-w-[340px] flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-3">
              Choisissez une pièce puis touchez la grille :
            </h2>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              {rack.map((piece, idx) => {
                if (!piece) {
                  return (
                    <div
                      key={idx}
                      className="h-24 rounded-xl border border-dashed border-[#D6D0C4] flex items-center justify-center text-xs text-[#A8A29E]"
                    >
                      Posée ✓
                    </div>
                  );
                }
                const maxR = Math.max(...piece.cells.map(([r]) => r)) + 1;
                const maxC = Math.max(...piece.cells.map(([, c]) => c)) + 1;
                const isSelected = selectedSlot === idx;
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => {
                      soundFX.click();
                      setSelectedSlot(idx);
                      setHintMove(null);
                    }}
                    className={`h-24 rounded-xl border flex items-center justify-center p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#1E6B52] ring-2 ring-[#1E6B52]/30 shadow-xs'
                        : 'bg-white border-[#E5E0D8] hover:border-[#A8A29E]'
                    }`}
                  >
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${maxC}, 16px)`,
                        gridTemplateRows: `repeat(${maxR}, 16px)`,
                      }}
                    >
                      {Array.from({ length: maxR * maxC }).map((_, cellIdx) => {
                        const rr = Math.floor(cellIdx / maxC);
                        const cc = cellIdx % maxC;
                        const filled = piece.cells.some(([pr, pc]) => pr === rr && pc === cc);
                        return (
                          <div
                            key={cellIdx}
                            style={{ backgroundColor: filled ? piece.color : 'transparent' }}
                            className="w-4 h-4 rounded-xs"
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            La case touchée sur le plateau correspond au coin haut-gauche de votre pièce. Si elle est bloquée, l’aperçu devient rouge.
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
