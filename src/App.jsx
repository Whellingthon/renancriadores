import { BrowserRouter, Routes, Route } from 'react-router-dom';
// IMPORTANTE: Certifique-se de que os caminhos abaixo coincidem com suas pastas
import Vitrine from './pages/Vitrine'; 
import Admin from './pages/Admin';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardVendas';
import RotaProtegida from './components/RotaProtegida';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="/alimentacao" element={<Vitrine />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin" 
          element={
            <RotaProtegida>
              <Admin />
            </RotaProtegida>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <RotaProtegida>
              <DashboardPage />
            </RotaProtegida>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;