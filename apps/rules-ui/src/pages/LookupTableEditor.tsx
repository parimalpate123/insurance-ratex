import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Play } from 'lucide-react';
import { getRule } from '@/api/rules';

interface Entry {
  key: string;
  value: any;
  description?: string;
}

export default function LookupTableEditor() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const isNew = ruleId === 'new';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productLine: 'general-liability',
  });

  const [entries, setEntries] = useState<Entry[]>([
    { key: '', value: '', description: '' },
  ]);

  const { isLoading } = useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => getRule(ruleId!),
    enabled: !isNew && !!ruleId,
  });

  const addEntry = () => {
    setEntries([...entries, { key: '', value: '', description: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof Entry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleSave = () => {
    console.log('Saving lookup table:', { formData, entries });
    navigate('/lookup-tables');
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
        onClick={() => navigate('/lookup-tables')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Lookup Tables
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Create Lookup Table' : 'Edit Lookup Table'}
          </h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                placeholder="e.g., State Territorial Surcharges"
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
                placeholder="Describe what this lookup table is used for..."
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

          {/* Entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Entries</h3>
              <button
                onClick={addEntry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-sky-700 bg-sky-100 hover:bg-sky-200"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Entry
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={entry.key}
                          onChange={(e) =>
                            updateEntry(index, 'key', e.target.value)
                          }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          placeholder="CA"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={entry.value}
                          onChange={(e) =>
                            updateEntry(index, 'value', e.target.value)
                          }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          placeholder="5.0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entry.description || ''}
                          onChange={(e) =>
                            updateEntry(index, 'description', e.target.value)
                          }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          placeholder="California surcharge"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => removeEntry(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => navigate('/lookup-tables')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
