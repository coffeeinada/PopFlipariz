/**
 * PopFlipariz - Motor de Pincel e Borracha
 * Caminho: js/tools/pincel.js
 */

export function inicializarPincel(canvas) {
  const ctx = canvas.getContext('2d');
  let desenhando = false;
  let modoAtual = 'pincel'; // 'pincel' ou 'borracha'
  let ultimoX = 0;
  let ultimoY = 0;

  // Suavização do traço (Anti-aliasing)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function obterCoordenadas(e) {
    const rect = canvas.getBoundingClientRect();
    // Ajusta a escala caso o canvas sofra redimensionamento visual pelo CSS
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
    ultimoX = pos.x;
    ultimoY = pos.y;
  }

  function desenhar(e) {
    if (!desenhando) return;
    e.preventDefault(); // Evita o scroll indesejado da página no celular

    const pos = obterCoordenadas(e);
    const tamanho = document.getElementById('brushSize').value;
    const cor = document.getElementById('colorPicker').value;

    ctx.beginPath();
    ctx.moveTo(ultimoX, ultimoY);
    ctx.lineTo(pos.x, pos.y);

    if (modoAtual === 'borracha') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = tamanho * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = cor;
      ctx.lineWidth = tamanho;
    }

    ctx.stroke();
    ultimoX = pos.x;
    ultimoY = pos.y;
  }

  function pararTraco() {
    desenhando = false;
    ctx.beginPath();
  }

  // Eventos de Mouse
  canvas.addEventListener('mousedown', iniciarTraco);
  canvas.addEventListener('mousemove', desenhar);
  window.addEventListener('mouseup', pararTraco);

  // Eventos de Toque (Mobile/Tablet)
  canvas.addEventListener('touchstart', iniciarTraco, { passive: false });
  canvas.addEventListener('touchmove', desenhar, { passive: false });
  window.addEventListener('touchend', pararTraco);

  // Retorna métodos de controle para a interface principal
  return {
    setModo(modo) {
      modoAtual = modo;
    },
    limparTela() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}
