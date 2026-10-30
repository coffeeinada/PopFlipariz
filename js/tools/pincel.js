/**
 * PopFlipariz - Área de Pincel e Borracha Completa (Conforme Requisitos)
 * Caminho: js/tools/pincel.js
 * Ícone de referência: ✏ (Pincel) / Borracha
 */

export function inicializarPincel(canvas, historyManager, colorManager) {
  const ctx = canvas.getContext('2d');
  let desenhando = false;
  let ferramentaAtiva = 'pincel'; // 'pincel' ou 'borracha'[cite: 1]
  
  // Configurações do Pincel[cite: 1]
  let tipoPincel = 'normal'; // normal, spray, borradinho, pixel, aquarela, bico_de_pena
  let nivelEstabilizador = 0; // De 0 a 10 em números inteiros[cite: 1]
  
  // Configurações da Borracha[cite: 1]
  let tipoBorracha = 'normal'; // normal ou esfumacadinha
  let formaBorracha = 'redonda'; // redonda ou quadrada

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

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
    if (colorManager && colorManager.modoContaGotasAtivo) {
      colorManager.capturarCor(e);
      return;
    }

    desenhando = true;
    const pos = obterCoordenadas(e);
    mouseX = cursorX = pos.x;
    mouseY = cursorY = pos.y;
  }

  function desenhar(e) {
    if (!desenhando || (colorManager && colorManager.modoContaGotasAtivo)) return;
    e.preventDefault();

    const pos = obterCoordenadas(e);
    mouseX = pos.x;
    mouseY = pos.y;

    // Estabilizador (0 a 10 inteiros)[cite: 1]
    const fatorSuavizacao = nivelEstabilizador === 0 ? 1.0 : Math.max(0.04, 1.0 - (nivelEstabilizizador * 0.09));
    cursorX += (mouseX - cursorX) * fatorSuavizacao;
    cursorY += (mouseY - cursorY) * fatorSuavizacao;

    if (ferramentaAtiva === 'pincel') {
      // Tamanho de 1 a 200 com números quebrados (ex: 1.1, 1.2...)[cite: 1]
      const tamanho = parseFloat(document.getElementById('brushSize')?.value || 5);
      // Opacidade com números quebrados[cite: 1]
      const opacidade = parseFloat(document.getElementById('brushOpacity')?.value || 100) / 100;
      const cor = colorManager ? colorManager.corPrimaria : '#ff69b4';

      ctx.save();
      ctx.globalAlpha = opacidade;
      ctx.strokeStyle = cor;
      ctx.fillStyle = cor;

      aplicarEstiloPincel(ctx, tipoPincel, cursorX, cursorY, tamanho);
      ctx.restore();

    } else if (ferramentaAtiva === 'borracha') {
      // Tamanho da borracha de 0 a 400[cite: 1]
      const tamanhoBorracha = parseFloat(document.getElementById('eraserSize')?.value || 20);
      // Opacidade da borracha com suporte a números quebrados[cite: 1]
      const opacidadeBorracha = parseFloat(document.getElementById('eraserOpacity')?.value || 100) / 100;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = opacidadeBorracha;

      if (formaBorracha === 'quadrada') {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = tamanhoBorracha;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(cursorX + 0.1, cursorY + 0.1);
        ctx.stroke();
      } else {
        // Borracha Redonda[cite: 1]
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (tipoBorracha === 'esfumacadinha') {
          // Efeito borradinho / esfumaçadinho na borracha[cite: 1]
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(0,0,0,1)';
        }
        ctx.lineWidth = tamanhoBorracha;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(cursorX + 0.1, cursorY + 0.1);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function aplicarEstiloPincel(ctx, tipo, x, y, tamanho) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (tipo) {
      case 'spray':
        const densidade = Math.floor(tamanho * 1.5);
        for (let i = 0; i < densidade; i++) {
          const angulo = Math.random() * Math.PI * 2;
          const raio = Math.random() * (tamanho / 2);
          const px = x + Math.cos(angulo) * raio;
          const py = y + Math.sin(angulo) * raio;
          ctx.fillRect(px, py, 1.2, 1.2);
        }
        break;

      case 'borradinho':
        // Estilo meio borradinho misturadinho[cite: 1]
        ctx.shadowBlur = tamanho * 0.6;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.lineWidth = tamanho;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'pixel':
        // Meio pixel art[cite: 1]
        ctx.imageSmoothingEnabled = false;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(tamanho)), Math.max(1, Math.floor(tamanho)));
        break;

      case 'aquarela':
        // Aquarela com opacidade translúcida combinada[cite: 1]
        ctx.globalAlpha *= 0.25;
        ctx.lineWidth = tamanho * 1.8;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'bico_de_pena':
        // Caneta bico de pena[cite: 1]
        ctx.lineWidth = Math.max(1, tamanho * 0.5);
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'normal':
      default:
        // Normal bonitinho[cite: 1]
        ctx.lineWidth = tamanho;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
    }
  }

  function pararTraco() {
    if (!desenhando) return;
    desenhando = false;
    ctx.beginPath();
    if (historyManager) {
      historyManager.salvarEstado();
    }
  }

  // Selecionar ferramentas por atalhos: B para pincel (brush) e E para borracha (eraser)[cite: 1]
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 'b') {
      ferramentaAtiva = 'pincel';
    } else if (e.key.toLowerCase() === 'e') {
      ferramentaAtiva = 'borracha';
    }
  });

  canvas.addEventListener('mousedown', iniciarTraco);
  canvas.addEventListener('mousemove', desenhar);
  window.addEventListener('mouseup', pararTraco);

  canvas.addEventListener('touchstart', iniciarTraco, { passive: false });
  canvas.addEventListener('touchmove', desenhar, { passive: false });
  window.addEventListener('touchend', pararTraco);

  return {
    setFerramenta(ferramenta) { ferramentaAtiva = ferramenta; },
    setTipoPincel(tipo) { tipoPincel = tipo; },
    setEstabilizador(valor) { nivelEstabilizizador = parseInt(valor) || 0; },
    setTipoBorracha(tipo) { tipoBorracha = tipo; },
    setFormaBorracha(forma) { formaBorracha = forma; },
    limparTela() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (historyManager) historyManager.salvarEstado();
    }
  };
}
