import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import { getFieldCatalog, getFieldCatalogCategories, createFieldCatalogEntry } from '@/api/field-catalog';
import { getDataTypes } from '@/api/data-types';

export default function FieldCatalogManagement() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['field-catalog-categories'],
    queryFn: getFieldCatalogCategories,
  });

  const { data: fields, isLoading } = useQuery({
    queryKey: ['field-catalog', selectedCategory, searchQuery],
    queryFn: () => getFieldCatalog({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
    }),
  });

  const { data: dataTypes } = useQuery({
    queryKey: ['data-types'],
    queryFn: getDataTypes,
  });

  const createMutation = useMutation({
    mutationFn: createFieldCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['field-catalog-categories'] });
      setShowAddModal(false);
      setNotification({
        type: 'success',
        message: 'Field added to catalog successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to add field to catalog.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const systemFieldsCount = fields?.filter(f => f.isSystem).length || 0;
  const customFieldsCount = fields?.filter(f => !f.isSystem).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Field Catalog</h1>
          <p className="text-gray-600 mt-1">
            Manage reusable field definitions for insurance mappings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field to Catalog
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Fields
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {fields?.length || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              System Fields
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              {systemFieldsCount}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Custom Fields
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {customFieldsCount}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Categories
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {categories?.length || 0}
            </dd>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields by name or description..."
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories?.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sample Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : fields && fields.length > 0 ? (
              fields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {field.displayName}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {field.fieldName}
                      </div>
                      {field.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {field.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {field.dataType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {field.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.isRequired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Optional</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.isSystem ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        System
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {field.sampleValue || 'N/A'}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!field.isSystem && (
                      <div className="flex justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No fields found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Field Modal */}
      {showAddModal && (
        <AddFieldToCatalogModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          dataTypes={dataTypes || []}
          categories={categories || []}
        />
      )}
    </div>
  );
}

interface AddFieldToCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  isLoading: boolean;
  dataTypes: any[];
  categories: string[];
}

function AddFieldToCatalogModal({
  isOpen,
  onClose,
  onAdd,
  isLoading,
  dataTypes,
  categories,
}: AddFieldToCatalogModalProps) {
  const [formData, setFormData] = useState({
    fieldName: '',
    displayName: '',
    dataType: 'string',
    category: '',
    description: '',
    sampleValue: '',
    isRequired: false,
  });

  const [errors, setErrors] = useState<{
    fieldName?: string;
    displayName?: string;
    dataType?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!formData.fieldName.trim()) {
      newErrors.fieldName = 'Field name is required';
    }
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    if (!formData.dataType.trim()) {
      newErrors.dataType = 'Data type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd(formData);
  };

  const handleClose = () => {
    setFormData({
      fieldName: '',
      displayName: '',
      dataType: 'string',
      category: '',
      description: '',
      sampleValue: '',
      isRequired: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Add Field to Catalog</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fieldName}
                onChange={(e) => {
                  setFormData({ ...formData, fieldName: e.target.value });
                  setErrors({ ...errors, fieldName: undefined });
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                  errors.fieldName
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="policyNumber"
              />
              {errors.fieldName && (
                <p className="mt-1 text-xs text-red-600">{errors.fieldName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Camel case, no spaces</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => {
                  setFormData({ ...formData, displayName: e.target.value });
                  setErrors({ ...errors, displayName: undefined });
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                  errors.displayName
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Policy Number"
              />
              {errors.displayName && (
                <p className="mt-1 text-xs text-red-600">{errors.displayName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {dataTypes.map((type) => (
                  <option key={type.id} value={type.typeName}>
                    {type.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
                <option value="custom">Custom (New Category)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe this field..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sample Value
            </label>
            <input
              type="text"
              value={formData.sampleValue}
              onChange={(e) => setFormData({ ...formData, sampleValue: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Example value"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Typically required in insurance contexts
              </span>
            </label>
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
            {isLoading ? 'Adding...' : 'Add to Catalog'}
          </button>
        </div>
      </div>
    </div>
  );
}
