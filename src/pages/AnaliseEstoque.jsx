import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, PackageX, TrendingDown, Search, Loader2, ArrowRight, ShieldAlert, Activity
} from 'lucide-react';
import api from '../services/api';

export default function AnaliseEstoque() {
  const [estoque, setEstoque] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [visaoAtual, setVisaoAtual] = useState('PARADO'); // 'PARADO' ou 'BAIXO_GIRO'

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Puxa o Inventário Bruto Físico
      const resEstoque = await api.get(`/estoque?size=10000&_t=${Date.now()}`);
      const dadosEstoque = resEstoque.data.content || resEstoque.data || [];
      
      // 2. Puxa todo o histórico de vendas mensais processadas pelo upload
      const resVendas = await api.get(`/vendas/todas?_t=${Date.now()}`);
      const dadosVendas = resVendas.data || [];

      setEstoque(dadosEstoque);
      setVendas(dadosVendas);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // ============================================================================
  // 🔥 MOTOR DE CRUZAMENTO EXATO POR SKU
  // ============================================================================
  const processarAnalise = () => {
    // Mapeia as vendas por SKU { "SKU": QTD_VENDIDA_MENSAL }
    const mapVendas = new Map();
    vendas.forEach(v => {
      const sku = String(v.sku || v.SKU || '').trim().toUpperCase();
      const qtdVendida = Number(v.vendaMensal || v.vendaMês || v.quantidade || 0);
      if (sku) {
        mapVendas.set(sku, (mapVendas.get(sku) || 0) + qtdVendida);
      }
    });

    const parados = [];
    const baixoGiro = [];
    let totalCapitalParado = 0;
    let totalCapitalBaixoGiro = 0;

    estoque.forEach(item => {
      const sku = String(item.sku || item.SKU || '').trim().toUpperCase();
      const qtdFisica = Number(item.fisico || item.quantidade || 0);
      const valorUnit = Number(item.valorUnitario || item.vUnit || 0);
      
      if (qtdFisica <= 0 || !sku) return; // Ignora itens zerados ou sem SKU

      const qtdVendida = mapVendas.get(sku) || 0;
      const capitalAlocado = qtdFisica * valorUnit;

      const analiseItem = {
        sku: sku,
        descricao: item.descricao || item.nome || item.item || 'Produto sem descrição',
        estoque: qtdFisica,
        vendas: qtdVendida,
        valorUnitario: valorUnit,
        capitalAlocado: capitalAlocado,
        cobertura: qtdVendida > 0 ? (qtdFisica / qtdVendida) : 999 
      };

      if (qtdVendida === 0) {
        parados.push(analiseItem);
        totalCapitalParado += capitalAlocado;
      } else if (analiseItem.cobertura > 2) {
        baixoGiro.push(analiseItem);
        totalCapitalBaixoGiro += capitalAlocado;
      }
    });

    parados.sort((a, b) => b.capitalAlocado - a.capitalAlocado);
    baixoGiro.sort((a, b) => b.cobertura - a.cobertura);

    return { parados, baixoGiro, totalCapitalParado, totalCapitalBaixoGiro };
  };

  const dadosAnalise = processarAnalise();

  const itensExibidos = (visaoAtual === 'PARADO' ? dadosAnalise.parados : dadosAnalise.baixoGiro).filter(item => 
    item.descricao.toUpperCase().includes(busca.toUpperCase()) || item.sku.toUpperCase().includes(busca.toUpperCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0B1120] text-cyan-400 gap-4">
        <Loader2 size={48} className="animate-spin" />
        <h2 className="font-black tracking-widest uppercase">Analisando Estoque vs Vendas Mensais...</h2>
      </div>
    );
  }

  if (vendas.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0B1120] text-slate-400 gap-4 p-6 text-center">
        <Activity size={64} className="text-slate-700" />
        <h2 className="text-2xl font-black text-white uppercase">Nenhuma Venda Mensal Carregada</h2>
        <p className="font-bold max-w-lg">Faça o upload da planilha de Venda Mensal para que o sistema cruze com o seu estoque físico automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 bg-[#111A2C] border border-[#1E293B] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-900/30 text-rose-500 rounded-xl border border-rose-800/50">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Análise e Alertas de Estoque</h1>
            <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest uppercase">Cruzamento direto entre SKU Físico e Vendas Mensais.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
        
        {/* CARDS DE IMPACTO FINANCEIRO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
           
           <div className={`bg-linear-to-br from-[#0C1525] to-[#122238] border rounded-2xl p-6 relative overflow-hidden shadow-2xl flex items-center justify-between cursor-pointer transition-all ${visaoAtual === 'PARADO' ? 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)] ring-1 ring-rose-500/50' : 'border-[#1E293B] hover:border-slate-600'}`} onClick={() => setVisaoAtual('PARADO')}>
             <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,1)]"></div>
             <div>
               <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><PackageX size={16}/> Estoque 100% Parado (Dinheiro Morto)</p>
               <h2 className="text-4xl font-black text-white">{formatMoney(dadosAnalise.totalCapitalParado)}</h2>
               <p className="text-xs text-slate-400 font-bold mt-2"><strong className="text-rose-400">{dadosAnalise.parados.length}</strong> referências com 0 vendas no mês.</p>
             </div>
             <div className={`p-4 rounded-full ${visaoAtual === 'PARADO' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
               <ArrowRight size={24} />
             </div>
           </div>

           <div className={`bg-linear-to-br from-[#0C1525] to-[#122238] border rounded-2xl p-6 relative overflow-hidden shadow-2xl flex items-center justify-between cursor-pointer transition-all ${visaoAtual === 'BAIXO_GIRO' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50' : 'border-[#1E293B] hover:border-slate-600'}`} onClick={() => setVisaoAtual('BAIXO_GIRO')}>
             <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)]"></div>
             <div>
               <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingDown size={16}/> Alerta de Baixo Giro (Superestocados)</p>
               <h2 className="text-4xl font-black text-white">{formatMoney(dadosAnalise.totalCapitalBaixoGiro)}</h2>
               <p className="text-xs text-slate-400 font-bold mt-2"><strong className="text-amber-400">{dadosAnalise.baixoGiro.length}</strong> referências com estoque para mais de 2 meses.</p>
             </div>
             <div className={`p-4 rounded-full ${visaoAtual === 'BAIXO_GIRO' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
               <ArrowRight size={24} />
             </div>
           </div>

        </div>

        {/* TABELA DE DETALHAMENTO */}
        <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-xl flex flex-col flex-1 min-h-100">
           <div className="p-5 border-b border-slate-800 bg-[#0E1525] flex justify-between items-center shrink-0 rounded-t-2xl">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
               {visaoAtual === 'PARADO' ? <><AlertTriangle size={18} className="text-rose-500"/> Detalhamento do Estoque Parado</> : <><AlertTriangle size={18} className="text-amber-500"/> Detalhamento de Baixo Giro</>}
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
                   <th className="p-4">Cód / SKU</th>
                   <th className="p-4">Produto</th>
                   {visaoAtual === 'BAIXO_GIRO' && <th className="p-4 text-center text-cyan-400">Venda no Mês</th>}
                   <th className="p-4 text-center">Estoque Atual</th>
                   {visaoAtual === 'BAIXO_GIRO' && <th className="p-4 text-center text-amber-500">Cobertura Estimada</th>}
                   <th className="p-4 text-right">Custo Unit.</th>
                   <th className={`p-4 text-right ${visaoAtual === 'PARADO' ? 'text-rose-500' : 'text-amber-500'}`}>Capital Alocado (Preso)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {itensExibidos.length === 0 ? (
                   <tr><td colSpan="7" className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">Nenhum item encontrado nesta categoria. Ótimo trabalho!</td></tr>
                 ) : (
                   itensExibidos.map((it, idx) => (
                     <tr key={idx} className="hover:bg-[#1E293B]/40 transition-colors text-slate-300 font-bold">
                       <td className="p-4 text-slate-500 font-black">{it.sku}</td>
                       <td className="p-4 text-cyan-400">{it.descricao}</td>
                       
                       {visaoAtual === 'BAIXO_GIRO' && (
                         <td className="p-4 text-center font-black bg-cyan-900/10 text-cyan-400">{it.vendas} un</td>
                       )}
                       
                       <td className="p-4 text-center font-black">{it.estoque} un</td>
                       
                       {visaoAtual === 'BAIXO_GIRO' && (
                         <td className="p-4 text-center font-black text-amber-400">Dura {it.cobertura.toFixed(1)} meses</td>
                       )}
                       
                       <td className="p-4 text-right text-slate-400">{formatMoney(it.valorUnitario)}</td>
                       <td className={`p-4 text-right font-black ${visaoAtual === 'PARADO' ? 'text-rose-400 bg-rose-900/10' : 'text-amber-400 bg-amber-900/10'}`}>
                         {formatMoney(it.capitalAlocado)}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           
           <div className="p-4 border-t border-slate-800 bg-[#0B1120] rounded-b-2xl shrink-0 flex justify-between items-center text-xs font-black uppercase text-slate-500">
              <span>Exibindo {itensExibidos.length} referências</span>
              <span>Análise cruzada via SKU com as Vendas Mensais cadastradas</span>
           </div>
        </div>

      </div>
    </div>
  );
}