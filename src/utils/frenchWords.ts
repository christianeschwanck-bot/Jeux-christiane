export interface WordTheme {
  id: string;
  label: string;
  words: string[];
}

export const FRENCH_WORD_THEMES: WordTheme[] = [
  {
    id: 'maison',
    label: 'La Maison',
    words: [
      'SALON', 'CUISINE', 'CHAMBRE', 'CANAPE', 'FAUTEUIL', 'RIDEAU', 'TAPIS',
      'LAMPE', 'TABLE', 'CHAISE', 'FENETRE', 'PORTE', 'ESCALIER', 'GRENIER',
      'VERANDA', 'TERRASSE', 'COUSSIN', 'MIROIR', 'HORLOGE', 'BOUGIE',
      'ARMOIRE', 'BIBLIOTHEQUE', 'PLANTE', 'PARQUET', 'CHEMINEE', 'BALCON',
    ],
  },
  {
    id: 'jardin',
    label: 'Au Jardin',
    words: [
      'LAVANDE', 'ROSIER', 'OLIVIER', 'TULIPE', 'JASMIN', 'Pivoine'.toUpperCase(),
      'PELOUSE', 'ARROSOIR', 'RATEAU', 'BECASSINE', 'PAPILLON', 'ABEILLE',
      'OISEAU', 'CERISIER', 'TOMATE', 'BASILIC', 'MENTHE', 'ROMARIN',
      'SOLEIL', 'OMBRE', 'CABANE', 'TONNELLE', 'ORCHIDEE', 'LILAS', 'MUGUET',
    ],
  },
  {
    id: 'cuisine',
    label: 'Gourmandises',
    words: [
      'BRIOCHE', 'CROISSANT', 'TARTE', 'GATEAU', 'CHOCOLAT', 'VANILLE',
      'CARAMEL', 'FRAMBOISE', 'ABRICOT', 'CITRON', 'PRALINE', 'NOISETTE',
      'CAFÉ'.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 'TISANE',
      'CONFITURE', 'MIEL', 'BEURRE', 'FARINE', 'CREPE', 'MADELEINE',
      'CANELLE', 'PISTACHE', 'SORBET', 'COMPOTE', 'CLAFOUTIS', 'SABLE',
    ],
  },
  {
    id: 'animaux',
    label: 'Les Animaux',
    words: [
      'CHATON', 'MINOU', 'CHIOT', 'LAPIN', 'HERISSON', 'ECUREUIL',
      'MESANGE', 'ROUGE', 'COLOMBE', 'TORTUE', 'DAUPHIN', 'BALEINE',
      'RENARD', 'CHEVREUIL', 'HIBOU', 'PANDA', 'KOALA', 'GIRAFE',
      'ELEPHANT', 'PANTHERE', 'LOUTRE', 'CYGNE', 'CANARD', 'MOUTON',
    ],
  },
  {
    id: 'nature',
    label: 'Nature & Voyages',
    words: [
      'MONTAGNE', 'RIVIERE', 'OCEAN', 'PLAGE', 'FALAISE', 'SENTIER',
      'FORET', 'PRAIRIE', 'NUAGE', 'ARCENCIEL', 'ETOILE', 'LUNE',
      'PRINTEMPS', 'AUTOMNE', 'HORIZON', 'VOYAGE', 'VALISE', 'TRAIN',
      'BATEAU', 'PHARE', 'VILLAGE', 'CHATEAU', 'MOULIN', 'COLLINE',
    ],
  },
  {
    id: 'musique',
    label: 'Arts & Douceur',
    words: [
      'PIANO', 'VIOLON', 'GUITARE', 'MELODIE', 'CHANSON', 'POEME',
      'ROMAN', 'PEINTURE', 'AQUARELLE', 'PINCEAU', 'TOILE', 'COULEUR',
      'THEATRE', 'CINEMA', 'DESSIN', 'SCULPTURE', 'CONCERT', 'VALSE',
      'REFRAIN', 'ALBUM', 'SOUVENIR', 'SOURIRE', 'BONHEUR', 'TENDRESSE',
    ],
  },
];

