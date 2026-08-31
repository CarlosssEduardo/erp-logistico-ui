import React, { useState } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle, AlertTriangle, Loader2, Calendar, Truck, TrendingUp, Smartphone, Battery, Cable, Cpu, X, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function Upload() {
  const [files, setFiles] = useState({
    inventario: null, vendasMensais: null, vendasSemanais: null, pdcs: null,
    baseTelas: null, baseBaterias: null, baseFlex: null, baseComponentes: null
  });
  
  const [loading, setLoading] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  // 🔥 ESTADO DO NOVO MODAL DE WIPE
  const [modalWipeAtivo, setModalWipeAtivo] = useState(false);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const handleFileChange = (type, file) => setFiles(prev => ({ ...prev, [type]: file }));

  const handleUpload = async (type, endpoint, successMessage) => {
    if (!files[type]) return showStatus('error', 'Selecione um arquivo primeiro.');
    setLoading(prev => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append('file', files[type]);

    try {
      const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showStatus('success', response.data?.mensagem || successMessage);
      setFiles(prev => ({ ...prev, [type]: null }));
    } catch (error) {
      showStatus('error', `Erro: ${error.response?.data?.erro || error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // 🔥 FUNÇÃO DE ZERAR BANCO ATUALIZADA (Sem o alert nativo do navegador)
  const handleZerarBanco = async () => {
    setLoading(prev => ({ ...prev, zerar: true }));
    try {
      await api.delete('/estoque/zerar');
      showStatus('success', 'Inventário zerado fisicamente do banco de dados!');
      setModalWipeAtivo(false);
    } catch (error) { 
      showStatus('error', 'Erro ao limpar o banco de dados.'); 
    } finally { 
      setLoading(prev => ({ ...prev, zerar: false })); 
    }
  };

  const renderCard = (id, titulo, desc, icon, corRef, rota, msgSucesso) => {
    const isReady = !!files[id];
    const isLoad = loading[id];

    const colorMap = {
      blue: 'bg-blue-500 text-blue-400 border-blue-500 shadow-blue-500',
      emerald: 'bg-emerald-500 text-emerald-400 border-emerald-500 shadow-emerald-500',
      purple: 'bg-purple-500 text-purple-400 border-purple-500 shadow-purple-500',
      orange: 'bg-orange-500 text-orange-400 border-orange-500 shadow-orange-500',
      cyan: 'bg-cyan-500 text-cyan-400 border-cyan-500 shadow-cyan-500',
      amber: 'bg-amber-500 text-amber-400 border-amber-500 shadow-amber-500',
      indigo: 'bg-indigo-500 text-indigo-400 border-indigo-500 shadow-indigo-500',
      rose: 'bg-rose-500 text-rose-400 border-rose-500 shadow-rose-500'
    };

    const c = colorMap[corRef];

    return (
      <div className={`bg-[#111A2C] border border-[#1E293B] rounded-2xl p-4 relative overflow-hidden shadow-xl flex flex-col justify-between group hover:border-${corRef}-500/50 transition-colors`}>
        <div className={`absolute left-0 top-0 h-full w-1 ${c.split(' ')[0]} shadow-[0_0_10px_rgba(0,0,0,0)] opacity-70 group-hover:opacity-100 transition-opacity`}></div>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 bg-[#0B1120] ${c.split(' ')[1]} rounded-lg border ${c.split(' ')[2]}/30`}>{icon}</div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider">{titulo}</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mb-4 leading-relaxed line-clamp-2" title={desc}>{desc}</p>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2 bg-[#0B1120] border border-slate-800 rounded-xl p-1.5 mb-3">
            <label className={`bg-[#1E293B] hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-colors shrink-0 ${isReady ? 'ring-1 ring-emerald-500' : ''}`}>
              {isReady ? 'TROC. ARQUIVO' : 'SELECIONAR'}
              <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileChange(id, e.target.files[0])} className="hidden" />
            </label>
            <span className={`text-[10px] font-bold truncate ${isReady ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isReady ? files[id].name : 'Nenhum .xlsx'}
            </span>
          </div>

          <button onClick={() => handleUpload(id, rota, msgSucesso)} disabled={isLoad || !isReady}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-md ${
              isReady 
              ? `${c.split(' ')[0]} hover:brightness-110 text-white shadow-[0_0_15px_rgba(0,0,0,0.4)]` 
              : 'bg-[#1E293B] text-slate-500 cursor-not-allowed border border-slate-800'
            }`}>
            {isLoad ? <Loader2 className="animate-spin" size={14}/> : 'PROCESSAR CARGA'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 overflow-hidden flex flex-col h-full bg-[#0B1120] text-slate-200 relative">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-3 text-white uppercase tracking-wider">
            <UploadCloud className="text-cyan-400" size={28} /> CARGA & VENDAS
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 ml-10">Módulo de inserção de planilhas matrizes no banco de dados.</p>
        </div>

        {status.message && (
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs animate-in fade-in zoom-in duration-200 ${
            status.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' : 'bg-rose-950 border border-rose-500 text-rose-400'
          }`}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {status.message}
          </div>
        )}
      </div>

      {/* GRID RESPONSIVO */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          
          {renderCard('inventario', 'Carga de Inventário', 'Lê a planilha matriz e recadastra fisicamente todos os produtos no sistema.', <FileText size={18}/>, 'blue', '/estoque/upload', 'Inventário atualizado!')}
          
          {renderCard('vendasMensais', 'Vendas Mensais', 'Lê o faturamento do mês para geração de dashboards e raio-x de vendedores.', <Calendar size={18}/>, 'emerald', '/vendas/upload/MENSAL', 'Vendas Mensais importadas!')}
          
          {renderCard('vendasSemanais', 'Vendas Semanais', 'Importa as vendas curtas da semana para sugestões rápidas de compra.', <TrendingUp size={18}/>, 'purple', '/vendas/upload/SEMANAL', 'Vendas Semanais importadas!')}
          
          {renderCard('pdcs', 'Controle Logístico (PDCs)', 'Sincroniza o rastreio financeiro e de garantias (RMA) do setor de compras.', <Truck size={18}/>, 'orange', '/pedidos/upload', 'PDCs e RMAs atualizados!')}
          
          {renderCard('baseTelas', 'Cód. Fornecedor: Telas', 'Injeta a relação cruzada de Códigos VS Fornecedores de Telas.', <Smartphone size={18}/>, 'cyan', '/mesacompras/upload/telas', 'Base de Telas atualizada!')}
          
          {renderCard('baseBaterias', 'Cód. Fornecedor: Baterias', 'Injeta a relação cruzada de Códigos VS Fornecedores de Baterias.', <Battery size={18}/>, 'amber', '/mesacompras/upload/baterias', 'Base de Baterias atualizada!')}
          
          {renderCard('baseFlex', 'Cód. Fornecedor: Flex', 'Injeta a relação cruzada de Códigos VS Fornecedores de Cabos Flex.', <Cable size={18}/>, 'indigo', '/mesacompras/upload/flex', 'Base de Flex atualizada!')}
          
          {renderCard('baseComponentes', 'Cód. Fornecedor: Comp.', 'Injeta a relação cruzada de Códigos VS Fornecedores de Componentes.', <Cpu size={18}/>, 'rose', '/mesacompras/upload/componentes', 'Base de Componentes atualizada!')}

        </div>

        {/* ZONA DE MANUTENÇÃO */}
        <div className="mt-6 bg-[#111A2C] border border-rose-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1 bg-rose-600"></div>
          <div className="flex items-center gap-3 ml-2 mb-3 sm:mb-0">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 size={20} /></div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Limpeza de Inventário</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Apaga fisicamente todos os dados do BD para zerar o balanço.</p>
            </div>
          </div>
          
          {/* 🔥 NOVO GATILHO QUE ABRE O MODAL */}
          <button onClick={() => setModalWipeAtivo(true)} disabled={loading.zerar}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-950/40 border border-rose-500/50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
            <Trash2 size={14} /> Executar Wipe
          </button>
        </div>

      </div>

      {/* ======================================================================
          🔥 MODAL DE WIPE (DANGER ZONE)
      ====================================================================== */}
      {modalWipeAtivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E1525] border border-rose-900/50 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.2)] w-full max-w-sm p-6 text-center relative overflow-hidden">
            
            <button onClick={() => setModalWipeAtivo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-800/50 transition-colors"><X size={16} /></button>
            
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
              <AlertCircle size={32} />
            </div>
            
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Limpar Inventário?</h2>
            <p className="text-slate-400 text-xs font-bold mb-6 leading-relaxed">
              Esta ação é <span className="text-rose-400">irreversível</span>. O sistema vai apagar fisicamente todos os produtos de inventário cadastrados no banco de dados. 
            </p>

            <div className="flex gap-3">
              <button onClick={() => setModalWipeAtivo(false)} className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-white font-black py-3 rounded-xl uppercase transition-colors text-xs shadow-md">Cancelar</button>
              <button onClick={handleZerarBanco} disabled={loading.zerar} className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl hover:bg-rose-500 shadow-lg shadow-rose-900/50 uppercase transition-colors text-xs flex justify-center items-center gap-2">
                {loading.zerar ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Zerar Banco
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}