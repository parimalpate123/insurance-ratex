import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Upload, FileText, Sparkles, Link,
  X, Check, ArrowRight, Info, Filter, FileSpreadsheet,
} from 'lucide-react';
import { mappingsApi } from '@/api/mappings';
import { apiClient } from '@/api/client';
import { useProductLine } from '@/contexts/ProductLineContext';

type CreationMethod = 'manual' | 'text' | 'excel';

interface FieldSuggestion {
  sourcePath: string;
  targetPath: string;
  transformationType: string;
  confidence: number;
  reasoning?: string;
}

// ── File Uploader ──────────────────────────────────────────────────────────

function FileUploader({ onFileSelect }: { onFileSelect: (f: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const validate = (file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) { setError('File size exceeds 10MB limit'); return false; }
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!['.xlsx', '.csv', '.xls'].includes(ext)) { setError('Accepted types: .xlsx, .csv, .xls'); return false; }
    setError(''); return true;
  };

  const pick = (file: File) => { if (validate(file)) { setSelectedFile(file); onFileSelect(file); } };

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0]; if (file) pick(file);
  }, []);

  return (
    <div>
      {!selectedFile ? (
        <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">Choose a file</span>
              <span className="text-gray-600"> or drag and drop</span>
            </label>
            <input id="file-upload" type="file" className="sr-only" accept=".xlsx,.csv,.xls"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">.XLSX, .CSV, .XLS up to 10MB</p>
        </div>
      ) : (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button onClick={() => { setSelectedFile(null); setError(''); }} className="p-1 rounded hover:bg-green-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}
      {error && <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────

function PreviewModal({
  suggestions, onClose, onAccept, isLoading,
}: {
  suggestions: FieldSuggestion[];
  onClose: () => void;
  onAccept: (accepted: FieldSuggestion[]) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(suggestions.map((_, i) => i)));
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filtered = useMemo(() => suggestions.filter((s) => {
    const pct = s.confidence <= 1 ? s.confidence * 100 : s.confidence;
    if (filter === 'high') return pct >= 80;
    if (filter === 'medium') return pct >= 60 && pct < 80;
    return true;
  }), [suggestions, filter]);

  const toggle = (i: number) => {
    const n = new Set(selected);
    n.has(i) ? n.delete(i) : n.add(i);
    setSelected(n);
  };

  const highCount = useMemo(() => suggestions.filter((s) => {
    const pct = s.confidence <= 1 ? s.confidence * 100 : s.confidence;
    return pct >= 80;
  }).length, [suggestions]);

  const avgConf = useMemo(() => {
    if (!suggestions.length) return 0;
    const total = suggestions.reduce((sum, s) => {
      const pct = s.confidence <= 1 ? s.confidence * 100 : s.confidence;
      return sum + pct;
    }, 0);
    return Math.round(total / suggestions.length);
  }, [suggestions]);

  const getBadge = (confidence: number) => {
    const pct = confidence <= 1 ? confidence * 100 : confidence;
    if (pct >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (pct >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (pct >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const pct = (c: number) => Math.round(c <= 1 ? c * 100 : c);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Review AI-Generated Mappings</h2>
              <p className="text-sm text-gray-600 mt-1">
                {suggestions.length} suggestions · {selected.size} selected · Avg confidence: {avgConf}%
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm"><span className="font-medium text-green-600">{highCount}</span> <span className="text-gray-600">high confidence (≥80%)</span></div>
              <div className="text-sm"><span className="font-medium text-yellow-600">{suggestions.length - highCount}</span> <span className="text-gray-600">lower confidence</span></div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1">
                <option value="all">All Suggestions</option>
                <option value="high">High Confidence Only</option>
                <option value="medium">Medium Confidence Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-3">
          <button onClick={() => setSelected(selected.size === suggestions.length ? new Set() : new Set(suggestions.map((_, i) => i)))}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            {selected.size === suggestions.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => setSelected(new Set(suggestions.map((s, i) => pct(s.confidence) >= 80 ? i : -1).filter((i) => i >= 0)))}
            className="text-sm text-green-600 hover:text-green-700 font-medium">
            Accept All High Confidence
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <div key={i} className={`border rounded-lg p-4 transition-all ${selected.has(i) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="mt-1 h-4 w-4 text-blue-600 rounded" />
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">SOURCE</div>
                          <div className="font-mono text-sm text-gray-900">{s.sourcePath}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">TRANSFORMATION</div>
                          <div className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm capitalize">{s.transformationType || 'direct'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">TARGET</div>
                          <div className="font-mono text-sm text-gray-900">{s.targetPath}</div>
                        </div>
                      </div>
                      <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${getBadge(s.confidence)}`}>
                        {pct(s.confidence)}%
                      </div>
                    </div>
                    {s.reasoning && (
                      <div className="mt-3 flex items-start text-xs text-gray-600 bg-white rounded p-2 border border-gray-100">
                        <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        {s.reasoning}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No suggestions match the current filter</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selected.size}</span> of <span className="font-medium">{suggestions.length}</span> mappings selected
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Back</button>
            <button
              onClick={() => onAccept(suggestions.filter((_, i) => selected.has(i)))}
              disabled={selected.size === 0 || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : `Create Mapping (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Create Page ───────────────────────────────────────────────────────

const SOURCE_SYSTEMS = ['guidewire', 'salesforce', 'duck-creek', 'majesco', 'applied-epic', 'csv', 'rest-api', 'custom'];
const TARGET_SYSTEMS = ['earnix', 'iso', 'cdm', 'rating-engine', 'rest-api', 'custom'];
const PRODUCT_LINES = ['general-liability', 'property', 'workers-comp', 'auto', 'inland-marine', 'umbrella'];

export default function MappingCreate() {
  const navigate = useNavigate();
  const { selectedProductLine } = useProductLine();

  const [method, setMethod] = useState<CreationMethod>('manual');
  const [name, setName] = useState('');
  const [sourceSystem, setSourceSystem] = useState('guidewire');
  const [targetSystem, setTargetSystem] = useState('earnix');
  const [productLine, setProductLine] = useState(selectedProductLine?.name ?? '');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [textReqs, setTextReqs] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name.trim()) { setError('Mapping Name is required'); return false; }
    if (!sourceSystem) { setError('Source System is required'); return false; }
    if (!targetSystem) { setError('Target System is required'); return false; }
    if (method === 'text' && !textReqs.trim()) { setError('Please enter requirements text'); return false; }
    if (method === 'excel' && !uploadedFile) { setError('Please upload an Excel/CSV file'); return false; }
    setError(''); return true;
  };

  const handleManualCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const mapping = await mappingsApi.create({ name, sourceSystem, targetSystem, productLine, productLineCode: selectedProductLine?.code ?? '', description, status: 'draft', creationMethod: 'manual' });
      navigate(`/mappings/${mapping.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Create failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      let resp: any;
      if (method === 'text') {
        resp = await apiClient.post('/mappings/parse-text', {
          text: textReqs,
          context: { sourceSystem, targetSystem, productLine },
        });
        setSuggestions(resp.data.suggestions ?? []);
      } else if (method === 'excel' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        const res = await fetch('/api/v1/mappings/parse-excel', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed to parse file');
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
      setShowPreview(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestions = async (accepted: FieldSuggestion[]) => {
    setIsLoading(true);
    try {
      const resp = await apiClient.post('/mappings/create-with-fields', {
        name, sourceSystem, targetSystem, productLine,
        productLineCode: selectedProductLine?.code ?? '',
        description, version, creationMethod: method,
        fieldMappings: accepted.map((s) => ({
          sourcePath: s.sourcePath, targetPath: s.targetPath,
          transformationType: s.transformationType, description: s.reasoning,
        })),
      });
      navigate(`/mappings/${resp.data.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Create failed');
      setIsLoading(false);
    }
  };

  const METHOD_OPTIONS = [
    { id: 'manual' as CreationMethod, icon: <FileText className="h-6 w-6 mb-2 text-gray-700" />, label: 'Manual', desc: 'Start from scratch and add fields manually', disabled: false },
    { id: 'text' as CreationMethod, icon: <Sparkles className="h-6 w-6 mb-2 text-purple-600" />, label: 'AI-Powered', desc: 'Describe requirements or paste a JIRA story — AI generates mappings', disabled: false },
    { id: 'excel' as CreationMethod, icon: <Upload className="h-6 w-6 mb-2 text-gray-700" />, label: 'Upload Excel/CSV', desc: 'Upload mapping requirements file (columns: Source, Target, Transformation, Description)', disabled: false },
    { id: 'jira' as any, icon: <Link className="h-6 w-6 mb-2 text-gray-400" />, label: 'JIRA Story URL', badge: 'Coming Soon', desc: 'Import requirements from a JIRA story URL', disabled: true },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/mappings')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mappings
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Mapping</h2>
          <p className="mt-1 text-sm text-gray-600">Choose how you want to create your mapping</p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Creation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Creation Method</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && setMethod(opt.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${opt.disabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' : method === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {opt.icon}
                  <div className="font-medium flex items-center gap-2">
                    {opt.label}
                    {opt.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{opt.badge}</span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${opt.disabled ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mapping Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mapping Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Guidewire to Earnix (General Liability)" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Source System *</label>
              <select value={sourceSystem} onChange={(e) => setSourceSystem(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target System *</label>
              <select value={targetSystem} onChange={(e) => setTargetSystem(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {TARGET_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Line</label>
              <select value={productLine} onChange={(e) => setProductLine(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select product line...</option>
                {PRODUCT_LINES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <input type="text" value={version} onChange={(e) => setVersion(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1.0.0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What this mapping does..." />
          </div>

          {/* AI Text Requirements */}
          {method === 'text' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Paste Requirements Text</h3>
              <textarea
                value={textReqs}
                onChange={(e) => setTextReqs(e.target.value)}
                placeholder={`Paste your JIRA user story or mapping requirements here...\n\nExamples:\n• Map quoteNumber to policy.id\n• Map insured.name to insured.name\n• Map insured.state to insured.address.state using state code lookup\n• Map classification.code to ratingFactors.businessType\n• quoteDate → policy.effectiveDate (date format)\n• $.Premium → rating.totalPremium`}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> AI will parse your text and extract field mapping requirements. Mention source → target, transformations (e.g., "using lookup", "date format"), and any business rules.
                </p>
              </div>
            </div>
          )}

          {/* Excel Upload */}
          {method === 'excel' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Requirements File</h3>
              <FileUploader onFileSelect={setUploadedFile} />
              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium mb-1">Expected format (CSV/Excel):</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">Source Field Path, Target Field, Transformation Type, Description</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button onClick={() => navigate('/mappings')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            {method === 'manual' ? (
              <button onClick={handleManualCreate} disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create & Edit Mappings'}
              </button>
            ) : (
              <button onClick={handleGenerateSuggestions} disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Suggestions'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          suggestions={suggestions}
          onClose={() => setShowPreview(false)}
          onAccept={handleAcceptSuggestions}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
