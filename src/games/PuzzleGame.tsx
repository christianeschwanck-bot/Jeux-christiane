import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, RotateCw } from 'lucide-react';
import { GameLayout } from '../components/GameLayout';
import { PUZZLE_SCENES, renderPuzzleSceneToCanvas } from '../components/PuzzleArtworks';
import { Difficulty, FeedbackState } from '../types/games';
import { soundFX } from '../utils/sound';

interface PuzzleGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onBackHome: () => void;
  onWin: (gameId: string) => void;
}

interface TilePiece {
  id: number;
  correctIndex: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onBackHome,
  onWin,
}) => {
  const [seed, setSeed] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(() => Math.floor(Math.random() * PUZZLE_SCENES.length));

  const gridN = difficulty === 'facile' ? 3 : difficulty === 'moyen' ? 4 : difficulty === 'difficile' ? 5 : 6;
  const allowRotation = difficulty === 'difficile' || difficulty === 'expert';
  const scene = PUZZLE_SCENES[sceneIdx];

  const { pieces, previewUrl } = useMemo(() => {
    const fullCanvas = renderPuzzleSceneToCanvas(scene.id, 600);
    const fullUrl = fullCanvas.toDataURL('image/png');
    const tileSize = Math.floor(600 / gridN);
    const created: TilePiece[] = [];

    for (let r = 0; r < gridN; r++) {
      for (let c = 0; c < gridN; c++) {
        const sub = document.createElement('canvas');
        sub.width = tileSize;
        sub.height = tileSize;
        const ctx = sub.getContext('2d')!;
        ctx.drawImage(
          fullCanvas,
          c * tileSize,
          r * tileSize,
          tileSize,
          tileSize,
          0,
          0,
          tileSize,
          tileSize
        );
        const idx = r * gridN + c;
        created.push({
          id: idx,
          correctIndex: idx,
          dataUrl: sub.toDataURL('image/png'),
          rotation: allowRotation ? [0, 90, 180, 270][Math.floor(Math.random() * 4)] : 0,
        });
      }
    }
    return { pieces: created, previewUrl: fullUrl };
  }, [allowRotation, gridN, scene.id, seed]);

  // boardSlots[slotIdx] = pieceId or null
  const [boardSlots, setBoardSlots] = useState<(number | null)[]>([]);
  const [trayIds, setTrayIds] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [showGhost, setShowGhost] = useState(true);
  const [wrongSlots, setWrongSlots] = useState<Set<number>>(new Set());
  const [hintSlot, setHintSlot] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setBoardSlots(Array(gridN * gridN).fill(null));
    setTrayIds(shuffle(pieces.map((p) => p.id)));
    const rotMap: Record<number, number> = {};
    pieces.forEach((p) => {
      rotMap[p.id] = p.rotation;
    });
    setRotations(rotMap);
    setSelectedPieceId(pieces[0]?.id ?? null);
    setWrongSlots(new Set());
    setHintSlot(null);
    setFeedback(null);
    setWon(false);
  }, [gridN, pieces]);

  const checkSolved = useCallback(
    (nextBoard: (number | null)[], nextRot: Record<number, number>) => {
      const complete = nextBoard.every(
        (pid, slotIdx) => pid === slotIdx && (nextRot[pid] ?? 0) % 360 === 0
      );
      if (complete) {
        setWon(true);
        soundFX.victory();
        setFeedback({
          type: 'success',
          message: `Magnifique ! Le tableau « ${scene.title} » est entièrement reconstitué.`,
        });
        onWin('puzzle');
      }
    },
    [onWin, scene.title]
  );

  const rotateSelected = () => {
    if (selectedPieceId === null || won || !allowRotation) return;
    soundFX.click();
    const nextRot = {
      ...rotations,
      [selectedPieceId]: ((rotations[selectedPieceId] ?? 0) + 90) % 360,
    };
    setRotations(nextRot);
    checkSolved(boardSlots, nextRot);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (won) return;
    const existingPid = boardSlots[slotIdx];

    // If no piece selected and slot has a piece: select it (or rotate if already selected)
    if (selectedPieceId === null) {
      if (existingPid !== null) {
        soundFX.click();
        setSelectedPieceId(existingPid);
      }
      return;
    }

    // Clicking the slot that already holds selectedPieceId -> rotate if rotation allowed, or return to tray
    if (existingPid === selectedPieceId) {
      if (allowRotation) {
        rotateSelected();
      } else {
        // Send back to tray
        soundFX.click();
        const nextBoard = [...boardSlots];
        nextBoard[slotIdx] = null;
        setBoardSlots(nextBoard);
        setTrayIds((t) => [...t, selectedPieceId]);
        setSelectedPieceId(null);
      }
      return;
    }

    // Place selectedPieceId into slotIdx (swapping if slot already occupied or moving from another slot)
    const nextBoard = [...boardSlots];
    const prevSlotOfSelected = nextBoard.indexOf(selectedPieceId);
    const nextTray = trayIds.filter((id) => id !== selectedPieceId);

    if (prevSlotOfSelected !== -1) {
      nextBoard[prevSlotOfSelected] = existingPid;
    } else if (existingPid !== null) {
      nextTray.push(existingPid);
    }
    nextBoard[slotIdx] = selectedPieceId;

    setBoardSlots(nextBoard);
    setTrayIds(nextTray);
    setHintSlot(null);

    const nextWrong = new Set(wrongSlots);
    nextWrong.delete(slotIdx);
    setWrongSlots(nextWrong);

    // Check immediate placement feedback if wrong
    const rotOk = (rotations[selectedPieceId] ?? 0) % 360 === 0;
    if (selectedPieceId === slotIdx && rotOk) {
      soundFX.clear();
      setFeedback(null);
    } else {
      soundFX.place();
    }

    setSelectedPieceId(nextTray[0] ?? null);
    checkSolved(nextBoard, rotations);
  };

  const handleCheck = () => {
    const wrong = new Set<number>();
    let placedCount = 0;
    boardSlots.forEach((pid, slotIdx) => {
      if (pid !== null) {
        placedCount++;
        const rotOk = (rotations[pid] ?? 0) % 360 === 0;
        if (pid !== slotIdx || !rotOk) {
          wrong.add(slotIdx);
        }
      }
    });
    setWrongSlots(wrong);

    if (wrong.size > 0) {
      soundFX.error();
      setFeedback({
        type: 'error',
        message: `${wrong.size} pièce${wrong.size > 1 ? 's sont' : ' est'} mal placée${
          wrong.size > 1 ? 's' : ''
        } ou mal orientée${wrong.size > 1 ? 's' : ''} (signalée en rouge).`,
      });
    } else if (placedCount === 0) {
      soundFX.click();
      setFeedback({
        type: 'info',
        message: 'Touchez une pièce dans la réserve puis son emplacement sur le plateau.',
      });
    } else {
      soundFX.place();
      setFeedback({
        type: 'success',
        message: 'Toutes vos pièces posées sur le plateau sont au bon endroit !',
      });
    }
  };

  const handleHint = () => {
    if (won) return;
    // Pick first slot that is either empty or has wrong piece/rotation
    const targetSlot = boardSlots.findIndex(
      (pid, idx) => pid !== idx || (rotations[pid] ?? 0) % 360 !== 0
    );
    if (targetSlot === -1) return;

    const correctPid = targetSlot;
    const nextBoard = [...boardSlots];
    const currentPosOfCorrect = nextBoard.indexOf(correctPid);
    const occupantAtTarget = nextBoard[targetSlot];

    let nextTray = trayIds.filter((id) => id !== correctPid);
    if (currentPosOfCorrect !== -1) {
      nextBoard[currentPosOfCorrect] = occupantAtTarget;
    } else if (occupantAtTarget !== null) {
      nextTray = [...nextTray, occupantAtTarget];
    }
    nextBoard[targetSlot] = correctPid;

    const nextRot = { ...rotations, [correctPid]: 0 };
    setBoardSlots(nextBoard);
    setTrayIds(nextTray);
    setRotations(nextRot);
    setHintSlot(targetSlot);
    setWrongSlots(new Set());
    setSelectedPieceId(nextTray[0] ?? null);
    soundFX.hint();
    setFeedback({
      type: 'hint',
      message: `Indice : une pièce a été remise à sa juste place (encadrée en doré).`,
    });
    checkSolved(nextBoard, nextRot);
  };

  const correctCount = boardSlots.filter(
    (pid, idx) => pid === idx && (rotations[pid] ?? 0) % 360 === 0
  ).length;

  return (
    <GameLayout
      gameId="puzzle"
      difficulty={difficulty}
      onChangeDifficulty={(d) => {
        onChangeDifficulty(d);
        setSeed((s) => s + 1);
      }}
      onNewGame={() => {
        setSceneIdx((i) => (i + 1) % PUZZLE_SCENES.length);
        setSeed((s) => s + 1);
      }}
      onBackHome={onBackHome}
      onHint={handleHint}
      onCheck={handleCheck}
      feedback={feedback}
      won={won}
      winSummary={`Tableau « ${scene.title} » assemblé (${gridN * gridN} pièces).`}
      statsNode={
        <span className="text-sm font-semibold text-[#1E6B52] tabular-nums px-2">
          {correctCount} / {gridN * gridN} pièces
        </span>
      }
    >
      {/* Scene Selector */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#78716C] mr-1">Tableau :</span>
          {PUZZLE_SCENES.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                soundFX.click();
                setSceneIdx(idx);
                setSeed((s) => s + 1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                idx === sceneIdx
                  ? 'bg-[#1E6B52] text-white'
                  : 'bg-[#F4F1EA] text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {allowRotation && (
            <button
              type="button"
              onClick={rotateSelected}
              disabled={selectedPieceId === null || won}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-semibold hover:bg-[#FDE68A] disabled:opacity-45 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Pivoter 90°</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundFX.click();
              setShowGhost((v) => !v);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              showGhost
                ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]'
                : 'bg-white border-[#E5E0D8] text-[#57534E]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Modèle en fond : {showGhost ? 'Oui' : 'Non'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Main Puzzle Board */}
        <div className="relative w-full max-w-[460px] aspect-square rounded-2xl overflow-hidden border-2 border-[#D6D0C4] bg-[#F7F5F0] select-none">
          {showGhost && (
            <img
              src={previewUrl}
              alt="Modèle du puzzle"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
          )}
          <div
            className="relative z-10 grid w-full h-full"
            style={{ gridTemplateColumns: `repeat(${gridN}, minmax(0, 1fr))` }}
          >
            {boardSlots.map((pid, slotIdx) => {
              const piece = pid !== null ? pieces[pid] : null;
              const isSelected = pid !== null && selectedPieceId === pid;
              const isWrong = wrongSlots.has(slotIdx);
              const isHint = hintSlot === slotIdx;
              const rot = pid !== null ? rotations[pid] ?? 0 : 0;

              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handleSlotClick(slotIdx)}
                  className={`relative border border-[#D6D0C4]/70 overflow-hidden transition-all cursor-pointer ${
                    isWrong
                      ? 'ring-3 ring-inset ring-[#DC2626]'
                      : isHint
                      ? 'ring-3 ring-inset ring-[#D97706]'
                      : isSelected
                      ? 'ring-3 ring-inset ring-[#1E6B52]'
                      : 'hover:bg-white/40'
                  }`}
                >
                  {piece && (
                    <img
                      src={piece.dataUrl}
                      alt={`Pièce ${piece.id + 1}`}
                      style={{ transform: `rotate(${rot}deg)` }}
                      className="w-full h-full object-cover transition-transform duration-150"
                    />
                  )}
                  {isWrong && (
                    <span className="absolute top-1 right-1 bg-[#DC2626] text-white text-[10px] font-bold px-1 rounded">
                      ✗
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Piece Tray + Mini Reference */}
        <div className="w-full max-w-[360px] flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1C1917]">
                Réserve ({trayIds.length} restantes)
              </h2>
              <img
                src={previewUrl}
                alt={scene.title}
                className="w-14 h-14 rounded-lg border border-[#D6D0C4] object-cover"
              />
            </div>

            {trayIds.length === 0 ? (
              <p className="text-sm text-[#57534E] py-4 text-center">
                Toutes les pièces sont posées ! Cliquez sur deux pièces du plateau pour les échanger si besoin.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
                {trayIds.map((pid) => {
                  const piece = pieces[pid];
                  const isSel = selectedPieceId === pid;
                  const rot = rotations[pid] ?? 0;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => {
                        soundFX.click();
                        if (isSel && allowRotation) {
                          rotateSelected();
                        } else {
                          setSelectedPieceId(pid);
                        }
                      }}
                      className={`aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSel
                          ? 'ring-3 ring-[#1E6B52] border-[#1E6B52] scale-105'
                          : 'border-[#D6D0C4] hover:border-[#1E6B52]'
                      }`}
                    >
                      <img
                        src={piece.dataUrl}
                        alt={`Pièce réserve ${pid + 1}`}
                        style={{ transform: `rotate(${rot}deg)` }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Touchez une pièce de la réserve puis cliquez sur sa case sur le plateau.
            {allowRotation
              ? ' En mode Difficile et Expert, utilisez « Pivoter 90° » ou retouchez une pièce sélectionnée pour la tourner.'
              : ''}
          </p>
        </div>
      </div>
    </GameLayout>
  );
};
