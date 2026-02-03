import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewMapping() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sourceSystem: '',
    targetSystem: '',
    productLine: '',
    version: '1.0.0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create mapping and navigate to editor
    const mappingId = `${formData.sourceSystem}-to-${formData.targetSystem}-${formData.productLine}`;
    navigate(`/mappings/${mappingId}`);
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
            Set up a new field mapping configuration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/mappings')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Create & Edit Mappings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
