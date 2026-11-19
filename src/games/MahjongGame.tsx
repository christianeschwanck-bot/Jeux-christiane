import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface MahjongGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface TileSlot {
  id: number;
  x: number; // half-tile units (0, 2, 4...)
  y: number; // half-tile units (0, 2, 4...)
  z: number; // layer (0, 1, 2...)
}

interface TileKind {
  id: string;
  label: string;
  suit: 'cercles' | 'bambous' | 'caracteres' | 'vents' | 'dragons' | 'fleurs';
  rank: number;
}

interface BoardTile extends TileSlot {
  kind: TileKind;
  removed: boolean;
}

const TILE_KINDS: TileKind[] = [
  // Cercles 1..9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `cercle-${i + 1}`,
    label: `${i + 1} de Cercles`,
    suit: 'cercles' as const,
    rank: i + 1,
  })),
  // Bambous 1..9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `bambou-${i + 1}`,
    label: `${i + 1} de Bambous`,
    suit: 'bambous' as const,
    rank: i + 1,
  })),
  // Caractères 1..9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `car-${i + 1}`,
    label: `${i + 1} de Caractères`,
    suit: 'caracteres' as const,
    rank: i + 1,
  })),
  // Vents (Nord, Est, Sud, Ouest)
  { id: 'vent-1', label: 'Vent d’Est', suit: 'vents', rank: 1 },
  { id: 'vent-2', label: 'Vent du Sud', suit: 'vents', rank: 2 },
  { id: 'vent-3', label: 'Vent d’Ouest', suit: 'vents', rank: 3 },
  { id: 'vent-4', label: 'Vent du Nord', suit: 'vents', rank: 4 },
  // Dragons (Rouge, Vert, Blanc)
  { id: 'dragon-1', label: 'Dragon Rouge', suit: 'dragons', rank: 1 },
  { id: 'dragon-2', label: 'Dragon Vert', suit: 'dragons', rank: 2 },
  { id: 'dragon-3', label: 'Dragon Blanc', suit: 'dragons', rank: 3 },
  // Fleurs / Saisons
  { id: 'fleur-1', label: 'Fleur Prunier', suit: 'fleurs', rank: 1 },
  { id: 'fleur-2', label: 'Fleur Orchidée', suit: 'fleurs', rank: 2 },
  { id: 'fleur-3', label: 'Fleur Chrysanthème', suit: 'fleurs', rank: 3 },
  { id: 'fleur-4', label: 'Fleur Bambou', suit: 'fleurs', rank: 4 },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLayoutSlots(difficulty: Difficulty): TileSlot[] {
  const slots: TileSlot[] = [];
  let id = 0;

  if (difficulty === 'facile') {
    // 36 tiles: 6x4 base (24) + 4x3 layer 1 (12)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        slots.push({ id: id++, x: c * 2, y: r * 2, z: 0 });
      }
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ id: id++, x: 2 + c * 2, y: 1 + r * 2, z: 1 });
      }
    }
  } else if (difficulty === 'moyen') {
    // 64 tiles: 8x5 (40) + 4x4 (16) + 2x4 (8)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        slots.push({ id: id++, x: c * 2, y: r * 2, z: 0 });
      }
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ id: id++, x: 4 + c * 2, y: 1 + r * 2, z: 1 });
      }
    }
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ id: id++, x: 4 + c * 2, y: 3 + r * 2, z: 2 });
      }
    }
  } else if (difficulty === 'difficile') {
    // 96 tiles: 10x6 (60) + 6x4 (24) + 4x2 (8) + 2x2 (4)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 10; c++) {
        slots.push({ id: id++, x: c * 2, y: r * 2, z: 0 });
      }
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        slots.push({ id: id++, x: 4 + c * 2, y: 2 + r * 2, z: 1 });
      }
    }
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ id: id++, x: 6 + c * 2, y: 4 + r * 2, z: 2 });
      }
    }
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        slots.push({ id: id++, x: 8 + c * 2, y: 4 + r * 2, z: 3 });
      }
    }
  } else {
    // Expert: 136 tiles (Classic 5-tier Turtle Pyramid)
    // Layer 0: 12x6 (72) + 2 wings on sides (4) = 76
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 12; c++) {
        slots.push({ id: id++, x: 2 + c * 2, y: r * 2, z: 0 });
      }
    }
    slots.push({ id: id++, x: 0, y: 5, z: 0 });
    slots.push({ id: id++, x: 26, y: 5, z: 0 });
    slots.push({ id: id++, x: 0, y: 7, z: 0 });
    slots.push({ id: id++, x: 26, y: 7, z: 0 });
    // Layer 1: 8x4 (32)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        slots.push({ id: id++, x: 6 + c * 2, y: 2 + r * 2, z: 1 });
      }
    }
    // Layer 2: 6x3 (18)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        slots.push({ id: id++, x: 8 + c * 2, y: 3 + r * 2, z: 2 });
      }
    }
    // Layer 3: 4x2 (8)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ id: id++, x: 10 + c * 2, y: 4 + r * 2, z: 3 });
      }
    }
    // Layer 4: 2 top tiles (2)
    slots.push({ id: id++, x: 12, y: 5, z: 4 });
    slots.push({ id: id++, x: 14, y: 5, z: 4 });
  }

  return slots;
}

