import React, { useEffect, useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { CODEWORD_DICTIONARY } from '../utils/frenchWords';
import { soundFX } from '../utils/sound';

interface MotsCodesGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface CodewordPuzzle {
  size: number;
  solutionGrid: (string | null)[][];
  numberGrid: (number | null)[][];
  codeToLetter: Record<number, string>;
  starterCodes: number[];
  usedCodes: number[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateCodewordPuzzle(difficulty: Difficulty): CodewordPuzzle {
  const settings: Record<Difficulty, { size: number; targetWords: number; starters: number }> = {
    facile: { size: 9, targetWords: 9, starters: 5 },
    moyen: { size: 11, targetWords: 14, starters: 3 },
    difficile: { size: 12, targetWords: 17, starters: 2 },
    expert: { size: 13, targetWords: 22, starters: 1 },
  };
  const { size, targetWords, starters } = settings[difficulty];

  let bestGrid: (string | null)[][] = [];
  let bestCount = 0;

  // Run several fast randomized crossword builds and pick the richest interlocking grid
  for (let trial = 0; trial < 8; trial++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array(size).fill(null)
    );
    const words = shuffle(CODEWORD_DICTIONARY.filter((w) => w.length <= size - 1));
    const placed: string[] = [];

    const first = words[0];
    const startR = Math.floor(size / 2);
    const startC = Math.floor((size - first.length) / 2);
    for (let i = 0; i < first.length; i++) {
      grid[startR][startC + i] = first[i];
    }
    placed.push(first);

    const canPlace = (word: string, r: number, c: number, dr: number, dc: number): number => {
      if (r < 0 || c < 0) return -1;
      const rEnd = r + dr * (word.length - 1);
      const cEnd = c + dc * (word.length - 1);
      if (rEnd >= size || cEnd >= size) return -1;

      // Cell before and after word must be empty or edge
      const rBefore = r - dr;
      const cBefore = c - dc;
      if (rBefore >= 0 && cBefore >= 0 && grid[rBefore][cBefore] !== null) return -1;
      const rAfter = rEnd + dr;
      const cAfter = cEnd + dc;
      if (rAfter < size && cAfter < size && grid[rAfter][cAfter] !== null) return -1;

      let intersections = 0;
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        const existing = grid[rr][cc];
        if (existing !== null) {
          if (existing !== word[i]) return -1;
          intersections++;
        } else {
          // Check perpendicular neighbors so we don't accidentally fuse invalid adjacent letters
          if (dr === 0) {
            if (rr > 0 && grid[rr - 1][cc] !== null) return -1;
            if (rr < size - 1 && grid[rr + 1][cc] !== null) return -1;
          } else {
            if (cc > 0 && grid[rr][cc - 1] !== null) return -1;
            if (cc < size - 1 && grid[rr][cc + 1] !== null) return -1;
          }
        }
      }
      return intersections;
    };

    for (const word of words.slice(1)) {
      if (placed.length >= targetWords) break;
      if (placed.includes(word)) continue;

      let chosen: { r: number; c: number; dr: number; dc: number } | null = null;
      // Search matching letters on the grid
      const cells = shuffle(
        Array.from({ length: size * size }, (_, idx) => [Math.floor(idx / size), idx % size] as [number, number])
      );

      for (const [gr, gc] of cells) {
        const ch = grid[gr][gc];
        if (!ch) continue;
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== ch) continue;
          // Try horizontal and vertical
          for (const [dr, dc] of shuffle([
            [0, 1],
            [1, 0],
          ] as [number, number][])) {
            const r0 = gr - dr * i;
            const c0 = gc - dc * i;
            if (canPlace(word, r0, c0, dr, dc) >= 1) {
              chosen = { r: r0, c: c0, dr, dc };
              break;
            }
          }
          if (chosen) break;
        }
        if (chosen) break;
      }

      if (chosen) {
        for (let i = 0; i < word.length; i++) {
          grid[chosen.r + chosen.dr * i][chosen.c + chosen.dc * i] = word[i];
        }
        placed.push(word);
      }
    }

    if (placed.length > bestCount) {
      bestCount = placed.length;
      bestGrid = grid;
    }
  }

  // Assign random code numbers 1..26 to distinct letters present in bestGrid
  const presentLetters = Array.from(
    new Set(bestGrid.flat().filter((ch): ch is string => ch !== null))
  );
  const availableNumbers = shuffle(Array.from({ length: 26 }, (_, i) => i + 1));

  const letterToCode: Record<string, number> = {};
  const codeToLetter: Record<number, string> = {};
  const letterFreq: Record<string, number> = {};

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = bestGrid[r][c];
      if (ch) {
        letterFreq[ch] = (letterFreq[ch] || 0) + 1;
      }
    }
  }

  presentLetters.forEach((letter, idx) => {
    const code = availableNumbers[idx];
    letterToCode[letter] = code;
    codeToLetter[code] = letter;
  });

  const numberGrid: (number | null)[][] = bestGrid.map((row) =>
    row.map((ch) => (ch ? letterToCode[ch] : null))
  );

  // Pick starter codes that appear multiple times so the puzzle has a crisp entry point
  const sortedByFreq = shuffle(presentLetters).sort(
    (a, b) => (letterFreq[b] || 0) - (letterFreq[a] || 0)
  );
  const starterCodes = sortedByFreq.slice(0, starters).map((l) => letterToCode[l]);
  const usedCodes = presentLetters.map((l) => letterToCode[l]).sort((a, b) => a - b);

  return {
    size,
    solutionGrid: bestGrid,
    numberGrid,
    codeToLetter,
    starterCodes,
    usedCodes,
  };
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MotsCodesGame: React.FC<MotsCodesGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(() => generateCodewordPuzzle(difficulty), [difficulty, seed]);

  const [guesses, setGuesses] = useState<Record<number, string>>({});
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [errorCodes, setErrorCodes] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const initial: Record<number, string> = {};
    puzzle.starterCodes.forEach((code) => {
      initial[code] = puzzle.codeToLetter[code];
    });
    setGuesses(initial);
    const firstUnsolved = puzzle.usedCodes.find((c) => !puzzle.starterCodes.includes(c)) ?? null;
    setSelectedCode(firstUnsolved);
    setErrorCodes(new Set());
    setFeedback(null);
    setWon(false);
  }, [puzzle]);

  const checkSolved = (nextGuesses: Record<number, string>) => {
    const allCorrect = puzzle.usedCodes.every(
      (code) => nextGuesses[code] === puzzle.codeToLetter[code]
    );
    if (allCorrect) {
      setWon(true);
      soundFX.victory();
      setFeedback({
        type: 'success',
        message: 'Tous les mots de la grille sont décodés avec exactitude !',
      });
      onWin('mots-codes');
    }
  };

  const assignLetter = (letter: string) => {
    if (selectedCode === null || won) return;
    if (puzzle.starterCodes.includes(selectedCode)) return;

    const next = { ...guesses };
    // Ensure a letter isn't bound to two different numbers unless user replaces it
    Object.keys(next).forEach((k) => {
      const num = Number(k);
      if (num !== selectedCode && next[num] === letter && !puzzle.starterCodes.includes(num)) {
        delete next[num];
      }
    });
    next[selectedCode] = letter;
    setGuesses(next);

    const nextErr = new Set(errorCodes);
    nextErr.delete(selectedCode);
    setErrorCodes(nextErr);
    setFeedback(null);
    soundFX.place();
    checkSolved(next);
  };

  const clearSelected = () => {
    if (selectedCode === null || won || puzzle.starterCodes.includes(selectedCode)) return;
    const next = { ...guesses };
    delete next[selectedCode];
    setGuesses(next);
    const nextErr = new Set(errorCodes);
    nextErr.delete(selectedCode);
    setErrorCodes(nextErr);
    soundFX.click();
  };

  const handleCheck = () => {
    const wrong = new Set<number>();
    let filledCount = 0;
    puzzle.usedCodes.forEach((code) => {
      if (guesses[code]) {
        filledCount++;
        if (guesses[code] !== puzzle.codeToLetter[code]) {
          wrong.add(code);
        }
      }
    });
    setErrorCodes(wrong);

    if (wrong.size > 0) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `${wrong.size} numéro${wrong.size > 1 ? 's ont' : ' a'} une lettre fausse (signalé${wrong.size > 1 ? 's' : ''} en rouge).`,
      });
    } else if (filledCount <= puzzle.starterCodes.length) {
      soundFX.click();
      setFeedback({
        type: 'info',
        message: 'Touchez une case chiffrée puis choisissez une lettre pour commencer à décoder.',
      });
    } else {
      soundFX.place();
      setFeedback({
        type: 'success',
        message: 'Toutes vos lettres posées jusqu’ici sont justes !',
      });
    }
  };

  const handleHint = () => {
    if (won) return;
    const targetCode =
      selectedCode !== null && guesses[selectedCode] !== puzzle.codeToLetter[selectedCode]
        ? selectedCode
        : puzzle.usedCodes.find((c) => guesses[c] !== puzzle.codeToLetter[c]);

    if (targetCode === undefined) return;
    const realLetter = puzzle.codeToLetter[targetCode];
    const next = { ...guesses };
    // Clear any conflicting placement of realLetter
    Object.keys(next).forEach((k) => {
      const n = Number(k);
      if (next[n] === realLetter && !puzzle.starterCodes.includes(n)) {
        delete next[n];
      }
    });
    next[targetCode] = realLetter;
    setGuesses(next);
    setSelectedCode(targetCode);
    const nextErr = new Set(errorCodes);
    nextErr.delete(targetCode);
    setErrorCodes(nextErr);
    soundFX.hint();
    setFeedback({
      type: 'hint',
      message: `Indice : le numéro ${targetCode} correspond toujours à la lettre « ${realLetter} ».`,
    });
    checkSolved(next);
  };

  const usedLetters = useMemo(() => new Set(Object.values(guesses)), [guesses]);
  const decodedCount = puzzle.usedCodes.filter(
    (c) => guesses[c] === puzzle.codeToLetter[c]
  ).length;

  return (
    <GameLayout
      gameId="mots-codes"
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
      winSummary={`Les ${puzzle.usedCodes.length} codes ont été déchiffrés.`}
      statsNode={
        <span className="text-sm font-semibold text-[#1E6B52] tabular-nums px-2">
          {decodedCount} / {puzzle.usedCodes.length} lettres
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Crossword Grid */}
        <div
          className="grid gap-1 p-2.5 bg-[#292524] rounded-2xl w-full max-w-[500px] aspect-square select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        >
          {puzzle.numberGrid.map((row, r) =>
            row.map((code, c) => {
              if (code === null) {
                return <div key={`${r}-${c}`} className="bg-[#1C1917] rounded-md" />;
              }

              const letter = guesses[code] || '';
              const isStarter = puzzle.starterCodes.includes(code);
              const isSelected = selectedCode === code;
              const isError = errorCodes.has(code);

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => {
                    soundFX.click();
                    setSelectedCode(code);
                  }}
                  className={`relative rounded-md flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    isError
                      ? 'bg-[#FEE2E2] ring-2 ring-[#DC2626]'
                      : isSelected
                      ? 'bg-[#FEF3C7] ring-2 ring-[#D97706]'
                      : isStarter
                      ? 'bg-[#ECFDF5]'
                      : 'bg-white hover:bg-[#F7F5F0]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-1 font-mono leading-none ${
                      puzzle.size >= 13 ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'
                    } font-semibold ${isError ? 'text-[#DC2626]' : 'text-[#57534E]'}`}
                  >
                    {code}
                  </span>
                  <span
                    className={`font-bold mt-2 ${
                      puzzle.size >= 13 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                    } ${
                      isError
                        ? 'text-[#DC2626]'
                        : isStarter
                        ? 'text-[#065F46]'
                        : 'text-[#1C1917]'
                    }`}
                  >
                    {letter}
                  </span>
                  {isError && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0.5 right-1 text-[9px] font-bold text-[#DC2626]"
                    >
                      ✗
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Letter Selection Panel */}
        <div className="w-full max-w-[360px] flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-sm font-semibold text-[#1C1917]">
                {selectedCode !== null ? (
                  <>
                    Numéro sélectionné :{' '}
                    <span className="font-mono text-[#1E6B52] text-base">n°{selectedCode}</span>
                  </>
                ) : (
                  'Touchez une case de la grille'
                )}
              </div>
              {selectedCode !== null && !puzzle.starterCodes.includes(selectedCode) && (
                <button
                  type="button"
                  onClick={clearSelected}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold text-[#44403C] hover:bg-[#EDE8DF] cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {ALPHABET.map((letter) => {
                const isUsed = usedLetters.has(letter);
                const disabled =
                  won ||
                  selectedCode === null ||
                  puzzle.starterCodes.includes(selectedCode);
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={disabled}
                    onClick={() => assignLetter(letter)}
                    className={`h-11 rounded-lg font-bold text-base transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      isUsed
                        ? 'bg-[#EAE5DC] text-[#78716C] border border-[#D6D0C4]'
                        : 'bg-white text-[#1C1917] border border-[#D6D0C4] hover:border-[#1E6B52] hover:bg-[#ECFDF5]'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Les cases vertes sont les lettres offertes au départ. Touchez un numéro pour illuminer toutes ses apparitions dans la grille, puis posez une lettre.
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
