import { useState, useEffect } from 'react';
import { ShoppingCart, Send, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../pages/img/logotipo.png'; 

const BASE_URL = "http://187.127.28.171/api";

export default function Vitrine() {
  // -------------------------
  // ESTADOS DO SISTEMA
  // -------------------------
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  
  // Estados para o fluxo de checkout
  const [modalStep, setModalStep] = useState('carrinho'); // 'carrinho' ou 'pagamento'
  const [formaPagto, setFormaPagto] = useState(null); // null (formulário), 'selecao', 'pix', 'cartao'
  const [dadosCliente, setDadosCliente] = useState({ nome: '', whatsapp: '', endereco: '' });
  const [enviando, setEnviando] = useState(false);
  const buscarCep = async (cepDigitado) => {
    // Remove tudo que não for número (hífen, ponto, etc)
    const cepLimpo = cepDigitado.replace(/\D/g, '');
    
    // Só pesquisa se tiver exatamente 8 números
    if (cepLimpo.length === 8) {
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resposta.json();

        if (!dados.erro) {
          // Se encontrou, monta o endereço e atualiza o estado
          const enderecoFormatado = `${dados.logradouro}, Bairro: ${dados.bairro} - ${dados.localidade}/${dados.uf}`;
          setDadosCliente(prev => ({ ...prev, endereco: enderecoFormatado }));
        } else {
          alert("CEP não encontrado. Por favor, digite o endereço manualmente.");
        }
      } catch (erro) {
        console.error("Erro ao consultar o ViaCEP:", erro);
      }
    }
  };

  // -------------------------
  // BUSCA DE DADOS (API)
  // -------------------------
  useEffect(() => {
    fetch(`${BASE_URL}/api_get_produtos.php`) 
      .then(res => {
        if (!res.ok) throw new Error("Erro na rede");
        return res.json();
      })
      .then(dados => {
        // Ordena para que os manuais apareçam primeiro (opcional, mantive a sua lógica)
        const produtosReorganizados = dados.sort((a, b) => {
          const ehManualA = a.origem === 'manual' ? 1 : 0;
          const ehManualB = b.origem === 'manual' ? 1 : 0;
          return ehManualB - ehManualA; 
        });
        setProdutos(produtosReorganizados);
      })
      .catch(err => console.error("Erro ao carregar banco:", err));
  }, []);

  // -------------------------
  // FUNÇÕES AUXILIARES
  // -------------------------
  const produtosFiltrados = produtos.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionarAoCarrinho = (produto, evento = null) => {
    if (evento) evento.stopPropagation(); 
    setCarrinho(prev => [...prev, produto]);
    alert(`${produto.nome} foi adicionado ao carrinho!`);
    setProdutoSelecionado(null); 
  };

  const calcularTotal = () => {
    return carrinho.reduce((acc, item) => {
      const precoString = item.preco ? item.preco.toString() : '0';
      const valor = parseFloat(precoString.replace('R$', '').replace('.', '').replace(',', '.').trim());
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
  };

  const limparCarrinhoEVoltar = () => {
    setCarrinho([]);
    setModalStep('carrinho');
    setFormaPagto(null);
    setDadosCliente({ nome: '', whatsapp: '', endereco: '' });
  };

  // -------------------------
  // RENDERIZAÇÃO DA TELA
  // -------------------------
  return (
    <div className="bg-gray-50 min-h-screen p-6 sm:p-12 font-sans pb-40">
      
      {/* CABEÇALHO */}
      <header className="max-w-6xl mx-auto mb-16 text-center">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-32 w-auto object-contain drop-shadow-md" />
        </div>
        
        <Link to="/admin">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-all">
            Acessar Painel Admin
          </button>
        </Link>

        <div className="h-1 w-20 bg-green-500 mx-auto rounded-full mt-6"></div>

        <div className="mt-10 max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="O que seu pássaro precisa?"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-700 bg-white"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </header>

      {/* GRADE DE PRODUTOS */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {produtosFiltrados.map((p) => (
          <div 
            key={p.id} 
            onClick={() => setProdutoSelecionado(p)} 
            className="cursor-pointer bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col items-center text-center transition-all hover:scale-105 border border-gray-100"
          >
            <div className="relative w-full mb-6 overflow-hidden rounded-[2rem] h-48 bg-gray-50">
              <img src={p.imagemUrl || p.imagem || "https://via.placeholder.com/300"} alt={p.nome} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-4 h-14 overflow-hidden">{p.nome}</h3>
            <p className="text-3xl font-black text-green-600 mb-8">{p.preco}</p>
          </div>
        ))}
      </main>

      {/* CARRINHO FIXO E FLUXO DE CHECKOUT */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-500 p-6">
            
            {/* ETAPA 0: RESUMO DO CARRINHO */}
            {modalStep === 'carrinho' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-bold">{carrinho.length} iten(s)</p>
                  <p className="text-2xl font-black text-gray-900">
                    {calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button 
                  onClick={() => setModalStep('pagamento')} 
                  className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-green-700 shadow-lg"
                >
                  <Send size={20} /> Finalizar Pedido
                </button>
              </div>
            )}

            {/* FLUXO DE PAGAMENTO */}
            {modalStep === 'pagamento' && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                
                {/* ETAPA 1: DADOS DO CLIENTE */}
{/* ETAPA 1: DADOS DO CLIENTE */}
{!formaPagto && (
  <div className="flex flex-col gap-3">
    <h3 className="font-bold text-lg text-center text-gray-800">Dados para entrega</h3>
    
    <input 
      type="text" 
      placeholder="Seu Nome Completo" 
      className="p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" 
      value={dadosCliente.nome}
      onChange={(e) => setDadosCliente({...dadosCliente, nome: e.target.value})} 
    />
    
    <input 
      type="text" 
      placeholder="WhatsApp (DDD + Número)" 
      className="p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" 
      value={dadosCliente.whatsapp}
      onChange={(e) => setDadosCliente({...dadosCliente, whatsapp: e.target.value})} 
    />

    {/* CAMPO DE CEP E ENDEREÇO */}
    <div className="flex gap-2">
      <input 
        type="text" 
        placeholder="CEP (Só números)" 
        maxLength="9"
        className="p-3 w-1/3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" 
        onChange={(e) => {
          const valor = e.target.value;
          buscarCep(valor); 
        }} 
      />
      
      <input 
        type="text" 
        placeholder="Rua, Bairro, Cidade" 
        className="p-3 w-2/3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" 
        value={dadosCliente.endereco}
        onChange={(e) => setDadosCliente({...dadosCliente, endereco: e.target.value})} 
      />
    </div>
    
    {/* NÚMERO E COMPLEMENTO */}
    <input 
      type="text" 
      placeholder="Número e Complemento (Ex: 123, Apto 4)" 
      className="p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" 
      onChange={(e) => setDadosCliente({...dadosCliente, endereco: dadosCliente.endereco + ", " + e.target.value})} 
    />
    
    <button 
      onClick={() => {
        if(dadosCliente.nome.trim() && dadosCliente.whatsapp.trim() && dadosCliente.endereco.trim()) {
          setFormaPagto('selecao'); 
        } else {
          alert("Por favor, preencha todos os campos de entrega.");
        }
      }}
      className="bg-green-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-green-700 shadow-md transition-all"
    >
      Confirmar Dados e Escolher Pagamento
    </button>
  </div>
)}
                {/* ETAPA 2: SELEÇÃO DE PAGAMENTO */}
                {formaPagto === 'selecao' && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-center text-gray-800">Escolha como pagar:</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setFormaPagto('pix')} className="bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-md">
                        Pagar com PIX
                      </button>
                      <button onClick={() => setFormaPagto('cartao')} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-md">
                        Cartão de Crédito
                      </button>
                    </div>
                  </div>
                )}

                {/* ETAPA 3: FINALIZAÇÃO (PIX OU CARTÃO) */}
                {(formaPagto === 'pix' || formaPagto === 'cartao') && (
                  <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-800 mb-2">Resumo do Pedido - {dadosCliente.nome}</p>
                    
                    {formaPagto === 'pix' ? (
                      <div className="bg-purple-100 p-3 rounded-lg text-purple-800 text-sm mb-4">
                        <p className="font-black mb-1">Chave PIX (Celular): 12996302071</p>
                        <p>Valor: {calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 p-3 rounded-lg text-blue-800 text-sm mb-4">
                        <p className="font-medium">Você será redirecionado para o ambiente seguro da InfinityPay após confirmar.</p>
                      </div>
                    )}

                    <button 
                      disabled={enviando}
                      onClick={async () => {
                        setEnviando(true);
                        try {
                          // Chama a API que salva o cliente e o pedido no banco
                          const resp = await fetch(`${BASE_URL}/api_salvar_pedido.php`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              ...dadosCliente, 
                              total: calcularTotal(), 
                              itens: carrinho 
                            })
                          });
                          
                          const result = await resp.json();
                          
                          if(result.sucesso) {
                            alert("Pedido registrado com sucesso! Em breve entraremos em contato.");
                            // Aqui, se for cartão, você pode colocar o window.open() para o link da InfinityPay
                            limparCarrinhoEVoltar();
                          } else {
                            alert("Erro ao salvar pedido: " + result.erro);
                          }
                        } catch (error) {
                          console.error("Erro na comunicação com a API:", error);
                          alert("Erro de conexão. O pedido não pôde ser salvo.");
                        } finally {
                          setEnviando(false);
                        }
                      }}
                      className={`w-full text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg ${enviando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {enviando ? "Processando..." : "FINALIZAR COMPRA"}
                    </button>
                  </div>
                )}

                {/* BOTÃO VOLTAR GERAL */}
                <button 
                  onClick={() => { 
                    if(formaPagto === 'pix' || formaPagto === 'cartao') setFormaPagto('selecao');
                    else if(formaPagto === 'selecao') setFormaPagto(null);
                    else setModalStep('carrinho');
                  }} 
                  className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-800 text-sm font-medium mt-2 py-2"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO PRODUTO */}
      {produtoSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProdutoSelecionado(null)}>
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setProdutoSelecionado(null)}
              className="absolute top-4 right-4 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors z-10"
            >
              ✕
            </button>

            <div className="w-full h-64 bg-gray-50 rounded-2xl overflow-hidden mb-6 relative">
              <img 
                src={produtoSelecionado.imagemUrl || produtoSelecionado.imagem || "https://via.placeholder.com/300"} 
                alt={produtoSelecionado.nome} 
                className="w-full h-full object-contain mix-blend-multiply absolute inset-0 p-4"
              />
            </div>

            <h2 className="text-2xl font-black text-gray-800 leading-tight mb-2">
              {produtoSelecionado.nome}
            </h2>
            
            <p className="text-gray-600 text-sm mb-4 max-h-24 overflow-y-auto">
              {produtoSelecionado.descricao || "Sem descrição disponível."}
            </p>
            
            <p className="text-3xl font-black text-green-600 mb-6">
              {produtoSelecionado.preco}
            </p>

            <button 
              onClick={(e) => handleAdicionarAoCarrinho(produtoSelecionado, e)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-600/30"
            >
              <ShoppingCart size={22} /> INSERIR NO CARRINHO
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}