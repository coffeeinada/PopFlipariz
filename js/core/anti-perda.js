/**
 * PopFlipariz - Código Anti-Perda Acidental de Progresso
 * Caminho: js/core/anti-perda.js
 */

export function inicializarSistemaAntiPerda() {
  // Protocolo padrão do navegador ao tentar fechar a aba ou mudar de site externo[cite: 2]
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Tem a certeza de que deseja sair? O seu progresso não guardado poderá ser perdido.';
    return e.returnValue;
  });

  // Interceção personalizada para navegação interna, recarregamentos e ações do site[cite: 2]
  window.PopFliparizAlertaSaida = {
    intercetarNavegacaoInterna(callbackSair) {
      const confirmar = window.confirm('EPA! Tem certeza? pode acabar perdendo toda sua arte!');
      if (confirmar) {
        if (callbackSair) callbackSair();
      } else {
        console.log('Utilizador escolheu "ficar" na página.');
      }
    }
  };
}
