import { useState, useEffect } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  initialItemsPerPage?: number;
}

export function usePagination<T>({ items, initialItemsPerPage = 30 }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Reset to first page when items change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    currentItems,
    totalItems: items.length,
    handlePageChange,
    handleItemsPerPageChange
  };
}