import React from 'react';
import { GameId } from '../types/games';

export const GameIcon: React.FC<{ gameId: GameId }> = ({ gameId }) => {
  switch (gameId) {
    case 'sudoku':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#1E6B52" strokeWidth="2.5" />
          <line x1="23" y1="4" x2="23" y2="60" stroke="#1E6B52" strokeWidth="2" />
          <line x1="41" y1="4" x2="41" y2="60" stroke="#1E6B52" strokeWidth="2" />
          <line x1="4" y1="23" x2="60" y2="23" stroke="#1E6B52" strokeWidth="2" />
          <line x1="4" y1="41" x2="60" y2="41" stroke="#1E6B52" strokeWidth="2" />
          <text x="13.5" y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1C1917">9</text>
          <text x="32" y="37" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1E6B52">4</text>
          <text x="50.5" y="55" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1C1917">7</text>
        </svg>
      );
    case 'mahjong':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          {/* Back stacked tile */}
          <rect x="14" y="8" width="38" height="46" rx="6" fill="#0F766E" />
          <rect x="14" y="6" width="38" height="44" rx="6" fill="#FAF7F0" stroke="#CBD5E1" strokeWidth="2" />
          {/* Front stacked tile */}
          <rect x="10" y="14" width="38" height="44" rx="6" fill="#1E6B52" />
          <rect x="10" y="11" width="38" height="43" rx="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
          {/* Bamboo / Blossom emblem */}
          <circle cx="29" cy="32" r="10" fill="#DCFCE7" stroke="#1E6B52" strokeWidth="2" />
          <circle cx="29" cy="32" r="4" fill="#DC2626" />
          <line x1="29" y1="22" x2="29" y2="26" stroke="#1E6B52" strokeWidth="2" strokeLinecap="round" />
          <line x1="29" y1="38" x2="29" y2="42" stroke="#1E6B52" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'mots-meles':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#C86D51" strokeWidth="2.5" />
          <rect x="10" y="13" width="44" height="14" rx="7" fill="#C86D51" opacity="0.22" />
          <text x="16" y="24" fontSize="11" fontWeight="700" fill="#9A3412">M O T</text>
          <text x="16" y="40" fontSize="11" fontWeight="600" fill="#57534E">S A L</text>
          <text x="16" y="54" fontSize="11" fontWeight="600" fill="#57534E">J E U</text>
        </svg>
      );
    case 'mots-codes':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#3B6E8C" strokeWidth="2.5" />
          <rect x="10" y="12" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <text x="14" y="20" fontSize="7" fontWeight="700" fill="#3B6E8C">12</text>
          <text x="20" y="29" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1C1917">A</text>
          <rect x="34" y="12" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <text x="38" y="20" fontSize="7" fontWeight="700" fill="#3B6E8C">07</text>
          <text x="44" y="29" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1C1917">M</text>
          <rect x="10" y="35" width="20" height="20" rx="4" fill="#1C1917" />
          <rect x="34" y="35" width="20" height="20" rx="4" fill="#E0F2FE" stroke="#3B6E8C" strokeWidth="1.5" />
          <text x="38" y="43" fontSize="7" fontWeight="700" fill="#3B6E8C">12</text>
          <text x="44" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E40AF">A</text>
        </svg>
      );
    case 'chats':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
          <rect x="32" y="4" width="28" height="28" rx="4" fill="#DBEAFE" opacity="0.7" />
          <rect x="4" y="32" width="28" height="28" rx="4" fill="#DCFCE7" opacity="0.8" />
          <circle cx="32" cy="35" r="14" fill="#EA580C" />
          <polygon points="20,27 21,15 29,23" fill="#EA580C" />
          <polygon points="44,27 43,15 35,23" fill="#EA580C" />
          <circle cx="27" cy="34" r="2" fill="#FFFFFF" />
          <circle cx="37" cy="34" r="2" fill="#FFFFFF" />
          <polygon points="30,38 34,38 32,41" fill="#FDE68A" />
        </svg>
      );
    case 'points-relier':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#0F766E" strokeWidth="2.5" />
          <path d="M16 18 H46 V46" fill="none" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 46 H30 V32 H46" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="18" r="5" fill="#DC2626" />
          <circle cx="46" cy="46" r="5" fill="#DC2626" />
          <circle cx="16" cy="46" r="5" fill="#2563EB" />
          <circle cx="46" cy="32" r="5" fill="#2563EB" />
        </svg>
      );
    case 'bloc-blast':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#7C3AED" strokeWidth="2.5" />
          <rect x="11" y="13" width="13" height="13" rx="3" fill="#7C3AED" />
          <rect x="26" y="13" width="13" height="13" rx="3" fill="#7C3AED" />
          <rect x="26" y="28" width="13" height="13" rx="3" fill="#7C3AED" />
          <rect x="41" y="28" width="13" height="13" rx="3" fill="#F59E0B" />
          <rect x="11" y="43" width="13" height="13" rx="3" fill="#10B981" />
          <rect x="26" y="43" width="13" height="13" rx="3" fill="#10B981" />
          <rect x="41" y="43" width="13" height="13" rx="3" fill="#10B981" />
        </svg>
      );
    case 'puzzle':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#F4F1EA" stroke="#B45309" strokeWidth="2.5" />
          <path d="M12 12 H31 V20 A4 4 0 1 1 31 28 V32 H23 A4 4 0 1 0 15 32 H12 Z" fill="#D97706" opacity="0.85" />
          <path d="M33 12 H52 V32 H44 A4 4 0 1 1 36 32 H33 V28 A4 4 0 1 0 33 20 Z" fill="#1E6B52" opacity="0.85" />
          <path d="M12 34 H15 A4 4 0 1 1 23 34 H31 V42 A4 4 0 1 0 31 50 V52 H12 Z" fill="#3B82F6" opacity="0.75" />
          <path d="M33 34 H36 A4 4 0 1 0 44 34 H52 V52 H33 V50 A4 4 0 1 1 33 42 Z" fill="#F43F5E" opacity="0.75" />
        </svg>
      );
    case 'tetris':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="13" y="13" width="12" height="12" rx="2" fill="#38BDF8" />
          <rect x="26" y="13" width="12" height="12" rx="2" fill="#38BDF8" />
          <rect x="39" y="13" width="12" height="12" rx="2" fill="#38BDF8" />
          <rect x="26" y="26" width="12" height="12" rx="2" fill="#38BDF8" />
          <rect x="13" y="41" width="12" height="12" rx="2" fill="#F59E0B" />
          <rect x="26" y="41" width="12" height="12" rx="2" fill="#F59E0B" />
          <rect x="39" y="41" width="12" height="12" rx="2" fill="#10B981" />
        </svg>
      );
  }
};
