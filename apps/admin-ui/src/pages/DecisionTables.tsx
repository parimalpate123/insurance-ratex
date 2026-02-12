import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decisionTablesApi, DecisionTable } from '@/api/decision-tables';
import { useProductLine } from '@/contexts/ProductLineContext';
import { Table, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function DecisionTables() {
  const { selectedProductLine } = useProductLine();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['decision-tables', selectedProductLine?.code],
    queryFn: () => decisionTablesApi.getAll(selectedProductLine?.code),
  });

  const createMutation = useMutation({
    mutationFn: () => decisionTablesApi.create({
      name: newTableName,
      productLine: selectedProductLine?.name ?? 'General',
      productLineCode: selectedProductLine?.code,
      conditionColumns: [],
      actionColumns: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-tables'] });
      setShowCreateForm(false);
      setNewTableName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => decisionTablesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decision-tables'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => decisionTablesApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decision-tables'] }),
  });

  const statusColor = (status: DecisionTable['status']) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Decision Tables</h1>
          <p className="text-gray-600 mt-1">
            Multi-factor tabular decision logic
            {selectedProductLine && ` for ${selectedProductLine.name}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Decision Table</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="card border-2 border-primary-200">
          <h2 className="text-lg font-semibold mb-4">Create Decision Table</h2>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Table name (e.g. Territory Rating Table)"
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
          <p className="text-sm text-gray-500 mt-2">
            After creating, you can define condition and action columns, then add rows.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="card text-center py-12">
          <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No decision tables yet</h3>
          <p className="text-gray-500 mb-4">
            Decision tables let you define complex multi-factor rules as a grid.
            <br />
            Example: Territory × Class of Business → Rate Factor
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Decision Table</span>
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
                  <p className="text-xs text-gray-500 mt-2">
                    {table.conditionColumns?.length ?? 0} condition column(s) |{' '}
                    {table.actionColumns?.length ?? 0} action column(s)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {table.status !== 'active' && (
                    <button
                      onClick={() => activateMutation.mutate(table.id)}
                      className="btn btn-secondary flex items-center space-x-1 text-xs"
                      title="Activate"
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
                    title="Delete"
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
