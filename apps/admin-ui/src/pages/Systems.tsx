import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Server, Edit2, Trash2, Wifi, WifiOff, Code2, Globe } from 'lucide-react';
import { systemsApi, SystemConfig } from '../api/systems';

const PROTOCOL_LABELS: Record<string, string> = {
  rest: 'REST',
  soap: 'SOAP',
  mock: 'Mock',
};

const FORMAT_COLORS: Record<string, string> = {
  json: 'bg-blue-100 text-blue-700',
  xml: 'bg-orange-100 text-orange-700',
  soap: 'bg-purple-100 text-purple-700',
};

const TYPE_COLORS: Record<string, string> = {
  source: 'bg-green-100 text-green-700',
  target: 'bg-indigo-100 text-indigo-700',
  both: 'bg-yellow-100 text-yellow-700',
};

const emptySystem: Partial<SystemConfig> = {
  name: '',
  code: '',
  description: '',
  type: 'target',
  protocol: 'rest',
  format: 'json',
  baseUrl: '',
  isMock: false,
  isActive: true,
};

export default function Systems() {
  const qc = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Partial<SystemConfig> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['systems', showInactive],
    queryFn: () => systemsApi.list(showInactive),
  });

  const saveMutation = useMutation({
    mutationFn: (s: Partial<SystemConfig>) =>
      s.id ? systemsApi.update(s.id, s) : systemsApi.create(s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['systems'] }); setEditing(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => systemsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  });

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Register source and target systems (Guidewire, Earnix, Ratabase, etc.)</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          <button
            onClick={() => { setEditing({ ...emptySystem }); setIsNew(true); }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Add System
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading systems…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((s) => (
            <div key={s.id} className={`bg-white rounded-lg border shadow-sm p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${s.isMock ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    {s.isMock ? <Code2 className="h-5 w-5 text-yellow-600" /> : <Server className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing({ ...s }); setIsNew(false); }} className="p-1 hover:bg-gray-100 rounded">
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => removeMutation.mutate(s.id)} className="p-1 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>

              {s.description && <p className="text-xs text-gray-500 mb-3">{s.description}</p>}

              <div className="flex flex-wrap gap-1 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[s.type]}`}>{s.type}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FORMAT_COLORS[s.format]}`}>{s.format.toUpperCase()}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{PROTOCOL_LABELS[s.protocol]}</span>
                {s.isMock && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Mock</span>}
              </div>

              {s.baseUrl && (
                <div className="flex items-center gap-1 text-xs text-gray-400 font-mono truncate">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{s.baseUrl}</span>
                </div>
              )}

              <div className="flex items-center gap-1 mt-2">
                {s.isActive
                  ? <><Wifi className="h-3 w-3 text-green-500" /><span className="text-xs text-green-600">Active</span></>
                  : <><WifiOff className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-400">Inactive</span></>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{isNew ? 'Add System' : 'Edit System'}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input className={inputCls} value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Earnix Rating Engine" />
                  </div>
                  <div>
                    <label className={labelCls}>Code * (unique)</label>
                    <input className={inputCls} value={editing.code ?? ''} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="earnix" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls} rows={2} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Type</label>
                    <select className={inputCls} value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })}>
                      <option value="source">Source</option>
                      <option value="target">Target</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Protocol</label>
                    <select className={inputCls} value={editing.protocol} onChange={e => setEditing({ ...editing, protocol: e.target.value as any })}>
                      <option value="rest">REST</option>
                      <option value="soap">SOAP</option>
                      <option value="mock">Mock</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Format</label>
                    <select className={inputCls} value={editing.format} onChange={e => setEditing({ ...editing, format: e.target.value as any })}>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="soap">SOAP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Base URL</label>
                  <input className={inputCls} value={editing.baseUrl ?? ''} onChange={e => setEditing({ ...editing, baseUrl: e.target.value })} placeholder="https://api.earnix.com" />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editing.isMock ?? false} onChange={e => setEditing({ ...editing, isMock: e.target.checked })} />
                    Mock system
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
