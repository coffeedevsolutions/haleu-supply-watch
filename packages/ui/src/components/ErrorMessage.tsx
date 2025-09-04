import React from 'react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  onRetry,
  variant = 'error'
}) => {
  const variantConfig = {
    error: {
      backgroundColor: '#fef2f2',
      borderColor: '#f87171',
      textColor: '#dc2626',
      icon: '❌',
    },
    warning: {
      backgroundColor: '#fffbeb',
      borderColor: '#fbbf24',
      textColor: '#d97706',
      icon: '⚠️',
    },
    info: {
      backgroundColor: '#eff6ff',
      borderColor: '#60a5fa',
      textColor: '#2563eb',
      icon: 'ℹ️',
    },
  };

  const config = variantConfig[variant];

  const containerStyles = {
    padding: '1rem',
    border: `1px solid ${config.borderColor}`,
    borderRadius: '0.5rem',
    backgroundColor: config.backgroundColor,
    marginBottom: '1rem',
  };

  const titleStyles = {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: config.textColor,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const messageStyles = {
    margin: '0 0 0.5rem 0',
    fontSize: '0.875rem',
    color: config.textColor,
  };

  const detailsStyles = {
    margin: '0 0 1rem 0',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '0.5rem',
    borderRadius: '0.25rem',
  };

  const buttonStyles = {
    padding: '0.5rem 1rem',
    backgroundColor: config.textColor,
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: '500',
  };

  return (
    <div style={containerStyles}>
      {title && (
        <h3 style={titleStyles}>
          <span>{config.icon}</span>
          {title}
        </h3>
      )}
      <p style={messageStyles}>{message}</p>
      {details && <pre style={detailsStyles}>{details}</pre>}
      {onRetry && (
        <button onClick={onRetry} style={buttonStyles}>
          Try Again
        </button>
      )}
    </div>
  );
};
