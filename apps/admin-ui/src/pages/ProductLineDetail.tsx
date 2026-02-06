import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productLinesApi } from '@/api/product-lines';
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ProductLineDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: productLine, isLoading } = useQuery({
    queryKey: ['product-line', code],
    queryFn: () => productLinesApi.getByCode(code!),
    enabled: !!code,
  });

  const updateMutation = useMutation({
    mutationFn: (config: any) => productLinesApi.update(code!, { config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-line', code] });
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      setIsEditing(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update product line');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productLinesApi.delete(code!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines'] });
      navigate('/product-lines');
    },
  });

  const handleEdit = () => {
    setEditedConfig(JSON.stringify(productLine?.config, null, 2));
    setIsEditing(true);
    setError(null);
  };

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(editedConfig);
      updateMutation.mutate(parsedConfig);
    } catch (err) {
      setError('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfig('');
    setError(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${productLine?.name}? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!productLine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product line not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/product-lines')}
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{productLine.name}</h1>
            <p className="text-gray-600">{productLine.code}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{updateMutation.isPending ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn btn-danger flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  productLine.status === 'active' ? 'bg-green-100 text-green-800' :
                  productLine.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {productLine.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.version}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.description || 'No description'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Product Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.productOwner || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Technical Lead</dt>
              <dd className="mt-1 text-sm text-gray-900">{productLine.technicalLead || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(productLine.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(productLine.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Configuration</h2>
          {isEditing && (
            <span className="text-sm text-yellow-600">
              ⚠️ Editing mode - Be careful with JSON syntax
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {isEditing ? (
          <textarea
            value={editedConfig}
            onChange={(e) => setEditedConfig(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            spellCheck={false}
            style={{
              tabSize: 2,
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"
            }}
          />
        ) : (
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              maxHeight: '600px'
            }}
            showLineNumbers={true}
            wrapLines={true}
          >
            {JSON.stringify(productLine.config, null, 2)}
          </SyntaxHighlighter>
        )}

        {isEditing && (
          <p className="mt-2 text-xs text-gray-500">
            Tip: Use a JSON validator to check syntax before saving. Invalid JSON will be rejected.
          </p>
        )}
      </div>
    </div>
  );
}
