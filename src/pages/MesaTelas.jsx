import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Columns, Store, ShoppingCart, 
  Sparkles, Search, Loader2, Save, X, Trash2, Plus,
  CheckCircle, BellRing, AlertCircle, ChevronDown, Eye, EyeOff, Filter, ArrowDown, ArrowUp
} from 'lucide-react';
import api from '../services/api';

export default function MesaTelas() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const ITENS_POR_PAGINA = 50; 

  const [modalAtivo, setModalAtivo] = useState(null);
  const [modalDeleteMesa, setModalDeleteMesa] = useState({ open: false, id: null }); 
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  // 🔥 ESTADOS DOS FILTROS ESTILO EXCEL
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(null);
  const [filtrosNumericos, setFiltrosNumericos] = useState({});
  const [ordenacao, setOrdenacao] = useState({ coluna: null, direcao: null }); 

  // 🔥 VISIBILIDADE DAS COLUNAS DA DIREITA
  const [visibilidadeColunas, setVisibilidadeColunas] = useState(() => {
    const saved = localStorage.getItem('visibilidade_colunas_telas_v4');
    return saved ? JSON.parse(saved) : {
      v_mes: true, v_sem: true, media_sem: true,
      diam_estq: true, zl_estq: true, diam_tot: true, zl_tot: true,
      fisico: true, a_caminho: true, total_nosso: true,
      zl_c_ant: true, zl_c_atual_sd: true, zl_c_atual_cd: true, zl_dif: true,
      dif_diam_zl: true, diam_c_ant: true, diam_c_atual: true, diam_dif: true,
      v_unit_edit: true
    };
  });

  const toggleVisibilidade = (chave) => {
    setVisibilidadeColunas(prev => ({ ...prev, [chave]: prev[chave] === undefined ? false : !prev[chave] }));
  };

  const isVisible = (chave) => visibilidadeColunas[chave] !== false; 

  // 🔥 CONTROLE DOS FORNECEDORES (MEMÓRIA LIMPA V4)
  const [fornecedoresGlobais, setFornecedoresGlobais] = useState(() => {
    const saved = localStorage.getItem('fornecedoresGlobais_telas_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [colunasCodVisiveis, setColunasCodVisiveis] = useState(() => {
    const saved = localStorage.getItem('colunas_cod_visiveis_telas_v4');
    return saved ? JSON.parse(saved) : {};
  });

  const [coresFornecedores, setCoresFornecedores] = useState(() => {
    const saved = localStorage.getItem('cores_fornecedores_telas_v4');
    return saved ? JSON.parse(saved) : { DIAMONDS: 'text-amber-400', ZL: 'text-blue-400', ASSUGAR: 'text-emerald-400' };
  });

  const [lojasGlobais, setLojasGlobais] = useState(() => {
    const saved = localStorage.getItem('lojasGlobais_telas');
    return saved ? JSON.parse(saved) : ['MATRIZ'];
  });
  
  const [lojaSelecionada, setLojaSelecionada] = useState('');
  const [novaLoja, setNovaLoja] = useState('');
  const [menuLojaAberto, setMenuLojaAberto] = useState(false);

  // Efeitos para salvar no LocalStorage
  useEffect(() => { localStorage.setItem('visibilidade_colunas_telas_v4', JSON.stringify(visibilidadeColunas)); }, [visibilidadeColunas]);
  useEffect(() => { localStorage.setItem('fornecedoresGlobais_telas_v4', JSON.stringify(fornecedoresGlobais)); }, [fornecedoresGlobais]);
  useEffect(() => { localStorage.setItem('colunas_cod_visiveis_telas_v4', JSON.stringify(colunasCodVisiveis)); }, [colunasCodVisiveis]);
  useEffect(() => { localStorage.setItem('cores_fornecedores_telas_v4', JSON.stringify(coresFornecedores)); }, [coresFornecedores]);
  useEffect(() => { localStorage.setItem('lojasGlobais_telas', JSON.stringify(lojasGlobais)); }, [lojasGlobais]);

  const [marcasDisponiveis, setMarcasDisponiveis] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('TODAS');
  
  const opcoesFornecedorAtivo = Array.from(new Set(['DIAMONDS', 'ZL', ...fornecedoresGlobais]));
  const [fornecedorAtivo, setFornecedorAtivo] = useState('DIAMONDS');

  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [numeroPdc, setNumeroPdc] = useState('');
  const [creditoUtilizado, setCreditoUtilizado] = useState('');
  const [saldoCreditoDisponivel, setSaldoCreditoDisponivel] = useState(0);

  const [editandoCustosId, setEditandoCustosId] = useState(null);
  const [custosForm, setCustosForm] = useState({ custosAtuais: {}, valorUnitarioDecidido: '' });

  const [novoProduto, setNovoProduto] = useState({ descricaoLimpa: '', codigos: {}, custos: {}, quantidades: {} });
  const [fornModalRapido, setFornModalRapido] = useState('');

  const paletaCores = [
    { nome: 'Amarelo', classe: 'text-amber-400' }, { nome: 'Azul', classe: 'text-blue-400' },
    { nome: 'Verde', classe: 'text-emerald-400' }, { nome: 'Rosa', classe: 'text-fuchsia-400' },
    { nome: 'Vermelho', classe: 'text-rose-400' }, { nome: 'Laranja', classe: 'text-orange-400' },
    { nome: 'Ciano', classe: 'text-cyan-400' },
  ];

  useEffect(() => { setPaginaAtual(0); }, [busca, filtroMarca]);
  useEffect(() => { carregarMesa(); carregarCreditoFornecedor(); }, [paginaAtual, busca, filtroMarca, fornecedorAtivo]);
  useEffect(() => { carregarMarcasGlobais(); }, [modalAtivo]);

  useEffect(() => {
    const handleClickFora = () => { setMenuLojaAberto(false); setMenuFiltroAberto(null); };
    if (menuLojaAberto || menuFiltroAberto) window.addEventListener('click', handleClickFora);
    return () => window.removeEventListener('click', handleClickFora);
  }, [menuLojaAberto, menuFiltroAberto]);

  const carregarCreditoFornecedor = async () => {
    if (!fornecedorAtivo) return;
    try {
      const res = await api.get(`/creditos/${encodeURIComponent(fornecedorAtivo)}`);
      const data = res.data;
      let saldoReal = 0;
      if (typeof data === 'number') saldoReal = data;
      else if (data && typeof data === 'object') {
         saldoReal = data.valor || data.saldo || data.credito || data.valorCredito || data.montante || data.valorDeCredito || 0;
         if (!saldoReal) {
             for (const key in data) if (typeof data[key] === 'number' && key !== 'id') { saldoReal = data[key]; break; }
         }
      }
      setSaldoCreditoDisponivel(Number(saldoReal) || 0);
    } catch (e) { setSaldoCreditoDisponivel(0); }
  };

  // 🔥 O PURIFICADOR: Corrige erros de digitação das planilhas
  const normalizarForn = (f) => {
    const up = String(f).toUpperCase().trim();
    if (up === 'DIAMONS' || up === 'DIAMO') return 'DIAMONDS';
    if (up === 'ASSUG' || up === 'ASUGAR') return 'ASSUGAR';
    return up;
  };

  const carregarMesa = async () => {
    setLoading(true);
    try {
      const t = Date.now();
      let url = `/mesacompras/TELAS?page=${paginaAtual}&size=${ITENS_POR_PAGINA}&_t=${t}`;
      if (filtroMarca && filtroMarca !== 'TODAS') url += `&marca=${encodeURIComponent(filtroMarca)}`;
      if (busca && busca.trim() !== '') url += `&busca=${encodeURIComponent(busca.trim())}`;

      const res = await api.get(url);
      const baseItems = res.data.content || [];
      const infoPagina = res.data.page || res.data || {};
      
      const resEstq = await api.get(`/estoque?size=10000&_t=${t}`);
      const estoqueGlobal = resEstq.data.content || resEstq.data || [];

      let todosPedidos = [];
      try {
        const resPedidos = await api.get(`/pedidos?size=5000&_t=${t}`);
        todosPedidos = resPedidos.data?.content || (Array.isArray(resPedidos.data) ? resPedidos.data : []);
      } catch (e) {}

      const discovered = new Set(fornecedoresGlobais);
      let newFound = false;

      const mapMestres = {};
      estoqueGlobal.forEach(p => {
        if (p.skuMestre && p.marca) {
          if (!mapMestres[p.skuMestre]) mapMestres[p.skuMestre] = {};
          mapMestres[p.skuMestre][p.marca.toUpperCase()] = p.sku;
        }
      });

      const itensCompletos = await Promise.all(baseItems.map(async (item) => {
        let vendas = { vendaMensal: 0, vendaSemanal: 0, mediaSemanal: 0 };
        let estoqueGeralNosso = { fisico: 0, aCaminho: 0 }; 
        let estoqueFornecedores = {}; 

        // Purifica os Códigos
        const normCodigos = {};
        Object.entries(item.codigosFornecedores || {}).forEach(([k, v]) => {
            const nk = normalizarForn(k);
            normCodigos[nk] = v;
            if(!discovered.has(nk)){ discovered.add(nk); newFound=true; }
        });
        item.codigosFornecedores = normCodigos;

        // Purifica os Custos
        const normCustos = {};
        Object.entries(item.custosFornecedores || {}).forEach(([k, v]) => {
            const nk = normalizarForn(k);
            normCustos[nk] = v;
            if(!discovered.has(nk)){ discovered.add(nk); newFound=true; }
        });
        item.custosFornecedores = normCustos;

        // Purifica o Estoque
        const normEstq = {};
        Object.entries(item.estoqueFornecedores || {}).forEach(([k, v]) => {
            normEstq[normalizarForn(k)] = v;
        });
        item.estoqueFornecedores = normEstq;

        let codigosHerdados = {};
        if (item.codigosFornecedores) {
          Object.values(item.codigosFornecedores).forEach(codigoFornecedorNaMesa => {
            if (codigoFornecedorNaMesa && mapMestres[codigoFornecedorNaMesa]) {
              codigosHerdados = { ...codigosHerdados, ...mapMestres[codigoFornecedorNaMesa] };
            }
          });
        }
        item.codigosFornecedores = { ...item.codigosFornecedores, ...codigosHerdados };

        const codigosParaConsultar = [];
        if (item.codigosFornecedores) {
          for (const [fornKey, codigoForn] of Object.entries(item.codigosFornecedores)) {
            if (codigoForn && codigoForn !== '-' && codigoForn !== '') codigosParaConsultar.push(codigoForn);
          }
        }

        let somaFisicoGeral = 0;
        for (const cod of codigosParaConsultar) {
            const itemNoEstoque = estoqueGlobal.find(e => e.sku === cod);
            if (itemNoEstoque) {
                const qtdEncontrada = itemNoEstoque.quantidade || itemNoEstoque.fisico || 0;
                const vUnitEncontrado = itemNoEstoque.valorUnitario || itemNoEstoque.vUnit || 0;
                const fornEntry = Object.entries(item.codigosFornecedores).find(([k, v]) => v === cod);
                if (fornEntry) estoqueFornecedores[fornEntry[0]] = { qtd: qtdEncontrada, vUnit: vUnitEncontrado };
                somaFisicoGeral += Number(qtdEncontrada);
            }
        }
        
        if (item.estoqueFornecedores) {
            for (const [forn, dados] of Object.entries(item.estoqueFornecedores)) {
                if (!estoqueFornecedores[forn]) {
                    estoqueFornecedores[forn] = dados;
                    somaFisicoGeral += Number(dados.qtd || 0);
                }
            }
        }
        estoqueGeralNosso.fisico = somaFisicoGeral;

        let qtdACaminho = 0;
        const pedidosValidos = todosPedidos.filter(p => p.nomeFornecedor?.toUpperCase() === fornecedorAtivo.toUpperCase() && p.statusPedido?.toUpperCase() !== 'FINALIZADO' && p.statusPedido?.toUpperCase() !== 'CANCELADO');
        pedidosValidos.forEach(pedido => {
          (pedido.itens || []).forEach(itemPedido => {
            if (itemPedido.produtoId === item.id || itemPedido.descricaoLimpa === item.descricaoLimpa) {
               if (!itemPedido.naoVem) qtdACaminho += (itemPedido.quantidadePedida || itemPedido.quantidade || 0);
            }
          });
        });
        estoqueGeralNosso.aCaminho = qtdACaminho;

        for (const cod of codigosParaConsultar) {
          try {
             const resVendas = await api.get(`/vendas/${encodeURIComponent(cod)}?_t=${t}`);
             if (resVendas.data) {
               vendas.vendaMensal += Number(resVendas.data.vendaMensal || resVendas.data.vendaMês || 0);
               vendas.vendaSemanal += Number(resVendas.data.vendaSemanal || resVendas.data.vendaSem || 0);
             }
          } catch(e) {}
        }
        vendas.mediaSemanal = Math.round(vendas.vendaSemanal > 0 ? vendas.vendaSemanal / 4 : 0);
        return { ...item, vendas, estoqueGeralNosso, estoqueFornecedores, qtdComprar: '' };
      }));
      
      setProdutos(itensCompletos);
      setTotalPaginas(infoPagina.totalPages || 0);
      setTotalRegistros(infoPagina.totalElements || 0);

      // Adiciona novos fornecedores limpos à lista
      if (newFound) setFornecedoresGlobais(Array.from(discovered));
    } catch(err) {
    } finally {
      setLoading(false);
    }
  };

  const carregarMarcasGlobais = async () => {
    try {
      const res = await api.get(`/mesacompras/marcas/TELAS?_t=${Date.now()}`);
      setMarcasDisponiveis(res.data || []);
    } catch (e) {}
  };

  // 🔥 ORDENAÇÃO DE FORNECEDORES
  const moverFornecedor = (index, direcao) => {
    if ((direcao === -1 && index === 0) || (direcao === 1 && index === fornecedoresGlobais.length - 1)) return;
    const novaLista = [...fornecedoresGlobais];
    const temp = novaLista[index];
    novaLista[index] = novaLista[index + direcao];
    novaLista[index + direcao] = temp;
    setFornecedoresGlobais(novaLista);
  };

  const getCustoAtualSD = (p, fornId) => {
    let chaveReal = fornId;
    const chavesPossiveis = Object.keys(p.estoqueFornecedores || {});
    const chaveEncontrada = chavesPossiveis.find(k => fornId.includes(k) || k.includes(fornId));
    if (chaveEncontrada) chaveReal = chaveEncontrada;

    if (editandoCustosId === p.id && custosForm.custosAtuais[chaveReal] !== undefined) return Number(custosForm.custosAtuais[chaveReal]);
    if (p.custosFornecedores && p.custosFornecedores[chaveReal] !== undefined) return Number(p.custosFornecedores[chaveReal]);
    return Number(p.estoqueFornecedores?.[chaveReal]?.vUnit || 0);
  };

  const getCustoAtualCD = (fornId, sdValue) => {
    if (fornId.includes('ZL') || fornId === 'ZL CELL') return sdValue * 0.90; 
    return sdValue;
  };

  const iniciarEdicaoCustos = (p) => {
    setEditandoCustosId(p.id);
    const custosIniciais = {};
    for (const [fornKey, dataForn] of Object.entries(p.estoqueFornecedores || {})) {
       custosIniciais[fornKey] = p.custosFornecedores?.[fornKey] !== undefined ? p.custosFornecedores[fornKey] : dataForn.vUnit;
    }
    setCustosForm({ custosAtuais: custosIniciais, valorUnitarioDecidido: p.valorUnitarioDecidido || '' });
  };

  const salvarCustos = async (id) => {
    try {
      const payloadCustos = { ...custosForm };
      for (const k in payloadCustos.custosAtuais) payloadCustos.custosAtuais[k] = Number(payloadCustos.custosAtuais[k]) || 0;
      payloadCustos.valorUnitarioDecidido = Number(payloadCustos.valorUnitarioDecidido) || 0;

      await api.put(`/mesacompras/atualizar-custos/${id}`, payloadCustos);
      setProdutos(produtos.map(p => p.id === id ? { ...p, custosFornecedores: { ...p.custosFornecedores, ...payloadCustos.custosAtuais }, valorUnitarioDecidido: payloadCustos.valorUnitarioDecidido } : p));
      setEditandoCustosId(null);
      mostrarToast("Custos atualizados com sucesso!");
    } catch (e) { mostrarToast("Erro ao salvar custos.", "erro"); }
  };

  const confirmarExclusaoMesa = async () => {
    if(!modalDeleteMesa.id) return;
    try {
        await api.delete(`/mesacompras/${modalDeleteMesa.id}`);
        setModalDeleteMesa({ open: false, id: null });
        carregarMesa();
        mostrarToast("Item apagado da mesa com sucesso!");
    } catch(e) { mostrarToast("Erro ao remover o item.", "erro"); }
  };

  const handleSalvarNovoProduto = async () => {
    if (!novoProduto.descricaoLimpa) return mostrarToast("Preencha o nome do produto!", "erro");

    const custosFormatados = {};
    const estoqueFormatado = {};
    for (const key in novoProduto.custos) {
      if (novoProduto.codigos[key]) {
        custosFormatados[key] = Number(String(novoProduto.custos[key]).replace(',', '.')) || 0;
        estoqueFormatado[key] = { qtd: Number(novoProduto.quantidades[key]) || 0, vUnit: custosFormatados[key] };
      }
    }

    const payload = {
      item: novoProduto.descricaoLimpa.trim().toUpperCase(),
      descricaoLimpa: novoProduto.descricaoLimpa.trim().toUpperCase(),
      categoria: 'TELAS', categoriaAba: 'TELAS',
      codigosFornecedores: novoProduto.codigos,
      custosFornecedores: custosFormatados,
      estoqueFornecedores: estoqueFormatado
    };

    try {
      await api.post('/mesacompras', payload);
      mostrarToast("Novo produto injetado na mesa com sucesso!");
      setModalAtivo(null);
      setNovoProduto({ descricaoLimpa: '', codigos: {}, custos: {}, quantidades: {} });
      carregarMesa();
    } catch (e) { mostrarToast("Erro ao injetar produto.", "erro"); }
  };

  const handleAtualizarQtd = (produtoId, novaQtdStr) => {
    const qtd = parseInt(novaQtdStr);
    setProdutos(produtos.map(p => p.id === produtoId ? { ...p, qtdComprar: novaQtdStr } : p));
    
    const indexExistente = carrinho.findIndex(c => c.produtoId === produtoId);
    if (indexExistente >= 0) {
       if (!qtd || qtd <= 0) setCarrinho(carrinho.filter((_, i) => i !== indexExistente));
       else {
           let novoCarrinho = [...carrinho];
           novoCarrinho[indexExistente].quantidadePedida = qtd;
           novoCarrinho[indexExistente].subtotal = qtd * novoCarrinho[indexExistente].valorUnitario;
           setCarrinho(novoCarrinho);
       }
    }
  };

  const getPrecoCarrinho = (p, fornId) => {
    if (p.valorUnitarioDecidido > 0) return p.valorUnitarioDecidido; 
    const fornUpper = String(fornId).toUpperCase();
    if (fornUpper === 'DIAMONDS') return getCustoAtualSD(p, 'DIAMONDS'); 
    if (fornUpper === 'ZL' || fornUpper === 'ZL CELL') return getCustoAtualCD('ZL', getCustoAtualSD(p, 'ZL')); 
    return Number(p.custosFornecedores?.[fornUpper] || 0); 
  };

  const handleAddCarrinho = (produto) => {
    const qtd = parseInt(produto.qtdComprar);
    if (!qtd || qtd <= 0) return mostrarToast("Informe uma quantidade válida!", "erro");
    if (!fornecedorAtivo) return mostrarToast("Selecione um Fornecedor Ativo no topo!", "erro");
    
    const valorUnit = getPrecoCarrinho(produto, fornecedorAtivo);
    const indexExistente = carrinho.findIndex(c => c.produtoId === produto.id);
    let novoCarrinho = [...carrinho];

    if (indexExistente >= 0) {
      novoCarrinho[indexExistente].quantidadePedida = qtd; 
      novoCarrinho[indexExistente].subtotal = qtd * valorUnit;
    } else {
      novoCarrinho.push({
        id: Date.now(), produtoId: produto.id, descricaoLimpa: produto.descricaoLimpa,
        quantidadePedida: qtd, valorUnitario: valorUnit, fornecedor: fornecedorAtivo, subtotal: qtd * valorUnit
      });
    }

    setCarrinho(novoCarrinho);
    mostrarToast(`${produto.descricaoLimpa} adicionado ao carrinho!`);
  };

  const valorTotalCarrinho = carrinho.reduce((a, b) => a + b.subtotal, 0);
  const valorPagoFinal = Math.max(0, valorTotalCarrinho - (Number(creditoUtilizado) || 0));

  const handleFinalizarPedido = async () => {
    if (carrinho.length === 0) return mostrarToast("O carrinho está vazio.", "erro");

    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const mesAtual = meses[new Date().getMonth()];

    const payload = {
      nomeFornecedor: fornecedorAtivo, loja: lojaSelecionada || "", numeroPdc: numeroPdc.trim() || "", mes: mesAtual,
      statusPagamento: "PENDENTE", statusLogistica: "AGENDA", statusPedido: "EM ANDAMENTO",
      valorTotalPedido: valorTotalCarrinho, creditoUtilizado: Number(creditoUtilizado) || 0,
      valorFrete: 0.0, valorPagarFinal: valorPagoFinal,
      itens: carrinho.map(item => ({
        produtoId: item.produtoId, descricaoLimpa: item.descricaoLimpa, quantidadePedida: item.quantidadePedida,
        valorUnitario: item.valorUnitario, subtotal: item.subtotal, naoVem: false
      }))
    };

    try {
      await api.post('/pedidos', payload);
      mostrarToast(`Pedido registrado com sucesso!`);
      setCarrinho([]); setNumeroPdc(''); setCreditoUtilizado(''); setModalAtivo(null);
      setProdutos(produtos.map(p => ({ ...p, qtdComprar: '' })));
      carregarMesa();
    } catch (e) { mostrarToast("Erro ao registrar o pedido.", "erro"); }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // ============================================================================
  // 🔥 MOTOR DE FILTRAGEM
  // ============================================================================
  const getValorColuna = (p, colId) => {
    const diamEstq = p.estoqueFornecedores?.['DIAMONDS']?.qtd || 0;
    const zlEstq = p.estoqueFornecedores?.['ZL']?.qtd || 0;
    const cAntZl = p.estoqueFornecedores?.['ZL']?.vUnit || 0;
    const cSdZl = getCustoAtualSD(p, 'ZL');
    const cCdZl = getCustoAtualCD('ZL', cSdZl); 
    const difZl = cCdZl - cAntZl; 
    const cAntDiam = p.estoqueFornecedores?.['DIAMONDS']?.vUnit || 0;
    const cAtualDiam = getCustoAtualSD(p, 'DIAMONDS');
    const difDiam = cAtualDiam - cAntDiam; 
    const difMarcas = cCdZl - cAtualDiam; 

    switch(colId) {
        case 'v_mes': return p.vendas?.vendaMensal || 0;
        case 'v_sem': return p.vendas?.vendaSemanal || 0;
        case 'media_sem': return p.vendas?.mediaSemanal || 0;
        case 'diam_estq': return diamEstq;
        case 'zl_estq': return zlEstq;
        case 'diam_tot': return diamEstq; 
        case 'zl_tot': return zlEstq;
        case 'fisico': return p.estoqueGeralNosso?.fisico || 0;
        case 'a_caminho': return p.estoqueGeralNosso?.aCaminho || 0;
        case 'total_nosso': return (p.estoqueGeralNosso?.fisico || 0) + (p.estoqueGeralNosso?.aCaminho || 0);
        case 'zl_c_ant': return cAntZl;
        case 'zl_c_atual_sd': return cSdZl;
        case 'zl_c_atual_cd': return cCdZl;
        case 'zl_dif': return difZl;
        case 'dif_diam_zl': return difMarcas;
        case 'diam_c_ant': return cAntDiam;
        case 'diam_c_atual': return cAtualDiam;
        case 'diam_dif': return difDiam;
        default: return 0;
    }
  };

  let produtosProcessados = [...produtos];

  Object.keys(filtrosNumericos).forEach(colId => {
      const filtro = filtrosNumericos[colId];
      if (filtro === 'maior_0') produtosProcessados = produtosProcessados.filter(p => getValorColuna(p, colId) > 0);
      if (filtro === 'igual_0') produtosProcessados = produtosProcessados.filter(p => getValorColuna(p, colId) === 0);
      if (filtro === 'menor_0') produtosProcessados = produtosProcessados.filter(p => getValorColuna(p, colId) < 0);
  });

  if (ordenacao.coluna) {
      produtosProcessados.sort((a, b) => {
          const valA = getValorColuna(a, ordenacao.coluna);
          const valB = getValorColuna(b, ordenacao.coluna);
          if (ordenacao.direcao === 'asc') return valA - valB;
          if (ordenacao.direcao === 'desc') return valB - valA;
          return 0;
      });
  }

  const renderTH = (id, label, baseClasses) => {
      const isActive = (filtrosNumericos[id] && filtrosNumericos[id] !== 'todos') || ordenacao.coluna === id;
      return (
          <th className={`${baseClasses} relative group`}>
              <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-white transition-colors select-none" onClick={(e) => { e.stopPropagation(); setMenuFiltroAberto(menuFiltroAberto === id ? null : id); }}>
                  <span dangerouslySetInnerHTML={{ __html: label }} />
                  <Filter size={12} className={isActive ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'} />
              </div>
              {menuFiltroAberto === id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0B1120] border border-cyan-900 rounded-xl shadow-2xl py-2 z-100 min-w-42.5 text-left font-bold" onClick={e => e.stopPropagation()}>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300 flex items-center gap-2" onClick={() => { setOrdenacao({ coluna: id, direcao: 'asc' }); setMenuFiltroAberto(null); }}><ArrowUp size={14}/> Menor para Maior</div>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300 flex items-center gap-2 border-b border-slate-800" onClick={() => { setOrdenacao({ coluna: id, direcao: 'desc' }); setMenuFiltroAberto(null); }}><ArrowDown size={14}/> Maior para Menor</div>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300 mt-1" onClick={() => { setFiltrosNumericos({...filtrosNumericos, [id]: 'todos'}); setMenuFiltroAberto(null); }}>Mostrar Todos</div>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300" onClick={() => { setFiltrosNumericos({...filtrosNumericos, [id]: 'maior_0'}); setMenuFiltroAberto(null); }}>Maior que 0</div>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300" onClick={() => { setFiltrosNumericos({...filtrosNumericos, [id]: 'igual_0'}); setMenuFiltroAberto(null); }}>Igual a 0</div>
                      <div className="px-4 py-2.5 hover:bg-cyan-600 hover:text-white cursor-pointer text-xs text-slate-300" onClick={() => { setFiltrosNumericos({...filtrosNumericos, [id]: 'menor_0'}); setMenuFiltroAberto(null); }}>Menor que 0</div>
                  </div>
              )}
          </th>
      );
  };

  const fornecedoresVisiveis = fornecedoresGlobais.filter(f => colunasCodVisiveis[f] !== false);
  const qtdColunasVisiveis = fornecedoresVisiveis.length;

  const giroCount = [visibilidadeColunas.v_mes, visibilidadeColunas.v_sem, visibilidadeColunas.media_sem].filter(Boolean).length;
  const padraoCount = [visibilidadeColunas.diam_estq, visibilidadeColunas.zl_estq, visibilidadeColunas.diam_tot, visibilidadeColunas.zl_tot].filter(Boolean).length;
  const nossoCount = [visibilidadeColunas.fisico, visibilidadeColunas.a_caminho, visibilidadeColunas.total_nosso].filter(Boolean).length;
  const custosCount = [visibilidadeColunas.zl_c_ant, visibilidadeColunas.zl_c_atual_sd, visibilidadeColunas.zl_c_atual_cd, visibilidadeColunas.zl_dif, visibilidadeColunas.dif_diam_zl, visibilidadeColunas.diam_c_ant, visibilidadeColunas.diam_c_atual, visibilidadeColunas.diam_dif].filter(Boolean).length;
  const carrinhoCount = (visibilidadeColunas.v_unit_edit ? 1 : 0) + 3;

  return (
    <div className="h-full flex flex-col bg-[#0B1120] p-6 overflow-hidden text-slate-200 relative">
      
      {toast.visivel && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-200 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-fade-in-down border ${toast.tipo === 'sucesso' ? 'bg-emerald-900 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'}`}>
           <BellRing size={20} className={toast.tipo === 'sucesso' ? 'text-emerald-400' : 'text-rose-400'} />
           <span className="font-black text-sm tracking-wider">{toast.mensagem}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Smartphone className="text-emerald-400" size={32} /> MESA DE COMPRAS: TELAS
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 ml-11">Arquitetura dinâmica de comparação cruzando planilhas, estoque e vendas.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setModalAtivo('VISIBILIDADE')} className="border border-fuchsia-900 bg-fuchsia-900/20 text-fuchsia-400 hover:bg-fuchsia-900/40 px-4 py-2 rounded-full flex items-center gap-2 text-[11px] font-black transition-all shadow-md shadow-fuchsia-900/20">
            <Eye size={14} /> EXIBIR / OCULTAR
          </button>
          
          <button onClick={() => setModalAtivo('COLUNAS')} className="border border-blue-900 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 px-4 py-2 rounded-full flex items-center gap-2 text-[11px] font-black transition-all shadow-md shadow-blue-900/20">
            <Columns size={14} /> COLUNAS CÓD.
          </button>
          <button onClick={() => setModalAtivo('FORNECEDORES')} className="bg-transparent border border-amber-900 text-amber-400 hover:bg-amber-900/30 px-4 py-2 rounded-full flex items-center gap-2 text-[11px] font-black transition-all">
            <Store size={14} /> FORNECEDORES
          </button>
          <button onClick={() => setModalAtivo('NOVO_PRODUTO')} className="bg-transparent border border-cyan-900 text-cyan-400 hover:bg-cyan-900/30 px-4 py-2 rounded-full flex items-center gap-2 text-[11px] font-black transition-all">
            <Plus size={14} /> NOVO ITEM
          </button>
          <button onClick={() => { setModalAtivo('CARRINHO'); carregarCreditoFornecedor(); }} className="bg-emerald-950 border border-emerald-900 text-emerald-400 hover:bg-emerald-900 px-5 py-2 rounded-full flex items-center gap-2 text-xs font-black shadow-lg shadow-emerald-900/20 transition-all">
            <ShoppingCart size={16} /> CARRINHO 
            <span className={`bg-emerald-500 text-slate-950 px-2 rounded-full ml-1 font-black ${carrinho.length > 0 ? 'animate-bounce' : ''}`}>{carrinho.length}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
        <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-4 relative overflow-hidden shadow-lg flex items-center gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><ShoppingCart size={24} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">Fornecedor Ativo para os Pedidos</p>
            <select value={fornecedorAtivo} onChange={e => setFornecedorAtivo(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 text-sm font-black outline-none focus:border-emerald-500 cursor-pointer">
              {opcoesFornecedorAtivo.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-[#111A2C] border border-[#1E293B] rounded-2xl p-4 relative overflow-hidden shadow-lg flex items-center gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500"></div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20"><Sparkles size={24} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-wider mb-1">Filtrar por Marca Principal</p>
            <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg p-2.5 text-sm font-black outline-none focus:border-cyan-500 cursor-pointer">
              <option value="TODAS">TODAS AS MARCAS</option>
              {marcasDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#111A2C] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-auto custom-scrollbar">
          
          <table className="w-full border-collapse text-left whitespace-nowrap min-w-max">
            <thead className="sticky top-0 z-30 bg-[#111A2C] text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th colSpan={qtdColunasVisiveis + 1} className="sticky left-0 z-40 bg-[#090E17] border-b border-r-[3px] border-[#334155] text-center text-blue-400 p-2 shadow-[4px_0_10px_rgba(0,0,0,0.6)]">Identificação Cruzada Automática</th>
                
                {giroCount > 0 && <th colSpan={giroCount} className="border-b border-r border-[#1E293B] text-center text-fuchsia-400 p-2 bg-[#111A2C]">Giro Histórico de Vendas</th>}
                {padraoCount > 0 && <th colSpan={padraoCount} className="border-b border-r border-[#1E293B] text-center text-amber-500 p-2 bg-[#111A2C]">Estoque Padrão</th>}
                {nossoCount > 0 && <th colSpan={nossoCount} className="border-b border-r border-[#1E293B] text-center text-blue-400 p-2 bg-[#111A2C]">Estoque Geral Nosso</th>}
                {custosCount > 0 && <th colSpan={custosCount} className="border-b border-r border-[#1E293B] text-center text-orange-400 p-2 bg-[#111A2C]">Histórico Custos (Duplo Clique)</th>}
                
                <th colSpan={carrinhoCount} className="border-b border-[#1E293B] text-center text-emerald-400 p-2 bg-[#111A2C]">Finalização</th>
              </tr>
              <tr className="border-b-2 border-slate-700">
                {/* 🔥 CÓDIGOS SEM BURACO */}
                {fornecedoresVisiveis.map((f, index) => (
                    <th key={`th_${f}`} style={{ left: `${index * 100}px` }} className="sticky z-40 bg-[#090E17] border-r border-[#1E293B] p-2 min-w-25">
                      <div className="flex flex-col gap-2">
                        <span className={`${coresFornecedores[f] || 'text-cyan-400'} text-center mt-3`}>Cód.<br/>{f}</span>
                      </div>
                    </th>
                ))}
                
                <th style={{ left: `${qtdColunasVisiveis * 100}px` }} className="sticky z-40 bg-[#090E17] border-r-[3px] border-[#334155] p-2 min-w-62.5 shadow-[4px_0_10px_rgba(0,0,0,0.6)]">
                  <div className="flex flex-col gap-2">
                    <span className="text-white mt-3">Produto ou Cód. Fornecedor</span>
                    <div className="relative group">
                      <Search size={14} className="absolute left-3 top-2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar..." className="w-full bg-[#0B1120] border border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold outline-none text-cyan-300 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all" />
                    </div>
                  </div>
                </th>
                
                {/* 🔥 FILTROS ESTILO EXCEL */}
                {isVisible('v_mes') && renderTH('v_mes', 'V. Mês', 'bg-[#0E1525] p-3 text-center text-slate-300')}
                {isVisible('v_sem') && renderTH('v_sem', 'V. Sem.', 'bg-[#0E1525] p-3 text-center text-slate-300')}
                {isVisible('media_sem') && renderTH('media_sem', 'Média Sem.', 'bg-[#0E1525] border-r border-[#1E293B] p-3 text-center text-slate-300')}
                
                {isVisible('diam_estq') && renderTH('diam_estq', 'Diam. Estq', 'bg-[#0E1525] p-3 text-center text-amber-500')}
                {isVisible('zl_estq') && renderTH('zl_estq', 'ZL Estq', 'bg-[#0E1525] p-3 text-center text-blue-400')}
                {isVisible('diam_tot') && renderTH('diam_tot', 'Diam. Tot', 'bg-[#0E1525] p-3 text-center text-amber-500')}
                {isVisible('zl_tot') && renderTH('zl_tot', 'ZL Tot', 'bg-[#0E1525] border-r border-[#1E293B] p-3 text-center text-blue-400')}
                
                {isVisible('fisico') && renderTH('fisico', 'Físico', 'bg-[#0E1525] p-3 text-center text-slate-300')}
                {isVisible('a_caminho') && renderTH('a_caminho', 'A Caminho', 'bg-[#0E1525] p-3 text-center text-cyan-400')}
                {isVisible('total_nosso') && renderTH('total_nosso', 'Total', 'bg-[#0E1525] border-r border-[#1E293B] p-3 text-center text-slate-300')}
                
                {isVisible('zl_c_ant') && renderTH('zl_c_ant', 'ZL<br/>C. ANT.', 'bg-[#0E1525] p-3 text-center text-slate-400')}
                {isVisible('zl_c_atual_sd') && renderTH('zl_c_atual_sd', 'ZL<br/>C. ATUAL S/D', 'bg-[#0E1525] p-3 text-center text-slate-300')}
                {isVisible('zl_c_atual_cd') && renderTH('zl_c_atual_cd', 'ZL<br/>C. ATUAL C/D', 'bg-[#0E1525] p-3 text-center text-orange-400')}
                {isVisible('zl_dif') && renderTH('zl_dif', 'ZL<br/>DIF C. ATUAL-ANTERIOR', 'bg-[#0E1525] p-3 text-center text-rose-400')}
                {isVisible('dif_diam_zl') && renderTH('dif_diam_zl', 'DIF DIAMONDS - ZL', 'bg-[#111827] border-x border-[#334155] p-3 text-center text-fuchsia-400 font-black shadow-inner')}
                {isVisible('diam_c_ant') && renderTH('diam_c_ant', 'DIAMONDS<br/>C. ANT.', 'bg-[#0E1525] p-3 text-center text-slate-400')}
                {isVisible('diam_c_atual') && renderTH('diam_c_atual', 'DIAMONDS<br/>C. ATUAL', 'bg-[#0E1525] p-3 text-center text-slate-300')}
                {isVisible('diam_dif') && renderTH('diam_dif', 'DIAMONDS<br/>DIF C. ATUAL-ANTERIOR', 'bg-[#0E1525] border-r border-[#1E293B] p-3 text-center text-rose-400')}

                {isVisible('v_unit_edit') && <th className="bg-[#0E1525] p-3 text-center text-cyan-400">V. UNIT (EDIT)</th>}
                <th className="bg-[#0E1525] p-3 text-center text-emerald-400">Qtd</th>
                <th className="bg-[#0E1525] p-3 text-center text-emerald-400">Total Linha</th>
                <th className="bg-[#0E1525] border-r border-[#1E293B] p-3 text-center text-emerald-400">Ações</th>
                <th className="bg-[#0E1525] p-3 text-center text-rose-500">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-[11px] font-bold text-slate-300">
              {loading ? (
                <tr><td colSpan="30" className="p-12 text-center text-cyan-400"><Loader2 className="animate-spin inline mr-2" size={24}/> Carregando matemática...</td></tr>
              ) : produtosProcessados.length === 0 ? (
                 <tr><td colSpan="30" className="p-8 text-center text-slate-500">Nenhum produto atende aos filtros atuais.</td></tr>
              ) : (
                produtosProcessados.map((p) => {
                  const isEditCustos = editandoCustosId === p.id;
                  const itemNoCarrinho = carrinho.find(c => c.produtoId === p.id);
                  const inCart = !!itemNoCarrinho;
                  const qtdMostrada = p.qtdComprar !== '' ? p.qtdComprar : (inCart ? itemNoCarrinho.quantidadePedida : '');
                  
                  const rowClasses = inCart ? "bg-emerald-900/20 hover:bg-emerald-900/30 transition-colors group border-l-2 border-emerald-500" : "hover:bg-[#1E293B]/40 transition-colors group border-l-2 border-transparent";
                  
                  const diamEstq = p.estoqueFornecedores?.['DIAMONDS']?.qtd || 0;
                  const zlEstq = p.estoqueFornecedores?.['ZL']?.qtd || 0;
                  const cAntZl = p.estoqueFornecedores?.['ZL']?.vUnit || 0;
                  const cSdZl = getCustoAtualSD(p, 'ZL');
                  const cCdZl = getCustoAtualCD('ZL', cSdZl); 
                  const difZl = cCdZl - cAntZl; 
                  const cAntDiam = p.estoqueFornecedores?.['DIAMONDS']?.vUnit || 0;
                  const cAtualDiam = getCustoAtualSD(p, 'DIAMONDS');
                  const difDiam = cAtualDiam - cAntDiam; 
                  const difMarcas = cCdZl - cAtualDiam; 

                  return (
                    <tr key={p.id} className={rowClasses}>
                      {/* 🔥 CÉLULAS CÓDIGO PERFEITAS SEM BURACO */}
                      {fornecedoresVisiveis.map((f, index) => (
                        <td key={`td_cod_${f}`} style={{ left: `${index * 100}px` }} className={`py-4 sticky z-20 ${inCart ? 'bg-[#091512]' : 'bg-[#0C121E]'} group-hover:bg-[#131D2F] border-r border-[#1E293B] px-3 text-center ${coresFornecedores[f] || 'text-cyan-400'}`}>
                          {p.codigosFornecedores?.[f] || '-'}
                        </td>
                      ))}

                      <td style={{ left: `${qtdColunasVisiveis * 100}px` }} className={`py-4 sticky z-20 ${inCart ? 'bg-[#091512] text-emerald-400' : 'bg-[#0C121E] text-white'} group-hover:bg-[#131D2F] border-r-[3px] border-[#334155] px-3 font-black shadow-[4px_0_10px_rgba(0,0,0,0.6)] transition-colors`}>{p.descricaoLimpa}</td>
                      
                      {isVisible('v_mes') && <td className="py-4 px-3 text-center text-fuchsia-400 font-black">{p.vendas?.vendaMensal || 0}</td>}
                      {isVisible('v_sem') && <td className="py-4 px-3 text-center text-fuchsia-400 font-black">{p.vendas?.vendaSemanal || 0}</td>}
                      {isVisible('media_sem') && <td className="py-4 border-r border-[#1E293B] px-3 text-center text-fuchsia-400 font-black">{p.vendas?.mediaSemanal || 0}</td>}
                      
                      {isVisible('diam_estq') && <td className="py-4 px-3 text-center text-amber-500 font-black">{diamEstq}</td>}
                      {isVisible('zl_estq') && <td className="py-4 px-3 text-center text-blue-400 font-black">{zlEstq}</td>}
                      {isVisible('diam_tot') && <td className="py-4 px-3 text-center text-amber-500 font-black">{diamEstq}</td>}
                      {isVisible('zl_tot') && <td className="py-4 border-r border-[#1E293B] px-3 text-center text-blue-400 font-black">{zlEstq}</td>}
                      
                      {isVisible('fisico') && <td className="py-4 px-3 text-center text-emerald-400 font-black">{p.estoqueGeralNosso?.fisico || 0}</td>}
                      {isVisible('a_caminho') && <td className="py-4 px-3 text-center text-cyan-400 font-black">{p.estoqueGeralNosso?.aCaminho || 0}</td>}
                      {isVisible('total_nosso') && <td className="py-4 border-r border-[#1E293B] px-3 text-center text-blue-400 font-black">{(p.estoqueGeralNosso?.fisico || 0) + (p.estoqueGeralNosso?.aCaminho || 0)}</td>}
                      
                      {isVisible('zl_c_ant') && <td className="py-4 px-3 text-center text-slate-500 font-black">{formatMoney(cAntZl)}</td>}
                      {isVisible('zl_c_atual_sd') && (
                        <td className="py-4 px-3 text-center text-slate-300 cursor-pointer hover:bg-[#1E293B]/60" onDoubleClick={() => iniciarEdicaoCustos(p)}>
                          {isEditCustos ? <input type="number" value={custosForm.custosAtuais['ZL'] !== undefined ? custosForm.custosAtuais['ZL'] : ''} onChange={e => setCustosForm({...custosForm, custosAtuais: {...custosForm.custosAtuais, 'ZL': e.target.value === '' ? '' : Number(e.target.value)}})} className="w-16 bg-slate-900 text-white rounded p-1 text-center outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> : formatMoney(cSdZl)}
                        </td>
                      )}
                      {isVisible('zl_c_atual_cd') && <td className="py-4 px-3 text-center text-orange-400 font-black">{formatMoney(cCdZl)}</td>}
                      {isVisible('zl_dif') && <td className={`py-4 px-3 text-center font-black ${difZl > 0 ? 'text-rose-400' : difZl < 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{formatMoney(difZl)}</td>}
                      {isVisible('dif_diam_zl') && <td className="py-4 px-3 text-center font-black bg-[#111827]/40 border-x border-[#334155] text-fuchsia-400">{formatMoney(difMarcas)}</td>}
                      {isVisible('diam_c_ant') && <td className="py-4 px-3 text-center text-slate-500 font-black">{formatMoney(cAntDiam)}</td>}
                      {isVisible('diam_c_atual') && (
                        <td className="py-4 px-3 text-center text-slate-300 cursor-pointer hover:bg-[#1E293B]/60" onDoubleClick={() => iniciarEdicaoCustos(p)}>
                          {isEditCustos ? <input type="number" value={custosForm.custosAtuais['DIAMONDS'] !== undefined ? custosForm.custosAtuais['DIAMONDS'] : ''} onChange={e => setCustosForm({...custosForm, custosAtuais: {...custosForm.custosAtuais, 'DIAMONDS': e.target.value === '' ? '' : Number(e.target.value)}})} className="w-16 bg-slate-900 text-white rounded p-1 text-center outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> : formatMoney(cAtualDiam)}
                        </td>
                      )}
                      {isVisible('diam_dif') && <td className={`py-4 border-r border-[#1E293B] px-3 text-center font-black ${difDiam > 0 ? 'text-emerald-400' : difDiam < 0 ? 'text-rose-400' : 'text-slate-600'}`}>{formatMoney(difDiam)}</td>}

                      {isVisible('v_unit_edit') && (
                        <td className="py-4 px-3 text-center text-cyan-400 font-black cursor-pointer hover:bg-[#1E293B]/60" onDoubleClick={() => iniciarEdicaoCustos(p)}>
                          {isEditCustos ? (
                            <div className="flex gap-1 justify-center">
                              <input type="number" value={custosForm.valorUnitarioDecidido !== undefined ? custosForm.valorUnitarioDecidido : ''} onChange={e => setCustosForm({...custosForm, valorUnitarioDecidido: e.target.value === '' ? '' : Number(e.target.value)})} className="w-16 bg-slate-900 text-cyan-400 rounded p-1 text-center outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              <button onClick={() => salvarCustos(p.id)} className="bg-emerald-600 p-1 rounded text-white hover:bg-emerald-500"><Save size={14}/></button>
                            </div>
                          ) : formatMoney(getPrecoCarrinho(p, fornecedorAtivo))}
                        </td>
                      )}
                      
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input type="number" min="1" placeholder="Qtd" value={qtdMostrada} onChange={(e) => handleAtualizarQtd(p.id, e.target.value)} className={`w-14 border rounded p-1.5 text-center font-black outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${inCart ? 'bg-[#0B1120] border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-[#0B1120] border-slate-700 text-white focus:border-emerald-500'}`} />
                        </div>
                      </td>
                      <td className={`py-4 px-3 text-center font-black ${inCart ? 'text-emerald-400' : 'text-slate-400'}`}>{formatMoney(getPrecoCarrinho(p, fornecedorAtivo) * (parseInt(qtdMostrada) || 0))}</td>
                      <td className="py-4 border-r border-[#1E293B] px-3 text-center">
                         <button onClick={() => handleAddCarrinho(p)} className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-black uppercase shadow-md w-full transition-colors ${inCart ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                           {inCart ? <><CheckCircle size={14} /> ADD</> : <><ShoppingCart size={14} /> ADD</>}
                         </button>
                      </td>
                      <td className="py-4 px-3 text-center">
                         <button onClick={() => setModalDeleteMesa({ open: true, id: p.id })} className="p-2 bg-rose-900/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-colors shadow-md w-full flex justify-center">
                           <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="bg-[#0B1120] border-t border-[#1E293B] p-4 flex items-center justify-between shrink-0">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              Página <span className="text-emerald-400 text-sm bg-emerald-900/20 px-2 py-0.5 rounded">{paginaAtual + 1}</span> de {Math.max(totalPaginas, 1)} 
              <span className="ml-4 border-l border-slate-700 pl-4 text-slate-400 font-medium">({totalRegistros} itens totais - {ITENS_POR_PAGINA} por página)</span>
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 0))} disabled={paginaAtual === 0} className="bg-transparent border border-slate-700 text-slate-300 px-5 py-2 rounded-lg text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-40 transition-colors">Anterior</button>
              <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas - 1))} disabled={paginaAtual >= totalPaginas - 1 || totalPaginas <= 1} className="bg-emerald-950 border border-emerald-900 text-emerald-500 px-5 py-2 rounded-lg text-xs font-black uppercase hover:bg-emerald-900 disabled:opacity-40 transition-colors">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 MODAL COLUNAS CÓD. COM ORDENAÇÃO */}
      {modalAtivo === 'COLUNAS' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 text-blue-500 rounded-xl"><Columns size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Colunas de Códigos</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Oculte os códigos da base, escolha cores e reordene.</p>
                </div>
              </div>
              <button onClick={() => setModalAtivo(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {fornecedoresGlobais.map((f, index) => (
                <div key={f} className="flex justify-between items-center w-full px-4 py-3 rounded-xl border bg-[#0B1120] border-slate-700">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setColunasCodVisiveis(prev => ({...prev, [f]: prev[f] === false ? true : false}))} className={`text-xs font-black uppercase flex items-center gap-2 transition-colors ${colunasCodVisiveis[f] !== false ? coresFornecedores[f] || 'text-cyan-400' : 'text-slate-500'}`}>
                       {colunasCodVisiveis[f] !== false ? <Eye size={16}/> : <EyeOff size={16}/>} CÓDIGO {f}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={coresFornecedores[f] || 'text-cyan-400'} onChange={e => setCoresFornecedores({...coresFornecedores, [f]: e.target.value})} className={`bg-slate-900 border border-slate-700 text-xs font-black rounded-lg px-2 py-1.5 outline-none ${coresFornecedores[f] || 'text-cyan-400'}`}>
                      {paletaCores.map(c => <option key={c.classe} value={c.classe} className={c.classe}>{c.nome}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={() => moverFornecedor(index, -1)} disabled={index === 0} className="p-1 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md disabled:opacity-30 transition-colors"><ArrowUp size={14}/></button>
                      <button onClick={() => moverFornecedor(index, 1)} disabled={index === fornecedoresGlobais.length - 1} className="p-1 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md disabled:opacity-30 transition-colors"><ArrowDown size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setModalAtivo(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase transition-colors">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE VISIBILIDADE DAS COLUNAS (O SUPER MODAL VOLTOU!) */}
      {modalAtivo === 'VISIBILIDADE' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-fuchsia-900/50 rounded-2xl shadow-[0_0_40px_rgba(192,38,211,0.15)] w-full max-w-5xl p-6 relative flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-fuchsia-600/20 text-fuchsia-500 rounded-xl"><Eye size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Visibilidade de Colunas</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Ligue ou desligue qualquer coluna da sua mesa.</p>
                </div>
              </div>
              <button onClick={() => setModalAtivo(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-1 border-b border-slate-800 pb-1">Giro de Vendas</h3>
                {[{ id: 'v_mes', label: 'V. Mês' }, { id: 'v_sem', label: 'V. Sem.' }, { id: 'media_sem', label: 'Média Sem.' }].map(col => (
                  <button key={col.id} onClick={() => toggleVisibilidade(col.id)} className={`flex justify-between items-center w-full px-4 py-2 rounded-lg border font-black text-[11px] uppercase transition-all ${isVisible(col.id) ? 'bg-fuchsia-900/20 border-fuchsia-500/50 text-fuchsia-400' : 'bg-[#0B1120] border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                    {col.label} {isVisible(col.id) ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                ))}

                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-4 mb-1 border-b border-slate-800 pb-1">Estoque Geral Nosso</h3>
                {[{ id: 'fisico', label: 'Físico' }, { id: 'a_caminho', label: 'A Caminho' }, { id: 'total_nosso', label: 'Total' }].map(col => (
                  <button key={col.id} onClick={() => toggleVisibilidade(col.id)} className={`flex justify-between items-center w-full px-4 py-2 rounded-lg border font-black text-[11px] uppercase transition-all ${isVisible(col.id) ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-[#0B1120] border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                    {col.label} {isVisible(col.id) ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                ))}

                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-4 mb-1 border-b border-slate-800 pb-1">Carrinho / Edição</h3>
                <button onClick={() => toggleVisibilidade('v_unit_edit')} className={`flex justify-between items-center w-full px-4 py-2 rounded-lg border font-black text-[11px] uppercase transition-all ${isVisible('v_unit_edit') ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400' : 'bg-[#0B1120] border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                  V. UNIT (EDIT) {isVisible('v_unit_edit') ? <Eye size={14}/> : <EyeOff size={14}/>}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 border-b border-slate-800 pb-1">Estoque Padrão</h3>
                {[{ id: 'diam_estq', label: 'Diam. Estq' }, { id: 'zl_estq', label: 'ZL Estq' }, { id: 'diam_tot', label: 'Diam. Tot' }, { id: 'zl_tot', label: 'ZL Tot' }].map(col => (
                  <button key={col.id} onClick={() => toggleVisibilidade(col.id)} className={`flex justify-between items-center w-full px-4 py-2 rounded-lg border font-black text-[11px] uppercase transition-all ${isVisible(col.id) ? 'bg-amber-900/20 border-amber-500/50 text-amber-400' : 'bg-[#0B1120] border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                    {col.label} {isVisible(col.id) ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 border-b border-slate-800 pb-1">Histórico Custos</h3>
                {[{ id: 'zl_c_ant', label: 'ZL C. ANT.' }, { id: 'zl_c_atual_sd', label: 'ZL C. ATUAL S/D' }, { id: 'zl_c_atual_cd', label: 'ZL C. ATUAL C/D' }, { id: 'zl_dif', label: 'ZL DIF ATUAL-ANTERIOR' }, { id: 'dif_diam_zl', label: 'DIF DIAMONDS - ZL' }, { id: 'diam_c_ant', label: 'DIAMONDS C. ANT.' }, { id: 'diam_c_atual', label: 'DIAMONDS C. ATUAL' }, { id: 'diam_dif', label: 'DIAMONDS DIF ATUAL-ANTERIOR' }].map(col => (
                  <button key={col.id} onClick={() => toggleVisibilidade(col.id)} className={`flex justify-between items-center w-full px-4 py-2 rounded-lg border font-black text-[11px] uppercase transition-all ${isVisible(col.id) ? 'bg-orange-900/20 border-orange-500/50 text-orange-400' : 'bg-[#0B1120] border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                    {col.label} {isVisible(col.id) ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                ))}
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end shrink-0">
              <button onClick={() => setModalAtivo(null)} className="bg-fuchsia-600 hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-900/40 text-white px-8 py-3 rounded-xl font-black text-xs uppercase transition-colors">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* OUTROS MODAIS (DELETE, FORNECEDORES, NOVO PRODUTO, CARRINHO) ... */}
      {modalDeleteMesa.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111A2C] border border-rose-900/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20"><AlertCircle size={32} /></div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Apagar Item da Mesa?</h2>
            <p className="text-slate-400 text-sm font-bold mb-6">Esta ação removerá permanentemente este item da visualização da mesa de compras.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalDeleteMesa({ open: false, id: null })} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700 uppercase transition-colors">Cancelar</button>
              <button onClick={confirmarExclusaoMesa} className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl hover:bg-rose-500 shadow-lg shadow-rose-900/50 uppercase transition-colors">Sim, Apagar</button>
            </div>
          </div>
        </div>
      )}

      {modalAtivo === 'FORNECEDORES' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-600/20 text-amber-500 rounded-xl"><Store size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Gerenciar Fornecedores</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Adicione fornecedores globais para usar nos pedidos.</p>
                </div>
              </div>
              <button onClick={() => setModalAtivo(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex gap-3 mb-6">
              <input type="text" value={novoFornecedor} onChange={e => setNovoFornecedor(e.target.value.toUpperCase())} placeholder="EX: ZL CELL" className="flex-1 bg-[#0B1120] border border-slate-700 text-white font-black text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              <button onClick={() => { if(novoFornecedor) { setFornecedoresGlobais([...fornecedoresGlobais, novoFornecedor]); setNovoFornecedor(''); } }} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors"><Plus size={16}/> Adicionar</button>
            </div>
            <div className="w-full h-px bg-slate-800 mb-6"></div>
            <div className="flex flex-wrap gap-3">
              {fornecedoresGlobais.map(forn => (
                <div key={forn} className="flex items-center gap-2 px-4 py-2 border border-slate-700 bg-[#0B1120] rounded-full shadow-inner">
                  <span className="text-xs font-black text-slate-300 uppercase">{forn}</span>
                  <button onClick={() => setFornecedoresGlobais(fornecedoresGlobais.filter(f => f !== forn))} className="text-rose-500 hover:text-rose-400 transition-colors"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setModalAtivo(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase transition-colors">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {modalAtivo === 'NOVO_PRODUTO' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#111A2C]">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Injetar Novo Item na Mesa</h2>
              <button onClick={() => setModalAtivo(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto bg-[#0B1120] flex-1">
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nome do Produto (Descrição Limpa)</label>
                <input type="text" value={novoProduto.descricaoLimpa} onChange={e => setNovoProduto({...novoProduto, descricaoLimpa: e.target.value.toUpperCase()})} placeholder="Ex: TELA IPHONE 11 OLED" className="w-full bg-[#0E1525] border border-slate-700 text-white rounded-xl p-3 text-sm font-black outline-none focus:border-cyan-500" />
              </div>
              <div className="mb-6 bg-[#0E1525] p-4 rounded-xl border border-slate-800">
                <label className="text-[10px] font-black text-cyan-400 uppercase mb-2 block">O Fornecedor não está na lista abaixo? Adicione agora:</label>
                <div className="flex gap-3 mb-4">
                  <input type="text" value={fornModalRapido} onChange={e => setFornModalRapido(e.target.value.toUpperCase())} placeholder="Nome do Novo Fornecedor" className="flex-1 bg-[#0B1120] border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-cyan-500" />
                  <button onClick={() => { if(fornModalRapido && !fornecedoresGlobais.includes(fornModalRapido)) { setFornecedoresGlobais([...fornecedoresGlobais, fornModalRapido]); setFornModalRapido(''); } }} className="bg-cyan-900/40 text-cyan-400 border border-cyan-700 hover:bg-cyan-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-colors">Adicionar à Lista</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fornecedoresGlobais.map(f => (
                    <div key={f} className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1120] border border-slate-800 rounded-md text-[10px] font-black text-slate-400">
                      {f} <button onClick={() => setFornecedoresGlobais(fornecedoresGlobais.filter(forn => forn !== f))} className="text-rose-500 hover:text-rose-400 ml-1"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b border-slate-800 pb-2">Vincular Códigos, Qtd e Custos Atuais</h3>
              <p className="text-[10px] text-slate-500 font-bold mb-4">Caso o produto não pertença a algum fornecedor da lista, deixe as caixas em branco.</p>
              <div className="flex flex-col gap-3">
                 {fornecedoresGlobais.map(forn => (
                    <div key={forn} className="flex gap-3 items-center bg-[#0E1525] p-3 rounded-xl border border-slate-800">
                       <div className="w-1/4 font-black text-[11px] text-slate-300 uppercase truncate">{forn}</div>
                       <div className="w-1/4">
                          <input type="text" placeholder="Cód. (Ex: IPZ14)" value={novoProduto.codigos[forn] || ''} onChange={e => setNovoProduto({...novoProduto, codigos: {...novoProduto.codigos, [forn]: e.target.value.toUpperCase()}})} className="w-full bg-[#0B1120] border border-slate-700 text-blue-400 rounded-lg p-2 text-xs font-black outline-none focus:border-blue-500" />
                       </div>
                       <div className="w-1/4">
                          <input type="number" placeholder="Estoque Qtd" value={novoProduto.quantidades[forn] || ''} onChange={e => setNovoProduto({...novoProduto, quantidades: {...novoProduto.quantidades, [forn]: e.target.value}})} className="w-full bg-[#0B1120] border border-slate-700 text-emerald-400 rounded-lg p-2 text-xs font-black outline-none focus:border-emerald-500 text-center appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                       </div>
                       <div className="w-1/4">
                          <input type="number" placeholder="Custo (R$)" value={novoProduto.custos[forn] || ''} onChange={e => setNovoProduto({...novoProduto, custos: {...novoProduto.custos, [forn]: e.target.value}})} className="w-full bg-[#0B1120] border border-slate-700 text-orange-400 rounded-lg p-2 text-xs font-black outline-none focus:border-orange-500 text-right appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                       </div>
                    </div>
                 ))}
              </div>
            </div>
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-[#111A2C]">
              <button onClick={() => setModalAtivo(null)} className="bg-transparent text-slate-400 hover:text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-colors">Cancelar</button>
              <button onClick={handleSalvarNovoProduto} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/50"><Save size={16}/> Salvar na Mesa</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL CARRINHO */}
      {modalAtivo === 'CARRINHO' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E1525] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div className="flex gap-4 items-center w-full">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0"><ShoppingCart size={28} /></div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-3">
                    Carrinho Rápido - {fornecedorAtivo}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#0B1120] border border-slate-700 rounded-lg overflow-hidden shrink-0">
                      <span className="pl-3 text-xs font-bold text-slate-500">PDC:</span>
                      <input type="text" value={numeroPdc} onChange={e => setNumeroPdc(e.target.value)} placeholder="Nº do PDC..." className="bg-transparent text-emerald-400 font-black text-xs p-2 outline-none w-28 placeholder-slate-600 focus:bg-slate-800 transition-colors" />
                    </div>
                    
                    <div className="relative group shrink-0 w-64 z-50">
                      <div className="flex items-center gap-2 bg-[#0B1120] border border-slate-700 rounded-lg px-3 py-2 cursor-pointer group-hover:border-cyan-500 transition-colors" onClick={(e) => { e.stopPropagation(); setMenuLojaAberto(!menuLojaAberto); }}>
                        <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Loja:</span>
                        <span className="text-cyan-400 font-black text-xs uppercase flex-1 truncate">
                          {lojaSelecionada || 'S / LOJA (CADASTRAR)'}
                        </span>
                        <ChevronDown size={14} className="text-slate-500" />
                      </div>
                      
                      {menuLojaAberto && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-[#0B1120] border border-slate-700 rounded-xl shadow-2xl py-2 z-100 max-h-48 overflow-y-auto custom-scrollbar">
                          <div onClick={() => { setLojaSelecionada(''); setMenuLojaAberto(false); }} className="px-4 py-2 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors text-xs font-bold text-slate-300">S / LOJA (CADASTRAR DEPOIS)</div>
                          {lojasGlobais.map(l => (
                            <div key={l} className="flex justify-between items-center px-4 py-2 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors group/item">
                              <span onClick={() => { setLojaSelecionada(l); setMenuLojaAberto(false); }} className="text-xs font-bold text-cyan-400 group-hover/item:text-white uppercase flex-1">{l}</span>
                              <button onClick={(e) => { e.stopPropagation(); setLojasGlobais(lojasGlobais.filter(loja => loja !== l)); if(lojaSelecionada === l) setLojaSelecionada(''); }} className="text-rose-500 hover:text-rose-300 ml-2"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-[#0B1120] border border-slate-700 rounded-lg overflow-hidden w-48 px-2 shrink-0">
                      <input type="text" value={novaLoja} onChange={e => setNovaLoja(e.target.value.toUpperCase())} placeholder="NOVA LOJA" className="bg-transparent text-white font-black text-xs p-2 outline-none w-full" />
                      <button onClick={() => { if(novaLoja && !lojasGlobais.includes(novaLoja)) { setLojasGlobais([...lojasGlobais, novaLoja]); setNovaLoja(''); } }} className="text-emerald-400 hover:text-emerald-300 p-1 shrink-0"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setModalAtivo(null)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-slate-800/50 transition-colors ml-4 shrink-0"><X size={20} /></button>
            </div>
            
            <div className="px-6 py-4 bg-[#0B1120] border-b border-slate-800 flex justify-end">
              <div className="flex gap-4 items-center bg-[#0E1525] border border-slate-800 rounded-xl p-1.5">
                <div className="px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Saldo Disp. ({fornecedorAtivo})</p>
                  <p className="text-xs text-blue-400 font-black">{formatMoney(saldoCreditoDisponivel)}</p>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-slate-700 focus-within:border-emerald-500 transition-colors">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Créd. Utilizado:</span>
                  <input type="number" value={creditoUtilizado} onChange={e => setCreditoUtilizado(e.target.value)} placeholder="R$ 0,00" className="bg-transparent text-white font-black text-xs p-1 outline-none w-20 text-right appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#0B1120] p-6 z-0">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50">
                  <ShoppingCart size={48} className="text-slate-500 mb-4" />
                  <p className="text-slate-400 font-bold">O carrinho está vazio. Adicione itens da mesa.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 font-black">Produto</th>
                      <th className="pb-3 font-black text-center">Qtd</th>
                      <th className="pb-3 font-black text-right">V. Unitário</th>
                      <th className="pb-3 font-black text-right">Total</th>
                      <th className="pb-3 font-black text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {carrinho.map((item, index) => (
                      <tr key={index} className="text-slate-300 font-bold hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 text-cyan-400">{item.descricaoLimpa}</td>
                        <td className="py-4 text-center text-emerald-400 font-black">{item.quantidadePedida}</td>
                        <td className="py-4 text-right">{formatMoney(item.valorUnitario)}</td>
                        <td className="py-4 text-right text-emerald-400 font-black">{formatMoney(item.subtotal)}</td>
                        <td className="py-4 text-center">
                          <button onClick={() => {
                            setProdutos(produtos.map(p => p.id === item.produtoId ? { ...p, qtdComprar: '' } : p));
                            setCarrinho(carrinho.filter((_, i) => i !== index));
                          }} className="text-rose-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-[#0E1525]">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Valor Final a Pagar</p>
                <h3 className="text-2xl font-black text-emerald-400">{formatMoney(Math.max(0, carrinho.reduce((a, b) => a + b.subtotal, 0) - (Number(creditoUtilizado) || 0)))}</h3>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setModalAtivo(null)} className="text-slate-400 hover:text-white px-6 py-3 rounded-xl font-black text-xs transition-colors">CANCELAR</button>
                <button onClick={handleFinalizarPedido} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/30 uppercase text-xs">CONCLUIR PEDIDO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}