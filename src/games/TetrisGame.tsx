import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play, RotateCw, Archive } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface TetrisGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

const COLS = 10;
const ROWS = 18;

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface PieceDef {
  type: TetrominoType;
  matrix: number[][];
  color: string;
}

const SHAPES: Record<TetrominoType, { matrix: number[][]; color: string }> = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#0EA5E9',
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: '#F59E0B',
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#8B5CF6',
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#10B981',
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#EF4444',
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#2563EB',
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#EA580C',
  },
};

function createBag(): TetrominoType[] {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (__, c) => matrix[n - 1 - c][r])
  );
}

function makeInitialBoard(difficulty: Difficulty): (string | null)[][] {
  const board: (string | null)[][] = Array.from({ length: ROWS }, () =>
    Array<string | null>(COLS).fill(null)
  );
  if (difficulty === 'expert') {
    // Add 4 pre-filled garbage rows with 2 random holes per row
    for (let r = ROWS - 4; r < ROWS; r++) {
      const hole1 = Math.floor(Math.random() * COLS);
      const hole2 = (hole1 + 4) % COLS;
      for (let c = 0; c < COLS; c++) {
        if (c !== hole1 && c !== hole2) {
          board[r][c] = '#64748B';
        }
      }
    }
  }
  return board;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);

  const [board, setBoard] = useState<(string | null)[][]>(() => makeInitialBoard(difficulty));
  const bagRef = useRef<TetrominoType[]>(createBag());

  const pullNextType = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) bagRef.current = createBag();
    return bagRef.current.pop()!;
  }, []);

  const spawnPiece = useCallback((type: TetrominoType): { def: PieceDef; r: number; c: number } => {
    const s = SHAPES[type];
    return {
      def: { type, matrix: s.matrix.map((row) => [...row]), color: s.color },
      r: 0,
      c: Math.floor((COLS - s.matrix[0].length) / 2),
    };
  }, []);

  const [active, setActive] = useState<{ def: PieceDef; r: number; c: number }>(() =>
    spawnPiece(pullNextType())
  );
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>(() => [
    pullNextType(),
    pullNextType(),
  ]);
  const [holdType, setHoldType] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hintTarget, setHintTarget] = useState<{ cells: [number, number][] } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const targetLines =
    difficulty === 'facile' ? 8 : difficulty === 'moyen' ? 14 : difficulty === 'difficile' ? 20 : 25;

  const resetGame = useCallback(
    (diff: Difficulty) => {
      bagRef.current = createBag();
      setBoard(makeInitialBoard(diff));
      const first = pullNextType();
      setActive(spawnPiece(first));
      setNextQueue([pullNextType(), pullNextType()]);
      setHoldType(null);
      setCanHold(true);
      setScore(0);
      setLines(0);
      setPaused(false);
      setGameOver(false);
      setWon(false);
      setHintTarget(null);
      setFeedback(null);
    },
    [pullNextType, spawnPiece]
  );

  useEffect(() => {
    resetGame(difficulty);
  }, [difficulty, resetGame, seed]);

  const collides = useCallback(
    (grid: (string | null)[][], matrix: number[][], r0: number, c0: number): boolean => {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (!matrix[r][c]) continue;
          const nr = r0 + r;
          const nc = c0 + c;
          if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
          if (nr >= 0 && grid[nr][nc] !== null) return true;
        }
      }
      return false;
    },
    []
  );

  const lockPiece = useCallback(
    (pieceToLock: { def: PieceDef; r: number; c: number }) => {
      const nextBoard = board.map((row) => [...row]);
      for (let r = 0; r < pieceToLock.def.matrix.length; r++) {
        for (let c = 0; c < pieceToLock.def.matrix[r].length; c++) {
          if (!pieceToLock.def.matrix[r][c]) continue;
          const nr = pieceToLock.r + r;
          const nc = pieceToLock.c + c;
          if (nr < 0) {
            setGameOver(true);
            soundFX.error();
            setFeedback({
              type: 'error',
              message: `Partie terminée ! Score final : ${score} pts (${lines} lignes).`,
            });
            return;
          }
          nextBoard[nr][nc] = pieceToLock.def.color;
        }
      }

      // Clear full lines
      const keptRows = nextBoard.filter((row) => row.some((cell) => cell === null));
      const cleared = ROWS - keptRows.length;
      while (keptRows.length < ROWS) {
        keptRows.unshift(Array<string | null>(COLS).fill(null));
      }

      const bonus = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared >= 4 ? 800 : 15;
      const nextScore = score + bonus;
      const nextLines = lines + cleared;

      setBoard(keptRows);
      setScore(nextScore);
      setLines(nextLines);
      setHintTarget(null);
      setCanHold(true);

      if (cleared > 0) {
        soundFX.clear();
        setFeedback({
          type: 'success',
          message: `${cleared} ligne${cleared > 1 ? 's' : ''} complétée${cleared > 1 ? 's' : ''} !`,
        });
      } else {
        soundFX.place();
      }

      if (!won && nextLines >= targetLines) {
        setWon(true);
        soundFX.victory();
        onWin('tetris');
      }

      const [nextType, secondType] = nextQueue;
      const upcoming = spawnPiece(nextType);
      setNextQueue([secondType, pullNextType()]);

      if (collides(keptRows, upcoming.def.matrix, upcoming.r, upcoming.c)) {
        setGameOver(true);
        soundFX.error();
        setFeedback({
          type: 'error',
          message: `Plus de place en haut du plateau ! Score final : ${nextScore} pts.`,
        });
      } else {
        setActive(upcoming);
      }
    },
    [board, collides, lines, nextQueue, onWin, pullNextType, score, spawnPiece, targetLines, won]
  );

  const move = useCallback(
    (dr: number, dc: number) => {
      if (paused || gameOver) return;
      if (!collides(board, active.def.matrix, active.r + dr, active.c + dc)) {
        setActive((prev) => ({ ...prev, r: prev.r + dr, c: prev.c + dc }));
        if (dc !== 0) soundFX.click();
      } else if (dr === 1) {
        lockPiece(active);
      }
    },
    [active, board, collides, gameOver, lockPiece, paused]
  );

  const rotateActive = useCallback(() => {
    if (paused || gameOver) return;
    const rotated = rotateMatrix(active.def.matrix);
    // Wall kick offsets
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(board, rotated, active.r, active.c + kick)) {
        soundFX.click();
        setActive((prev) => ({
          ...prev,
          c: prev.c + kick,
          def: { ...prev.def, matrix: rotated },
        }));
        return;
      }
    }
  }, [active, board, collides, gameOver, paused]);

  const hardDrop = useCallback(() => {
    if (paused || gameOver) return;
    let dropR = active.r;
    while (!collides(board, active.def.matrix, dropR + 1, active.c)) {
      dropR++;
    }
    lockPiece({ ...active, r: dropR });
  }, [active, board, collides, gameOver, lockPiece, paused]);

  const handleHold = useCallback(() => {
    if (paused || gameOver || !canHold) return;
    soundFX.click();
    const curType = active.def.type;
    if (holdType) {
      setActive(spawnPiece(holdType));
    } else {
      const [nextType, secondType] = nextQueue;
      setActive(spawnPiece(nextType));
      setNextQueue([secondType, pullNextType()]);
    }
    setHoldType(curType);
    setCanHold(false);
  }, [active.def.type, canHold, gameOver, holdType, nextQueue, paused, pullNextType, spawnPiece]);

  // Gravity tick calibrated by difficulty
  useEffect(() => {
    if (paused || gameOver) return;
    const baseMs: Record<Difficulty, number> = {
      facile: 950,
      moyen: 620,
      difficile: 360,
      expert: 220,
    };
    const speedUp = Math.min(140, Math.floor(lines / 4) * 20);
    const interval = Math.max(120, baseMs[difficulty] - speedUp);
    const id = window.setInterval(() => {
      move(1, 0);
    }, interval);
    return () => window.clearInterval(id);
  }, [difficulty, gameOver, lines, move, paused]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') move(0, -1);
      else if (e.key === 'ArrowRight') move(0, 1);
      else if (e.key === 'ArrowDown') move(1, 0);
      else if (e.key === 'ArrowUp') rotateActive();
      else if (e.key === ' ') hardDrop();
      else if (e.key.toLowerCase() === 'p') setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameOver, hardDrop, move, rotateActive]);

  // Ghost piece row
  const ghostR = useMemo(() => {
    let r = active.r;
    while (!collides(board, active.def.matrix, r + 1, active.c)) r++;
    return r;
  }, [active, board, collides]);

  // Smart Placement Hint (evaluates all rotations & columns)
  const handleHint = () => {
    if (gameOver) return;
    let bestScore = -Infinity;
    let bestCells: [number, number][] = [];

    let mat = active.def.matrix;
    for (let rot = 0; rot < 4; rot++) {
      for (let col = -2; col < COLS + 2; col++) {
        if (collides(board, mat, 0, col)) continue;
        let r = 0;
        while (!collides(board, mat, r + 1, col)) r++;
        const test = board.map((row) => [...row]);
        const cells: [number, number][] = [];
        for (let dr = 0; dr < mat.length; dr++) {
          for (let dc = 0; dc < mat[dr].length; dc++) {
            if (mat[dr][dc]) {
              const nr = r + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                test[nr][nc] = active.def.color;
                cells.push([nr, nc]);
              }
            }
          }
        }

        // Heuristic: cleared lines(+), aggregate height(-), holes(-)
        let cleared = 0;
        for (let rr = 0; rr < ROWS; rr++) {
          if (test[rr].every((x) => x !== null)) cleared++;
        }
        let holes = 0;
        let heightSum = 0;
        for (let c = 0; c < COLS; c++) {
          let seenBlock = false;
          for (let rr = 0; rr < ROWS; rr++) {
            if (test[rr][c] !== null) {
              if (!seenBlock) {
                heightSum += ROWS - rr;
                seenBlock = true;
              }
            } else if (seenBlock) {
              holes++;
            }
          }
        }
        const evalScore = cleared * 120 - holes * 35 - heightSum * 2;
        if (evalScore > bestScore) {
          bestScore = evalScore;
          bestCells = cells;
        }
      }
      mat = rotateMatrix(mat);
    }

    if (bestCells.length > 0) {
      setHintTarget({ cells: bestCells });
      soundFX.hint();
      setFeedback({
        type: 'hint',
        message: 'Indice : l’emplacement conseillé est illuminé en doré tout en bas du plateau.',
      });
    }
  };

  const hintSet = useMemo(
    () => new Set(hintTarget?.cells.map(([r, c]) => `${r}-${c}`) ?? []),
    [hintTarget]
  );

  const renderMiniPiece = (type: TetrominoType | null) => {
    if (!type) {
      return <span className="text-xs text-[#A8A29E]">Vide</span>;
    }
    const shape = SHAPES[type];
    return (
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${shape.matrix[0].length}, 14px)` }}
      >
        {shape.matrix.flat().map((v, idx) => (
          <div
            key={idx}
            style={{ backgroundColor: v ? shape.color : 'transparent' }}
            className="w-3.5 h-3.5 rounded-[2px]"
          />
        ))}
      </div>
    );
  };

  return (
    <GameLayout
      gameId="tetris"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      hintLabel="Meilleur placement"
      feedback={feedback}
      won={won}
      winSummary={`Objectif de ${targetLines} lignes atteint avec ${score} points ! Continuez autant que vous voulez.`}
      statsNode={
        <div className="flex items-center gap-3 text-sm font-semibold tabular-nums px-2">
          <span className="text-[#1E6B52]">{score} pts</span>
          <span className="text-[#57534E]">
            {lines} / {targetLines} lignes
          </span>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Tetris 10x18 Arena */}
        <div className="relative bg-[#1E293B] p-2.5 rounded-2xl border-2 border-[#0F172A] select-none">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              width: 'min(82vw, 310px)',
            }}
          >
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                let activeCell = false;
                let ghostCell = false;
                const mat = active.def.matrix;
                const ar = r - active.r;
                const ac = c - active.c;
                if (ar >= 0 && ar < mat.length && ac >= 0 && ac < mat[0].length && mat[ar][ac]) {
                  activeCell = true;
                }
                const gr = r - ghostR;
                if (
                  !activeCell &&
                  gr >= 0 &&
                  gr < mat.length &&
                  ac >= 0 &&
                  ac < mat[0].length &&
                  mat[gr][ac]
                ) {
                  ghostCell = true;
                }
                const isHint = hintSet.has(`${r}-${c}`);

                let bg = '#0F172A';
                let cls = '';
                if (activeCell) {
                  bg = active.def.color;
                  cls = 'brightness-110 shadow-xs';
                } else if (cellColor) {
                  bg = cellColor;
                } else if (isHint) {
                  bg = '#F59E0B';
                  cls = 'opacity-70 ring-2 ring-[#FDE68A]';
                } else if (ghostCell) {
                  bg = active.def.color;
                  cls = 'opacity-25';
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    style={{ backgroundColor: bg }}
                    className={`aspect-square rounded-[3px] ${cls}`}
                  />
                );
              })
            )}
          </div>

          {paused && !gameOver && (
            <div className="absolute inset-0 bg-black/65 rounded-2xl flex flex-col items-center justify-center text-white gap-3">
              <p className="font-display text-2xl font-semibold">En pause</p>
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="px-4 py-2 rounded-xl bg-[#1E6B52] text-white text-sm font-semibold cursor-pointer"
              >
                Reprendre
              </button>
            </div>
          )}
        </div>

        {/* Next / Hold / Touch Controls */}
        <div className="w-full max-w-[330px] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8] flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#57534E]">Réserve</span>
              <div className="h-14 flex items-center justify-center">
                {renderMiniPiece(holdType)}
              </div>
              <button
                type="button"
                onClick={handleHold}
                disabled={!canHold || paused || gameOver}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold text-[#1C1917] hover:bg-[#EDE8DF] disabled:opacity-45 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Garder</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8] flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#57534E]">Suivantes</span>
              <div className="flex flex-col items-center gap-2 py-1">
                {renderMiniPiece(nextQueue[0])}
                {difficulty === 'facile' && renderMiniPiece(nextQueue[1])}
              </div>
            </div>
          </div>

          {/* Large Tactile Controls */}
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8] flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => move(0, -1)}
                className="h-12 rounded-xl bg-white border border-[#D6D0C4] hover:bg-[#EDE8DF] flex items-center justify-center cursor-pointer"
                aria-label="Aller à gauche"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={rotateActive}
                className="h-12 rounded-xl bg-[#1E6B52] text-white hover:bg-[#175440] flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                aria-label="Pivoter"
              >
                <RotateCw className="w-4 h-4" />
                <span>Tourner</span>
              </button>
              <button
                type="button"
                onClick={() => move(0, 1)}
                className="h-12 rounded-xl bg-white border border-[#D6D0C4] hover:bg-[#EDE8DF] flex items-center justify-center cursor-pointer"
                aria-label="Aller à droite"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => move(1, 0)}
                className="h-12 rounded-xl bg-white border border-[#D6D0C4] hover:bg-[#EDE8DF] flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
                <span>Descendre</span>
              </button>
              <button
                type="button"
                onClick={hardDrop}
                className="h-12 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E] hover:bg-[#FDE68A] text-xs font-semibold cursor-pointer"
              >
                Poser net
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="h-12 rounded-xl bg-white border border-[#D6D0C4] hover:bg-[#EDE8DF] flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{paused ? 'Reprendre' : 'Pause'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Clavier : Flèches ← → ↓ pour bouger, ↑ pour tourner, Espace pour poser d’un coup, P pour pause.
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