function isTileFree(tile: TileSlot, remaining: TileSlot[]): boolean {
  // Blocked if any remaining tile sits on layer z+1 overlapping [x..x+2, y..y+2]
  const hasTop = remaining.some(
    (other) =>
      other.id !== tile.id &&
      other.z === tile.z + 1 &&
      Math.abs(other.x - tile.x) < 2 &&
      Math.abs(other.y - tile.y) < 2
  );
  if (hasTop) return false;

  const hasLeft = remaining.some(
    (other) =>
      other.id !== tile.id &&
      other.z === tile.z &&
      other.x === tile.x - 2 &&
      Math.abs(other.y - tile.y) < 2
  );
  const hasRight = remaining.some(
    (other) =>
      other.id !== tile.id &&
      other.z === tile.z &&
      other.x === tile.x + 2 &&
      Math.abs(other.y - tile.y) < 2
  );

  return !hasLeft || !hasRight;
}

function generateSolvableMahjong(difficulty: Difficulty): BoardTile[] {
  const slots = buildLayoutSlots(difficulty);
  const totalPairs = slots.length / 2;

  // Pick kinds (each kind appears in 2 or 4 tiles)
  const pool = shuffle(TILE_KINDS);
  const pairKinds: TileKind[] = [];
  for (let i = 0; i < totalPairs; i++) {
    pairKinds.push(pool[i % pool.length]);
  }
  const shuffledKinds = shuffle(pairKinds);

  // Reverse-deal pairs onto free slots so a full solution sequence is guaranteed!
  let remaining = [...slots];
  const assigned = new Map<number, TileKind>();

  for (let p = 0; p < totalPairs; p++) {
    const free = remaining.filter((s) => isTileFree(s, remaining));
    let pair: [TileSlot, TileSlot];
    if (free.length >= 2) {
      const picked = shuffle(free).slice(0, 2);
      pair = [picked[0], picked[1]];
    } else {
      // Fallback pick highest layer tiles
      const sorted = [...remaining].sort((a, b) => b.z - a.z);
      pair = [sorted[0], sorted[1]];
    }
    assigned.set(pair[0].id, shuffledKinds[p]);
    assigned.set(pair[1].id, shuffledKinds[p]);
    remaining = remaining.filter((s) => s.id !== pair[0].id && s.id !== pair[1].id);
  }

  return slots.map((s) => ({
    ...s,
    kind: assigned.get(s.id)!,
    removed: false,
  }));
}

