import React, { useRef } from 'react';
import { Camera, Heart, RotateCcw } from 'lucide-react';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  GAMES_CATALOG,
  GameId,
} from '../types/games';
import { DailyStats, getDailyMessage } from '../utils/dailyMessages';
import { soundFX } from '../utils/sound';
import { GameIcon } from './GameIcons';
import { HomeIllustration } from './HomeIllustration';

interface HomePageProps {
  onStartGame: (gameId: GameId, difficulty: Difficulty) => void;
  selectedDifficulties: Record<GameId, Difficulty>;
  onSelectDifficulty: (gameId: GameId, difficulty: Difficulty) => void;
  customPhoto: string | null;
  onSavePhoto: (dataUrl: string | null) => void;
  stats: DailyStats;
}

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile', 'expert'];

export const HomePage: React.FC<HomePageProps> = ({
  onStartGame,
  selectedDifficulties,
  onSelectDifficulty,
  customPhoto,
  onSavePhoto,
  stats,
}) => {
  const daily = getDailyMessage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          onSavePhoto(canvas.toDataURL('image/jpeg', 0.82));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
      {/* Hero Section: Bonjour Christiane + Daily Message + Modern Home Photo */}
      <section className="bg-white border border-[#E5E0D8] rounded-3xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-6">
            <div>
              <div className="text-sm font-medium text-[#78716C] flex flex-wrap items-center gap-2">
                <span>{daily.formattedDate}</span>
                <span aria-hidden="true">·</span>
                <span>À la maison</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#1C1917] mt-3 leading-tight [text-wrap:balance]">
                Bonjour Christiane
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#44403C] leading-relaxed max-w-2xl">
                {daily.message}
              </p>

              <p className="mt-4 inline-flex items-center gap-2 font-display text-xl font-semibold text-[#1E6B52]">
                <span>{daily.signature}</span>
                <Heart className="w-4 h-4 fill-[#1E6B52] text-[#1E6B52]" aria-hidden="true" />
              </p>
            </div>

            <div className="pt-5 border-t border-[#ECE7DF] flex flex-wrap items-center justify-between gap-4 text-sm text-[#57534E]">
              <div className="flex flex-wrap items-center gap-2 tabular-nums">
                <span>
                  <strong className="text-[#1C1917]">{stats.winsToday}</strong> partie
                  {stats.winsToday > 1 ? 's' : ''} gagnée{stats.winsToday > 1 ? 's' : ''} aujourd’hui
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-[#1C1917]">{stats.totalWins}</strong> au total
                </span>
                <span aria-hidden="true">·</span>
                <span>9 jeux gratuits, sans compte ni cloud</span>
              </div>
            </div>
          </div>

          {/* House Photo / Sunlit Modern Home Panel */}
          <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full bg-[#EFECE6]">
            <HomeIllustration customPhoto={customPhoto} />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {customPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.click();
                    onSavePhoto(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-xs font-semibold text-[#44403C] shadow-sm border border-[#E5E0D8] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Image par défaut</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundFX.click();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-xs font-semibold text-[#1C1917] shadow-sm border border-[#E5E0D8] cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#1E6B52]" />
                <span>{customPhoto ? 'Changer la photo' : 'Mettre ma photo de maison'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* All 9 Games Grid */}
      <section id="les-jeux" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Vos 9 jeux du salon
            </h2>
            <p className="text-sm text-[#57534E] mt-1">
              Choisissez la difficulté qui vous plaît, puis appuyez sur Jouer : chaque grille est entièrement nouvelle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES_CATALOG.map((game) => {
            const currentDiff = selectedDifficulties[game.id];
            const wonToday = stats.gamesWonIds.includes(game.id);

            return (
              <article
                key={game.id}
                className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-[#C8C0B4] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-2xl bg-[#F7F5F0] border border-[#ECE7DF] shrink-0">
                    <GameIcon gameId={game.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#78716C]">
                      <span>{game.category}</span>
                      {wonToday && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#1E6B52] font-semibold">Réussi ✓</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#1C1917] mt-0.5">
                      {game.title}
                    </h3>
                    <p className="text-sm text-[#44403C] mt-1 leading-snug">{game.subtitle}</p>
                  </div>
                </div>

                {/* Difficulty Picker + Play Button */}
                <div className="pt-3.5 border-t border-[#ECE7DF] space-y-3">
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#F4F1EA] rounded-xl">
                    {DIFFICULTIES.map((d) => {
                      const active = currentDiff === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            soundFX.click();
                            onSelectDifficulty(game.id, d);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer text-center ${
                            active
                              ? 'bg-white text-[#1E6B52] shadow-2xs'
                              : 'text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          {DIFFICULTY_LABELS[d]}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-[#78716C] min-h-[32px] leading-snug">
                    {game.difficulties[currentDiff]}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.click();
                      onStartGame(game.id, currentDiff);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1E6B52] hover:bg-[#175440] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Jouer en {DIFFICULTY_LABELS[currentDiff]}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Helpful Guide Section */}
      <section
        id="conseils"
        className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-7"
      >
        <div className="space-y-2 max-w-3xl">
          <h2 className="font-display text-xl font-semibold text-[#1C1917]">
            Des indices clairs qui respectent votre partie
          </h2>
          <p className="text-sm text-[#44403C] leading-relaxed">
            À tout moment, <strong>Vérifier</strong> vous indique si une case est fausse sans rien effacer, et <strong>Indice</strong> vous explique la règle logique applicable ici (ou vous montre une piste utile). Tout fonctionne directement chez vous, 100 % gratuitement et sans connexion au cloud.
          </p>
        </div>
      </section>
    </div>
  );
};
