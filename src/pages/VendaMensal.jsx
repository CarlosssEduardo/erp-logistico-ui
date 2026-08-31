import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, TrendingUp, Target, Save, Search, 
  Calendar, CheckCircle, BarChart2, Loader2, Rocket, Trophy, X, BellRing
} from 'lucide-react';
import api from '../services/api';

const parseNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[R$\s]/g, ''); 
  if (str.includes(',') && str.includes('.')) {
     return Number(str.replace(/\./g, '').replace(',', '.'));
  }
  if (str.includes(',')) {
     return Number(str.replace(',', '.'));
  }
  return Number(str) || 0;
};

const getValor = (it) => {
   if ('valorVendido' in it) return parseNumber(it.valorVendido);
   if ('Valor Vendido' in it) return parseNumber(it['Valor Vendido']);
   if ('valor' in it) return parseNumber(it.valor);
   if ('faturamento' in it) return parseNumber(it.faturamento);
   if ('total' in it) return parseNumber(it.total);
   for (const k in it) {
      if (k.toLowerCase().includes('valor') || k.toLowerCase().includes('fatur')) return parseNumber(it[k]);
   }
   return 0;
};

const getQtd = (it) => {
   if ('qtde' in it) return parseNumber(it.qtde);
   if ('quantidade' in it) return parseNumber(it.quantidade);
   if ('Qtde. Vendido' in it) return parseNumber(it['Qtde. Vendido']);
   if ('qtdeVendido' in it) return parseNumber(it.qtdeVendido);
   for (const k in it) {
      if (k.toLowerCase().includes('qtd') || k.toLowerCase().includes('quant')) return parseNumber(it[k]);
   }
   return 1;
};

const getProduto = (it) => {
   if ('produto' in it) return it.produto;
   if ('Produto' in it) return it['Produto'];
   if ('descricao' in it) return it.descricao;
   if ('nome' in it) return it.nome;
   for (const k in it) {
      if (k.toLowerCase().includes('prod') || k.toLowerCase().includes('desc')) return it[k];
   }
   return it.sku || 'Produto Sem Nome';
};

