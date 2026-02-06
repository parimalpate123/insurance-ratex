import { useProductLine } from '@/contexts/ProductLineContext';
import { ChevronDown } from 'lucide-react';

export default function ProductLineSelector() {
  const { currentProductLine, setCurrentProductLine, productLines, isLoading } = useProductLine();

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading product lines...
      </div>
    );
  }

  if (productLines.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No product lines available
      </div>
    );
  }

  const currentPL = productLines.find(pl => pl.code === currentProductLine);

  return (
    <div className="relative">
      <label htmlFor="product-line-select" className="sr-only">
        Select Product Line
      </label>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Product Line:</span>
        <div className="relative">
          <select
            id="product-line-select"
            value={currentProductLine || ''}
            onChange={(e) => setCurrentProductLine(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {productLines.map((pl) => (
              <option key={pl.code} value={pl.code}>
                {pl.name} ({pl.code})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {currentPL && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentPL.status === 'active'
                ? 'bg-green-100 text-green-800'
                : currentPL.status === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {currentPL.status}
          </span>
        )}
      </div>
    </div>
  );
}
