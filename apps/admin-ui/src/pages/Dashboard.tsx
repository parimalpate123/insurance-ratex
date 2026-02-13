import { useProductLine } from '@/contexts/ProductLineContext';
import { useQuery } from '@tanstack/react-query';
import { productLinesApi } from '@/api/product-lines';
import { Activity, Clock, Zap, Package, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEP_ROUTES: Record<string, string> = {
  validate:  '/product-lines',
  transform: '/mappings',
  rules:     '/rules',
  calculate: '/decision-tables',
  respond:   '/mappings',
};

export default function Dashboard() {
  const { currentProductLine, productLines } = useProductLine();

  const currentPL = productLines.find(pl => pl.code === currentProductLine);

  // Get product line details
  const { data: plDetails } = useQuery({
    queryKey: ['product-line', currentProductLine],
    queryFn: () => productLinesApi.getByCode(currentProductLine!),
    enabled: !!currentProductLine,
  });

  if (!currentProductLine) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No product line selected</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new product line.</p>
        <div className="mt-6">
          <Link to="/onboarding" className="btn btn-primary">
            Create Product Line
          </Link>
        </div>
      </div>
    );
  }

  const workflowSteps = plDetails?.config?.workflow?.steps || [];
  const enabledSteps = workflowSteps.filter((s: any) => s.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{currentPL?.name}</h1>
        <p className="mt-2 text-gray-600">{currentPL?.description || 'No description'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Status"
          value={currentPL?.status || 'N/A'}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Version"
          value={currentPL?.version || '1.0.0'}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Workflow Steps"
          value={`${enabledSteps.length}/${workflowSteps.length}`}
          icon={Zap}
          color="green"
        />
        <StatCard
          title="Last Updated"
          value={currentPL ? new Date(currentPL.updatedAt).toLocaleDateString() : 'N/A'}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Test Rating"
            description="Execute rating workflow with sample data"
            to="/test-rating"
            icon={Zap}
          />
          <QuickActionCard
            title="View Configuration"
            description="View and edit product line configuration"
            to={`/product-lines/${currentProductLine}`}
            icon={Package}
          />
          <QuickActionCard
            title="Create New"
            description="Onboard a new product line"
            to="/onboarding"
            icon={Activity}
          />
        </div>
      </div>

      {/* Workflow Configuration */}
      {plDetails && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Configuration</h2>
          <div className="space-y-3">
            {workflowSteps.map((step: any, index: number) => {
              const route = STEP_ROUTES[step.id] ?? STEP_ROUTES[step.type];
              const inner = (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-medium text-gray-700 border border-gray-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-sm font-medium text-gray-900">{step.name}</h3>
                        {route && <ExternalLink className="h-3 w-3 text-gray-400" />}
                      </div>
                      <p className="text-xs text-gray-500">{step.type} • {step.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${step.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {step.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </>
              );

              const cls = `flex items-center justify-between p-4 rounded-lg border transition-all ${
                step.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              } ${route ? 'hover:shadow-sm hover:border-primary-300 cursor-pointer' : ''}`;

              return route ? (
                <Link key={step.id} to={route} className={cls}>{inner}</Link>
              ) : (
                <div key={step.id} className={cls}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* Integration Details */}
      {plDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source System</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {plDetails.config.integrations.sourceSystem.type}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {plDetails.config.integrations.sourceSystem.version || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Authentication</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {plDetails.config.integrations.sourceSystem.authentication}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Systems</h2>
            <div className="space-y-3">
              {plDetails.config.integrations.targetSystems.map((target: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900">{target.type}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {target.version || 'Latest'} • {target.authentication}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  }[color];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  to,
  icon: Icon,
}: {
  title: string;
  description: string;
  to: string;
  icon: any;
}) {
  return (
    <Link
      to={to}
      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <Icon className="h-6 w-6 text-primary-600" />
        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </Link>
  );
}
