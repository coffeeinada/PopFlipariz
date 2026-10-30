/**
 * PopFlipariz - Ponto de Entrada Principal (Com Camadas Avançadas, Pastas e Ponto de Fuga)
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
import { PontoFugaTool } from './tools/ponto-fuga.js';

function iniciarPopFlipariz() {
  try {
    const canvasContainer = document.getElementById('canvas-container');
    const viewport = document.getElementById('viewport');

    if (!canvasContainer) {
      console.error('Erro crítico: #canvas-container não encontrado.');
      return;
    }

    const historyManager = new HistoryManager();
    const layerManager = new LayerManager(canvasContainer, 1280, 720, historyManager);
    historyManager.definirLayerManager(layerManager);

    const animationManager = new AnimationManager(layerManager, historyManager);
    inicializarSistemaAntiPerda();

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
    const pontoFugaTool = new PontoFugaTool(canvasContainer);

    let ferramentaAtual = 'pincel';

    function atualizarReferenciaCanvasAtivo() {
      canvasAtivo = layerManager.obterCanvasAtivo();
      ctxAtivo = layerManager.obterCtxAtivo();
      if (pincelEngine && typeof pincelEngine.atualizarCanvas === 'function') {
        pincelEngine.atualizarCanvas(canvasAtivo);
      }
    }

    // Interceção de cliques e movimentos no workspace
    canvasContainer.addEventListener('mousedown', (e) => {
      atualizarReferenciaCanvasAtivo();
      if (ferramentaAtual === 'balde') {
        if (typeof baldeTool.executar === 'function') baldeTool.executar(e);
      } else if (ferramentaAtual === 'formas') {
        formasTool.iniciar(e);
      } else if (ferramentaAtual === 'pontofuga') {
        pontoFugaTool.atualizarPosicao(e, canvasAtivo);
      }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
      if (ferramentaAtual === 'formas') {
        formasTool.mover(e);
      } else if (ferramentaAtual === 'pontofuga' && e.buttons === 1) {
        pontoFugaTool.atualizarPosicao(e, canvasAtivo);
      }
    });

    canvasContainer.addEventListener('mouseup', (e) => {
      if (ferramentaAtual === 'formas') {
        formasTool.soltar();
      }
    });

    function ligarBotao(id, callback) {
      const el = document.getElementById(id);
      if (el) el.onclick = callback;
    }

    function ativarBotaoFerramenta(idBotao, nomeFerramenta) {
      document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(idBotao);
      if (btn) btn.classList.add('active');
      ferramentaAtual = nomeFerramenta;

      const painelPF = document.getElementById('panelPontoFuga');
      if (painelPF) {
        painelPF.style.display = (nomeFerramenta === 'pontofuga') ? 'flex' : 'none';
      }
    }

    ligarBotao('btnPincel', () => { ativarBotaoFerramenta('btnPincel', 'pincel'); if (pincelEngine) pincelEngine.setModoBorracha(false); });
    ligarBotao('btnBorracha', () => { ativarBotaoFerramenta('btnBorracha', 'borracha'); if (pincelEngine) pincelEngine.setModoBorracha(true); });
    ligarBotao('btnBalde', () => ativarBotaoFerramenta('btnBalde', 'balde'));
    ligarBotao('btnFormas', () => ativarBotaoFerramenta('btnFormas', 'formas'));
    ligarBotao('btnSelecao', () => ativarBotaoFerramenta('btnSelecao', 'selecao'));
    ligarBotao('btnMaozinha', () => { ativarBotaoFerramenta('btnMaozinha', 'maozinha'); if (typeof maozinhaTool.setAtivo === 'function') maozinhaTool.setAtivo(true); });
    ligarBotao('btnPontoFuga', () => ativarBotaoFerramenta('btnPontoFuga', 'pontofuga'));

    // Atalhos Globais B e E + Atalhos de Camada (Ctrl+C / Ctrl+V)
    document.addEventListener('keydown', (e) => {
      const tagAtiva = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tagAtiva === 'input' || tagAtiva === 'textarea' || tagAtiva === 'select') return;

      const tecla = e.key.toLowerCase();
      if (tecla === 'b') {
        document.getElementById('btnPincel')?.click();
      } else if (tecla === 'e') {
        document.getElementById('btnBorracha')?.click();
      } else if (e.ctrlKey && tecla === 'c') {
        e.preventDefault();
        layerManager.copiarCamadaAtual();
      } else if (e.ctrlKey && tecla === 'v') {
        e.preventDefault();
        layerManager.colarCamada();
        atualizarReferenciaCanvasAtivo();
      }
    });

    // Gestão de Camadas Avançada UI
    ligarBotao('btnAddCamada', () => { layerManager.adicionarCamada(); atualizarReferenciaCanvasAtivo(); });
    ligarBotao('btnAddPasta', () => { layerManager.adicionarPasta(); });
    ligarBotao('btnDuplicarCamada', () => { layerManager.duplicarCamada(); atualizarReferenciaCanvasAtivo(); });
    ligarBotao('btnRemoverCamada', () => { layerManager.removerCamada(); atualizarReferenciaCanvasAtivo(); });
    ligarBotao('btnLimparCamada', () => { layerManager.limparCamadaAtual(); atualizarReferenciaCanvasAtivo(); });
    ligarBotao('btnEspelharH', () => { layerManager.espelharHorizontal(); atualizarReferenciaCanvasAtivo(); });
    ligarBotao('btnEspelharV', () => { layerManager.espelharVertical(); atualizarReferenciaCanvasAtivo(); });

    const selectBlendMode = document.getElementById('selectBlendMode');
    if (selectBlendMode) {
      selectBlendMode.onchange = (e) => {
        layerManager.definirModoMesclagemAtual(e.target.value);
      };
    }

    // Ponto de Fuga & Grade UI
    const chkAtivarGrade = document.getElementById('chkAtivarGrade');
    if (chkAtivarGrade) chkAtivarGrade.onchange = (e) => pontoFugaTool.setAtivarGrade(e.target.checked);

    const chkAtivarPontoFuga = document.getElementById('chkAtivarPontoFuga');
    if (chkAtivarPontoFuga) chkAtivarPontoFuga.onchange = (e) => pontoFugaTool.setAtivarPontoFuga(e.target.checked);

    const pickerCorGuia = document.getElementById('pickerCorGuia');
    if (pickerCorGuia) pickerCorGuia.oninput = (e) => pontoFugaTool.setCorGuia(e.target.value);

    const inputLarguraGuia = document.getElementById('inputLarguraGuia');
    if (inputLarguraGuia) inputLarguraGuia.oninput = (e) => pontoFugaTool.setLarguraGuia(e.target.value);

    const inputQtdLinhasFuga = document.getElementById('inputQtdLinhasFuga');
    if (inputQtdLinhasFuga) inputQtdLinhasFuga.oninput = (e) => pontoFugaTool.setQtdLinhas(e.target.value);

    // Paletas e cores...
    const selectPaleta = document.getElementById('selectPaleta');
    const containerCoresPaleta = document.getElementById('paleta-cores-container');
    const pickerCor = document.getElementById('pickerCorPrimaria');

    function renderizarPaletasUI() {
      if (!selectPaleta || !containerCoresPaleta) return;
      selectPaleta.innerHTML = '';
      paletteManager.paletas.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.nome;
        if (p.id === paletteManager.paletaAtivaId) opt.selected = true;
        selectPaleta.appendChild(opt);
      });

      containerCoresPaleta.innerHTML = '';
      const paletaAtiva = paletteManager.obterPaletaAtiva();
      paletaAtiva.cores.forEach((corHex, idx) => {
        const swatch = document.createElement('div');
        swatch.style.width = '22px';
        swatch.style.height = '22px';
        swatch.style.backgroundColor = corHex;
        swatch.style.borderRadius = '4px';
        swatch.style.cursor = 'pointer';
        swatch.style.border = paletteManager.indiceCorSelecionada === idx ? '2px solid #fff' : '1px solid #444';
        swatch.onclick = () => {
          paletteManager.indiceCorSelecionada = idx;
          colorManager.setCorPrimaria(corHex);
          renderizarPaletasUI();
        };
        containerCoresPaleta.appendChild(swatch);
      });
    }

    if (selectPaleta) selectPaleta.onchange = (e) => { paletteManager.mudarPaleta(e.target.value); renderizarPaletasUI(); };
    ligarBotao('btnNovaPaleta', () => { const nome = prompt('Nome da paleta:', 'Minha Paleta'); if (nome) { paletteManager.criarPaleta(nome); renderizarPaletasUI(); } });
    ligarBotao('btnExcluirPaleta', () => { paletteManager.excluirPaletaAtiva(); renderizarPaletasUI(); });
    ligarBotao('btnAddCorPaleta', () => { paletteManager.adicionarCorAtual(); renderizarPaletasUI(); });
    ligarBotao('btnSubstituirCor', () => { paletteManager.substituirCorSelecionada(); renderizarPaletasUI(); });
    ligarBotao('btnRemoverCor', () => { paletteManager.removerCorSelecionada(); renderizarPaletasUI(); });

    if (pickerCor) {
      pickerCor.oninput = (e) => colorManager.setCorPrimaria(e.target.value);
      colorManager.aoMudarCorPrimaria = (cor) => { pickerCor.value = cor; };
    }
    ligarBotao('btnTrocarCores', () => colorManager.inverterCores());
    renderizarPaletasUI();

    // Outros inputs (Pincel, Borracha, Balde, Formas, etc.)
    document.getElementById('inputTamanho')?.addEventListener('input', (e) => pincelEngine?.setTamanho(e.target.value));
    document.getElementById('inputOpacidade')?.addEventListener('input', (e) => pincelEngine?.setOpacidade(e.target.value));
    document.getElementById('inputEstabilizador')?.addEventListener('input', (e) => pincelEngine?.setEstabilizador(e.target.value));
    document.getElementById('selectTipoPincel')?.addEventListener('change', (e) => pincelEngine?.setTipo(e.target.value));

    document.getElementById('inputTamanhoBorracha')?.addEventListener('input', (e) => pincelEngine?.setEraserSize(e.target.value));
    document.getElementById('inputOpacidadeBorracha')?.addEventListener('input', (e) => pincelEngine?.setEraserOpacity(e.target.value));
    document.getElementById('selectFormaBorracha')?.addEventListener('change', (e) => pincelEngine?.setEraserShape(e.target.value));
    document.getElementById('selectTipoBorracha')?.addEventListener('change', (e) => pincelEngine?.setEraserType(e.target.value));

    document.getElementById('chkFormaBorracha')?.addEventListener('change', (e) => formasTool.setModoBorracha(e.target.checked));
    document.getElementById('selectTipoForma')?.addEventListener('change', (e) => {
      const val = e.target.value;
      formasTool.setTipo(val);
      const cp = document.getElementById('containerPontosPoligono');
      if (cp) cp.style.display = (val === 'poligono') ? 'block' : 'none';
    });
    document.getElementById('inputPontosPoligono')?.addEventListener('input', (e) => formasTool.setPontosPoligono(e.target.value));
    document.getElementById('chkPreenchimentoForma')?.addEventListener('change', (e) => formasTool.setPreencher(e.target.checked));
    document.getElementById('pickerPreenchimento')?.addEventListener('input', (e) => formasTool.setCorPreenchimento(e.target.value));
    document.getElementById('inputLarguraLinha')?.addEventListener('input', (e) => formasTool.setLarguraLinha(e.target.value));
    document.getElementById('inputOpacidadeForma')?.addEventListener('input', (e) => formasTool.setOpacidade(e.target.value));
    ligarBotao('btnConfirmarForma', () => formasTool.fixarFormaNoCanvas());
    ligarBotao('btnCancelarForma', () => formasTool.cancelarForma());

    document.getElementById('chkBaldeBorracha')?.addEventListener('change', (e) => baldeTool.setModoBorracha(e.target.checked));
    document.getElementById('inputBaldeOpacidade')?.addEventListener('input', (e) => baldeTool.setOpacidade(e.target.value));
    document.getElementById('inputBaldeTolerancia')?.addEventListener('input', (e) => baldeTool.setTolerancia(e.target.value));
    document.getElementById('inputBaldeExpandir')?.addEventListener('input', (e) => baldeTool.setExpandir(e.target.value));
    document.getElementById('selectBaldeAmostragem')?.addEventListener('change', (e) => baldeTool.setAmostragem(e.target.value));

    ligarBotao('btnDesfazer', () => historyTool.desfazer());
    ligarBotao('btnRefazer', () => historyTool.refazer());
    ligarBotao('btnZoomIn', () => zoomTool.zoomIn());
    ligarBotao('btnZoomOut', () => zoomTool.zoomOut());
    ligarBotao('btnZoomReset', () => zoomTool.resetZoom());

    ligarBotao('btnNovoProjeto', () => { if (confirm('Criar novo projeto?')) { fileTool.novoProjeto(); } });
    ligarBotao('btnExportar', () => fileTool.exportarProjeto());

    layerManager.atualizarUIlistaCamadas();
    console.log('PopFlipariz carregado com sucesso!');
  } catch (erro) {
    console.error('Erro ao iniciar:', erro);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarPopFlipariz);
} else {
  iniciarPopFlipariz();
}
