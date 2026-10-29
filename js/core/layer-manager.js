/**
 * PopFlipariz - Gerenciador de Camadas
 * Caminho: js/core/layer-manager.js
 */

export class LayerManager {
  constructor(containerElement, largura, altura) {
    this.container = containerElement;
    this.width = largura;
    this.height = altura;
    this.camadas = [];
    this.indiceAtivo = 0;

    // Cria a primeira camada padrão ao iniciar
    this.adicionarCamada('Camada 1');
  }

  adicionarCamada(nome = `Camada ${this.camadas.length + 1}`) {
    // Cria o elemento canvas isolado para a camada
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Deixa o mouse passar direto para o canvas principal de interação

    // Insere no DOM do container (as camadas mais acima ficam por último no HTML)
    this.container.appendChild(canvas);

    const novaCamada = {
      nome: nome,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visivel: true,
      opacidade: 1.0
    };

    this.camadas.push(novaCamada);
    this.indiceAtivo = this.camadas.length - 1;
    this.atualizarZIndex();

    return novaCamada;
  }

  removerCamada(indice) {
    if (this.camadas.length <= 1) {
      alert('O projeto precisa ter pelo menos uma camada!');
      return;
    }

    // Remove o elemento canvas da tela
    this.container.removeChild(this.camadas[indice].canvas);
    this.camadas.splice(indice, 1);

    if (this.indiceAtivo >= this.camadas.length) {
      this.indiceAtivo = this.camadas.length - 1;
    }
    this.atualizarZIndex();
  }

  selecionarCamada(indice) {
    if (indice >= 0 && indice < this.camadas.length) {
      this.indiceAtivo = indice;
    }
  }

  obterCanvasAtivo() {
    return this.camadas[this.indiceAtivo].canvas;
  }

  obterCtxAtivo() {
    return this.camadas[this.indiceAtivo].ctx;
  }

  // Organiza a ordem visual (stacking order) das camadas na tela
  atualizarZIndex() {
    this.camadas.forEach((camada, idx) => {
      camada.canvas.style.zIndex = idx + 1;
      camada.canvas.style.opacity = camada.visivel ? camada.opacidade : 0;
    });
  }

  alternarVisibilidade(indice) {
    this.camadas[indice].visivel = !this.camadas[indice].visivel;
    this.atualizarZIndex();
  }

  alterarOpacidade(indice, valor) {
    this.camadas[indice].opacidade = valor;
    this.atualizarZIndex();
  }
}
