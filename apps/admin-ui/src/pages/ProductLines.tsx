import { useProductLine } from '@/contexts/ProductLineContext';
import { Link } from 'react-router-dom';
import { Package, Plus, ExternalLink } from 'lucide-react';

export default function ProductLines() {
  const { productLines, isLoading, setCurrentProductLine } = useProductLine();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-gray-500">Loading product lines...</p>
      </div>
    );
  }

  const activeProductLines = productLines.filter(pl => !pl.isTemplate);
  const templates = productLines.filter(pl => pl.isTemplate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Lines</h1>
          <p className="mt-2 text-gray-600">
            Manage your insurance product line configurations
          </p>
        </div>
        <Link to="/onboarding" className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Product Line</span>
        </Link>
      </div>

      {/* Active Product Lines */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Product Lines ({activeProductLines.length})
        </h2>
        {activeProductLines.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No product lines</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first product line.
            </p>
            <div className="mt-6">
              <Link to="/onboarding" className="btn btn-primary">
                Create Product Line
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProductLines.map((pl) => (
              <ProductLineCard
                key={pl.code}
                productLine={pl}
                onSelect={() => setCurrentProductLine(pl.code)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Templates ({templates.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((pl) => (
              <ProductLineCard
                key={pl.code}
                productLine={pl}
                isTemplate
                onSelect={() => setCurrentProductLine(pl.code)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductLineCard({
  productLine,
  isTemplate = false,
  onSelect,
}: {
  productLine: any;
  isTemplate?: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{productLine.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{productLine.code}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isTemplate
              ? 'bg-purple-100 text-purple-800'
              : productLine.status === 'active'
              ? 'bg-green-100 text-green-800'
              : productLine.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isTemplate ? 'Template' : productLine.status}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {productLine.description || 'No description'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Version {productLine.version}</span>
        <span>{new Date(productLine.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onSelect}
          className="flex-1 btn btn-secondary text-sm"
        >
          Select
        </button>
        <Link
          to={`/product-lines/${productLine.code}`}
          className="flex-1 btn btn-primary text-sm flex items-center justify-center space-x-1"
        >
          <span>View</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
