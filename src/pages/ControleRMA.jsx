import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronRight, ChevronLeft, AlertOctagon, Plus, X, 
  Save, BellRing, Eye, ShoppingCart, Trash2, Filter, Check, DownloadCloud 
} from 'lucide-react';
import api from '../services/api';

export default function ControleRMA() {
  const [rmas, setRmas] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Toast
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });
  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  const [filtroTabela, setFiltroTabela] = useState({ fornecedor: 'TODOS', logistica: 'TODOS', mes: 'TODOS' });
  const [filtroAberto, setFiltroAberto] = useState(null);

  const [fornecedoresGlobais] = useState(() => {
    try {
      const saved = localStorage.getItem('fornecedoresGlobais_telas');
      return saved ? JSON.parse(saved) : ['DIAMONDS', 'ZL CELL', 'ASSUGAR'];
    } catch(e) { return ['DIAMONDS', 'ZL CELL', 'ASSUGAR']; }
  });

  const [opcoesLogistica, setOpcoesLogistica] = useState(() => {
    try {
      const saved = localStorage.getItem('opcoes_logistica_rma');
      return saved ? JSON.parse(saved) : ['COLETADO', 'EM TRÂNSITO', 'AGENDAR', 'ENTREGUE'];
    } catch(e) { return ['COLETADO', 'EM TRÂNSITO', 'AGENDAR', 'ENTREGUE']; }
  });

  const mesesDoAno = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  useEffect(() => { localStorage.setItem('opcoes_logistica_rma', JSON.stringify(opcoesLogistica)); }, [opcoesLogistica]);

  // Edição Direta
  const [editando, setEditando] = useState({ id: null, campo: null });
  const [valorTemp, setValorTemp] = useState('');

  // Modais
  const [modalNovo, setModalNovo] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null); 
  
  const [novoRma, setNovoRma] = useState({
    nomeFornecedor: '', statusLogistica: 'AGENDAR', numeroPdc: '', mes: '', valorFrete: ''
  });
  
  // Itens do RMA & Busca Inteligente
  const [itensRma, setItensRma] = useState([]);
  const [pdcBusca, setPdcBusca] = useState(''); 
  const [novaPeca, setNovaPeca] = useState({ descricao: '', quantidade: 1, valorUnitario: '' });
  const [sugestoesManual, setSugestoesManual] = useState([]); 

  useEffect(() => {
    carregarRmas();
  }, [paginaAtual]);

  useEffect(() => {
    const handleClickFora = () => setFiltroAberto(null);
    if (filtroAberto) window.addEventListener('click', handleClickFora);
    return () => window.removeEventListener('click', handleClickFora);
  }, [filtroAberto]);

  const carregarRmas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/rma?page=${paginaAtual}&size=15&_t=${Date.now()}`);
      const dadosExtraidos = response.data?.content || (Array.isArray(response.data) ? response.data : []);
      setRmas(dadosExtraidos);
      const infoPagina = response.data?.page || response.data || {};
      setTotalPaginas(infoPagina.totalPages || 0);
      setTotalRegistros(infoPagina.totalElements || dadosExtraidos.length);
    } catch (err) {
      setRmas([]);
    } finally {
      setLoading(false);
    }
  };

  const salvarEdicao = async (id, campo) => {
    try {
      let valorFinal = valorTemp;
      if (campo.includes('valor')) {
         valorFinal = Number(String(valorTemp).replace(',', '.')) || 0;
      } else if (campo === 'numeroPdc') {
         valorFinal = String(valorTemp).toUpperCase();
      }
      
      if (campo.includes('data') && !valorFinal) {
         valorFinal = ''; 
      }

      setRmas(rmas.map(r => r.id === id ? { ...r, [campo]: valorFinal } : r));
      setEditando({ id: null, campo: null });

      await api.post(`/rma/${id}/atualizar`, { [campo]: valorFinal });
      mostrarToast("Alteração salva com sucesso!");
    } catch (e) {
      mostrarToast("Erro ao salvar.", "erro");
    }
  };

  const handleLogisticaChange = async (id, valor) => {
    if (valor === 'CRIAR_NOVO') {
      const novoStatus = prompt(`Digite o novo status de logística:`);
      if (novoStatus && String(novoStatus).trim() !== '') {
        const uppercaseStatus = String(novoStatus).trim().toUpperCase();
        setOpcoesLogistica([...opcoesLogistica, uppercaseStatus]);
        valor = uppercaseStatus;
      } else return; 
    }
    setRmas(rmas.map(r => r.id === id ? { ...r, statusLogistica: valor } : r));
    try { await api.post(`/rma/${id}/atualizar`, { statusLogistica: valor }); } catch (e) {}
  };

  const handleMesChange = async (id, valor) => {
    setRmas(rmas.map(r => r.id === id ? { ...r, mes: valor } : r));
    try { await api.post(`/rma/${id}/atualizar`, { mes: valor }); } catch (e) {}
  };

  const confirmarExclusao = async () => {
    if(!modalExcluir) return;
    try {
      await api.delete(`/rma/${modalExcluir}`);
      setModalExcluir(null);
      carregarRmas();
      mostrarToast("RMA excluído permanentemente!");
    } catch(e) {
      mostrarToast("Erro ao excluir RMA.", "erro");
    }
  };

  // =========================================================================
  // 🔥 MÁGICA 1: BLINDAGEM DUPLA NA BUSCA DO PDC
  // =========================================================================
  const puxarItensDoPdc = async () => {
    if(!pdcBusca) return mostrarToast("Digite o PDC de busca original!", "erro");
    
    const numeroBuscado = String(pdcBusca).trim().toUpperCase();

    // Função interna para montar as peças na tela
    const processarPedido = (pedidoOriginal) => {
       if(!pedidoOriginal || !pedidoOriginal.itens) return mostrarToast("Nenhuma peça encontrada nesse PDC.", "erro");

       const itensValidos = pedidoOriginal.itens.filter(i => !i.naoVem).map(i => {
         const qtd = i.quantidadePedida || i.quantidade || 1;
         const vUnit = i.valorUnitario || 0;
         return {
           descricaoLimpa: i.descricaoLimpa || i.descricao,
           quantidadePedida: qtd, 
           valorUnitario: vUnit,
           subtotal: qtd * vUnit
         };
       });

       if(itensValidos.length === 0) {
         return mostrarToast("Todos os itens deste PDC faltaram na compra original.", "erro");
       }

       setNovoRma({ 
         ...novoRma, 
         nomeFornecedor: pedidoOriginal.nomeFornecedor || '', 
         mes: pedidoOriginal.mes || ''
       });
       setItensRma([...itensRma, ...itensValidos]);
       setPdcBusca('');
       mostrarToast("Peças importadas! Ajuste as quantidades se necessário.");
    };

    try {
      // 1ª Tentativa: Rota direta
      const res = await api.get(`/pedidos/busca-pdc/${encodeURIComponent(numeroBuscado)}`);
      processarPedido(res.data);
    } catch(e) { 
      // 🔥 2ª Tentativa (PLANO B): Baixa a lista geral e procura no Front-end!
      try {
         const fallbackRes = await api.get(`/pedidos?size=5000`);
         const listaGeral = fallbackRes.data?.content || fallbackRes.data || [];
         const pedidoEncontrado = listaGeral.find(p => String(p.numeroPdc).trim().toUpperCase() === numeroBuscado);
         
         if (pedidoEncontrado) {
             processarPedido(pedidoEncontrado);
         } else {
             mostrarToast(`PDC ${numeroBuscado} não localizado no banco.`, "erro"); 
         }
      } catch (errFallback) {
         mostrarToast("Erro de comunicação com o servidor.", "erro"); 
      }
    }
  };

  // =========================================================================
  // 🔥 MÁGICA 2: BUSCA MANUAL CONECTADA DIRETO À MESA DE COMPRAS
  // =========================================================================
  const pesquisarItemManual = async (termo) => {
    setNovaPeca({ ...novaPeca, descricao: termo });
    if(termo.length < 2) { setSugestoesManual([]); return; }
    
    try {
      // Bate direto na Mesa de Compras (Acha códigos como ZL, ASSUGAR perfeitamente)
      const res = await api.get(`/mesacompras/TELAS?busca=${encodeURIComponent(termo)}`);
      setSugestoesManual(res.data?.content || []);
    } catch(e) { setSugestoesManual([]); }
  };

  const selecionarItemBusca = (produto) => {
    setNovaPeca({
      descricao: produto.descricaoLimpa || produto.item,
      quantidade: 1,
      valorUnitario: produto.valorUnitarioDecidido > 0 ? produto.valorUnitarioDecidido : 0
    });
    setSugestoesManual([]);
  };

  const handleAddPeca = () => {
    if (!novaPeca.descricao || novaPeca.quantidade <= 0) return mostrarToast("Preencha o nome e quantidade", "erro");
    
    const preco = Number(String(novaPeca.valorUnitario).replace(',', '.')) || 0;
    const qtd = Number(novaPeca.quantidade);

    setItensRma([...itensRma, {
      descricaoLimpa: novaPeca.descricao.toUpperCase(),
      quantidadePedida: qtd,
      valorUnitario: preco,
      subtotal: preco * qtd
    }]);

    setNovaPeca({ descricao: '', quantidade: 1, valorUnitario: '' });
  };

  const handleSalvarNovoRma = async () => {
    if (!novoRma.nomeFornecedor) return mostrarToast("Selecione um Fornecedor!", "erro");
    
    const valorTotalItens = itensRma.reduce((acc, curr) => acc + curr.subtotal, 0);

    try {
      const payload = {
        ...novoRma,
        valorFrete: Number(String(novoRma.valorFrete).replace(',', '.')) || 0,
        valorTotalPedido: valorTotalItens, 
        itens: itensRma
      };

      await api.post('/rma', payload);
      mostrarToast("RMA criado com sucesso!");
      setModalNovo(false);
      
      setNovoRma({ nomeFornecedor: '', statusLogistica: 'AGENDAR', numeroPdc: '', mes: '', valorFrete: '' });
      setItensRma([]);
      carregarRmas(); 
    } catch (e) {
      mostrarToast("Erro de conexão ao salvar RMA.", "erro");
    }
  };

  const rmasFiltrados = rmas.filter(r => {
    if(!r) return false;
    const termo = busca.toLowerCase();
    const matchBusca = String(r.numeroPdc || '').toLowerCase().includes(termo) || String(r.nomeFornecedor || '').toLowerCase().includes(termo);
    const matchForn = filtroTabela.fornecedor === 'TODOS' || String(r.nomeFornecedor).toUpperCase() === filtroTabela.fornecedor;
    const matchLog = filtroTabela.logistica === 'TODOS' || r.statusLogistica === filtroTabela.logistica;
    const matchMes = filtroTabela.mes === 'TODOS' || r.mes === filtroTabela.mes;
    return matchBusca && matchForn && matchLog && matchMes;
  });

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatarDataInput = (dataIso) => {
    if (!dataIso) return '';
    return dataIso.split('T')[0]; 
  };

  const obterMesValido = (mesDoBanco) => {
    if (!mesDoBanco) return '';
    const upper = String(mesDoBanco).toUpperCase();
    return mesesDoAno.includes(upper) ? upper : '';
  };

  const fornecedoresUnicos = [...new Set(rmas.map(r => String(r.nomeFornecedor).toUpperCase()))];

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200 relative">
      
      {toast.visivel && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-200 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <AlertOctagon className="text-red-500" size={32} /> CONTROLE DE RMA <span className="text-slate-500">(GARANTIAS)</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 ml-11">
            Gestão de coletas, devoluções e trocas com fornecedores.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setModalNovo(true)} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-red-900/40 transition-all shrink-0">
            <Plus size={16} /> NOVO RMA
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">
          Registros de RMA ({totalRegistros})
        </h3>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input type="text" placeholder="Buscar por Fornecedor ou PDC..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#111A2C] border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500" />
        </div>
      </div>

      {/* TABELA PRINCIPAL DE RMA */}
      <div className="flex-1 bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#0E1525] text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="p-4 text-center">Ordem</th>
                
                {/* 🔥 FILTROS FLUTUANTES ESTILO EXCEL */}
                <th className="p-4 relative">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'fornecedor' ? null : 'fornecedor'); }}>
                    Fornecedor <Filter size={12} className={filtroTabela.fornecedor !== 'TODOS' ? 'text-rose-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'fornecedor' && (
                    <div className="absolute top-full left-4 mt-1 bg-[#0B1120] border border-rose-900 rounded-xl shadow-2xl py-2 z-50 min-w-45">
                      <div onClick={() => setFiltroTabela({...filtroTabela, fornecedor: 'TODOS'})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300">TODOS</div>
                      {fornecedoresUnicos.map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, fornecedor: f})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center relative">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'logistica' ? null : 'logistica'); }}>
                    Logística <Filter size={12} className={filtroTabela.logistica !== 'TODOS' ? 'text-rose-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'logistica' && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#0B1120] border border-rose-900 rounded-xl shadow-2xl py-2 z-50 min-w-37.5">
                      <div onClick={() => setFiltroTabela({...filtroTabela, logistica: 'TODOS'})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 text-left">TODOS</div>
                      {opcoesLogistica.map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, logistica: f})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase text-left">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center text-blue-400">PDC do RMA (D.Click)</th>
                
                <th className="p-4 text-center relative">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'mes' ? null : 'mes'); }}>
                    Mês <Filter size={12} className={filtroTabela.mes !== 'TODOS' ? 'text-rose-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'mes' && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#0B1120] border border-rose-900 rounded-xl shadow-2xl py-2 z-50 min-w-37.5 max-h-48 overflow-y-auto custom-scrollbar">
                      <div onClick={() => setFiltroTabela({...filtroTabela, mes: 'TODOS'})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 text-left">TODOS</div>
                      {mesesDoAno.map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, mes: f})} className="px-4 py-2 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase text-left">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center text-emerald-500">Dt. Envio (D.Click)</th>
                <th className="p-4 text-center text-fuchsia-500">Dt. Chegada (D.Click)</th>
                <th className="p-4 text-right text-emerald-400">V. RMA (D.Click)</th>
                <th className="p-4 text-right text-amber-500">Frete (D.Click)</th>
                <th className="p-4 text-left text-orange-400">Obs (D.Click)</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-[11px] font-bold">
              {loading ? (
                <tr><td colSpan="11" className="p-12 text-center text-rose-500">Carregando RMAs...</td></tr>
              ) : rmasFiltrados.length === 0 ? (
                <tr><td colSpan="11" className="p-12 text-center text-slate-500 uppercase tracking-widest font-black">NENHUM REGISTRO LOCALIZADO</td></tr>
              ) : (
                rmasFiltrados.map((rma) => {
                   return (
                    <tr key={rma.id} className="hover:bg-[#1E293B]/40 transition-colors">
                      <td className="p-4 text-center text-slate-500 font-black">#{rma.ordem || '-'}</td>
                      <td className="p-4 text-white uppercase">{rma.nomeFornecedor}</td>
                      
                      <td className="p-4 text-center">
                        <select value={rma.statusLogistica || ''} onChange={(e) => handleLogisticaChange(rma.id, e.target.value)} className="bg-[#0B1120] border border-blue-900 text-blue-400 font-black text-[10px] uppercase rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-blue-500">
                          <option value="" disabled>Status...</option>
                          {opcoesLogistica.map(opt => <option className="bg-[#0E1525] text-white" key={opt} value={opt}>{opt}</option>)}
                          <option className="bg-blue-900 text-white font-black" value="CRIAR_NOVO">➕ CRIAR NOVO...</option>
                        </select>
                      </td>

                      <td className="p-4 text-center font-black text-blue-400 cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'numeroPdc'}); setValorTemp(rma.numeroPdc || '');}}>
                        {editando.id === rma.id && editando.campo === 'numeroPdc' ? (
                          <div className="flex gap-2 justify-center items-center">
                            <input type="text" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value.toUpperCase())} onKeyDown={e => {if(e.key === 'Enter') salvarEdicao(rma.id, 'numeroPdc')}} className="w-20 bg-[#0B1120] text-blue-400 border border-blue-500/50 rounded p-1 text-center outline-none uppercase" />
                            <button onClick={(e) => { e.stopPropagation(); salvarEdicao(rma.id, 'numeroPdc'); }} className="text-emerald-500 hover:text-emerald-400"><Check size={16}/></button>
                          </div>
                        ) : (
                          <span className="font-black text-blue-400 text-sm">{rma.numeroPdc || '-'}</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {(!rma.mes || String(rma.mes).trim() === '') ? (
                          <select onChange={(e) => handleMesChange(rma.id, e.target.value)} className="bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white px-2 py-1 rounded-md text-[10px] uppercase font-black transition-all cursor-pointer outline-none appearance-none text-center">
                            <option value="" disabled>S / MÊS</option>
                            {mesesDoAno.map(m => <option className="bg-[#0B1120] text-slate-300" key={m} value={m}>{m}</option>)}
                          </select>
                        ) : (
                          <select value={obterMesValido(rma.mes)} onChange={(e) => handleMesChange(rma.id, e.target.value)} className="bg-transparent text-slate-300 font-black text-xs uppercase outline-none cursor-pointer text-center appearance-none hover:bg-slate-800 rounded px-2 py-1">
                             {mesesDoAno.map(m => <option className="bg-[#0B1120]" key={m} value={m}>{m}</option>)}
                          </select>
                        )}
                      </td>

                      <td className="p-4 text-center text-slate-300 cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'dataPedido'}); setValorTemp(formatarDataInput(rma.dataPedido));}}>
                        {editando.id === rma.id && editando.campo === 'dataPedido' ? (
                          <div className="flex items-center gap-1"><input type="date" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value)} className="bg-[#0B1120] text-emerald-400 p-1 rounded outline-none border border-emerald-500/50" /><button onClick={() => salvarEdicao(rma.id, 'dataPedido')} className="text-emerald-500"><Check size={14}/></button></div>
                        ) : (rma.dataPedido ? new Date(rma.dataPedido).toLocaleDateString('pt-BR') : '-')}
                      </td>

                      <td className="p-4 text-center text-slate-300 cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'dataChegada'}); setValorTemp(formatarDataInput(rma.dataChegada));}}>
                        {editando.id === rma.id && editando.campo === 'dataChegada' ? (
                          <div className="flex items-center gap-1"><input type="date" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value)} className="bg-[#0B1120] text-fuchsia-400 p-1 rounded outline-none border border-fuchsia-500/50" /><button onClick={() => salvarEdicao(rma.id, 'dataChegada')} className="text-emerald-500"><Check size={14}/></button></div>
                        ) : (rma.dataChegada ? new Date(rma.dataChegada).toLocaleDateString('pt-BR') : '-')}
                      </td>

                      {/* VALORES SEM SETINHAS */}
                      <td className="p-4 text-right text-emerald-400 font-black cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'valorTotalPedido'}); setValorTemp(rma.valorTotalPedido || '');}}>
                        {editando.id === rma.id && editando.campo === 'valorTotalPedido' ? (
                          <div className="flex gap-2 justify-end items-center">
                            <input type="number" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value)} onKeyDown={e => {if(e.key === 'Enter') salvarEdicao(rma.id, 'valorTotalPedido')}} className="w-20 bg-[#0B1120] text-emerald-400 border border-emerald-500/50 rounded p-1 text-right outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={(e) => { e.stopPropagation(); salvarEdicao(rma.id, 'valorTotalPedido'); }} className="text-emerald-500 hover:text-emerald-400"><Check size={16}/></button>
                          </div>
                        ) : formatMoney(rma.valorTotalPedido)}
                      </td>

                      <td className="p-4 text-right text-amber-400 font-black cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'valorFrete'}); setValorTemp(rma.valorFrete || '');}}>
                        {editando.id === rma.id && editando.campo === 'valorFrete' ? (
                          <div className="flex gap-2 justify-end items-center">
                            <input type="number" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value)} onKeyDown={e => {if(e.key === 'Enter') salvarEdicao(rma.id, 'valorFrete')}} className="w-16 bg-[#0B1120] text-amber-400 border border-amber-500/50 rounded p-1 text-right outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={(e) => { e.stopPropagation(); salvarEdicao(rma.id, 'valorFrete'); }} className="text-emerald-500 hover:text-emerald-400"><Check size={16}/></button>
                          </div>
                        ) : formatMoney(rma.valorFrete)}
                      </td>

                      <td className="p-4 text-left text-orange-400 max-w-37.5 truncate cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => {setEditando({id: rma.id, campo: 'obs'}); setValorTemp(rma.obs || '');}}>
                        {editando.id === rma.id && editando.campo === 'obs' ? (
                          <div className="flex gap-2 items-center">
                            <input type="text" autoFocus value={valorTemp} onChange={e => setValorTemp(e.target.value)} onKeyDown={e => {if(e.key === 'Enter') salvarEdicao(rma.id, 'obs')}} className="w-full bg-[#0B1120] text-orange-400 border border-orange-500/50 rounded p-1 text-left outline-none" />
                            <button onClick={(e) => { e.stopPropagation(); salvarEdicao(rma.id, 'obs'); }} className="text-emerald-500 hover:text-emerald-400"><Check size={16}/></button>
                          </div>
                        ) : (rma.obs || '-')}
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setModalDetalhes(rma)} className="bg-red-900/40 border border-red-900 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5">
                            <Eye size={14} /> PEÇAS
                          </button>
                          <button onClick={() => setModalExcluir(rma.id)} className="bg-rose-900/20 border border-rose-900/50 hover:bg-rose-600 text-rose-500 hover:text-white p-1.5 rounded-lg transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="bg-[#111A2C] border-t border-[#1E293B] p-4 flex items-center justify-between mt-auto shrink-0">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Página <span className="text-red-400">{paginaAtual + 1}</span> de {Math.max(totalPaginas, 1)}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 0))} disabled={paginaAtual === 0} className="p-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas - 1))} disabled={paginaAtual >= totalPaginas - 1 || totalPaginas <= 1} className="p-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalExcluir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#0E1525] border border-rose-900 rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.15)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Excluir RMA?</h2>
              <p className="text-sm text-slate-400 font-bold mb-6">
                Tem certeza que deseja excluir este RMA? Esta ação <span className="text-rose-400">não pode ser desfeita</span>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalExcluir(null)} className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-white font-black py-3 rounded-xl transition-colors">
                  CANCELAR
                </button>
                <button onClick={confirmarExclusao} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-rose-900/50">
                  SIM, EXCLUIR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL CADASTRAR NOVO RMA COM PEÇAS
      ====================================================================== */}
      {modalNovo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-red-900/50 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111A2C]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><AlertOctagon size={20} /></div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Lançar Novo RMA (Garantia)</h2>
              </div>
              <button onClick={() => setModalNovo(false)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-auto flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/3 border-r border-slate-800 p-5 flex flex-col gap-4 bg-[#0B1120]">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Fornecedor</label>
                  <select value={novoRma.nomeFornecedor} onChange={e => setNovoRma({...novoRma, nomeFornecedor: e.target.value})} className="w-full bg-[#111A2C] border border-slate-700 text-white rounded-xl p-3 text-sm font-black outline-none focus:border-red-500 cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {fornecedoresGlobais.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-rose-400 uppercase mb-1.5 block">Nº PDC do RMA (Registro Final)</label>
                  <input type="text" value={novoRma.numeroPdc} onChange={e => setNovoRma({...novoRma, numeroPdc: e.target.value})} placeholder="Ex: RMA-001" className="w-full bg-[#111A2C] border border-slate-700 text-rose-400 rounded-xl p-3 text-sm font-black outline-none focus:border-rose-500 uppercase" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Mês Referência</label>
                  <select value={novoRma.mes} onChange={e => setNovoRma({...novoRma, mes: e.target.value})} className="w-full bg-[#111A2C] border border-slate-700 text-white rounded-xl p-3 text-sm font-black outline-none focus:border-red-500 cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {mesesDoAno.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Custo de Frete (R$)</label>
                  <input type="number" value={novoRma.valorFrete} onChange={e => setNovoRma({...novoRma, valorFrete: e.target.value})} placeholder="0.00" className="w-full bg-[#111A2C] border border-slate-700 text-amber-400 rounded-xl p-3 text-sm font-black outline-none focus:border-amber-500 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <div className="flex-1 p-5 flex flex-col bg-[#0E1525]">
                
                {/* CAIXA DE PUXAR ITENS PELO PDC ORIGINAL */}
                <div className="bg-[#111A2C] p-4 rounded-xl border border-blue-900/50 mb-5 shadow-inner">
                  <label className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-1"><DownloadCloud size={14}/> Puxar Itens do Pedido Original</label>
                  <div className="flex gap-2">
                    <input type="text" value={pdcBusca} onChange={e => setPdcBusca(e.target.value)} placeholder="Digite o Nº do PDC Original da Compra..." className="flex-1 bg-[#0B1120] border border-slate-700 text-blue-300 rounded-lg p-2.5 text-xs font-black outline-none focus:border-blue-500 uppercase" />
                    <button onClick={puxarItensDoPdc} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-colors shadow-lg shadow-blue-900/30">Puxar Peças</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="text-slate-500" size={18} />
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Adicionar Manualmente</h3>
                </div>

                {/* BUSCA MANUAL NA MESA DE COMPRAS */}
                <div className="flex gap-2 mb-6">
                  <div className="flex-1 relative">
                    <input type="text" value={novaPeca.descricao} onChange={e => pesquisarItemManual(e.target.value)} placeholder="Buscar Código ou Nome na Mesa..." className="w-full bg-[#111A2C] border border-slate-700 text-cyan-300 rounded-xl p-3 text-xs font-black outline-none focus:border-cyan-500 transition-colors" />
                    {sugestoesManual.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-[#0B1120] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {sugestoesManual.map(s => (
                          <div key={s.id} onClick={() => selecionarItemBusca(s)} className="p-3 border-b border-slate-800 hover:bg-[#1E293B] cursor-pointer transition-colors flex justify-between items-center">
                            <span className="text-[11px] font-black text-white">{s.descricaoLimpa || s.item}</span>
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-900/20 px-2 py-1 rounded">Custo: {formatMoney(s.valorUnitarioDecidido > 0 ? s.valorUnitarioDecidido : 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="number" min="1" value={novaPeca.quantidade} onChange={e => setNovaPeca({...novaPeca, quantidade: e.target.value})} placeholder="Qtd" className="w-16 bg-[#111A2C] border border-slate-700 text-emerald-400 rounded-xl p-3 text-center text-xs font-black outline-none focus:border-emerald-500 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <input type="number" value={novaPeca.valorUnitario} onChange={e => setNovaPeca({...novaPeca, valorUnitario: e.target.value})} placeholder="V. Unit" className="w-24 bg-[#111A2C] border border-slate-700 text-emerald-400 rounded-xl p-3 text-right text-xs font-black outline-none focus:border-emerald-500 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <button onClick={handleAddPeca} className="bg-cyan-600 hover:bg-cyan-500 text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-cyan-900/30"><Plus size={18} /></button>
                </div>

                <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-[#0B1120]">
                  {itensRma.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-xs font-bold px-6 text-center">
                      Utilize o botão acima para puxar os itens do PDC original, ou busque as peças manualmente.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#111A2C] text-slate-500 border-b border-slate-800">
                        <tr><th className="p-3">Produto</th><th className="p-3 text-center">Qtd</th><th className="p-3 text-right">Unitário</th><th className="p-3 text-right">Subtotal</th><th className="p-3"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {itensRma.map((it, idx) => (
                          <tr key={idx} className="text-slate-300 font-bold hover:bg-slate-800/30">
                            <td className="p-3 text-cyan-400">{it.descricaoLimpa}</td>
                            <td className="p-3 text-center text-emerald-400">{it.quantidadePedida}</td>
                            <td className="p-3 text-right">{formatMoney(it.valorUnitario)}</td>
                            <td className="p-3 text-right text-emerald-500">{formatMoney(it.subtotal)}</td>
                            <td className="p-3 text-center"><button onClick={() => {
                              const novaLista = [...itensRma];
                              novaLista.splice(idx, 1);
                              setItensRma(novaLista);
                            }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm font-black bg-[#111A2C] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 uppercase">Soma das Peças:</span>
                  <span className="text-emerald-400 text-lg">{formatMoney(itensRma.reduce((acc, curr) => acc + curr.subtotal, 0))}</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-[#111A2C]">
              <button onClick={() => setModalNovo(false)} className="bg-transparent text-slate-400 hover:text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-colors">Cancelar</button>
              <button onClick={handleSalvarNovoRma} className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors shadow-lg shadow-red-900/50">
                <Save size={16}/> Salvar Garantia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES (VISUALIZAR PEÇAS) */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-red-900/50 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.15)] w-full max-w-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111A2C]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><Eye size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Peças da Garantia</h2>
                  <p className="text-xs text-slate-400">{modalDetalhes.nomeFornecedor} - PDC: {modalDetalhes.numeroPdc || 'S/N'}</p>
                </div>
              </div>
              <button onClick={() => setModalDetalhes(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 bg-[#0B1120] max-h-[60vh] overflow-y-auto">
              {!modalDetalhes.itens || modalDetalhes.itens.length === 0 ? (
                <div className="text-center text-slate-500 font-bold py-10">Nenhuma peça foi registrada neste RMA.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-slate-800 text-slate-500 uppercase">
                    <tr><th className="pb-3">Descrição da Peça</th><th className="pb-3 text-center">Qtd</th><th className="pb-3 text-right">V. Unitário</th><th className="pb-3 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {modalDetalhes.itens.map((it, idx) => (
                      <tr key={idx} className="text-slate-300 font-bold hover:bg-slate-800/30">
                        <td className="py-4 text-cyan-400">{it.descricaoLimpa}</td>
                        <td className="py-4 text-center text-emerald-400">{it.quantidadePedida || it.quantidade}</td>
                        <td className="py-4 text-right">{formatMoney(it.valorUnitario)}</td>
                        <td className="py-4 text-right text-emerald-400 font-black">{formatMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}