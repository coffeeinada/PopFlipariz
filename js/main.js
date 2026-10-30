/**
 * PopFlipariz - Ponto de Entrada Principal e Integração de Módulos
 * Caminho: js/main.js
 */

import { HistoryManager } from './core/history.js';
import { LayerManager } from './core/layer-manager.js';
import { AnimationManager } from './core/animacao.js';
import { inicializarSistemaAntiPerda } from './core/anti-perda.js';

import { ColorManager } from './tools/cores.js';
import { inicializarPincel } from './tools/pincel.js';
import { FloodFillTool } from './tools/balde.js';
import { FormasTool } from './tools/formas.js';
import { SelectionTool } from './tools/selecao.js';
import { HandTool } from './tools/maozinha.js';
import { ZoomTool } from './tools/zoom.js';
import { HistoryTool } from './tools/historico.js';
import { FileTool } from './tools/arquivo.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const canvasContainer = document.getElementById('canvas-container');
  const viewport = document.getElementById('viewport');

  // 1. Inicializar Núcleos (Core)
  const historyManager = new HistoryManager();
  const layerManager = new LayerManager(canvasContainer, 1280, 720, historyManager);
  const animationManager = new AnimationManager(layerManager, historyManager);
  
  // Ativar o código anti-perda acidental
  inicializarSistemaAntiPerda();

  // 2. Inicializar Ferramentas (Tools)
  const canvasAtivo = layerManager.obterCanvasAtivo();
  const ctxAtivo = layerManager.obterCtxAtivo();

  const colorManager = new ColorManager(canvasAtivo, ctxAtivo);
  const pincelEngine = inicializarPincel(canvasAtivo, historyManager, colorManager);
  const baldeTool = new FloodFillTool(layerManager, historyManager, colorManager);
  const formasTool = new FormasTool(layerManager, historyManager, colorManager);
  const selecaoTool = new SelectionTool(layerManager, historyManager, colorManager);
  const maozinhaTool = new HandTool(viewport, canvasContainer);
  const zoomTool = new ZoomTool(canvasContainer);
  const historyTool = new HistoryTool(historyManager);
  const fileTool = new FileTool(layerManager, historyManager, animationManager);

  // 3. Conectar a Interface (UI Binding)
  document.getElementById('btnDesfazer').onclick = () => historyTool.desfazer();
  document.getElementById('btnRefazer').onclick = () => historyTool.refazer();

  document.getElementById('btnZoomIn').onclick = () => zoomTool.zoomIn();
  document.getElementById('btnZoomOut').onclick = () => zoomTool.zoomOut();
  document.getElementById('btnZoomReset').onclick = () => zoomTool.resetZoom();

  // Seletor de Cores
  const pickerCor = document.getElementById('pickerCorPrimaria');
  pickerCor.oninput = (e) => colorManager.setCorPrimaria(e.target.value);
  colorManager.aoMudarCorPrimaria = (cor) => { pickerCor.value = cor; };

  document.getElementById('btnTrocarCores').onclick = () => colorManager.inverterCores();
  document.getElementById('btnContaGotas').onclick = () => colorManager.ativarContaGotas(true);

  // Botões de Ferramentas
  document.getElementById('btnPincel').onclick = () => pincelEngine.setFerramenta('pincel');
  document.getElementById('btnBorracha').onclick = () => pincelEngine.setFerramenta('borracha');

  // Controlo da Linha do Tempo FBF
  document.getElementById('btnPlayPause').onclick = () => {
    if (animationManager.reproduzindo) {
      animationManager.pause();
      document.getElementById('btnPlayPause').innerText = '▶️ Play';
    } else {
      animationManager.play();
      document.getElementById('btnPlayPause').innerText = '⏸️ Pause';
    }
  };

  document.getElementById('btnAddFrameDir').onclick = () => {
    animationManager.adicionarNovoFrameDireita();
    renderizarTimeline();
  };

  document.getElementById('btnAddFrameEsq').onclick = () => {
    animationManager.adicionarNovoFrameEsquerda();
    renderizarTimeline();
  };

  document.getElementById('btnDuplicarFrame').onclick = () => {
    animationManager.duplicarFrameAtual();
    renderizarTimeline();
  };

  document.getElementById('btnExcluirFrame').onclick = () => {
    animationManager.excluirFrameAtual();
    renderizarTimeline();
  };

  function renderizarTimeline() {
    const container = document.getElementById('timeline-frames-container');
    container.innerHTML = '';
    animationManager.frames.forEach((frame, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `frame-thumb ${idx === animationManager.indiceFrameAtual ? 'active' : ''}`;
      thumb.innerText = `F-${idx + 1}`;
      thumb.onclick = () => {
        animationManager.carregarFrameNoWorkspace(idx);
        renderizarTimeline();
      };
      container.appendChild(thumb);
    });
  }

  // Renderização inicial dos quadros na timeline
  renderizarTimeline();

  console.log('PopFlipariz carregado com sucesso!');
});
