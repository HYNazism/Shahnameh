import React from 'react';

/**
 * Bespoke inline <svg> Title Emblem Lockup in Tabriz & Herat Persian Miniature style.
 * Combines the Simurgh's golden wings, the Sassanian-Alborz royal crown of Keyumars,
 * and the Sacred Flame of Asha vs. Serpent Horns of Ahriman.
 */
export const TitleEmblemSvg: React.FC = () => (
  <svg
    viewBox="0 0 680 210"
    className="w-full max-w-[600px] h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)]"
    role="img"
    aria-label="Shahnameh: Crown of Ashes and Light — Persian Miniature Emblem"
  >
    <defs>
      <linearGradient id="goldLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
      <linearGradient id="lapisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="50%" stopColor="#172554" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
    </defs>

    {/* Outer Miniature Cartouche Plaque */}
    <path
      d="M 28 38 L 64 14 L 616 14 L 652 38 L 652 172 L 616 196 L 64 196 L 28 172 Z"
      fill="url(#lapisGrad)"
      fillOpacity="0.88"
      stroke="url(#goldLeafGrad)"
      strokeWidth="2.5"
    />
    <path
      d="M 38 44 L 68 22 L 612 22 L 642 44 L 642 166 L 612 188 L 68 188 L 38 166 Z"
      fill="none"
      stroke="#991B1B"
      strokeWidth="1.2"
      strokeDasharray="6 4"
    />

    {/* Simurgh Outspread Feather Wings Left & Right */}
    <g stroke="url(#goldLeafGrad)" strokeWidth="1.6" fill="none" opacity="0.85">
      <path d="M 340 48 C 260 22, 160 28, 86 58 C 145 56, 220 52, 290 64" />
      <path d="M 340 48 C 420 22, 520 28, 594 58 C 535 56, 460 52, 390 64" />
      <path d="M 290 56 C 210 42, 130 56, 74 82" strokeOpacity="0.65" />
      <path d="M 390 56 C 470 42, 550 56, 606 82" strokeOpacity="0.65" />
    </g>

    {/* Centerpiece Crown of Keyumars & Sacred Sadeh Flame */}
    <g transform="translate(340, 42)">
      <circle cx="0" cy="0" r="22" fill="#0B0908" stroke="url(#goldLeafGrad)" strokeWidth="2" />
      {/* Sacred Fire Tongue */}
      <path
        d="M 0 -16 C 9 -6, 12 4, 0 14 C -12 4, -9 -6, 0 -16 Z"
        fill="url(#crimsonGrad)"
        stroke="#FDE68A"
        strokeWidth="1.2"
      />
      <path d="M 0 -9 C 5 -2, 5 5, 0 10 C -5 5, -5 -2, 0 -9 Z" fill="#FDE68A" />
      {/* Crown Spires */}
      <path
        d="M -18 8 L -14 -8 L -6 2 L 0 -12 L 6 2 L 14 -8 L 18 8 Z"
        fill="url(#goldLeafGrad)"
        fillOpacity="0.85"
      />
    </g>

    {/* Persian Calligraphic Kicker */}
    <text
      x="340"
      y="88"
      textAnchor="middle"
      fill="#FDE68A"
      fontSize="14"
      fontFamily="'Cormorant Garamond', Georgia, serif"
      letterSpacing="2"
    >
      شاهنامه فردوسی · عصر کیومرث و آتش سده
    </text>

    {/* Main Display Lockup */}
    <text
      x="340"
      y="132"
      textAnchor="middle"
      fill="url(#goldLeafGrad)"
      fontSize="44"
      fontWeight="800"
      fontFamily="'Cinzel', Georgia, serif"
      letterSpacing="6"
    >
      SHAHNAMEH
    </text>

    {/* Subtitle Lockup */}
    <text
      x="340"
      y="162"
      textAnchor="middle"
      fill="#F5E6C8"
      fontSize="15"
      fontWeight="600"
      fontFamily="'Cinzel', Georgia, serif"
      letterSpacing="4.5"
    >
      CROWN OF ASHES &amp; LIGHT
    </text>

    {/* Decorative Corner Rosettes */}
    <circle cx="56" cy="40" r="5" fill="#D97706" />
    <circle cx="624" cy="40" r="5" fill="#D97706" />
    <circle cx="56" cy="170" r="5" fill="#D97706" />
    <circle cx="624" cy="170" r="5" fill="#D97706" />
  </svg>
);

/**
 * Discrete Farr Vitality Socket SVG with 3 readable states: 'full', 'cracked', 'empty'
 * Matches the in-world Sacred Fire Brazier / Royal Farr pickups 1-to-1.
 */
export const FarrVitalitySocketSvg: React.FC<{ state: 'full' | 'cracked' | 'empty' }> = ({
  state,
}) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
    {/* Dark outer silhouette */}
    <path
      d="M12 2 L20 9 L17 21 L7 21 L4 9 Z"
      fill="#0B0908"
      stroke={state === 'empty' ? '#57534E' : '#F59E0B'}
      strokeWidth="1.8"
    />
    {state === 'full' && (
      <>
        <path d="M12 4.5 L17.5 9.5 L15.2 19 L8.8 19 L6.5 9.5 Z" fill="#DC2626" />
        <path d="M12 6.5 C15 10, 14 15, 12 17.5 C10 15, 9 10, 12 6.5 Z" fill="#FDE68A" />
      </>
    )}
    {state === 'cracked' && (
      <>
        <path d="M12 9 L16.5 11.5 L15 19 L9 19 L7.5 11.5 Z" fill="#991B1B" />
        <path d="M9 6 L13 11 L10 15 L14 19" stroke="#FDE68A" strokeWidth="1.4" fill="none" />
      </>
    )}
    {state === 'empty' && (
      <path d="M12 6 L16 10 L14.5 18 L9.5 18 L8 10 Z" fill="#1C1917" opacity="0.6" />
    )}
  </svg>
);

