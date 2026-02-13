import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, Settings, PlayCircle, Plus, GitBranch, Table, BookOpen, List, ArrowLeftRight, SlidersHorizontal, ChevronDown, Bot, Server, Workflow } from 'lucide-react';
import ProductLineSelector from './ProductLineSelector';

const CONFIG_PATHS = ['/decision-tables', '/lookup-tables', '/knowledge-base', '/ai-prompts', '/systems'];

export default function Layout() {
  const location = useLocation();
  const [configOpen, setConfigOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isConfigActive = CONFIG_PATHS.some((p) => isActive(p));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown when navigating
  useEffect(() => { setConfigOpen(false); }, [location.pathname]);

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
          <div className="flex space-x-1 py-3 flex-wrap">
            <Link to="/" className={navLinkClass('/')}>
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/product-lines" className={navLinkClass('/product-lines')}>
              <Package className="h-4 w-4" />
              <span>Product Lines</span>
            </Link>
            <Link to="/mappings" className={navLinkClass('/mappings')}>
              <ArrowLeftRight className="h-4 w-4" />
              <span>Mappings</span>
            </Link>
            <Link to="/rules" className={navLinkClass('/rules')}>
              <GitBranch className="h-4 w-4" />
              <span>Rules</span>
            </Link>
            <Link to="/pipelines" className={navLinkClass('/pipelines')}>
              <Workflow className="h-4 w-4" />
              <span>Pipelines</span>
            </Link>
            {/* Config dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setConfigOpen((o) => !o)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isConfigActive
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Config</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
              </button>

              {configOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link to="/decision-tables"
                    className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${isActive('/decision-tables') ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                    <Table className="h-4 w-4" />
                    <span>Decision Tables</span>
                  </Link>
                  <Link to="/lookup-tables"
                    className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${isActive('/lookup-tables') ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                    <List className="h-4 w-4" />
                    <span>Lookup Tables</span>
                  </Link>
                  <Link to="/knowledge-base"
                    className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${isActive('/knowledge-base') ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                    <BookOpen className="h-4 w-4" />
                    <span>Knowledge Base</span>
                  </Link>
                  <Link to="/ai-prompts"
                    className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${isActive('/ai-prompts') ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                    <Bot className="h-4 w-4" />
                    <span>AI Prompts</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link to="/systems"
                    className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${isActive('/systems') ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                    <Server className="h-4 w-4" />
                    <span>System Catalog</span>
                  </Link>
                </div>
              )}
            </div>
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