const TileFaceSvg: React.FC<{ kind: TileKind }> = ({ kind }) => {
  if (kind.suit === 'cercles') {
    const spots: [number, number][] =
      kind.rank === 1
        ? [[24, 28]]
        : kind.rank === 2
        ? [[24, 18], [24, 38]]
        : kind.rank === 3
        ? [[15, 16], [24, 28], [33, 40]]
        : kind.rank === 4
        ? [[16, 18], [32, 18], [16, 38], [32, 38]]
        : kind.rank === 5
        ? [[15, 16], [33, 16], [24, 28], [15, 40], [33, 40]]
        : kind.rank === 6
        ? [[16, 15], [32, 15], [16, 28], [32, 28], [16, 41], [32, 41]]
        : kind.rank === 7
        ? [[14, 14], [24, 18], [34, 22], [16, 33], [32, 33], [16, 44], [32, 44]]
        : kind.rank === 8
        ? [[16, 13], [32, 13], [16, 23], [32, 23], [16, 33], [32, 33], [16, 43], [32, 43]]
        : [[14, 15], [24, 15], [34, 15], [14, 28], [24, 28], [34, 28], [14, 41], [24, 41], [34, 41]];

    return (
      <svg viewBox="0 0 48 56" className="w-full h-full">
        {spots.map(([cx, cy], idx) => (
          <g key={idx}>
            <circle
              cx={cx}
              cy={cy}
              r={kind.rank === 1 ? 11 : 4.6}
              fill={idx % 3 === 0 ? '#1E6B52' : idx % 3 === 1 ? '#DC2626' : '#2563EB'}
            />
            <circle
              cx={cx}
              cy={cy}
              r={kind.rank === 1 ? 4.5 : 1.7}
              fill="#FFFFFF"
            />
          </g>
        ))}
      </svg>
    );
  }

  if (kind.suit === 'bambous') {
    const cols = kind.rank <= 3 ? kind.rank : Math.ceil(kind.rank / 2);
    const sticks: [number, number, number, string][] = [];
    for (let i = 0; i < kind.rank; i++) {
      const row = kind.rank <= 3 ? 0 : Math.floor(i / cols);
      const col = kind.rank <= 3 ? i : i % cols;
      const x =
        kind.rank === 1
          ? 24
          : cols === 2
          ? 17 + col * 14
          : cols === 3
          ? 13 + col * 11
          : cols === 4
          ? 10 + col * 9
          : 9 + col * 7.5;
      const y = kind.rank <= 3 ? 16 : row === 0 ? 11 : 31;
      const h = kind.rank <= 3 ? 24 : 15;
      sticks.push([x, y, h, i % 2 === 0 ? '#15803D' : '#0D9488']);
    }
    return (
      <svg viewBox="0 0 48 56" className="w-full h-full">
        {sticks.map(([x, y, h, color], idx) => (
          <g key={idx}>
            <rect x={x - 2.3} y={y} width="4.6" height={h} rx="2" fill={color} />
            <line x1={x - 3} y1={y + h / 2} x2={x + 3} y2={y + h / 2} stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  }

  if (kind.suit === 'caracteres') {
    const numerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return (
      <svg viewBox="0 0 48 56" className="w-full h-full">
        <text x="8" y="13" fontSize="10" fontWeight="700" fill="#1E293B">
          {kind.rank}
        </text>
        <text x="24" y="29" textAnchor="middle" fontSize="18" fontWeight="700" fill="#DC2626">
          {numerals[kind.rank]}
        </text>
        <text x="24" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1C1917">
          萬
        </text>
      </svg>
    );
  }

  if (kind.suit === 'vents') {
    const chars = ['', '東', '南', '西', '北'];
    const letters = ['', 'E', 'S', 'O', 'N'];
    return (
      <svg viewBox="0 0 48 56" className="w-full h-full">
        <text x="8" y="13" fontSize="9.5" fontWeight="700" fill="#2563EB">
          {letters[kind.rank]}
        </text>
        <text x="24" y="38" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1E293B">
          {chars[kind.rank]}
        </text>
      </svg>
    );
  }

  if (kind.suit === 'dragons') {
    if (kind.rank === 1) {
      return (
        <svg viewBox="0 0 48 56" className="w-full h-full">
          <text x="24" y="39" textAnchor="middle" fontSize="28" fontWeight="700" fill="#DC2626">
            中
          </text>
        </svg>
      );
    }
    if (kind.rank === 2) {
      return (
        <svg viewBox="0 0 48 56" className="w-full h-full">
          <text x="24" y="39" textAnchor="middle" fontSize="26" fontWeight="700" fill="#15803D">
            發
          </text>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 48 56" className="w-full h-full">
        <rect x="11" y="12" width="26" height="32" rx="4" fill="none" stroke="#2563EB" strokeWidth="3.5" />
      </svg>
    );
  }

  // Fleurs
  const colors = ['', '#EC4899', '#8B5CF6', '#D97706', '#10B981'];
  const c = colors[kind.rank];
  return (
    <svg viewBox="0 0 48 56" className="w-full h-full">
      <circle cx="24" cy="20" r="6" fill={c} />
      <circle cx="16" cy="27" r="6" fill={c} />
      <circle cx="32" cy="27" r="6" fill={c} />
      <circle cx="24" cy="35" r="6" fill={c} />
      <circle cx="24" cy="27" r="4.5" fill="#FDE047" />
      <text x="8" y="13" fontSize="9" fontWeight="700" fill={c}>
        F{kind.rank}
      </text>
    </svg>
  );
};

export const MahjongGame: React.FC<MahjongGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const initialTiles = useMemo(() => generateSolvableMahjong(difficulty), [difficulty, seed]);

  const [tiles, setTiles] = useState<BoardTile[]>(initialTiles);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hintIds, setHintIds] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setTiles(initialTiles);
    setSelectedId(null);
    setHintIds(new Set());
    setFeedback(null);
    setWon(false);
  }, [initialTiles]);

  const remainingSlots = useMemo(
    () => tiles.filter((t) => !t.removed),
    [tiles]
  );

  const freeIds = useMemo(() => {
    const set = new Set<number>();
    remainingSlots.forEach((t) => {
      if (isTileFree(t, remainingSlots)) set.add(t.id);
    });
    return set;
  }, [remainingSlots]);

  const availablePairs = useMemo(() => {
    const freeTiles = remainingSlots.filter((t) => freeIds.has(t.id));
    const pairs: [BoardTile, BoardTile][] = [];
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].kind.id === freeTiles[j].kind.id) {
          pairs.push([freeTiles[i], freeTiles[j]]);
        }
      }
    }
    return pairs;
  }, [freeIds, remainingSlots]);

  const handleTileClick = (tile: BoardTile) => {
    if (won || tile.removed) return;

    if (!freeIds.has(tile.id)) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message:
          'Cette tuile est bloquée : dégagez d’abord sa gauche, sa droite ou la tuile posée au-dessus.',
      });
      return;
    }

    if (selectedId === tile.id) {
      soundFX.click();
      setSelectedId(null);
      return;
    }

    if (selectedId === null) {
      soundFX.click();
      setSelectedId(tile.id);
      setHintIds(new Set());
      setFeedback(null);
      return;
    }

    const first = tiles.find((t) => t.id === selectedId);
    if (!first) {
      setSelectedId(tile.id);
      return;
    }

    if (first.kind.id === tile.kind.id) {
      const nextTiles = tiles.map((t) =>
        t.id === first.id || t.id === tile.id ? { ...t, removed: true } : t
      );
      setTiles(nextTiles);
      setSelectedId(null);
      setHintIds(new Set());

      const leftCount = nextTiles.filter((t) => !t.removed).length;
      if (leftCount === 0) {
        setWon(true);
        soundFX.victory();
        setFeedback({
          type: 'success',
          message: 'Toutes les tuiles ont été associées ! Magnifique partie de Mahjong.',
        });
        onWin('mahjong');
      } else {
        soundFX.clear();
        setFeedback({
          type: 'success',
          message: `Paire retirée (${tile.kind.label}). Encore ${leftCount / 2} paires restantes.`,
        });
      }
    } else {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `Ces deux tuiles ne correspondent pas (${first.kind.label} ≠ ${tile.kind.label}).`,
      });
      setSelectedId(tile.id);
    }
  };

  const handleShuffle = useCallback(() => {
    if (won || remainingSlots.length === 0) return;
    soundFX.click();
    const kinds = shuffle(remainingSlots.map((t) => t.kind));
    let kIdx = 0;
    const next = tiles.map((t) => (t.removed ? t : { ...t, kind: kinds[kIdx++] }));
    setTiles(next);
    setSelectedId(null);
    setHintIds(new Set());
    setFeedback({
      type: 'info',
      message: 'Les tuiles restantes ont été mélangées tout en gardant vos progrès.',
    });
  }, [remainingSlots, tiles, won]);

  const handleHint = () => {
    if (won) return;
    if (availablePairs.length === 0) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: 'Aucune paire libre disponible pour cet ordre : cliquez sur « Mélanger » !',
      });
      return;
    }
    const [a, b] = availablePairs[0];
    setHintIds(new Set([a.id, b.id]));
    setSelectedId(null);
    soundFX.hint();
    setFeedback({
      type: 'hint',
      message: `Indice : deux tuiles « ${a.kind.label} » libres sont illuminées en doré !`,
    });
  };

  // Calculate board bounding box in half-units
  const bounds = useMemo(() => {
    const maxX = Math.max(...tiles.map((t) => t.x)) + 2;
    const maxY = Math.max(...tiles.map((t) => t.y)) + 2;
    return { maxX, maxY };
  }, [tiles]);

  const sortedForRender = useMemo(
    () =>
      [...tiles]
        .filter((t) => !t.removed)
        .sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x),
    [tiles]
  );

  // Tile sizing responsive inside container
  const unitW = difficulty === 'expert' ? 23 : difficulty === 'difficile' ? 28 : 34;
  const unitH = Math.round(unitW * 1.18);
  const boardPxW = bounds.maxX * unitW + 24;
  const boardPxH = bounds.maxY * unitH + 24;

  return (
    <GameLayout
      gameId="mahjong"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => setSeed((s) => s + 1)}
      onBackHome={onBackHome}
      onHint={handleHint}
      feedback={feedback}
      won={won}
      winSummary={`Pyramide complète vidée (${tiles.length / 2} paires associées).`}
      statsNode={
        <div className="flex items-center gap-3 text-sm font-semibold tabular-nums px-2">
          <span className="text-[#1E6B52]">
            {remainingSlots.length / 2} paires restantes
          </span>
          <span className="text-[#78716C]">{availablePairs.length} libres</span>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#57534E]">
            Les tuiles pleinement éclairées sont <strong>libres</strong>. Associez deux tuiles identiques.
          </p>
          <button
            type="button"
            onClick={handleShuffle}
            disabled={won}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] hover:bg-[#EDE8DF] text-xs font-semibold text-[#1C1917] cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-[#1E6B52]" />
            <span>Mélanger les tuiles</span>
          </button>
        </div>

        {/* Mahjong Felt Arena */}
        <div className="w-full overflow-x-auto flex justify-center py-4 px-2 rounded-2xl bg-[#164E3F] border-2 border-[#0F392E]">
          <div
            className="relative shrink-0"
            style={{ width: `${boardPxW}px`, height: `${boardPxH}px` }}
          >
            {sortedForRender.map((tile) => {
              const isFree = freeIds.has(tile.id);
              const isSelected = selectedId === tile.id;
              const isHinted = hintIds.has(tile.id);

              const left = 10 + tile.x * unitW - tile.z * 5;
              const top = 10 + tile.y * unitH - tile.z * 5;
              const width = unitW * 2 - 2;
              const height = unitH * 2 - 2;

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex: tile.z * 100 + tile.y,
                  }}
                  aria-label={`${tile.kind.label}${isFree ? ' (libre)' : ' (bloquée)'}`}
                  className={`absolute rounded-lg transition-transform duration-150 cursor-pointer select-none ${
                    isSelected
                      ? '-translate-y-1.5 ring-3 ring-[#F59E0B] bg-[#FFFBEB]'
                      : isHinted
                      ? '-translate-y-1 ring-3 ring-[#FBBF24] bg-[#FEF3C7]'
                      : isFree
                      ? 'bg-[#FAF7F0] hover:-translate-y-0.5'
                      : 'bg-[#D6D0C4] brightness-90 cursor-not-allowed'
                  } border border-[#94A3B8] shadow-[3px_4px_0px_#0D3B2E] p-1`}
                >
                  <TileFaceSvg kind={tile.kind} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};
