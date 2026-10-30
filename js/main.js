/**
 * PopFlipariz - Ponto de Entrada Principal (Completo e Integrado)
 * Caminho: js/main.js
 */

import { HistoryManager } from './core/history.js';
import { LayerManager } from './core/layer-manager.js';
import { AnimationManager } from './core/animacao.js';
import { inicializarSistemaAntiPerda } from './core/anti-perda.js';

import { ColorManager } from './tools/cores.js';
import { PincelTool, inicializarPincel } from './tools/pincel.js';
import { FloodFillTool } from './tools/balde.js';
import { FormasTool } from './tools/formas.js';
import { SelectionTool } from './tools/selecao.js';
import { HandTool } from './tools/maozinha.js';
import { ZoomTool } from './tools/zoom.js';
import { HistoryTool } from './tools/historico.js';
import { FileTool } from './tools/arquivo.js';

document.addEventListener('DOMContentLoaded', () => {
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
    
    // Vincula o layerManager ao historyManager para evitar erros de referência no arranque
    historyManager.definirLayerManager(layerManager);

    const animationManager = new AnimationManager(layerManager, historyManager);
    
    inicializarSistemaAntiPerda();

    // 2. Ferramentas
    let canvasAtivo = layerManager.obterCanvasAtivo();
    let ctxAtivo = layerManager.obterCtxAtivo();

    const colorManager = new ColorManager(canvasAtivo, ctxAtivo);
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

    // Interceção de desenho no canvas ativo
    canvasContainer.addEventListener('mousedown', (e) => {
      atualizarReferenciaCanvasAtivo();
      if (ferramentaAtual === 'balde') {
        baldeTool.executar(e);
      } else if (ferramentaAtual === 'formas') {
        const rect = canvasAtivo.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
        formasTool.iniciarForma(x, y);
      }
    });

    canvasContainer.addEventListener('mouseup', (e) => {
      if (ferramentaAtual === 'formas') {
        const rect = canvasAtivo.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
        formasTool.atualizarProgresso(x, y);
        formasTool.fixarFormaNoCanvas();
      }
    });

    // 3. Função segura para ligar cliques a botões da interface
    function ligarBotao(id, callback) {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = callback;
      }
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
      maozinhaTool.setAtivo(true);
    });

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

    // Histórico e Zoom
    ligarBotao('btnDesfazer', () => historyTool.desfazer());
    ligarBotao('btnRefazer', () => historyTool.refazer());
    ligarBotao('btnZoomIn', () => zoomTool.zoomIn());
    ligarBotao('btnZoomOut', () => zoomTool.zoomOut());
    ligarBotao('btnZoomReset', () => zoomTool.resetZoom());

    // Seletor de Cores
    const pickerCor = document.getElementById('pickerCorPrimaria');
    if (pickerCor) {
      pickerCor.oninput = (e) => colorManager.setCorPrimaria(e.target.value);
      colorManager.aoMudarCorPrimaria = (cor) => { pickerCor.value = cor; };
    }

    ligarBotao('btnTrocarCores', () => colorManager.inverterCores());
    ligarBotao('btnContaGotas', () => colorManager.ativarContaGotas(true));

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
    console.log('PopFlipariz carregado com sucesso!');

  } catch (erro) {
    console.error('Erro fatal ao iniciar o PopFlipariz:', erro);
  }
});
