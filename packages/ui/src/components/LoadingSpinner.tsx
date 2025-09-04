import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#3b82f6',
  message
}) => {
  const sizeConfig = {
    sm: { width: '1rem', height: '1rem', borderWidth: '2px' },
    md: { width: '2rem', height: '2rem', borderWidth: '3px' },
    lg: { width: '3rem', height: '3rem', borderWidth: '4px' },
  };

  const config = sizeConfig[size];

  const spinnerStyles = {
    width: config.width,
    height: config.height,
    border: `${config.borderWidth} solid #f3f4f6`,
    borderTop: `${config.borderWidth} solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
  };

  const messageStyles = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={containerStyles}>
        <div style={spinnerStyles}></div>
        {message && <p style={messageStyles}>{message}</p>}
      </div>
    </>
  );
};
