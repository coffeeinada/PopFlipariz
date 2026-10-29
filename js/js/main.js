/**
 * PopFlipariz - Ponto de Entrada Principal (Base)
 * Caminho: js/main.js
 */

import { inicializarPincel } from './tools/pincel.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('paintCanvas');
  
  // Inicializa o motor de desenho no canvas principal
  const pincelEngine = inicializarPincel(canvas);

  // Elementos da Interface (UI)
  const btnPincel = document.getElementById('btnPincel');
  const btnBorracha = document.getElementById('btnBorracha');
  const btnLimpar = document.getElementById('btnLimpar');
  const brushSize = document.getElementById('brushSize');
  const sizeVal = document.getElementById('sizeVal');

  // Alternar para o Pincel
  btnPincel.addEventListener('click', () => {
    pincelEngine.setModo('pincel');
    btnPincel.classList.add('active');
    btnBorracha.classList.remove('active');
  });

  // Alternar para a Borracha
  btnBorracha.addEventListener('click', () => {
    pincelEngine.setModo('borracha');
    btnBorracha.classList.add('active');
    btnPincel.classList.remove('active');
  });

  // Limpar Tela
  btnLimpar.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar o quadro atual?')) {
      pincelEngine.limparTela();
    }
  });

  // Atualizar contador visual do tamanho do pincel
  brushSize.addEventListener('input', (e) => {
    sizeVal.innerText = e.target.value;
  });

  console.log('✨ PopFlipariz Engine base inicializada com sucesso!');
});
