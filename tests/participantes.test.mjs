import test from 'node:test';
import assert from 'node:assert/strict';
import { agruparParticipantes } from '../js/modules/participantes.js';

test('um jogador com duas fichas aparece uma vez com ambos os personagens', () => {
    const dados = [
        { jogador_id: 'j-1', jogador_nome: 'Ana', convite_status: 'aceito', envio_id: 'e-1', personagem_nome: 'Jane', ficha_status: 'pendente' },
        { jogador_id: 'j-1', jogador_nome: 'Ana', convite_status: 'aceito', envio_id: 'e-2', personagem_nome: 'Mary', ficha_status: 'aprovada' },
        { jogador_id: 'j-2', jogador_nome: 'Carlos', convite_status: 'pendente', envio_id: null, personagem_nome: null, ficha_status: null },
    ];
    const original = structuredClone(dados);
    const grupos = agruparParticipantes(dados);
    assert.equal(grupos.length, 2);
    assert.deepEqual(grupos[0].personagens.map((p) => p.nome), ['Jane', 'Mary']);
    assert.equal(grupos[1].personagens.length, 0);
    assert.equal(grupos[1].conviteStatus, 'pendente');
    assert.deepEqual(dados, original);
});

test('dados vazios ou sem identificação não criam participantes fantasmas', () => {
    assert.deepEqual(agruparParticipantes([]), []);
    assert.deepEqual(agruparParticipantes([{ jogador_id: null, envio_id: 'x' }]), []);
});
