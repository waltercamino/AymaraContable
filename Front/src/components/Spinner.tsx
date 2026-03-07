import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * Componente Spinner para indicar estado de carga
 */
export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'currentColor',
  className = '' 
}) => {
  const sizes = { 
    sm: 'w-4 h-4', 
    md: 'w-6 h-6', 
    lg: 'w-8 h-8' 
  };

  return (
    <svg 
      className={`animate-spin ${sizes[size]} ${className}`} 
      viewBox="0 0 24 24"
      style={{ color }}
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
        fill="none" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8v8z" 
      />
    </svg>
  );
};

export default Spinner;
