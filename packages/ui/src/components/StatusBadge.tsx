import React from 'react';

export interface StatusBadgeProps {
  status: 'confirmed' | 'conditional' | 'planned' | 'shipped' | 'received';
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const statusConfig = {
    confirmed: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      text: children || 'Confirmed',
    },
    conditional: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      text: children || 'Conditional',
    },
    planned: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      text: children || 'Planned',
    },
    shipped: {
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      text: children || 'Shipped',
    },
    received: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      text: children || 'Received',
    },
  };

  const config = statusConfig[status];

  const styles = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    backgroundColor: config.backgroundColor,
    color: config.color,
    display: 'inline-block',
  };

  return <span style={styles}>{config.text}</span>;
};
