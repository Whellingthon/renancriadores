import { useState, useEffect } from 'react';
import { 
  Sprout, Settings, Package, TrendingUp, RefreshCw, 
  Clock, SlidersHorizontal, Play, PlusCircle, Edit, Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import "../App.css";
import DashboardVendas from './DashboardVendas';

// ==========================================
// AMBIENTE DE PRODUÇÃO (VPS)
// ==========================================
const BASE_URL = "http://187.127.28.171/api";

export default function Admin() {
  const [margin, setMargin] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ tipo: '', mensagem: '' });
  const navigate = useNavigate();

  // Trava de Segurança
  useEffect(() => {
    const logado = localStorage.getItem('logado');
    console.log("Validando acesso no Admin. Valor do crachá:", logado);
    if (!logado) {
      navigate('/login');
    }
  }, [navigate]);

  // Estados do CRUD Manual
  const [produtoManual, setProdutoManual] = useState({ nome: '', preco: '', imagemUrl: '' });
  const [fotoArquivo, setFotoArquivo] = useState(null); // NOVO: Armazena o arquivo de imagem do PC
  const [listaProdutosManuais, setListaProdutosManuais] = useState([]);
  const [idEditando, setIdEditando] = useState(null);

  // Carregar lista de produtos
  const carregarProdutosManuais = async () => {
    try {
      const resp = await fetch(`${BASE_URL}/api_get_produtos.php`); 
      const dados = await resp.json();
      setListaProdutosManuais(dados); 
    } catch (err) {
      console.error("Erro ao carregar lista de produtos manuais", err);
    }
  };

  // Carregar margem inicial
  useEffect(() => {
    const carregarMargem = async () => {
      try {
        const resp = await fetch(`${BASE_URL}/api_get_margem.php`);
        const dados = await resp.json();
        if (dados.margem) setMargin(dados.margem);
      } catch (err) {
        console.error("Erro ao carregar margem inicial");
      }
    };
    
    carregarMargem();
    carregarProdutosManuais();
  }, []);

  // Salvar Configuração da Margem
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resposta = await fetch(`${BASE_URL}/api_margem.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ margem: margin })
      });
      const resultado = await resposta.json();
      setToast({ 
        message: resultado.status === "sucesso" ? resultado.mensagem : "Erro no PHP", 
        type: resultado.status === "sucesso" ? 'success' : 'error' 
      });
    } catch (error) {
      setToast({ message: "Erro de conexão com VPS.", type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSair = () => {
    localStorage.removeItem('logado');
    navigate('/login');
  };

  // Sincronização Penna Firme
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

  // ==========================================
  // FUNÇÕES DO CRUD DE PRODUTOS MANUAIS
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProdutoManual(prev => ({ ...prev, [name]: value }));
  };

  const handleCadastrarProdutoManual = async () => {
    // 1. Validar campos (imagemUrl só é obrigatória se não houver um arquivo selecionado do PC)
    if (!produtoManual.nome || !produtoManual.preco || (!produtoManual.imagemUrl && !fotoArquivo)) {
      setToast({ message: "Preencha todos os campos do produto manual!", type: "error" });
      setTimeout(() => setToast(null), 3500);
      return;
    }

    const isEditando = idEditando !== null;
    let urlFinalDaImagem = produtoManual.imagemUrl;

    // 2. Upload da imagem local do PC para a VPS (se existir)
    if (fotoArquivo) {
      try {
        const formData = new FormData();
        formData.append('foto', fotoArquivo);

        const uploadResp = await fetch(`${BASE_URL}/api_upload_foto.php`, {
          method: 'POST',
          body: formData
        });
        const uploadResult = await uploadResp.json();
        
        if (uploadResult.success) {
          urlFinalDaImagem = uploadResult.url; // Vincula o caminho relativo da pasta uploads da VPS
        } else {
          setToast({ message: "Erro no upload da foto: " + uploadResult.erro, type: "error" });
          setTimeout(() => setToast(null), 3500);
          return;
        }
      } catch (err) {
        console.error("Erro na comunicação com a API de upload", err);
        setToast({ message: "Erro de comunicação no upload da foto.", type: "error" });
        setTimeout(() => setToast(null), 3500);
        return;
      }
    }

    // 3. Montar o payload pronto
    const payload = {
      id: idEditando, 
      nome: produtoManual.nome,
      preco: produtoManual.preco,
      imagemUrl: urlFinalDaImagem
    };

    const endpoint = isEditando ? `${BASE_URL}/api_editar_produto_manual.php` : `${BASE_URL}/api_produto_manual.php`;

    console.log("Enviando para:", endpoint);
    console.log("Payload:", payload);

    // 4. Fazer o envio para a persistência no MySQL
    try {
      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const resultado = await resposta.json();
      console.log("Resposta da API:", resultado);

      if (resultado.sucesso) {
        setToast({ message: isEditando ? "Produto updated!" : "Produto cadastrado!", type: "success" });
        setProdutoManual({ nome: '', preco: '', imagemUrl: '' }); 
        setFotoArquivo(null); // Reseta estado do binário
        if (document.getElementById('input-foto-arquivo')) {
          document.getElementById('input-foto-arquivo').value = ""; // Limpa visualmente o input de arquivo
        }
        setIdEditando(null);
        carregarProdutosManuais();
      } else {
        console.error("Erro da API:", resultado.erro);
        setToast({ message: "Erro: " + resultado.erro, type: "error" });
      }
    } catch (error) {
      console.error("Erro de comunicação:", error);
      setToast({ message: "Erro de comunicação com o servidor.", type: "error" });
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleEditarProduto = (produto) => {
    setProdutoManual({
      nome: produto.nome,
      preco: produto.preco || produto.preco_custo || '', 
      imagemUrl: produto.imagem
    });
    setIdEditando(produto.id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); 
  };

  const handleExcluirProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const resp = await fetch(`${BASE_URL}/api_excluir_produto_manual.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const resultado = await resp.json();
      
      if (resultado.sucesso) {
        setToast({ message: "Produto excluído!", type: "success" });
        carregarProdutosManuais();
      } else {
        setToast({ message: "Erro ao excluir.", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erro de conexão.", type: "error" });
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCancelarEdicao = () => {
    setProdutoManual({ nome: '', preco: '', imagemUrl: '' });
    setFotoArquivo(null);
    if (document.getElementById('input-foto-arquivo')) {
      document.getElementById('input-foto-arquivo').value = "";
    }
    setIdEditando(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 pb-12">
      {/* Notificação Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white font-bold shadow-lg z-50 transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-xl text-white">
              <Sprout size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Painel Administrativo</h1>
              <span className="text-xs font-bold text-green-600 tracking-wider">SISTEMA SID-MAYA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors">
              ← Ver Vitrine
            </Link>
            <Link to="/admin/dashboard" className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
              📊 Dashboard
            </Link>
            <button onClick={handleSair} className="text-sm font-medium text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
              Sair
            </button>
          
            <span className="text-sm text-gray-400 font-medium">v2.2.0</span>
            <Settings className="text-gray-400 cursor-pointer hover:text-gray-600" size={20} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        
        {/* Top Cards (Status) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <Package className="text-blue-500" size={24} />
            </div>
            <h2 className="text-4xl font-black text-gray-800">{listaProdutosManuais.length}</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Produtos Ativos</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-green-50 p-3 rounded-lg mb-3">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <h2 className="text-4xl font-black text-gray-800">{margin}%</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Margem de Lucro</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-purple-50 p-3 rounded-lg mb-3">
              <Clock className="text-purple-500" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mt-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              MySQL Ativo
            </h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Status da Conexão</p>
          </div>
        </div>

        {/* Middle Cards (Configs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-green-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} />
                <h3 className="font-bold">Configurar Preços</h3>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white text-green-700 px-3 py-1 rounded-md text-sm font-bold shadow-sm hover:bg-green-50"
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <div className="p-8 flex-grow flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Margem Global</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-7xl font-black text-gray-800">{margin}</span>
                <span className="text-3xl font-bold text-gray-300">%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
              <RefreshCw size={20} />
              <h3 className="font-bold">Estoque e Fornecedor</h3>
            </div>
            <div className="p-8 flex-grow">
              <div 
                onClick={handleSyncRobot}
                className={`border-2 border-dashed ${isSyncing ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'} rounded-xl h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors`}
              >
                <Play className={`${isSyncing ? 'text-blue-400 animate-pulse' : 'text-blue-600'} mb-4`} size={48} />
                <p className="text-sm font-bold text-gray-500 max-w-[200px]">
                  {isSyncing ? "Sincronizando banco..." : "Sincroniza os produtos da Penna Firme com seu banco local"}
                </p>
                {syncStatus.mensagem && (
                  <p className={`mt-4 text-sm font-bold ${syncStatus.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`}>
                    {syncStatus.mensagem}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Produtos Manuais */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gray-800 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Package size={20} />
              Meus Produtos
            </h3>
            <span className="bg-gray-700 px-3 py-1 rounded-lg text-xs font-bold">
              {listaProdutosManuais.length} itens
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-bold">Imagem</th>
                  <th className="p-4 font-bold">Nome do Produto</th>
                  <th className="p-4 font-bold">Preço</th>
                  <th className="p-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaProdutosManuais.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400 font-medium">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                ) : (
                  listaProdutosManuais.map((prod) => {
                    const foto = prod.imagem;
                    
                    return (
                      <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          {foto ? (
                            <img src={foto} alt={prod.nome} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-gray-700">{prod.nome}</td>
                        <td className="p-4 font-bold text-green-600">{prod.preco}</td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditarProduto(prod)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleExcluirProduto(prod.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulário de Cadastro Manual / Edição */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className={`${idEditando ? 'bg-orange-500' : 'bg-purple-600'} p-4 text-white flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              {idEditando ? <Edit size={20} /> : <PlusCircle size={20} />}
              <h3 className="font-bold">
                {idEditando ? 'Editando Produto' : 'Cadastrar Produto Manual'}
              </h3>
            </div>
            {idEditando && (
              <button onClick={handleCancelarEdicao} className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors">
                Cancelar Edição
              </button>
            )}
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome do Produto</label>
                <input 
                  type="text" 
                  name="nome"
                  value={produtoManual.nome || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Gaiola de Torneio Premium"
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preço de Venda Final (R$)</label>
                <input 
                  type="text" 
                  name="preco"
                  value={produtoManual.preco || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: 150.00"
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" 
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Foto do Produto (Computador ou Link)</label>
                <div className="flex flex-col gap-2 mb-4">
                  {/* Seletor do Computador */}
                  <input 
                    id="input-foto-arquivo"
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setFotoArquivo(e.target.files[0]);
                        setProdutoManual(prev => ({ ...prev, imagemUrl: "" })); // Zera a URL se escolheu arquivo local
                      }
                    }} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border rounded-xl p-1 bg-gray-50/50"
                  />
                  {/* URL Externa de Texto */}
                  {!fotoArquivo && (
                    <input 
                      type="text" 
                      name="imagemUrl"
                      value={produtoManual.imagemUrl || ""}
                      onChange={handleInputChange}
                      placeholder="Ou cole uma URL da imagem aqui"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-950 placeholder-gray-400 text-xs"
                    />
                  )}
                </div>
                <button 
                  onClick={handleCadastrarProdutoManual}
                  className={`${idEditando ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto w-full`}
                >
                  {idEditando ? <Edit size={20} /> : <PlusCircle size={20} />}
                  {idEditando ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}