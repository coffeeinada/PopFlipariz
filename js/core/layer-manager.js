/**
 * PopFlipariz - Gestor de Camadas (Inicia com 1 e mínimo de 1 camada)
 * Caminho: js/core/layer-manager.js
 */

export class LayerManager {
  constructor(containerElement, largura, altura, historyManager) {
    this.container = containerElement;
    this.width = largura;
    this.height = altura;
    this.historyManager = historyManager;
    
    this.camadas = [];
    this.indiceAtivo = 0;

    // Garante que inicia sempre com pelo menos 1 camada criada de imediato
    this.adicionarCamada('Camada 1');
  }

  criarCanvasVazio() {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    c.style.position = 'absolute';
    c.style.top = '0';
    c.style.left = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    return c;
  }

  adicionarCamada(nome = `Camada ${this.camadas.length + 1}`) {
    const canvas = this.criarCanvasVazio();
    this.container.appendChild(canvas);

    const novaCamada = {
      id: 'layer_' + Date.now() + Math.random(),
      nome: nome,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visivel: true,
      opacidade: 1.0,
      blendMode: 'normal'
    };

    this.camadas.push(novaCamada);
    this.indiceAtivo = this.camadas.length - 1;
    this.atualizarZIndex();
    this.atualizarUIlistaCamadas();
    
    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }

    return novaCamada;
  }

  removerCamada(indice = this.indiceAtivo) {
    // Regra estricta: O mínimo de camadas será sempre 1
    if (this.camadas.length <= 1) {
      alert('O projeto precisa de manter pelo menos uma camada!');
      return;
    }

    this.container.removeChild(this.camadas[indice].canvas);
    this.camadas.splice(indice, 1);

    if (this.indiceAtivo >= this.camadas.length) {
      this.indiceAtivo = this.camadas.length - 1;
    }
    
    this.atualizarZIndex();
    this.atualizarUIlistaCamadas();

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  duplicarCamada(indice = this.indiceAtivo) {
    const alvo = this.camadas[indice];
    if (!alvo) return;

    const novoCanvas = this.criarCanvasVazio();
    const novoCtx = novoCanvas.getContext('2d');
    novoCtx.drawImage(alvo.canvas, 0, 0);

    this.container.appendChild(novoCanvas);

    const duplicada = {
      id: 'layer_' + Date.now(),
      nome: alvo.nome + ' (Cópia)',
      canvas: novoCanvas,
      ctx: novoCtx,
      visivel: alvo.visivel,
      opacidade: alvo.opacidade,
      blendMode: alvo.blendMode
    };

    this.camadas.splice(indice + 1, 0, duplicada);
    this.indiceAtivo = indice + 1;
    this.atualizarZIndex();
    this.atualizarUIlistaCamadas();
  }

  limparCamada(indice = this.indiceAtivo) {
    const camada = this.camadas[indice];
    if (!camada) return;
    camada.ctx.clearRect(0, 0, this.width, this.height);
    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  atualizarZIndex() {
    this.camadas.forEach((camada, idx) => {
      camada.canvas.style.zIndex = idx + 1;
      camada.canvas.style.opacity = camada.visivel ? camada.opacidade : 0;
      camada.canvas.style.display = camada.visivel ? 'block' : 'none';
      
      // Apenas a camada ativa e visível recebe os cliques do rato para desenho
      if (idx === this.indiceAtivo && camada.visivel) {
        camada.canvas.style.pointerEvents = 'auto';
      } else {
        camada.canvas.style.pointerEvents = 'none';
      }
    });
  }

  atualizarUIlistaCamadas() {
    const lista = document.getElementById('listaCamadas');
    if (!lista) return;
    lista.innerHTML = '';

    this.camadas.forEach((camada, idx) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '6px 8px';
      li.style.margin = '4px 0';
      li.style.background = idx === this.indiceAtivo ? '#383848' : '#252530';
      li.style.borderRadius = '4px';
      li.style.cursor = 'pointer';

      const span = document.createElement('span');
      span.innerText = camada.nome;
      span.onclick = () => {
        this.indiceAtivo = idx;
        this.atualizarZIndex();
        this.atualizarUIlistaCamadas();
      };

      const btnOlho = document.createElement('button');
      btnOlho.innerText = camada.visivel ? '👁️' : '🚫';
      btnOlho.style.background = 'transparent';
      btnOlho.style.border = 'none';
      btnOlho.style.cursor = 'pointer';
      btnOlho.onclick = (e) => {
        e.stopPropagation();
        camada.visivel = !camada.visivel;
        this.atualizarZIndex();
        this.atualizarUIlistaCamadas();
      };

      li.appendChild(span);
      li.appendChild(btnOlho);
      lista.appendChild(li);
    });
  }

  obterCanvasAtivo() {
    if (!this.camadas[this.indiceAtivo]) {
      this.adicionarCamada();
    }
    return this.camadas[this.indiceAtivo].canvas;
  }

  obterCtxAtivo() {
    return this.camadas[this.indiceAtivo].ctx;
  }
}
