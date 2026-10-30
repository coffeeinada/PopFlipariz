/**
 * PopFlipariz - Área de Ficheiro (Novo, Importar, Nomear e Descarregar)
 * Caminho: js/tools/arquivo.js
 * Ícone de referência: 📄 (Ficheiro)
 */

export class FileTool {
  constructor(layerManager, historyManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    
    this.nomeObra = 'Minha Animacao PopFlip';
    
    // Tamanhos personalizados guardados no localStorage para não desorganizar a interface
    this.tamanhosPersonalizados = JSON.parse(localStorage.getItem('popflipariz_tamanhos')) || [
      { nome: 'Padrão HD', largura: 1280, altura: 720 },
      { nome: 'Quadrado Instagram', largura: 1080, altura: 1080 },
      { nome: 'Pixel Art Compacto', largura: 320, altura: 240 }
    ];
  }

  // Guardar novos tamanhos personalizados no armazenamento local
  guardarTamanhoPersonalizado(nome, largura, altura) {
    const novoTamanho = {
      nome: nome || 'Tamanho Personalizado',
      largura: parseInt(largura) || 800,
      altura: parseInt(altura) || 600
    };
    this.tamanhosPersonalizados.push(novoTamanho);
    localStorage.setItem('popflipariz_tamanhos', JSON.stringify(this.tamanhosPersonalizados));
  }

  // Definir o nome da obra
  setNomeObra(novoNome) {
    if (novoNome && novoNome.trim() !== '') {
      this.nomeObra = novoNome.trim();
    }
  }

  // Criar Novo Projeto
  criarNovoProjeto(largura, altura, corFundo = 'branco', corPersonalizadaHex = '#ffffff') {
    // Limpa as camadas existentes e cria a primeira com a cor de fundo escolhida
    while (this.layerManager.camadas.length > 0) {
      this.layerManager.removerCamada(0);
    }

    const novaCamada = this.layerManager.adicionarCamada('Fundo');
    const ctx = novaCamada.ctx;

    ctx.save();
    if (corFundo === 'branco') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, largura, altura);
    } else if (corFundo === 'preto') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, largura, altura);
    } else if (corFundo === 'personalizado') {
      ctx.fillStyle = corPersonalizadaHex;
      ctx.fillRect(0, 0, largura, altura);
    }
    // Se for 'transparente', não preenche nada (deixa a camada limpa)
    ctx.restore();

    if (this.historyManager) {
      this.historyManager.salvarEstado();
    }
  }

  // Importar imagem ou ficheiro editável do dispositivo
  importarDoDispositivo(eventoInputFile, callbackSucesso) {
    const ficheiro = eventoInputFile.target.files[0];
    if (!ficheiro) return;

    const leitor = new FileReader();
    leitor.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const novaCamada = this.layerManager.adicionarCamada('Importado: ' + ficheiro.name);
        novaCamada.ctx.drawImage(img, 0, 0);
        if (this.historyManager) this.historyManager.salvarEstado();
        if (callbackSucesso) callbackSucesso();
      };
      img.src = e.target.result;
    };
    leitor.readAsDataURL(ficheiro);
  }

  // Baixar como PNG (Exige nome da obra antes de descarregar)
  baixarComoPNG() {
    if (!this.nomeObra || this.nomeObra.trim() === '') {
      alert('Por favor, dê um nome à sua obra antes de descarregar!');
      return;
    }

    // Cria um canvas temporário para fundir todas as camadas visíveis
    const canvasTemp = document.createElement('canvas');
    canvasTemp.width = this.layerManager.width;
    canvasTemp.height = this.layerManager.height;
    const ctxTemp = canvasTemp.getContext('2d');

    this.layerManager.camadas.forEach(camada => {
      if (camada.visivel) {
        ctxTemp.save();
        ctxTemp.globalAlpha = camada.opacidade;
        ctxTemp.globalCompositeOperation = camada.blendMode;
        ctxTemp.drawImage(camada.canvas, 0, 0);
        ctxTemp.restore();
      }
    });

    const link = document.createElement('a');
    link.download = `${this.nomeObra}.png`;
    link.href = canvasTemp.toDataURL('image/png');
    link.click();
  }

  // Baixar como Ficheiro Editável com Camadas (.popflip)
  baixarComoEditavel() {
    if (!this.nomeObra || this.nomeObra.trim() === '') {
      alert('Por favor, dê um nome à sua obra antes de exportar o ficheiro editável!');
      return;
    }

    // Serializa os dados das camadas para formato JSON descarregável
    const dadosProjeto = {
      versao: '1.0',
      nomeObra: this.nomeObra,
      largura: this.layerManager.width,
      altura: this.layerManager.height,
      camadas: this.layerManager.camadas.map(c => ({
        nome: c.nome,
        opacidade: c.opacidade,
        visivel: c.visivel,
        blendMode: c.blendMode,
        dadosImagem: c.canvas.toDataURL('image/png')
      }))
    };

    const blob = new Blob([JSON.stringify(dadosProjeto)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${this.nomeObra}.popflip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
}
