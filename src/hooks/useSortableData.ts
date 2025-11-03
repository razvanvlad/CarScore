import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

const useSortableData = <T,>(items: T[], config: SortConfig<T> | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          // FIX: Corrected typo from `sort-config` to `sortConfig`.
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

export default useSortableData;
