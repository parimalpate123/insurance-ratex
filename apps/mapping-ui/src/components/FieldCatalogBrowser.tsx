import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import { getFieldCatalog, getFieldCatalogCategories, FieldCatalogEntry } from '@/api/field-catalog';

interface FieldCatalogBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (field: FieldCatalogEntry) => void;
}

export default function FieldCatalogBrowser({
  isOpen,
  onClose,
  onSelect,
}: FieldCatalogBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['field-catalog-categories'],
    queryFn: getFieldCatalogCategories,
  });

  const { data: fields, isLoading } = useQuery({
    queryKey: ['field-catalog', selectedCategory, searchQuery],
    queryFn: () => getFieldCatalog({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
    }),
  });

  const handleSelect = (field: FieldCatalogEntry) => {
    onSelect(field);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Browse Field Catalog</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields by name or description..."
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Fields
            </button>
            {categories?.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Fields Grid */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : fields && fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => handleSelect(field)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{field.displayName}</div>
                        <code className="text-xs text-gray-500">{field.fieldName}</code>
                      </div>
                      {field.isRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {field.dataType}
                      </span>
                      {field.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {field.category}
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-gray-600 mb-2">{field.description}</p>
                    )}
                    {field.sampleValue && (
                      <div className="text-xs text-gray-500">
                        Example: <code className="bg-gray-100 px-1 rounded">{field.sampleValue}</code>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No fields found</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
