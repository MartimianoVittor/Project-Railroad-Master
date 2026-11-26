/**
 * Testes de migração SQL são executados quando os arquivos locais existem.
 * O repositório público não inclui /supabase: no CI, apenas os testes que
 * dependem diretamente desses arquivos são marcados como ignorados.
 * Os demais testes continuam obrigatórios.
 */
import test from 'node:test';
import { existsSync } from 'node:fs';

export function testarMigracaoLocal(nome, arquivos, executar) {
    const ausentes = arquivos.filter((arquivo) =>
        !existsSync(new URL(`../../supabase/${arquivo}`, import.meta.url)));
    return test(nome, {
        skip: ausentes.length
            ? `Migrações SQL locais ausentes: ${ausentes.join(', ')}`
            : false,
    }, executar);
}
