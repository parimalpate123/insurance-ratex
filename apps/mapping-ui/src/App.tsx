import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MappingsList from './pages/MappingsList';
import MappingEditor from './pages/MappingEditor';
import NewMappingEnhanced from './pages/NewMappingEnhanced';
import FieldCatalogManagement from './pages/FieldCatalogManagement';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/mappings" replace />} />
          <Route path="mappings" element={<MappingsList />} />
          <Route path="mappings/new" element={<NewMappingEnhanced />} />
          <Route path="mappings/:mappingId" element={<MappingEditor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/field-catalog" element={<FieldCatalogManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
