import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MappingsList from './pages/MappingsList';
import MappingEditor from './pages/MappingEditor';
import NewMapping from './pages/NewMapping';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/mappings" replace />} />
          <Route path="mappings" element={<MappingsList />} />
          <Route path="mappings/new" element={<NewMapping />} />
          <Route path="mappings/:mappingId" element={<MappingEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
