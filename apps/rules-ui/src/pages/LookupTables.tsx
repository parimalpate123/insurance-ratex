import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { getRules } from '@/api/rules';

export default function LookupTables() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules', 'lookup'],
    queryFn: () => getRules('lookup'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lookup Tables</h2>
          <p className="text-gray-600 mt-1">
            Key-value mappings for simple transformations
          </p>
        </div>
        <Link
          to="/lookup-tables/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lookup Table
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {rules?.map((rule) => (
            <li key={rule.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-sky-600 truncate">
                        {rule.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rule.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="truncate">{rule.description}</span>
                      <span className="mx-2">•</span>
                      <span className="truncate">{rule.productLine}</span>
                      <span className="mx-2">•</span>
                      <span className="truncate">
                        {rule.data?.entries?.length || 0} entries
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <Link
                      to={`/lookup-tables/${rule.id}`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!rules || rules.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No lookup tables
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new lookup table.
          </p>
          <div className="mt-6">
            <Link
              to="/lookup-tables/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lookup Table
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
