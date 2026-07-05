import { useState, useEffect } from 'react';
import { ShoppingCart, Send, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../pages/img/logotipo.png'; 

// Substitua suas constantes atuais por esta estrutura que você já usava:
const BASE_URL = "https://cors-anywhere.herokuapp.com/http://187.127.28.171/renancriadores/api";
export default function Vitrine() {
  // 1. Todos os estados devem ficar DENTRO da função principal
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Erro na rede");
        return res.json();
      })
      .then(dados => {
        // Lógica para colocar os produtos manuais no topo da lista
        // (Ajuste o 'origem' caso o nome da sua coluna no banco seja diferente)
        const produtosReorganizados = dados.sort((a, b) => {
          const ehManualA = a.origem === 'manual' ? 1 : 0;
          const ehManualB = b.origem === 'manual' ? 1 : 0;
          return ehManualB - ehManualA; 
        });
        setProdutos(produtosReorganizados);
      })
      .catch(err => console.error("Erro ao carregar banco:", err));
  }, []);

  const produtosFiltrados = produtos.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionarAoCarrinho = (produto, evento = null) => {
    // Se o clique veio do botão do card, impede que o modal abra junto
    if (evento) evento.stopPropagation(); 
    
    setCarrinho(prev => [...prev, produto]);
    alert(`${produto.nome} foi adicionado ao carrinho!`);
    setProdutoSelecionado(null); // Fecha o modal caso ele esteja aberto
  };

  const calcularTotal = () => {
    return carrinho.reduce((acc, item) => {
      // Garantia de formatação para evitar erros com valores nulos
      const precoString = item.preco ? item.preco.toString() : '0';
      const valor = parseFloat(precoString.replace('R$', '').replace('.', '').replace(',', '.').trim());
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
  };

  return (
    // 2. Esta é a DIV PAI. Absolutamente TUDO deve ficar dentro dela.
    <div className="bg-gray-50 min-h-screen p-6 sm:p-12 font-sans pb-40">
      
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

      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {produtosFiltrados.map((p) => (
          <div 
            key={p.id} 
            onClick={() => setProdutoSelecionado(p)} // Clique no card inteiro abre o Modal
            className="cursor-pointer bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col items-center text-center transition-all hover:scale-105 border border-gray-100"
          >
            <div className="relative w-full mb-6 overflow-hidden rounded-[2rem] h-48 bg-gray-50">
              {/* Usa imagemUrl ou imagem dependendo de como vem da VPS */}
              <img src={p.imagemUrl || p.imagem || "https://via.placeholder.com/300"} alt={p.nome} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-4 h-14 overflow-hidden">{p.nome}</h3>
            <p className="text-3xl font-black text-green-600 mb-8">R$ {p.preco}</p>
            <button 
              onClick={(e) => handleAdicionarAoCarrinho(p, e)} // Passamos o evento (e) para isolar o clique
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3"
            >
              <ShoppingCart size={22} /> Adicionar
            </button>
          </div>
        ))}
      </main>

      {/* CARRINHO FIXO NA BASE */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-500 p-6 flex items-center justify-between">
            <p className="text-2xl font-black text-gray-900">
              {calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <button 
              onClick={() => {
                const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                let msg = `Olá! NOVO PEDIDO - RENAN CRIADORES:%0A%0A`;
                carrinho.forEach((item, i) => msg += `${i+1}. ${item.nome} - R$ ${item.preco}%0A`);
                msg += `%0A*Total: ${total}*`;
                window.open(`https://wa.me/5512997498001?text=${msg}`, '_blank');
              }} 
              className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
            >
              <Send size={20} /> Finalizar Pedido
            </button>
          </div>
        </div>
      )}

      {/* 3. O MODAL AGORA ESTÁ PROTEGIDO DENTRO DA DIV PAI */}
      {produtoSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-fade-in-up">
            
            <button 
              onClick={() => setProdutoSelecionado(null)}
              className="absolute top-4 right-4 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>

            <div className="w-full h-64 bg-gray-50 rounded-2xl overflow-hidden mb-6">
              <img 
                src={produtoSelecionado.imagemUrl || produtoSelecionado.imagem || "https://via.placeholder.com/300"} 
                alt={produtoSelecionado.nome} 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <h2 className="text-2xl font-black text-gray-800 leading-tight mb-2">
              {produtoSelecionado.nome}
            </h2>
            
            <p className="text-3xl font-black text-green-600 mb-6">
              R$ {parseFloat(produtoSelecionado.preco ? produtoSelecionado.preco.toString().replace('R$', '').replace('.', '').replace(',', '.').trim() : 0).toFixed(2)}
            </p>

            <button 
              onClick={() => handleAdicionarAoCarrinho(produtoSelecionado)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-600/30"
            >
              <span>+</span> INSERIR NO CARRINHO
            </button>

          </div>
        </div>
      )}
      
    </div>
  );
}