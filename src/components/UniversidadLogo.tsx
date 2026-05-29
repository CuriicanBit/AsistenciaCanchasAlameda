import React from 'react';

interface UniversidadLogoProps {
  className?: string;
}

export function UniversidadLogo({ className = "h-14 w-auto" }: UniversidadLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 230" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Escudo Universidad Autónoma de Chile"
    >
      <defs>
        {/* Curva para el texto del lema 'DUC IN ALTUM' */}
        <path id="textArcPath" d="M 32,55 Q 100,10 168,55" />
      </defs>

      {/* Lema en latín 'DUC IN ALTUM' arqueado exacto */}
      <text font-family="Georgia, 'Times New Roman', serif" font-size="12" font-weight="bold" fill="#4B5563" letter-spacing="0.08em">
        <textPath href="#textArcPath" startOffset="50%" textAnchor="middle">
          DUC IN ALTUM
        </textPath>
      </text>

      {/* Escudo Rojo de la Universidad Autónoma */}
      <path 
        d="M 52,65 H 148 V 135 C 148,185 100,215 100,215 C 100,215 52,185 52,135 V 65 Z" 
        fill="#cf2027" 
        stroke="#b0161b"
        strokeWidth="1.5"
      />

      {/* Sigla 'UA' en letras blancas serif elegantes */}
      <text 
        x="100" 
        y="145" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="46" 
        fill="#ffffff" 
        textAnchor="middle"
        font-weight="normal"
      >
        UA
      </text>
    </svg>
  );
}
