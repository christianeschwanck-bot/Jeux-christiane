import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { HomePage } from './components/HomePage';
import { BlocBlastGame } from './games/BlocBlastGame';
import { ChatsGame } from './games/ChatsGame';
import { MahjongGame } from './games/MahjongGame';
import { MotsCodesGame } from './games/MotsCodesGame';
import { MotsMelesGame } from './games/MotsMelesGame';
import { PointsRelierGame } from './games/PointsRelierGame';
import { PuzzleGame } from './games/PuzzleGame';
import { SudokuGame } from './games/SudokuGame';
import { TetrisGame } from './games/TetrisGame';
import { Difficulty, GAMES_CATALOG, GameId } from './types/games';
import {
  DailyStats,
  getSavedHomePhoto,
  getStats,
  recordGameWin,
  saveHomePhoto,
} from './utils/dailyMessages';
import { isSoundEnabled, setSoundEnabled, soundFX } from './utils/sound';

const INITIAL_DIFFICULTIES: Record<GameId, Difficulty> = {
  sudoku: 'moyen',
  chats: 'moyen',
  mahjong: 'moyen',
  'mots-meles': 'moyen',
  'mots-codes': 'moyen',
  'points-relier': 'moyen',
  'bloc-blast': 'moyen',
  puzzle: 'moyen',
  tetris: 'moyen',
};

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [difficulties, setDifficulties] =
    useState<Record<GameId, Difficulty>>(INITIAL_DIFFICULTIES);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [customPhoto, setCustomPhoto] = useState<string | null>(() => getSavedHomePhoto());
  const [stats, setStats] = useState<DailyStats>(() => getStats());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) soundFX.click();
  };

  const handleStartGame = (gameId: GameId, diff: Difficulty) => {
    setDifficulties((prev) => ({ ...prev, [gameId]: diff }));
    setActiveGame(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeDifficulty = (gameId: GameId, diff: Difficulty) => {
    setDifficulties((prev) => ({ ...prev, [gameId]: diff }));
  };

  const handleWin = (gameId: string) => {
    setStats(recordGameWin(gameId));
  };

  const handleSavePhoto = (dataUrl: string | null) => {
    saveHomePhoto(dataUrl);
    setCustomPhoto(dataUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar */}
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => {
              soundFX.click();
              setActiveGame(null);
            }}
            className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Le Salon de Christiane
          </button>

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]"
          >
            <button
              type="button"
              onClick={() => {
                soundFX.click();
                setActiveGame(null);
              }}
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Accueil
            </button>
            {GAMES_CATALOG.slice(0, 4).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleStartGame(g.id, difficulties[g.id])}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeGame === g.id
                    ? 'text-[#1E6B52] font-semibold'
                    : 'hover:text-[#1C1917]'
                }`}
              >
                {g.title}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] hover:bg-[#EDE8DF] text-xs font-semibold text-[#1C1917] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#1E6B52]" />
                  <span>Son activé</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-[#78716C]" />
                  <span>Son coupé</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeGame === null ? (
          <HomePage
            onStartGame={handleStartGame}
            selectedDifficulties={difficulties}
            onSelectDifficulty={handleChangeDifficulty}
            customPhoto={customPhoto}
            onSavePhoto={handleSavePhoto}
            stats={stats}
          />
        ) : activeGame === 'sudoku' ? (
          <SudokuGame
            difficulty={difficulties.sudoku}
            onChangeDifficulty={(d) => handleChangeDifficulty('sudoku', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'chats' ? (
          <ChatsGame
            difficulty={difficulties.chats}
            onChangeDifficulty={(d) => handleChangeDifficulty('chats', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'mahjong' ? (
          <MahjongGame
            difficulty={difficulties.mahjong}
            onChangeDifficulty={(d) => handleChangeDifficulty('mahjong', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'mots-meles' ? (
          <MotsMelesGame
            difficulty={difficulties['mots-meles']}
            onChangeDifficulty={(d) => handleChangeDifficulty('mots-meles', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'mots-codes' ? (
          <MotsCodesGame
            difficulty={difficulties['mots-codes']}
            onChangeDifficulty={(d) => handleChangeDifficulty('mots-codes', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'points-relier' ? (
          <PointsRelierGame
            difficulty={difficulties['points-relier']}
            onChangeDifficulty={(d) => handleChangeDifficulty('points-relier', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'bloc-blast' ? (
          <BlocBlastGame
            difficulty={difficulties['bloc-blast']}
            onChangeDifficulty={(d) => handleChangeDifficulty('bloc-blast', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : activeGame === 'puzzle' ? (
          <PuzzleGame
            difficulty={difficulties.puzzle}
            onChangeDifficulty={(d) => handleChangeDifficulty('puzzle', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        ) : (
          <TetrisGame
            difficulty={difficulties.tetris}
            onChangeDifficulty={(d) => handleChangeDifficulty('tetris', d)}
            onBackHome={() => setActiveGame(null)}
            onWin={handleWin}
          />
        )}
      </main>

      <footer className="border-t border-[#E5E0D8] py-5 text-center text-xs text-[#78716C]">
        Fait avec tendresse pour Christiane — Bisous d’Anto · 100 % gratuit &amp; hors-ligne
      </footer>
    </div>
  );
}
