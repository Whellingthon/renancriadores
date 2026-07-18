import { Navigate } from 'react-router-dom';

export default function RotaProtegida({ children }) {
  // Pega o valor exato salvo no Login
  const statusLogin = localStorage.getItem('logado');
  console.log("Validando acesso na RotaProtegida. Valor do crachá:", statusLogin);
  
  // Se for exatamente a string 'true', libera a passagem
  if (statusLogin === 'true') {
    return children;
  }
  
  // Se não for, barra e manda pro login
  return <Navigate to="/login" replace />;
}