import { porId } from '../core/dom.js?v=mesa-32';
import { criarPersonalizacaoMestre } from './personalizacaoMestre.js?v=mesa-32';
import { executar } from '../core/feedback.js?v=mesa-32';

// Opções da conta separadas da composição da Mesa.
// Os elementos originais Salvar/Sair permanecem ocultos para preservar
// seus fluxos de negócio, inclusive as verificações anteriores ao logout.
export function criarMenuConta({ estado, salvarMesa }) {
    const personalizacao = criarPersonalizacaoMestre(estado);
    function atualizarSessao(usuario) {
        void personalizacao.carregarConta();
        porId('salvar-campanha').hidden = true;
        porId('sair').hidden = true;
        porId('abrir-conta').hidden = !usuario;
        const modal = porId('modal-conta');
        if (modal.open) modal.close();
    }

    function iniciarEventos() {
        personalizacao.iniciar();
        const modal = porId('modal-conta');
        porId('abrir-conta').addEventListener('click', () => {
            porId('conta-identificacao').textContent = estado.modoLocal
                ? 'Modo local — dados neste navegador'
                : (estado.usuario?.email || 'Conta conectada');
            porId('conta-salvar').disabled = porId('salvar-campanha').disabled;
            modal.showModal();
        });
        porId('fechar-conta').addEventListener('click', () => modal.close());
        modal.addEventListener('click', (evento) => {
            if (evento.target === modal) modal.close();
        });
        porId('conta-salvar').addEventListener('click', () =>
            void executar(porId('conta-salvar'), async () => {
                await salvarMesa();
                modal.close();
            }));
        porId('conta-sair').addEventListener('click', () => {
            modal.close();
            porId('sair').click();
        });
    }

    return { atualizarSessao, iniciarEventos };
}
