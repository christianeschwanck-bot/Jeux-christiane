import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eraser, Pencil, Undo2 } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface SudokuGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isSafe(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isSafe(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid: number[][], limit = 2): number {
  let bestR = -1;
  let bestC = -1;
  let bestCount = 10;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let n = 1; n <= 9; n++) {
          if (isSafe(grid, r, c, n)) count++;
        }
        if (count === 0) return 0;
        if (count < bestCount) {
          bestCount = count;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  if (bestR === -1) return 1;

  let total = 0;
  for (let n = 1; n <= 9; n++) {
    if (isSafe(grid, bestR, bestC, n)) {
      grid[bestR][bestC] = n;
      total += countSolutions(grid, limit);
      grid[bestR][bestC] = 0;
      if (total >= limit) return total;
    }
  }
  return total;
}

function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(solution);

  const puzzle = solution.map((row) => [...row]);
  const targetClues: Record<Difficulty, number> = {
    facile: 44,
    moyen: 33,
    difficile: 25,
    expert: 20,
  };
  const cluesGoal = targetClues[difficulty];
  let clues = 81;

  const positions = shuffle(
    Array.from({ length: 81 }, (_, idx) => [Math.floor(idx / 9), idx % 9] as [number, number])
  );

  for (const [r, c] of positions) {
    if (clues <= cluesGoal) break;
    const backup = puzzle[r][c];
    if (backup === 0) continue;
    puzzle[r][c] = 0;

    const copy = puzzle.map((row) => [...row]);
    if (countSolutions(copy, 2) !== 1) {
      puzzle[r][c] = backup;
    } else {
      clues--;
    }
  }

  return { puzzle, solution };
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const { puzzle, solution } = useMemo(() => generateSudoku(difficulty), [difficulty, seed]);

  const [board, setBoard] = useState<number[][]>(() => puzzle.map((r) => [...r]));
  const [notes, setNotes] = useState<Set<number>[][]>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
  );
  const [history, setHistory] = useState<number[][][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [hintCell, setHintCell] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const resetState = useCallback(
    (newPuzzle: number[][]) => {
      setBoard(newPuzzle.map((r) => [...r]));
      setNotes(
        Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
      );
      setHistory([]);
      setSelected(null);
      setErrorCells(new Set());
      setHintCell(null);
      setFeedback(null);
      setWon(false);
      setSeconds(0);
    },
    []
  );

  useEffect(() => {
    resetState(puzzle);
  }, [puzzle, resetState]);

  useEffect(() => {
    if (won) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [won]);

  const checkVictory = useCallback(
    (nextBoard: number[][]) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (nextBoard[r][c] !== solution[r][c]) return false;
        }
      }
      setWon(true);
      setFeedback({
        type: 'success',
        message: 'Toutes les cases sont exactes ! Magnifique partie.',
      });
      soundFX.victory();
      onWin('sudoku');
      return true;
    },
    [onWin, solution]
  );

  const enterNumber = useCallback(
    (num: number) => {
      if (!selected || won) return;
      const [r, c] = selected;
      if (puzzle[r][c] !== 0) return;

      if (noteMode && num !== 0) {
        soundFX.click();
        setNotes((prev) => {
          const next = prev.map((row) => row.map((s) => new Set(s)));
          if (next[r][c].has(num)) next[r][c].delete(num);
          else next[r][c].add(num);
          return next;
        });
        return;
      }

      setHistory((prev) => [...prev.slice(-29), board.map((row) => [...row])]);
      const nextBoard = board.map((row) => [...row]);
      nextBoard[r][c] = num;
      setBoard(nextBoard);
      setHintCell(null);

      // Clear cell notes when placing a number
      if (num !== 0) {
        setNotes((prev) => {
          const next = prev.map((row) => row.map((s) => new Set(s)));
          next[r][c].clear();
          return next;
        });
      }

      // Immediate feedback if wrong value vs valid placement
      const cellKey = `${r}-${c}`;
      const nextErrors = new Set(errorCells);
      if (num === 0) {
        nextErrors.delete(cellKey);
        setErrorCells(nextErrors);
        setFeedback(null);
        soundFX.click();
      } else if (num !== solution[r][c]) {
        nextErrors.add(cellKey);
        setErrorCells(nextErrors);
        setFeedback({
          type: 'error',
          message: `Ce ${num} en ligne ${r + 1}, colonne ${c + 1} ne convient pas. Essayez une autre piste !`,
        });
        soundFX.error();
      } else {
        nextErrors.delete(cellKey);
        setErrorCells(nextErrors);
        setFeedback(null);
        soundFX.place();
        checkVictory(nextBoard);
      }
    },
    [board, checkVictory, errorCells, noteMode, puzzle, selected, solution, won]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key >= '1' && e.key <= '9') {
        enterNumber(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        enterNumber(0);
      } else if (selected) {
        const [r, c] = selected;
        if (e.key === 'ArrowUp') setSelected([Math.max(0, r - 1), c]);
        else if (e.key === 'ArrowDown') setSelected([Math.min(8, r + 1), c]);
        else if (e.key === 'ArrowLeft') setSelected([r, Math.max(0, c - 1)]);
        else if (e.key === 'ArrowRight') setSelected([r, Math.min(8, c + 1)]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enterNumber, selected, won]);

  const handleCheck = () => {
    const errors = new Set<string>();
    let filled = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] === 0 && board[r][c] !== 0) {
          filled++;
          if (board[r][c] !== solution[r][c]) {
            errors.add(`${r}-${c}`);
          }
        }
      }
    }
    setErrorCells(errors);
    if (errors.size > 0) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `${errors.size} chiffre${errors.size > 1 ? 's sont faux' : ' est faux'} et marqué${errors.size > 1 ? 's' : ''} en rouge.`,
      });
    } else if (filled === 0) {
      soundFX.click();
      setFeedback({
        type: 'info',
        message: 'La grille est encore vide : sélectionnez une case et placez un premier chiffre.',
      });
    } else {
      soundFX.place();
      setFeedback({
        type: 'success',
        message: 'Tous vos chiffres placés jusqu’ici sont justes ! Continuez ainsi.',
      });
    }
  };

  const handleHint = () => {
    if (won) return;

    // 1. Naked single in current board
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const candidates: number[] = [];
          for (let n = 1; n <= 9; n++) {
            if (isSafe(board, r, c, n)) candidates.push(n);
          }
          if (candidates.length === 1) {
            const val = candidates[0];
            const nextBoard = board.map((row) => [...row]);
            nextBoard[r][c] = val;
            setBoard(nextBoard);
            setSelected([r, c]);
            setHintCell(`${r}-${c}`);
            soundFX.hint();
            setFeedback({
              type: 'hint',
              message: `Règle d’élimination : en ligne ${r + 1}, colonne ${c + 1}, tous les autres chiffres sont déjà pris — seul le ${val} est possible.`,
            });
            checkVictory(nextBoard);
            return;
          }
        }
      }
    }

    // 2. Hidden single inside a 3x3 box
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        for (let n = 1; n <= 9; n++) {
          let alreadyInBox = false;
          const spots: [number, number][] = [];
          for (let dr = 0; dr < 3; dr++) {
            for (let dc = 0; dc < 3; dc++) {
              const r = br * 3 + dr;
              const c = bc * 3 + dc;
              if (board[r][c] === n) alreadyInBox = true;
              else if (board[r][c] === 0 && isSafe(board, r, c, n)) spots.push([r, c]);
            }
          }
          if (!alreadyInBox && spots.length === 1) {
            const [r, c] = spots[0];
            const nextBoard = board.map((row) => [...row]);
            nextBoard[r][c] = n;
            setBoard(nextBoard);
            setSelected([r, c]);
            setHintCell(`${r}-${c}`);
            soundFX.hint();
            setFeedback({
              type: 'hint',
              message: `Règle du bloc 3×3 : dans ce carré, seule la case ligne ${r + 1}, colonne ${c + 1} peut recevoir le chiffre ${n}.`,
            });
            checkVictory(nextBoard);
            return;
          }
        }
      }
    }

    // 3. Fallback: help on selected cell or first empty/wrong cell
    let target: [number, number] | null = null;
    if (selected && board[selected[0]][selected[1]] !== solution[selected[0]][selected[1]]) {
      target = selected;
    } else {
      for (let r = 0; r < 9 && !target; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== solution[r][c]) {
            target = [r, c];
            break;
          }
        }
      }
    }
    if (!target) return;

    const [tr, tc] = target;
    const correctVal = solution[tr][tc];
    const nextBoard = board.map((row) => [...row]);
    nextBoard[tr][tc] = correctVal;
    setBoard(nextBoard);
    setSelected([tr, tc]);
    setHintCell(`${tr}-${tc}`);
    const nextErr = new Set(errorCells);
    nextErr.delete(`${tr}-${tc}`);
    setErrorCells(nextErr);
    soundFX.hint();
    setFeedback({
      type: 'hint',
      message: `Coup de pouce : en ligne ${tr + 1}, colonne ${tc + 1}, le bon chiffre est ${correctVal}.`,
    });
    checkVictory(nextBoard);
  };

  const handleUndo = () => {
    if (history.length === 0 || won) return;
    soundFX.click();
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBoard(prev);
    setErrorCells(new Set());
    setFeedback(null);
  };

  // Count remaining occurrences of each digit
  const digitCounts = useMemo(() => {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] > 0 && board[r][c] === solution[r][c]) {
          counts[board[r][c]]++;
        }
      }
    }
    return counts;
  }, [board, solution]);

  const selectedValue = selected ? board[selected[0]][selected[1]] : 0;
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <GameLayout
      gameId="sudoku"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      onCheck={handleCheck}
      feedback={feedback}
      won={won}
      winSummary={`Grille résolue en ${formatTime(seconds)}.`}
      statsNode={
        <span className="font-mono tabular-nums text-sm font-semibold text-[#57534E] px-2">
          {formatTime(seconds)}
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* 9x9 Sudoku Grid */}
        <div className="w-full max-w-[460px] aspect-square border-2 border-[#1C1917] rounded-xl overflow-hidden bg-white select-none">
          <div className="grid grid-cols-9 grid-rows-9 w-full h-full">
            {board.map((row, r) =>
              row.map((val, c) => {
                const isFixed = puzzle[r][c] !== 0;
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isRelated =
                  selected &&
                  !isSelected &&
                  (selected[0] === r ||
                    selected[1] === c ||
                    (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                      Math.floor(selected[1] / 3) === Math.floor(c / 3)));
                const isSameNum = selectedValue !== 0 && val === selectedValue && !isSelected;
                const key = `${r}-${c}`;
                const isError = errorCells.has(key);
                const isHint = hintCell === key;

                const borderRight =
                  c === 2 || c === 5
                    ? 'border-r-2 border-r-[#1C1917]'
                    : c < 8
                    ? 'border-r border-r-[#E2DCD2]'
                    : '';
                const borderBottom =
                  r === 2 || r === 5
                    ? 'border-b-2 border-b-[#1C1917]'
                    : r < 8
                    ? 'border-b border-b-[#E2DCD2]'
                    : '';

                let bgClass = 'bg-white';
                if (isError) bgClass = 'bg-[#FEE2E2]';
                else if (isSelected) bgClass = 'bg-[#D1FAE5]';
                else if (isHint) bgClass = 'bg-[#FEF3C7]';
                else if (isSameNum) bgClass = 'bg-[#E6F4EE]';
                else if (isRelated) bgClass = 'bg-[#F7F5F0]';

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundFX.click();
                      setSelected([r, c]);
                    }}
                    className={`relative flex items-center justify-center font-mono tabular-nums transition-colors cursor-pointer ${borderRight} ${borderBottom} ${bgClass}`}
                    aria-label={`Ligne ${r + 1} Colonne ${c + 1}${val ? `, valeur ${val}` : ', vide'}`}
                  >
                    {val !== 0 ? (
                      <span
                        className={`text-xl sm:text-2xl ${
                          isError
                            ? 'text-[#DC2626] font-bold'
                            : isFixed
                            ? 'text-[#1C1917] font-bold'
                            : 'text-[#1E6B52] font-semibold'
                        }`}
                      >
                        {val}
                      </span>
                    ) : notes[r][c].size > 0 ? (
                      <div className="grid grid-cols-3 w-full h-full p-0.5 text-[10px] sm:text-[11px] leading-none text-[#78716C]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className="flex items-center justify-center">
                            {notes[r][c].has(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {isError && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 right-1 text-[10px] font-bold text-[#DC2626]"
                      >
                        ✗
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Keypad & Action Tools */}
        <div className="w-full max-w-[340px] flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                setNoteMode((v) => !v);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                noteMode
                  ? 'bg-[#1E6B52] border-[#1E6B52] text-white'
                  : 'bg-[#F7F5F0] border-[#E5E0D8] text-[#1C1917] hover:bg-[#EDE8DF]'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Notes {noteMode ? 'ON' : ''}</span>
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || won}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] hover:bg-[#EDE8DF] disabled:opacity-45 text-sm font-semibold text-[#1C1917] transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              type="button"
              onClick={() => enterNumber(0)}
              disabled={!selected || won}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] hover:bg-[#EDE8DF] disabled:opacity-45 text-sm font-semibold text-[#1C1917] transition-colors cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Effacer</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const completed = digitCounts[num] >= 9;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => enterNumber(num)}
                  disabled={won}
                  className={`h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    completed
                      ? 'bg-[#F4F1EA] border-[#E5E0D8] text-[#A8A29E]'
                      : 'bg-white border-[#D6D0C4] hover:border-[#1E6B52] hover:bg-[#F2FAF6] text-[#1C1917] shadow-2xs'
                  }`}
                >
                  <span className="font-mono text-2xl font-bold leading-none">{num}</span>
                  <span className="text-[11px] text-[#78716C] mt-1 tabular-nums">
                    {9 - digitCounts[num]} rest.
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Astuce : touchez une case puis un chiffre (ou utilisez votre clavier). Les erreurs sont signalées immédiatement avec une croix rouge.
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
