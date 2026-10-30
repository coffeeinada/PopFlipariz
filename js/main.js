/**
 * PopFlipariz - Ponto de Entrada Principal (Com Sistema de Paletas Completo)
 * Caminho: js/main.js
 */

import { HistoryManager } from './core/history.js';
import { LayerManager } from './core/layer-manager.js';
import { AnimationManager } from './core/animacao.js';
import { inicializarSistemaAntiPerda } from './core/anti-perda.js';

import { ColorManager } from './tools/cores.js';
import { PaletteManager } from './tools/paletas.js';
import { PincelTool, inicializarPincel } from './tools/pincel.js';
import { FloodFillTool } from './tools/balde.js';
import { FormasTool } from './tools/formas.js';
import { SelectionTool } from './tools/selecao.js';
import { HandTool } from './tools/maozinha.js';
import { ZoomTool } from './tools/zoom.js';
import { HistoryTool } from './tools/historico.js';
import { FileTool } from './tools/arquivo.js';

function iniciarPopFlipariz() {
  try {
    const canvasContainer = document.getElementById('canvas-container');
    const viewport = document.getElementById('viewport');

    if (!canvasContainer) {
      console.error('Erro crítico: Elemento #canvas-container não encontrado no DOM.');
      return;
    }

    // 1. Núcleos
    const historyManager = new HistoryManager();
    const layerManager = new LayerManager(canvasContainer, 1280, 720, historyManager);
    historyManager.definirLayerManager(layerManager);

    const animationManager = new AnimationManager(layerManager, historyManager);
    inicializarSistemaAntiPerda();

    // 2. Ferramentas e Gestores
    let canvasAtivo = layerManager.obterCanvasAtivo();
    let ctxAtivo = layerManager.obterCtxAtivo();

    const colorManager = new ColorManager(canvasAtivo, ctxAtivo);
    const paletteManager = new PaletteManager(colorManager);

    let pincelEngine = inicializarPincel(canvasAtivo, historyManager, colorManager);
    const baldeTool = new FloodFillTool(layerManager, historyManager, colorManager);
    const formasTool = new FormasTool(layerManager, historyManager, colorManager);
    const selecaoTool = new SelectionTool(layerManager, historyManager, colorManager);
    const maozinhaTool = new HandTool(viewport, canvasContainer);
    const zoomTool = new ZoomTool(canvasContainer);
    const historyTool = new HistoryTool(historyManager);
    const fileTool = new FileTool(layerManager, historyManager, animationManager);

    let ferramentaAtual = 'pincel';

    function atualizarReferenciaCanvasAtivo() {
      canvasAtivo = layerManager.obterCanvasAtivo();
      ctxAtivo = layerManager.obterCtxAtivo();
      if (pincelEngine && typeof pincelEngine.atualizarCanvas === 'function') {
        pincelEngine.atualizarCanvas(canvasAtivo);
      }
    }

    // Interceção de cliques no canvas ativo (Balde e Formas)
    canvasContainer.addEventListener('mousedown', (e) => {
      atualizarReferenciaCanvasAtivo();
      if (ferramentaAtual === 'balde') {
        if (typeof baldeTool.executar === 'function') baldeTool.executar(e);
      } else if (ferramentaAtual === 'formas') {
        const rect = canvasAtivo.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
        if (typeof formasTool.iniciarForma === 'function') formasTool.iniciarForma(x, y);
      }
    });

    canvasContainer.addEventListener('mouseup', (e) => {
      if (ferramentaAtual === 'formas') {
        const rect = canvasAtivo.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
        if (typeof formasTool.atualizarProgresso === 'function') {
          formasTool.atualizarProgresso(x, y);
          formasTool.fixarFormaNoCanvas();
        }
      }
    });

    // Função segura para ligar cliques a botões da interface
    function ligarBotao(id, callback) {
      const el = document.getElementById(id);
      if (el) el.onclick = callback;
    }

    function ativarBotaoFerramenta(idBotao, nomeFerramenta) {
      document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(idBotao);
      if (btn) btn.classList.add('active');
      ferramentaAtual = nomeFerramenta;
    }

    // Ligar ferramentas de desenho
    ligarBotao('btnPincel', () => {
      ativarBotaoFerramenta('btnPincel', 'pincel');
      if (pincelEngine) pincelEngine.setModoBorracha(false);
    });

    ligarBotao('btnBorracha', () => {
      ativarBotaoFerramenta('btnBorracha', 'borracha');
      if (pincelEngine) pincelEngine.setModoBorracha(true);
    });

    ligarBotao('btnBalde', () => ativarBotaoFerramenta('btnBalde', 'balde'));
    ligarBotao('btnFormas', () => ativarBotaoFerramenta('btnFormas', 'formas'));
    ligarBotao('btnSelecao', () => ativarBotaoFerramenta('btnSelecao', 'selecao'));
    ligarBotao('btnMaozinha', () => {
      ativarBotaoFerramenta('btnMaozinha', 'maozinha');
      if (typeof maozinhaTool.setAtivo === 'function') maozinhaTool.setAtivo(true);
    });

    // Atalhos Globais de Teclado (B para Pincel, E para Borracha)
    document.addEventListener('keydown', (e) => {
      const tagAtiva = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tagAtiva === 'input' || tagAtiva === 'textarea' || tagAtiva === 'select') return;

      const tecla = e.key.toLowerCase();
      if (tecla === 'b') {
        const btnPincel = document.getElementById('btnPincel');
        if (btnPincel) btnPincel.click();
      } else if (tecla === 'e') {
        const btnBorracha = document.getElementById('btnBorracha');
        if (btnBorracha) btnBorracha.click();
      }
    });

    // --- RENDERIZAÇÃO E GESTÃO DA UI DE PALETAS DE CORES ---
    const selectPaleta = document.getElementById('selectPaleta');
    const containerCoresPaleta = document.getElementById('paleta-cores-container');
    const pickerCor = document.getElementById('pickerCorPrimaria');

    function renderizarPaletasUI() {
      if (!selectPaleta || !containerCoresPaleta) return;

      // 1. Atualizar dropdown de paletas
      selectPaleta.innerHTML = '';
      paletteManager.paletas.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.nome;
        if (p.id === paletteManager.paletaAtivaId) opt.selected = true;
        selectPaleta.appendChild(opt);
      });

      // 2. Renderizar swatches de cor da paleta ativa
      containerCoresPaleta.innerHTML = '';
      const paletaAtiva = paletteManager.obterPaletaAtiva();

      paletaAtiva.cores.forEach((corHex, idx) => {
        const swatch = document.createElement('div');
        swatch.style.width = '24px';
        swatch.style.height = '24px';
        swatch.style.backgroundColor = corHex;
        swatch.style.borderRadius = '4px';
        swatch.style.cursor = 'pointer';
        swatch.style.border = paletteManager.indiceCorSelecionada === idx ? '2px solid #fff' : '1px solid #444';
        swatch.title = corHex;

        // Clicar na cor define-a como cor primária atual e seleciona-a para substituição/remoção
        swatch.onclick = () => {
          paletteManager.indiceCorSelecionada = idx;
          colorManager.setCorPrimaria(corHex);
          renderizarPaletasUI();
        };

        containerCoresPaleta.appendChild(swatch);
      });
    }

    if (selectPaleta) {
      selectPaleta.onchange = (e) => {
        paletteManager.mudarPaleta(e.target.value);
        renderizarPaletasUI();
      };
    }

    // Botões de Gestão de Paleta
    ligarBotao('btnNovaPaleta', () => {
      const nome = prompt('Nome da nova paleta de cores:', 'Minha Paleta 💖');
      if (nome !== null) {
        paletteManager.criarPaleta(nome);
        renderizarPaletasUI();
      }
    });

    ligarBotao('btnExcluirPaleta', () => {
      const paleta = paletteManager.obterPaletaAtiva();
      if (confirm(`Tens a certeza que pretendes excluir a paleta "${paleta.nome}"?`)) {
        paletteManager.excluirPaletaAtiva();
        renderizarPaletasUI();
      }
    });

    // Ações de Cores na Paleta
    ligarBotao('btnAddCorPaleta', () => {
      paletteManager.adicionarCorAtual();
      renderizarPaletasUI();
    });

    ligarBotao('btnSubstituirCor', () => {
      paletteManager.substituirCorSelecionada();
      renderizarPaletasUI();
    });

    ligarBotao('btnRemoverCor', () => {
      paletteManager.removerCorSelecionada();
      renderizarPaletasUI();
    });

    // Exportar e Importar Paletas
    ligarBotao('btnExportarPaletas', () => {
      paletteManager.exportarPaletas();
    });

    const inputImportarPaletas = document.getElementById('inputImportarPaletas');
    ligarBotao('btnImportarPaletas', () => {
      if (inputImportarPaletas) inputImportarPaletas.click();
    });

    if (inputImportarPaletas) {
      inputImportarPaletas.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const sucesso = paletteManager.importarPaletas(evt.target.result);
          if (sucesso) {
            renderizarPaletasUI();
            alert('Paletas importadas com sucesso!');
          }
        };
        reader.readAsText(file);
        inputImportarPaletas.value = '';
      };
    }

    // Seletor de Cores Primárias
    if (pickerCor) {
      pickerCor.oninput = (e) => colorManager.setCorPrimaria(e.target.value);
      colorManager.aoMudarCorPrimaria = (cor) => { pickerCor.value = cor; };
    }

    ligarBotao('btnTrocarCores', () => colorManager.inverterCores());

    // Inicialização da UI de Paletas
    renderizarPaletasUI();

    // Ligações dos Controlos do Pincel
    const inputTamanho = document.getElementById('inputTamanho');
    if (inputTamanho) {
      inputTamanho.oninput = (e) => { if (pincelEngine) pincelEngine.setTamanho(e.target.value); };
    }

    const inputOpacidade = document.getElementById('inputOpacidade');
    if (inputOpacidade) {
      inputOpacidade.oninput = (e) => { if (pincelEngine) pincelEngine.setOpacidade(e.target.value); };
    }

    const inputEstabilizador = document.getElementById('inputEstabilizador');
    if (inputEstabilizador) {
      inputEstabilizador.oninput = (e) => { if (pincelEngine) pincelEngine.setEstabilizador(e.target.value); };
    }

    const selectTipoPincel = document.getElementById('selectTipoPincel');
    if (selectTipoPincel) {
      selectTipoPincel.onchange = (e) => { if (pincelEngine) pincelEngine.setTipo(e.target.value); };
    }

    // Ligações dos Controlos da Borracha
    const inputTamanhoBorracha = document.getElementById('inputTamanhoBorracha');
    if (inputTamanhoBorracha) {
      inputTamanhoBorracha.oninput = (e) => { if (pincelEngine) pincelEngine.setEraserSize(e.target.value); };
    }

    const inputOpacidadeBorracha = document.getElementById('inputOpacidadeBorracha');
    if (inputOpacidadeBorracha) {
      inputOpacidadeBorracha.oninput = (e) => { if (pincelEngine) pincelEngine.setEraserOpacity(e.target.value); };
    }

    const selectFormaBorracha = document.getElementById('selectFormaBorracha');
    if (selectFormaBorracha) {
      selectFormaBorracha.onchange = (e) => { if (pincelEngine) pincelEngine.setEraserShape(e.target.value); };
    }

    const selectTipoBorracha = document.getElementById('selectTipoBorracha');
    if (selectTipoBorracha) {
      selectTipoBorracha.onchange = (e) => { if (pincelEngine) pincelEngine.setEraserType(e.target.value); };
    }

    // Gestão de Camadas
    ligarBotao('btnAddCamada', () => {
      layerManager.adicionarCamada();
      atualizarReferenciaCanvasAtivo();
    });

    ligarBotao('btnDuplicarCamada', () => {
      layerManager.duplicarCamada();
      atualizarReferenciaCanvasAtivo();
    });

    ligarBotao('btnRemoverCamada', () => {
      layerManager.removerCamada();
      atualizarReferenciaCanvasAtivo();
    });

    // Gestão de Ficheiros
    ligarBotao('btnNovoProjeto', () => {
      if (confirm('Criar um novo projeto vai limpar o trabalho atual. Desejas continuar?')) {
        if (typeof fileTool.novoProjeto === 'function') fileTool.novoProjeto();
        renderizarTimeline();
        layerManager.atualizarUIlistaCamadas();
        atualizarReferenciaCanvasAtivo();
      }
    });

    ligarBotao('btnExportar', () => {
      if (typeof fileTool.exportarProjeto === 'function') fileTool.exportarProjeto();
    });

    // Histórico e Zoom
    ligarBotao('btnDesfazer', () => historyTool.desfazer());
    ligarBotao('btnRefazer', () => historyTool.refazer());
    ligarBotao('btnZoomIn', () => zoomTool.zoomIn());
    ligarBotao('btnZoomOut', () => zoomTool.zoomOut());
    ligarBotao('btnZoomReset', () => zoomTool.resetZoom());

    // Timeline e Animação
    ligarBotao('btnPlayPause', () => {
      const btnPlay = document.getElementById('btnPlayPause');
      if (animationManager.reproduzindo) {
        animationManager.pause();
        if (btnPlay) btnPlay.innerText = '▶️ Play';
      } else {
        animationManager.play();
        if (btnPlay) btnPlay.innerText = '⏸️ Pause';
      }
    });

    ligarBotao('btnAddFrameDir', () => {
      animationManager.adicionarNovoFrameDireita();
      renderizarTimeline();
      atualizarReferenciaCanvasAtivo();
    });

    ligarBotao('btnAddFrameEsq', () => {
      animationManager.adicionarNovoFrameEsquerda();
      renderizarTimeline();
      atualizarReferenciaCanvasAtivo();
    });

    ligarBotao('btnDuplicarFrame', () => {
      animationManager.duplicarFrameAtual();
      renderizarTimeline();
      atualizarReferenciaCanvasAtivo();
    });

    ligarBotao('btnExcluirFrame', () => {
      animationManager.excluirFrameAtual();
      renderizarTimeline();
      atualizarReferenciaCanvasAtivo();
    });

    const inputFPS = document.getElementById('inputFPS');
    if (inputFPS) {
      inputFPS.onchange = (e) => {
        if (typeof animationManager.setFPS === 'function') {
          animationManager.setFPS(parseInt(e.target.value) || 12);
        }
      };
    }

    const chkLoop = document.getElementById('chkLoop');
    if (chkLoop) {
      chkLoop.onchange = (e) => {
        if (typeof animationManager.setLoop === 'function') {
          animationManager.setLoop(e.target.checked);
        }
      };
    }

    function renderizarTimeline() {
      const container = document.getElementById('timeline-frames-container');
      if (!container) return;
      container.innerHTML = '';
      animationManager.frames.forEach((frame, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `frame-thumb ${idx === animationManager.indiceFrameAtual ? 'active' : ''}`;
        thumb.innerText = `F-${idx + 1}`;
        thumb.onclick = () => {
          animationManager.carregarFrameNoWorkspace(idx);
          renderizarTimeline();
          atualizarReferenciaCanvasAtivo();
        };
        container.appendChild(thumb);
      });
    }

    renderizarTimeline();
    layerManager.atualizarUIlistaCamadas();
    console.log('PopFlipariz carregado e ativo com sucesso!');

  } catch (erro) {
    console.error('Erro fatal ao iniciar o PopFlipariz:', erro);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarPopFlipariz);
} else {
  iniciarPopFlipariz();
}
