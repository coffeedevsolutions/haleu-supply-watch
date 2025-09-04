import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({ 
  data, 
  columns, 
  emptyMessage = 'No data available',
  className = ''
}: TableProps<T>) {
  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
  };

  const headerStyles = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    padding: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
  };

  const cellStyles = {
    border: '1px solid #e5e7eb',
    padding: '0.75rem',
    fontSize: '0.875rem',
  };

  const emptyCellStyles = {
    ...cellStyles,
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#6b7280',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyles} className={className}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...headerStyles,
                  textAlign: column.align || 'left',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={emptyCellStyles}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => {
                  const value = row[column.key];
                  const content = column.render ? column.render(value, row) : value;
                  
                  return (
                    <td
                      key={column.key}
                      style={{
                        ...cellStyles,
                        textAlign: column.align || 'left',
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
