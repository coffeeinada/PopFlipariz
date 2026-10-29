/**
 * PopFlipariz - Ponto de Entrada com Histórico e Atalhos
 * Caminho: js/main.js
 */

import { inicializarPincel } from './tools/pincel.js';
import { HistoryManager } from './core/history.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('paintCanvas');
  const ctx = canvas.getContext('2d');

  // Inicializa o gerenciador de Undo/Redo
  const history = new HistoryManager(canvas, ctx);

  // Inicializa o motor de pincel conectado ao histórico
  const pincelEngine = inicializarPincel(canvas, history);

  // Elementos da Interface (UI)
  const btnPincel = document.getElementById('btnPincel');
  const btnBorracha = document.getElementById('btnBorracha');
  const btnLimpar = document.getElementById('btnLimpar');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  
  const colorPicker = document.getElementById('colorPicker');
  const brushSize = document.getElementById('brushSize');
  const sizeVal = document.getElementById('sizeVal');
  const brushOpacity = document.getElementById('brushOpacity');
  const opacityVal = document.getElementById('opacityVal');
  const stabilizerRange = document.getElementById('stabilizerRange');
  const stabVal = document.getElementById('stabVal');

  // Alternar ferramentas
  btnPincel.addEventListener('click', () => {
    pincelEngine.setModo('pincel');
    btnPincel.classList.add('active');
    btnBorracha.classList.remove('active');
  });

  btnBorracha.addEventListener('click', () => {
    pincelEngine.setModo('borracha');
    btnBorracha.classList.add('active');
    btnPincel.classList.remove('active');
  });

  btnLimpar.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar o quadro atual?')) {
      pincelEngine.limparTela();
    }
  });

  // Botões de Desafazer / Refazer
  btnUndo.addEventListener('click', () => history.undo());
  btnRedo.addEventListener('click', () => history.redo());

  // Controles deslizantes (Sliders)
  brushSize.addEventListener('input', (e) => { sizeVal.innerText = e.target.value; });
  brushOpacity.addEventListener('input', (e) => { opacityVal.innerText = e.target.value + '%'; });
  
  stabilizerRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    stabVal.innerText = val === 0 ? 'Off' : val.toFixed(1);
    // Converte o slider (0 a 1) para o fator do estabilizador
    const fator = val === 0 ? 1.0 : (1.1 - val); 
    pincelEngine.setEstabilizacao(fator);
  });

  // ==========================================
  // ATALHOS DE TECLADO PROFISSIONAIS
  // ==========================================
  window.addEventListener('keydown', (e) => {
    // Evita conflito se o usuário estiver digitando em inputs de texto (se houver)
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        history.redo(); // Ctrl + Shift + Z = Refazer
      } else {
        history.undo(); // Ctrl + Z = Desafazer
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      history.redo(); // Ctrl + Y = Refazer
    }
  });

  console.log('✨ PopFlipariz Engine com Histórico, Estabilizador e Atalhos carregada!');
});
