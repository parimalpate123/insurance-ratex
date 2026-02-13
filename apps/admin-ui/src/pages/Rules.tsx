import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { rulesApi, ConditionalRule } from '@/api/rules';
import { pipelinesApi } from '@/api/pipelines';
import { useProductLine } from '@/contexts/ProductLineContext';
import { GitBranch, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';

export default function Rules() {
  const { selectedProductLine } = useProductLine();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [linkTarget, setLinkTarget] = useState<ConditionalRule | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules', selectedProductLine?.code],
    queryFn: () => rulesApi.getAll(selectedProductLine?.code),
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rulesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => rulesApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const linkMutation = useMutation({
    mutationFn: ({ id, pipelineId }: { id: string; pipelineId: string | null }) =>
      rulesApi.update(id, { pipelineId } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setLinkTarget(null);
      setSelectedPipelineId('');
    },
  });

  const statusColor = (status: ConditionalRule['status']) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conditional Rules</h1>
          <p className="text-gray-600 mt-1">
            Manage if/then business logic rules
            {selectedProductLine && ` for ${selectedProductLine.name}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/rules/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Rule</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        </div>
      ) : rules.length === 0 ? (
        <div className="card text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rules yet</h3>
          <p className="text-gray-500 mb-4">
            {selectedProductLine
              ? `No rules found for ${selectedProductLine.name}.`
              : 'Select a product line or create a new rule.'}
          </p>
          <button
            onClick={() => navigate('/rules/new')}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Rule</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/rules/${rule.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      #{rules.length - index}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(rule.status)}`}>
                      {rule.status}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Priority: {rule.priority}
                    </span>
                    {rule.pipelineId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                        <GitBranch className="h-3 w-3" />
                        {pipelines.find(p => p.id === rule.pipelineId)?.name ?? 'Pipeline'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
                        No pipeline
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1.5">
                    <span>{rule.conditions?.length ?? 0} condition(s) → {rule.actions?.length ?? 0} action(s)</span>
                    <span>·</span>
                    <span>Created {new Date(rule.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {rule.updatedAt !== rule.createdAt && (
                      <>
                        <span>·</span>
                        <span>Updated {new Date(rule.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-gray-400 mr-2">v{rule.version}</span>
                  {rule.status === 'draft' && (
                    <button
                      onClick={() => activateMutation.mutate(rule.id)}
                      disabled={activateMutation.isPending}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      title="Activate rule"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setLinkTarget(rule); setSelectedPipelineId(rule.pipelineId ?? ''); }}
                    className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                    title="Link to pipeline"
                  >
                    <GitBranch className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/rules/${rule.id}`)}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Edit rule"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete rule "${rule.name}"?`)) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Link to Pipeline Modal */}
      {linkTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1">Link Rule to Pipeline</h2>
            <p className="text-sm text-gray-500 mb-4">
              Assign <strong>{linkTarget.name}</strong> to a pipeline. The execution engine will auto-run all <em>active</em> rules linked to that pipeline.
            </p>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedPipelineId}
              onChange={e => setSelectedPipelineId(e.target.value)}
            >
              <option value="">-- Unlink from pipeline --</option>
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setLinkTarget(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => linkMutation.mutate({ id: linkTarget.id, pipelineId: selectedPipelineId || null })}
                disabled={linkMutation.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {linkMutation.isPending ? 'Saving…' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
