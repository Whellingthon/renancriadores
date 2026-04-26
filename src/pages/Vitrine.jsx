const API_URL = "https://cors-anywhere.herokuapp.com/http://187.127.28.171/renancriadores/api/api_get_produtos.php";

// ... dentro do useEffect:
fetch(API_URL) // <--- Use a variável aqui, sem aspas!
import { useState, useEffect } from 'react';
import { ShoppingCart, Send, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../pages/img/logotipo.png'; 

export default function Vitrine() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');

useEffect(() => {
    // Ajustado para o nome da pasta em minúsculo conforme a VPS
    fetch("http://187.127.28.171/renancriadores/api/api_get_produtos.php")
      .then(res => {
        if (!res.ok) throw new Error("Erro na rede");
        return res.json();
      })
      .then(dados => setProdutos(dados))
      .catch(err => console.error("Erro ao carregar banco:", err));
  }, []);

  const produtosFiltrados = produtos.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionarAoCarrinho = (produto) => setCarrinho([...carrinho, produto]);

  const calcularTotal = () => {
    return carrinho.reduce((acc, item) => {
      const valor = parseFloat(item.preco.toString().replace('R$', '').replace('.', '').replace(',', '.').trim());
      return acc + valor;
    }, 0);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 sm:p-12 font-sans pb-40">
      <header className="max-w-6xl mx-auto mb-16 text-center">
        {/* LOGOTIPO CENTRALIZADO USANDO A VARIÁVEL IMPORTADA */}
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="Renan Criadores Logo" 
            className="h-32 w-auto object-contain drop-shadow-md" 
          />
        </div>
        <Link to="/admin">
  <button style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px' }}>
    Acessar Painel Admin
  </button>
</Link>
        <div className="h-1 w-20 bg-green-500 mx-auto rounded-full"></div>

        {/* INPUT DE BUSCA */}
        <div className="mt-10 max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="O que seu pássaro precisa?"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-700 transition-all focus:scale-105"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {produtosFiltrados.map((p) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col items-center text-center transition-all hover:translate-y-[-8px] border border-gray-100">
            <div className="relative w-full mb-6 overflow-hidden rounded-[2rem] h-48 bg-gray-50">
              <img src={p.imagem || "https://via.placeholder.com/300"} alt={p.nome} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-4 h-14 overflow-hidden">{p.nome}</h3>
            <p className="text-3xl font-black text-green-600 mb-8">{p.preco}</p>
            <button onClick={() => adicionarAoCarrinho(p)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3">
              <ShoppingCart size={22} /> Adicionar
            </button>
          </div>
        ))}
      </main>

      {/* FOOTER DO CARRINHO */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-500 p-6 flex items-center justify-between">
            <p className="text-2xl font-black text-gray-900">
              {calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <button 
              onClick={() => {
                const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                let msg = `Olá Maya! NOVO PEDIDO - RENAN CRIADORES:%0A%0A;`;
                carrinho.forEach((item, i) => msg += `${i+1}. ${item.nome} - ${item.preco}%0A`);
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
    </div>
  );
}