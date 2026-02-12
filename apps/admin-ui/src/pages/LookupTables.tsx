import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lookupTablesApi, LookupTable } from '@/api/lookup-tables';
import { useProductLine } from '@/contexts/ProductLineContext';
import { List, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function LookupTables() {
  const { selectedProductLine } = useProductLine();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['lookup-tables', selectedProductLine?.code],
    queryFn: () => lookupTablesApi.getAll(selectedProductLine?.code),
  });

  const createMutation = useMutation({
    mutationFn: () => lookupTablesApi.create({
      name: newTableName,
      productLine: selectedProductLine?.name ?? 'General',
      productLineCode: selectedProductLine?.code,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-tables'] });
      setShowCreateForm(false);
      setNewTableName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lookupTablesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lookup-tables'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => lookupTablesApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lookup-tables'] }),
  });

  const statusColor = (status: LookupTable['status']) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lookup Tables</h1>
          <p className="text-gray-600 mt-1">
            Key-value reference tables for mapping transformations
            {selectedProductLine && ` for ${selectedProductLine.name}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Lookup Table</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="card border-2 border-primary-200">
          <h2 className="text-lg font-semibold mb-4">Create Lookup Table</h2>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Table name (e.g. State Codes, Class Codes)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newTableName.trim() || createMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="card text-center py-12">
          <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lookup tables yet</h3>
          <p className="text-gray-500 mb-4">
            Lookup tables provide key → value mappings for data transformations.
            <br />
            Example: State Code "CA" → "California"
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Lookup Table</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(table.status)}`}>
                      {table.status}
                    </span>
                  </div>
                  {table.description && (
                    <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {table.status !== 'active' && (
                    <button
                      onClick={() => activateMutation.mutate(table.id)}
                      className="btn btn-secondary flex items-center space-x-1 text-xs"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Activate</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${table.name}"?`)) {
                        deleteMutation.mutate(table.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
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
