import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronRight,
  Sparkles, CheckCircle, XCircle, X, Pencil, Check,
} from 'lucide-react';
import { mappingsApi, Mapping, FieldMapping, TransformationType, CreateFieldMappingDto } from '@/api/mappings';
import { apiClient } from '@/api/client';
import { useProductLine } from '@/contexts/ProductLineContext';

// ── Constants ──────────────────────────────────────────────────────────────

const TRANSFORMATION_TYPES: { value: TransformationType; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'expression', label: 'Expression' },
  { value: 'lookup', label: 'Lookup Table' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'static', label: 'Static Value' },
  { value: 'concat', label: 'Concatenation' },
  { value: 'split', label: 'Split' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'trim', label: 'Trim' },
  { value: 'number', label: 'To Number' },
  { value: 'date', label: 'Date Format' },
  { value: 'custom', label: 'Custom Function' },
];

const inputCls = 'block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const selectCls = 'block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 border ${type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        {type === 'success'
          ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          : <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
        <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ── Add Field Modal ────────────────────────────────────────────────────────

function AddFieldModal({
  mappingId,
  onClose,
  onAdded,
}: {
  mappingId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<CreateFieldMappingDto>({
    sourcePath: '',
    targetPath: '',
    transformationType: 'direct',
    isRequired: false,
    defaultValue: '',
    description: '',
    dataType: 'string',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => mappingsApi.addFieldMapping(mappingId, form),
    onSuccess: () => { onAdded(); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? e.message ?? 'Failed to add field'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Field Mapping</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Path *</label>
              <input type="text" value={form.sourcePath}
                onChange={(e) => setForm({ ...form, sourcePath: e.target.value })}
                className={`${inputCls} font-mono`} placeholder="$.Quote.Premium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Path *</label>
              <input type="text" value={form.targetPath}
                onChange={(e) => setForm({ ...form, targetPath: e.target.value })}
                className={inputCls} placeholder="insured.premium" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transformation</label>
              <select value={form.transformationType}
                onChange={(e) => setForm({ ...form, transformationType: e.target.value as TransformationType })}
                className={selectCls}>
                {TRANSFORMATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
              <select value={form.dataType}
                onChange={(e) => setForm({ ...form, dataType: e.target.value })}
                className={selectCls}>
                {['string', 'number', 'boolean', 'date', 'object', 'array'].map((t) =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
            <input type="text" value={form.defaultValue ?? ''}
              onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
              className={inputCls} placeholder="Optional fallback value" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls} placeholder="What this field mapping does" />
          </div>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="rounded border-gray-300" />
            <span>Required Field</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.sourcePath.trim() || !form.targetPath.trim() || mutation.isPending}
            className="btn btn-primary disabled:opacity-50"
          >
            {mutation.isPending ? 'Adding...' : 'Add Field'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field Row ──────────────────────────────────────────────────────────────

function FieldRow({
  field,
  mappingId,
  isSelected,
  onSelect,
  onDeleted,
}: {
  field: FieldMapping;
  mappingId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDeleted: () => void;
}) {
  const deleteMutation = useMutation({
    mutationFn: () => mappingsApi.deleteFieldMapping(mappingId, field.id),
    onSuccess: onDeleted,
  });

  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${isSelected ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded truncate max-w-[140px]">{field.sourcePath}</code>
            <span className="text-gray-400 text-xs">→</span>
            <code className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded truncate max-w-[140px]">{field.targetPath}</code>
            {field.isRequired && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">req</span>}
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{field.transformationType}</span>
          </div>
          {field.description && <p className="text-xs text-gray-400 mt-0.5 ml-5 truncate">{field.description}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this field mapping?')) deleteMutation.mutate(); }}
          className="p-1.5 ml-2 text-gray-400 hover:text-red-600 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Field Editor Panel ─────────────────────────────────────────────────────

function FieldEditorPanel({ field, mappingId, onUpdated }: { field: FieldMapping; mappingId: string; onUpdated: () => void }) {
  const [form, setForm] = useState({
    sourcePath: field.sourcePath,
    targetPath: field.targetPath,
    transformationType: field.transformationType,
    isRequired: field.isRequired,
    defaultValue: field.defaultValue ?? '',
    description: field.description ?? '',
    dataType: field.dataType ?? 'string',
  });
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      sourcePath: field.sourcePath, targetPath: field.targetPath,
      transformationType: field.transformationType, isRequired: field.isRequired,
      defaultValue: field.defaultValue ?? '', description: field.description ?? '',
      dataType: field.dataType ?? 'string',
    });
    setDirty(false);
  }, [field.id]);

  const patch = (updates: Partial<typeof form>) => { setForm((f) => ({ ...f, ...updates })); setDirty(true); };

  const saveMutation = useMutation({
    mutationFn: () => mappingsApi.updateFieldMapping(mappingId, field.id, {
      sourcePath: form.sourcePath, targetPath: form.targetPath,
      transformationType: form.transformationType, isRequired: form.isRequired,
      defaultValue: form.defaultValue, description: form.description, dataType: form.dataType,
    }),
    onSuccess: () => { setDirty(false); setToast('Saved'); onUpdated(); setTimeout(() => setToast(null), 2000); },
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="text-sm font-semibold text-gray-900">Field Configuration</h3>
        {dirty && <span className="text-xs text-orange-600">Unsaved changes</span>}
        {toast && <span className="text-xs text-green-600">{toast}</span>}
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Source Path</label>
          <input type="text" value={form.sourcePath} onChange={(e) => patch({ sourcePath: e.target.value })} className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Target Path</label>
          <input type="text" value={form.targetPath} onChange={(e) => patch({ targetPath: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Transformation</label>
            <select value={form.transformationType} onChange={(e) => patch({ transformationType: e.target.value as TransformationType })} className={selectCls}>
              {TRANSFORMATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Type</label>
            <select value={form.dataType} onChange={(e) => patch({ dataType: e.target.value })} className={selectCls}>
              {['string', 'number', 'boolean', 'date', 'object', 'array'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Default Value</label>
          <input type="text" value={form.defaultValue} onChange={(e) => patch({ defaultValue: e.target.value })} className={inputCls} placeholder="Optional" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => patch({ description: e.target.value })} className={inputCls} />
        </div>
        <label className="flex items-center space-x-2 text-xs text-gray-700">
          <input type="checkbox" checked={form.isRequired} onChange={(e) => patch({ isRequired: e.target.checked })} className="rounded border-gray-300" />
          <span>Required Field</span>
        </label>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}
          className="w-full btn btn-primary text-sm disabled:opacity-50 flex items-center justify-center space-x-2">
          <Save className="h-3.5 w-3.5" />
          <span>{saveMutation.isPending ? 'Saving...' : 'Save Field'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MappingEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedProductLine } = useProductLine();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const initialized = useRef(false);

  // Edit mapping name inline
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const { data: mapping, isLoading } = useQuery({
    queryKey: ['mapping', id],
    queryFn: () => mappingsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (mapping && !initialized.current) {
      initialized.current = true;
      setNameValue(mapping.name);
    }
  }, [mapping]);

  const aiSuggestMutation = useMutation({
    mutationFn: () => apiClient.post(`/mappings/${id}/suggest-fields`, {}),
    onSuccess: (res: any) => {
      setAiSuggestions(res.data.suggestions ?? []);
      setShowAISuggest(true);
    },
    onError: (e: any) => showToast('error', e?.response?.data?.message ?? 'AI suggestion failed'),
  });

  const acceptSuggestion = useMutation({
    mutationFn: (s: any) => mappingsApi.addFieldMapping(id!, {
      sourcePath: s.sourcePath, targetPath: s.targetPath,
      transformationType: s.transformationType, description: s.reasoning,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping', id] });
      showToast('success', 'Field added');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => mappingsApi.update(id!, { name: nameValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping', id] });
      setEditingName(false);
      showToast('success', 'Mapping saved');
    },
    onError: (e: any) => showToast('error', e?.response?.data?.message ?? 'Save failed'),
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fields = mapping?.fieldMappings ?? [];
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
      </div>
    );
  }

  if (!mapping) return <div className="p-8 text-gray-500">Mapping not found.</div>;

  return (
    <div className="space-y-4 max-w-6xl">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Back + Header */}
      <button onClick={() => navigate('/mappings')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mappings
      </button>

      <div className="flex items-start justify-between">
        <div>
          {editingName ? (
            <div className="flex items-center space-x-2">
              <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)}
                className="text-xl font-bold border-b-2 border-primary-500 focus:outline-none bg-transparent"
                onKeyDown={(e) => { if (e.key === 'Enter') saveMutation.mutate(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus />
              <button onClick={() => saveMutation.mutate()} className="text-green-600 hover:text-green-800"><CheckCircle className="h-5 w-5" /></button>
              <button onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{mapping.name}</h1>
              <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-gray-700">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-mono">{mapping.sourceSystem}</span>
            {' → '}
            <span className="font-mono">{mapping.targetSystem}</span>
            {mapping.productLine && ` · ${mapping.productLine}`}
            {' · '}v{mapping.version}
            {' · '}Created {new Date(mapping.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mapping.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {mapping.status}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: field list */}
        <div className="col-span-7">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Field Mappings <span className="text-gray-400 font-normal">({fields.length})</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => aiSuggestMutation.mutate()}
                  disabled={aiSuggestMutation.isPending}
                  className="btn btn-secondary text-xs flex items-center space-x-1 py-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{aiSuggestMutation.isPending ? 'Suggesting...' : 'AI Suggest'}</span>
                </button>
                <button onClick={() => setShowAddField(true)} className="btn btn-primary text-xs flex items-center space-x-1 py-1.5">
                  <Plus className="h-3.5 w-3.5" /><span>Add Field</span>
                </button>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ChevronRight className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">No field mappings yet</p>
                <button onClick={() => setShowAddField(true)} className="mt-3 btn btn-primary text-sm">Add First Field</button>
              </div>
            ) : (
              <div>
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    mappingId={id!}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onDeleted={() => {
                      queryClient.invalidateQueries({ queryKey: ['mapping', id] });
                      if (selectedFieldId === field.id) setSelectedFieldId(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: field editor */}
        <div className="col-span-5">
          {selectedField ? (
            <FieldEditorPanel
              key={selectedField.id}
              field={selectedField}
              mappingId={id!}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['mapping', id] })}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-400">
              <Pencil className="h-10 w-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Select a field to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions Modal */}
      {showAISuggest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Field Suggestions</h3>
              </div>
              <button onClick={() => setShowAISuggest(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s.sourcePath}</code>
                      <span className="text-gray-400 text-xs">→</span>
                      <code className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{s.targetPath}</code>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.transformationType}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {Math.round(s.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{s.reasoning}</p>
                  </div>
                  <button
                    onClick={() => acceptSuggestion.mutate(s)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded flex-shrink-0"
                    title="Accept this suggestion"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button onClick={() => setShowAISuggest(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddField && (
        <AddFieldModal
          mappingId={id!}
          onClose={() => setShowAddField(false)}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['mapping', id] });
            showToast('success', 'Field added');
          }}
        />
      )}
    </div>
  );
}
