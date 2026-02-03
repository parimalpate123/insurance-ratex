import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Table, GitBranch, Code, TrendingUp } from 'lucide-react';
import { getRules, getStats } from '@/api/rules';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: recentRules } = useQuery({
    queryKey: ['rules'],
    queryFn: () => getRules(),
  });

  const ruleTypes = [
    {
      name: 'Lookup Tables',
      description: 'Key-value mappings for simple transformations',
      icon: Table,
      count: stats?.lookupTables || 0,
      path: '/lookup-tables',
      color: 'blue',
    },
    {
      name: 'Decision Tables',
      description: 'Multi-condition decision logic',
      icon: GitBranch,
      count: stats?.decisionTables || 0,
      path: '/decision-tables',
      color: 'green',
    },
    {
      name: 'Conditional Rules',
      description: 'If-then-else business logic',
      icon: Code,
      count: stats?.conditionalRules || 0,
      path: '/conditional-rules',
      color: 'purple',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Rules Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Manage business rules without code
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-sky-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Rules
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.totalRules || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Table className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Lookup Tables
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.lookupTables || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Decision Tables
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.decisionTables || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Conditional Rules
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.conditionalRules || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Types */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        {ruleTypes.map((ruleType) => {
          const Icon = ruleType.icon;
          return (
            <div
              key={ruleType.path}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <Icon className={`h-8 w-8 text-${ruleType.color}-600`} />
                  <h3 className="ml-3 text-lg font-medium text-gray-900">
                    {ruleType.name}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {ruleType.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {ruleType.count}
                  </span>
                  <Link
                    to={ruleType.path}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Rules */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Rules
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentRules?.slice(0, 5).map((rule) => (
            <li key={rule.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-sky-600 truncate">
                      {rule.name}
                    </span>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rule.type === 'lookup'
                          ? 'bg-green-100 text-green-800'
                          : rule.type === 'decision'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {rule.type}
                    </span>
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
                  <p className="mt-1 text-sm text-gray-500">
                    {rule.description}
                  </p>
                </div>
                <Link
                  to={`/${rule.type}-tables/${rule.id}`}
                  className="ml-4 flex-shrink-0 text-sm text-sky-600 hover:text-sky-900"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
