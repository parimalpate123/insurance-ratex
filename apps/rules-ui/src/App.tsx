import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LookupTables from './pages/LookupTables';
import LookupTableEditor from './pages/LookupTableEditor';
import DecisionTables from './pages/DecisionTables';
import DecisionTableEditor from './pages/DecisionTableEditor';
import ConditionalRules from './pages/ConditionalRules';
import ConditionalRuleEditor from './pages/ConditionalRuleEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="lookup-tables" element={<LookupTables />} />
          <Route path="lookup-tables/new" element={<LookupTableEditor />} />
          <Route path="lookup-tables/:ruleId" element={<LookupTableEditor />} />

          <Route path="decision-tables" element={<DecisionTables />} />
          <Route path="decision-tables/new" element={<DecisionTableEditor />} />
          <Route path="decision-tables/:ruleId" element={<DecisionTableEditor />} />

          <Route path="conditional-rules" element={<ConditionalRules />} />
          <Route path="conditional-rules/new" element={<ConditionalRuleEditor />} />
          <Route path="conditional-rules/:ruleId" element={<ConditionalRuleEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
