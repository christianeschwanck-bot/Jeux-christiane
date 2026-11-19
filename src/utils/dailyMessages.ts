const DAILY_MESSAGES: string[] = [
  "Un doux rayon de soleil pour accompagner ton café du matin et quelques parties tranquilles à la maison.",
  "Prends ton temps aujourd’hui : que ce soit un Sudoku ou quelques mots mêlés, c’est ton petit moment à toi.",
  "J’espère que tu passes une très belle journée bien au chaud chez toi. Amuse-toi bien avec tes grilles du jour !",
  "Un petit défi de logique pour garder l’esprit vif tout en douceur. Je pense fort à toi.",
  "Aujourd’hui, toutes les grilles sont toutes neuves rien que pour toi. Choisis ton jeu préféré et profite bien !",
  "Rien ne presse : installe-toi confortablement dans le salon et laisse-toi porter par la partie qui te fait envie.",
  "Que cette journée soit remplie de petits plaisirs, de calme et de belles réussites sur tes jeux.",
  "Si une grille te résiste un peu, n’hésite pas à demander un petit indice, ils sont là pour t’aider avec plaisir.",
  "Une nouvelle journée commence avec de tout nouveaux défis créés spécialement pour toi.",
  "Un grand sourire depuis mon écran jusqu’à ton salon ! Passe une merveilleuse journée.",
  "Que dirais-tu d’une petite partie de Chats ou de Points à Relier pour bien lancer la journée ?",
  "Chaque jour apporte son lot de nouvelles grilles jamais vues. Bonne détente à toi aujourd’hui !",
  "J’ai glissé plein de nouveaux mots et de nouveaux puzzles rien que pour te faire plaisir.",
  "Prends soin de toi aujourd’hui, savoure un bon thé ou un bon café, et régale-toi sur ton jeu du moment.",
  "Même quand on se voit moins, ce petit salon de jeux est toujours là pour te tenir compagnie.",
  "Bravo pour ta curiosité et ta patience sur les niveaux difficiles, tu m’impressionnes toujours !",
  "Aujourd’hui, on joue sans stress : choisis la difficulté qui te convient selon ton humeur.",
  "Une pensée pleine de tendresse pour illuminer ta journée à la maison.",
  "Tu peux changer de niveau à chaque nouvelle partie : doux le matin, coriace l’après-midi !",
  "J’espère que tu vas dénicher tous les mots cachés du premier coup aujourd’hui.",
  "Petit clin d’œil du jour : les petits chats de la grille n’attendent que toi pour trouver leur place.",
  "Un moment de calme, une jolie grille devant soi, il n’en faut pas plus pour passer un bon moment.",
  "Que ta journée soit douce, lumineuse et pleine de petites victoires sur tes puzzles préférés.",
  "Tu as tout le temps qu’il te faut : ici, c’est la maison, on joue à son rythme.",
  "Nouvelle journée, nouveaux tirages aléatoires : aucune partie ne ressemble à celle d’hier !",
  "Je t’envoie plein de bonnes ondes pour ta journée. Profite bien de ton petit coin jeux.",
  "Envie de faire chauffer les méninges ou de poser des blocs tranquillement ? Tout est prêt pour toi.",
  "Un petit mot doux pour te rappeler combien je suis content de t’avoir préparé cet espace.",
  "Laisse les soucis à la porte et accorde-toi une pause bien méritée devant ton jeu favori.",
  "Encore une belle journée qui commence : je te souhaite plein de plaisir sur tes parties.",
  "Les couleurs du Puzzle et les Mots Codés t’attendent sagement. À toi de jouer !",
  "Merci d’être toujours aussi enthousiaste, ça me fait tellement plaisir de te voir jouer.",
  "Un peu de Tétris pour la vivacité ou un Sudoku pour le calme ? Le choix t’appartient !",
  "Plein de soleil dans ta maison aujourd’hui, et bonne chance pour les niveaux experts !",
  "Je te souhaite une journée sereine, joyeuse et pleine de belles trouvailles.",
  "Chaque petite réussite mérite d’être savourée. Amuse-toi bien aujourd’hui !"
];

export function getDailyMessage(date: Date = new Date()): {
  formattedDate: string;
  message: string;
  signature: string;
} {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Deterministic day index so it changes every calendar day and stays consistent all day
  const daySeed = Math.floor(Date.UTC(year, month, day) / 86400000);
  const index = Math.abs(daySeed) % DAILY_MESSAGES.length;

  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const formattedDate = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return {
    formattedDate,
    message: DAILY_MESSAGES[index],
    signature: "Bisous d'Anto",
  };
}

const HOME_PHOTO_KEY = 'christiane_home_photo';
const STATS_KEY = 'christiane_daily_stats';

export function getSavedHomePhoto(): string | null {
  try {
    return localStorage.getItem(HOME_PHOTO_KEY);
  } catch {
    return null;
  }
}

export function saveHomePhoto(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(HOME_PHOTO_KEY, dataUrl);
    } else {
      localStorage.removeItem(HOME_PHOTO_KEY);
    }
  } catch {
    // Ignore quota errors
  }
}

export interface DailyStats {
  dateKey: string;
  winsToday: number;
  totalWins: number;
  gamesWonIds: string[];
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function getStats(): DailyStats {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { dateKey: today, winsToday: 0, totalWins: 0, gamesWonIds: [] };
    }
    const parsed = JSON.parse(raw) as DailyStats;
    if (parsed.dateKey !== today) {
      return {
        dateKey: today,
        winsToday: 0,
        totalWins: parsed.totalWins || 0,
        gamesWonIds: [],
      };
    }
    return parsed;
  } catch {
    return { dateKey: today, winsToday: 0, totalWins: 0, gamesWonIds: [] };
  }
}

export function recordGameWin(gameId: string): DailyStats {
  const current = getStats();
  const next: DailyStats = {
    dateKey: current.dateKey,
    winsToday: current.winsToday + 1,
    totalWins: current.totalWins + 1,
    gamesWonIds: current.gamesWonIds.includes(gameId)
      ? current.gamesWonIds
      : [...current.gamesWonIds, gameId],
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}
