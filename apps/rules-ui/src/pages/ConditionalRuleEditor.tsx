import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Play, Sparkles } from 'lucide-react';
import { getRule, createRule, updateRule, generateRuleFromDescription, GeneratedRule } from '@/api/rules';

interface Condition {
  field: string;
  operator: string;
  value: any;
}

interface Action {
  type: string;
  field: string;
  value: any;
}

export default function ConditionalRuleEditor() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const isNew = !ruleId || ruleId === 'new';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productLine: 'general-liability',
  });

  const [conditions, setConditions] = useState<Condition[]>([
    { field: '', operator: '==', value: '' },
  ]);

  const [actions, setActions] = useState<Action[]>([
    { type: 'surcharge', field: '', value: '' },
  ]);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [generatedRule, setGeneratedRule] = useState<GeneratedRule | null>(null);
  const [showTechnicalPreview, setShowTechnicalPreview] = useState(false);

  const { data: ruleData, isLoading } = useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => getRule(ruleId!),
    enabled: !isNew && !!ruleId,
  });

  useEffect(() => {
    if (ruleData) {
      setFormData({
        name: ruleData.name,
        description: ruleData.description || '',
        productLine: ruleData.productLine,
      });
      if (ruleData.data?.conditions) {
        setConditions(ruleData.data.conditions);
      }
      if (ruleData.data?.actions) {
        setActions(ruleData.data.actions);
      }
    }
  }, [ruleData]);

  const generateMutation = useMutation({
    mutationFn: async (description: string) => {
      return generateRuleFromDescription(description, formData.productLine, 'conditional');
    },
    onSuccess: (rule) => {
      setGeneratedRule(rule);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      if (isNew) {
        return createRule(ruleData);
      } else {
        return updateRule(ruleId!, ruleData);
      }
    },
    onSuccess: () => {
      navigate('/conditional-rules');
    },
  });

  const handleGenerateWithAI = () => {
    if (aiDescription.trim()) {
      generateMutation.mutate(aiDescription);
    }
  };

  const handleAcceptGenerated = () => {
    if (generatedRule) {
      setFormData({
        ...formData,
        name: generatedRule.name,
        description: generatedRule.description,
      });
      setConditions(generatedRule.conditions);
      setActions(generatedRule.actions);
      setShowAIModal(false);
      setGeneratedRule(null);
      setAiDescription('');
    }
  };

  const operators = [
    { value: '==', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '>=', label: 'greater than or equal' },
    { value: '<', label: 'less than' },
    { value: '<=', label: 'less than or equal' },
    { value: 'contains', label: 'contains' },
    { value: 'in', label: 'in list' },
  ];

  const actionTypes = [
    { value: 'surcharge', label: 'Apply Surcharge' },
    { value: 'discount', label: 'Apply Discount' },
    { value: 'set', label: 'Set Value' },
    { value: 'multiply', label: 'Multiply By' },
    { value: 'reject', label: 'Reject Quote' },
  ];

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: '==', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: 'surcharge', field: '', value: '' }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof Action, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSave = () => {
    const ruleData = {
      name: formData.name,
      description: formData.description,
      productLine: formData.productLine,
      conditions: conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
      actions: actions.map(a => ({
        type: a.type,
        field: a.field,
        value: a.value,
      })),
    };

    saveMutation.mutate(ruleData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/conditional-rules')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Conditional Rules
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Create Conditional Rule' : 'Edit Conditional Rule'}
          </h2>
          {isNew && (
            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </button>
          )}
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                placeholder="e.g., High Revenue Surcharge"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                placeholder="Describe what this rule does..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Line
              </label>
              <select
                value={formData.productLine}
                onChange={(e) =>
                  setFormData({ ...formData, productLine: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              >
                <option value="general-liability">General Liability</option>
                <option value="property">Property</option>
                <option value="workers-comp">Workers Compensation</option>
                <option value="auto">Auto</option>
                <option value="all">All Product Lines</option>
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Conditions (IF)
              </h3>
              <button
                onClick={addCondition}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {index > 0 && (
                    <span className="text-sm font-medium text-gray-500">AND</span>
                  )}
                  <input
                    type="text"
                    value={condition.field}
                    onChange={(e) =>
                      updateCondition(index, 'field', e.target.value)
                    }
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    placeholder="insured.annualRevenue"
                  />
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      updateCondition(index, 'operator', e.target.value)
                    }
                    className="rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, 'value', e.target.value)
                    }
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    placeholder="5000000"
                  />
                  <button
                    onClick={() => removeCondition(index)}
                    className="p-2 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Actions (THEN)
              </h3>
              <button
                onClick={addAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Action
              </button>
            </div>

            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, 'type', e.target.value)}
                    className="w-48 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={action.field}
                    onChange={(e) => updateAction(index, 'field', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    placeholder="premium"
                  />
                  <input
                    type="text"
                    value={action.value}
                    onChange={(e) => updateAction(index, 'value', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    placeholder="4.0"
                  />
                  <button
                    onClick={() => removeAction(index)}
                    className="p-2 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Rule Preview
            </h4>
            <div className="font-mono text-sm text-gray-700 space-y-1">
              <div className="text-blue-600">IF</div>
              {conditions.map((condition, index) => (
                <div key={index} className="pl-4">
                  {index > 0 && <span className="text-purple-600">AND </span>}
                  <span>{condition.field} </span>
                  <span className="text-orange-600">{condition.operator} </span>
                  <span className="text-green-600">{condition.value}</span>
                </div>
              ))}
              <div className="text-blue-600">THEN</div>
              {actions.map((action, index) => (
                <div key={index} className="pl-4">
                  <span className="text-purple-600">{action.type} </span>
                  <span>{action.field} </span>
                  <span className="text-green-600">{action.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Preview - What Will Be Saved */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowTechnicalPreview(!showTechnicalPreview)}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-3"
            >
              <svg
                className={`h-4 w-4 mr-2 transform transition-transform ${
                  showTechnicalPreview ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Preview Database Payload
            </button>

            {showTechnicalPreview && (
              <div className="mb-4">
                <div className="bg-gray-900 text-green-400 rounded-md p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  <div className="text-yellow-400 mb-2">// Data that will be sent to API and saved to PostgreSQL:</div>
                  <pre>{JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    productLine: formData.productLine,
                    conditions: conditions.map((c, idx) => ({
                      condition_order: idx,
                      field_path: c.field,
                      operator: c.operator,
                      value: c.value,
                      logical_operator: idx === 0 ? null : 'AND'
                    })),
                    actions: actions.map((a, idx) => ({
                      action_order: idx,
                      type: a.type,
                      field: a.field,
                      value: a.value
                    })),
                    metadata: {
                      api_endpoint: isNew ? 'POST /api/v1/rules' : `PUT /api/v1/rules/${ruleId}`,
                      timestamp: new Date().toISOString(),
                      status: 'draft'
                    }
                  }, null, 2)}</pre>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 This shows the exact JSON structure that will be stored in PostgreSQL tables:
                  <code className="bg-gray-100 px-1 py-0.5 rounded">conditional_rules</code>,
                  <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">rule_conditions</code>,
                  <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">rule_actions</code>
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4">
            {saveMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Failed to save rule. Please try again.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate('/conditional-rules')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Test
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Generate Rule with AI
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setGeneratedRule(null);
                  setAiDescription('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!generatedRule ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe the rule in plain English
                    </label>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      placeholder="Example: Apply 10% surcharge if annual revenue exceeds 5 million dollars"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Describe what condition should trigger the rule and what action should be taken.
                    </p>
                  </div>

                  {generateMutation.isError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        Failed to generate rule. Please try again.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Generated Rule</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        generatedRule.confidence > 0.8
                          ? 'bg-green-100 text-green-800'
                          : generatedRule.confidence > 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {Math.round(generatedRule.confidence * 100)}% confident
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <label className="block text-xs font-medium text-blue-700 mb-1">Your Input</label>
                        <p className="text-sm text-blue-900 italic">"{aiDescription}"</p>
                      </div>

                      <div className="flex items-center justify-center">
                        <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{generatedRule.name}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500">Structured Description</label>
                        <p className="mt-1 text-sm text-gray-900">{generatedRule.description}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-mono text-sm space-y-1">
                          <div className="text-blue-600">IF</div>
                          {generatedRule.conditions.map((condition, index) => (
                            <div key={index} className="pl-4">
                              {index > 0 && <span className="text-purple-600">AND </span>}
                              <span>{condition.field} </span>
                              <span className="text-orange-600">{condition.operator} </span>
                              <span className="text-green-600">{condition.value}</span>
                            </div>
                          ))}
                          <div className="text-blue-600">THEN</div>
                          {generatedRule.actions.map((action, index) => (
                            <div key={index} className="pl-4">
                              <span className="text-purple-600">{action.type} </span>
                              <span>{action.field} </span>
                              <span className="text-green-600">{action.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        <strong>AI Reasoning:</strong> {generatedRule.reasoning}
                      </div>

                      {/* Technical Preview */}
                      <div className="mt-4 border-t pt-3">
                        <button
                          onClick={() => setShowTechnicalPreview(!showTechnicalPreview)}
                          className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900"
                        >
                          <svg
                            className={`h-4 w-4 mr-1 transform transition-transform ${
                              showTechnicalPreview ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Technical Preview (Database Format)
                        </button>

                        {showTechnicalPreview && (
                          <div className="mt-2 bg-gray-900 text-green-400 rounded-md p-3 font-mono text-xs overflow-auto max-h-64">
                            <pre>{JSON.stringify({
                              name: generatedRule.name,
                              description: generatedRule.description,
                              productLine: formData.productLine,
                              conditions: generatedRule.conditions.map((c, idx) => ({
                                condition_order: idx,
                                field_path: c.field,
                                operator: c.operator,
                                value: c.value
                              })),
                              actions: generatedRule.actions.map((a, idx) => ({
                                action_order: idx,
                                type: a.type,
                                field: a.field,
                                value: a.value
                              }))
                            }, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer with Buttons */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
              {!generatedRule ? (
                <>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={!aiDescription.trim() || generateMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generateMutation.isPending ? 'Generating...' : 'Generate Rule'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setGeneratedRule(null);
                      setAiDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleAcceptGenerated}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Accept & Use This Rule
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
