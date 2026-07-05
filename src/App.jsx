import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Vitrine from './pages/Vitrine';
import Admin from './pages/Admin';
import Login from './pages/Login'; // <-- IMPORTAÇÃO ADICIONADA AQUI

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

        {/* Rota de Login (Agora devidamente DENTRO de <Routes>) */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;