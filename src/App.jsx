import { useState } from 'react';
import { 
  PackageSearch, Smartphone, Battery, Cable, Cpu, 
  ShoppingCart, UploadCloud, DollarSign, ShieldCheck, 
  Code2, AlertOctagon, AlertTriangle, Menu, X, Users
} from 'lucide-react';

import Upload from './pages/Upload';
import BrutoInventario from './pages/BrutoInventario';
import PedidosCompra from './pages/PedidosCompra'; 
import ControleRMA from './pages/ControleRMA'; 
import MesaTelas from './pages/MesaTelas';
import MesaBaterias from './pages/MesaBaterias';
import MesaFlex from './pages/MesaFlex';
import MesaComponentes from './pages/MesaComponentes';
import VendaMensal from './pages/VendaMensal';
import AcompanhamentoVendedores from './pages/AcompanhamentoVendedores';
import AnaliseEstoque from './pages/AnaliseEstoque';

function App() {
  const [telaAtiva, setTelaAtiva] = useState('upload'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderMenuItem = (id, nome, Icone) => {
    const isAtivo = telaAtiva === id;
    return (
      <button
        onClick={() => {
          setTelaAtiva(id);
          setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
          isAtivo 
            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]' 
            : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
        }`}
        title={isSidebarCollapsed ? nome : ''}
      >
        <Icone size={16} className={isAtivo ? 'text-cyan-400' : 'text-slate-400 shrink-0'} />
        {!isSidebarCollapsed && <span className="truncate">{nome}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 font-sans overflow-hidden relative">
      
      {/* Overlay para Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#111A2C] border-r border-[#1E293B] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out lg:relative ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="overflow-y-auto custom-scrollbar overflow-x-hidden">
          
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-[#1E293B] bg-[#0E1525] flex justify-between items-center">
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xs font-black text-cyan-400 tracking-wider flex items-center gap-2 uppercase">
                  <ShieldCheck size={18} className="text-cyan-400" /> GESTÃO DE ACESSO
                </h1>
                <p className="text-xs text-slate-100 mt-1 font-bold">
                  Supervisor: <span className="text-white font-black underline decoration-cyan-500">Erick Victor</span>
                </p>
              </div>
            )}
            
            <button className="hidden lg:flex text-slate-400 hover:text-white p-1 rounded-lg bg-[#1E293B]/50 mx-auto" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <Menu size={18} />
            </button>

            <button className="lg:hidden text-slate-400 hover:text-white p-1" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navegação */}
          <nav className="p-3 space-y-1.5">
            {!isSidebarCollapsed && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1">Principal</div>}
            {renderMenuItem('upload', 'Carga & Vendas', UploadCloud)}
            
            {!isSidebarCollapsed && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1 mt-3">Relatórios de Vendas</div>}
            {renderMenuItem('venda-mensal', 'Bruto Venda Mensal', DollarSign)}
            {renderMenuItem('acompanhamento-vendedores', 'Acompanhamento Time', Users)}
            {renderMenuItem('analise-estoque', 'Análise & Alertas', AlertTriangle)}

            {!isSidebarCollapsed && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1 mt-3">Inventário (Abas)</div>}
            {renderMenuItem('bruto-inventario', 'Bruto Inventário', PackageSearch)}
            {renderMenuItem('telas', 'Telas', Smartphone)}
            {renderMenuItem('baterias', 'Baterias', Battery)}
            {renderMenuItem('flex', 'Flex', Cable)}
            {renderMenuItem('componentes', 'Componentes', Cpu)}

            {!isSidebarCollapsed && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1 mt-3">Gestão de Compras</div>}
            {renderMenuItem('pedidos-compra', 'Pedidos de Compras', ShoppingCart)}
            {renderMenuItem('rma', 'Controle de RMA', AlertOctagon)}
          </nav>
        </div>

        {/* Footer da Sidebar */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t border-[#1E293B] bg-[#080D18] text-center shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
              <Code2 size={16} />
              <span className="text-xs font-black uppercase tracking-wider">Eng. da Computação</span>
            </div>
            <p className="text-[10px] text-slate-300 font-bold uppercase">Desenvolvido por</p>
            <p className="text-sm text-white font-black tracking-wide">Carlos Eduardo</p>
          </div>
        )}
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Topbar */}
        <header className="bg-[#111A2C] border-b border-[#1E293B] p-3 flex justify-between items-center px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-cyan-400 hover:text-white p-1 rounded-md bg-[#1E293B]/50" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-wider hidden sm:block">
              {telaAtiva.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex bg-[#0B1324] border border-[#1E293B] px-3.5 py-1 rounded-full items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400 font-bold text-xs whitespace-nowrap">MongoDB Conectado</span>
            </div>
            <div className="border border-cyan-900 bg-cyan-950/40 text-cyan-300 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider shadow-sm">
              ONLINE
            </div>
          </div>
        </header>

        {/* Área de Renderização das Páginas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {telaAtiva === 'upload' && <Upload />}
          
          {telaAtiva === 'venda-mensal' && <VendaMensal />}
          {telaAtiva === 'acompanhamento-vendedores' && <AcompanhamentoVendedores />}
          {telaAtiva === 'analise-estoque' && <AnaliseEstoque />}
          
          {telaAtiva === 'bruto-inventario' && <BrutoInventario />}
          {telaAtiva === 'telas' && <MesaTelas/>}
          {telaAtiva === 'baterias' && <MesaBaterias />}
          {telaAtiva === 'flex' && <MesaFlex />}
          {telaAtiva === 'componentes' && <MesaComponentes />}

          {telaAtiva === 'pedidos-compra' && <PedidosCompra/>}
          {telaAtiva === 'rma' && <ControleRMA />}
        </div>
      </main>
    </div>
  );
}

export default App;