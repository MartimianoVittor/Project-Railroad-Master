import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRepositorioSessoes, criarSessao, duplicarSessao, moverSessao } from '../js/modules/sessoes.js';

const armazenamento = () => {
    const dados = new Map();
    return {
        dados,
        getItem: (chave) => dados.get(chave) ?? null,
        setItem: (chave, valor) => dados.set(chave, valor),
    };
};

test('sessões ficam separadas por campanha e usuário, com seleção e ordem persistentes', () => {
    const repo = criarRepositorioSessoes(armazenamento());
    const a = criarSessao({ notas: 'A chegada do trem.' });
    const b = criarSessao({ notas: 'A emboscada.' });
    const salvo = repo.salvar('mestre1', 'campanha1', { sessoes: [a, b], ativaId: b.id });
    assert.ok(salvo.salvoEm);
    const recuperado = repo.carregar('mestre1', 'campanha1');
    assert.deepEqual(recuperado.sessoes.map((s) => s.notas), ['A chegada do trem.', 'A emboscada.']);
    assert.equal(recuperado.ativaId, b.id);
    assert.equal(repo.carregar('mestre1', 'campanha2').sessoes.length, 0);
    assert.equal(repo.carregar('mestre2', 'campanha1').sessoes.length, 0);
});

test('duplicar cria sessão independente, excluir e reordenar não alteram as outras', () => {
    const a = criarSessao({ notas: 'Original', quadro: { itensQuadro: [{ tipo: 'texto', texto: 'Ideia', x: 10, y: 12 }] } });
    const b = criarSessao({ notas: 'Segunda' });
    const lista = [a, b];
    const copia = duplicarSessao(lista, a.id);
    assert.equal(lista.length, 3);
    assert.notEqual(copia.id, a.id);
    assert.equal(copia.notas, 'Original');
    copia.quadro.itensQuadro[0].texto = 'Alterado';
    assert.equal(a.quadro.itensQuadro[0].texto, 'Ideia');
    assert.equal(moverSessao(lista, b.id, a.id), true);
    assert.deepEqual(lista.map((s) => s.id), [b.id, a.id, copia.id]);
    lista.splice(1, 1);
    assert.deepEqual(lista.map((s) => s.id), [b.id, copia.id]);
});

test('migra rascunho anterior sem apagar marcos nem ideias', () => {
    const storage = armazenamento();
    storage.setItem('railroad_mestre_rascunho:v1:mestre:mesa', JSON.stringify({
        anotacoes: 'Marcos antigos', ideias: 'Ideias antigas', salvoEm: '2026-11-01T00:00:00Z',
    }));
    const repo = criarRepositorioSessoes(storage);
    const lido = repo.carregar('mestre', 'mesa');
    assert.equal(lido.sessoes.length, 1);
    assert.match(lido.sessoes[0].notas, /Marcos antigos/);
    assert.match(lido.sessoes[0].notas, /Ideias antigas/);
    repo.salvar('mestre', 'mesa', lido);
    assert.equal(repo.carregar('mestre', 'mesa').sessoes.length, 1);
});

test('armazenamento cheio retorna erro explícito e não finge salvar', () => {
    const repo = criarRepositorioSessoes({ getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } });
    assert.throws(() => repo.salvar('m', 'c', { sessoes: [criarSessao()] }), /armazenamento pode estar cheio/);
});

test('sem campanha e dados corrompidos não quebram o diário', () => {
    const storage = armazenamento();
    const repo = criarRepositorioSessoes(storage);
    assert.throws(() => repo.salvar('mestre', '', { sessoes: [] }), /Selecione uma campanha/);
    storage.setItem('railroad_mestre_sessoes:v2:mestre:mesa', '{invalid');
    assert.deepEqual(repo.carregar('mestre', 'mesa').sessoes, []);
});


test('nome e descrição são persistidos por campanha e limitados a 80 e 25 caracteres', () => {
    const repo = criarRepositorioSessoes(armazenamento());
    const sessao = criarSessao({
        nome: '  O trem da meia-noite  ',
        descricao: '🚂'.repeat(30),
        notas: 'Os personagens chegam à estação.',
    });
    assert.equal(sessao.nome, 'O trem da meia-noite');
    assert.equal(Array.from(sessao.descricao).length, 25);
    const recuperado = repo.carregar('mestre', 'campanha');
    assert.equal(recuperado.sessoes.length, 0);
    repo.salvar('mestre', 'campanha', { sessoes: [sessao], ativaId: sessao.id });
    const dados = repo.carregar('mestre', 'campanha');
    assert.equal(dados.sessoes[0].nome, sessao.nome);
    assert.equal(dados.sessoes[0].descricao, sessao.descricao);
    assert.equal(dados.sessoes[0].notas, sessao.notas);
});

test('sessões antigas continuam legíveis e podem receber título sem perder o quadro', () => {
    const storage = armazenamento();
    storage.setItem('railroad_mestre_sessoes:v2:mestre:campanha', JSON.stringify({
        sessoes: [{ id: 'legado', notas: 'Anotação original', quadro: { desenhoCanvas: '', itensQuadro: [{ tipo: 'texto', texto: 'Ideia' }] } }],
        ativaId: 'legado',
    }));
    const repo = criarRepositorioSessoes(storage);
    const antigo = repo.carregar('mestre', 'campanha');
    assert.equal(antigo.sessoes[0].nome, '');
    assert.equal(antigo.sessoes[0].descricao, '');
    antigo.sessoes[0].nome = 'Sessão antiga';
    antigo.sessoes[0].descricao = 'Resumo';
    repo.salvar('mestre', 'campanha', antigo);
    const recuperado = repo.carregar('mestre', 'campanha').sessoes[0];
    assert.equal(recuperado.nome, 'Sessão antiga');
    assert.equal(recuperado.notas, 'Anotação original');
    assert.equal(recuperado.quadro.itensQuadro[0].texto, 'Ideia');
});

test('duplicação preserva descrição e numeração depende da posição, não do identificador', () => {
    const a = criarSessao({ nome: 'A chegada', descricao: 'Início da jornada' });
    const b = criarSessao({ nome: 'A fuga', descricao: 'Perseguição' });
    const c = criarSessao({ nome: 'O duelo' });
    const sessoes = [a, b, c];
    const copia = duplicarSessao(sessoes, a.id);
    assert.match(copia.nome, /cópia/);
    assert.equal(copia.descricao, a.descricao);
    assert.equal(moverSessao(sessoes, a.id, c.id, 'depois'), true);
    assert.deepEqual(sessoes.map((s) => s.id), [copia.id, b.id, c.id, a.id]);
    assert.equal(moverSessao(sessoes, c.id, copia.id, 'antes'), true);
    assert.deepEqual(sessoes.map((s) => s.id), [c.id, copia.id, b.id, a.id]);
    assert.equal(moverSessao(sessoes, a.id, a.id), false);
});
