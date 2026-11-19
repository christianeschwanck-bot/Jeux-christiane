import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { FRENCH_WORD_THEMES } from '../utils/frenchWords';
import { soundFX } from '../utils/sound';

interface MotsMelesGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface PlacedWord {
  word: string;
  cells: [number, number][];
  directionLabel: string;
}

interface WordSearchPuzzle {
  size: number;
  themeLabel: string;
  grid: string[][];
  words: PlacedWord[];
}

const FRENCH_LETTER_POOL = 'EEEEEEEAAAAAIIIISSSSRRRRTTTTNNNNOOOOUUUULLLDDCCMMBPGVFQHJXZKWY';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDirectionLabel(dr: number, dc: number): string {
  if (dr === 0) return dc > 0 ? 'Horizontal (→)' : 'Horizontal inversé (←)';
  if (dc === 0) return dr > 0 ? 'Vertical (↓)' : 'Vertical inversé (↑)';
  return 'En diagonale';
}

function generateWordSearch(difficulty: Difficulty): WordSearchPuzzle {
  const config: Record<
    Difficulty,
    { size: number; count: number; dirs: [number, number][] }
  > = {
    facile: {
      size: 8,
      count: 6,
      dirs: [
        [0, 1],
        [1, 0],
      ],
    },
    moyen: {
      size: 11,
      count: 10,
      dirs: [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ],
    },
    difficile: {
      size: 14,
      count: 15,
      dirs: [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ],
    },
    expert: {
      size: 17,
      count: 20,
      dirs: [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ],
    },
  };

  const { size, count, dirs } = config[difficulty];
  const theme = FRENCH_WORD_THEMES[Math.floor(Math.random() * FRENCH_WORD_THEMES.length)];
  const candidatePool = shuffle(
    theme.words
      .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 4 && w.length <= size)
  );
  // Supplement from other themes if needed for Expert 18 words
  const extraPool = shuffle(
    FRENCH_WORD_THEMES.filter((t) => t.id !== theme.id)
      .flatMap((t) => t.words)
      .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 4 && w.length <= size && !candidatePool.includes(w))
  );
  const fullCandidates = [...candidatePool, ...extraPool];

  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords: PlacedWord[] = [];

  for (const word of fullCandidates) {
    if (placedWords.length >= count) break;
    let placed = false;

    const shuffledDirs = shuffle(dirs);
    for (let attempt = 0; attempt < 90 && !placed; attempt++) {
      const [dr, dc] = shuffledDirs[attempt % shuffledDirs.length];
      const r0 = Math.floor(Math.random() * size);
      const c0 = Math.floor(Math.random() * size);
      const rEnd = r0 + dr * (word.length - 1);
      const cEnd = c0 + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;

      let ok = true;
      const cells: [number, number][] = [];
      for (let i = 0; i < word.length; i++) {
        const rr = r0 + dr * i;
        const cc = c0 + dc * i;
        const existing = grid[rr][cc];
        if (existing !== '' && existing !== word[i]) {
          ok = false;
          break;
        }
        cells.push([rr, cc]);
      }

      if (ok) {
        cells.forEach(([rr, cc], idx) => {
          grid[rr][cc] = word[idx];
        });
        placedWords.push({
          word,
          cells,
          directionLabel: getDirectionLabel(dr, dc),
        });
        placed = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] =
          FRENCH_LETTER_POOL[Math.floor(Math.random() * FRENCH_LETTER_POOL.length)];
      }
    }
  }

  return { size, themeLabel: theme.label, grid, words: placedWords };
}

const FOUND_PALETTE = [
  'bg-[#D1FAE5] text-[#065F46]',
  'bg-[#DBEAFE] text-[#1E40AF]',
  'bg-[#FEF3C7] text-[#92400E]',
  'bg-[#FCE7F3] text-[#9D174D]',
  'bg-[#EDE9FE] text-[#5B21B6]',
  'bg-[#FFEDD5] text-[#9A3412]',
];

