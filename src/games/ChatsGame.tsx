import React, { useEffect, useMemo, useState } from 'react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface ChatsGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface CatPuzzle {
  size: number;
  regions: number[][];
  solution: [number, number][]; // [r, c]
  starterCats: [number, number][];
}

const REGION_COLORS = [
  { bg: 'bg-[#FEE2E2]', name: 'Rouge corail' },
  { bg: 'bg-[#DBEAFE]', name: 'Bleu ciel' },
  { bg: 'bg-[#DCFCE7]', name: 'Vert tendre' },
  { bg: 'bg-[#FEF3C7]', name: 'Jaune miel' },
  { bg: 'bg-[#EDE9FE]', name: 'Lavande' },
  { bg: 'bg-[#FFEDD5]', name: 'Pêche' },
  { bg: 'bg-[#CCFBF1]', name: 'Menthe' },
  { bg: 'bg-[#FCE7F3]', name: 'Rose doux' },
  { bg: 'bg-[#E0E7FF]', name: 'Pervenche' },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateValidCatPositions(size: number): number[] {
  const cols: number[] = Array(size).fill(-1);
  const usedCols = new Set<number>();

  function backtrack(row: number): boolean {
    if (row === size) return true;
    const candidates = shuffle(Array.from({ length: size }, (_, i) => i));
    for (const c of candidates) {
      if (usedCols.has(c)) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      cols[row] = c;
      usedCols.add(c);
      if (backtrack(row + 1)) return true;
      usedCols.delete(c);
      cols[row] = -1;
    }
    return false;
  }

  backtrack(0);
  return cols;
}

// Human Logic Solver: checks whether the board is 100% solvable step-by-step WITHOUT guessing!
// Returns { solved, maxRuleLevel } where maxRuleLevel reflects difficulty of logical steps required.
function solveByHumanLogic(
  size: number,
  regions: number[][],
  starterCats: [number, number][] = []
): { solved: boolean; maxRuleLevel: number } {
  // possible[r][c] = true if cell can still hold a cat; catAt[r][c] = true if cat placed
  const possible: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(true)
  );
  const catAt: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  let placedCount = 0;
  let maxRuleLevel = 1;

  const placeCat = (r: number, c: number) => {
    if (catAt[r][c]) return;
    catAt[r][c] = true;
    placedCount++;
    const reg = regions[r][c];
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (rr === r && cc === c) continue;
        if (
          rr === r ||
          cc === c ||
          regions[rr][cc] === reg ||
          (Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1)
        ) {
          possible[rr][cc] = false;
        }
      }
    }
  };

  starterCats.forEach(([r, c]) => placeCat(r, c));

  let changed = true;
  while (changed && placedCount < size) {
    changed = false;

    // Rule 1: Any row, column, or region with exactly 1 possible unplaced cell -> place cat!
    for (let r = 0; r < size; r++) {
      if (catAt[r].some(Boolean)) continue;
      const cands: [number, number][] = [];
      for (let c = 0; c < size; c++) if (possible[r][c]) cands.push([r, c]);
      if (cands.length === 0) return { solved: false, maxRuleLevel };
      if (cands.length === 1) {
        placeCat(cands[0][0], cands[0][1]);
        changed = true;
      }
    }
    for (let c = 0; c < size; c++) {
      if (catAt.some((row) => row[c])) continue;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) if (possible[r][c]) cands.push([r, c]);
      if (cands.length === 0) return { solved: false, maxRuleLevel };
      if (cands.length === 1) {
        placeCat(cands[0][0], cands[0][1]);
        changed = true;
      }
    }
    for (let reg = 0; reg < size; reg++) {
      let hasCat = false;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (catAt[r][c]) hasCat = true;
            else if (possible[r][c]) cands.push([r, c]);
          }
        }
      }
      if (hasCat) continue;
      if (cands.length === 0) return { solved: false, maxRuleLevel };
      if (cands.length === 1) {
        placeCat(cands[0][0], cands[0][1]);
        changed = true;
      }
    }
    if (changed) continue;

    // Rule 2 (Pointing): If all candidates in a region lie in 1 row (or 1 col), eliminate other cells in that row (or col)
    for (let reg = 0; reg < size; reg++) {
      let hasCat = false;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (catAt[r][c]) hasCat = true;
            else if (possible[r][c]) cands.push([r, c]);
          }
        }
      }
      if (hasCat || cands.length === 0) continue;
      const rows = new Set(cands.map(([r]) => r));
      if (rows.size === 1) {
        const onlyR = cands[0][0];
        for (let c = 0; c < size; c++) {
          if (regions[onlyR][c] !== reg && possible[onlyR][c]) {
            possible[onlyR][c] = false;
            changed = true;
            maxRuleLevel = Math.max(maxRuleLevel, 2);
          }
        }
      }
      const cols = new Set(cands.map(([, c]) => c));
      if (cols.size === 1) {
        const onlyC = cands[0][1];
        for (let r = 0; r < size; r++) {
          if (regions[r][onlyC] !== reg && possible[r][onlyC]) {
            possible[r][onlyC] = false;
            changed = true;
            maxRuleLevel = Math.max(maxRuleLevel, 2);
          }
        }
      }
    }

    // Rule 3: If all candidates in a row (or col) belong to 1 region, eliminate rest of that region
    for (let r = 0; r < size; r++) {
      if (catAt[r].some(Boolean)) continue;
      const cands: [number, number][] = [];
      for (let c = 0; c < size; c++) if (possible[r][c]) cands.push([r, c]);
      const regs = new Set(cands.map(([rr, cc]) => regions[rr][cc]));
      if (regs.size === 1 && cands.length > 0) {
        const onlyReg = regions[cands[0][0]][cands[0][1]];
        for (let rr = 0; rr < size; rr++) {
          for (let cc = 0; cc < size; cc++) {
            if (rr !== r && regions[rr][cc] === onlyReg && possible[rr][cc]) {
              possible[rr][cc] = false;
              changed = true;
              maxRuleLevel = Math.max(maxRuleLevel, 2);
            }
          }
        }
      }
    }
    for (let c = 0; c < size; c++) {
      if (catAt.some((row) => row[c])) continue;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) if (possible[r][c]) cands.push([r, c]);
      const regs = new Set(cands.map(([rr, cc]) => regions[rr][cc]));
      if (regs.size === 1 && cands.length > 0) {
        const onlyReg = regions[cands[0][0]][cands[0][1]];
        for (let rr = 0; rr < size; rr++) {
          for (let cc = 0; cc < size; cc++) {
            if (cc !== c && regions[rr][cc] === onlyReg && possible[rr][cc]) {
              possible[rr][cc] = false;
              changed = true;
              maxRuleLevel = Math.max(maxRuleLevel, 2);
            }
          }
        }
      }
    }
    if (changed) continue;

    // Rule 4: Common neighbor elimination (if every candidate in a group touches some external cell (rr,cc), eliminate (rr,cc))
    const groups: [number, number][][] = [];
    for (let reg = 0; reg < size; reg++) {
      const cands: [number, number][] = [];
      let hasCat = false;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (catAt[r][c]) hasCat = true;
            else if (possible[r][c]) cands.push([r, c]);
          }
        }
      }
      if (!hasCat && cands.length >= 2 && cands.length <= 4) groups.push(cands);
    }
    for (const cands of groups) {
      for (let rr = 0; rr < size; rr++) {
        for (let cc = 0; cc < size; cc++) {
          if (!possible[rr][cc]) continue;
          if (cands.some(([cr, cc2]) => cr === rr && cc2 === cc)) continue;
          const touchesAll = cands.every(
            ([cr, cc2]) => Math.abs(cr - rr) <= 1 && Math.abs(cc2 - cc) <= 1
          );
          if (touchesAll) {
            possible[rr][cc] = false;
            changed = true;
            maxRuleLevel = Math.max(maxRuleLevel, 3);
          }
        }
      }
    }
  }

  return { solved: placedCount === size, maxRuleLevel };
}

