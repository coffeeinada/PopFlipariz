/**
 * PopFlipariz - Gestor de Paletas de Cores
 * Caminho: js/tools/paletas.js
 */

export class PaletteManager {
  constructor(colorManager) {
    this.colorManager = colorManager;
    
    // Recupera do localStorage ou cria paletas padrão iniciais
    this.paletas = JSON.parse(localStorage.getItem('popflipariz_paletas')) || [
      {
        id: 'default_pop',
        nome: 'Pop Classics 🎀',
        cores: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffffff', '#000000', '#9370db', '#00ffff', '#ffff00']
      },
      {
        id: 'pastel_dreams',
        nome: 'Pastel Dreams ☁️',
        cores: ['#ffd1dc', '#ffecb6', '#d0f4de', '#a9def9', '#e4c1f9', '#ff99c8']
      }
    ];

    this.paletaAtivaId = this.paletas[0].id;
    this.indiceCorSelecionada = null; // Índice da cor selecionada dentro da paleta ativa
  }

  salvarStorage() {
    localStorage.setItem('popflipariz_paletas', JSON.stringify(this.paletas));
  }

  obterPaletaAtiva() {
    return this.paletas.find(p => p.id === this.paletaAtivaId) || this.paletas[0];
  }

  mudarPaleta(id) {
    this.paletaAtivaId = id;
    this.indiceCorSelecionada = null;
  }

  criarPaleta(nome) {
    const nomeLimpo = nome ? nome.trim() : `Nova Paleta ${this.paletas.length + 1}`;
    const nova = {
      id: 'paleta_' + Date.now(),
      nome: nomeLimpo,
      cores: ['#ff69b4', '#ffffff', '#000000']
    };
    this.paletas.push(nova);
    this.paletaAtivaId = nova.id;
    this.indiceCorSelecionada = null;
    this.salvarStorage();
  }

  excluirPaletaAtiva() {
    if (this.paletas.length <= 1) {
      alert('O projeto precisa de manter pelo menos uma paleta!');
      return;
    }
    this.paletas = this.paletas.filter(p => p.id !== this.paletaAtivaId);
    this.paletaAtivaId = this.paletas[0].id;
    this.indiceCorSelecionada = null;
    this.salvarStorage();
  }

  // Cria / Adiciona a cor atual selecionada no seletor para a paleta ativa
  adicionarCorAtual() {
    const paleta = this.obterPaletaAtiva();
    if (!paleta || !this.colorManager) return;
    const corAtual = this.colorManager.corPrimaria;
    
    if (!paleta.cores.includes(corAtual)) {
      paleta.cores.push(corAtual);
      this.indiceCorSelecionada = paleta.cores.length - 1;
      this.salvarStorage();
    }
  }

  // Substitui a cor selecionada na paleta pela cor atual do seletor
  substituirCorSelecionada() {
    const paleta = this.obterPaletaAtiva();
    if (!paleta || this.indiceCorSelecionada === null || !paleta.cores[this.indiceCorSelecionada]) {
      alert('Selecione primeiro uma cor na paleta para substituir!');
      return;
    }
    const corAtual = this.colorManager.corPrimaria;
    paleta.cores[this.indiceCorSelecionada] = corAtual;
    this.salvarStorage();
  }

  // Remove a cor selecionada da paleta
  removerCorSelecionada() {
    const paleta = this.obterPaletaAtiva();
    if (!paleta || this.indiceCorSelecionada === null) {
      alert('Selecione primeiro uma cor na paleta para apagar!');
      return;
    }
    paleta.cores.splice(this.indiceCorSelecionada, 1);
    this.indiceCorSelecionada = null;
    this.salvarStorage();
  }

  // Exportar todas as paletas para JSON
  exportarPaletas() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.paletas, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "popflipariz_paletas.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Importar paletas de um ficheiro JSON
  importarPaletas(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.paletas = parsed;
        this.paletaAtivaId = this.paletas[0].id;
        this.indiceCorSelecionada = null;
        this.salvarStorage();
        return true;
      }
    } catch (e) {
      console.error('Erro ao importar paletas:', e);
      alert('Ficheiro JSON de paletas inválido.');
    }
    return false;
  }
}
