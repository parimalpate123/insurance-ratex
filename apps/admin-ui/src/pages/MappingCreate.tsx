import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { mappingsApi, CreateMappingDto } from '@/api/mappings';
import { useProductLine } from '@/contexts/ProductLineContext';

const inputCls = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const selectCls = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

const SOURCE_SYSTEMS = ['guidewire', 'salesforce', 'duck-creek', 'majesco', 'applied-epic', 'csv', 'rest-api', 'custom'];
const TARGET_SYSTEMS = ['earnix', 'iso', 'cdm', 'rating-engine', 'rest-api', 'custom'];

export default function MappingCreate() {
  const navigate = useNavigate();
  const { selectedProductLine } = useProductLine();

  const [form, setForm] = useState<CreateMappingDto>({
    name: '',
    sourceSystem: 'guidewire',
    targetSystem: 'earnix',
    productLine: selectedProductLine?.name ?? '',
    productLineCode: selectedProductLine?.code ?? '',
    description: '',
    status: 'draft',
    creationMethod: 'manual',
  });
  const [error, setError] = useState('');

  const patch = (updates: Partial<CreateMappingDto>) => setForm((f) => ({ ...f, ...updates }));

  const createMutation = useMutation({
    mutationFn: () => mappingsApi.create(form),
    onSuccess: (mapping) => navigate(`/mappings/${mapping.id}`),
    onError: (e: any) => setError(e?.response?.data?.message ?? e.message ?? 'Create failed'),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate('/mappings')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mappings
      </button>

      <h1 className="text-2xl font-bold text-gray-900">New Mapping</h1>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mapping Name *</label>
          <input type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })}
            className={inputCls} placeholder="e.g., guidewire-to-earnix-gl" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source System *</label>
            <select value={form.sourceSystem} onChange={(e) => patch({ sourceSystem: e.target.value })} className={selectCls}>
              {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target System *</label>
            <select value={form.targetSystem} onChange={(e) => patch({ targetSystem: e.target.value })} className={selectCls}>
              {TARGET_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Line</label>
          <input type="text" value={form.productLine} onChange={(e) => patch({ productLine: e.target.value })}
            className={inputCls} placeholder="general-liability" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => patch({ description: e.target.value })}
            className={inputCls} placeholder="What this mapping does..." />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex justify-end space-x-3">
        <button onClick={() => navigate('/mappings')} className="btn btn-secondary">Cancel</button>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.name.trim() || createMutation.isPending}
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{createMutation.isPending ? 'Creating...' : 'Create Mapping'}</span>
        </button>
      </div>
    </div>
  );
}