/**
 * Miniature Portrait SVG in Tabriz & Herat illuminated manuscript style.
 */
export const PortraitMiniatureSvg: React.FC<{
  portraitId: 'keyumars' | 'siamak' | 'hushang' | 'div_siah' | 'soroush';
  className?: string;
}> = ({ portraitId, className = 'w-28 h-28' }) => {
  const isDiv = portraitId === 'div_siah';
  return (
    <svg
      viewBox="0 0 120 120"
      className={`${className} rounded-none border border-[#D97706] bg-[#0F172A] shrink-0`}
      role="img"
      aria-label={`Persian miniature portrait of ${portraitId}`}
    >
      {/* Lapis Lazuli or Crimson Miniature Sky */}
      <rect width="120" height="120" fill={isDiv ? '#1F0909' : '#172554'} />
      {/* Gold-leaf Swirling Clouds */}
      <path
        d="M 10 26 Q 30 14, 52 24 T 98 20"
        stroke="#F59E0B"
        strokeWidth="1.5"
        fill="none"
        opacity="0.65"
      />
      {/* Halo of Royal Farr or Abyssal Ring */}
      <circle
        cx="60"
        cy="56"
        r="34"
        fill={isDiv ? '#7F1D1D' : '#D97706'}
        fillOpacity="0.28"
        stroke={isDiv ? '#EF4444' : '#FDE68A'}
        strokeWidth="2"
      />

      {portraitId === 'keyumars' && (
        <g>
          {/* Leopard-skin Royal Cloak */}
          <path d="M 24 115 C 28 82, 92 82, 96 115 Z" fill="#D97706" stroke="#0B0908" strokeWidth="2" />
          <circle cx="42" cy="98" r="3" fill="#1C1917" />
          <circle cx="58" cy="94" r="3.5" fill="#1C1917" />
          <circle cx="76" cy="100" r="3" fill="#1C1917" />
          {/* Head & Beard */}
          <circle cx="60" cy="56" r="16" fill="#F5E6C8" stroke="#0B0908" strokeWidth="1.5" />
          <path d="M 46 60 Q 60 82, 74 60 Z" fill="#1C1917" />
          {/* Sassanian Crown */}
          <path
            d="M 42 44 L 46 28 L 55 38 L 60 24 L 65 38 L 74 28 L 78 44 Z"
            fill="#FDE68A"
            stroke="#92400E"
            strokeWidth="1.5"
          />
        </g>
      )}

      {portraitId === 'siamak' && (
        <g>
          {/* Crimson & Lapis Prince Tunic */}
          <path d="M 26 115 C 32 84, 88 84, 94 115 Z" fill="#991B1B" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="60" cy="56" r="15" fill="#F5E6C8" stroke="#0B0908" strokeWidth="1.5" />
          {/* Prince Diadem & Plume */}
          <path d="M 44 45 L 76 45 L 74 36 L 46 36 Z" fill="#F59E0B" />
          <path d="M 60 36 Q 75 18, 84 26" stroke="#FDE68A" strokeWidth="3" fill="none" />
        </g>
      )}

      {portraitId === 'hushang' && (
        <g>
          {/* Gold & Crimson Armor with Sadeh Fire */}
          <path d="M 24 115 C 30 80, 90 80, 96 115 Z" fill="#B45309" stroke="#FDE68A" strokeWidth="2" />
          <circle cx="60" cy="56" r="15" fill="#F5E6C8" stroke="#0B0908" strokeWidth="1.5" />
          <path d="M 44 43 L 52 27 L 60 36 L 68 27 L 76 43 Z" fill="#EF4444" stroke="#FDE68A" strokeWidth="1.5" />
          {/* Floating Sadeh Flame */}
          <path d="M 88 64 C 94 52, 98 62, 88 74 C 78 62, 82 52, 88 64 Z" fill="#FDE68A" />
        </g>
      )}

      {portraitId === 'soroush' && (
        <g>
          {/* Emerald & Gold Angel Wings */}
          <path d="M 14 88 Q 30 40, 50 68" fill="#065F46" stroke="#FDE68A" strokeWidth="2" />
          <path d="M 106 88 Q 90 40, 70 68" fill="#065F46" stroke="#FDE68A" strokeWidth="2" />
          <path d="M 28 115 C 34 84, 86 84, 92 115 Z" fill="#047857" stroke="#FDE68A" strokeWidth="2" />
          <circle cx="60" cy="56" r="15" fill="#FDE68A" />
        </g>
      )}

      {portraitId === 'div_siah' && (
        <g>
          {/* Obsidian Demon Shoulders & Horned Visage */}
          <path d="M 18 115 C 24 78, 96 78, 102 115 Z" fill="#1C1917" stroke="#DC2626" strokeWidth="2" />
          <circle cx="60" cy="58" r="18" fill="#292524" stroke="#EF4444" strokeWidth="1.5" />
          {/* Curved Demon Horns */}
          <path d="M 45 45 Q 24 22, 36 16 Q 42 30, 52 42" fill="#F59E0B" />
          <path d="M 75 45 Q 96 22, 84 16 Q 78 30, 68 42" fill="#F59E0B" />
          {/* Glowing Eyes & Tusks */}
          <circle cx="53" cy="55" r="3" fill="#EF4444" />
          <circle cx="67" cy="55" r="3" fill="#EF4444" />
          <path d="M 50 68 L 54 60 L 58 68 M 62 68 L 66 60 L 70 68" fill="#F5E6C8" />
        </g>
      )}

      {/* Inner Gold Miniature Frame */}
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
    </svg>
  );
};
