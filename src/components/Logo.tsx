import React from 'react';

export const AppLogo = ({ size = "md" }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  // Anatolian Kilim Colors
  const anatolianBlue = "#1a365d"; // Deep Indigo/Vegetal Blue
  const anatolianRed = "#991b1b";  // Madder Red (Kök Boya Kırmızısı)
  const anatolianCream = "#fef3c7"; // Natural Wool / Cream for accents

  return (
    <svg 
      viewBox="0 0 512 512" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizes[size]} rounded-xl shadow-sm`}
    >
      {/* Background - Anatolian Blue */}
      <rect width="512" height="512" rx="120" fill={anatolianBlue}/>
      
      {/* Decorative Border Pattern (Kilim Style) */}
      <path d="M60 60 L452 60 L452 452 L60 452 Z" fill="none" stroke={anatolianCream} strokeWidth="8" strokeDasharray="20 10" opacity="0.3" />

      {/* Göz (Eye) Motif - Anatolian Red */}
      {/* Traditional diamond-shaped eye motif used in kilims */}
      <g transform="translate(256, 256)">
        {/* Outer Diamond */}
        <path 
          d="M0 -160 L180 0 L0 160 L-180 0 Z" 
          fill={anatolianRed} 
        />
        {/* Middle Diamond (Contrast) */}
        <path 
          d="M0 -100 L110 0 L0 100 L-110 0 Z" 
          fill={anatolianBlue} 
        />
        {/* Inner Diamond (Pupil) */}
        <path 
          d="M0 -40 L45 0 L0 40 L-45 0 Z" 
          fill={anatolianCream} 
        />
        
        {/* Stylized Eyelashes / Protection symbols around the eye */}
        <path d="M0 -160 L0 -190" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M0 160 L0 190" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M180 0 L210 0" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M-180 0 L-210 0" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        
        {/* Diagonal accents */}
        <path d="M127 -113 L148 -134" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M127 113 L148 134" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M-127 -113 L-148 -134" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
        <path d="M-127 113 L-148 134" stroke={anatolianRed} strokeWidth="12" strokeLinecap="round" />
      </g>
    </svg>
  );
};
