/**
 * PopFlipariz - Pincel com Estabilizador, Opacidade e Suavização
 * Caminho: js/tools/pincel.js
 */

export function inicializarPincel(canvas, historyManager) {
  const ctx = canvas.getContext('2d');
  let desenhando = false;
  let modoAtual = 'pincel'; // 'pincel' ou 'borracha'
  
  // Variáveis para o Estabilizador de Traço (Lerp / Suavização)
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let nivelEstabilizacao = 0.3; // 0.1 (muito suave/lento) a 1.0 (sem suavização)

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function obterCoordenadas(e) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * escalaX,
      y: (clientY - rect.top) * escalaY
    };
  }

  function iniciarTraco(e) {
    desenhando = true;
    const pos = obterCoordenadas(e);
    mouseX = cursorX = pos.x;
    mouseY = cursorY = pos.y;
  }

  function desenhar(e) {
    if (!desenhando) return;
    e.preventDefault();

    const pos = obterCoordenadas(e);
    mouseX = pos.x;
    mouseY = pos.y;

    // Aplica o algoritmo de estabilização (Interpolação Linear suave)
    cursorX += (mouseX - cursorX) * nivelEstabilizacao;
    cursorY += (mouseY - cursorY) * nivelEstabilizacao;

    const tamanho = document.getElementById('brushSize').value;
    const opacidade = document.getElementById('brushOpacity').value / 100;
    const cor = document.getElementById('colorPicker').value;

    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    // Pequeno ajuste para o traço fluir com o cursor suavizado
    ctx.lineTo(cursorX + 0.1, cursorY + 0.1);

    if (modoAtual === 'borracha') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0; // Borracha apaga 100% por padrão
      ctx.lineWidth = tamanho * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacidade; // Aplica a opacidade ajustável
      ctx.strokeStyle = cor;
      ctx.lineWidth = tamanho;
    }

    ctx.stroke();
  }

  function pararTraco() {
    if (!desenhando) return;
    desenhando = false;
    ctx.beginPath();
    ctx.globalAlpha = 1.0; // Reseta a opacidade padrão
    
    // Salva o estado no histórico ao soltar o traço (Undo/Redo)
    if (historyManager) {
      historyManager.salvarEstado();
    }
  }

  // Eventos de Mouse e Toque
  canvas.addEventListener('mousedown', iniciarTraco);
  canvas.addEventListener('mousemove', desenhar);
  window.addEventListener('mouseup', pararTraco);

  canvas.addEventListener('touchstart', iniciarTraco, { passive: false });
  canvas.addEventListener('touchmove', desenhar, { passive: false });
  window.addEventListener('touchend', pararTraco);

  return {
    setModo(modo) { modoAtual = modo; },
    setEstabilizacao(valor) { nivelEstabilizacao = valor; },
    limparTela() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (historyManager) historyManager.salvarEstado();
    }
  };
}
