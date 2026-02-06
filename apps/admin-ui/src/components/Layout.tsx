import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, Settings, PlayCircle, Plus } from 'lucide-react';
import ProductLineSelector from './ProductLineSelector';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) =>
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IR</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">InsurRateX</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>

            {/* Product Line Selector */}
            <ProductLineSelector />

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Link
                to="/onboarding"
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Product Line</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3">
            <Link to="/" className={navLinkClass('/')}>
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/product-lines" className={navLinkClass('/product-lines')}>
              <Package className="h-4 w-4" />
              <span>Product Lines</span>
            </Link>
            <Link to="/test-rating" className={navLinkClass('/test-rating')}>
              <PlayCircle className="h-4 w-4" />
              <span>Test Rating</span>
            </Link>
            <Link to="/settings" className={navLinkClass('/settings')}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            InsurRateX Admin Portal © 2026 - Configuration-Driven Rating Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
