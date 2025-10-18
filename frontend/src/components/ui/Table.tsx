import { TableHTMLAttributes, forwardRef } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
  striped?: boolean;
}

function TableComponent<T extends Record<string, any>>(
  {
    data,
    columns,
    onRowClick,
    hoverable = false,
    striped = false,
    className = '',
    ...props
  }: TableProps<T>,
  ref: React.Ref<HTMLTableElement>
) {
  const rowHoverStyle = hoverable || onRowClick ? 'hover:bg-gray-50 cursor-pointer' : '';

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table
        ref={ref}
        className={`min-w-full divide-y divide-gray-200 ${className}`}
        {...props}
      >
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={`
                  ${rowHoverStyle}
                  ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                  transition-colors duration-150
                `}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const Table = forwardRef(TableComponent) as <T extends Record<string, any>>(
  props: TableProps<T> & { ref?: React.Ref<HTMLTableElement> }
) => ReturnType<typeof TableComponent>;

export default Table;