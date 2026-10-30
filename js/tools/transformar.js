/**
 * PopFlipariz - Ferramenta de Transformação (Mover, Perspetiva 9 Pontos e Corte)
 * Caminho: js/tools/transformar.js
 */

export class TransformTool {
  constructor(layerManager, historyManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;

    this.modo = 'padrao'; // 'padrao', 'perspectiva', 'corte'
    this.ativo = false;

    this.origemCanvas = null;
    this.ctxOrigem = null;
    this.snapshotCamada = null;

    // 9 Pontos de Controlo da Perspetiva
    this.pontosGuias = [];
    this.pontoAtivoIdx = -1;

    this.translateX = 0;
    this.translateY = 0;

    this.overlayCanvas = null;
    this.overlayCtx = null;
  }

  inicializarOverlay(container) {
    if (this.overlayCanvas) return;
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 1280;
    this.overlayCanvas.height = 720;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '999';
    container.appendChild(this.overlayCanvas);
    this.overlayCtx = this.overlayCanvas.getContext('2d');
  }

  setModo(m) { this.modo = m || 'padrao'; }

  iniciarTransformacao() {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;
    this.origemCanvas = canvas;
    this.ctxOrigem = canvas.getContext('2d');

    // Guarda snapshot limpo da camada antes de alterar
    this.snapshotCamada = this.ctxOrigem.getImageData(0, 0, canvas.width, canvas.height);
    this.ativo = true;

    // Inicializa a grelha de 9 pontos
    const w = canvas.width;
    const h = canvas.height;
    this.pontosGuias = [
      { x: 0, y: 0 },     { x: w / 2, y: 0 },     { x: w, y: 0 },
      { x: 0, y: h / 2 }, { x: w / 2, y: h / 2 }, { x: w, y: h / 2 },
      { x: 0, y: h },     { x: w / 2, y: h },     { x: w, y: h }
    ];

    this.renderizarGizmo();
  }

  iniciarDrag(e) {
    if (!this.ativo) return;
    const rect = this.origemCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.origemCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.origemCanvas.height / rect.height);

    // Deteta se clicou num dos 9 pontos de perspetiva
    this.pontoAtivoIdx = -1;
    this.pontosGuias.forEach((p, idx) => {
      if (Math.hypot(x - p.x, y - p.y) < 15) {
        this.pontoAtivoIdx = idx;
      }
    });
  }

  arrastar(e) {
    if (!this.ativo || this.pontoAtivoIdx === -1) return;
    const rect = this.origemCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.origemCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.origemCanvas.height / rect.height);

    this.pontosGuias[this.pontoAtivoIdx].x = x;
    this.pontosGuias[this.pontoAtivoIdx].y = y;
    this.renderizarGizmo();
  }

  soltarDrag() {
    this.pontoAtivoIdx = -1;
  }

  renderizarGizmo() {
    if (!this.overlayCtx) return;
    this.overlayCtx.clearRect(0, 0, 1280, 720);
    if (!this.ativo) return;

    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = '#ff69b4';
    this.overlayCtx.lineWidth = 1.5;
    this.overlayCtx.setLineDash([4, 4]);

    // Linhas conectoras da grelha de 9 pontos
    const pts = this.pontosGuias;
    this.overlayCtx.beginPath();
    // Linhas horizontais
    this.overlayCtx.moveTo(pts[0].x, pts[0].y); this.overlayCtx.lineTo(pts[2].x, pts[2].y);
    this.overlayCtx.moveTo(pts[3].x, pts[3].y); this.overlayCtx.lineTo(pts[5].x, pts[5].y);
    this.overlayCtx.moveTo(pts[6].x, pts[6].y); this.overlayCtx.lineTo(pts[8].x, pts[8].y);
    // Linhas verticais
    this.overlayCtx.moveTo(pts[0].x, pts[0].y); this.overlayCtx.lineTo(pts[6].x, pts[6].y);
    this.overlayCtx.moveTo(pts[1].x, pts[1].y); this.overlayCtx.lineTo(pts[7].x, pts[7].y);
    this.overlayCtx.moveTo(pts[2].x, pts[2].y); this.overlayCtx.lineTo(pts[8].x, pts[8].y);
    this.overlayCtx.stroke();

    // Desenhar os 9 pontos azuis/rosa
    pts.forEach(p => {
      this.overlayCtx.fillStyle = '#00ffff';
      this.overlayCtx.beginPath();
      this.overlayCtx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.overlayCtx.fill();
      this.overlayCtx.stroke();
    });

    this.overlayCtx.restore();
  }

  aplicarTransformacao() {
    if (!this.ativo) return;
    this.ativo = false;
    if (this.overlayCtx) this.overlayCtx.clearRect(0, 0, 1280, 720);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  cancelarTransformacao() {
    if (!this.ativo) return;
    if (this.snapshotCamada && this.ctxOrigem) {
      this.ctxOrigem.putImageData(this.snapshotCamada, 0, 0);
    }
    this.ativo = false;
    if (this.overlayCtx) this.overlayCtx.clearRect(0, 0, 1280, 720);
  }
}
