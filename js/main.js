// Ligações dos Controlos da Ferramenta de Formas
    const chkFormaBorracha = document.getElementById('chkFormaBorracha');
    if (chkFormaBorracha) {
      chkFormaBorracha.onchange = (e) => { formasTool.setModoBorracha(e.target.checked); };
    }

    const selectTipoForma = document.getElementById('selectTipoForma');
    const containerPontosPoligono = document.getElementById('containerPontosPoligono');
    if (selectTipoForma) {
      selectTipoForma.onchange = (e) => {
        const val = e.target.value;
        formasTool.setTipo(val);
        if (containerPontosPoligono) {
          containerPontosPoligono.style.display = (val === 'poligono') ? 'block' : 'none';
        }
      };
    }

    const inputPontosPoligono = document.getElementById('inputPontosPoligono');
    if (inputPontosPoligono) {
      inputPontosPoligono.oninput = (e) => { formasTool.setPontosPoligono(e.target.value); };
    }

    const chkPreenchimentoForma = document.getElementById('chkPreenchimentoForma');
    if (chkPreenchimentoForma) {
      chkPreenchimentoForma.onchange = (e) => { formasTool.setPreencher(e.target.checked); };
    }

    const pickerPreenchimento = document.getElementById('pickerPreenchimento');
    if (pickerPreenchimento) {
      pickerPreenchimento.oninput = (e) => { formasTool.setCorPreenchimento(e.target.value); };
    }

    const inputLarguraLinha = document.getElementById('inputLarguraLinha');
    if (inputLarguraLinha) {
      inputLarguraLinha.oninput = (e) => { formasTool.setLarguraLinha(e.target.value); };
    }

    const inputOpacidadeForma = document.getElementById('inputOpacidadeForma');
    if (inputOpacidadeForma) {
      inputOpacidadeForma.oninput = (e) => { formasTool.setOpacidade(e.target.value); };
    }

    ligarBotao('btnConfirmarForma', () => {
      formasTool.fixarFormaNoCanvas();
    });

    ligarBotao('btnCancelarForma', () => {
      formasTool.cancelarForma();
    });

    // Atualiza também os event listeners no canvas para chamar a ferramenta de formas quando selecionada:
    canvasContainer.addEventListener('mousedown', (e) => {
      atualizarReferenciaCanvasAtivo();
      if (ferramentaAtual === 'balde') {
        if (typeof baldeTool.executar === 'function') baldeTool.executar(e);
      } else if (ferramentaAtual === 'formas') {
        formasTool.iniciarForma(e);
      }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
      if (ferramentaAtual === 'formas') {
        formasTool.atualizarProgresso(e);
      }
    });

    canvasContainer.addEventListener('mouseup', (e) => {
      if (ferramentaAtual === 'formas') {
        formasTool.finalizarForma();
      }
    });
