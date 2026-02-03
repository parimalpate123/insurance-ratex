import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, MapPin } from 'lucide-react';
import { getMappings } from '@/api/mappings';

export default function MappingsList() {
  const { data: mappings, isLoading } = useQuery({
    queryKey: ['mappings'],
    queryFn: getMappings,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Mappings</h2>
          <p className="text-gray-600 mt-1">
            Manage data transformations between systems
          </p>
        </div>
        <Link
          to="/mappings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Mapping
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Mappings
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mappings?.length || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Mappings
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mappings?.filter((m: any) => m.status === 'active').length || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Product Lines
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {new Set(mappings?.map((m: any) => m.productLine)).size || 0}
            </dd>
          </div>
        </div>
      </div>

      {/* Mappings List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {mappings?.map((mapping: any) => (
            <li key={mapping.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {mapping.name || mapping.id}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            mapping.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {mapping.status || 'draft'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="truncate">
                        {mapping.sourceSystem} → {mapping.targetSystem}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="truncate">{mapping.productLine}</span>
                      <span className="mx-2">•</span>
                      <span className="truncate">
                        {mapping.fieldCount || 0} fields
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <Link
                      to={`/mappings/${mapping.id}`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!mappings || mappings.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No mappings
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new mapping configuration.
          </p>
          <div className="mt-6">
            <Link
              to="/mappings/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Mapping
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
