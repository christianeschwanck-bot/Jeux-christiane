import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface PointsRelierGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface PairDef {
  id: number;
  name: string;
  color: string;
  softBg: string;
  start: [number, number];
  end: [number, number];
  solutionPath: [number, number][];
}

interface FlowPuzzle {
  size: number;
  pairs: PairDef[];
}

const FLOW_PALETTE = [
  { name: 'Rouge', color: '#DC2626', softBg: '#FEE2E2' },
  { name: 'Bleu', color: '#2563EB', softBg: '#DBEAFE' },
  { name: 'Vert', color: '#16A34A', softBg: '#DCFCE7' },
  { name: 'Ambre', color: '#D97706', softBg: '#FEF3C7' },
  { name: 'Violet', color: '#7C3AED', softBg: '#EDE9FE' },
  { name: 'Rose', color: '#DB2777', softBg: '#FCE7F3' },
  { name: 'Turquoise', color: '#0D9488', softBg: '#CCFBF1' },
  { name: 'Orange', color: '#EA580C', softBg: '#FFEDD5' },
  { name: 'Indigo', color: '#4F46E5', softBg: '#E0E7FF' },
];

function generateFlowPuzzle(difficulty: Difficulty): FlowPuzzle {
  const config: Record<Difficulty, { size: number; minPairs: number; maxPairs: number }> = {
    facile: { size: 5, minPairs: 4, maxPairs: 4 },
    moyen: { size: 6, minPairs: 5, maxPairs: 6 },
    difficile: { size: 7, minPairs: 7, maxPairs: 7 },
    expert: { size: 9, minPairs: 8, maxPairs: 10 },
  };
  const { size, minPairs, maxPairs } = config[difficulty];

  // Build initial serpentine Hamiltonian path
  let path: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) path.push([r, c]);
    } else {
      for (let c = size - 1; c >= 0; c--) path.push([r, c]);
    }
  }

  const keyOf = ([r, c]: [number, number]) => `${r},${c}`;
  const isAdj = (a: [number, number], b: [number, number]) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

  // Scramble with Backbite algorithm to generate rich organic winding paths
  for (let step = 0; step < 1200; step++) {
    const reverseEnd = Math.random() < 0.5;
    if (reverseEnd) path.reverse();

    const head = path[0];
    const neighbors: [number, number][] = [];
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = head[0] + dr;
      const nc = head[1] + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        neighbors.push([nr, nc]);
      }
    }
    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
    const idx = path.findIndex((p) => p[0] === chosen[0] && p[1] === chosen[1]);
    if (idx > 1) {
      // Reverse subpath 0..idx-1
      const sub = path.slice(0, idx).reverse();
      path = [...sub, ...path.slice(idx)];
    }
  }

  // Partition path into K segments of length >= 4 (or >= 3)
  const targetK =
    minPairs + Math.floor(Math.random() * (maxPairs - minPairs + 1));
  const totalCells = size * size;
  const minSegLen = size >= 7 ? 4 : 3;

  // Choose K-1 random split points obeying minSegLen
  let segments: [number, number][][] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    const cuts = new Set<number>();
    let tries = 0;
    while (cuts.size < targetK - 1 && tries < 200) {
      tries++;
      const c = minSegLen + Math.floor(Math.random() * (totalCells - 2 * minSegLen));
      const sorted = Array.from(cuts).sort((a, b) => a - b);
      const valid =
        c >= minSegLen &&
        totalCells - c >= minSegLen &&
        sorted.every((s) => Math.abs(s - c) >= minSegLen);
      if (valid) cuts.add(c);
    }
    if (cuts.size === targetK - 1) {
      const points = [0, ...Array.from(cuts).sort((a, b) => a - b), totalCells];
      const candidateSegs: [number, number][][] = [];
      let nonTrivial = true;
      for (let i = 0; i < points.length - 1; i++) {
        const seg = path.slice(points[i], points[i + 1]);
        // Avoid segments whose start and end are directly adjacent unless length >= 5
        if (isAdj(seg[0], seg[seg.length - 1]) && seg.length < 5) {
          nonTrivial = false;
        }
        candidateSegs.push(seg);
      }
      if (nonTrivial || attempt === 39) {
        segments = candidateSegs;
        break;
      }
    }
  }

  if (segments.length === 0) {
    // Fallback even split
    const chunk = Math.floor(totalCells / targetK);
    for (let i = 0; i < targetK; i++) {
      const start = i * chunk;
      const end = i === targetK - 1 ? totalCells : (i + 1) * chunk;
      segments.push(path.slice(start, end));
    }
  }

  const pairs: PairDef[] = segments.map((seg, idx) => {
    const pal = FLOW_PALETTE[idx % FLOW_PALETTE.length];
    return {
      id: idx,
      name: pal.name,
      color: pal.color,
      softBg: pal.softBg,
      start: seg[0],
      end: seg[seg.length - 1],
      solutionPath: seg,
    };
  });

  // Sanity deduplication check on endpoints
  void keyOf;
  return { size, pairs };
}