// Curated 4 to 8 letter uppercase French words (A-Z only) for interlocking Mots Codés crosswords
export const CODEWORD_DICTIONARY: string[] = Array.from(
  new Set([
    'MAISON', 'SALON', 'JARDIN', 'SOLEIL', 'MATIN', 'FLEUR', 'ARBRE', 'OMBRE',
    'TABLE', 'CHAISE', 'LAMPE', 'PORTE', 'VERRE', 'TASSE', 'LIVRE', 'PAGE',
    'CHAT', 'CHATON', 'OISEAU', 'LAPIN', 'MERLE', 'CYGNE', 'RENARD', 'TORTUE',
    'ROSIER', 'LILAS', 'TULIPE', 'JASMIN', 'OLIVE', 'VIGNE', 'HERBE', 'FEUILLE',
    'FRUIT', 'POMME', 'POIRE', 'CERISE', 'PECHE', 'MELON', 'CITRON', 'ORANGE',
    'FRAISE', 'RAISIN', 'NOIX', 'MIEL', 'SUCRE', 'PAIN', 'TARTE', 'CREME',
    'BEURRE', 'FARINE', 'SOUPE', 'SALADE', 'TOMATE', 'CAROTTE', 'RADIS', 'POIVRE',
    'SEL', 'HUILE', 'VINAIGRE', 'FROMAGE', 'LAIT', 'CAFE', 'THE', 'TISANE',
    'GATEAU', 'BRIOCHE', 'CREPE', 'GALETTE', 'GLACE', 'VANILLE', 'CACAO', 'PRALINE',
    'PIANO', 'VIOLON', 'FLUTE', 'HARPE', 'CHANT', 'NOTE', 'VALSE', 'DANSE',
    'POEME', 'CONTE', 'ROMAN', 'LETTRE', 'PLUME', 'ENCRE', 'PAPIER', 'ALBUM',
    'TOILE', 'DESSIN', 'CADRE', 'IMAGE', 'PHOTO', 'COULEUR', 'BLEU', 'ROUGE',
    'VERT', 'JAUNE', 'BLANC', 'NOIR', 'GRIS', 'ROSE', 'VIOLET', 'DORE',
    'NUAGE', 'PLUIE', 'NEIGE', 'VENT', 'BRISE', 'ORAGE', 'CIEL', 'ASTRE',
    'LUNE', 'ETOILE', 'TERRE', 'SABLE', 'ROCHE', 'PIERRE', 'GALET', 'SOURCE',
    'RIVIERE', 'LAC', 'ETANG', 'MER', 'VAGUE', 'PLAGE', 'ILE', 'PHARE',
    'BATEAU', 'VOILE', 'PORT', 'QUAI', 'PONT', 'ROUTE', 'CHEMIN', 'SENTIER',
    'TRAIN', 'GARE', 'VELO', 'AVION', 'VALISE', 'CARTE', 'NORD', 'SUD',
    'EST', 'OUEST', 'MATIN', 'MIDI', 'SOIR', 'NUIT', 'HEURE', 'JOUR',
    'MOIS', 'ANNEE', 'SAISON', 'HIVER', 'ETE', 'AUTOMNE', 'AVRIL', 'MAI',
    'JUIN', 'AOUT', 'AMIE', 'FAMILLE', 'COEUR', 'JOIE', 'RIRE', 'SOURIRE',
    'CALME', 'PAIX', 'DOUCEUR', 'REVE', 'ESPOIR', 'CHANCE', 'MERCI', 'BRAVO',
    'BONJOUR', 'CADEAU', 'TRESOR', 'BIJOU', 'PERLE', 'RUBIS', 'AMBRE', 'OR',
    'ARGENT', 'CUIVRE', 'BOIS', 'CHENE', 'PIN', 'SAPIN', 'SAULE', 'BOULEAU',
    'LAINE', 'COTON', 'SOIE', 'LIN', 'VELOURS', 'DRAP', 'RIDEAU', 'TAPIS',
    'MIROIR', 'HORLOGE', 'BOUGIE', 'VASE', 'POT', 'BOL', 'ASSIETTE', 'COUTEAU',
    'CUILLERE', 'FOURCHETTE', 'NAPPE', 'SERVIETTE', 'TABLIER', 'FOUR', 'POELE',
    'BOUQUET', 'COURONNE', 'GUIRLANDE', 'LANTERNE', 'CLAIRE', 'DOUX', 'BELLE',
    'GRAND', 'PETIT', 'JEUNE', 'VIEUX', 'NEUF', 'PROPRE', 'CHAUD', 'FROID',
    'TIEDE', 'LEGER', 'LOURD', 'RAPIDE', 'LENT', 'FORT', 'TENDRE', 'VRAI',
    'JUSTE', 'SIMPLE', 'UTILE', 'GENTIL', 'JOYEUX', 'SEREIN', 'VIVANT', 'LIBRE',
  ])
).filter((w) => w.length >= 4 && w.length <= 8 && /^[A-Z]+$/.test(w));
