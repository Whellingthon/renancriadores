import { Navigate } from 'react-router-dom';

export default function RotaProtegida({ children }) {
  // Verifica se existe um usuário logado (geralmente salvamos no localStorage)
  const estaLogado = localStorage.getItem('logado') === 'true';

  return estaLogado ? children : <Navigate to="/login" />;
}