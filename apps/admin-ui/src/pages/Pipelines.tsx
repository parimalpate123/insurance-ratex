import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GitBranch, Play, Edit2, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { pipelinesApi, Pipeline, PipelineStep, RoutingRule, PipelineExecutionResult } from '../api/pipelines';
import { systemsApi } from '../api/systems';
import { mappingsApi } from '../api/mappings';
import { productLinesApi } from '../api/product-lines';

// ── Step type options ─────────────────────────────────────────────────────────
const STEP_TYPES = [
  { value: 'validate',              label: 'Validate',               desc: 'Check required fields & data types before processing' },
  { value: 'map_request',           label: 'Map Request',             desc: 'Transform source fields → target system format (request direction mappings)' },
  { value: 'apply_rules',           label: 'Apply Rules',             desc: 'Evaluate pre-rating business rules (eligibility, factor loading)' },
  { value: 'call_system',           label: 'Call Rating Engine',      desc: 'Send transformed request to external system (Earnix / Ratabase)' },
  { value: 'map_response',          label: 'Map Response',            desc: 'Transform target system response → standard output format (response direction mappings)' },
  { value: 'apply_response_rules',  label: 'Apply Response Rules',    desc: 'Post-rating adjustments on the response (caps, surcharges, overrides)' },
  { value: 'enrich',                label: 'Enrich',                  desc: 'Lookup table enrichment — resolve codes to values' },
  { value: 'mock_response',         label: 'Mock Response',           desc: 'Inject a static response for dev/testing (skips Call Rating Engine)' },
];

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  draft:    'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

const emptyStep = (): PipelineStep => ({ stepOrder: 1, stepType: 'validate', name: '', config: {} });
const emptyRule = (): RoutingRule => ({ productLine: '', sourceSystem: '', transactionType: '', priority: 0 });

// Default steps for a new pipeline — covers the standard insurance integration flow
const defaultSteps = (): PipelineStep[] => [
  { stepOrder: 1, stepType: 'validate',             name: 'Validate Request',       config: {} },
  { stepOrder: 2, stepType: 'map_request',           name: 'Map Request',             config: {} },
  { stepOrder: 3, stepType: 'apply_rules',           name: 'Apply Pre-Rating Rules',  config: {} },
  { stepOrder: 4, stepType: 'call_system',           name: 'Call Rating Engine',      config: {} },
  { stepOrder: 5, stepType: 'map_response',          name: 'Map Response',            config: {} },
  { stepOrder: 6, stepType: 'apply_response_rules',  name: 'Apply Response Rules',    config: {} },
];

const emptyPipeline = (): Partial<Pipeline> => ({
  name: '',
  description: '',
  productLineCode: '',
  sourceSystemCode: '',
  targetSystemCode: '',
  status: 'draft',
  steps: defaultSteps(),
  routingRules: [emptyRule()],
});

