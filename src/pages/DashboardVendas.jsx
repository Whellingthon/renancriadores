import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, ShoppingCart, Calendar } from 'lucide-react';

export default function DashboardVendas({ baseUrl }) {
  const [vendas, setVendas] = useState([]);
  
  // Proteção adicionada aqui ( || 0 ) para evitar o erro de Not a Number (NaN)
  const totalVendido = vendas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
  const ticketMedio = vendas.length > 0 ? (totalVendido / vendas.length) : 0;

  const carregarVendas = async () => {
    try {
      const resp = await fetch(`${baseUrl}/api_get_vendas.php`);
      const dados = await resp.json();
      // Garantimos que sempre seja um array, mesmo se a API falhar
      setVendas(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error("Erro ao carregar vendas", err);
    }
  };

  useEffect(() => { carregarVendas(); }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ShoppingCart size={20} /> Histórico de Vendas
      </h3>
      
      <div className="p-6 max-w-6xl mx-auto">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-bold uppercase">Total Vendido</p>
            <h2 className="text-3xl font-black text-gray-800">R$ {totalVendido.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-bold uppercase">Total de Pedidos</p>
            <h2 className="text-3xl font-black text-gray-800">{vendas.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-bold uppercase">Ticket Médio</p>
            <h2 className="text-3xl font-black text-gray-800">R$ {ticketMedio.toFixed(2)}</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="p-3">Data</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3">Itens</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda) => (
                <tr key={venda.id} className="border-t border-gray-50 text-sm">
                  <td className="p-3 text-gray-600">
                    {venda.data_pedido ? new Date(venda.data_pedido).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3 font-bold text-green-600">
                    R$ {(parseFloat(venda.total) || 0).toFixed(2)}
                  </td>
                  <td className="p-3 font-bold">
                    <span className={`px-2 py-1 rounded ${venda.forma_pagamento === 'pix' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {venda.forma_pagamento?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">
                      {venda.itens_detalhados?.length || 0} itens
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> {/* Fim da div max-w-6xl */}
    </div> /* <-- AQUI ESTAVA FALTANDO ESSA DIV PARA FECHAR O BLOCO PRINCIPAL */
  );
}