import { useState } from 'react';
import { 
  Sprout, Settings, Package, TrendingUp, RefreshCw, 
  Clock, SlidersHorizontal, Check, CheckCircle, X, 
  RefreshCcw, Play, AlertCircle 
} from 'lucide-react';
import "../App.css";

// Centralizando a URL com o Proxy para o Admin
const BASE_URL = "https://cors-anywhere.herokuapp.com/http://187.127.28.171/renancriadores/api";

export default function Admin() {
  const [margin, setMargin] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ tipo: '', mensagem: '' });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resposta = await fetch(`${BASE_URL}/api_margem.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ margem: margin })
      });
      const resultado = await resposta.json();
      setToast({ message: resultado.status === "sucesso" ? resultado.mensagem : "Erro no PHP", type: resultado.status === "sucesso" ? 'success' : 'error' });
    } catch (error) {
      setToast({ message: "Erro de conexão com Proxy.", type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSyncRobot = async () => {
    setIsSyncing(true);
    setSyncStatus({ tipo: 'info', mensagem: '🤖 Iniciando robô...' });
    try {
      const resposta = await fetch(`${BASE_URL}/api_run_robot.php`, { method: 'POST' });
      const dados = await resposta.json();
      setSyncStatus({ 
        tipo: dados.success ? 'sucesso' : 'erro', 
        mensagem: dados.success ? '✅ Sincronizado!' : '❌ Erro no robô.' 
      });
    } catch (error) {
      setSyncStatus({ tipo: 'erro', mensagem: '❌ Erro de conexão.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* O resto do seu JSX de Admin permanece o mesmo */}
      {/* ... manter o return do Admin que você já tem ... */}
    </div>
  );
}