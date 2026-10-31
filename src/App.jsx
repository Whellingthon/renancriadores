import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

const TELEFONE_LOJISTA = "5514997669155";
const EMAIL_ADMIN = "welingtonhopka@gmail.com"; 

const LOJA = { nome: "Criatório Cidades", slogan: "Genética de campeões" };
const BRL = (v) => parseFloat(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PRODUTOS_REF = collection(db, "produtos");

function Toast({ msg, tipo }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-[fadeUp_0.3s_ease-out] ${tipo === "ok" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
      <span>{tipo === "ok" ? "✓" : "!"}</span> {msg}
    </div>
  );
}

export default function LojaCompleta() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Tema (Dark/Light) - Começa escuro por padrão
  const [temaEscuro, setTemaEscuro] = useState(true);
  
  // Carrinho e Interface
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [apagarConfirmado, setApagarConfirmado] = useState(null);

  // Admin e Cadastro
  const [adminLogado, setAdminLogado] = useState(false);
  const [telaLogin, setTelaLogin] = useState(false);
  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', infoCurta: '', infoCompleta: '', imagem: '' });

  // Notificações
  const [toast, setToast] = useState({ msg: "", tipo: "ok" });
  const notify = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    window.__t && clearTimeout(window.__t);
    window.__t = setTimeout(() => setToast({ msg: "", tipo }), 2200);
  };

  useEffect(() => {
    carregarProdutos();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminLogado(!!user && user.email === EMAIL_ADMIN);
    });
    return () => unsubscribe();
  }, []);

  const carregarProdutos = async () => {
    try {
      const querySnapshot = await getDocs(PRODUTOS_REF);
      setProdutos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      notify("Erro ao conectar com o banco.", "err");
    } finally {
      setCarregando(false);
    }
  };

  const fazerLoginAdmin = async () => {
    try {
      const credencial = await signInWithPopup(auth, googleProvider);
      if (credencial.user.email !== EMAIL_ADMIN) {
        await signOut(auth);
        notify("Acesso restrito ao dono da loja.", "err");
      } else {
        setTelaLogin(false);
        notify("Bem-vindo de volta, chefe! 👑");
      }
    } catch (error) {
      notify("Erro ao logar. Tente novamente.", "err");
    }
  };

  const sairAdmin = async () => {
    await signOut(auth);
    setAdminLogado(false);
    notify("Sessão encerrada.");
  };

  const cadastrarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco) return notify("Preencha nome e preço!", "err");
    await addDoc(PRODUTOS_REF, {
      nome: novoItem.nome,
      preco: parseFloat(novoItem.preco),
      infoCurta: novoItem.infoCurta || "",
      infoCompleta: novoItem.infoCompleta || "Sem detalhes adicionais.",
      imagem: novoItem.imagem || `https://picsum.photos/seed/${Date.now()}/600/450`
    });
    setNovoItem({ nome: '', preco: '', infoCurta: '', infoCompleta: '', imagem: '' });
    notify("Produto publicado! 🚀");
    carregarProdutos();
  };

  const apagarProduto = async (id) => {
    await deleteDoc(doc(db, "produtos", id));
    setApagarConfirmado(null);
    notify("Produto apagado.");
    carregarProdutos();
  };

  const adicionarAoCarrinho = (produto) => {
    setCarrinho([...carrinho, produto]);
    setProdutoSelecionado(null);
    setCarrinhoAberto(true); 
    notify(`${produto.nome} adicionado!`);
  };
  
  const removerDoCarrinho = (index) => setCarrinho(carrinho.filter((_, i) => i !== index));
  const total = carrinho.reduce((acc, item) => acc + parseFloat(item.preco), 0);

  const finalizarPedido = () => {
    if (carrinho.length === 0) return notify("Seu carrinho está vazio!", "err");
    let texto = "🦜 *NOVO PEDIDO — " + LOJA.nome + "*\n\n";
    carrinho.forEach((item, i) => { texto += `${i + 1}. ${item.nome} — ${BRL(item.preco)}\n`; });
    texto += `\n💰 *TOTAL: ${BRL(total)}*\n\nAguardo confirmação! 🙏`;
    window.open(`https://wa.me/${TELEFONE_LOJISTA}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (telaLogin && !adminLogado) {
    return (
      <div className={temaEscuro ? "dark" : ""}>
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-white grid place-items-center p-4 relative overflow-hidden transition-colors duration-500">
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-yellow-500/20 dark:bg-yellow-500/15 rounded-full blur-3xl" />
          <div className="relative bg-white dark:bg-gradient-to-b dark:from-neutral-900 dark:to-neutral-900/60 border border-slate-200 dark:border-white/10 p-10 rounded-3xl text-center max-w-sm w-full backdrop-blur-xl shadow-2xl transition-colors">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 grid place-items-center text-3xl shadow-lg shadow-yellow-500/30 mb-5">🔐</div>
            <h2 className="text-2xl font-black">Acesso Lojista</h2>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-2 mb-8">Área exclusiva do dono da {LOJA.nome}</p>
            <button onClick={fazerLoginAdmin} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-yellow-400 active:scale-[0.98] transition mb-4 flex items-center justify-center gap-2">
              <span>🔑</span> Entrar com Google
            </button>
            <button onClick={() => setTelaLogin(false)} className="text-xs text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 transition">← Voltar para a loja</button>
          </div>
          <Toast msg={toast.msg} tipo={toast.tipo} />
        </div>
      </div>
    );
  }

  return (
    <div className={temaEscuro ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-white font-sans relative selection:bg-yellow-400/30 pb-28 transition-colors duration-500">
        <style>{`
          @keyframes fadeUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
          @keyframes slideUp{from{opacity:0;transform:translate(-50%,40px)}to{opacity:1;transform:translate(-50%,0)}}
          @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(16,185,129,.3)}50%{box-shadow:0 0 36px rgba(16,185,129,.5)}}
          @keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
          @keyframes ping2{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.9);opacity:0}}
        `}</style>

        {/* HEADER */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/70 border-b border-slate-200 dark:border-white/10 transition-colors">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 grid place-items-center text-xl shadow-lg shadow-yellow-500/20">🐦</div>
              <div className="leading-tight">
                <p className="font-black tracking-tight text-slate-900 dark:text-white">Criatório Cidades</p>
                <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-yellow-500/80">{LOJA.slogan}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão Light/Dark Mode */}
              <button 
                onClick={() => setTemaEscuro(!temaEscuro)} 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-yellow-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                title={temaEscuro ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {temaEscuro ? "☀️" : "🌙"}
              </button>

              {adminLogado ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[10px] font-black px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-400 uppercase tracking-widest border border-yellow-300 dark:border-yellow-400/30">👑 Admin</span>
                  <button onClick={sairAdmin} className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-4 py-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-500 hover:text-rose-700 dark:hover:text-white transition">Sair</button>
                </div>
              ) : (
                <button onClick={() => setTelaLogin(true)} className="text-xs font-bold text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white transition px-4 py-2 rounded-full border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30">Área Restrita</button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-5 pt-8 pb-10">
          {/* Formulário Admin */}
          {adminLogado && (
            <div className="bg-yellow-50 dark:bg-gradient-to-b dark:from-yellow-500/10 dark:to-transparent border border-yellow-200 dark:border-yellow-400/25 p-6 rounded-2xl mb-10 animate-[popIn_0.3s_ease-out] transition-colors">
              <h2 className="font-black text-yellow-700 dark:text-yellow-400 mb-1 flex items-center gap-2">✏️ Cadastrar Novo Produto</h2>
              <p className="text-[11px] text-slate-500 dark:text-white/35 mb-5">Publicado no Firestore e visível a todos imediatamente.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input placeholder="Nome do produto" value={novoItem.nome} onChange={(e)=>setNovoItem({...novoItem,nome:e.target.value})} className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition" />
                <input type="number" step="0.01" placeholder="Preço (ex: 25.50)" value={novoItem.preco} onChange={(e)=>setNovoItem({...novoItem,preco:e.target.value})} className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition" />
                <input placeholder="URL da imagem" value={novoItem.imagem} onChange={(e)=>setNovoItem({...novoItem,imagem:e.target.value})} className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition" />
                <input placeholder="Info curta (ex: 1kg, 220v)" value={novoItem.infoCurta} onChange={(e)=>setNovoItem({...novoItem,infoCurta:e.target.value})} className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition" />
                <textarea placeholder="Informações completas (para o modal de detalhes)" value={novoItem.infoCompleta} onChange={(e)=>setNovoItem({...novoItem,infoCompleta:e.target.value})} rows="3" className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition md:col-span-2" />
              </div>
              <button onClick={cadastrarProduto} className="w-full bg-yellow-400 text-slate-900 font-black py-3 rounded-xl hover:bg-yellow-500 active:scale-[0.98] transition shadow-lg shadow-yellow-500/20">Salvar no Firebase</button>
            </div>
          )}

          {/* Vitrine */}
          {carregando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_,i)=>(<div key={i} className="bg-slate-200 dark:bg-white/5 rounded-2xl h-72 animate-pulse" />))}
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-24 text-slate-400 dark:text-white/30">
              <div className="text-6xl mb-4 opacity-50">📦</div>
              <p className="text-sm">Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos.map(prod => (
                <article key={prod.id} className="group relative bg-white dark:bg-neutral-900/70 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden hover:border-yellow-400/50 dark:hover:border-yellow-400/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden cursor-pointer" onClick={() => setProdutoSelecionado(prod)}>
                    <img src={prod.imagem} alt={prod.nome} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-neutral-950/60 to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-white/50 opacity-0 group-hover:opacity-100 transition">Ver detalhes →</span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-[15px] text-slate-900 dark:text-white leading-snug cursor-pointer" onClick={() => setProdutoSelecionado(prod)}>{prod.nome}</h2>
                    <p className="text-xs text-slate-500 dark:text-white/45 mt-1 h-10">{prod.infoCurta}</p>
                    <div className="flex justify-between items-end mt-3">
                      <span className="font-black text-lg text-amber-600 dark:text-yellow-400">{BRL(prod.preco)}</span>
                      <div className="flex items-center gap-1.5">
                        {adminLogado && apagarConfirmado === prod.id ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); apagarProduto(prod.id); }} className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg hover:bg-rose-600">Confirmar</button>
                            <button onClick={(e) => { e.stopPropagation(); setApagarConfirmado(null); }} className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/60 text-[10px] font-black px-2.5 py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-white/20">Não</button>
                          </>
                        ) : (
                          <>
                            {adminLogado && (
                              <button onClick={(e) => { e.stopPropagation(); setApagarConfirmado(prod.id); }} className="text-rose-500 dark:text-rose-400 text-[11px] font-black bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500 dark:hover:text-white transition">Excluir</button>
                            )}
                            <button onClick={() => adicionarAoCarrinho(prod)} className="px-4 py-2 rounded-xl bg-yellow-400 text-slate-900 text-sm font-black hover:bg-yellow-500 active:scale-95 transition shadow-lg shadow-yellow-500/20">Comprar</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 dark:border-white/10 py-8 text-center text-xs text-slate-400 dark:text-white/30 transition-colors">
          <p className="font-black text-slate-600 dark:text-white/60 mb-1">{LOJA.nome}</p>
          <p>FEITO POR <a href="https://hopsistemas-site.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-amber-500 dark:text-yellow-400 hover:underline">Hopsistemas</a></p>
        </footer>

        {/* BARRA DO CARRINHO */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(94vw,560px)] animate-[slideUp_0.35s_ease-out]">
          {carrinhoAberto ? (
            <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-colors">
              <div onClick={() => setCarrinhoAberto(false)} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition">
                <span className="text-xs font-bold text-slate-600 dark:text-white/60 flex items-center gap-2">
                  🛒 {carrinho.length} {carrinho.length === 1 ? "item" : "itens"}
                  <span className="text-slate-300 dark:text-white/25">▾</span>
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-yellow-400">{BRL(total)}</span>
              </div>
              <div className="max-h-48 overflow-y-auto px-3 space-y-1.5 pb-2">
                {carrinho.map((item, index) => (
                  <div key={index} className="flex justify-between items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold truncate text-slate-800 dark:text-white">{item.nome}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-amber-600 dark:text-yellow-400">{BRL(item.preco)}</span>
                      <button onClick={() => removerDoCarrinho(index)} className="w-5 h-5 grid place-items-center rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black hover:bg-rose-500 hover:text-white transition">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 pt-1.5 border-t border-slate-100 dark:border-white/10">
                <button onClick={finalizarPedido} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 dark:hover:bg-emerald-400 active:scale-[0.98] transition animate-[glow_2.5s_ease-in-out_infinite] flex items-center justify-center gap-2">
                  <span>💬</span> Enviar pedido · {BRL(total)}
                </button>
              </div>
            </div>
          ) : carrinho.length > 0 && (
            <button onClick={() => setCarrinhoAberto(true)} className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-emerald-500/95 backdrop-blur-xl text-white shadow-2xl hover:bg-emerald-600 active:scale-[0.98] transition relative">
              <span className="flex items-center gap-2.5 text-sm font-bold">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-white/20 text-xs font-black">{carrinho.length}</span>
                Ver carrinho
              </span>
              <span className="text-sm font-black">{BRL(total)} →</span>
              <span className="absolute right-3 top-3 w-2 h-2 rounded-full bg-yellow-300 animate-[ping2_1.5s_ease-out_infinite]" />
            </button>
          )}
        </div>

        {/* MODAL DE DETALHES */}
        {produtoSelecionado && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[55]" onClick={() => setProdutoSelecionado(null)}>
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-[popIn_0.25s_ease-out] transition-colors" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setProdutoSelecionado(null)} className="absolute top-4 right-4 bg-black/30 dark:bg-black/50 backdrop-blur border border-white/20 dark:border-white/10 hover:bg-black/50 dark:hover:bg-black/80 rounded-full w-9 h-9 grid place-items-center font-bold text-white z-10">✕</button>
              <div className="relative">
                <img src={produtoSelecionado.imagem} alt={produtoSelecionado.nome} className="w-full h-60 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-neutral-900" />
              </div>
              <div className="p-6 pt-2">
                <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{produtoSelecionado.nome}</h2>
                <span className="inline-block bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-400/30 font-black px-4 py-1.5 rounded-full text-lg mb-4">{BRL(produtoSelecionado.preco)}</span>
                {produtoSelecionado.infoCurta && <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/35 mb-2">{produtoSelecionado.infoCurta}</p>}
                <p className="text-slate-600 dark:text-white/60 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{produtoSelecionado.infoCompleta}</p>
                <button onClick={() => adicionarAoCarrinho(produtoSelecionado)} className="w-full bg-yellow-400 text-slate-900 font-black py-4 rounded-xl hover:bg-yellow-500 active:scale-[0.98] transition text-lg shadow-lg shadow-yellow-500/25">Comprar agora 🛒</button>
              </div>
            </div>
          </div>
        )}

        <Toast msg={toast.msg} tipo={toast.tipo} />
      </div>
    </div>
  );
}