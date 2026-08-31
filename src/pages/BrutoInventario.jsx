import { useState, useEffect } from 'react';
import { Package, Search, Filter, DollarSign, TrendingDown, Box, Plus, Trash2, AlertCircle, X, Save, ChevronDown, Edit2, Check, Send, BellRing } from 'lucide-react';
import api from '../services/api';

export default function BrutoInventario() {
  const [produtos, setProdutos] = useState([]);
  const [totais, setTotais] = useState({ totalInvestimento: 0, totalRma: 0, itensFisicos: 0 });
  
  const [categoriasDb, setCategoriasDb] = useState([]);
  const [marcasDb, setMarcasDb] = useState([]);
  
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas as Categorias');
  const [marca, setMarca] = useState('Todas as Marcas');
  const [isRma, setIsRma] = useState(false);

  const [dropdownCatAberto, setDropdownCatAberto] = useState(false);
  const [dropdownMarcaAberto, setDropdownMarcaAberto] = useState(false);

  const [modalDelete, setModalDelete] = useState({ open: false, id: null });
  const [modalAdd, setModalAdd] = useState(false);

  // 🔥 MODAL DE SINCRONIZAÇÃO
  const [modalSync, setModalSync] = useState({ open: false, item: null });
  const [mesaDestino, setMesaDestino] = useState('TELAS');

  const [formAdd, setFormAdd] = useState({ categoria: '', sku: '', marca: '', item: '', quantidade: '', valorUnitario: '' });
  const [novaCatInput, setNovaCatInput] = useState('');
  const [novaMarcaInput, setNovaMarcaInput] = useState('');

  const [editandoId, setEditandoId] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [novaCatEdicao, setNovaCatEdicao] = useState('');
  const [novaMarcaEdicao, setNovaMarcaEdicao] = useState('');

  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });
  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  useEffect(() => { carregarFiltros(); }, []);
  useEffect(() => { setPaginaAtual(0); }, [busca, categoria, marca, isRma]);
  useEffect(() => {
    carregarEstoque();
    carregarTotais();
  }, [paginaAtual, busca, categoria, marca, isRma]);

  const carregarFiltros = async () => {
    try {
      const resCat = await api.get('/estoque/categorias');
      setCategoriasDb(resCat.data || []);
      const resMar = await api.get('/estoque/marcas');
      setMarcasDb(resMar.data || []);
    } catch (e) {}
  };

  const carregarEstoque = async () => {
    try {
      const res = await api.get(`/estoque?page=${paginaAtual}&size=35&busca=${busca}&categoria=${categoria === 'Todas as Categorias' ? '' : categoria}&marca=${marca === 'Todas as Marcas' ? '' : marca}&isRma=${isRma ? 'true' : ''}`);
      const data = res.data || {};
      setProdutos(data.content || []);
      setTotalPaginas(data.totalPages && data.totalPages > 0 ? data.totalPages : 1);
    } catch (e) {
      setProdutos([]);
      setTotalPaginas(1);
    }
  };

  const carregarTotais = async () => {
    try {
      const res = await api.get(`/estoque/totais?busca=${busca}&categoria=${categoria === 'Todas as Categorias' ? '' : categoria}&marca=${marca === 'Todas as Marcas' ? '' : marca}&isRma=${isRma ? 'true' : ''}`);
      setTotais(res.data);
    } catch (e) {}
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/estoque/${modalDelete.id}`);
      setModalDelete({ open: false, id: null });
      carregarEstoque();
      carregarTotais();
      carregarFiltros();
      mostrarToast("Excluído com sucesso!");
    } catch (e) { mostrarToast("Erro ao excluir.", "erro"); }
  };

  const handleAddManual = async () => {
    const catFinal = formAdd.categoria === 'NOVA' ? novaCatInput.trim().toUpperCase() : formAdd.categoria;
    const marcaFinal = formAdd.marca === 'NOVA' ? novaMarcaInput.trim().toUpperCase() : formAdd.marca;

    if (!formAdd.sku || !formAdd.item || !catFinal) return mostrarToast("SKU, Descrição e Categoria são obrigatórios!", "erro");
    
    try {
      const qtd = Number(formAdd.quantidade) || 0;
      const vUnit = Number(formAdd.valorUnitario) || 0;
      const payload = { 
        ...formAdd, categoria: catFinal, marca: marcaFinal,
        quantidade: qtd, valorUnitario: vUnit, valorTotal: qtd * vUnit 
      };
      
      await api.post('/estoque/manual', payload);
      setModalAdd(false);
      setFormAdd({ categoria: '', sku: '', marca: '', item: '', quantidade: '', valorUnitario: '' });
      setNovaCatInput(''); setNovaMarcaInput('');
      carregarEstoque(); carregarTotais(); carregarFiltros();
      mostrarToast("Cadastrado com sucesso!");
    } catch (e) { mostrarToast("Erro ao cadastrar.", "erro"); }
  };

  const iniciarEdicao = (p) => {
    setEditandoId(p.id);
    setFormEdicao({ ...p });
    setNovaCatEdicao(''); setNovaMarcaEdicao('');
  };

  const salvarEdicao = async (id) => {
    const catFinal = formEdicao.categoria === 'NOVA' ? novaCatEdicao.trim().toUpperCase() : formEdicao.categoria;
    const marcaFinal = formEdicao.marca === 'NOVA' ? novaMarcaEdicao.trim().toUpperCase() : formEdicao.marca;

    const payload = { ...formEdicao, categoria: catFinal, marca: marcaFinal };

    try {
      await api.put(`/estoque/${id}`, payload);
      setEditandoId(null);
      carregarEstoque(); carregarTotais(); carregarFiltros();
      mostrarToast("Alterações salvas!");
    } catch (e) { mostrarToast("Erro ao salvar alterações.", "erro"); }
  };

  const confirmarSincronizacao = async () => {
    if (!modalSync.item) return;

    const itemDoEstoque = modalSync.item;
    const fornecedorBase = (itemDoEstoque.marca || 'GENERICO').toUpperCase();
    
    const payload = {
      item: itemDoEstoque.descricaoLimpa || itemDoEstoque.item || "PRODUTO SEM NOME",
      descricaoLimpa: itemDoEstoque.descricaoLimpa || itemDoEstoque.item || "PRODUTO SEM NOME",
      categoria: mesaDestino, 
      categoriaAba: mesaDestino, 
      codigosFornecedores: { [fornecedorBase]: itemDoEstoque.sku || "" },
      custosFornecedores: { [fornecedorBase]: Number(itemDoEstoque.vUnit || itemDoEstoque.valorUnitario) || 0 },
      estoqueFornecedores: {
        [fornecedorBase]: {
          qtd: Number(itemDoEstoque.fisico || itemDoEstoque.quantidade) || 0,
          vUnit: Number(itemDoEstoque.vUnit || itemDoEstoque.valorUnitario) || 0
        }
      }
    };

    try {
      await api.post('/mesacompras', payload);
      mostrarToast(`Item enviado para a Mesa de ${mesaDestino} com sucesso!`);
      setModalSync({ open: false, item: null });
    } catch (error) {
      mostrarToast("Erro ao enviar item para a mesa.", "erro");
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const closeDropdowns = () => { setDropdownCatAberto(false); setDropdownMarcaAberto(false); };

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200 relative">
      
      {toast.visivel && (
        <div className={`absolute top-6 right-6 z-100 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100 shadow-emerald-900/50' : 'bg-rose-900/90 border-rose-500 text-rose-100 shadow-rose-900/50'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      {(dropdownCatAberto || dropdownMarcaAberto) && (
        <div className="fixed inset-0 z-30" onClick={closeDropdowns}></div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 relative z-40">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Package className="text-emerald-400" size={32} /> INVENTÁRIO GERAL
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 ml-11">
            Controle de balanço, precificação e auditoria do estoque (35 itens/página).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setModalAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 transition-colors">
            <Plus size={16} /> ADD MANUAL
          </button>
          
          {/* FILTRO CATEGORIA */}
          <div className="relative flex bg-[#111A2C] border border-[#1E293B] rounded-xl shadow-lg">
            <div className="px-3 flex items-center text-slate-400 border-r border-[#1E293B]"><Filter size={16} /></div>
            <button onClick={() => { setDropdownCatAberto(!dropdownCatAberto); setDropdownMarcaAberto(false); }} className="w-44 bg-transparent text-xs font-bold text-slate-300 p-2.5 flex justify-between items-center outline-none hover:bg-slate-800/50">
              <span className="truncate">{categoria}</span>
              <ChevronDown size={14} className={`ml-2 text-slate-500 transition-transform ${dropdownCatAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownCatAberto && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#0E1525] border border-slate-700 rounded-lg shadow-2xl py-2 z-50 max-h-60 overflow-y-auto custom-scrollbar">
                <div onClick={() => { setCategoria('Todas as Categorias'); closeDropdowns(); }} className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors">Todas as Categorias</div>
                {categoriasDb.map(cat => (
                  <div key={cat} onClick={() => { setCategoria(cat); closeDropdowns(); }} className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors uppercase">{cat}</div>
                ))}
              </div>
            )}
          </div>
          
          {/* FILTRO MARCA */}
          <div className="relative flex bg-[#111A2C] border border-[#1E293B] rounded-xl shadow-lg">
            <div className="px-3 flex items-center text-slate-400 border-r border-[#1E293B]"><Filter size={16} /></div>
            <button onClick={() => { setDropdownMarcaAberto(!dropdownMarcaAberto); setDropdownCatAberto(false); }} className="w-40 bg-transparent text-xs font-bold text-slate-300 p-2.5 flex justify-between items-center outline-none hover:bg-slate-800/50">
              <span className="truncate">{marca}</span>
              <ChevronDown size={14} className={`ml-2 text-slate-500 transition-transform ${dropdownMarcaAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownMarcaAberto && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#0E1525] border border-slate-700 rounded-lg shadow-2xl py-2 z-50 max-h-60 overflow-y-auto custom-scrollbar">
                <div onClick={() => { setMarca('Todas as Marcas'); closeDropdowns(); }} className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors">Todas as Marcas</div>
                {marcasDb.map(m => (
                  <div key={m} onClick={() => { setMarca(m); closeDropdowns(); }} className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors uppercase">{m}</div>
                ))}
              </div>
            )}
          </div>

          <div className="flex bg-[#111A2C] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg min-w-62.5">
            <input type="text" placeholder="Pesquisar SKU ou Produto..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent text-xs font-bold text-white outline-none p-2.5 placeholder-slate-500" />
            <div className="px-3 flex items-center bg-cyan-600 text-white cursor-pointer hover:bg-cyan-500"><Search size={16} /></div>
          </div>
        </div>
      </div>

      {/* DASHBOARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0 relative z-10">
        <div className="bg-[#111A2C] border border-emerald-900/50 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Investimento (Sem RMA)</p>
              <h2 className="text-2xl font-black text-emerald-400">{formatMoney(totais.totalInvestimento)}</h2>
            </div>
          </div>
        </div>

        <div onClick={() => setIsRma(!isRma)} className={`bg-[#111A2C] border ${isRma ? 'border-rose-500' : 'border-rose-900/50'} rounded-2xl p-5 relative overflow-hidden shadow-lg cursor-pointer hover:bg-[#152033] transition-colors group`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-colors ${isRma ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20'}`}><TrendingDown size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Prejuízo (RMA) - Clique p/ Filtrar</p>
              <h2 className="text-2xl font-black text-rose-400">-{formatMoney(totais.totalRma)}</h2>
            </div>
          </div>
        </div>

        <div className="bg-[#111A2C] border border-cyan-900/50 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Box size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Itens Físicos Global</p>
              <h2 className="text-2xl font-black text-cyan-400">{totais.itensFisicos} UN</h2>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE ESTOQUE */}
      <div className="flex-1 bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#0E1525] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="p-4">Categoria</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Marca</th>
                <th className="p-4 w-full">Descrição do Produto</th>
                <th className="p-4 text-center">Qtd</th>
                <th className="p-4 text-right">V. Unitário</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs font-bold text-slate-300">
              {produtos.map(p => {
                const isEditando = editandoId === p.id;
                const isRmaItem = p.quantidade < 0;

                return (
                  <tr key={p.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="p-4">
                      {isEditando ? (
                        <div className="flex flex-col gap-1">
                          <select 
                            value={formEdicao.categoria} 
                            onChange={e => setFormEdicao({...formEdicao, categoria: e.target.value})} 
                            className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs outline-none"
                          >
                            {categoriasDb.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="NOVA">➕ CRIAR NOVA...</option>
                          </select>
                          {formEdicao.categoria === 'NOVA' && (
                            <input type="text" placeholder="Nome da categoria..." value={novaCatEdicao} onChange={e => setNovaCatEdicao(e.target.value.toUpperCase())} className="bg-slate-900 border border-emerald-500 text-white rounded p-1 text-xs outline-none" />
                          )}
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded bg-slate-800 border ${isRmaItem ? 'text-rose-400 border-rose-900' : 'text-fuchsia-400 border-fuchsia-900'}`}>
                          {p.categoria || '-'}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400">
                      {isEditando ? (
                        <input type="text" value={formEdicao.sku || ''} onChange={e => setFormEdicao({...formEdicao, sku: e.target.value.toUpperCase()})} className="w-24 bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs outline-none" />
                      ) : p.sku}
                    </td>

                    <td className="p-4">
                      {isEditando ? (
                        <div className="flex flex-col gap-1">
                          <select 
                            value={formEdicao.marca} 
                            onChange={e => setFormEdicao({...formEdicao, marca: e.target.value})} 
                            className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs outline-none"
                          >
                            <option value="">Sem Marca</option>
                            {marcasDb.map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="NOVA">➕ CRIAR NOVA...</option>
                          </select>
                          {formEdicao.marca === 'NOVA' && (
                            <input type="text" placeholder="Nome da marca..." value={novaMarcaEdicao} onChange={e => setNovaMarcaEdicao(e.target.value.toUpperCase())} className="bg-slate-900 border border-emerald-500 text-white rounded p-1 text-xs outline-none" />
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded">{p.marca || 'N/A'}</span>
                      )}
                    </td>

                    <td className="p-4 text-white font-black">
                      {isEditando ? (
                        <input type="text" value={formEdicao.item || ''} onChange={e => setFormEdicao({...formEdicao, item: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs outline-none min-w-62.5" />
                      ) : p.item}
                    </td>

                    <td className={`p-4 text-center text-sm font-black ${isRmaItem ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {isEditando ? (
                        <input type="number" value={formEdicao.quantidade ?? ''} onChange={e => setFormEdicao({...formEdicao, quantidade: e.target.value === '' ? '' : Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-700 text-white rounded p-1 text-center text-xs outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ) : (p.quantidade || 0)}
                    </td>

                    <td className="p-4 text-right text-blue-400">
                      {isEditando ? (
                        <input type="number" value={formEdicao.valorUnitario ?? ''} onChange={e => setFormEdicao({...formEdicao, valorUnitario: e.target.value === '' ? '' : Number(e.target.value)})} className="w-20 bg-slate-900 border border-slate-700 text-white rounded p-1 text-right text-xs outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ) : formatMoney(p.valorUnitario)}
                    </td>

                    <td className={`p-4 text-right font-black ${isRmaItem ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {formatMoney((isEditando ? (Number(formEdicao.quantidade) || 0) * (Number(formEdicao.valorUnitario) || 0) : (p.valorUnitario || 0) * (p.quantidade || 0)))}
                    </td>

                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => setModalSync({ open: true, item: p })} className="text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 p-2 rounded-lg transition-colors" title="Sincronizar com a Mesa de Compras">
                        <Send size={16} />
                      </button>

                      {isEditando ? (
                        <button onClick={() => salvarEdicao(p.id)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 p-2 rounded-lg transition-colors" title="Salvar Alterações">
                          <Check size={16} />
                        </button>
                      ) : (
                        <button onClick={() => iniciarEdicao(p)} className="text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 p-2 rounded-lg transition-colors" title="Editar SKU">
                          <Edit2 size={16} />
                        </button>
                      )}
                      
                      <button onClick={() => setModalDelete({ open: true, id: p.id })} className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded-lg transition-colors" title="Excluir SKU">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* PAGINAÇÃO */}
        <div className="bg-[#0B1120] border-t border-[#1E293B] p-3 flex items-center justify-between shrink-0">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Página <span className="text-emerald-400">{paginaAtual + 1}</span> de {Math.max(totalPaginas, 1)}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPaginaAtual(p => Math.max(p - 1, 0))} disabled={paginaAtual === 0} className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded text-xs font-black uppercase hover:bg-slate-700 disabled:opacity-40">Anterior</button>
            <button onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas - 1))} disabled={paginaAtual >= totalPaginas - 1} className="bg-emerald-900 text-emerald-400 px-4 py-1.5 rounded text-xs font-black uppercase hover:bg-emerald-800 disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </div>

      {/* ==========================================================
          MODAL DELETAR SKU
      ========================================================== */}
      {modalDelete.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111A2C] border border-rose-900/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
            <h2 className="text-xl font-black text-white mb-2">Excluir SKU?</h2>
            <p className="text-slate-400 text-sm font-bold mb-6">Esta ação é permanente e removerá o item do seu estoque.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete({ open: false, id: null })} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl hover:bg-rose-500">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL SINCRONIZAR COM A MESA DE COMPRAS
      ========================================================== */}
      {modalSync.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111A2C] border border-blue-900/50 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Send size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Sincronizar Produto</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Selecione a mesa de destino.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="text-xs font-black text-slate-400 uppercase block mb-2">Mesa de Destino</label>
              <select value={mesaDestino} onChange={(e) => setMesaDestino(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 font-black text-sm cursor-pointer">
                <option value="TELAS">TELAS</option>
                <option value="BATERIAS">BATERIAS</option>
                <option value="FLEX">FLEX</option>
                <option value="COMPONENTES">COMPONENTES</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSync({ open: false, item: null })} className="flex-1 bg-transparent border border-slate-700 text-white font-black py-3 rounded-xl hover:bg-slate-800">Cancelar</button>
              <button onClick={confirmarSincronizacao} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/50">Enviar p/ Mesa</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL ADICIONAR MANUAL
      ========================================================== */}
      {modalAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#0E1525] border-b border-[#1E293B] flex justify-between items-center">
              <h2 className="text-sm font-black text-emerald-400 uppercase flex items-center gap-2"><Plus size={16} /> Cadastro Manual de SKU</h2>
              <button onClick={() => setModalAdd(false)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1E293B]/50"><X size={16} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">Descrição do Produto</label>
                <input type="text" value={formAdd.item} onChange={e => setFormAdd({...formAdd, item: e.target.value.toUpperCase()})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">SKU Fornecedor</label>
                <input type="text" value={formAdd.sku} onChange={e => setFormAdd({...formAdd, sku: e.target.value.toUpperCase()})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1" />
              </div>
              
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">Categoria</label>
                <select value={formAdd.categoria} onChange={e => setFormAdd({...formAdd, categoria: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1">
                  <option value="">Selecione...</option>
                  {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="NOVA">➕ CRIAR NOVA...</option>
                </select>
              </div>

              {formAdd.categoria === 'NOVA' && (
                <div className="col-span-2">
                  <label className="text-xs font-black text-emerald-400 uppercase">Nome da Nova Categoria</label>
                  <input type="text" value={novaCatInput} onChange={e => setNovaCatInput(e.target.value.toUpperCase())} placeholder="EX: FONE DE OUVIDO" className="w-full bg-[#0B1120] border border-emerald-500 text-white rounded-lg p-2.5 outline-none mt-1" />
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-400 uppercase">Marca</label>
                <select value={formAdd.marca} onChange={e => setFormAdd({...formAdd, marca: e.target.value.toUpperCase()})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1">
                  <option value="">Sem Marca</option>
                  {marcasDb.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="NOVA">➕ CRIAR NOVA...</option>
                </select>
              </div>

              {formAdd.marca === 'NOVA' && (
                <div className="col-span-2">
                  <label className="text-xs font-black text-emerald-400 uppercase">Nome da Nova Marca</label>
                  <input type="text" value={novaMarcaInput} onChange={e => setNovaMarcaInput(e.target.value.toUpperCase())} placeholder="EX: APPLE" className="w-full bg-[#0B1120] border border-emerald-500 text-white rounded-lg p-2.5 outline-none mt-1" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 col-span-2">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Qtd</label>
                  <input type="number" value={formAdd.quantidade} onChange={e => setFormAdd({...formAdd, quantidade: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">V. Unit (R$)</label>
                  <input type="number" value={formAdd.valorUnitario} onChange={e => setFormAdd({...formAdd, valorUnitario: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-emerald-500 mt-1 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#0E1525] border-t border-[#1E293B]">
              <button onClick={handleAddManual} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2"><Save size={18} /> SALVAR SKU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}