import React from 'react';

interface HomeIllustrationProps {
  customPhoto: string | null;
}

export const HomeIllustration: React.FC<HomeIllustrationProps> = ({ customPhoto }) => {
  if (customPhoto) {
    return (
      <div className="relative w-full h-full min-h-[280px] lg:min-h-[340px] overflow-hidden bg-[#EDE8DF]">
        <img
          src={customPhoto}
          alt="La maison de Christiane"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[280px] lg:min-h-[340px] overflow-hidden bg-[#EFECE6]">
      <svg
        viewBox="0 0 800 520"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Salon moderne lumineux donnant sur le jardin"
      >
        <defs>
          <linearGradient id="skyGarden2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ED5F0" />
            <stop offset="55%" stopColor="#D7EEF9" />
            <stop offset="100%" stopColor="#EFF7EB" />
          </linearGradient>
          <linearGradient id="sunbeam2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF6D1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFF6D1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="oakFloor2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D8BC94" />
            <stop offset="100%" stopColor="#BE9C6F" />
          </linearGradient>
          <linearGradient id="wallLight2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FCF9F4" />
            <stop offset="100%" stopColor="#EAE3D5" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#5A4632" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* Walls & Ceiling Molding */}
        <rect width="800" height="390" fill="url(#wallLight2)" />
        <rect x="0" y="378" width="800" height="12" fill="#E3DACB" />

        {/* Oak Wood Floor */}
        <polygon points="0,390 800,390 800,520 0,520" fill="url(#oakFloor2)" />
        <g stroke="#A88456" strokeWidth="1.5" opacity="0.48">
          <line x1="0" y1="418" x2="800" y2="418" />
          <line x1="0" y1="450" x2="800" y2="450" />
          <line x1="0" y1="485" x2="800" y2="485" />
          <line x1="120" y1="390" x2="90" y2="418" />
          <line x1="340" y1="390" x2="325" y2="418" />
          <line x1="580" y1="390" x2="575" y2="418" />
          <line x1="230" y1="418" x2="205" y2="450" />
          <line x1="480" y1="418" x2="470" y2="450" />
          <line x1="690" y1="418" x2="705" y2="450" />
        </g>

        {/* Large Architectural Bay Window */}
        <rect x="255" y="34" width="490" height="320" rx="6" fill="#2D2722" filter="url(#softShadow)" />
        <rect x="266" y="45" width="228" height="298" fill="url(#skyGarden2)" />
        <rect x="504" y="45" width="230" height="298" fill="url(#skyGarden2)" />

        {/* Soft Clouds & Sun outside */}
        <circle cx="675" cy="95" r="28" fill="#FFF2B2" opacity="0.9" />
        <ellipse cx="355" cy="105" rx="46" ry="16" fill="#FFFFFF" opacity="0.75" />
        <ellipse cx="390" cy="98" rx="34" ry="14" fill="#FFFFFF" opacity="0.75" />

        {/* Garden Trees, Lawn & Flowers */}
        <path d="M266,268 Q365,232 480,258 T734,242 L734,343 L266,343 Z" fill="#81B27A" />
        <path d="M266,302 Q390,278 525,296 T734,285 L734,343 L266,343 Z" fill="#5E915B" />
        <circle cx="322" cy="242" r="40" fill="#4E7E4C" />
        <circle cx="366" cy="252" r="30" fill="#63965F" />
        <circle cx="668" cy="236" r="48" fill="#4B7B49" />
        <circle cx="615" cy="256" r="32" fill="#689B64" />
        <g fill="#A78BFA">
          <circle cx="305" cy="248" r="4" />
          <circle cx="324" cy="236" r="4.5" />
          <circle cx="342" cy="249" r="4" />
          <circle cx="358" cy="258" r="3.5" />
        </g>
        <g fill="#FB7185">
          <circle cx="635" cy="246" r="4.5" />
          <circle cx="658" cy="232" r="5" />
          <circle cx="680" cy="245" r="4.5" />
        </g>

        {/* Window Center Mullion */}
        <rect x="494" y="34" width="10" height="320" fill="#2D2722" />

        {/* Warm Sunbeam */}
        <polygon points="266,45 734,45 595,500 65,500" fill="url(#sunbeam2)" />

        {/* Modern Pendant Lamp */}
        <line x1="168" y1="0" x2="168" y2="75" stroke="#3B322B" strokeWidth="2.5" />
        <path d="M132,110 Q168,68 204,110 Z" fill="#EADAC3" stroke="#CBB799" strokeWidth="2" />
        <ellipse cx="168" cy="112" rx="14" ry="5" fill="#FFF3B0" />

        {/* Framed Botanical Artwork */}
        <rect x="64" y="112" width="136" height="168" rx="4" fill="#4B3C2E" filter="url(#softShadow)" />
        <rect x="72" y="120" width="120" height="152" fill="#FAF8F3" />
        <path d="M132,244 Q130,192 135,148" stroke="#4D7C5D" strokeWidth="2.5" fill="none" />
        <ellipse cx="117" cy="200" rx="15" ry="7.5" transform="rotate(-25 117 200)" fill="#6D9D79" />
        <ellipse cx="149" cy="186" rx="15" ry="7.5" transform="rotate(25 149 186)" fill="#6D9D79" />
        <ellipse cx="119" cy="168" rx="12" ry="6" transform="rotate(-25 119 168)" fill="#85B390" />
        <ellipse cx="146" cy="156" rx="11" ry="5.5" transform="rotate(22 146 156)" fill="#85B390" />

        {/* Indoor Olive Plant */}
        <rect x="690" y="335" width="72" height="68" rx="10" fill="#E3D9C8" filter="url(#softShadow)" />
        <rect x="685" y="328" width="82" height="12" rx="4" fill="#D5C8B3" />
        <path d="M726,328 Q722,245 732,178" stroke="#6E543B" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M727,268 Q696,240 676,208" stroke="#6E543B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M728,236 Q758,214 772,182" stroke="#6E543B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <g fill="#4F7B58">
          <ellipse cx="672" cy="203" rx="17" ry="8.5" transform="rotate(-35 672 203)" />
          <ellipse cx="696" cy="222" rx="16" ry="7.5" transform="rotate(-20 696 222)" />
          <ellipse cx="732" cy="168" rx="17" ry="8.5" transform="rotate(-70 732 168)" />
          <ellipse cx="750" cy="190" rx="17" ry="8.5" transform="rotate(30 750 190)" />
          <ellipse cx="774" cy="175" rx="15" ry="7.5" transform="rotate(-25 774 175)" />
          <ellipse cx="715" cy="194" rx="15" ry="7.5" transform="rotate(-40 715 194)" />
        </g>

        {/* Woven Cream Rug */}
        <ellipse cx="388" cy="450" rx="268" ry="48" fill="#F3EEE4" stroke="#DDD4C3" strokeWidth="2" />

        {/* Cozy Linen Sofa */}
        <g filter="url(#softShadow)">
          <rect x="132" y="395" width="12" height="30" rx="3" fill="#8C6747" />
          <rect x="526" y="395" width="12" height="30" rx="3" fill="#8C6747" />
          <rect x="115" y="340" width="440" height="60" rx="12" fill="#DCD3C4" />
          <rect x="135" y="256" width="196" height="90" rx="14" fill="#ECE5D8" stroke="#D4CBB9" strokeWidth="1.5" />
          <rect x="336" y="256" width="196" height="90" rx="14" fill="#ECE5D8" stroke="#D4CBB9" strokeWidth="1.5" />
          <rect x="135" y="328" width="198" height="46" rx="10" fill="#F7F3EA" stroke="#D8CFBE" strokeWidth="1.5" />
          <rect x="335" y="328" width="198" height="46" rx="10" fill="#F7F3EA" stroke="#D8CFBE" strokeWidth="1.5" />
          <rect x="108" y="286" width="38" height="108" rx="14" fill="#E3DBCD" stroke="#CFC6B5" strokeWidth="1.5" />
          <rect x="522" y="286" width="38" height="108" rx="14" fill="#E3DBCD" stroke="#CFC6B5" strokeWidth="1.5" />
        </g>

        {/* Cushions */}
        <rect x="156" y="282" width="58" height="52" rx="10" transform="rotate(-8 156 282)" fill="#1E6B52" opacity="0.92" />
        <rect x="458" y="280" width="54" height="50" rx="10" transform="rotate(9 458 280)" fill="#D99B4E" opacity="0.92" />

        {/* Sleeping Ginger Cat */}
        <g transform="translate(262, 304)">
          <ellipse cx="42" cy="24" rx="31" ry="17" fill="#E08A47" />
          <path d="M58,28 Q83,36 75,17" stroke="#CC7434" strokeWidth="7" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="18" r="13.5" fill="#E69553" />
          <polygon points="12,10 15,0 22,8" fill="#E69553" />
          <polygon points="24,8 31,0 33,10" fill="#E69553" />
          <path d="M15,19 Q18,22 21,19" stroke="#5A3418" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M24,19 Q27,22 30,19" stroke="#5A3418" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>

        {/* Oak Coffee Table */}
        <g filter="url(#softShadow)">
          <rect x="275" y="432" width="218" height="15" rx="5" fill="#B88E60" />
          <rect x="295" y="447" width="10" height="40" rx="3" fill="#8C6747" />
          <rect x="462" y="447" width="10" height="40" rx="3" fill="#8C6747" />
        </g>

        {/* Coffee Cup & Book */}
        <rect x="315" y="422" width="66" height="10" rx="2" fill="#1E6B52" />
        <rect x="320" y="415" width="56" height="7" rx="2" fill="#F4EFE6" />
        <rect x="412" y="414" width="24" height="18" rx="4" fill="#FFFFFF" stroke="#D4CBB9" strokeWidth="1.5" />
        <path d="M436,418 C444,418 444,428 436,428" fill="none" stroke="#D4CBB9" strokeWidth="2.5" />
        <path d="M420,407 Q417,400 422,395" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round" />
        <path d="M428,407 Q426,399 431,394" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round" />
      </svg>
    </div>
  );
};
