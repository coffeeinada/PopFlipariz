/**
 * PopFlipariz - Gestor de Cores e Conta-Gotas
 * Caminho: js/tools/cores.js
 */

export class ColorManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.corPrimaria = '#ff69b4';
    this.corSecundaria = '#ffffff';
    this.modoContaGotasAtivo = false;
    
    this.aoMudarCorPrimaria = null; // Callback para atualizar a UI
  }

  setCorPrimaria(novaCor) {
    this.corPrimaria = novaCor;
    if (this.aoMudarCorPrimaria) this.aoMudarCorPrimaria(this.corPrimaria);
  }

  inverterCores() {
    const temp = this.corPrimaria;
    this.corPrimaria = this.corSecundaria;
    this.corSecundaria = temp;
    if (this.aoMudarCorPrimaria) this.aoMudarCorPrimaria(this.corPrimaria);
  }

  ativarContaGotas(ativar = true) {
    this.modoContaGotasAtivo = ativar;
    this.canvas.style.cursor = ativar ? 'crosshair' : 'default';
  }

  capturarCor(e) {
    if (!this.modoContaGotasAtivo) return false;

    const rect = this.canvas.getBoundingClientRect();
    const escalaX = this.canvas.width / rect.width;
    const escalaY = this.canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.floor((clientX - rect.left) * escalaX);
    const y = Math.floor((clientY - rect.top) * escalaY);

    if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
      const pixel = this.ctx.getImageData(x, y, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]]
        .map(c => c.toString(16).padStart(2, '0'))
        .join('');

      this.setCorPrimaria(hex);
      this.ativarContaGotas(false);
      return true;
    }
    return false;
  }
}
