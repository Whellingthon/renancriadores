import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import logo from '../pages/img/logotipo.png'; 

const BASE_URL = "http://187.127.28.171/api";

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const navigate = useNavigate();

  // Envia Usuário e Senha para a API e libera o acesso direto
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resposta = await fetch(`${BASE_URL}/api_login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });
      
      const dados = await resposta.json();
      console.log("Resposta do servidor:", dados);

      if (resposta.ok && dados.sucesso) {
        // Salva a permissão no navegador e redireciona
        localStorage.setItem('logado', 'true');
        // Se o seu painel precisar do ID do usuário depois:
        // localStorage.setItem('usuario_id', dados.usuario_id);
        navigate('/admin'); 
      } else {
        setErro(dados.mensagem || 'Usuário ou senha incorretos.');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Cabeçalho Visual */}
        <div className="bg-green-600 p-8 text-center flex flex-col items-center">
          <div className="h-20 w-20 flex items-center justify-center overflow-hidden">
            <img 
              src={logo} 
              alt="Logo" 
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              className="max-h-full max-w-full object-contain brightness-0 invert" 
            />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">Acesso Restrito</h2>
          <p className="text-green-100 text-sm mt-2 font-medium">SISTEMA SID-MAYA</p>
        </div>
        
        <div className="p-8">
          
          {/* Alertas de Erro */}
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center border border-red-100 mb-6">
              {erro}
            </div>
          )}

          {/* Formulário Único de Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={carregando}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition-colors shadow-lg shadow-green-600/30 flex items-center justify-center gap-2"
            >
              {carregando ? 'VERIFICANDO...' : 'ENTRAR NO PAINEL'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}