function generateCatPuzzle(difficulty: Difficulty): CatPuzzle {
  const sizeMap: Record<Difficulty, number> = {
    facile: 6,
    moyen: 7,
    difficile: 8,
    expert: 9,
  };
  const size = sizeMap[difficulty];

  for (let attempt = 0; attempt < 450; attempt++) {
    const catCols = generateValidCatPositions(size);
    const regions: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
    const frontiers: [number, number][][] = Array.from({ length: size }, () => []);

    catCols.forEach((c, r) => {
      regions[r][c] = r;
      frontiers[r].push([r, c]);
    });

    let remaining = size * size - size;
    while (remaining > 0) {
      const regOrder = shuffle(Array.from({ length: size }, (_, i) => i));
      let grew = false;
      for (const reg of regOrder) {
        const candidates: [number, number][] = [];
        for (const [r, c] of frontiers[reg]) {
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
              candidates.push([nr, nc]);
            }
          }
        }
        if (candidates.length > 0) {
          const [nr, nc] = candidates[Math.floor(Math.random() * candidates.length)];
          regions[nr][nc] = reg;
          frontiers[reg].push([nr, nc]);
          remaining--;
          grew = true;
          if (remaining === 0) break;
        }
      }
      if (!grew) break;
    }

    if (remaining === 0) {
      const solution: [number, number][] = catCols.map((c, r) => [r, c]);
      const starterCats: [number, number][] =
        difficulty === 'facile' ? [solution[Math.floor(Math.random() * size)]] : [];

      const res = solveByHumanLogic(size, regions, starterCats);
      if (res.solved) {
        // On Difficile/Expert, prefer puzzles that actually exercise Rule 2+ when possible
        if (
          (difficulty === 'difficile' || difficulty === 'expert') &&
          res.maxRuleLevel < 2 &&
          attempt < 280
        ) {
          continue;
        }
        return { size, regions, solution, starterCats };
      }
    }
  }

  // Fallback with 1 guaranteed solvable region structure
  const fallbackCols = generateValidCatPositions(size);
  const fallbackRegions = Array.from({ length: size }, (_, r) => Array(size).fill(r));
  return {
    size,
    regions: fallbackRegions,
    solution: fallbackCols.map((c, r) => [r, c]),
    starterCats: difficulty === 'facile' ? [[0, fallbackCols[0]]] : [],
  };
}

