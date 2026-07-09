import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // <-- Navigate adicionado aqui
import Vitrine from './pages/Vitrine';
import Admin from './pages/Admin';
import Login from './pages/Login';

// 1. Criamos a função que atua como "Segurança da Porta"
const RotaProtegida = ({ children }) => {
  // Verificamos no navegador se o usuário tem a "chave" de logado.
  // IMPORTANTE: Ajuste 'admin_logado' para o nome exato que o seu Login.jsx salva quando dá certo!
  const estaLogado = localStorage.getItem('sidmaya_auth'); // Mudamos para a chave que o Login usa
  
  if (!estaLogado) {
    // Se não estiver logado, redireciona para a tela de Login
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver logado, permite que o conteúdo (o painel Admin) seja exibido
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sua rota principal */}
        <Route path="/" element={<Vitrine />} />
        
        {/* A rota de alimentação */}
        <Route path="/alimentacao" element={<Vitrine />} />
        
        {/* Rota do painel AGORA PROTEGIDA */}
        <Route 
          path="/admin" 
          element={
            <RotaProtegida>
              <Admin />
            </RotaProtegida>
          } 
        />

        {/* Rota de Login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;