export const PointsRelierGame: React.FC<PointsRelierGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(() => generateFlowPuzzle(difficulty), [difficulty, seed]);

  const [paths, setPaths] = useState<Record<number, [number, number][]>>({});
  const [activePairId, setActivePairId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorPairIds, setErrorPairIds] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPaths({});
    setActivePairId(null);
    setIsDrawing(false);
    setErrorPairIds(new Set());
    setFeedback(null);
    setWon(false);
  }, [puzzle]);

  const endpointMap = useMemo(() => {
    const map = new Map<string, PairDef>();
    puzzle.pairs.forEach((p) => {
      map.set(`${p.start[0]}-${p.start[1]}`, p);
      map.set(`${p.end[0]}-${p.end[1]}`, p);
    });
    return map;
  }, [puzzle]);

  const isPairComplete = useCallback(
    (pair: PairDef, path: [number, number][] | undefined) => {
      if (!path || path.length < 2) return false;
      const first = path[0];
      const last = path[path.length - 1];
      const matchForward =
        first[0] === pair.start[0] &&
        first[1] === pair.start[1] &&
        last[0] === pair.end[0] &&
        last[1] === pair.end[1];
      const matchReverse =
        first[0] === pair.end[0] &&
        first[1] === pair.end[1] &&
        last[0] === pair.start[0] &&
        last[1] === pair.start[1];
      return matchForward || matchReverse;
    },
    []
  );

  const checkVictory = useCallback(
    (nextPaths: Record<number, [number, number][]>) => {
      const allComplete = puzzle.pairs.every((p) => isPairComplete(p, nextPaths[p.id]));
      if (!allComplete) return;

      const covered = new Set<string>();
      puzzle.pairs.forEach((p) => {
        (nextPaths[p.id] || []).forEach(([r, c]) => covered.add(`${r}-${c}`));
      });

      if (covered.size === puzzle.size * puzzle.size) {
        setWon(true);
        soundFX.victory();
        setFeedback({
          type: 'success',
          message: 'Tous les points sont reliés et toute la grille est remplie !',
        });
        onWin('points-relier');
      } else {
        setFeedback({
          type: 'info',
          message: `Toutes les paires sont reliées, mais il reste ${
            puzzle.size * puzzle.size - covered.size
          } case(s) vide(s) à couvrir !`,
        });
      }
    },
    [isPairComplete, onWin, puzzle.pairs, puzzle.size]
  );

  const extendPathTo = useCallback(
    (r: number, c: number) => {
      if (activePairId === null || won) return;
      const pair = puzzle.pairs.find((p) => p.id === activePairId);
      if (!pair) return;

      setPaths((prev) => {
        const current = prev[activePairId] || [];
        if (current.length === 0) return prev;
        const last = current[current.length - 1];
        if (last[0] === r && last[1] === c) return prev;

        // Backtracking if stepping onto an earlier cell of the same path
        const backIdx = current.findIndex(([pr, pc]) => pr === r && pc === c);
        if (backIdx !== -1) {
          soundFX.click();
          return { ...prev, [activePairId]: current.slice(0, backIdx + 1) };
        }

        // Must be orthogonally adjacent
        if (Math.abs(last[0] - r) + Math.abs(last[1] - c) !== 1) return prev;

        // If already reached the target endpoint, don't extend further unless backtracking
        if (isPairComplete(pair, current)) return prev;

        // Cannot step onto another color's endpoint
        const ep = endpointMap.get(`${r}-${c}`);
        if (ep && ep.id !== activePairId) {
          soundFX.error();
          setFeedback({
            type: 'error',
            message: `Impossible de traverser le point ${ep.name} !`,
          });
          return prev;
        }

        // Check if stepping onto another pair's path — prevent silent crossing & warn!
        const occupiedByOther = puzzle.pairs.find(
          (other) =>
            other.id !== activePairId &&
            (prev[other.id] || []).some(([or, oc]) => or === r && oc === c)
        );
        if (occupiedByOther) {
          soundFX.error();
          setFeedback({
            type: 'error',
            message: `Les fils ne peuvent pas se croiser (le fil ${occupiedByOther.name} occupe cette case).`,
          });
          return prev;
        }

        const nextPath: [number, number][] = [...current, [r, c]];
        const nextPaths = { ...prev, [activePairId]: nextPath };

        const errNext = new Set(errorPairIds);
        errNext.delete(activePairId);
        setErrorPairIds(errNext);

        if (isPairComplete(pair, nextPath)) {
          soundFX.clear();
          setFeedback(null);
          window.setTimeout(() => checkVictory(nextPaths), 0);
        } else {
          soundFX.click();
          setFeedback(null);
        }
        return nextPaths;
      });
    },
    [activePairId, checkVictory, endpointMap, errorPairIds, isPairComplete, puzzle.pairs, won]
  );

  const handleCellDown = (r: number, c: number) => {
    if (won) return;
    const ep = endpointMap.get(`${r}-${c}`);
    if (ep) {
      soundFX.click();
      setActivePairId(ep.id);
      setIsDrawing(true);
      setPaths((prev) => ({ ...prev, [ep.id]: [[r, c]] }));
      setFeedback(null);
      return;
    }

    // Check if clicking on an existing path tip or segment to resume
    const owner = puzzle.pairs.find((p) =>
      (paths[p.id] || []).some(([pr, pc]) => pr === r && pc === c)
    );
    if (owner) {
      const idx = paths[owner.id].findIndex(([pr, pc]) => pr === r && pc === c);
      soundFX.click();
      setActivePairId(owner.id);
      setIsDrawing(true);
      setPaths((prev) => ({ ...prev, [owner.id]: prev[owner.id].slice(0, idx + 1) }));
      setFeedback(null);
    } else if (activePairId !== null) {
      // Tap-step support
      extendPathTo(r, c);
    }
  };

  useEffect(() => {
    const handleUp = () => setIsDrawing(false);
    window.addEventListener('pointerup', handleUp);
    return () => window.removeEventListener('pointerup', handleUp);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return;
    const c = Math.floor((x / rect.width) * puzzle.size);
    const r = Math.floor((y / rect.height) * puzzle.size);
    extendPathTo(r, c);
  };

  // BFS check: verify whether all remaining incomplete pairs can still connect without crossing completed paths
  const handleCheck = () => {
    const blockedPairs = new Set<number>();
    const occupied = new Set<string>();

    // Gather cells used by completed paths
    puzzle.pairs.forEach((p) => {
      if (isPairComplete(p, paths[p.id])) {
        (paths[p.id] || []).forEach(([r, c]) => occupied.add(`${r}-${c}`));
      }
    });

    // Check each incomplete pair can still reach each other
    for (const p of puzzle.pairs) {
      if (isPairComplete(p, paths[p.id])) continue;
      const startKey = `${p.start[0]}-${p.start[1]}`;
      const endKey = `${p.end[0]}-${p.end[1]}`;
      const queue: [number, number][] = [p.start];
      const visited = new Set<string>([startKey]);
      let found = false;

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        if (`${r}-${c}` === endKey) {
          found = true;
          break;
        }
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= puzzle.size || nc < 0 || nc >= puzzle.size) continue;
          const k = `${nr}-${nc}`;
          if (visited.has(k)) continue;
          const ep = endpointMap.get(k);
          if (ep && ep.id !== p.id) continue;
          if (occupied.has(k)) continue;
          visited.add(k);
          queue.push([nr, nc]);
        }
      }
      if (!found) blockedPairs.add(p.id);
    }

    // Also compare completed paths that block other pairs vs solution
    if (blockedPairs.size > 0) {
      // Identify which completed paths differ from solution
      const culpritIds = new Set<number>();
      puzzle.pairs.forEach((p) => {
        if (isPairComplete(p, paths[p.id])) {
          const solKeys = new Set(p.solutionPath.map(([r, c]) => `${r}-${c}`));
          const userKeys = (paths[p.id] || []).map(([r, c]) => `${r}-${c}`);
          if (
            userKeys.length !== solKeys.size ||
            userKeys.some((k) => !solKeys.has(k))
          ) {
            culpritIds.add(p.id);
          }
        }
      });
      const flagged = culpritIds.size > 0 ? culpritIds : blockedPairs;
      setErrorPairIds(flagged);
      soundFX.error();
      const names = Array.from(flagged)
        .map((id) => puzzle.pairs.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      setFeedback({
        type: 'error',
        message: `Un tracé bloque le passage pour un autre fil ! Vérifiez : ${names}.`,
      });
    } else {
      setErrorPairIds(new Set());
      soundFX.place();
      setFeedback({
        type: 'success',
        message: 'Vos tracés actuels laissent bien la voie libre aux autres points !',
      });
    }
  };

  const handleHint = () => {
    if (won) return;
    // Find an incomplete pair, or a pair whose path diverges from solution if stuck
    let target = puzzle.pairs.find((p) => !isPairComplete(p, paths[p.id]));
    if (!target) {
      target = puzzle.pairs.find((p) => {
        const userKeys = (paths[p.id] || []).map(([r, c]) => `${r}-${c}`).join('|');
        const solKeys = p.solutionPath.map(([r, c]) => `${r}-${c}`).join('|');
        const revKeys = [...p.solutionPath].reverse().map(([r, c]) => `${r}-${c}`).join('|');
        return userKeys !== solKeys && userKeys !== revKeys;
      });
    }
    if (!target) return;

    // Clear any other user path that overlaps target.solutionPath
    const targetCells = new Set(target.solutionPath.map(([r, c]) => `${r}-${c}`));
    const nextPaths: Record<number, [number, number][]> = { ...paths };
    puzzle.pairs.forEach((other) => {
      if (other.id !== target!.id && nextPaths[other.id]) {
        if (nextPaths[other.id].some(([r, c]) => targetCells.has(`${r}-${c}`))) {
          delete nextPaths[other.id];
        }
      }
    });
    nextPaths[target.id] = [...target.solutionPath];
    setPaths(nextPaths);
    setErrorPairIds(new Set());
    soundFX.hint();
    setFeedback({
      type: 'hint',
      message: `Indice : le fil ${target.name} a été tracé proprement pour vous montrer le passage.`,
    });
    checkVictory(nextPaths);
  };

  const completedCount = puzzle.pairs.filter((p) => isPairComplete(p, paths[p.id])).length;

  // Compute SVG polyline points in normalized 0..size*100 coordinates
  const svgSize = puzzle.size * 100;

  return (
    <GameLayout
      gameId="points-relier"
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
      winSummary={`Les ${puzzle.pairs.length} paires de couleurs sont reliées sans croisement !`}
      statsNode={
        <span className="text-sm font-semibold text-[#1E6B52] tabular-nums px-2">
          {completedCount} / {puzzle.pairs.length} paires
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        <div
          ref={gridRef}
          onPointerMove={handlePointerMove}
          className="relative w-full max-w-[480px] aspect-square bg-[#1C1917] p-2 rounded-2xl select-none touch-none"
        >
          {/* Base grid cells */}
          <div
            className="grid gap-1 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: puzzle.size }).map((_, r) =>
              Array.from({ length: puzzle.size }).map((__, c) => {
                const owner = puzzle.pairs.find((p) =>
                  (paths[p.id] || []).some(([pr, pc]) => pr === r && pc === c)
                );
                return (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={() => handleCellDown(r, c)}
                    style={{
                      backgroundColor: owner ? owner.softBg : '#292524',
                    }}
                    className="rounded-lg transition-colors cursor-pointer"
                  />
                );
              })
            )}
          </div>

          {/* SVG Smooth Wire Paths & Endpoints Overlay */}
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none"
          >
            {puzzle.pairs.map((p) => {
              const pts = paths[p.id];
              if (!pts || pts.length < 2) return null;
              const pointsAttr = pts
                .map(([r, c]) => `${c * 100 + 50},${r * 100 + 50}`)
                .join(' ');
              const isErr = errorPairIds.has(p.id);
              return (
                <polyline
                  key={p.id}
                  points={pointsAttr}
                  fill="none"
                  stroke={isErr ? '#EF4444' : p.color}
                  strokeWidth="26"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isErr ? '18 14' : undefined}
                  opacity="0.92"
                />
              );
            })}

            {puzzle.pairs.map((p) => {
              const complete = isPairComplete(p, paths[p.id]);
              return [p.start, p.end].map(([r, c], idx) => (
                <g key={`${p.id}-${idx}`}>
                  <circle
                    cx={c * 100 + 50}
                    cy={r * 100 + 50}
                    r="32"
                    fill={p.color}
                    stroke="#FFFFFF"
                    strokeWidth={complete ? '5' : '3'}
                  />
                  <text
                    x={c * 100 + 50}
                    y={r * 100 + 57}
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="700"
                    fill="#FFFFFF"
                  >
                    {p.id + 1}
                  </text>
                </g>
              ));
            })}
          </svg>
        </div>

        {/* Pair Legend & Clear Button */}
        <div className="w-full max-w-[300px] flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-3">
              Paires à relier ({completedCount}/{puzzle.pairs.length})
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {puzzle.pairs.map((p) => {
                const done = isPairComplete(p, paths[p.id]);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                      done
                        ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]'
                        : 'bg-white border-[#E5E0D8] text-[#1C1917]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate">{p.name}</span>
                    {done && <span className="ml-auto">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.click();
              setPaths({});
              setErrorPairIds(new Set());
              setFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#F7F5F0] text-sm font-semibold text-[#44403C] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Effacer tous les tracés</span>
          </button>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Maintenez le doigt (ou la souris) sur un point numéroté et glissez jusqu’à son jumeau. Les fils ne doivent jamais se croiser et toute la grille doit être couverte.
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
