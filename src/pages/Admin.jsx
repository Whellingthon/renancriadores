import { useState } from 'react';
import { 
  Sprout, Settings, Package, TrendingUp, RefreshCw, 
  Clock, SlidersHorizontal, Check, CheckCircle, X, 
  RefreshCcw, Play, AlertCircle 
} from 'lucide-react';
import "../App.css";

export default function Admin() {
  // Estados para o Lucro
  const [margin, setMargin] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Estados para o Robô
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ tipo: '', mensagem: '' });

  // 1. Função para Salvar a Margem de Lucro
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resposta = await fetch("http://187.127.28.171/renancriadores/api/api_margem.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ margem: margin })
      });

      const resultado = await resposta.json();

      if (resultado.status === "sucesso") {
        setToast({ message: resultado.mensagem, type: 'success' });
      } else {
        setToast({ message: "Erro: " + resultado.mensagem, type: 'error' });
      }
    } catch (error) {
      setToast({ message: "Não foi possível conectar ao servidor PHP.", type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  // 2. Função para Ativar o Robô (Node.js)
  const handleSyncRobot = async () => {
    setIsSyncing(true);
    setSyncStatus({ tipo: 'info', mensagem: '🤖 Iniciando robô... Aguarde a conclusão.' });

    try {
     const resposta = await fetch("http://187.127.28.171/renancriadores/api/api_run_robot.php", {
  method: 'POST',
  credentials: 'include', // ISSO AQUI envia os cookies do PHP
});

      const dados = await resposta.json();

      if (dados.success) {
        setSyncStatus({ tipo: 'sucesso', mensagem: '✅ Sucesso! Preços e fotos atualizados.' });
      } else {
        setSyncStatus({ tipo: 'erro', mensagem: '❌ Erro: ' + (dados.details || dados.message) });
      }
   } catch (error) {
      console.error("Erro detalhado:", error);
      setSyncStatus({ 
        tipo: 'error', 
        mensagem: '❌ Erro Técnico: ' + error.message 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Sistema de Notificação (Toast) */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
          </div>
          <Settings className="text-gray-400" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <Package className="text-blue-600 mb-2" />
            <p className="text-2xl font-bold">248</p>
            <p className="text-xs text-gray-500">Produtos Ativos</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <TrendingUp className="text-green-600 mb-2" />
            <p className="text-2xl font-bold">{margin}%</p>
            <p className="text-xs text-gray-500">Margem Atual</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <Clock className="text-purple-600 mb-2" />
            <p className="text-2xl font-bold">Sincronizado</p>
            <p className="text-xs text-gray-500">Conectado ao MySQL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LADO ESQUERDO: Ajuste de Lucro */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-green-600 p-6 text-white flex items-center gap-3">
              <SlidersHorizontal />
              <h2 className="text-lg font-bold">Ajustar Lucro</h2>
            </div>
            <div className="p-8 text-center">
              <label className="block text-sm font-bold text-gray-700 mb-4">Margem de Lucro Global (%)</label>
              <input 
                type="number" 
                value={margin} 
                onChange={(e) => setMargin(e.target.value)}
                className="text-4xl font-black text-center w-full mb-4 border-b-4 border-green-200 focus:border-green-500 outline-none p-2"
              />
              <input 
                type="range" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 mb-8"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              />
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                {isSaving ? <RefreshCw className="animate-spin" /> : <Check />}
                {isSaving ? 'Gravando...' : 'Salvar no Banco'}
              </button>
            </div>
          </div>

          {/* LADO DIREITO: Sincronização do Robô */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex items-center gap-3">
              <RefreshCcw className={isSyncing ? "animate-spin" : ""} />
              <h2 className="text-lg font-bold">Sincronização</h2>
            </div>
            <div className="p-8 text-center">
              <div className="mb-6 py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Play className={`mx-auto mb-2 ${isSyncing ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
                <p className="text-xs text-gray-500">Executa o script de captura de preços (robot.js)</p>
              </div>
              
              <button 
                onClick={handleSyncRobot}
                disabled={isSyncing}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                  isSyncing ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
              >
                {isSyncing ? <RefreshCcw className="animate-spin" /> : <RefreshCcw />}
                {isSyncing ? 'Sincronizando...' : 'Atualizar Preços Agora'}
              </button>

              {syncStatus.mensagem && (
                <div className={`mt-4 p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${
                  syncStatus.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 
                  syncStatus.tipo === 'erro' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {syncStatus.tipo === 'sucesso' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {syncStatus.mensagem}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}