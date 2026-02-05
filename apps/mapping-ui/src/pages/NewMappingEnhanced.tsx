import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, FileText, Sparkles, Link } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import MappingPreviewModal from '../components/MappingPreviewModal';
import { parseExcelFile, generateAISuggestions, parseTextRequirements } from '../api/ai-mappings';
import { listSchemas } from '../api/schemas';
import { createMappingWithFields } from '../api/mappings';
import { getSessionId } from '../utils/session';

type CreationMethod = 'manual' | 'excel' | 'ai' | 'text' | 'jira';

interface FormData {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  version: string;
  creationMethod: CreationMethod;
}

export default function NewMappingEnhanced() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sourceSystem: '',
    targetSystem: '',
    productLine: '',
    version: '1.0.0',
    creationMethod: 'manual',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textRequirements, setTextRequirements] = useState<string>('');
  const [schemas, setSchemas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Load schemas on mount
  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    try {
      const data = await listSchemas();
      setSchemas(data);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleGenerateSuggestions = async () => {
    // Validate required fields for all methods
    if (!formData.name) {
      alert('Please enter a Mapping Name');
      return;
    }

    if (!formData.sourceSystem) {
      alert('Please select a Source System');
      return;
    }

    if (!formData.targetSystem) {
      alert('Please select a Target System');
      return;
    }

    if (!formData.productLine) {
      alert('Please enter a Product Line');
      return;
    }

    // Method-specific validations
    if (formData.creationMethod === 'excel' && !uploadedFile) {
      alert('Please upload an Excel/CSV file');
      return;
    }

    if (formData.creationMethod === 'text' && !textRequirements.trim()) {
      alert('Please enter mapping requirements');
      return;
    }

    if (formData.creationMethod === 'ai' && (!formData.sourceSystem || !formData.targetSystem)) {
      alert('Please select source and target systems');
      return;
    }

    setIsLoading(true);

    try {
      let suggestionData;

      if (formData.creationMethod === 'excel') {
        // Parse Excel file
        suggestionData = await parseExcelFile(uploadedFile!);
      } else if (formData.creationMethod === 'text') {
        // Parse text requirements
        suggestionData = await parseTextRequirements(textRequirements, {
          sourceSystem: formData.sourceSystem,
          targetSystem: formData.targetSystem,
          productLine: formData.productLine,
        });
      } else if (formData.creationMethod === 'ai') {
        // Generate AI suggestions from schemas
        const sourceSchema = schemas.find(
          (s) => s.systemName === formData.sourceSystem
        );
        const targetSchema = schemas.find(
          (s) => s.systemName === formData.targetSystem
        );

        if (!sourceSchema || !targetSchema) {
          throw new Error(`Schema not found. Available schemas: ${schemas.map(s => s.systemName).join(', ')}`);
        }

        suggestionData = await generateAISuggestions({
          sourceSchemaId: sourceSchema.id,
          targetSchemaId: targetSchema.id,
          productLine: formData.productLine,
        });
      }

      if (suggestionData) {
        setSuggestions(suggestionData.suggestions || []);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestions = async (acceptedSuggestions: any[]) => {
    // Validate required fields
    if (!formData.name || !formData.sourceSystem || !formData.targetSystem || !formData.productLine) {
      alert('Please fill in all required fields (Name, Source System, Target System, Product Line)');
      return;
    }

    setIsLoading(true);

    try {
      // Transform accepted suggestions to field mappings
      const fieldMappings = acceptedSuggestions.map((suggestion) => ({
        sourcePath: suggestion.sourcePath,
        targetPath: suggestion.targetPath,
        transformationType: suggestion.transformationType || 'direct',
        transformationConfig: suggestion.transformationConfig,
        description: suggestion.reasoning,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
      }));

      // Prepare source content based on creation method
      let sourceContent = '';
      let sourceReference = '';

      if (formData.creationMethod === 'text') {
        sourceContent = textRequirements;
        sourceReference = 'Text Requirements';
      } else if (formData.creationMethod === 'excel' && uploadedFile) {
        sourceReference = uploadedFile.name;
        sourceContent = `Excel file: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(2)} KB)`;
      } else if (formData.creationMethod === 'ai') {
        sourceReference = 'AI-Generated from Schemas';
        sourceContent = `Source: ${formData.sourceSystem}, Target: ${formData.targetSystem}`;
      }

      // Create mapping in database
      const response = await createMappingWithFields({
        name: formData.name,
        sourceSystem: formData.sourceSystem,
        targetSystem: formData.targetSystem,
        productLine: formData.productLine,
        version: formData.version,
        creationMethod: formData.creationMethod,
        sourceReference,
        sourceContent,
        sessionId: getSessionId(),
        fieldMappings,
      });

      console.log('Mapping created:', response.data);

      // Navigate to the mapping editor with the actual saved mapping ID
      navigate(`/mappings/${response.data.id}`, {
        state: {
          mappingCreated: true,
        },
      });
    } catch (error) {
      console.error('Failed to create mapping:', error);
      alert('Failed to create mapping. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCreate = async () => {
    // Validate required fields
    if (!formData.name || !formData.sourceSystem || !formData.targetSystem || !formData.productLine) {
      alert('Please fill in all required fields (Name, Source System, Target System, Product Line)');
      return;
    }

    setIsLoading(true);

    try {
      // Create empty mapping in database
      const response = await createMappingWithFields({
        name: formData.name,
        sourceSystem: formData.sourceSystem,
        targetSystem: formData.targetSystem,
        productLine: formData.productLine,
        version: formData.version,
        creationMethod: 'manual',
        sourceReference: 'Manual Creation',
        sourceContent: 'Created manually from scratch',
        sessionId: getSessionId(),
        fieldMappings: [], // No field mappings for manual creation
      });

      console.log('Mapping created:', response.data);

      // Navigate to the mapping editor
      navigate(`/mappings/${response.data.id}`, {
        state: {
          mappingCreated: true,
        },
      });
    } catch (error) {
      console.error('Failed to create mapping:', error);
      alert('Failed to create mapping. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/mappings')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Mappings
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Mapping
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose how you want to create your mapping
          </p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Creation Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Creation Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, creationMethod: 'manual' })
                }
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.creationMethod === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-6 w-6 mb-2 text-gray-700" />
                <div className="font-medium">Manual</div>
                <div className="text-xs text-gray-500 mt-1">
                  Start from scratch and add fields manually
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, creationMethod: 'text' })
                }
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.creationMethod === 'text'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sparkles className="h-6 w-6 mb-2 text-purple-600" />
                <div className="font-medium">AI-Powered</div>
                <div className="text-xs text-gray-500 mt-1">
                  Describe requirements in plain text, AI generates mappings
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, creationMethod: 'excel' })
                }
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.creationMethod === 'excel'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="h-6 w-6 mb-2 text-gray-700" />
                <div className="font-medium">Upload Excel/CSV</div>
                <div className="text-xs text-gray-500 mt-1">
                  Upload mapping requirements from file
                </div>
              </button>

              <button
                type="button"
                disabled
                className="p-4 border-2 rounded-lg text-left transition-all border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed relative"
              >
                <FileText className="h-6 w-6 mb-2 text-gray-400" />
                <div className="font-medium text-gray-600 flex items-center gap-2">
                  AI Schema Mapping
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Auto-match fields from pre-loaded system schemas
                </div>
              </button>

              <button
                type="button"
                disabled
                className="p-4 border-2 rounded-lg text-left transition-all border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed relative"
              >
                <Link className="h-6 w-6 mb-2 text-gray-400" />
                <div className="font-medium text-gray-600 flex items-center gap-2">
                  JIRA Story URL
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Import requirements from JIRA story
                </div>
              </button>
            </div>
          </div>

          {/* Basic Metadata */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Mapping Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Guidewire to CDM (General Liability)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sourceSystem"
                className="block text-sm font-medium text-gray-700"
              >
                Source System
              </label>
              <select
                id="sourceSystem"
                required
                value={formData.sourceSystem}
                onChange={(e) =>
                  setFormData({ ...formData, sourceSystem: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select source...</option>
                <option value="guidewire">Guidewire PolicyCenter</option>
                <option value="duckcreek">Duck Creek</option>
                <option value="salesforce">Salesforce</option>
                <option value="cdm">Canonical Data Model (CDM)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="targetSystem"
                className="block text-sm font-medium text-gray-700"
              >
                Target System
              </label>
              <select
                id="targetSystem"
                required
                value={formData.targetSystem}
                onChange={(e) =>
                  setFormData({ ...formData, targetSystem: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select target...</option>
                <option value="cdm">Canonical Data Model (CDM)</option>
                <option value="earnix">Earnix Rating Engine</option>
                <option value="iso">ISO Rating Engine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="productLine"
                className="block text-sm font-medium text-gray-700"
              >
                Product Line
              </label>
              <select
                id="productLine"
                required
                value={formData.productLine}
                onChange={(e) =>
                  setFormData({ ...formData, productLine: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select product line...</option>
                <option value="general-liability">General Liability</option>
                <option value="property">Property</option>
                <option value="workers-comp">Workers Compensation</option>
                <option value="auto">Auto</option>
                <option value="inland-marine">Inland Marine</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="version"
                className="block text-sm font-medium text-gray-700"
              >
                Version
              </label>
              <input
                type="text"
                id="version"
                required
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="1.0.0"
              />
            </div>
          </div>

          {/* Text Requirements Section */}
          {formData.creationMethod === 'text' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Paste Requirements Text
              </h3>
              <textarea
                value={textRequirements}
                onChange={(e) => setTextRequirements(e.target.value)}
                placeholder="Paste your JIRA user story or mapping requirements here...&#10;&#10;Example:&#10;Map quoteNumber to policy.id&#10;Map insured.name to insured.name&#10;Map insured.state to insured.address.state using state code lookup&#10;Map classification.code to ratingFactors.businessType"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> AI will parse your text and extract
                  field mapping requirements. Be specific about source and target
                  field names. Mention transformations if needed (e.g., "using
                  lookup", "date format", "concatenate").
                </p>
              </div>
            </div>
          )}

          {/* Excel Upload Section */}
          {formData.creationMethod === 'excel' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Upload Requirements File
              </h3>
              <FileUploader onFileSelect={handleFileUpload} />
              {uploadedFile && (
                <div className="mt-2 text-sm text-green-600">
                  Uploaded: {uploadedFile.name}
                </div>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium mb-1">Expected format:</p>
                <p>
                  Columns: Source Field Path, Target Field, Transformation
                  Type, Business Rule, Sample Value
                </p>
              </div>
            </div>
          )}

          {/* AI Detection Info */}
          {formData.creationMethod === 'ai' && (
            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      AI-Powered Schema Analysis
                    </p>
                    <p className="text-blue-700 mt-1">
                      AI will analyze your source and target schemas to
                      automatically suggest field mappings based on semantic
                      similarity and insurance domain knowledge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/mappings')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>

            {formData.creationMethod === 'manual' ? (
              <button
                type="button"
                onClick={handleManualCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Create & Edit Mappings
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateSuggestions}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Suggestions
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <MappingPreviewModal
          suggestions={suggestions}
          onClose={() => setShowPreview(false)}
          onAccept={handleAcceptSuggestions}
        />
      )}
    </div>
  );
}
