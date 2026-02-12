import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { mappingsApi, Mapping } from '@/api/mappings';
import { useProductLine } from '@/contexts/ProductLineContext';
import { ArrowLeftRight, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';

export default function Mappings() {
  const { selectedProductLine } = useProductLine();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['mappings', selectedProductLine?.code],
    queryFn: () => mappingsApi.getAll(selectedProductLine?.code),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mappingsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => mappingsApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }),
  });

  const statusColor = (status: Mapping['status']) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Mappings</h1>
          <p className="text-gray-600 mt-1">
            Manage source-to-target field transformations
            {selectedProductLine && ` for ${selectedProductLine.name}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/mappings/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Mapping</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        </div>
      ) : mappings.length === 0 ? (
        <div className="card text-center py-12">
          <ArrowLeftRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No mappings yet</h3>
          <p className="text-gray-500 mb-4">
            {selectedProductLine
              ? `No mappings found for ${selectedProductLine.name}.`
              : 'Select a product line or create a new mapping.'}
          </p>
          <button
            onClick={() => navigate('/mappings/new')}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Mapping</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping, index) => (
            <div
              key={mapping.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/mappings/${mapping.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      #{mappings.length - index}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{mapping.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(mapping.status)}`}>
                      {mapping.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-mono text-xs">{mapping.sourceSystem}</span>
                    {' → '}
                    <span className="font-mono text-xs">{mapping.targetSystem}</span>
                    {mapping.productLine && ` · ${mapping.productLine}`}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                    <span>{mapping.fieldMappings?.length ?? 0} fields</span>
                    <span>·</span>
                    <span>v{mapping.version}</span>
                    <span>·</span>
                    <span>Created {new Date(mapping.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {mapping.updatedAt !== mapping.createdAt && (
                      <>
                        <span>·</span>
                        <span>Updated {new Date(mapping.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {mapping.status === 'draft' && (
                    <button
                      onClick={() => activateMutation.mutate(mapping.id)}
                      disabled={activateMutation.isPending}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      title="Activate mapping"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/mappings/${mapping.id}`)}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Edit mapping"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete mapping "${mapping.name}"?`)) {
                        deleteMutation.mutate(mapping.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete mapping"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
