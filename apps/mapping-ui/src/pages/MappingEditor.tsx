import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { getMapping, FieldMapping, getSuggestedMappings, MappingSuggestion, FieldInfo } from '@/api/mappings';

export default function MappingEditor() {
  const { mappingId } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<MappingSuggestion[]>([]);

  const { data: mapping, isLoading } = useQuery({
    queryKey: ['mapping', mappingId],
    queryFn: () => getMapping(mappingId!),
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      // Mock source and target fields for demo
      const sourceFields: FieldInfo[] = [
        { path: '$.Quote.QuoteNumber', name: 'QuoteNumber', type: 'string' },
        { path: '$.Quote.AccountHolder.Name', name: 'AccountHolderName', type: 'string' },
        { path: '$.Quote.Effective', name: 'EffectiveDate', type: 'date' },
        { path: '$.Quote.Premium', name: 'Premium', type: 'number' },
      ];
      const targetFields: FieldInfo[] = [
        { path: 'policyId', name: 'policyId', type: 'string' },
        { path: 'insured.name', name: 'insuredName', type: 'string' },
        { path: 'effectiveDate', name: 'effectiveDate', type: 'date' },
        { path: 'premium', name: 'premium', type: 'number' },
      ];

      return getSuggestedMappings(
        sourceFields,
        targetFields,
        mapping!.sourceSystem,
        mapping!.targetSystem,
        mapping!.productLine
      );
    },
    onSuccess: (suggestions) => {
      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!mapping) {
    return <div>Mapping not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/mappings')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Mappings
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{mapping.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {mapping.sourceSystem} → {mapping.targetSystem} •{' '}
            {mapping.productLine} • v{mapping.version}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Play className="h-4 w-4 mr-2" />
            Test Mapping
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Field Mappings List */}
        <div className="col-span-7">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Field Mappings ({mapping.fields.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => suggestMutation.mutate()}
                  disabled={suggestMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {suggestMutation.isPending ? 'Suggesting...' : 'AI Suggest'}
                </button>
                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {mapping.fields.map((field: FieldMapping) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field.id)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    selectedField === field.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {field.target}
                        </span>
                        {field.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {field.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                          {field.source}
                        </code>
                        <span className="mx-2">→</span>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                          {field.target}
                        </code>
                      </div>
                      {field.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <button className="ml-2 p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Field Editor Panel */}
        <div className="col-span-5">
          {selectedField ? (
            <FieldEditorPanel
              field={mapping.fields.find((f) => f.id === selectedField)!}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              <p>Select a field to edit its configuration</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Panel */}
      {showTestPanel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Test Mapping
              </h3>
              <button
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Data (JSON)
                  </label>
                  <textarea
                    className="w-full h-64 font-mono text-xs border-gray-300 rounded-md"
                    placeholder='{"Quote": {"QuoteNumber": "Q-001"}}'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transformed Output
                  </label>
                  <div className="w-full h-64 bg-gray-50 border border-gray-300 rounded-md p-3 font-mono text-xs overflow-auto">
                    <pre>Result will appear here...</pre>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  AI Mapping Suggestions
                </h3>
              </div>
              <button
                onClick={() => setShowAISuggestions(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {aiSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No suggestions available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {suggestion.sourceField}
                            </code>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <code className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                              {suggestion.targetField}
                            </code>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                suggestion.confidence > 0.8
                                  ? 'bg-green-100 text-green-800'
                                  : suggestion.confidence > 0.6
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {Math.round(suggestion.confidence * 100)}% confident
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.reasoning}
                          </p>
                          {suggestion.suggestedTransformation && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">
                                Suggested transformation:
                              </span>
                              <code className="block mt-1 text-xs bg-gray-50 p-2 rounded">
                                {suggestion.suggestedTransformation}
                              </code>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                            <Check className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:bg-gray-50 rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAISuggestions(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldEditorPanel({ field }: { field: FieldMapping }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Field Configuration</h3>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source Path (JSONPath)
          </label>
          <input
            type="text"
            value={field.source}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
          />
          <p className="mt-1 text-xs text-gray-500">
            JSONPath expression for source field
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Field
          </label>
          <input
            type="text"
            value={field.target}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Transformation Type
          </label>
          <select
            value={field.type}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="direct">Direct Mapping</option>
            <option value="lookup">Lookup Table</option>
            <option value="expression">Expression</option>
            <option value="conditional">Conditional</option>
            <option value="static">Static Value</option>
            <option value="concat">Concatenation</option>
            <option value="split">Split</option>
            <option value="aggregate">Aggregate</option>
            <option value="custom">Custom Function</option>
            <option value="nested">Nested Object</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.required}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Required Field</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={field.description || ''}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Describe this field mapping..."
          />
        </div>

        {field.type === 'expression' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Transformation Expression
            </label>
            <textarea
              rows={4}
              className="mt-1 block w-full font-mono text-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., new Date(value).toISOString()"
            />
          </div>
        )}

        {field.type === 'lookup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lookup Table
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="">Select lookup table...</option>
              <option value="state-codes">State Codes</option>
              <option value="business-types">Business Types</option>
              <option value="coverage-types">Coverage Types</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