export default function VendaMensal() {
  
  // 🔥 ESTADOS TOTALMENTE LIMPOS (SEM LOCAL STORAGE)
  const [vendasUpload, setVendasUpload] = useState([]);
  const [meta, setMeta] = useState(150000); 

  const [historicoSalvo, setHistoricoSalvo] = useState([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');

  const [modalSalvarAtivo, setModalSalvarAtivo] = useState(false);
  const [mesParaSalvar, setMesParaSalvar] = useState('');
  const [anoParaSalvar, setAnoParaSalvar] = useState(new Date().getFullYear());
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });
  
  const fileInputRef = useRef(null);

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
      const res = await api.get('/vendas-mensais/historico');
      const dados = res.data || [];
      
      dados.sort((a, b) => b.id ? b.id.localeCompare(a.id) : 0);
      setHistoricoSalvo(dados);
      
      const mesesUnicos = Array.from(new Set(dados.map(d => d.mesReferencia)));
      setMesesDisponiveis(mesesUnicos);

      if (mesesUnicos.length > 0) {
        setMesSelecionado(mesesUnicos[0]);
        // Puxa a meta do último mês salvo no MongoDB automaticamente
        if (dados.length > 0 && dados[0].metaAlcancada) {
            setMeta(dados[0].metaAlcancada);
        }
      } else {
        setMesSelecionado('ATUAL');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/vendas-mensais/processar?meta=${meta}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const listaExtraida = res.data.detalhamento || res.data.detalhamentoVendas || res.data.content || [];
      setVendasUpload(listaExtraida);
      setMesSelecionado('ATUAL');
      mostrarToast("Planilha atualizada processada com sucesso!");
    } catch (e) {
      mostrarToast("Erro ao processar planilha.", "erro");
    } finally {
      setLoading(false);
      event.target.value = null; 
    }
  };

  const handleConfirmarSalvar = async () => {
    if (vendasUpload.length === 0) return mostrarToast("Nenhuma venda nova carregada.", "erro");

    setSalvando(true);
    const mesFormatado = `${mesParaSalvar}/${anoParaSalvar}`;

    const faturamentoTotalUpload = vendasUpload.reduce((acc, it) => acc + getValor(it), 0);

    try {
      const payload = {
        mesReferencia: mesFormatado,
        faturamentoTotal: faturamentoTotalUpload,
        metaAlcancada: meta,
        detalhamentoVendas: vendasUpload
      };

      await api.post('/vendas-mensais/salvar', payload);
      
      setModalSalvarAtivo(false);
      mostrarToast(`Resultado de ${mesFormatado} atualizado com sucesso no banco de dados!`);
      
      setVendasUpload([]); // Limpa a tela
      carregarHistorico(); // Recarrega do banco
    } catch (e) {
      mostrarToast("Erro ao salvar resultado no banco.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleMetaChange = (e) => {
    const apenasNumeros = e.target.value.replace(/\D/g, '');
    if (!apenasNumeros) {
      setMeta(0);
      return;
    }
    const valorReal = Number(apenasNumeros) / 100;
    setMeta(valorReal);
  };

  const inputValueMeta = meta === 0 ? '' : meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  let metaExibicao = meta;

  if (mesSelecionado === 'ATUAL') {
    dadosExibicao = [...vendasUpload];
  } else {
    const mesSalvo = historicoSalvo.find(h => h.mesReferencia === mesSelecionado);
    if (mesSalvo) {
      dadosExibicao = [...(mesSalvo.detalhamentoVendas || [])];
      metaExibicao = Number(mesSalvo.metaAlcancada) > 0 ? Number(mesSalvo.metaAlcancada) : meta;
    }
  }

  const faturamentoExibicao = dadosExibicao.reduce((acc, it) => acc + getValor(it), 0);
  dadosExibicao.sort((a, b) => getQtd(b) - getQtd(a));

  const top20 = dadosExibicao.slice(0, 20);
  const percentual = metaExibicao > 0 ? Math.min(100, (faturamentoExibicao / metaExibicao) * 100) : 0;
  const faltaParaMeta = Math.max(0, metaExibicao - faturamentoExibicao);
  const diasRestantes = getDiasRestantes();
  let metaDiaria = 0;
  
  const mesAtualCalendario = mesesDoAno[new Date().getMonth()];
  const isMesAtivoReal = mesSelecionado === 'ATUAL' || mesSelecionado.includes(mesAtualCalendario);

  if (isMesAtivoReal && diasRestantes > 0 && faltaParaMeta > 0) {
    metaDiaria = (faltaParaMeta / diasRestantes) * 1.15; 
  }

  const itensFiltrados = dadosExibicao.filter(it => 
    getProduto(it).toUpperCase().includes(busca.toUpperCase()) || 
    (it.sku && String(it.sku).toUpperCase().includes(busca.toUpperCase()))
  );

  const getMonkeyInfo = (pct) => {
    if (pct === 0) return { emoji: '🙈', msg: 'Zerado...', flip: false };
    if (pct < 30) return { emoji: '🙈', msg: 'Acelera!', flip: false };
    if (pct < 60) return { emoji: '🐒', msg: 'Foco!', flip: true }; 
    if (pct < 100) return { emoji: '🐵', msg: 'Tá Quase!', flip: false };
    return { emoji: '🦍🚀', msg: 'Voando!', flip: false }; 
  };
  const monkey = getMonkeyInfo(percentual);

  // 🔥 DETECTOR DE TELA VAZIA CONECTADO AO BANCO DE DADOS
  const isDashboardVazio = dadosExibicao.length === 0 && historicoSalvo.length === 0;

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200 relative">
      
      <style>{`
        @keyframes vscodeLoading {
          0% { left: -30%; width: 30%; }
          50% { width: 50%; }
          100% { left: 100%; width: 30%; }
        }
        .vscode-bar {
          animation: vscodeLoading 1.8s infinite ease-in-out alternate;
        }
      `}</style>

      {toast.visivel && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-300 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      {/* HEADER COMPACTO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 bg-[#111A2C] border border-[#1E293B] p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-xl border border-emerald-800/50">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Bruto de Venda Mês</h1>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5 tracking-widest uppercase">Acompanhamento de metas, ranking de produtos e faturamento.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#111A2C] border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-500 uppercase">MÊS:</span>
             <select 
               value={mesSelecionado} 
               onChange={e => setMesSelecionado(e.target.value)} 
               className="bg-[#111A2C] text-cyan-400 font-black outline-none cursor-pointer uppercase text-xs"
             >
               {vendasUpload.length > 0 && <option value="ATUAL" className="bg-[#0B1120] text-emerald-400 font-bold">--- UPLOAD NÃO SALVO ---</option>}
               {historicoSalvo.length === 0 && vendasUpload.length === 0 && <option value="ATUAL" className="bg-[#0B1120] text-slate-500 font-bold">--- AGUARDANDO DADOS ---</option>}
               {mesesDisponiveis.map(m => (
                 <option key={m} value={m} className="bg-[#0B1120] text-white font-bold">{m}</option>
               ))}
             </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0B1120] border border-amber-900/50 px-3 py-1.5 rounded-xl">
            <Target size={14} className="text-amber-500"/>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Definir Meta (R$)</span>
              <input 
                type="text" 
                value={inputValueMeta} 
                onChange={handleMetaChange} 
                className="bg-transparent text-white font-black outline-none text-xs w-28" 
                placeholder="0,00"
              />
            </div>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept=".xls,.xlsx,.csv" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="bg-[#0B1120] border border-cyan-800 hover:bg-cyan-900/40 text-cyan-400 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            ATUALIZAR DADOS
          </button>

          <button onClick={() => { if(vendasUpload.length === 0 && mesSelecionado === 'ATUAL') return mostrarToast("Faça o upload de uma atualização primeiro.", "erro"); setModalSalvarAtivo(true); }} disabled={(vendasUpload.length === 0 && mesSelecionado === 'ATUAL') || salvando} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50">
            <Save size={16} /> SALVAR ATUALIZAÇÃO
          </button>
        </div>
      </div>

      {isDashboardVazio ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#111A2C] border-2 border-dashed border-slate-700/50 rounded-3xl m-2 shadow-inner">
          <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-700">
            <BarChart2 size={48} className="text-slate-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Painel de Vendas Vazio</h2>
          <p className="text-slate-400 font-bold text-center max-w-lg leading-relaxed mb-8">
            Nenhum faturamento foi processado para esta visão. Para começar, insira a sua meta no topo e clique em <strong className="text-cyan-400">Atualizar Dados</strong> para importar a primeira planilha.
          </p>
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-cyan-900/30 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />} 
            Importar Primeira Planilha
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
             
             <div className="bg-linear-to-br from-[#0C1525] to-[#122238] border border-[#1E293B] rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-40">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
               <div className="flex justify-between items-start mb-2">
                 <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Faturamento Realizado</p>
                 <span className="text-[9px] font-black bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded border border-emerald-800">{mesSelecionado}</span>
               </div>
               <h2 className="text-4xl font-black text-white">{formatMoney(faturamentoExibicao)}</h2>
             </div>

             <div className="lg:col-span-2 bg-[#111A2C] border border-[#1E293B] rounded-2xl p-6 pt-8 relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-40">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
               
               <div className="flex justify-between items-end mb-4">
                 <div className="shrink-0">
                   <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Target size={16}/> Performance de Execução / Meta</p>
                   <h2 className="text-3xl font-black text-white">{formatMoney(metaExibicao)}</h2>
                 </div>

                 {/* ANIMAÇÃO VS CODE */}
                 <div className="hidden lg:block flex-1 mx-8 h-0.5 bg-slate-800/50 rounded-full overflow-hidden relative self-center mt-6">
                   <div className="absolute top-0 bottom-0 bg-linear-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(245,158,11,0.8)] vscode-bar"></div>
                 </div>

                 <div className="text-right flex items-center gap-3 shrink-0">
                   {/* 🔥 MACACO NO CABEÇALHO RESTAURADO */}
                   <span className={`text-4xl ${percentual >= 100 ? 'animate-bounce' : ''}`}>{monkey.emoji}</span>
                   <div>
                     <h2 className="text-4xl font-black text-white flex items-center gap-2 justify-end">
                       {percentual.toFixed(1)}% {percentual >= 100 && <Rocket className="text-fuchsia-500 animate-bounce" size={28}/>}
                     </h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nível de Execução</p>
                   </div>
                 </div>
               </div>
               
               {/* BARRA DE PROGRESSO E MACACO DINOSSAURO */}
               <div className="relative mt-4 mb-2">
                  <div 
                    className="absolute bottom-2 transition-all duration-1000 ease-out z-10"
                    style={{ left: `calc(${Math.min(Math.max(percentual, 0), 92)}%)` }}
                  >
                    <div className={`relative flex flex-col items-center ${percentual >= 100 ? 'animate-bounce' : ''}`}>
                       <span className="absolute -top-7 whitespace-nowrap text-[10px] font-black bg-white text-slate-900 px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse">
                         {monkey.msg}
                         <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                       </span>
                       
                       <span 
                         className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                         style={{ transform: monkey.flip ? 'scaleX(-1)' : 'none' }}
                       >
                         {monkey.emoji}
                       </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0B1120] rounded-full h-5 border border-slate-800 overflow-hidden relative shadow-inner">
                    <div 
                      className="h-full bg-linear-to-r from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out relative flex items-center" 
                      style={{ width: `${percentual}%` }}
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                    </div>
                  </div>
               </div>

               <div className="flex justify-between items-center text-xs font-black uppercase mt-2">
                 <span className="text-slate-400">Realizado: <span className="text-emerald-400">{formatMoney(faturamentoExibicao)}</span></span>
                 <span className="text-amber-500">{faltaParaMeta <= 0 ? '🏆 META BATIDA!' : `Faltam ${formatMoney(faltaParaMeta)} para bater a meta`}</span>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 min-h-75">
             
             <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden">
               {(!isMesAtivoReal || diasRestantes <= 0 || faltaParaMeta <= 0) ? (
                  <div className="text-center flex flex-col items-center justify-center h-full opacity-60">
                     <CheckCircle size={48} className="text-emerald-500 mb-4" />
                     <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Sem pressão diária</p>
                     <p className="text-[10px] text-slate-500 font-bold mt-2 px-4">Meta já foi batida ou este é um mês fechado do passado.</p>
                  </div>
               ) : (
                  <>
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Rocket size={100}/></div>
                    <h3 className="text-sm font-black text-fuchsia-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={18}/> Velocímetro para a Meta</h3>
                    <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">Meta diária calculada com 15% de gordura sobre os {diasRestantes} dias úteis restantes para não ter sufoco.</p>
                    
                    <div className="bg-[#0B1120] border border-fuchsia-900/50 rounded-xl p-5 text-center shadow-inner relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-fuchsia-500 to-transparent"></div>
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Ritmo Necessário por Dia</p>
                       <h2 className="text-4xl font-black text-fuchsia-400 tracking-tight">{formatMoney(metaDiaria)}</h2>
                    </div>
                  </>
               )}
             </div>

             <div className="lg:col-span-2 bg-[#111A2C] border border-[#1E293B] rounded-2xl flex flex-col overflow-hidden shadow-xl max-h-100">
               <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0">
                 <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Trophy size={16}/> Os 20 Campeões de Vendas</h3>
                 <div className="text-right">
                   <p className="text-[9px] text-slate-500 font-bold uppercase">Volume Rankeado</p>
                   <p className="text-sm font-black text-white">{top20.reduce((acc, curr) => acc + getQtd(curr), 0)} Peças</p>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                 <div className="flex flex-col gap-2">
                   {top20.length === 0 ? (
                      <p className="text-center text-slate-500 font-bold text-xs py-10 uppercase tracking-widest">Nenhuma venda registrada.</p>
                   ) : (
                     top20.map((item, idx) => (
                       <div key={idx} className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 p-3 rounded-xl hover:border-cyan-900/50 transition-colors">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${idx < 3 ? 'bg-amber-900/40 text-amber-400 border border-amber-500/50' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}º</div>
                         <p className="flex-1 text-xs font-black text-cyan-500 truncate">{getProduto(item)}</p>
                         <div className="shrink-0 text-right bg-[#0E1525] px-3 py-1 rounded-lg border border-slate-800">
                           <p className="text-[9px] text-slate-500 font-bold uppercase">Vendido</p>
                           <p className="text-sm font-black text-emerald-400">{getQtd(item)} un</p>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             </div>

          </div>

          <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-xl flex flex-col flex-1 min-h-100">
             <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0 rounded-t-2xl">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 Detalhamento Geral de Vendas <span className="text-slate-500 text-xs">({itensFiltrados.length} registros)</span>
               </h3>
               <div className="relative w-72">
                 <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                 <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar Produto..." className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-black text-white outline-none focus:border-cyan-500 transition-colors" />
               </div>
             </div>

             <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left text-xs border-collapse whitespace-nowrap min-w-max">
                 <thead className="sticky top-0 bg-[#0E1525] z-10 shadow-md border-b border-slate-800">
                   <tr className="text-slate-400 uppercase font-black tracking-wider">
                     <th className="p-4 w-16 text-center">#</th>
                     <th className="p-4">Produto</th>
                     <th className="p-4 text-center">Qtde. Vendida</th>
                     <th className="p-4 text-right">V. Unitário (Ref)</th>
                     <th className="p-4 text-right text-emerald-400">Total Faturado</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                   {itensFiltrados.length === 0 ? (
                     <tr><td colSpan="5" className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">Nenhuma venda encontrada para esta busca.</td></tr>
                   ) : (
                     itensFiltrados.map((it, idx) => {
                       const qtd = getQtd(it);
                       const valTot = getValor(it);
                       const valUnit = qtd > 0 ? valTot / qtd : valTot;

                       return (
                         <tr key={idx} className="hover:bg-[#1E293B]/40 transition-colors text-slate-300 font-bold">
                           <td className="p-4 text-center text-slate-600">{idx + 1}</td>
                           <td className="p-4 text-cyan-400 max-w-md truncate" title={getProduto(it)}>{getProduto(it)}</td>
                           <td className="p-4 text-center font-black bg-cyan-900/10">{qtd}</td>
                           <td className="p-4 text-right text-slate-400">{formatMoney(valUnit)}</td>
                           <td className="p-4 text-right font-black text-emerald-400">{formatMoney(valTot)}</td>
                         </tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {modalSalvarAtivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#111A2C] border border-cyan-900/50 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.15)] w-full max-w-sm p-6 text-center relative">
            <button onClick={() => setModalSalvarAtivo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-800/50 transition-colors"><X size={16} /></button>
            
            <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 shadow-inner">
              <Calendar size={28} />
            </div>
            <h2 className="text-lg font-black text-white mb-1 uppercase tracking-wider">Salvar Atualização</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">Escolha o mês de referência para atualizar e arquivar este resultado no histórico.</p>
            
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
              <button onClick={handleConfirmarSalvar} disabled={salvando} className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 uppercase transition-colors text-xs flex justify-center items-center gap-2">
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}