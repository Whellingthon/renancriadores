import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Vitrine from './pages/Vitrine';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sua rota principal */}
        <Route path="/" element={<Vitrine />} />
        
        {/* A rota que estava faltando e causou o erro no console */}
        <Route path="/alimentacao" element={<Vitrine />} />
        
        {/* Rota do painel que já configuramos */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;