export const MotsMelesGame: React.FC<MotsMelesGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(() => generateWordSearch(difficulty), [difficulty, seed]);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [anchorCell, setAnchorCell] = useState<[number, number] | null>(null);
  const [dragEndCell, setDragEndCell] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hintTier, setHintTier] = useState<{ word: string; level: number } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setFoundWords([]);
    setAnchorCell(null);
    setDragEndCell(null);
    setIsDragging(false);
    setHintTier(null);
    setWrongFlash(new Set());
    setFeedback(null);
    setWon(false);
  }, [puzzle]);

  const getLineCells = useCallback(
    (start: [number, number], end: [number, number]): [number, number][] => {
      const dr = end[0] - start[0];
      const dc = end[1] - start[1];
      if (dr === 0 && dc === 0) return [start];
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const isStraight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
      if (!isStraight) return [];
      const sr = dr === 0 ? 0 : dr / Math.abs(dr);
      const sc = dc === 0 ? 0 : dc / Math.abs(dc);
      const cells: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        cells.push([start[0] + sr * i, start[1] + sc * i]);
      }
      return cells;
    },
    []
  );

  const previewCells = useMemo(() => {
    if (!anchorCell || !dragEndCell) return new Set<string>();
    return new Set(getLineCells(anchorCell, dragEndCell).map(([r, c]) => `${r}-${c}`));
  }, [anchorCell, dragEndCell, getLineCells]);

  const validateLine = useCallback(
    (start: [number, number], end: [number, number]) => {
      if (won) return;
      const line = getLineCells(start, end);
      if (line.length < 2) return;

      const selectedText = line.map(([r, c]) => puzzle.grid[r][c]).join('');
      const reversedText = selectedText.split('').reverse().join('');

      const match = puzzle.words.find(
        (pw) =>
          !foundWords.includes(pw.word) &&
          (pw.word === selectedText || pw.word === reversedText)
      );

      if (match) {
        const nextFound = [...foundWords, match.word];
        setFoundWords(nextFound);
        setAnchorCell(null);
        setDragEndCell(null);
        setHintTier(null);

        if (nextFound.length === puzzle.words.length) {
          setWon(true);
          soundFX.victory();
          setFeedback({
            type: 'success',
            message: `Tous les ${puzzle.words.length} mots ont été trouvés !`,
          });
          onWin('mots-meles');
        } else {
          soundFX.clear();
          setFeedback({
            type: 'success',
            message: `Mot trouvé : ${match.word} ! Encore ${puzzle.words.length - nextFound.length} à repérer.`,
          });
        }
      } else {
        soundFX.error();
        const flashKeys = new Set(line.map(([r, c]) => `${r}-${c}`));
        setWrongFlash(flashKeys);
        window.setTimeout(() => setWrongFlash(new Set()), 450);
        setFeedback({
          type: 'error',
          message: `« ${selectedText} » n’est pas dans la liste des mots à trouver.`,
        });
        setAnchorCell(null);
        setDragEndCell(null);
      }
    },
    [foundWords, getLineCells, onWin, puzzle.grid, puzzle.words, won]
  );

  const handleCellPointerDown = (r: number, c: number) => {
    if (won) return;
    // Two-tap mode support: if an anchor is already selected and user clicks a different cell without dragging
    if (anchorCell && !isDragging && (anchorCell[0] !== r || anchorCell[1] !== c)) {
      const line = getLineCells(anchorCell, [r, c]);
      if (line.length >= 2) {
        validateLine(anchorCell, [r, c]);
        return;
      }
    }
    soundFX.click();
    setAnchorCell([r, c]);
    setDragEndCell([r, c]);
    setIsDragging(true);
  };

  const handleCellPointerEnter = (r: number, c: number) => {
    if (!isDragging || !anchorCell) return;
    setDragEndCell([r, c]);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (anchorCell && dragEndCell && (anchorCell[0] !== dragEndCell[0] || anchorCell[1] !== dragEndCell[1])) {
      validateLine(anchorCell, dragEndCell);
    }
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  });

  // 4-Tier Progressive Hint System
  const handleHint = () => {
    if (won) return;
    const remaining = puzzle.words.filter((w) => !foundWords.includes(w.word));
    if (remaining.length === 0) return;

    const currentTarget =
      hintTier && remaining.some((w) => w.word === hintTier.word)
        ? remaining.find((w) => w.word === hintTier.word)!
        : remaining[0];

    const nextLevel =
      hintTier && hintTier.word === currentTarget.word ? Math.min(4, hintTier.level + 1) : 1;

    setHintTier({ word: currentTarget.word, level: nextLevel });
    const [r0, c0] = currentTarget.cells[0];

    if (nextLevel === 1) {
      soundFX.hint();
      setFeedback({
        type: 'hint',
        message: `Indice (1/4) : Cherchez le mot « ${currentTarget.word} » — orientation : ${currentTarget.directionLabel}.`,
      });
    } else if (nextLevel === 2) {
      soundFX.hint();
      const zone = r0 < puzzle.size / 2 ? 'haut' : 'bas';
      const side = c0 < puzzle.size / 2 ? 'gauche' : 'droite';
      setFeedback({
        type: 'hint',
        message: `Indice (2/4) : « ${currentTarget.word} » commence en colonne ${c0 + 1} (quart ${zone}-${side}).`,
      });
    } else if (nextLevel === 3) {
      soundFX.hint();
      setFeedback({
        type: 'hint',
        message: `Indice (3/4) : La première lettre « ${currentTarget.word[0]} » de « ${currentTarget.word} » est illuminée en doré.`,
      });
    } else {
      // Tier 4 reveals the word completely
      const nextFound = [...foundWords, currentTarget.word];
      setFoundWords(nextFound);
      setHintTier(null);
      if (nextFound.length === puzzle.words.length) {
        setWon(true);
        soundFX.victory();
        onWin('mots-meles');
      } else {
        soundFX.clear();
      }
      setFeedback({
        type: 'hint',
        message: `Indice (4/4) : Le mot « ${currentTarget.word} » a été entouré pour vous !`,
      });
    }
  };

  // Build map of cell -> found palette class
  const cellFoundClass = useMemo(() => {
    const map = new Map<string, string>();
    puzzle.words.forEach((pw, idx) => {
      if (foundWords.includes(pw.word)) {
        const cls = FOUND_PALETTE[idx % FOUND_PALETTE.length];
        pw.cells.forEach(([r, c]) => {
          map.set(`${r}-${c}`, cls);
        });
      }
    });
    return map;
  }, [foundWords, puzzle.words]);

  const hintFirstCellKey = useMemo(() => {
    if (!hintTier || hintTier.level < 3) return null;
    const target = puzzle.words.find((w) => w.word === hintTier.word);
    if (!target) return null;
    return `${target.cells[0][0]}-${target.cells[0][1]}`;
  }, [hintTier, puzzle.words]);

  return (
    <GameLayout
      gameId="mots-meles"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      hintLabel="Indice progressif"
      feedback={feedback}
      won={won}
      winSummary={`Thème « ${puzzle.themeLabel} » complété (${puzzle.words.length} mots).`}
      statsNode={
        <span className="text-sm font-semibold text-[#1E6B52] tabular-nums px-2">
          {foundWords.length} / {puzzle.words.length} mots
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
        {/* Letter Grid */}
        <div className="w-full flex flex-col items-center">
          <div className="mb-3 text-sm text-[#57534E] font-medium">
            Thème du jour : <span className="font-semibold text-[#1C1917]">{puzzle.themeLabel}</span>
          </div>
          <div
            className="grid gap-1 p-2 sm:p-3 bg-[#F7F5F0] border border-[#E5E0D8] rounded-2xl select-none touch-none"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
              width: 'min(100%, 540px)',
            }}
          >
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => {
                const key = `${r}-${c}`;
                const isSelectedPreview =
                  previewCells.has(key) ||
                  (anchorCell?.[0] === r && anchorCell?.[1] === c);
                const isWrong = wrongFlash.has(key);
                const isHintStart = hintFirstCellKey === key;
                const foundCls = cellFoundClass.get(key);

                let cellStyle = 'bg-white text-[#1C1917] hover:bg-[#EDE8DF]';
                if (isWrong) {
                  cellStyle = 'bg-[#FEE2E2] text-[#DC2626] ring-2 ring-[#DC2626] animate-shake';
                } else if (isSelectedPreview) {
                  cellStyle = 'bg-[#1E6B52] text-white scale-105 shadow-xs';
                } else if (isHintStart) {
                  cellStyle = 'bg-[#FDE68A] text-[#92400E] ring-2 ring-[#D97706]';
                } else if (foundCls) {
                  cellStyle = `${foundCls} font-bold`;
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onPointerDown={() => handleCellPointerDown(r, c)}
                    onPointerEnter={() => handleCellPointerEnter(r, c)}
                    className={`aspect-square rounded-lg flex items-center justify-center font-bold transition-transform cursor-pointer ${
                      puzzle.size >= 15
                        ? 'text-xs sm:text-sm'
                        : puzzle.size >= 13
                        ? 'text-sm sm:text-base'
                        : 'text-base sm:text-lg'
                    } ${cellStyle}`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
          <p className="mt-3 text-xs text-[#78716C] text-center">
            Glissez sur un mot, ou touchez sa première lettre puis sa dernière lettre.
          </p>
        </div>

        {/* Word List */}
        <div className="w-full lg:w-72 shrink-0 bg-[#F7F5F0] border border-[#E5E0D8] rounded-2xl p-4">
          <h2 className="font-semibold text-sm text-[#1C1917] mb-3">
            Mots à retrouver ({puzzle.words.length - foundWords.length} restants)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {puzzle.words.map((pw) => {
              const found = foundWords.includes(pw.word);
              const isHinted = hintTier?.word === pw.word;
              return (
                <div
                  key={pw.word}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-between transition-colors ${
                    found
                      ? 'bg-[#ECFDF5] text-[#065F46] line-through opacity-70'
                      : isHinted
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40'
                      : 'bg-white text-[#1C1917] border border-[#E5E0D8]'
                  }`}
                >
                  <span>{pw.word}</span>
                  {found && <span aria-hidden="true">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};
