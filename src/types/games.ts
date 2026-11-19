export type GameId =
  | 'sudoku'
  | 'mots-meles'
  | 'mots-codes'
  | 'chats'
  | 'mahjong'
  | 'points-relier'
  | 'bloc-blast'
  | 'puzzle'
  | 'tetris';

export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'expert';

export interface GameCatalogEntry {
  id: GameId;
  title: string;
  subtitle: string;
  category: string;
  rules: string[];
  difficulties: Record<Difficulty, string>;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
  expert: 'Expert',
};

export const GAMES_CATALOG: GameCatalogEntry[] = [
  {
    id: 'sudoku',
    title: 'Sudoku',
    subtitle: 'Complétez la grille de 1 à 9 par pure déduction.',
    category: 'Logique chiffrée',
    rules: [
      'Chaque ligne, chaque colonne et chaque carré 3×3 contient les chiffres de 1 à 9 une seule fois.',
      'Activez « Notes » pour noter vos pistes au crayon sans rien effacer.',
      'Le bouton Indice vous explique la déduction logique exacte (ligne, colonne ou carré) sans tout casser.',
    ],
    difficulties: {
      facile: '44 chiffres donnés — idéal pour jouer en toute détente.',
      moyen: '33 chiffres donnés — réflexion classique équilibrée.',
      difficile: '25 chiffres donnés — demande de croiser les pistes.',
      expert: '20 chiffres donnés — véritable défi de maître.',
    },
  },
  {
    id: 'chats',
    title: 'Les Chats',
    subtitle: 'Un seul chat par ligne, colonne et couleur, sans jamais deviner.',
    category: 'Déduction pure',
    rules: [
      'Placez 1 chat dans chaque ligne, chaque colonne et chaque zone de couleur.',
      'Deux chats ne peuvent jamais se toucher, même en diagonale.',
      'Chaque grille est vérifiée pour être résolue étape par étape sans hasard : l’indice vous explique la règle applicable ici !',
    ],
    difficulties: {
      facile: 'Grille 6×6 · 1 chat offert pour démarrer en confiance.',
      moyen: 'Grille 7×7 · déductions directes par lignes et couleurs.',
      difficile: 'Grille 8×8 · exige de repérer les alignements dans les zones.',
      expert: 'Grille 9×9 · grande grille complexe à solution 100 % logique.',
    },
  },
  {
    id: 'mahjong',
    title: 'Mahjong',
    subtitle: 'Associez les paires de tuiles libres pour vider la pyramide.',
    category: 'Observation & calme',
    rules: [
      'Touchez deux tuiles identiques pour les retirer du plateau.',
      'Une tuile est libre si aucune tuile ne repose dessus et qu’au moins un côté (gauche ou droite) est dégagé.',
      'Chaque plateau est généré à l’envers pour garantir qu’il existe toujours une solution complète.',
    ],
    difficulties: {
      facile: '36 tuiles (18 paires) · 2 étages bien dégagés.',
      moyen: '64 tuiles (32 paires) · 3 étages classiques.',
      difficile: '96 tuiles (48 paires) · 4 étages serrés.',
      expert: '136 tuiles (68 paires) · grande pyramide à 5 étages.',
    },
  },
  {
    id: 'mots-meles',
    title: 'Mots Mêlés',
    subtitle: 'Dénichez tous les mots cachés dans la grille.',
    category: 'Jeu de lettres',
    rules: [
      'Glissez sur les lettres d’un mot, ou touchez sa première puis sa dernière lettre.',
      'Les directions s’enrichissent selon la difficulté (diagonales et sens inversés).',
      'L’indice progressif vous donne d’abord la direction, puis la zone, puis la première lettre.',
    ],
    difficulties: {
      facile: 'Grille 8×8 · 6 mots simples (horizontal et vertical).',
      moyen: 'Grille 11×11 · 10 mots avec diagonales.',
      difficile: 'Grille 14×14 · 15 mots dans tous les sens, même à l’envers.',
      expert: 'Grille 17×17 · 20 mots serrés dans les 8 directions.',
    },
  },
  {
    id: 'mots-codes',
    title: 'Mots Codés',
    subtitle: 'Déchiffrez la grille croisée : 1 chiffre = 1 lettre.',
    category: 'Déduction verbale',
    rules: [
      'Chaque numéro (1 à 26) correspond toujours à la même lettre partout dans la grille.',
      'Touchez une case pour illuminer tous les numéros identiques, puis choisissez sa lettre.',
      'Vérifier souligne uniquement les lettres fausses en rouge sans effacer le reste.',
    ],
    difficulties: {
      facile: 'Grille 9×9 · 5 lettres offertes au départ.',
      moyen: 'Grille 11×11 · 3 lettres offertes.',
      difficile: 'Grille 12×12 · 2 lettres offertes.',
      expert: 'Grille 13×13 · 1 seule lettre offerte au départ.',
    },
  },
  {
    id: 'points-relier',
    title: 'Points à Relier',
    subtitle: 'Reliez les points de même couleur sans jamais croiser les fils.',
    category: 'Parcours logique',
    rules: [
      'Reliez chaque paire de points numérotés par un tracé continu.',
      'Les fils ne peuvent pas se croiser et toute la grille doit être remplie.',
      'Vérifier vous prévient si l’un de vos fils bloque le passage d’une autre couleur.',
    ],
    difficulties: {
      facile: 'Grille 5×5 · 4 paires faciles à visualiser.',
      moyen: 'Grille 6×6 · 5 à 6 paires équilibrées.',
      difficile: 'Grille 7×7 · 7 paires sinueuses.',
      expert: 'Grille 9×9 · 8 à 10 paires très entrelacées.',
    },
  },
  {
    id: 'bloc-blast',
    title: 'Bloc Blast',
    subtitle: 'Assemblez les blocs pour vider lignes et colonnes.',
    category: 'Stratégie spatiale',
    rules: [
      'Choisissez une pièce et posez-la sur le plateau (la case cliquée place son coin haut-gauche).',
      'L’aperçu rouge vous avertit tout de suite si l’emplacement est impossible.',
      'Complétez des lignes ou colonnes entières pour marquer des points bonus.',
    ],
    difficulties: {
      facile: 'Plateau 8×8 · petites pièces simples (objectif 200 pts).',
      moyen: 'Plateau 8×8 · formes variées en T, L et barres (objectif 450 pts).',
      difficile: 'Plateau 8×8 · 6 pierres fixes + grandes pièces (objectif 750 pts).',
      expert: 'Plateau 9×9 · 10 obstacles et grands blocs 3×3 (objectif 1100 pts).',
    },
  },
  {
    id: 'puzzle',
    title: 'Puzzle',
    subtitle: 'Reconstituez nos 6 tableaux illustrés pièce par pièce.',
    category: 'Observation',
    rules: [
      'Touchez une pièce dans la réserve puis son emplacement sur le plateau (ou échangez deux pièces posées).',
      'En mode Difficile et Expert, il faut aussi pivoter certaines pièces à 90°.',
      'Activez « Modèle en fond » pour vous aider, ou « Vérifier » pour voir quelles pièces sont mal placées.',
    ],
    difficulties: {
      facile: '9 grandes pièces (3×3) · orientation fixe.',
      moyen: '16 pièces (4×4) · orientation fixe.',
      difficile: '25 pièces (5×5) · avec rotation à 90°.',
      expert: '36 fines pièces (6×6) · avec rotation et découpe serrée.',
    },
  },
  {
    id: 'tetris',
    title: 'Tétris',
    subtitle: 'Orientez les pièces qui tombent pour libérer des lignes.',
    category: 'Réflexes & placement',
    rules: [
      'Utilisez les gros boutons tactiles ou les flèches du clavier pour déplacer et tourner les pièces.',
      'Vous pouvez mettre une pièce en Réserve pour l’utiliser plus tard.',
      'Demandez « Meilleur placement » pour voir la position idéale en doré tout en bas.',
    ],
    difficulties: {
      facile: 'Chute lente et sereine · 2 pièces suivantes affichées.',
      moyen: 'Vitesse classique · 1 pièce suivante.',
      difficile: 'Chute soutenue · demande de beaux réflexes.',
      expert: 'Chute rapide + 4 lignes déjà encombrées dès le départ.',
    },
  },
];

export interface FeedbackState {
  type: 'error' | 'hint' | 'success' | 'info';
  message: string;
}
