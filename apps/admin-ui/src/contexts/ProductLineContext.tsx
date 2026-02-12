import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productLinesApi, ProductLineConfig } from '@/api/product-lines';

interface ProductLineContextType {
  currentProductLine: string | null;
  selectedProductLine: ProductLineConfig | null;
  setCurrentProductLine: (code: string) => void;
  productLines: ProductLineConfig[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const ProductLineContext = createContext<ProductLineContextType | undefined>(undefined);

export function ProductLineProvider({ children }: { children: ReactNode }) {
  const [currentProductLine, setCurrentProductLineState] = useState<string | null>(null);

  // Fetch product lines
  const {
    data: productLines = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product-lines'],
    queryFn: () => productLinesApi.getAll(),
  });

  // Load saved product line from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currentProductLine');
    if (saved && productLines.some((pl) => pl.code === saved)) {
      setCurrentProductLineState(saved);
    } else if (productLines.length > 0 && !currentProductLine) {
      // Default to first product line
      setCurrentProductLineState(productLines[0].code);
    }
  }, [productLines]);

  // Set current product line and save to localStorage
  const setCurrentProductLine = (code: string) => {
    setCurrentProductLineState(code);
    localStorage.setItem('currentProductLine', code);
  };

  const selectedProductLine = productLines.find((pl) => pl.code === currentProductLine) ?? null;

  return (
    <ProductLineContext.Provider
      value={{
        currentProductLine,
        selectedProductLine,
        setCurrentProductLine,
        productLines,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </ProductLineContext.Provider>
  );
}

export function useProductLine() {
  const context = useContext(ProductLineContext);
  if (!context) {
    throw new Error('useProductLine must be used within ProductLineProvider');
  }
  return context;
}
