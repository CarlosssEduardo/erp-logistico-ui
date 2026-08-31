import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronRight, ChevronLeft, ShoppingCart, 
  AlertCircle, Wallet, Trash2, Eye, FileText, Save, X, Plus, AlertOctagon,
  MessageSquareDiff, BellRing, Store, Edit2, Check, Filter, ChevronDown
} from 'lucide-react';
import api from '../services/api';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PedidosCompra() {
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  
  const [totais, setTotais] = useState({ valor: 0, frete: 0, credito: 0 });

  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });
  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  const [filtroTabela, setFiltroTabela] = useState({
    fornecedor: 'TODOS', pagamento: 'TODOS', logistica: 'TODOS', pedido: 'TODOS'
  });
  const [filtroAberto, setFiltroAberto] = useState(null);

  const [modalCreditos, setModalCreditos] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [modalTextoNaoVem, setModalTextoNaoVem] = useState(false);
  
  const [editandoExtrato, setEditandoExtrato] = useState(null); 
  const [valorTempExtrato, setValorTempExtrato] = useState('');

  const [modalLojas, setModalLojas] = useState(false);
  const [novaLojaCadastrar, setNovaLojaCadastrar] = useState('');
  const [lojasGlobais, setLojasGlobais] = useState(() => {
    try {
      const saved = localStorage.getItem('lojasGlobais_telas');
      return saved ? JSON.parse(saved) : ['WILL RICARDO BELEM'];
    } catch(e) { return ['WILL RICARDO BELEM']; }
  });

  const [editandoFreteId, setEditandoFreteId] = useState(null);
  const [valorFreteTemp, setValorFreteTemp] = useState('');
  
  const [editandoValorId, setEditandoValorId] = useState(null);
  const [valorPedidoTemp, setValorPedidoTemp] = useState('');

  const [editandoPdcId, setEditandoPdcId] = useState(null);
  const [pdcTemp, setPdcTemp] = useState('');
  const [editandoCreditoId, setEditandoCreditoId] = useState(null);
  const [creditoEditTemp, setCreditoEditTemp] = useState('');

  const [textoNaoVem, setTextoNaoVem] = useState('');

  const [listaCreditos, setListaCreditos] = useState([]);
  const [novoCreditoForn, setNovoCreditoForn] = useState('');
  const [novoCreditoValor, setNovoCreditoValor] = useState('');
  const [totalCreditosCarteira, setTotalCreditosCarteira] = useState(0);
  const [filtroCredito, setFiltroCredito] = useState('TODOS'); 

  const [fornecedoresGlobais, setFornecedoresGlobais] = useState(() => {
    try {
      const saved = localStorage.getItem('fornecedoresGlobais_telas');
      return saved ? JSON.parse(saved) : ['DIAMONDS', 'ZL CELL', 'ASSUGAR'];
    } catch(e) { return ['DIAMONDS', 'ZL CELL', 'ASSUGAR']; }
  });

  const [opcoes, setOpcoes] = useState(() => {
    try {
      const saved = localStorage.getItem('opcoes_pedidos');
      return saved ? JSON.parse(saved) : {
        statusPagamento: ['PENDENTE', 'PAGO', 'CANCELADO'],
        statusLogistica: ['AGENDAR', 'AGENDADO', 'COLETADO', 'EM TRÂNSITO', 'ENTREGUE'],
        statusPedido: ['EM ANDAMENTO', 'FINALIZADO', 'CANCELADO']
      };
    } catch(e) {
      return {
        statusPagamento: ['PENDENTE', 'PAGO', 'CANCELADO'],
        statusLogistica: ['AGENDAR', 'AGENDADO', 'COLETADO', 'EM TRÂNSITO', 'ENTREGUE'],
        statusPedido: ['EM ANDAMENTO', 'FINALIZADO', 'CANCELADO']
      };
    }
  });

  useEffect(() => { localStorage.setItem('opcoes_pedidos', JSON.stringify(opcoes)); }, [opcoes]);
  useEffect(() => { localStorage.setItem('fornecedoresGlobais_telas', JSON.stringify(fornecedoresGlobais)); }, [fornecedoresGlobais]);
  useEffect(() => { localStorage.setItem('lojasGlobais_telas', JSON.stringify(lojasGlobais)); }, [lojasGlobais]);
  
  useEffect(() => { 
    carregarDados(); 
    carregarCreditos();
  }, [paginaAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/pedidos?page=${paginaAtual}&size=15&_t=${Date.now()}`);
      const dados = response.data?.content || (Array.isArray(response.data) ? response.data : []);
      setPedidos(dados);
      
      const infoPagina = response.data?.page || response.data || {};
      setTotalPaginas(infoPagina.totalPages || 0);
      setTotalRegistros(infoPagina.totalElements || dados.length);

      const resTotais = await api.get(`/pedidos?page=0&size=5000&_t=${Date.now()}`);
      const allData = resTotais.data?.content || (Array.isArray(resTotais.data) ? resTotais.data : []);
      
      const tValor = allData.reduce((acc, curr) => acc + (Number(curr.valorTotalPedido) || 0), 0);
      const tFrete = allData.reduce((acc, curr) => acc + (Number(curr.valorFrete) || 0), 0);
      
      setTotais({ valor: tValor, frete: tFrete });
    } catch (err) {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarCreditos = async () => {
    try {
      const res = await api.get(`/creditos?_t=${Date.now()}`);
      const dados = Array.isArray(res.data) ? res.data : [];
      setListaCreditos(dados);
      const soma = dados.reduce((acc, curr) => acc + (Number(curr.valor || curr.valorCredito) || 0), 0);
      setTotalCreditosCarteira(soma);
    } catch (e) {
      setListaCreditos([]);
    }
  };

  const abrirCreditos = () => { carregarCreditos(); setModalCreditos(true); };

  const handleSalvarCredito = async () => {
    if(!novoCreditoForn) return mostrarToast("Selecione um fornecedor!", "erro");
    try {
      await api.post('/creditos', { nomeFornecedor: novoCreditoForn, valor: Number(novoCreditoValor) || 0 });
      setNovoCreditoForn(''); setNovoCreditoValor('');
      carregarCreditos();
      mostrarToast("Crédito adicionado com sucesso!");
    } catch(e) {}
  };

  const handleExcluirCredito = async (id) => {
    if(window.confirm("Deseja excluir esta carteira de crédito?")) {
      try { await api.delete(`/creditos/${id}`); carregarCreditos(); } catch(e) {}
    }
  };

  const salvarEdicaoCredito = async (id) => {
    try {
      const valorTratado = Number(creditoEditTemp) || 0;
      const item = listaCreditos.find(c => c.id === id);
      await api.post('/creditos', { ...item, valor: valorTratado, valorCredito: valorTratado });
      setEditandoCreditoId(null);
      carregarCreditos();
      mostrarToast("Crédito editado com sucesso!");
    } catch(e) { mostrarToast("Erro ao editar crédito.", "erro"); }
  };

  const confirmarExclusao = async () => {
    if(!modalExcluir) return;
    try {
      await api.delete(`/pedidos/${modalExcluir}`);
      setModalExcluir(null);
      carregarDados();
      mostrarToast("Pedido excluído permanentemente!");
    } catch(e) {}
  };

  const handleChangeSelect = async (id, campo, valor) => {
    if (valor === 'CRIAR_NOVO') {
      const novoStatus = prompt(`Digite o novo status para ${campo.replace('status', '')}:`);
      if (novoStatus && String(novoStatus).trim() !== '') {
        const uppercaseStatus = String(novoStatus).toUpperCase();
        setOpcoes({ ...opcoes, [campo]: [...(opcoes[campo] || []), uppercaseStatus] });
        valor = uppercaseStatus;
      } else return; 
    }
    setPedidos(pedidos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    try { await api.post(`/pedidos/${id}/atualizar`, { [campo]: valor }); } catch (e) {}
  };

  const handleAlterarLoja = async (id, novaLojaSelecionada) => {
    if (novaLojaSelecionada === 'GERENCIAR') {
      setModalLojas(true); return;
    }
    setPedidos(pedidos.map(p => p.id === id ? { ...p, loja: novaLojaSelecionada } : p));
    try { await api.post(`/pedidos/${id}/atualizar`, { loja: novaLojaSelecionada }); } catch (e) {}
  };

  const salvarPdc = async (id, valor) => {
    try {
      setEditandoPdcId(null);
      const valFinal = String(valor).toUpperCase();
      setPedidos(pedidos.map(p => p.id === id ? { ...p, numeroPdc: valFinal } : p));
      await api.post(`/pedidos/${id}/atualizar`, { numeroPdc: valFinal });
      mostrarToast("PDC atualizado!");
    } catch(e) {}
  };

  const salvarFrete = async (id, valor) => {
    try {
      const valorTratado = String(valor).replace(',', '.');
      const valorParaSalvar = Number(valorTratado) || 0;
      setEditandoFreteId(null);
      setPedidos(pedidos.map(p => p.id === id ? { ...p, valorFrete: valorParaSalvar } : p));
      await api.post(`/pedidos/${id}/atualizar`, { valorFrete: valorParaSalvar });
      mostrarToast("Valor do frete salvo!");
      carregarDados(); 
    } catch(e) {}
  };

  const salvarValorPedido = async (id, valor) => {
    try {
      const valorTratado = String(valor).replace(',', '.');
      const valorParaSalvar = Number(valorTratado) || 0;
      setEditandoValorId(null);
      setPedidos(pedidos.map(p => p.id === id ? { ...p, valorTotalPedido: valorParaSalvar } : p));
      await api.post(`/pedidos/${id}/atualizar`, { valorTotalPedido: valorParaSalvar });
      mostrarToast("Valor do pedido salvo!");
      carregarDados(); 
    } catch(e) {}
  };

  const salvarExtratoFinanceiro = async (campo) => {
    try {
      const valorTratado = Number(String(valorTempExtrato).replace(',', '.')) || 0;
      const pedidoAtualizado = { ...modalDetalhes };

      if (campo === 'pedido') pedidoAtualizado.valorTotalPedido = valorTratado;
      if (campo === 'frete') pedidoAtualizado.valorFrete = valorTratado;
      if (campo === 'credito') pedidoAtualizado.creditoUtilizado = valorTratado;

      pedidoAtualizado.valorPagarFinal = Math.max(0, 
        (pedidoAtualizado.valorTotalPedido || 0) + 
        (pedidoAtualizado.valorFrete || 0) - 
        (pedidoAtualizado.creditoUtilizado || 0)
      );

      setModalDetalhes(pedidoAtualizado);
      setEditandoExtrato(null);
      setPedidos(pedidos.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));

      await api.post(`/pedidos`, pedidoAtualizado);
      carregarDados();
      carregarCreditos(); 
      mostrarToast("Extrato financeiro atualizado com sucesso!");
    } catch (e) {}
  };

  const processarNaoVemAutomatico = async () => {
    if(!textoNaoVem || String(textoNaoVem).trim() === '') return mostrarToast("Cole a mensagem do fornecedor primeiro!", "erro");
    const pedidoAtualizado = { ...modalDetalhes };
    let alterado = false;
    const linhasFornecedor = String(textoNaoVem).split('\n').map(l => l.trim().toUpperCase()).filter(l => l.length > 0);

    const itensLista = Array.isArray(pedidoAtualizado.itens) ? pedidoAtualizado.itens : [];
    itensLista.forEach(item => {
      const descItem = String(item.descricaoLimpa || item.descricao || '').toUpperCase();
      const achou = linhasFornecedor.some(linha => linha.includes(descItem) || descItem.includes(linha));
      if (achou && !item.naoVem) { item.naoVem = true; alterado = true; }
    });

    if (alterado) {
      const novoBruto = itensLista.reduce((acc, curr) => curr.naoVem ? acc : acc + (curr.subtotal || 0), 0);
      pedidoAtualizado.valorTotalPedido = novoBruto;
      pedidoAtualizado.valorPagarFinal = Math.max(0, novoBruto + (pedidoAtualizado.valorFrete || 0) - (pedidoAtualizado.creditoUtilizado || 0));
      setModalDetalhes(pedidoAtualizado);
      try {
        await api.post(`/pedidos`, pedidoAtualizado);
        carregarDados();
        mostrarToast("Faltas marcadas com sucesso pelo texto!");
      } catch(e) {}
    } else {
      mostrarToast("Nenhum item da lista bateu com o pedido.", "erro");
    }
    setModalTextoNaoVem(false);
    setTextoNaoVem('');
  };

  const alternarFaltaManual = async (indexItem) => {
    const pedidoAtualizado = { ...modalDetalhes };
    const itensLista = Array.isArray(pedidoAtualizado.itens) ? pedidoAtualizado.itens : [];
    const item = itensLista[indexItem];
    if (item) {
      item.naoVem = !item.naoVem;
      const novoBruto = itensLista.reduce((acc, curr) => curr.naoVem ? acc : acc + (curr.subtotal || 0), 0);
      pedidoAtualizado.valorTotalPedido = novoBruto;
      pedidoAtualizado.valorPagarFinal = Math.max(0, novoBruto + (pedidoAtualizado.valorFrete || 0) - (pedidoAtualizado.creditoUtilizado || 0));

      setModalDetalhes(pedidoAtualizado);
      try { await api.post(`/pedidos`, pedidoAtualizado); carregarDados(); } catch(e) {}
    }
  };

  const gerarZap = () => {
    const itensLista = Array.isArray(modalDetalhes?.itens) ? modalDetalhes.itens : [];
    if(itensLista.length === 0) return mostrarToast("Nenhum item salvo neste pedido!", "erro");
    let texto = `*PEDIDO ${modalDetalhes.nomeFornecedor}*\n`;
    texto += `PDC: ${modalDetalhes.numeroPdc || 'S/N'}\n\n`;
    itensLista.forEach(item => {
      if (!item.naoVem) texto += ` ${item.quantidadePedida || item.quantidade || 0}  ${item.descricaoLimpa || item.descricao || 'Produto'}\n`;
    });
    texto += `\n*Valor Total:* ${formatMoney(modalDetalhes.valorPagarFinal || modalDetalhes.valorTotalPedido)}`;
    navigator.clipboard.writeText(texto);
    mostrarToast("Lista copiada para o WhatsApp com sucesso!");
  };

  // ============================================================================
  // 🔥 MOTOR GERADOR DE PDF - PROPORÇÕES MATEMÁTICAS EXATAS E TRANSPARÊNCIA
  // ============================================================================
  const gerarPDF = async () => {
    if (!modalDetalhes) return;

    try {
      const doc = new jsPDF();

      // Carrega a imagem nativa
      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      // 🔥 MÁGICA: Converte WEBP e PNGs bugados para um PNG 100% Transparente via Canvas
      const getTransparentDataUrl = (img) => {
        if (!img) return null;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png'); // Força transparência limpa
      };

      const logoZl = await loadImage('/zl.png.png');
      const logoBemerguy = await loadImage('/bemerguy.png.png');
      const logoDiamonds = await loadImage('/diamonds.png.webp');

      // 1. Renderiza ZL CELL (Esquerda) - Mantendo a proporção
      if (logoZl) {
        const proporcaoZl = logoZl.height / logoZl.width;
        const larguraZl = 25;
        doc.addImage(getTransparentDataUrl(logoZl), 'PNG', 14, 10, larguraZl, larguraZl * proporcaoZl);
      }

      // 2. Renderiza BEMERGUY (Centro) - Mantendo a proporção sem amassar
      if (logoBemerguy) {
        const proporcaoBem = logoBemerguy.height / logoBemerguy.width;
        const larguraBem = 35; // Um tamanho agradável e imponente
        const alturaBem = larguraBem * proporcaoBem;
        const xCentralizado = 105 - (larguraBem / 2); // 105 é o centro exato da folha A4 (210mm)
        doc.addImage(getTransparentDataUrl(logoBemerguy), 'PNG', xCentralizado, 8, larguraBem, alturaBem); 
      }

      // 3. Renderiza DIAMONDS (Direita) - Fundo transparente e proporção exata
      if (logoDiamonds) {
        const proporcaoDia = logoDiamonds.height / logoDiamonds.width;
        const larguraDia = 25;
        const alturaDia = larguraDia * proporcaoDia;
        const xDereita = 196 - larguraDia; // 196 é a margem direita limite
        doc.addImage(getTransparentDataUrl(logoDiamonds), 'PNG', xDereita, 10, larguraDia, alturaDia);
      }

      // Informações do Pedido (Empurradas para Y=45 para desviar de logos muito altas)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`PEDIDO N° ${modalDetalhes.numeroPdc || 'S/N'}`, 14, 50);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(modalDetalhes.loja || 'WILL RICARDO BELEM', 14, 57);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const dataHora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
      doc.text(dataHora, 14, 63);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 67, 196, 67);

      const itensLista = Array.isArray(modalDetalhes.itens) ? modalDetalhes.itens : [];
      const itensFiltrados = itensLista.filter(item => !item.naoVem);

      const tableData = itensFiltrados.map(item => [
        item.quantidadePedida || item.quantidade || 0,
        item.descricaoLimpa || item.descricao || 'PRODUTO DESCONHECIDO',
        formatMoney(item.valorUnitario || 0),
        formatMoney(item.subtotal || 0)
      ]);

      autoTable(doc, {
        startY: 72,
        head: [['QUANT.', 'DESCRIÇÃO DO PRODUTO', 'Vl. UNIT', 'VL.TOTAL']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [17, 26, 44], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          halign: 'center' 
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 }
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          textColor: [50, 50, 50],
          valign: 'middle'
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      
      const textoTotal = `Total Do Pedido: ${formatMoney(modalDetalhes.valorPagarFinal || modalDetalhes.valorTotalPedido)}`;
      const textWidth = doc.getTextWidth(textoTotal);
      
      doc.setFillColor(241, 245, 249);
      doc.rect(196 - textWidth - 5, finalY - 6, textWidth + 10, 10, 'F');
      
      doc.text(textoTotal, 196 - textWidth, finalY);

      const nomeLimpo = (modalDetalhes.loja || 'PEDIDO').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Pedido_${modalDetalhes.numeroPdc || 'SN'}_${nomeLimpo}.pdf`);
      
      mostrarToast("PDF gerado e baixado com sucesso!");
    } catch (error) {
      console.error(error);
      mostrarToast("Erro ao gerar PDF. O arquivo das imagens pode estar corrompido.", "erro");
    }
  };

  const pedidosSeguros = Array.isArray(pedidos) ? pedidos : [];
  const pedidosFiltrados = pedidosSeguros.filter(p => {
    if (!p) return false;
    const termo = busca.toLowerCase();
    const matchBusca = String(p.numeroPdc || '').toLowerCase().includes(termo) || String(p.nomeFornecedor || '').toLowerCase().includes(termo);
    const matchForn = filtroTabela.fornecedor === 'TODOS' || String(p.nomeFornecedor).toUpperCase() === filtroTabela.fornecedor;
    const matchPag = filtroTabela.pagamento === 'TODOS' || p.statusPagamento === filtroTabela.pagamento;
    const matchLog = filtroTabela.logistica === 'TODOS' || p.statusLogistica === filtroTabela.logistica;
    const matchPed = filtroTabela.pedido === 'TODOS' || p.statusPedido === filtroTabela.pedido;
    return matchBusca && matchForn && matchPag && matchLog && matchPed;
  });

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const creditosFiltrados = listaCreditos.filter(c => filtroCredito === 'TODOS' || c.nomeFornecedor === filtroCredito);
  const unicosFornecedores = [...new Set(pedidosSeguros.map(p => String(p.nomeFornecedor).toUpperCase()))];

  useEffect(() => {
    const handleClickFora = () => { setFiltroAberto(null); };
    if (filtroAberto) {
        window.addEventListener('click', handleClickFora);
    }
    return () => window.removeEventListener('click', handleClickFora);
  }, [filtroAberto]);

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200 relative">
      
      {toast.visivel && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-200 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <ShoppingCart className="text-emerald-400" size={32} /> PEDIDOS DE COMPRAS
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 ml-11">
            Controle e rastreio de aquisições, financeiro e logística.
          </p>
        </div>
      </div>

      {/* CARDS DE TOTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500"></div>
          <p className="text-xs font-black text-slate-400 uppercase mb-2">Total Valor Pedido</p>
          <h2 className="text-3xl font-black text-white">{formatMoney(totais.valor)}</h2>
        </div>
        <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500"></div>
          <p className="text-xs font-black text-amber-500 uppercase mb-2">Total Frete Gasto</p>
          <h2 className="text-3xl font-black text-amber-400">{formatMoney(totais.frete)}</h2>
        </div>
        <div onClick={abrirCreditos} className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden shadow-lg flex justify-between items-center group cursor-pointer hover:border-blue-500/50 transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
          <div>
            <p className="text-xs font-black text-blue-500 uppercase mb-2">Carteira de Crédito Global</p>
            <h2 className="text-3xl font-black text-blue-400">{formatMoney(totalCreditosCarteira)}</h2>
          </div>
          <div className="p-2 bg-slate-800 rounded-full group-hover:bg-blue-600 transition-colors">
            <ChevronRight size={20} className="text-slate-300 group-hover:text-white" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Relação de Compras ({totalRegistros} Registros)
        </h3>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar PDC ou fornecedor..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#111A2C] border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* TABELA PRINCIPAL */}
      <div className="flex-1 bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#0E1525] text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="p-4 text-center">Ordem</th>
                
                <th className="p-4 relative">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'fornecedor' ? null : 'fornecedor'); }}>
                    Fornecedor <Filter size={12} className={filtroTabela.fornecedor !== 'TODOS' ? 'text-blue-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'fornecedor' && (
                    <div className="absolute top-full left-4 mt-1 bg-[#0B1120] border border-blue-900 rounded-xl shadow-2xl py-2 z-50 min-w-45">
                      <div onClick={() => setFiltroTabela({...filtroTabela, fornecedor: 'TODOS'})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300">TODOS</div>
                      {unicosFornecedores.map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, fornecedor: f})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase">{f}</div>
                      ))}
                    </div>
                  )}
                </th>
                
                <th className="p-4 text-center relative">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'pagamento' ? null : 'pagamento'); }}>
                    Pagamento <Filter size={12} className={filtroTabela.pagamento !== 'TODOS' ? 'text-blue-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'pagamento' && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#0B1120] border border-blue-900 rounded-xl shadow-2xl py-2 z-50 min-w-37.5">
                      <div onClick={() => setFiltroTabela({...filtroTabela, pagamento: 'TODOS'})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 text-left">TODOS</div>
                      {(opcoes.statusPagamento || []).map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, pagamento: f})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase text-left">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center relative">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'logistica' ? null : 'logistica'); }}>
                    Logística <Filter size={12} className={filtroTabela.logistica !== 'TODOS' ? 'text-blue-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'logistica' && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#0B1120] border border-blue-900 rounded-xl shadow-2xl py-2 z-50 min-w-37.5">
                      <div onClick={() => setFiltroTabela({...filtroTabela, logistica: 'TODOS'})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 text-left">TODOS</div>
                      {(opcoes.statusLogistica || []).map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, logistica: f})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase text-left">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center relative">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setFiltroAberto(filtroAberto === 'pedido' ? null : 'pedido'); }}>
                    Pedido <Filter size={12} className={filtroTabela.pedido !== 'TODOS' ? 'text-blue-400' : 'text-slate-600'}/>
                  </div>
                  {filtroAberto === 'pedido' && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#0B1120] border border-blue-900 rounded-xl shadow-2xl py-2 z-50 min-w-37.5">
                      <div onClick={() => setFiltroTabela({...filtroTabela, pedido: 'TODOS'})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 text-left">TODOS</div>
                      {(opcoes.statusPedido || []).map(f => (
                        <div key={f} onClick={() => setFiltroTabela({...filtroTabela, pedido: f})} className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300 uppercase text-left">{f}</div>
                      ))}
                    </div>
                  )}
                </th>

                <th className="p-4 text-center">Loja</th>
                <th className="p-4 text-center">PDC (DUPLO CLIQUE)</th>
                <th className="p-4 text-center">Mês / Data</th>
                <th className="p-4 text-right text-emerald-400">V. Pedido</th>
                <th className="p-4 text-right text-amber-500">Frete</th>
                <th className="p-4 text-right text-cyan-400">Total (Ped+Frete)</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-[11px] font-bold">
              {pedidosFiltrados.map((pedido) => {
                const dataFormatada = (pedido.dataPedido || pedido.data || pedido.criadoEm || pedido.dataCriacao) 
                  ? new Date(pedido.dataPedido || pedido.data || pedido.criadoEm || pedido.dataCriacao).toLocaleDateString('pt-BR') 
                  : '-';

                return (
                  <tr key={pedido.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="p-4 text-center text-slate-500 font-black">#{pedido.ordem || '-'}</td>
                    <td className="p-4 text-white uppercase">{pedido.nomeFornecedor}</td>
                    
                    <td className="p-4 text-center">
                      <select value={pedido.statusPagamento || ''} onChange={(e) => handleChangeSelect(pedido.id, 'statusPagamento', e.target.value)} className="bg-[#0B1120] border border-emerald-900 text-emerald-400 font-black text-[10px] uppercase rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-emerald-500">
                        <option value="" disabled>Status...</option>
                        {(opcoes.statusPagamento || []).map(opt => <option className="bg-[#0E1525] text-white" key={opt} value={opt}>{opt}</option>)}
                        <option className="bg-emerald-900 text-white font-black" value="CRIAR_NOVO">➕ CRIAR NOVO...</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <select value={pedido.statusLogistica || ''} onChange={(e) => handleChangeSelect(pedido.id, 'statusLogistica', e.target.value)} className="bg-[#0B1120] border border-blue-900 text-blue-400 font-black text-[10px] uppercase rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-blue-500">
                        <option value="" disabled>Logística...</option>
                        {(opcoes.statusLogistica || []).map(opt => <option className="bg-[#0E1525] text-white" key={opt} value={opt}>{opt}</option>)}
                        <option className="bg-blue-900 text-white font-black" value="CRIAR_NOVO">➕ CRIAR NOVO...</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <select value={pedido.statusPedido || ''} onChange={(e) => handleChangeSelect(pedido.id, 'statusPedido', e.target.value)} className="bg-[#0B1120] border border-fuchsia-900 text-fuchsia-400 font-black text-[10px] uppercase rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-fuchsia-500">
                        <option value="" disabled>Pedido...</option>
                        {(opcoes.statusPedido || []).map(opt => <option className="bg-[#0E1525] text-white" key={opt} value={opt}>{opt}</option>)}
                        <option className="bg-fuchsia-900 text-white font-black" value="CRIAR_NOVO">➕ CRIAR NOVO...</option>
                      </select>
                    </td>

                    <td className="p-4 text-center">
                      {(!pedido.loja || String(pedido.loja).trim() === '') ? (
                        <select
                           value=""
                           onChange={(e) => handleAlterarLoja(pedido.id, e.target.value)}
                           className="bg-rose-500/20 text-rose-400 border border-rose-500 hover:bg-rose-500 hover:text-white px-2 py-1 rounded-md text-[10px] uppercase font-black animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all cursor-pointer outline-none appearance-none text-center"
                        >
                          <option value="" disabled>S / LOJA (CADASTRAR)</option>
                          {lojasGlobais.map(l => <option className="bg-[#0B1120] text-emerald-400" key={l} value={l}>{l}</option>)}
                          <option className="bg-[#0B1120] text-cyan-400" value="GERENCIAR">⚙️ GERENCIAR LOJAS</option>
                        </select>
                      ) : (
                        <select
                           value={pedido.loja}
                           onChange={(e) => handleAlterarLoja(pedido.id, e.target.value)}
                           className="bg-transparent text-emerald-400 font-black text-xs uppercase outline-none cursor-pointer text-center appearance-none hover:bg-slate-800 rounded px-2 py-1"
                        >
                           {lojasGlobais.map(l => <option className="bg-[#0B1120]" key={l} value={l}>{l}</option>)}
                           <option className="bg-[#0B1120] text-cyan-400" value="GERENCIAR">⚙️ GERENCIAR LOJAS</option>
                        </select>
                      )}
                    </td>

                    <td className="p-4 text-center cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => { setEditandoPdcId(pedido.id); setPdcTemp(pedido.numeroPdc || ''); }}>
                      {editandoPdcId === pedido.id ? (
                        <div className="flex gap-2 justify-center items-center">
                          <input 
                            type="text" autoFocus value={pdcTemp} 
                            onChange={e => setPdcTemp(e.target.value)} 
                            onKeyDown={e => {if(e.key === 'Enter') salvarPdc(pedido.id, pdcTemp)}} 
                            className="w-20 bg-[#0B1120] text-blue-400 border border-blue-500/50 rounded p-1 text-center outline-none uppercase" 
                          />
                          <button onClick={(e) => { e.stopPropagation(); salvarPdc(pedido.id, pdcTemp); }} className="text-emerald-500 hover:text-emerald-400"><Check size={16}/></button>
                        </div>
                      ) : (!pedido.numeroPdc || String(pedido.numeroPdc).trim() === '') ? (
                        <button onClick={() => { setEditandoPdcId(pedido.id); setPdcTemp(''); }} className="bg-rose-500/20 text-rose-400 border border-rose-500 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-md text-[10px] uppercase font-black animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all">
                          S / PDC
                        </button>
                      ) : (
                        <span className="font-black text-blue-400 text-sm">{pedido.numeroPdc}</span>
                      )}
                    </td>

                    <td className="p-4 text-center text-slate-400 uppercase">{pedido.mes || '-'} <br/> <span className="text-[9px]">{dataFormatada}</span></td>
                    
                    <td className="p-4 text-right text-emerald-400 font-black cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => { setEditandoValorId(pedido.id); setValorPedidoTemp(pedido.valorTotalPedido || ''); }}>
                      {editandoValorId === pedido.id ? (
                        <div className="flex gap-2 justify-end items-center">
                          <input 
                            type="number" autoFocus value={valorPedidoTemp} 
                            onChange={e => setValorPedidoTemp(e.target.value)} 
                            onKeyDown={e => {if(e.key === 'Enter') salvarValorPedido(pedido.id, valorPedidoTemp)}} 
                            className="w-24 bg-[#0B1120] text-emerald-400 border border-emerald-500/50 rounded p-1 text-right outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                          <button onClick={(e) => { e.stopPropagation(); salvarValorPedido(pedido.id, valorPedidoTemp); }} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition-colors shadow-md">
                            <Save size={14}/>
                          </button>
                        </div>
                      ) : formatMoney(pedido.valorTotalPedido)}
                    </td>

                    <td className="p-4 text-right text-amber-400 font-black cursor-pointer hover:bg-slate-800/50" onDoubleClick={() => { setEditandoFreteId(pedido.id); setValorFreteTemp(pedido.valorFrete || ''); }}>
                      {editandoFreteId === pedido.id ? (
                        <div className="flex gap-2 justify-end items-center">
                          <input 
                            type="number" autoFocus value={valorFreteTemp} 
                            onChange={e => setValorFreteTemp(e.target.value)} 
                            onKeyDown={e => {if(e.key === 'Enter') salvarFrete(pedido.id, valorFreteTemp)}} 
                            className="w-20 bg-[#0B1120] text-amber-400 border border-amber-500/50 rounded p-1 text-right outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                          <button onClick={(e) => { e.stopPropagation(); salvarFrete(pedido.id, valorFreteTemp); }} className="bg-amber-600 hover:bg-amber-500 text-slate-900 p-1.5 rounded transition-colors shadow-md">
                            <Save size={14}/>
                          </button>
                        </div>
                      ) : formatMoney(pedido.valorFrete)}
                    </td>

                    <td className="p-4 text-right text-cyan-400 font-black bg-[#111827]/40 border-l border-[#1E293B]">
                      {formatMoney((Number(pedido.valorTotalPedido) || 0) + (Number(pedido.valorFrete) || 0))}
                    </td>
                    
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModalDetalhes(pedido)} className="bg-emerald-900/40 border border-emerald-900 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5">
                          <Eye size={14} /> DETALHES
                        </button>
                        <button onClick={() => setModalExcluir(pedido.id)} className="bg-rose-900/20 border border-rose-900/50 hover:bg-rose-600 text-rose-500 hover:text-white p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ */}
        {!loading && (
          <div className="bg-[#0B1120] border-t border-[#1E293B] p-4 flex items-center justify-between mt-auto shrink-0">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Página <span className="text-emerald-400">{paginaAtual + 1}</span> de {Math.max(totalPaginas, 1)}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 0))} disabled={paginaAtual === 0} className="p-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"><ChevronLeft size={18} /></button>
              <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas - 1))} disabled={paginaAtual >= totalPaginas - 1 || totalPaginas <= 1} className="p-2 rounded-xl bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================
          MODAL DETALHES DO PEDIDO
      ====================================================================== */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-[#111A2C]">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl"><ShoppingCart size={28} /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                    Detalhes do Pedido - {modalDetalhes.nomeFornecedor}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">PDC: {modalDetalhes.numeroPdc || 'S/N'}</span>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">Status: {modalDetalhes.statusPedido}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setModalDetalhes(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="px-6 py-4 bg-[#0B1120] border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={gerarZap} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30 flex-1 md:flex-none">
                  <MessageSquareDiff size={16}/> Gerar Zap
                </button>
                
                <button onClick={gerarPDF} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/30 flex-1 md:flex-none">
                  <FileText size={16}/> Gerar PDF
                </button>

              </div>

              <div className="flex flex-1 md:flex-none items-center justify-end w-full md:w-auto">
                <button onClick={() => setModalTextoNaoVem(true)} className="bg-rose-900/40 border border-rose-600/50 hover:bg-rose-600 text-rose-400 hover:text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase flex items-center gap-2 whitespace-nowrap transition-all shadow-lg shadow-rose-900/30">
                  <MessageSquareDiff size={16}/> MENSAGEM DO FORNECEDOR (FALTAS)
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#0B1120] p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-black">Produto</th>
                    <th className="pb-3 font-black text-center">Qtd</th>
                    <th className="pb-3 font-black text-right">V. Unitário</th>
                    <th className="pb-3 font-black text-right">Total</th>
                    <th className="pb-3 font-black text-center">Ações ("Não Vem")</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(!modalDetalhes.itens || modalDetalhes.itens.length === 0) ? (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-500 font-bold">Nenhum item salvo neste pedido.</td></tr>
                  ) : (
                    modalDetalhes.itens.map((item, index) => (
                      <tr key={index} className={`font-bold transition-colors ${item.naoVem ? 'bg-rose-900/10 text-rose-500' : 'text-slate-300 hover:bg-slate-800/30'}`}>
                        <td className="py-4 flex items-center gap-2">
                          {item.naoVem && <AlertOctagon size={14} className="text-rose-500" />}
                          <span className={item.naoVem ? 'line-through opacity-70 text-rose-400' : 'text-cyan-400'}>{item.descricaoLimpa || item.descricao || item.produtoId}</span>
                        </td>
                        <td className="py-4 text-center">{item.quantidadePedida || item.quantidade || 0}</td>
                        <td className="py-4 text-right">{formatMoney(item.valorUnitario || 0)}</td>
                        <td className="py-4 text-right">{formatMoney(item.subtotal || 0)}</td>
                        <td className="py-4 text-center">
                          <button 
                            onClick={() => alternarFaltaManual(index)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors shadow-md ${item.naoVem ? 'bg-rose-600 text-white shadow-rose-900/50' : 'bg-transparent border border-slate-600 text-slate-400 hover:border-rose-500 hover:text-rose-400'}`}
                          >
                            {item.naoVem ? 'FALTOU' : 'Marcar Falta'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-800 bg-[#111A2C] flex flex-col gap-5">
              
              <div className="flex justify-between items-center bg-[#0B1120] p-4 rounded-xl border border-slate-800 flex-wrap gap-4">
                 
                 <div className="text-center flex flex-col items-center min-w-30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Valor Pedido (Bruto)</p>
                      <button onClick={() => { setEditandoExtrato('pedido'); setValorTempExtrato(modalDetalhes.valorTotalPedido || 0); }} className="text-slate-600 hover:text-emerald-400 transition-colors"><Edit2 size={12}/></button>
                    </div>
                    {editandoExtrato === 'pedido' ? (
                      <div className="flex items-center gap-1">
                        <input type="number" autoFocus value={valorTempExtrato} onChange={e => setValorTempExtrato(e.target.value)} onKeyDown={e => {if(e.key==='Enter') salvarExtratoFinanceiro('pedido')}} className="w-20 bg-[#111A2C] text-slate-300 border border-emerald-500/50 rounded py-0.5 px-1 text-center text-xs font-black outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={() => salvarExtratoFinanceiro('pedido')} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded"><Check size={12}/></button>
                        <button onClick={() => setEditandoExtrato(null)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"><X size={12}/></button>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-slate-300">{formatMoney(modalDetalhes.valorTotalPedido)}</p>
                    )}
                 </div>

                 <div className="text-slate-600 font-black">+</div>
                 
                 <div className="text-center flex flex-col items-center min-w-25">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Frete Gasto</p>
                      <button onClick={() => { setEditandoExtrato('frete'); setValorTempExtrato(modalDetalhes.valorFrete || 0); }} className="text-slate-600 hover:text-amber-400 transition-colors"><Edit2 size={12}/></button>
                    </div>
                    {editandoExtrato === 'frete' ? (
                      <div className="flex items-center gap-1">
                        <input type="number" autoFocus value={valorTempExtrato} onChange={e => setValorTempExtrato(e.target.value)} onKeyDown={e => {if(e.key==='Enter') salvarExtratoFinanceiro('frete')}} className="w-16 bg-[#111A2C] text-amber-400 border border-amber-500/50 rounded py-0.5 px-1 text-center text-xs font-black outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={() => salvarExtratoFinanceiro('frete')} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded"><Check size={12}/></button>
                        <button onClick={() => setEditandoExtrato(null)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"><X size={12}/></button>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-amber-400">{formatMoney(modalDetalhes.valorFrete)}</p>
                    )}
                 </div>

                 <div className="text-slate-600 font-black">-</div>
                 
                 <div className="text-center flex flex-col items-center min-w-30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Crédito Abatido</p>
                      <button onClick={() => { setEditandoExtrato('credito'); setValorTempExtrato(modalDetalhes.creditoUtilizado || 0); }} className="text-slate-600 hover:text-rose-400 transition-colors"><Edit2 size={12}/></button>
                    </div>
                    {editandoExtrato === 'credito' ? (
                      <div className="flex items-center gap-1">
                        <input type="number" autoFocus value={valorTempExtrato} onChange={e => setValorTempExtrato(e.target.value)} onKeyDown={e => {if(e.key==='Enter') salvarExtratoFinanceiro('credito')}} className="w-20 bg-[#111A2C] text-rose-400 border border-rose-500/50 rounded py-0.5 px-1 text-center text-xs font-black outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={() => salvarExtratoFinanceiro('credito')} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded"><Check size={12}/></button>
                        <button onClick={() => setEditandoExtrato(null)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"><X size={12}/></button>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-rose-400">{formatMoney(modalDetalhes.creditoUtilizado)}</p>
                    )}
                 </div>

              </div>

              <div className="flex justify-between items-end">
                <button onClick={() => setModalDetalhes(null)} className="text-slate-400 hover:text-white px-8 py-3 rounded-xl font-black text-xs transition-colors bg-[#0B1120] border border-slate-800 hover:bg-slate-800 uppercase tracking-widest">
                  FECHAR JANELA
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Final (A Pagar)</p>
                  <h3 className="text-3xl font-black text-emerald-400">
                    {formatMoney(modalDetalhes.valorPagarFinal || 0)}
                  </h3>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* OUTROS MODAIS CONTINUAM AQUI... */}
      
      {/* MODAL GERENCIAR LOJAS */}
      {modalLojas && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111A2C]">
               <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                 <Store size={16} /> Gerenciar Lojas
               </h2>
               <button onClick={() => setModalLojas(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <input type="text" value={novaLojaCadastrar} onChange={e => setNovaLojaCadastrar(e.target.value.toUpperCase())} placeholder="NOME DA LOJA..." className="flex-1 bg-[#0B1120] border border-slate-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-cyan-500" />
                <button onClick={() => { if(novaLojaCadastrar && !lojasGlobais.includes(novaLojaCadastrar)) { setLojasGlobais([...lojasGlobais, novaLojaCadastrar]); setNovaLojaCadastrar(''); } }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl font-black transition-colors"><Plus size={16} /></button>
              </div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {lojasGlobais.map(l => (
                  <div key={l} className="flex justify-between items-center bg-[#111A2C] border border-slate-800 p-3 rounded-xl">
                    <span className="text-xs font-black text-slate-300 uppercase">{l}</span>
                    <button onClick={() => setLojasGlobais(lojasGlobais.filter(loja => loja !== l))} className="text-rose-500 hover:text-rose-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExcluir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#0E1525] border border-rose-900 rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.15)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Excluir Pedido?</h2>
              <p className="text-sm text-slate-400 font-bold mb-6">
                Tem certeza que deseja excluir este pedido? Esta ação <span className="text-rose-400">não pode ser desfeita</span>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalExcluir(null)} className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-white font-black py-3 rounded-xl transition-colors">CANCELAR</button>
                <button onClick={confirmarExclusao} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-rose-900/50">SIM, EXCLUIR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MENSAGEM ZAP */}
      {modalTextoNaoVem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#0E1525] border border-rose-900 rounded-2xl shadow-[0_0_40px_rgba(225,29,72,0.2)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111A2C]">
               <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                 <AlertOctagon size={16} /> Ler Mensagem do Fornecedor
               </h2>
               <button onClick={() => setModalTextoNaoVem(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-400 font-bold mb-4">
                Cole abaixo a mensagem do WhatsApp enviada pelo fornecedor listando os itens que estão em falta. O sistema riscará automaticamente da lista de pedidos.
              </p>
              <textarea 
                value={textoNaoVem} 
                onChange={e => setTextoNaoVem(e.target.value)} 
                placeholder="Exemplo:&#10;IPXR&#10;IP 11 OLED&#10;... (não vem)" 
                className="w-full bg-[#0B1120] border border-rose-900/50 text-white font-bold rounded-xl p-4 h-48 outline-none focus:border-rose-500 resize-none custom-scrollbar placeholder-slate-600"
              />
              <button onClick={processarNaoVemAutomatico} className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl uppercase tracking-widest transition-colors shadow-lg shadow-rose-900/50 flex items-center justify-center gap-2">
                APLICAR FALTAS E ABATER VALOR <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}