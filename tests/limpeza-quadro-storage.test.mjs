import test from 'node:test';
import assert from 'node:assert/strict';
import { testarMigracaoLocal } from './apoio/migracoes-locais.mjs';
import { readFileSync } from 'node:fs';

const quadro = readFileSync(new URL('../js/modules/quadroMestre.js', import.meta.url), 'utf8');
const persistencia = readFileSync(new URL('../js/services/conteudoCampanha.js', import.meta.url), 'utf8');

test('quadro reutiliza desenho ao alterar textos ou imagens', () => {
    assert.match(quadro, /desenhoModificado && !instantaneoDesenho/);
    assert.match(quadro, /temDesenho \? canvas\.toDataURL\('image\/png'\) : ''/);
    assert.match(quadro, /desenhoModificado = true/);
});

testarMigracaoLocal('limpeza exige 30 dias e imagem sem referência em sessão persistida',
    ['018_limpeza_segura_imagens_quadro.sql'], () => {
    const sql = readFileSync(new URL('../supabase/018_limpeza_segura_imagens_quadro.sql', import.meta.url), 'utf8');
    assert.match(sql, /created_at < now\(\) - interval '30 days'/);
    assert.match(sql, /strpos\(s\.quadro::text, p_nome\) > 0/);
    assert.match(sql, /railroad_private\.mestre_possui_campanha/);
    assert.match(sql, /FOR DELETE TO authenticated/);
});

test('limpeza só é solicitada após confirmação do salvamento do diário', () => {
    const trecho = persistencia.slice(persistencia.indexOf('export async function salvarSessoesRemotas'));
    assert.ok(trecho.indexOf('const novaRevisao = revisaoRecebida(resposta)') < trecho.indexOf('limparImagensObsoletasDasSessoes'));
    assert.match(trecho, /\.catch\(\(erro\) => console\.warn/);
});