// ── Step Config Editor ────────────────────────────────────────────────────────
function StepConfigEditor({
  step,
  mappings,
  systems,
  onChange,
}: {
  step: PipelineStep;
  mappings: any[];
  systems: any[];
  onChange: (config: Record<string, any>) => void;
}) {
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500';

  if (step.stepType === 'validate') {
    return (
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500">Schema File <span className="text-gray-400">(from Knowledge Base)</span></label>
          <input
            className={inputCls}
            value={step.config.schemaFile ?? ''}
            onChange={e => onChange({ ...step.config, schemaFile: e.target.value })}
            placeholder="e.g. gw-rating-request-schema.json"
          />
        </div>
        <p className="text-xs text-gray-400">
          Upload the schema file via the Knowledge Base page. Leave empty to pass through without validation.
        </p>
      </div>
    );
  }

  if (step.stepType === 'map_request' || step.stepType === 'transform') {
    return (
      <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded">
        Auto-discovers all <strong>active request-direction</strong> mappings linked to this pipeline. Link mappings via the Mappings page → pipeline link button → set direction to <strong>Request</strong>.
      </p>
    );
  }

  if (step.stepType === 'apply_rules' || step.stepType === 'execute_rules') {
    return (
      <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded">
        Auto-discovers all <strong>active</strong> rules linked to this pipeline. Link rules via the Rules page using the <strong>pipeline link</strong> button.
      </p>
    );
  }

  if (step.stepType === 'call_system') {
    return (
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500">Target System</label>
          <select className={inputCls} value={step.config.systemCode ?? ''} onChange={e => onChange({ ...step.config, systemCode: e.target.value })}>
            <option value="">-- select system --</option>
            {systems.filter(s => s.type !== 'source').map(s => <option key={s.id} value={s.code}>{s.name} ({s.format.toUpperCase()})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Method</label>
            <select className={inputCls} value={step.config.method ?? 'POST'} onChange={e => onChange({ ...step.config, method: e.target.value })}>
              <option>POST</option><option>GET</option><option>PUT</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Path (optional)</label>
            <input className={inputCls} value={step.config.path ?? ''} placeholder="/rate" onChange={e => onChange({ ...step.config, path: e.target.value })} />
          </div>
        </div>
      </div>
    );
  }

  if (step.stepType === 'mock_response') {
    return (
      <div>
        <label className="text-xs text-gray-500">Mock Response (JSON)</label>
        <textarea
          className={inputCls + ' font-mono'}
          rows={4}
          value={typeof step.config.response === 'object' ? JSON.stringify(step.config.response, null, 2) : (step.config.response ?? '')}
          onChange={e => {
            try { onChange({ response: JSON.parse(e.target.value) }); } catch { onChange({ response: e.target.value }); }
          }}
          placeholder='{"premium": {"total": 1200}}'
        />
      </div>
    );
  }

  if (step.stepType === 'map_response' || step.stepType === 'transform_response') {
    return (
      <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
        Auto-discovers all <strong>active response-direction</strong> mappings linked to this pipeline. Maps the rating engine response back to the standard output format. Link mappings via the Mappings page → pipeline link button → set direction to <strong>Response</strong>.
      </p>
    );
  }

  if (step.stepType === 'apply_response_rules') {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
        Applies rules against the <strong>response</strong> object (premium caps, surcharges, minimum premium overrides). Uses the same rules linked to this pipeline — rule conditions are evaluated against <code>context.response</code>.
      </p>
    );
  }

  if (step.stepType === 'enrich') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Lookup table enrichment — add one row per lookup:</p>
        {(step.config.lookups ?? [{ sourceField: '', tableKey: '', targetField: '' }]).map((lk: any, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-1">
            <input className={inputCls} value={lk.sourceField} onChange={e => { const ls = [...(step.config.lookups ?? [])]; ls[i] = { ...ls[i], sourceField: e.target.value }; onChange({ ...step.config, lookups: ls }); }} placeholder="classification.code" />
            <input className={inputCls} value={lk.tableKey}    onChange={e => { const ls = [...(step.config.lookups ?? [])]; ls[i] = { ...ls[i], tableKey: e.target.value };    onChange({ ...step.config, lookups: ls }); }} placeholder="state-class-mapping" />
            <input className={inputCls} value={lk.targetField} onChange={e => { const ls = [...(step.config.lookups ?? [])]; ls[i] = { ...ls[i], targetField: e.target.value }; onChange({ ...step.config, lookups: ls }); }} placeholder="classification.label" />
          </div>
        ))}
        <button className="text-xs text-primary-600 hover:underline" onClick={() => onChange({ ...step.config, lookups: [...(step.config.lookups ?? []), { sourceField: '', tableKey: '', targetField: '' }] })}>+ Add lookup</button>
        <p className="text-xs text-gray-400">Columns: source field path · lookup table key · target field path</p>
      </div>
    );
  }

  return null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Pipelines() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Pipeline> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [testTarget, setTestTarget] = useState<Pipeline | null>(null);
  const [testInput, setTestInput] = useState('{\n  "quoteNumber": "GW-2026-TEST",\n  "insured": { "name": "Acme Corp", "state": "TX" },\n  "classification": { "code": "5403" }\n}');
  const [testResult, setTestResult] = useState<PipelineExecutionResult | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesApi.list,
  });

  const { data: systems = [] } = useQuery({ queryKey: ['systems'], queryFn: () => systemsApi.list() });
  const { data: mappings = [] } = useQuery({ queryKey: ['mappings-all'], queryFn: () => mappingsApi.list() });
  const { data: productLines = [] } = useQuery({ queryKey: ['product-lines'], queryFn: () => productLinesApi.getAll() });

  const saveMutation = useMutation({
    mutationFn: (p: Partial<Pipeline>) =>
      p.id ? pipelinesApi.update(p.id, p) : pipelinesApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pipelines'] }); setEditing(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => pipelinesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  });

  const runTest = async () => {
    if (!testTarget) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const data = JSON.parse(testInput);
      const result = await pipelinesApi.execute(testTarget.id, data);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message, pipelineId: testTarget.id, pipelineName: testTarget.name, input: {}, output: {}, steps: [], durationMs: 0 });
    } finally {
      setTestRunning(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  const updateStep = (idx: number, patch: Partial<PipelineStep>) => {
    if (!editing) return;
    const steps = [...(editing.steps ?? [])];
    steps[idx] = { ...steps[idx], ...patch };
    setEditing({ ...editing, steps });
  };

  const addStep = () => {
    if (!editing) return;
    const steps = [...(editing.steps ?? [])];
    setEditing({ ...editing, steps: [...steps, { ...emptyStep(), stepOrder: steps.length + 1 }] });
  };

  const removeStep = (idx: number) => {
    if (!editing) return;
    const steps = (editing.steps ?? []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setEditing({ ...editing, steps });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipelines</h1>
          <p className="text-gray-500 text-sm mt-1">Define end-to-end flows: validate → map request → apply rules → call engine → map response → apply response rules</p>
        </div>
        <button
          onClick={() => { setEditing(emptyPipeline()); setIsNew(true); }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> New Pipeline
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : pipelines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <GitBranch className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No pipelines yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first pipeline to define a GW→Earnix or GW→Ratabase flow</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pipelines.map((p) => (
            <PipelineCard
              key={p.id}
              pipeline={p}
              systems={systems}
              onEdit={() => { setEditing({ ...p }); setIsNew(false); }}
              onDelete={() => removeMutation.mutate(p.id)}
              onTest={() => { setTestTarget(p); setTestResult(null); }}
            />
          ))}
        </div>
      )}

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
            <div className="p-8">
              <h2 className="text-xl font-bold mb-6">{isNew ? 'New Pipeline' : 'Edit Pipeline'}</h2>
              <div className="space-y-5">
                {/* Top row: Product Line · Pipeline Name · Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Product Line *</label>
                    <select
                      className={inputCls}
                      value={editing.productLineCode ?? ''}
                      onChange={e => {
                        const rr = [...(editing.routingRules ?? [emptyRule()])];
                        if (rr.length > 0) rr[0] = { ...rr[0], productLine: e.target.value };
                        setEditing({ ...editing, productLineCode: e.target.value, routingRules: rr });
                      }}
                    >
                      <option value="">-- select product line --</option>
                      {productLines.map(pl => (
                        <option key={pl.code} value={pl.code}>{pl.name} ({pl.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pipeline Name *</label>
                    <input className={inputCls} value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="GW → Earnix GL" />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as any })}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls} rows={2} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Describe what this pipeline does, e.g. GW → Earnix for GL new business" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Source System</label>
                    <select className={inputCls} value={editing.sourceSystemCode ?? ''} onChange={e => setEditing({ ...editing, sourceSystemCode: e.target.value })}>
                      <option value="">-- any --</option>
                      {systems.filter(s => s.type !== 'target').map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Target System</label>
                    <select className={inputCls} value={editing.targetSystemCode ?? ''} onChange={e => setEditing({ ...editing, targetSystemCode: e.target.value })}>
                      <option value="">-- any --</option>
                      {systems.filter(s => s.type !== 'source').map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">Pipeline Steps</label>
                    <button onClick={addStep} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Step
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editing.steps ?? []).map((step, idx) => {
                      const stepMeta = STEP_TYPES.find(t => t.value === step.stepType);
                      return (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          {/* Row 1: order badge + type selector + name input + delete */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className="shrink-0 text-xs bg-primary-100 text-primary-700 font-bold w-8 h-8 flex items-center justify-center rounded-full">
                              {step.stepOrder}
                            </span>
                            <select
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                              value={step.stepType}
                              onChange={e => updateStep(idx, { stepType: e.target.value as any, config: {} })}
                            >
                              {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <input
                              className="w-52 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={step.name ?? ''}
                              onChange={e => updateStep(idx, { name: e.target.value })}
                              placeholder="Step label (optional)"
                            />
                            <button onClick={() => removeStep(idx)} className="shrink-0 p-2 hover:bg-red-50 rounded-lg" title="Remove step">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                          {/* Description hint */}
                          {stepMeta && (
                            <p className="text-xs text-gray-400 ml-11 mb-2">{stepMeta.desc}</p>
                          )}
                          {/* Config editor */}
                          <div className="ml-11">
                            <StepConfigEditor
                              step={step}
                              mappings={mappings}
                              systems={systems}
                              onChange={(config) => updateStep(idx, { config })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Routing Rules */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">Routing Rules</label>
                    <span className="text-xs text-gray-400">Defines when inbound requests are directed to this pipeline</span>
                  </div>
                  {(editing.routingRules ?? []).map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-3 mb-2 items-end">
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Product Line</label>
                        <input
                          className={inputCls + ' bg-gray-50'}
                          value={editing.productLineCode ?? rule.productLine ?? ''}
                          readOnly
                          title="Set by product line selection above"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Source System</label>
                        <select className={inputCls} value={rule.sourceSystem ?? ''} onChange={e => { const rr = [...(editing.routingRules ?? [])]; rr[idx] = { ...rr[idx], sourceSystem: e.target.value }; setEditing({ ...editing, routingRules: rr }); }}>
                          <option value="">-- any --</option>
                          {systems.filter(s => s.type !== 'target').map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Txn Type (optional)</label>
                        <input className={inputCls} value={rule.transactionType ?? ''} onChange={e => { const rr = [...(editing.routingRules ?? [])]; rr[idx] = { ...rr[idx], transactionType: e.target.value }; setEditing({ ...editing, routingRules: rr }); }} placeholder="new_business" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Priority</label>
                        <input className={inputCls} type="number" value={rule.priority ?? 0} onChange={e => { const rr = [...(editing.routingRules ?? [])]; rr[idx] = { ...rr[idx], priority: Number(e.target.value) }; setEditing({ ...editing, routingRules: rr }); }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditing({ ...editing, routingRules: [...(editing.routingRules ?? []), { ...emptyRule(), productLine: editing.productLineCode ?? '' }] })} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Routing Rule
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save Pipeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Test Modal ── */}
      {testTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Play className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-bold">Test Pipeline: {testTarget.name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Input Data (JSON)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono h-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Output</label>
                  <pre className="bg-gray-900 text-green-300 rounded-lg p-3 text-xs font-mono h-64 overflow-auto">
                    {testResult ? JSON.stringify(testResult.output, null, 2) : '{}'}
                  </pre>
                </div>
              </div>

              {testResult && (
                <div className="mt-4">
                  <div className={`flex items-center gap-2 mb-3 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success
                      ? <CheckCircle className="h-4 w-4" />
                      : <XCircle className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {testResult.success ? 'Pipeline succeeded' : `Failed: ${testResult.error}`}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{testResult.durationMs}ms
                    </span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase text-left">
                        <th className="px-3 py-2 border border-gray-200">#</th>
                        <th className="px-3 py-2 border border-gray-200">Step</th>
                        <th className="px-3 py-2 border border-gray-200">Type</th>
                        <th className="px-3 py-2 border border-gray-200">Status</th>
                        <th className="px-3 py-2 border border-gray-200">Detail</th>
                        <th className="px-3 py-2 border border-gray-200">ms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResult.steps.map((s, i) => (
                        <tr key={i} className={s.success ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 border border-gray-200">{s.stepOrder}</td>
                          <td className="px-3 py-2 border border-gray-200 font-medium">{s.name}</td>
                          <td className="px-3 py-2 border border-gray-200 text-gray-500">{s.stepType}</td>
                          <td className="px-3 py-2 border border-gray-200">
                            {s.success
                              ? <span className="text-green-600">✓</span>
                              : <span className="text-red-600" title={s.error}>✗ {s.error}</span>}
                          </td>
                          <td className="px-3 py-2 border border-gray-200 text-gray-400 max-w-xs truncate">
                            {s.detail ? JSON.stringify(s.detail) : '—'}
                          </td>
                          <td className="px-3 py-2 border border-gray-200 text-gray-400">{s.durationMs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setTestTarget(null); setTestResult(null); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Close</button>
                <button
                  onClick={runTest}
                  disabled={testRunning}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {testRunning ? 'Running…' : 'Run Pipeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pipeline Card ─────────────────────────────────────────────────────────────
function PipelineCard({
  pipeline, systems, onEdit, onDelete, onTest,
}: {
  pipeline: Pipeline;
  systems: any[];
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const srcSystem = systems.find(s => s.code === pipeline.sourceSystemCode);
  const tgtSystem = systems.find(s => s.code === pipeline.targetSystemCode);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="flex items-center gap-4 p-4">
        <div className="p-2 bg-primary-50 rounded-lg">
          <GitBranch className="h-5 w-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{pipeline.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pipeline.status]}`}>
              {pipeline.status}
            </span>
            {pipeline.productLineCode && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">{pipeline.productLineCode}</span>
            )}
          </div>
          {pipeline.description && <p className="text-xs text-gray-500 mt-0.5">{pipeline.description}</p>}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            {srcSystem && <span>{srcSystem.name} ({srcSystem.format.toUpperCase()})</span>}
            {srcSystem && tgtSystem && <span>→</span>}
            {tgtSystem && <span>{tgtSystem.name} ({tgtSystem.format.toUpperCase()})</span>}
            <span className="ml-2">{pipeline.steps?.length ?? 0} steps</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTest} title="Run pipeline" className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
            <Play className="h-3 w-3" /> Test
          </button>
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="h-4 w-4 text-gray-500" /></button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-gray-100 rounded-lg">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex gap-8">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Steps</p>
              <div className="space-y-1">
                {(pipeline.steps ?? []).sort((a, b) => a.stepOrder - b.stepOrder).map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#{s.stepOrder}</span>
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{s.stepType}</span>
                    <span className="text-gray-700">{s.name || s.config.mappingName || s.config.systemCode || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            {(pipeline.routingRules ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Routing Rules</p>
                {pipeline.routingRules.map(r => (
                  <div key={r.id} className="text-xs text-gray-600">
                    {[r.productLine, r.sourceSystem, r.transactionType].filter(Boolean).join(' · ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
