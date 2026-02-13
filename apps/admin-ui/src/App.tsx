import { Routes, Route } from 'react-router-dom';
import { ProductLineProvider } from '@/contexts/ProductLineContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ProductLines from '@/pages/ProductLines';
import ProductLineDetail from '@/pages/ProductLineDetail';
import OnboardingWizard from '@/pages/OnboardingWizard';
import TestRating from '@/pages/TestRating';
import Settings from '@/pages/Settings';
import Mappings from '@/pages/Mappings';
import MappingEditor from '@/pages/MappingEditor';
import MappingCreate from '@/pages/MappingCreate';
import Rules from '@/pages/Rules';
import RuleEditor from '@/pages/RuleEditor';
import DecisionTables from '@/pages/DecisionTables';
import LookupTables from '@/pages/LookupTables';
import KnowledgeBase from '@/pages/KnowledgeBase';
import AiPrompts from '@/pages/AiPrompts';
import Systems from '@/pages/Systems';
import Pipelines from '@/pages/Pipelines';

function App() {
  return (
    <ProductLineProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="product-lines" element={<ProductLines />} />
          <Route path="product-lines/:code" element={<ProductLineDetail />} />
          <Route path="onboarding" element={<OnboardingWizard />} />
          <Route path="mappings" element={<Mappings />} />
          <Route path="mappings/new" element={<MappingCreate />} />
          <Route path="mappings/:id" element={<MappingEditor />} />
          <Route path="rules" element={<Rules />} />
          <Route path="rules/new" element={<RuleEditor />} />
          <Route path="rules/:id" element={<RuleEditor />} />
          <Route path="decision-tables" element={<DecisionTables />} />
          <Route path="lookup-tables" element={<LookupTables />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="ai-prompts" element={<AiPrompts />} />
          <Route path="systems" element={<Systems />} />
          <Route path="pipelines" element={<Pipelines />} />
          <Route path="test-rating" element={<TestRating />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ProductLineProvider>
  );
}

export default App;