type CellMark = 'empty' | 'cross' | 'cat';

const CatSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <polygon points="10,20 12,7 21,15" fill="#EA580C" />
    <polygon points="38,20 36,7 27,15" fill="#EA580C" />
    <circle cx="24" cy="27" r="14" fill="#F97316" />
    <circle cx="19" cy="25" r="2.2" fill="#1C1917" />
    <circle cx="29" cy="25" r="2.2" fill="#1C1917" />
    <polygon points="22,30 26,30 24,33" fill="#FEF3C7" />
    <path d="M19 35 Q24 38 29 35" stroke="#7C2D12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </svg>
);

interface ActiveHint {
  cells: Set<string>;
  actionType: 'cat' | 'cross';
  targetCells: [number, number][];
  explanation: string;
}

export const ChatsGame: React.FC<ChatsGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(() => generateCatPuzzle(difficulty), [difficulty, seed]);

  const [grid, setGrid] = useState<CellMark[][]>([]);
  const [toolMode, setToolMode] = useState<'cycle' | 'cat' | 'cross'>('cycle');
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const initial: CellMark[][] = Array.from({ length: puzzle.size }, () =>
      Array<CellMark>(puzzle.size).fill('empty')
    );
    puzzle.starterCats.forEach(([r, c]) => {
      initial[r][c] = 'cat';
    });
    setGrid(initial);
    setWrongCells(new Set());
    setActiveHint(null);
    setFeedback(null);
    setWon(false);
  }, [puzzle]);

  const evaluateRuleConflicts = (nextGrid: CellMark[][]): {
    conflictCells: Set<string>;
    message: string | null;
    catCount: number;
  } => {
    const cats: [number, number][] = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (nextGrid[r]?.[c] === 'cat') cats.push([r, c]);
      }
    }

    const conflicts = new Set<string>();
    const messages: string[] = [];

    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const [r1, c1] = cats[i];
        const [r2, c2] = cats[j];
        if (r1 === r2) {
          conflicts.add(`${r1}-${c1}`);
          conflicts.add(`${r2}-${c2}`);
          messages.push(`2 chats sont sur la même ligne ${r1 + 1}`);
        }
        if (c1 === c2) {
          conflicts.add(`${r1}-${c1}`);
          conflicts.add(`${r2}-${c2}`);
          messages.push(`2 chats sont dans la même colonne ${c1 + 1}`);
        }
        if (puzzle.regions[r1][c1] === puzzle.regions[r2][c2]) {
          conflicts.add(`${r1}-${c1}`);
          conflicts.add(`${r2}-${c2}`);
          messages.push(
            `2 chats sont dans la même couleur (${REGION_COLORS[puzzle.regions[r1][c1]].name})`
          );
        }
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2)) {
          conflicts.add(`${r1}-${c1}`);
          conflicts.add(`${r2}-${c2}`);
          messages.push('2 chats se touchent côte à côte ou en diagonale');
        }
      }
    }

    return {
      conflictCells: conflicts,
      message: messages[0] ?? null,
      catCount: cats.length,
    };
  };

  const handleCellClick = (r: number, c: number) => {
    if (won) return;
    if (puzzle.starterCats.some(([sr, sc]) => sr === r && sc === c)) return;

    const current = grid[r][c];
    let nextMark: CellMark = 'empty';
    if (toolMode === 'cycle') {
      nextMark = current === 'empty' ? 'cross' : current === 'cross' ? 'cat' : 'empty';
    } else if (toolMode === 'cat') {
      nextMark = current === 'cat' ? 'empty' : 'cat';
    } else {
      nextMark = current === 'cross' ? 'empty' : 'cross';
    }

    const nextGrid = grid.map((row) => [...row]);
    nextGrid[r][c] = nextMark;
    setGrid(nextGrid);
    setActiveHint(null);

    const { conflictCells, message, catCount } = evaluateRuleConflicts(nextGrid);
    setWrongCells(conflictCells);

    if (message) {
      soundFX.error();
      setFeedback({ type: 'error', message: `Attention : ${message}.` });
      return;
    }

    if (catCount === puzzle.size && conflictCells.size === 0) {
      setWon(true);
      soundFX.victory();
      setFeedback({
        type: 'success',
        message: `Bravo ! Les ${puzzle.size} chats ont trouvé leur place unique !`,
      });
      onWin('chats');
    } else {
      soundFX.click();
      setFeedback(null);
    }
  };

  const handleCheck = () => {
    const { conflictCells, message } = evaluateRuleConflicts(grid);
    if (message) {
      setWrongCells(conflictCells);
      soundFX.error();
      setFeedback({ type: 'error', message: `Erreur détectée : ${message}.` });
      return;
    }

    const solSet = new Set(puzzle.solution.map(([r, c]) => `${r}-${c}`));
    const misplaced = new Set<string>();
    let placedCount = 0;

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (grid[r][c] === 'cat') {
          placedCount++;
          if (!solSet.has(`${r}-${c}`)) misplaced.add(`${r}-${c}`);
        } else if (grid[r][c] === 'cross' && solSet.has(`${r}-${c}`)) {
          misplaced.add(`${r}-${c}`);
        }
      }
    }

    setWrongCells(misplaced);
    if (misplaced.size > 0) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `${misplaced.size} case${misplaced.size > 1 ? 's' : ''} contredi${
          misplaced.size > 1 ? 'sent' : 't'
        } la solution unique (signalée${misplaced.size > 1 ? 's' : ''} en rouge, rien n’a été effacé).`,
      });
    } else if (placedCount === 0) {
      soundFX.click();
      setFeedback({
        type: 'info',
        message: 'Aucune erreur ! Continuez à poser vos croix (×) et vos chats.',
      });
    } else {
      soundFX.place();
      setFeedback({
        type: 'success',
        message: 'Toutes vos marques actuelles (chats et croix) sont justes !',
      });
    }
  };

  // Find a genuine human-deducible logical step on the CURRENT board without erasing user marks!
  const findNextLogicalHint = (): ActiveHint | null => {
    const size = puzzle.size;
    // Build candidate availability respecting placed cats AND user crosses (only if valid, otherwise rule-based on placed cats)
    const solSet = new Set(puzzle.solution.map(([r, c]) => `${r}-${c}`));

    // First check if user has placed a wrong cat or crossed out a true cat cell
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 'cat' && !solSet.has(`${r}-${c}`)) {
          return {
            cells: new Set([`${r}-${c}`]),
            actionType: 'cross',
            targetCells: [],
            explanation: `Vérification : le chat en ligne ${r + 1}, colonne ${c + 1} ne peut pas mener à la solution unique (il bloque une autre zone).`,
          };
        }
        if (grid[r][c] === 'cross' && solSet.has(`${r}-${c}`)) {
          return {
            cells: new Set([`${r}-${c}`]),
            actionType: 'cat',
            targetCells: [],
            explanation: `Vérification : attention, vous avez barré (×) la case en ligne ${r + 1}, colonne ${c + 1}, mais la solution unique y passe !`,
          };
        }
      }
    }

    // Build remaining candidate cells from placed cats + valid user crosses
    const catAt: boolean[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (__, c) => grid[r][c] === 'cat')
    );
    const available: boolean[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (__, c) => {
        if (grid[r][c] === 'cross' || grid[r][c] === 'cat') return false;
        // Eliminated by an already placed cat?
        for (let rr = 0; rr < size; rr++) {
          for (let cc = 0; cc < size; cc++) {
            if (catAt[rr][cc]) {
              if (
                rr === r ||
                cc === c ||
                puzzle.regions[rr][cc] === puzzle.regions[r][c] ||
                (Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1)
              ) {
                return false;
              }
            }
          }
        }
        return true;
      })
    );

    // Deduction 1: A region has only 1 available cell left
    for (let reg = 0; reg < size; reg++) {
      let hasCat = false;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (puzzle.regions[r][c] === reg) {
            if (catAt[r][c]) hasCat = true;
            else if (available[r][c]) cands.push([r, c]);
          }
        }
      }
      if (!hasCat && cands.length === 1) {
        const [tr, tc] = cands[0];
        return {
          cells: new Set([`${tr}-${tc}`]),
          actionType: 'cat',
          targetCells: [[tr, tc]],
          explanation: `Règle : dans la zone ${REGION_COLORS[reg].name}, il ne reste qu’une seule case libre (ligne ${tr + 1}, colonne ${tc + 1}) ! Un chat s’y place forcément.`,
        };
      }
    }

    // Deduction 2: A row or column has only 1 available cell left
    for (let r = 0; r < size; r++) {
      if (catAt[r].some(Boolean)) continue;
      const cands: [number, number][] = [];
      for (let c = 0; c < size; c++) if (available[r][c]) cands.push([r, c]);
      if (cands.length === 1) {
        const [tr, tc] = cands[0];
        return {
          cells: new Set([`${tr}-${tc}`]),
          actionType: 'cat',
          targetCells: [[tr, tc]],
          explanation: `Règle : sur la ligne ${tr + 1}, seule la colonne ${tc + 1} est encore libre ! Un chat s’y trouve obligatoirement.`,
        };
      }
    }
    for (let c = 0; c < size; c++) {
      if (catAt.some((row) => row[c])) continue;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) if (available[r][c]) cands.push([r, c]);
      if (cands.length === 1) {
        const [tr, tc] = cands[0];
        return {
          cells: new Set([`${tr}-${tc}`]),
          actionType: 'cat',
          targetCells: [[tr, tc]],
          explanation: `Règle : dans la colonne ${tc + 1}, seule la ligne ${tr + 1} est libre ! C’est l’unique place pour son chat.`,
        };
      }
    }

    // Deduction 3 (Pointing Region -> Row/Col): All remaining spots of a region share the same row or column -> cross out rest of that row/col
    for (let reg = 0; reg < size; reg++) {
      let hasCat = false;
      const cands: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (puzzle.regions[r][c] === reg) {
            if (catAt[r][c]) hasCat = true;
            else if (available[r][c]) cands.push([r, c]);
          }
        }
      }
      if (hasCat || cands.length === 0) continue;
      const rows = new Set(cands.map(([r]) => r));
      if (rows.size === 1) {
        const onlyR = cands[0][0];
        const toCross: [number, number][] = [];
        for (let c = 0; c < size; c++) {
          if (puzzle.regions[onlyR][c] !== reg && available[onlyR][c]) {
            toCross.push([onlyR, c]);
          }
        }
        if (toCross.length > 0) {
          return {
            cells: new Set(toCross.map(([r, c]) => `${r}-${c}`)),
            actionType: 'cross',
            targetCells: toCross,
            explanation: `Règle d’alignement : toutes les cases possibles de la zone ${REGION_COLORS[reg].name} sont sur la ligne ${onlyR + 1}. Le chat de cette ligne est donc dedans : vous pouvez barrer (×) les autres cases dorées de la ligne ${onlyR + 1} !`,
          };
        }
      }
      const cols = new Set(cands.map(([, c]) => c));
      if (cols.size === 1) {
        const onlyC = cands[0][1];
        const toCross: [number, number][] = [];
        for (let r = 0; r < size; r++) {
          if (puzzle.regions[r][onlyC] !== reg && available[r][onlyC]) {
            toCross.push([r, onlyC]);
          }
        }
        if (toCross.length > 0) {
          return {
            cells: new Set(toCross.map(([r, c]) => `${r}-${c}`)),
            actionType: 'cross',
            targetCells: toCross,
            explanation: `Règle d’alignement : toutes les cases possibles de la zone ${REGION_COLORS[reg].name} sont dans la colonne ${onlyC + 1}. Vous pouvez donc barrer (×) les autres cases dorées de cette colonne !`,
          };
        }
      }
    }

    // Deduction 4: Useful cross around an already placed cat that the user hasn't crossed yet
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 'cat') {
          const toCross: [number, number][] = [];
          for (let rr = 0; rr < size; rr++) {
            for (let cc = 0; cc < size; cc++) {
              if (rr === r && cc === c) continue;
              if (grid[rr][cc] === 'empty' && !available[rr][cc]) {
                toCross.push([rr, cc]);
              }
            }
          }
          if (toCross.length > 0) {
            return {
              cells: new Set(toCross.map(([rr, cc]) => `${rr}-${cc}`)),
              actionType: 'cross',
              targetCells: toCross,
              explanation: `Règle de base : le chat en ligne ${r + 1}, colonne ${c + 1} interdit toute sa ligne, sa colonne, sa couleur et ses 8 cases voisines. Posez des croix (×) sur ces cases dorées !`,
            };
          }
        }
      }
    }

    // Fallback: point to one unplaced true cat without erasing anything else
    const missing = puzzle.solution.find(([r, c]) => grid[r][c] !== 'cat');
    if (!missing) return null;
    const [hr, hc] = missing;
    return {
      cells: new Set([`${hr}-${hc}`]),
      actionType: 'cat',
      targetCells: [[hr, hc]],
      explanation: `Coup de pouce : la case en ligne ${hr + 1}, colonne ${hc + 1} (zone ${REGION_COLORS[puzzle.regions[hr][hc]].name}) accueille un chat dans la solution unique.`,
    };
  };

  const handleHint = () => {
    if (won) return;

    // Second click while hint is active -> apply ONLY that deduced step (never erases user marks!)
    if (activeHint && activeHint.targetCells.length > 0) {
      const nextGrid = grid.map((row) => [...row]);
      activeHint.targetCells.forEach(([r, c]) => {
        nextGrid[r][c] = activeHint.actionType;
      });
      setGrid(nextGrid);
      setActiveHint(null);
      setWrongCells(new Set());

      const { conflictCells, catCount } = evaluateRuleConflicts(nextGrid);
      if (catCount === puzzle.size && conflictCells.size === 0) {
        setWon(true);
        soundFX.victory();
        setFeedback({
          type: 'success',
          message: `Dernier chat posé ! Grille réussie !`,
        });
        onWin('chats');
      } else {
        soundFX.place();
        setFeedback({
          type: 'success',
          message: 'Déduction appliquée sans toucher au reste de votre grille !',
        });
      }
      return;
    }

    const hint = findNextLogicalHint();
    if (!hint) return;

    setActiveHint(hint);
    if (hint.targetCells.length === 0) {
      setWrongCells(hint.cells);
      soundFX.error();
      setFeedback({ type: 'error', message: hint.explanation });
    } else {
      soundFX.hint();
      setFeedback({
        type: 'hint',
        message: `${hint.explanation} (Appuyez encore sur « Indice » pour l’appliquer directement)`,
      });
    }
  };

  const placedCats = grid.flat().filter((m) => m === 'cat').length;

  return (
    <GameLayout
      gameId="chats"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      hintLabel={activeHint && activeHint.targetCells.length > 0 ? 'Appliquer l’indice' : 'Indice logique'}
      onCheck={handleCheck}
      feedback={feedback}
      won={won}
      winSummary={`Les ${puzzle.size} chats ont trouvé leur emplacement unique !`}
      statsNode={
        <span className="text-sm font-semibold text-[#1E6B52] tabular-nums px-2">
          {placedCats} / {puzzle.size} chats ({puzzle.size}×{puzzle.size})
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Colored Regions Board */}
        <div
          className="grid border-2 border-[#1C1917] rounded-xl overflow-hidden w-full max-w-[490px] aspect-square select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((mark, c) => {
              const reg = puzzle.regions[r][c];
              const regColor = REGION_COLORS[reg % REGION_COLORS.length].bg;
              const isStarter = puzzle.starterCats.some(([sr, sc]) => sr === r && sc === c);
              const key = `${r}-${c}`;
              const isError = wrongCells.has(key);
              const isHintTarget = activeHint?.cells.has(key);

              const topDiff = r > 0 && puzzle.regions[r - 1][c] !== reg;
              const bottomDiff = r < puzzle.size - 1 && puzzle.regions[r + 1][c] !== reg;
              const leftDiff = c > 0 && puzzle.regions[r][c - 1] !== reg;
              const rightDiff = c < puzzle.size - 1 && puzzle.regions[r][c + 1] !== reg;

              const borderClasses = [
                topDiff ? 'border-t-2 border-t-[#1C1917]' : 'border-t border-t-black/15',
                bottomDiff ? 'border-b-2 border-b-[#1C1917]' : 'border-b border-b-black/15',
                leftDiff ? 'border-l-2 border-l-[#1C1917]' : 'border-l border-l-black/15',
                rightDiff ? 'border-r-2 border-r-[#1C1917]' : 'border-r border-r-black/15',
              ].join(' ');

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isError
                      ? 'bg-[#FECACA] ring-2 ring-inset ring-[#DC2626]'
                      : isHintTarget
                      ? 'bg-[#FEF08A] ring-3 ring-inset ring-[#D97706]'
                      : regColor
                  } ${borderClasses} hover:brightness-95`}
                  aria-label={`Case ligne ${r + 1} colonne ${c + 1}`}
                >
                  {mark === 'cat' && (
                    <CatSvg
                      className={`${
                        puzzle.size >= 8 ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
                      } animate-pop ${isStarter ? 'opacity-90' : ''}`}
                    />
                  )}
                  {mark === 'cross' && (
                    <span className="text-base sm:text-xl font-bold text-[#44403C]/70">×</span>
                  )}
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

        {/* Mode Controls & Rules Reminder */}
        <div className="w-full max-w-[330px] flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-3">Mode de clic</h2>
            <div className="flex flex-col gap-2">
              {[
                { id: 'cycle' as const, label: 'Auto : 1 clic = × · 2 clics = Chat' },
                { id: 'cat' as const, label: 'Poser / retirer un Chat' },
                { id: 'cross' as const, label: 'Poser / retirer une Croix (×)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundFX.click();
                    setToolMode(opt.id);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-colors cursor-pointer ${
                    toolMode === opt.id
                      ? 'bg-[#1E6B52] text-white font-semibold'
                      : 'bg-white border border-[#E5E0D8] text-[#1C1917] hover:bg-[#EDE8DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8] text-xs sm:text-sm text-[#44403C] space-y-2">
            <p className="font-semibold text-[#1C1917]">Comment résoudre sans deviner :</p>
            <p>• 1 chat par ligne, 1 par colonne, 1 par couleur.</p>
            <p>• Jamais 2 chats qui se touchent (même en diagonale).</p>
            <p>• Cherchez les zones ou lignes avec peu de cases : si une couleur n’est que sur une ligne, barrez le reste de la ligne !</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};
