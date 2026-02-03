import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Table, GitBranch, Code, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lookup Tables', path: '/lookup-tables', icon: Table },
    { name: 'Decision Tables', path: '/decision-tables', icon: GitBranch },
    { name: 'Conditional Rules', path: '/conditional-rules', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-8 w-8 text-sky-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">InsurRateX</h1>
                <p className="text-xs text-gray-500">Rules Management</p>
              </div>
            </div>

            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
