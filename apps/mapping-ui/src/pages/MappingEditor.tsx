import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  CheckCircle,
  XCircle,
  List,
} from 'lucide-react';
import { getMapping, updateMapping, FieldMapping, getSuggestedMappings, MappingSuggestion, FieldInfo } from '@/api/mappings';
import { getDataTypes } from '@/api/data-types';
import AddFieldModal from '@/components/AddFieldModal';

export default function MappingEditor() {
  const { mappingId } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<MappingSuggestion[]>([]);
  const [testSourceData, setTestSourceData] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Show success message if coming from create flow
  useState(() => {
    if (location.state?.mappingCreated) {
      setNotification({
        type: 'success',
        message: 'Mapping created successfully!',
      });
      setTimeout(() => setNotification(null), 5000);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  });

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!mapping) throw new Error('No mapping to save');
      return updateMapping(mappingId!, {
        name: mapping.name,
        status: mapping.status,
        // Add other fields as needed
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping', mappingId] });
      setNotification({
        type: 'success',
        message: 'Changes saved successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to save changes. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async (fieldData: {
      sourcePath: string;
      targetPath: string;
      transformationType: string;
      isRequired: boolean;
      description: string;
      defaultValue?: string;
    }) => {
      const response = await fetch(`http://localhost:3000/api/v1/mappings/${mappingId}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping', mappingId] });
      setShowAddFieldModal(false);
      setNotification({
        type: 'success',
        message: 'Field mapping added successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to add field. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const testMappingMutation = useMutation({
    mutationFn: async (sourceData: string) => {
      const parsed = JSON.parse(sourceData);
      const response = await fetch(`http://localhost:3000/api/v1/mappings/${mappingId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to test mapping');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setTestResult(result.data);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to test mapping. Please check your JSON syntax.',
      });
      setTimeout(() => setNotification(null), 5000);
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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{mapping.name}</h2>
              {mapping.mappingNumber && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                  {mapping.mappingNumber}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {mapping.sourceSystem} → {mapping.targetSystem} •{' '}
              {mapping.productLine} • v{mapping.version}
              {mapping.createdAt && (
                <> • Created {new Date(mapping.createdAt).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/mappings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <List className="h-4 w-4 mr-2" />
            View All Mappings
          </button>
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Play className="h-4 w-4 mr-2" />
            Test Mapping
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                <button
                  onClick={() => setShowAddFieldModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
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
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['mapping', mappingId] });
              }}
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
                onClick={() => {
                  setShowTestPanel(false);
                  setTestSourceData('');
                  setTestResult(null);
                }}
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
                    value={testSourceData}
                    onChange={(e) => setTestSourceData(e.target.value)}
                    className="w-full h-64 font-mono text-xs border-gray-300 rounded-md p-2"
                    placeholder='{"Quote": {"QuoteNumber": "Q-001", "Premium": 1000}}'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transformed Output
                  </label>
                  <div className="w-full h-64 bg-gray-50 border border-gray-300 rounded-md p-3 font-mono text-xs overflow-auto">
                    {testResult ? (
                      <pre>{JSON.stringify(testResult, null, 2)}</pre>
                    ) : (
                      <pre className="text-gray-400">Result will appear here...</pre>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setTestSourceData('');
                    setTestResult(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => testMappingMutation.mutate(testSourceData)}
                  disabled={!testSourceData.trim() || testMappingMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {testMappingMutation.isPending ? 'Running...' : 'Run Test'}
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

      {/* Add Field Modal */}
      <AddFieldModal
        isOpen={showAddFieldModal}
        onClose={() => setShowAddFieldModal(false)}
        onAdd={(fieldData) => addFieldMutation.mutate(fieldData)}
        isLoading={addFieldMutation.isPending}
      />
    </div>
  );
}

function FieldEditorPanel({
  field,
  onUpdate
}: {
  field: FieldMapping;
  onUpdate: () => void;
}) {
  const [editedField, setEditedField] = useState({
    source: field.source,
    target: field.target,
    type: field.type,
    required: field.required,
    description: field.description || '',
    defaultValue: field.defaultValue,
    transformation: field.transformation,
    validation: field.validation,
    dataType: (field as any).dataType || 'string',
    fieldDirection: (field as any).fieldDirection || 'both',
    fieldIdentifier: (field as any).fieldIdentifier || '',
    skipMapping: (field as any).skipMapping || false,
    skipBehavior: (field as any).skipBehavior || 'exclude',
    sampleInput: (field as any).sampleInput || '',
    sampleOutput: (field as any).sampleOutput || '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { data: dataTypes } = useQuery({
    queryKey: ['data-types'],
    queryFn: getDataTypes,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:3000/api/v1/mappings/fields/${field.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourcePath: editedField.source,
          targetPath: editedField.target,
          transformationType: editedField.type,
          isRequired: editedField.required,
          description: editedField.description,
          defaultValue: editedField.defaultValue,
          transformationConfig: editedField.transformation,
          validationRules: editedField.validation,
          dataType: editedField.dataType,
          fieldDirection: editedField.fieldDirection,
          fieldIdentifier: editedField.fieldIdentifier,
          skipMapping: editedField.skipMapping,
          skipBehavior: editedField.skipBehavior,
          sampleInput: editedField.sampleInput,
          sampleOutput: editedField.sampleOutput,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update field');
      }

      return response.json();
    },
    onSuccess: () => {
      setHasChanges(false);
      setNotification({
        type: 'success',
        message: 'Field updated successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
      onUpdate();
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to update field. Please try again.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleFieldChange = (updates: Partial<typeof editedField>) => {
    setEditedField({ ...editedField, ...updates });
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  return (
    <div className="bg-white shadow rounded-lg max-h-[calc(100vh-200px)] overflow-y-auto">
      {notification && (
        <div className={`mx-4 mt-4 rounded-lg p-3 flex items-center space-x-2 ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <p className={`text-xs font-medium ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="text-lg font-medium text-gray-900">Field Configuration</h3>
        {hasChanges && (
          <span className="text-xs text-orange-600 font-medium">
            Unsaved changes
          </span>
        )}
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source Path (JSONPath)
          </label>
          <input
            type="text"
            value={editedField.source}
            onChange={(e) => handleFieldChange({ source: e.target.value })}
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
            value={editedField.target}
            onChange={(e) => handleFieldChange({ target: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data Type
            </label>
            <select
              value={editedField.dataType}
              onChange={(e) => handleFieldChange({ dataType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {dataTypes?.map((type) => (
                <option key={type.id} value={type.typeName}>
                  {type.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Field Direction
            </label>
            <select
              value={editedField.fieldDirection}
              onChange={(e) => handleFieldChange({ fieldDirection: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="both">Both (Bidirectional)</option>
              <option value="input">Input Only</option>
              <option value="output">Output Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Field Identifier
          </label>
          <input
            type="text"
            value={editedField.fieldIdentifier}
            onChange={(e) => handleFieldChange({ fieldIdentifier: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="policy.number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Transformation Type
          </label>
          <select
            value={editedField.type}
            onChange={(e) => handleFieldChange({ type: e.target.value as any })}
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
              checked={editedField.required}
              onChange={(e) => handleFieldChange({ required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Required Field</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Value
          </label>
          <input
            type="text"
            value={editedField.defaultValue || ''}
            onChange={(e) => handleFieldChange({ defaultValue: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={editedField.skipMapping}
              onChange={(e) => handleFieldChange({ skipMapping: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Skip Mapping</span>
          </label>
          {editedField.skipMapping && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={editedField.skipBehavior === 'exclude'}
                  onChange={() => handleFieldChange({ skipBehavior: 'exclude' })}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Exclude from transformation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={editedField.skipBehavior === 'use_default'}
                  onChange={() => handleFieldChange({ skipBehavior: 'use_default' })}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Use default value</span>
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sample Input
            </label>
            <input
              type="text"
              value={editedField.sampleInput}
              onChange={(e) => handleFieldChange({ sampleInput: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sample Output
            </label>
            <input
              type="text"
              value={editedField.sampleOutput}
              onChange={(e) => handleFieldChange({ sampleOutput: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={editedField.description}
            onChange={(e) => handleFieldChange({ description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Describe this field mapping..."
          />
        </div>

        {editedField.type === 'expression' && (
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

        {editedField.type === 'lookup' && (
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

        <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
