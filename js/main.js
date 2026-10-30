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
  const canvasContainer = document.getElementById('canvas-container');
  const viewport = document.getElementById('viewport');

  // 1. Núcleos
  const historyManager = new HistoryManager();
  const layerManager = new LayerManager(canvasContainer, 1280, 720, historyManager);
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

  // Função auxiliar para atualizar o canvas ativo quando trocar de camada ou frame
  function atualizarReferenciaCanvasAtivo() {
    canvasAtivo = layerManager.obterCanvasAtivo();
    ctxAtivo = layerManager.obterCtxAtivo();
    // Reinicializa o pincel no novo canvas ativo
    pincelEngine = inicializarPincel(canvasAtivo, historyManager, colorManager);
  }

  // Interceção de cliques no workspace consoante a ferramenta ativa
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

  // 3. Conexão de Botões da Interface (UI)
  function ativarBotaoFerramenta(idBotao, nomeFerramenta) {
    document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('active'));
    document.getElementById(idBotao).classList.add('active');
    ferramentaAtual = nomeFerramenta;
  }

  document.getElementById('btnPincel').onclick = () => {
    ativarBotaoFerramenta('btnPincel', 'pincel');
    pincelEngine.setModoBorracha(false);
  };

  document.getElementById('btnBorracha').onclick = () => {
    ativarBotaoFerramenta('btnBorracha', 'borracha');
    pincelEngine.setModoBorracha(true);
  };

  document.getElementById('btnBalde').onclick = () => ativarBotaoFerramenta('btnBalde', 'balde');
  document.getElementById('btnFormas').onclick = () => ativarBotaoFerramenta('btnFormas', 'formas');
  document.getElementById('btnSelecao').onclick = () => ativarBotaoFerramenta('btnSelecao', 'selecao');
  document.getElementById('btnMaozinha').onclick = () => {
    ativarBotaoFerramenta('btnMaozinha', 'maozinha');
    maozinhaTool.setAtivo(true);
  };

  // Gestão de Camadas na UI
  document.getElementById('btnAddCamada').onclick = () => {
    layerManager.adicionarCamada();
    atualizarReferenciaCanvasAtivo();
  };

  document.getElementById('btnDuplicarCamada').onclick = () => {
    layerManager.duplicarCamada();
    atualizarReferenciaCanvasAtivo();
  };

  document.getElementById('btnRemoverCamada').onclick = () => {
    layerManager.removerCamada();
    atualizarReferenciaCanvasAtivo();
  };

  // Histórico e Zoom
  document.getElementById('btnDesfazer').onclick = () => historyTool.desfazer();
  document.getElementById('btnRefazer').onclick = () => historyTool.refazer();
  document.getElementById('btnZoomIn').onclick = () => zoomTool.zoomIn();
  document.getElementById('btnZoomOut').onclick = () => zoomTool.zoomOut();
  document.getElementById('btnZoomReset').onclick = () => zoomTool.resetZoom();

  // Cores
  const pickerCor = document.getElementById('pickerCorPrimaria');
  pickerCor.oninput = (e) => colorManager.setCorPrimaria(e.target.value);
  colorManager.aoMudarCorPrimaria = (cor) => { pickerCor.value = cor; };

  document.getElementById('btnTrocarCores').onclick = () => colorManager.inverterCores();
  document.getElementById('btnContaGotas').onclick = () => colorManager.ativarContaGotas(true);

  // Timeline e Frames
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
    atualizarReferenciaCanvasAtivo();
  };

  document.getElementById('btnAddFrameEsq').onclick = () => {
    animationManager.adicionarNovoFrameEsquerda();
    renderizarTimeline();
    atualizarReferenciaCanvasAtivo();
  };

  document.getElementById('btnDuplicarFrame').onclick = () => {
    animationManager.duplicarFrameAtual();
    renderizarTimeline();
    atualizarReferenciaCanvasAtivo();
  };

  document.getElementById('btnExcluirFrame').onclick = () => {
    animationManager.excluirFrameAtual();
    renderizarTimeline();
    atualizarReferenciaCanvasAtivo();
  };

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
  console.log('PopFlipariz totalmente integrado e interativo!');
});
