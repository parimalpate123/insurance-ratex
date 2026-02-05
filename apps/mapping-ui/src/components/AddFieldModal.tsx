import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, BookOpen } from 'lucide-react';
import { getDataTypes } from '@/api/data-types';
import { FieldCatalogEntry } from '@/api/field-catalog';
import FieldCatalogBrowser from './FieldCatalogBrowser';

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fieldData: any) => void;
  isLoading?: boolean;
}

export default function AddFieldModal({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}: AddFieldModalProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [formData, setFormData] = useState({
    sourcePath: '',
    targetPath: '',
    transformationType: 'direct',
    isRequired: false,
    description: '',
    defaultValue: '',
    dataType: 'string',
    fieldDirection: 'both' as 'input' | 'output' | 'both',
    fieldIdentifier: '',
    skipMapping: false,
    skipBehavior: 'exclude' as 'exclude' | 'use_default',
    catalogFieldId: '',
    sampleInput: '',
    sampleOutput: '',
  });

  const [errors, setErrors] = useState<{
    sourcePath?: string;
    targetPath?: string;
  }>({});

  const { data: dataTypes } = useQuery({
    queryKey: ['data-types'],
    queryFn: getDataTypes,
  });

  const handleCatalogSelect = (field: FieldCatalogEntry) => {
    setFormData({
      ...formData,
      targetPath: field.fieldName,
      dataType: field.dataType,
      fieldIdentifier: field.fieldName,
      description: field.description || '',
      isRequired: field.isRequired,
      sampleOutput: field.sampleValue || '',
      catalogFieldId: field.id,
    });
    setShowCatalog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: typeof errors = {};
    if (!formData.sourcePath.trim()) {
      newErrors.sourcePath = 'Source path is required';
    }
    if (!formData.targetPath.trim()) {
      newErrors.targetPath = 'Target path is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd(formData);
  };

  const handleClose = () => {
    setFormData({
      sourcePath: '',
      targetPath: '',
      transformationType: 'direct',
      isRequired: false,
      description: '',
      defaultValue: '',
      dataType: 'string',
      fieldDirection: 'both',
      fieldIdentifier: '',
      skipMapping: false,
      skipBehavior: 'exclude',
      catalogFieldId: '',
      sampleInput: '',
      sampleOutput: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Add Field Mapping</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Browse Catalog Button */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setShowCatalog(true)}
                className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Field Catalog
              </button>
              <p className="text-xs text-blue-600 mt-1">
                Select from pre-defined insurance fields to auto-fill metadata
              </p>
            </div>

            {/* Source Path */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source Path (JSONPath) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sourcePath}
                onChange={(e) => {
                  setFormData({ ...formData, sourcePath: e.target.value });
                  setErrors({ ...errors, sourcePath: undefined });
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm font-mono ${
                  errors.sourcePath
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="$.Quote.QuoteNumber"
              />
              {errors.sourcePath && (
                <p className="mt-1 text-xs text-red-600">{errors.sourcePath}</p>
              )}
            </div>

            {/* Target Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Field <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.targetPath}
                onChange={(e) => {
                  setFormData({ ...formData, targetPath: e.target.value });
                  setErrors({ ...errors, targetPath: undefined });
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                  errors.targetPath
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="policyId"
              />
              {errors.targetPath && (
                <p className="mt-1 text-xs text-red-600">{errors.targetPath}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Data Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Type
                </label>
                <select
                  value={formData.dataType}
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {dataTypes?.map((type) => (
                    <option key={type.id} value={type.typeName}>
                      {type.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Field Direction
                </label>
                <select
                  value={formData.fieldDirection}
                  onChange={(e) =>
                    setFormData({ ...formData, fieldDirection: e.target.value as any })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="both">Both (Bidirectional)</option>
                  <option value="input">Input Only</option>
                  <option value="output">Output Only</option>
                </select>
              </div>
            </div>

            {/* Field Identifier */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Field Identifier
              </label>
              <input
                type="text"
                value={formData.fieldIdentifier}
                onChange={(e) =>
                  setFormData({ ...formData, fieldIdentifier: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="policy.number"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for easy referencing
              </p>
            </div>

            {/* Transformation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transformation Type
              </label>
              <select
                value={formData.transformationType}
                onChange={(e) =>
                  setFormData({ ...formData, transformationType: e.target.value })
                }
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

            {/* Required Field */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, isRequired: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required Field</span>
              </label>
            </div>

            {/* Default Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Value
              </label>
              <input
                type="text"
                value={formData.defaultValue}
                onChange={(e) =>
                  setFormData({ ...formData, defaultValue: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Value when source field is missing"
              />
            </div>

            {/* Skip Mapping */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.skipMapping}
                  onChange={(e) =>
                    setFormData({ ...formData, skipMapping: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Skip Mapping</span>
              </label>
              {formData.skipMapping && (
                <div className="ml-6 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.skipBehavior === 'exclude'}
                      onChange={() => setFormData({ ...formData, skipBehavior: 'exclude' })}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exclude from transformation</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.skipBehavior === 'use_default'}
                      onChange={() => setFormData({ ...formData, skipBehavior: 'use_default' })}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Use default value</span>
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Sample Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sample Input
                </label>
                <input
                  type="text"
                  value={formData.sampleInput}
                  onChange={(e) =>
                    setFormData({ ...formData, sampleInput: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Example source value"
                />
              </div>

              {/* Sample Output */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sample Output
                </label>
                <input
                  type="text"
                  value={formData.sampleOutput}
                  onChange={(e) =>
                    setFormData({ ...formData, sampleOutput: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Expected target value"
                />
              </div>
            </div>

            {/* Description */}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Describe this field mapping..."
              />
            </div>
          </form>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Adding...' : 'Add Field'}
            </button>
          </div>
        </div>
      </div>

      <FieldCatalogBrowser
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelect={handleCatalogSelect}
      />
    </>
  );
}
