import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, CheckCircle, Play } from 'lucide-react';
import { rulesApi, ConditionalRule, RuleOperator, ActionType } from '@/api/rules';
import { useProductLine } from '@/contexts/ProductLineContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface ConditionRow {
  fieldPath: string;
  operator: RuleOperator;
  value: string;
}

interface ActionRow {
  actionType: ActionType;
  targetField: string;
  value: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: '==', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: '>= (gte)' },
  { value: '<', label: 'less than' },
  { value: '<=', label: '<= (lte)' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'in list' },
  { value: 'not_in', label: 'not in list' },
  { value: 'is_null', label: 'is null' },
  { value: 'is_not_null', label: 'is not null' },
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'surcharge', label: 'Apply Surcharge (%)' },
  { value: 'discount', label: 'Apply Discount (%)' },
  { value: 'multiply', label: 'Multiply By' },
  { value: 'set', label: 'Set Value' },
  { value: 'add', label: 'Add Amount' },
  { value: 'subtract', label: 'Subtract Amount' },
  { value: 'reject', label: 'Reject Quote' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ruleToRows(rule: ConditionalRule): { conditions: ConditionRow[]; actions: ActionRow[] } {
  const conditions = (rule.conditions ?? [])
    .sort((a, b) => a.conditionOrder - b.conditionOrder)
    .map((c) => ({ fieldPath: c.fieldPath, operator: c.operator, value: String(c.value ?? '') }));

  const actions = (rule.actions ?? [])
    .sort((a, b) => a.actionOrder - b.actionOrder)
    .map((a) => ({ actionType: a.actionType, targetField: a.targetField, value: String(a.value ?? '') }));

  return { conditions, actions };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedProductLine } = useProductLine();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [conditions, setConditions] = useState<ConditionRow[]>([{ fieldPath: '', operator: '==', value: '' }]);
  const [actions, setActions] = useState<ActionRow[]>([{ actionType: 'surcharge', targetField: '', value: '' }]);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [saveError, setSaveError] = useState('');

  // ── Load existing rule ──────────────────────────────────────────────────

  const initialized = useRef(false);

  const { data: ruleData, isLoading } = useQuery({
    queryKey: ['rule', id],
    queryFn: () => rulesApi.getById(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (ruleData && !initialized.current) {
      initialized.current = true;
      setName(ruleData.name);
      setDescription(ruleData.description ?? '');
      setPriority(ruleData.priority ?? 0);
      const rows = ruleToRows(ruleData);
      if (rows.conditions.length) setConditions(rows.conditions);
      if (rows.actions.length) setActions(rows.actions);
    }
  }, [ruleData]);

  // ── AI generation ───────────────────────────────────────────────────────

  const aiMutation = useMutation({
    mutationFn: () =>
      rulesApi.generateWithAI({
        productLineCode: selectedProductLine?.code ?? 'GL_EXISTING',
        requirements: aiPrompt,
      }),
    onSuccess: ({ rule }) => {
      setName(rule.name);
      setDescription(rule.description ?? '');
      const rows = ruleToRows(rule);
      if (rows.conditions.length) setConditions(rows.conditions);
      if (rows.actions.length) setActions(rows.actions);
      setShowAI(false);
      setAiPrompt('');
    },
  });

  // ── Save ─────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description,
        priority,
        productLine: selectedProductLine?.name ?? 'General Liability',
        productLineCode: selectedProductLine?.code ?? undefined,
        conditions: conditions.map((c, i) => ({
          fieldPath: c.fieldPath,
          operator: c.operator,
          value: c.value,
          conditionOrder: i,
        })),
        actions: actions.map((a, i) => ({
          actionType: a.actionType,
          targetField: a.targetField,
          value: a.value,
          actionOrder: i,
        })),
      };
      return isNew ? rulesApi.create(payload) : rulesApi.update(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      navigate('/rules');
    },
    onError: (err: any) => {
      setSaveError(err?.response?.data?.message ?? err.message ?? 'Save failed');
    },
  });

  // ── Condition helpers ───────────────────────────────────────────────────

  const updateCond = (i: number, patch: Partial<ConditionRow>) =>
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const addCond = () =>
    setConditions((prev) => [...prev, { fieldPath: '', operator: '==', value: '' }]);

  const removeCond = (i: number) =>
    setConditions((prev) => prev.filter((_, idx) => idx !== i));

  // ── Action helpers ──────────────────────────────────────────────────────

  const updateAction = (i: number, patch: Partial<ActionRow>) =>
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const addAction = () =>
    setActions((prev) => [...prev, { actionType: 'surcharge', targetField: '', value: '' }]);

  const removeAction = (i: number) =>
    setActions((prev) => prev.filter((_, idx) => idx !== i));

  // ── Render ──────────────────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
      </div>
    );
  }

  const inputCls = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
  const selectCls = 'rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/rules')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Rules
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Rule' : 'Edit Rule'}</h1>
        <button
          onClick={() => setShowAI(true)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate with AI</span>
        </button>
      </div>

      {/* Basic info */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Rule Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g., High_Revenue_Surcharge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className={inputCls}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Describe what this rule does..."
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Conditions <span className="text-blue-600 font-bold">(IF)</span>
          </h2>
          <button onClick={addCond} className="btn btn-secondary text-xs flex items-center space-x-1">
            <Plus className="h-3 w-3" />
            <span>Add Condition</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 grid grid-cols-[1fr_140px_1fr_32px] gap-2 px-1">
          <span>Field path</span><span>Operator</span><span>Value</span><span />
        </div>

        {conditions.map((cond, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_1fr_32px] gap-2 items-center">
            {i > 0 && (
              <span className="col-span-4 text-xs font-semibold text-purple-600 -mb-1 ml-1">AND</span>
            )}
            <input
              type="text"
              value={cond.fieldPath}
              onChange={(e) => updateCond(i, { fieldPath: e.target.value })}
              className={inputCls}
              placeholder="insured.annualRevenue"
            />
            <select
              value={cond.operator}
              onChange={(e) => updateCond(i, { operator: e.target.value as RuleOperator })}
              className={selectCls}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={cond.value}
              onChange={(e) => updateCond(i, { value: e.target.value })}
              className={inputCls}
              placeholder="5000000"
              disabled={cond.operator === 'is_null' || cond.operator === 'is_not_null'}
            />
            <button onClick={() => removeCond(i)} disabled={conditions.length === 1}
              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Actions <span className="text-green-600 font-bold">(THEN)</span>
          </h2>
          <button onClick={addAction} className="btn btn-secondary text-xs flex items-center space-x-1">
            <Plus className="h-3 w-3" />
            <span>Add Action</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 grid grid-cols-[160px_1fr_1fr_32px] gap-2 px-1">
          <span>Action type</span><span>Target field</span><span>Value</span><span />
        </div>

        {actions.map((act, i) => (
          <div key={i} className="grid grid-cols-[160px_1fr_1fr_32px] gap-2 items-center">
            <select
              value={act.actionType}
              onChange={(e) => updateAction(i, { actionType: e.target.value as ActionType })}
              className={selectCls}
            >
              {ACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={act.targetField}
              onChange={(e) => updateAction(i, { targetField: e.target.value })}
              className={inputCls}
              placeholder="premium"
              disabled={act.actionType === 'reject'}
            />
            <input
              type="text"
              value={act.value}
              onChange={(e) => updateAction(i, { value: e.target.value })}
              className={inputCls}
              placeholder={act.actionType === 'reject' ? 'reason (optional)' : '0.20'}
            />
            <button onClick={() => removeAction(i)} disabled={actions.length === 1}
              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="card bg-gray-50">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rule Preview</h2>
        <div className="font-mono text-sm space-y-1">
          <div className="text-blue-600 font-semibold">IF</div>
          {conditions.map((c, i) => (
            <div key={i} className="pl-4">
              {i > 0 && <span className="text-purple-600">AND </span>}
              <span className="text-gray-700">{c.fieldPath || '?'} </span>
              <span className="text-orange-500">{c.operator} </span>
              <span className="text-green-600">{c.value || '?'}</span>
            </div>
          ))}
          <div className="text-blue-600 font-semibold mt-1">THEN</div>
          {actions.map((a, i) => (
            <div key={i} className="pl-4">
              <span className="text-purple-600">{a.actionType} </span>
              <span className="text-gray-700">{a.targetField || '?'} </span>
              <span className="text-green-600">{a.value || '?'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {!saveError && <span />}
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/rules')} className="btn btn-secondary">Cancel</button>
          <button
            onClick={() => { setSaveError(''); saveMutation.mutate(); }}
            disabled={saveMutation.isPending || !name.trim()}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save Rule'}</span>
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Generate Rule with AI</h3>
              </div>
              <button onClick={() => { setShowAI(false); setAiPrompt(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the rule in plain English
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g., Apply a 20% surcharge if the building age is over 40 years and located in California"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the condition(s) and what should happen when they are met.
                </p>
              </div>

              {aiMutation.isError && (
                <p className="text-sm text-red-600">
                  {(aiMutation.error as any)?.response?.data?.message ?? 'AI generation failed. Check AWS Bedrock credentials.'}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => { setShowAI(false); setAiPrompt(''); }} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => aiMutation.mutate()}
                disabled={!aiPrompt.trim() || aiMutation.isPending}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{aiMutation.isPending ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
