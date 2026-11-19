import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Trophy,
  X,
} from 'lucide-react';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  FeedbackState,
  GAMES_CATALOG,
  GameId,
} from '../types/games';
import { soundFX } from '../utils/sound';

interface GameLayoutProps {
  gameId: GameId;
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onNewGame: () => void;
  onBackHome: () => void;
  onHint?: () => void;
  onCheck?: () => void;
  checkLabel?: string;
  hintLabel?: string;
  feedback?: FeedbackState | null;
  won?: boolean;
  winSummary?: string;
  statsNode?: React.ReactNode;
  children: React.ReactNode;
}

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile', 'expert'];

export const GameLayout: React.FC<GameLayoutProps> = ({
  gameId,
  difficulty,
  onChangeDifficulty,
  onNewGame,
  onBackHome,
  onHint,
  onCheck,
  checkLabel = 'Vérifier',
  hintLabel = 'Indice',
  feedback,
  won = false,
  winSummary,
  statsNode,
  children,
}) => {
  const [showRules, setShowRules] = useState(false);
  const meta = GAMES_CATALOG.find((g) => g.id === gameId)!;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      {/* Unified Top Game Header */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                onBackHome();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F4F1EA] hover:bg-[#EAE5DC] text-[#1C1917] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Accueil</span>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] truncate">
                {meta.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#57534E] truncate">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statsNode}
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                setShowRules((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#F7F5F0] text-sm font-medium text-[#44403C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#1E6B52]" />
              <span>Règles</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                onNewGame();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E6B52] hover:bg-[#175440] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nouvelle grille</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selector + Helper Buttons Bar */}
        <div className="mt-4 pt-4 border-t border-[#ECE7DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#78716C] mr-1">Difficulté :</span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F4F1EA] rounded-xl">
              {DIFFICULTIES.map((d) => {
                const active = d === difficulty;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (d !== difficulty) {
                        soundFX.click();
                        onChangeDifficulty(d);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-[#1E6B52] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCheck && (
              <button
                type="button"
                onClick={onCheck}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#1E6B52]" />
                <span>{checkLabel}</span>
              </button>
            )}
            {onHint && (
              <button
                type="button"
                onClick={onHint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#F59E0B]/30 text-[#92400E] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-[#D97706]" />
                <span>{hintLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Rules Box */}
        {showRules && (
          <div className="mt-4 p-4 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8] animate-pop">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-sm text-[#1C1917] mb-2">
                  Comment jouer — {meta.title} ({DIFFICULTY_LABELS[difficulty]})
                </h2>
                <ul className="space-y-1.5 text-sm text-[#44403C] list-disc pl-5">
                  {meta.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="mt-2.5 text-xs font-medium text-[#1E6B52]">
                  Niveau choisi : {meta.difficulties[difficulty]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                aria-label="Fermer les règles"
                className="p-1.5 rounded-lg hover:bg-[#EAE5DC] text-[#57534E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explicit Feedback Banner (Errors, Hints, Guidance) */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm sm:text-base font-medium animate-pop ${
            feedback.type === 'error'
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              : feedback.type === 'hint'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
              : feedback.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-white border-[#E5E0D8] text-[#1C1917]'
          }`}
        >
          {feedback.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626]" />}
          {feedback.type === 'hint' && <Lightbulb className="w-5 h-5 shrink-0 text-[#D97706]" />}
          {feedback.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#059669]" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Game Surface */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-6 shadow-xs">
        {children}
      </div>

      {/* Victory Banner / Modal Card */}
      {won && (
        <div className="mt-5 bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pop">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E6B52] text-white flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#064E3B]">
                Bravo Christiane ! Partie réussie !
              </h2>
              <p className="text-sm text-[#065F46] mt-0.5">
                {winSummary || `Grille terminée en difficulté ${DIFFICULTY_LABELS[difficulty]}.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {difficulty !== 'expert' && (
              <button
                type="button"
                onClick={() => {
                  soundFX.click();
                  const nextIdx = DIFFICULTIES.indexOf(difficulty) + 1;
                  onChangeDifficulty(DIFFICULTIES[nextIdx]);
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#6EE7B7] text-[#065F46] hover:bg-[#D1FAE5] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Essayer en {DIFFICULTY_LABELS[DIFFICULTIES[DIFFICULTIES.indexOf(difficulty) + 1]]}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                onNewGame();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1E6B52] hover:bg-[#175440] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Rejouer (nouvelle grille)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
