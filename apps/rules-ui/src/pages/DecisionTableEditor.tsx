import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Play } from 'lucide-react';
import { getRule } from '@/api/rules';

interface DecisionRow {
  id: string;
  conditions: any[];
  actions: any[];
}

export default function DecisionTableEditor() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const isNew = ruleId === 'new';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productLine: 'general-liability',
  });

  const [conditions, setConditions] = useState<string[]>(['condition1']);
  const [actions, setActions] = useState<string[]>(['action1']);
  const [rows, setRows] = useState<DecisionRow[]>([
    { id: '1', conditions: [''], actions: [''] },
  ]);

  const { isLoading } = useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => getRule(ruleId!),
    enabled: !isNew && !!ruleId,
  });

  const addCondition = () => {
    const newCondition = `condition${conditions.length + 1}`;
    setConditions([...conditions, newCondition]);
    setRows(rows.map(row => ({ ...row, conditions: [...row.conditions, ''] })));
  };

  const addAction = () => {
    const newAction = `action${actions.length + 1}`;
    setActions([...actions, newAction]);
    setRows(rows.map(row => ({ ...row, actions: [...row.actions, ''] })));
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: String(rows.length + 1),
        conditions: Array(conditions.length).fill(''),
        actions: Array(actions.length).fill(''),
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setRows(rows.filter(row => row.id !== rowId));
  };

  const updateCell = (
    rowId: string,
    type: 'conditions' | 'actions',
    index: number,
    value: string
  ) => {
    setRows(
      rows.map(row => {
        if (row.id === rowId) {
          const updated = [...row[type]];
          updated[index] = value;
          return { ...row, [type]: updated };
        }
        return row;
      })
    );
  };

  const handleSave = () => {
    console.log('Saving decision table:', { formData, conditions, actions, rows });
    navigate('/decision-tables');
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
        onClick={() => navigate('/decision-tables')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Decision Tables
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Create Decision Table' : 'Edit Decision Table'}
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
                placeholder="e.g., Experience Modifier"
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
                placeholder="Describe what this decision table evaluates..."
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
              </select>
            </div>
          </div>

          {/* Decision Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Decision Logic</h3>
              <div className="flex space-x-2">
                <button
                  onClick={addCondition}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Condition
                </button>
                <button
                  onClick={addAction}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Action
                </button>
                <button
                  onClick={addRow}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-sky-700 bg-sky-100 hover:bg-sky-200"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Row
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    {conditions.map((condition, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50"
                      >
                        <input
                          type="text"
                          value={condition}
                          onChange={(e) => {
                            const updated = [...conditions];
                            updated[index] = e.target.value;
                            setConditions(updated);
                          }}
                          className="block w-full border-none bg-transparent focus:ring-0 text-xs font-medium"
                          placeholder="Condition"
                        />
                      </th>
                    ))}
                    {actions.map((action, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider bg-green-50"
                      >
                        <input
                          type="text"
                          value={action}
                          onChange={(e) => {
                            const updated = [...actions];
                            updated[index] = e.target.value;
                            setActions(updated);
                          }}
                          className="block w-full border-none bg-transparent focus:ring-0 text-xs font-medium"
                          placeholder="Action"
                        />
                      </th>
                    ))}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {row.id}
                      </td>
                      {row.conditions.map((condition, index) => (
                        <td key={`cond-${index}`} className="px-4 py-3">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) =>
                              updateCell(row.id, 'conditions', index, e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                            placeholder="value"
                          />
                        </td>
                      ))}
                      {row.actions.map((action, index) => (
                        <td key={`act-${index}`} className="px-4 py-3">
                          <input
                            type="text"
                            value={action}
                            onChange={(e) =>
                              updateCell(row.id, 'actions', index, e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                            placeholder="result"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => removeRow(row.id)}
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
              onClick={() => navigate('/decision-tables')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
