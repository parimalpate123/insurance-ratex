import { Link } from 'react-router-dom';
import { Database, Type, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const settingsOptions = [
    {
      name: 'Master Field Catalog',
      description: 'Manage reusable field definitions for insurance mappings. Add, edit, or delete custom fields.',
      icon: Database,
      path: '/settings/field-catalog',
      color: 'blue',
      badge: 'Recommended',
    },
    {
      name: 'Data Types',
      description: 'Manage insurance-specific data types (coming soon)',
      icon: Type,
      path: '/settings/data-types',
      color: 'purple',
      disabled: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage system configuration and master data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingsOptions.map((option) => {
          const Icon = option.icon;
          const isDisabled = option.disabled;

          return (
            <Link
              key={option.path}
              to={isDisabled ? '#' : option.path}
              className={`block ${
                isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg transition-shadow'
              }`}
              onClick={(e) => isDisabled && e.preventDefault()}
            >
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent hover:border-blue-500">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-lg ${
                      option.color === 'blue'
                        ? 'bg-blue-100'
                        : option.color === 'purple'
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        option.color === 'blue'
                          ? 'text-blue-600'
                          : option.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {option.name}
                      </h3>
                      {option.badge && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {option.badge}
                        </span>
                      )}
                      {isDisabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Master Field Catalog
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The Master Field Catalog contains reusable field definitions for insurance
                mappings. When you add a field here, it becomes available in the "Browse
                Field Catalog" feature when creating field mappings.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>40+ pre-defined insurance fields included</li>
                <li>Add unlimited custom fields</li>
                <li>System fields are protected from deletion</li>
                <li>Changes reflect immediately in mapping creation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
