import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, Users, Target, TrendingUp, Trophy, Package, Star, Save, Loader2, 
  ArrowLeft, BarChart2, Medal, Rocket, Search, Calendar, X, BellRing, Trash2, AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function AcompanhamentoVendedores() {
  const [historicoSalvo, setHistoricoSalvo] = useState([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(''); 

  const [vendedoresUpload, setVendedoresUpload] = useState([]);
  const [metas, setMetas] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  const [vendedorVisualizado, setVendedorVisualizado] = useState(null);
  const fileInputRef = useRef(null);

  // Estados do Modal de Salvar
  const [modalSalvarAtivo, setModalSalvarAtivo] = useState(false);
  const [mesParaSalvar, setMesParaSalvar] = useState('');
  const [anoParaSalvar, setAnoParaSalvar] = useState(new Date().getFullYear());
  
  // 🔥 ESTADOS DO NOVO MODAL DE EXCLUSÃO
  const [modalExcluirAtivo, setModalExcluirAtivo] = useState(false);
  const [vendedorParaExcluir, setVendedorParaExcluir] = useState({ id: null, nome: '' });
  const [excluindo, setExcluindo] = useState(false);

  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const mesesDoAno = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  useEffect(() => {
    carregarHistorico();
    setMesParaSalvar(mesesDoAno[new Date().getMonth()]);
  }, []);

  const carregarHistorico = async () => {
    try {
      const res = await api.get('/vendedores/historico');
      const dados = res.data || [];
      
      dados.sort((a, b) => b.id ? b.id.localeCompare(a.id) : 0);
      setHistoricoSalvo(dados);
      
      const mesesSet = new Set(dados.map(d => d.mesReferencia));
      const mesesUnicos = Array.from(mesesSet);
      
      setMesesDisponiveis(mesesUnicos);

      if (mesesUnicos.length > 0) {
        setMesSelecionado(mesesUnicos[0]);
      } else {
        setMesSelecionado('ATUAL');
      }
    } catch(e) {}
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/vendedores/processar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setVendedoresUpload(res.data);
      setMesSelecionado('ATUAL'); 
      setVendedorVisualizado(null); 
      
      const novasMetas = { ...metas };
      res.data.forEach(v => { if(!novasMetas[v.vendedor]) novasMetas[v.vendedor] = 50000; });
      setMetas(novasMetas);
      mostrarToast("Dados da equipe processados com sucesso!");
    } catch (e) {
      mostrarToast("Erro ao processar planilha de vendas.", "erro");
    } finally {
      setLoading(false);
      event.target.value = null; 
    }
  };

  const handleConfirmarSalvarGeral = async () => {
    setSalvando(true);
    const mesFormatado = `${mesParaSalvar}/${anoParaSalvar}`;

    try {
      await Promise.all(vendedoresUpload.map(v => {
        const payload = {
          mesReferencia: mesFormatado,
          vendedor: v.vendedor,
          faturamento: v.faturamento,
          meta: metas[v.vendedor] || 0,
          quantidadeItens: v.quantidadeItens,
          top10Clientes: v.top10Clientes,
          top20Itens: v.top20Itens
        };
        return api.post('/vendedores/salvar', payload);
      }));

      mostrarToast(`Ranking de ${mesFormatado} salvo/atualizado com sucesso!`);
      setModalSalvarAtivo(false);
      setVendedoresUpload([]);
      carregarHistorico();
    } catch(e) {
      mostrarToast("Erro ao salvar resultado.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEdicaoVendedor = async (v) => {
    try {
      const payload = {
        ...v,
        meta: metas[v.vendedor] || v.meta
      };
      await api.post('/vendedores/salvar', payload);
      mostrarToast(`Meta de ${v.vendedor.split(' ')[0]} atualizada!`);
      carregarHistorico();
    } catch(e) {
      mostrarToast("Erro ao atualizar meta.", "erro");
    }
  };

  // 🔥 CHAMA O NOVO MODAL DE EXCLUSÃO
  const handleAbrirExclusao = (id, nome) => {
    setVendedorParaExcluir({ id, nome });
    setModalExcluirAtivo(true);
  };

  // 🔥 LÓGICA DE EXCLUSÃO DEFINITIVA
  const handleConfirmarExclusao = async () => {
    if (!vendedorParaExcluir.id) return;
    setExcluindo(true);
    try {
      await api.delete(`/vendedores/${vendedorParaExcluir.id}`);
      mostrarToast(`Resultado de ${vendedorParaExcluir.nome.split(' ')[0]} excluído com sucesso!`);
      carregarHistorico();
      setModalExcluirAtivo(false);
    } catch (e) {
      mostrarToast("Erro ao excluir vendedor.", "erro");
    } finally {
      setExcluindo(false);
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleMetaChange = (vendedorNome, valorDigitado) => {
    const apenasNumeros = valorDigitado.replace(/\D/g, '');
    if (!apenasNumeros) {
      setMetas({...metas, [vendedorNome]: 0});
      return;
    }
    const valorReal = Number(apenasNumeros) / 100;
    setMetas({...metas, [vendedorNome]: valorReal});
  };

  const getDiasRestantes = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    let diasRestantes = 0;
    
    for (let d = hoje.getDate() + 1; d <= ultimoDia; d++) {
      const dataFutura = new Date(ano, mes, d);
      if (dataFutura.getDay() !== 0) diasRestantes++; 
    }
    return diasRestantes;
  };

  let dadosExibicao = [];
  if (mesSelecionado === 'ATUAL') {
    dadosExibicao = [...vendedoresUpload];
  } else {
    dadosExibicao = historicoSalvo.filter(h => h.mesReferencia === mesSelecionado);
    dadosExibicao.forEach(v => {
      if (metas[v.vendedor] === undefined) {
        metas[v.vendedor] = v.meta || 0;
      }
    });
  }

  dadosExibicao.sort((a, b) => b.faturamento - a.faturamento);

  const renderRanking = () => {
    if (mesSelecionado === 'ATUAL' && dadosExibicao.length === 0) {
      return (
        <div className="flex-1 border-2 border-dashed border-cyan-900/50 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#0E1525] p-6 text-center shadow-inner">
          <div className="p-4 bg-cyan-900/20 rounded-full text-cyan-500 mb-2">
             <Target size={48} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Área de Triagem da Equipe</h2>
          <p className="font-bold text-slate-400 max-w-lg leading-relaxed">
            Faça o upload do relatório da equipe para iniciar a triagem. Aqui você poderá definir as <strong className="text-cyan-400">Metas Individuais</strong> de cada vendedor antes de salvar e consolidar o ranking do mês.
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0">
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={18}/> Ranking de Performance {mesSelecionado !== 'ATUAL' && <span className="text-slate-500">- {mesSelecionado}</span>}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="flex flex-col gap-4">
            {dadosExibicao.map((v, index) => {
              const metaState = metas[v.vendedor] !== undefined ? metas[v.vendedor] : (v.meta || 0);
              const metaFormatada = metaState === 0 ? '' : metaState.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              
              const pct = Math.min(100, metaState > 0 ? (v.faturamento / metaState) * 100 : 0);
              
              let corMedalha = "bg-slate-800 text-slate-500 border-slate-700";
              if(index === 0) corMedalha = "bg-amber-900/40 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
              if(index === 1) corMedalha = "bg-slate-700 text-slate-300 border-slate-400/50 shadow-[0_0_15px_rgba(148,163,184,0.3)]";
              if(index === 2) corMedalha = "bg-orange-900/40 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]";

              return (
                <div key={index} className="flex flex-col xl:flex-row items-center gap-4 lg:gap-6 bg-[#0B1120] border border-slate-800 p-5 rounded-2xl hover:border-cyan-900/50 transition-colors relative overflow-hidden group">
                  {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,1)]"></div>}

                  {/* IDENTIFICAÇÃO DO VENDEDOR */}
                  <div className="flex items-center gap-4 w-full xl:w-1/4 shrink-0">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-black text-lg shrink-0 ${corMedalha}`}>
                      {index + 1}º
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base lg:text-lg font-black text-white uppercase truncate pr-2">{v.vendedor}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{v.quantidadeItens} Itens Vendidos</p>
                    </div>
                  </div>

                  {/* FATURAMENTO E META */}
                  <div className="flex-1 w-full flex flex-col xl:flex-row items-center gap-4 lg:gap-6">
                    <div className="w-full xl:w-1/3">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Faturamento Bruto</p>
                      <h2 className="text-xl lg:text-2xl font-black text-white">{formatMoney(v.faturamento)}</h2>
                    </div>

                    <div className="flex-1 w-full bg-[#111A2C] rounded-xl p-3 border border-slate-800 relative shadow-inner">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-fuchsia-400"/>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Meta:</span>
                          
                          <div className="flex items-center bg-[#0B1120] border border-fuchsia-900/50 rounded-lg px-2 py-1 shadow-inner focus-within:border-fuchsia-500 transition-colors">
                             <span className="text-fuchsia-500 font-black text-sm mr-1">R$</span>
                             <input 
                               type="text" 
                               value={metaFormatada} 
                               onChange={(e) => handleMetaChange(v.vendedor, e.target.value)}
                               className="bg-transparent text-fuchsia-400 text-sm font-black w-24 md:w-32 outline-none placeholder-slate-600"
                               placeholder="0,00"
                             />
                          </div>
                        </div>
                        <span className="text-sm font-black text-white">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#0B1120] rounded-full h-3 overflow-hidden border border-slate-800 relative">
                         <div 
                           className="h-full bg-linear-to-r from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] transition-all duration-1000 ease-out relative flex items-center" 
                           style={{ width: `${pct}%` }}
                         >
                           <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTÕES DE AÇÃO FIXOS */}
                  <div className="w-full xl:w-auto shrink-0 flex items-center justify-end gap-2">
                    {mesSelecionado !== 'ATUAL' && (
                      <>
                        <button 
                          onClick={() => handleSalvarEdicaoVendedor(v)} 
                          disabled={metaState === v.meta} 
                          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${metaState !== v.meta ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600 hover:text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'}`} 
                          title="Salvar Nova Meta"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={() => handleAbrirExclusao(v.id, v.vendedor)} 
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-900/10 border border-rose-800/50 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors" 
                          title="Excluir Vendedor do Histórico"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setVendedorVisualizado(v)} className="bg-cyan-900/30 border border-cyan-700/50 text-cyan-400 hover:bg-cyan-600 hover:text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md h-10">
                      <Search size={16}/> Raio-X
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderRaioX = () => {
    const v = vendedorVisualizado;
    const metaAplicada = metas[v.vendedor] !== undefined ? metas[v.vendedor] : (v.meta || 0);
    const pct = Math.min(100, metaAplicada > 0 ? (v.faturamento / metaAplicada) * 100 : 0);
    const faltaParaMeta = Math.max(0, metaAplicada - v.faturamento);
    
    const mesAtualCalendario = mesesDoAno[new Date().getMonth()];
    const isMesAtivoReal = mesSelecionado === 'ATUAL' || mesSelecionado.includes(mesAtualCalendario);

    const diasRestantes = getDiasRestantes();
    let metaDiaria = 0;
    if (isMesAtivoReal && diasRestantes > 0 && faltaParaMeta > 0) {
      metaDiaria = (faltaParaMeta / diasRestantes) * 1.15; 
    }

    return (
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        <div className="flex items-center justify-between shrink-0">
          <button onClick={() => setVendedorVisualizado(null)} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors font-black text-xs uppercase tracking-widest bg-[#111A2C] px-4 py-2 rounded-xl border border-slate-800 shadow-md">
            <ArrowLeft size={16}/> Voltar ao Ranking
          </button>
          <div className="flex items-center gap-3 bg-[#111A2C] px-6 py-2 rounded-2xl border border-amber-900/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Medal size={24} className="text-amber-400"/>
            <h2 className="text-2xl font-black text-white uppercase">{v.vendedor}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
             
             <div className="bg-linear-to-br from-[#0C1525] to-[#122238] border border-[#1E293B] rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-center">
               <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
               <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14}/> Faturamento Total</p>
               <h2 className="text-4xl font-black text-white">{formatMoney(v.faturamento)}</h2>
               <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-end">
                 <div>
                   <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Package size={14}/> Total de Peças</p>
                   <h2 className="text-xl font-black text-white">{v.quantidadeItens} un</h2>
                 </div>
               </div>
             </div>

             <div className="lg:col-span-2 bg-[#111A2C] border border-[#1E293B] rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-center">
               <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>
               
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Target size={14}/> Meta de Venda Individual</p>
                   <h2 className="text-3xl font-black text-white">{formatMoney(metaAplicada)}</h2>
                 </div>
                 <div className="text-right">
                   <h2 className="text-4xl font-black text-white flex items-center gap-2 justify-end">
                     {pct.toFixed(1)}% {pct >= 100 && <Rocket className="text-fuchsia-500 animate-bounce" size={28}/>}
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nível Alcançado</p>
                 </div>
               </div>
               
               <div className="w-full bg-[#0B1120] rounded-full h-5 mb-2 border border-slate-800 overflow-hidden relative shadow-inner">
                 <div 
                   className="h-full bg-linear-to-r from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.8)] transition-all duration-1000 ease-out relative flex items-center" 
                   style={{ width: `${pct}%` }}
                 >
                   <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                 </div>
               </div>

               <div className="flex justify-between items-center mt-2">
                 <span className="text-xs font-black text-amber-500 uppercase">
                   {faltaParaMeta <= 0 ? '🏆 META BATIDA!' : `Faltam ${formatMoney(faltaParaMeta)}`}
                 </span>
               </div>
             </div>
          </div>

          {isMesAtivoReal && diasRestantes > 0 && faltaParaMeta > 0 && (
             <div className="bg-[#111A2C] border border-fuchsia-900/30 rounded-2xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Rocket size={80}/></div>
                <h3 className="text-xs font-black text-fuchsia-500 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14}/> Velocímetro Diário do Vendedor</h3>
                <p className="text-[10px] text-slate-400 font-bold mb-4">Para bater a meta sem sufoco, {v.vendedor.split(' ')[0]} precisa vender esse ritmo por dia (Cálculo com 15% de gordura sobre os {diasRestantes} dias úteis restantes).</p>
                
                <div className="bg-[#0B1120] border border-fuchsia-900/50 rounded-xl p-4 text-center shadow-inner w-full md:w-1/3">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Ritmo Necessário</p>
                   <h2 className="text-3xl font-black text-fuchsia-400">{formatMoney(metaDiaria)} <span className="text-sm text-slate-500">/dia</span></h2>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-100">
             <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl flex flex-col overflow-hidden shadow-xl">
               <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0">
                 <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Star size={16}/> Top 10 Clientes Fiéis</h3>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                 <div className="flex flex-col gap-2">
                   {v.top10Clientes.map((cli, idx) => (
                     <div key={idx} className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 p-3 rounded-xl hover:border-cyan-900/50 transition-colors">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${idx < 3 ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}º</div>
                       <p className="flex-1 text-xs font-black text-white truncate">{cli.nome}</p>
                       <div className="shrink-0 text-right bg-[#0E1525] px-3 py-1 rounded-lg border border-slate-800">
                         <p className="text-[9px] text-slate-500 font-bold uppercase">Nº Acessos</p>
                         <p className="text-sm font-black text-emerald-400">{cli.compras}x</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl flex flex-col overflow-hidden shadow-xl">
               <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0">
                 <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Trophy size={16}/> Top 20 Itens Mais Vendidos</h3>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                 <div className="flex flex-col gap-2">
                   {v.top20Itens.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 p-3 rounded-xl hover:border-amber-900/50 transition-colors">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${idx < 3 ? 'bg-amber-900/40 text-amber-400 border border-amber-500/50' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}º</div>
                       <p className="flex-1 text-xs font-black text-white truncate">{item.nome}</p>
                       <div className="shrink-0 text-right bg-[#0E1525] px-3 py-1 rounded-lg border border-slate-800">
                         <p className="text-[9px] text-slate-500 font-bold uppercase">Volume Saída</p>
                         <p className="text-sm font-black text-blue-400">{item.repeticoes} un</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200">
      
      {toast.visivel && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-300 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 bg-[#111A2C] border border-[#1E293B] p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-900/30 text-cyan-400 rounded-xl border border-cyan-800/50">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Acompanhamento do Time</h1>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5 tracking-widest uppercase">Dashboard Global & Raio-X Individual</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#111A2C] border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-500 uppercase">MÊS:</span>
             <select 
               value={mesSelecionado} 
               onChange={e => { setMesSelecionado(e.target.value); setVendedorVisualizado(null); }} 
               className="bg-[#111A2C] text-cyan-400 font-black outline-none cursor-pointer uppercase text-xs"
             >
               <option value="ATUAL" className="bg-[#0B1120] text-cyan-400 font-bold">--- ÁREA DE TRIAGEM ---</option>
               {mesesDisponiveis.map(m => (
                 <option key={m} value={m} className="bg-[#0B1120] text-white font-bold">{m}</option>
               ))}
             </select>
          </div>

          {mesSelecionado === 'ATUAL' && (
            <>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xls,.xlsx,.csv" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="bg-[#0B1120] border border-cyan-800 hover:bg-cyan-900/40 text-cyan-400 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                UPLOAD EQUIPE
              </button>

              <button onClick={() => { if(vendedoresUpload.length === 0) return mostrarToast("Nenhuma equipe carregada.", "erro"); setModalSalvarAtivo(true); }} disabled={vendedoresUpload.length === 0 || salvando} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50">
                <Save size={16} /> SALVAR RANKING
              </button>
            </>
          )}
        </div>
      </div>

      {!vendedorVisualizado ? renderRanking() : renderRaioX()}

      {/* MODAL DE SALVAMENTO DE MÊS */}
      {modalSalvarAtivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#111A2C] border border-cyan-900/50 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.15)] w-full max-w-sm p-6 text-center relative">
            <button onClick={() => setModalSalvarAtivo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-800/50 transition-colors"><X size={16} /></button>
            
            <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 shadow-inner">
              <Calendar size={28} />
            </div>
            <h2 className="text-lg font-black text-white mb-1 uppercase tracking-wider">Salvar Ranking da Equipe</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">Escolha o mês de referência para consolidar e arquivar os resultados e as metas individuais.</p>
            
            <div className="flex gap-2 mb-6">
              <select 
                value={mesParaSalvar} 
                onChange={(e) => setMesParaSalvar(e.target.value)}
                className="flex-1 bg-[#0B1120] border border-slate-700 text-cyan-400 font-black rounded-xl p-3 outline-none focus:border-cyan-500 uppercase text-xs cursor-pointer"
              >
                {mesesDoAno.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              
              <input 
                type="number" 
                value={anoParaSalvar}
                onChange={(e) => setAnoParaSalvar(e.target.value)}
                className="w-24 bg-[#0B1120] border border-slate-700 text-white font-black rounded-xl p-3 outline-none focus:border-cyan-500 text-center text-xs"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSalvarAtivo(false)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700 uppercase transition-colors text-xs shadow-md">Cancelar</button>
              <button onClick={handleConfirmarSalvarGeral} disabled={salvando} className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 uppercase transition-colors text-xs flex justify-center items-center gap-2">
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE EXCLUSÃO (DANGER ZONE) */}
      {modalExcluirAtivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#111A2C] border border-rose-900/50 rounded-2xl shadow-[0_0_40px_rgba(225,29,72,0.15)] w-full max-w-sm p-6 text-center relative">
            <button onClick={() => setModalExcluirAtivo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-800/50 transition-colors"><X size={16} /></button>
            
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Apagar Vendedor?</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">
              Tem certeza que deseja remover permanentemente o resultado de <strong className="text-rose-400">{vendedorParaExcluir.nome}</strong> deste mês?
            </p>

            <div className="flex gap-3">
              <button onClick={() => setModalExcluirAtivo(false)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700 uppercase transition-colors text-xs shadow-md">Cancelar</button>
              <button onClick={handleConfirmarExclusao} disabled={excluindo} className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl hover:bg-rose-500 shadow-lg shadow-rose-900/50 uppercase transition-colors text-xs flex justify-center items-center gap-2">
                {excluindo ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Sim, Apagar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}