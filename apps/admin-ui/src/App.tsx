import { Routes, Route } from 'react-router-dom';
import { ProductLineProvider } from '@/contexts/ProductLineContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ProductLines from '@/pages/ProductLines';
import ProductLineDetail from '@/pages/ProductLineDetail';
import OnboardingWizard from '@/pages/OnboardingWizard';
import TestRating from '@/pages/TestRating';
import Settings from '@/pages/Settings';

function App() {
  return (
    <ProductLineProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="product-lines" element={<ProductLines />} />
          <Route path="product-lines/:code" element={<ProductLineDetail />} />
          <Route path="onboarding" element={<OnboardingWizard />} />
          <Route path="test-rating" element={<TestRating />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ProductLineProvider>
  );
}

export default App;
