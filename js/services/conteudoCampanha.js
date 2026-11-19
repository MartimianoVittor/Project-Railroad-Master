import { obterCliente, exigir } from '../core/cliente.js';
import { normalizarNpc } from '../modules/npcs.js';

// Não apaga dados locais automaticamente. Todas as consultas usam campanha_id e RLS.
const cliente = async () => obterCliente();
export async function listarNpcsRemotos(campanhaId) {
    const db = await cliente();
    const linhas = exigir(await db.from('npcs').select('id,nome,dados').eq('campanha_id',campanhaId).order('created_at'));
    return linhas.map(l => normalizarNpc({...l.dados,id:l.id,nome:l.nome}));
}
export async function gravarNpcRemoto(campanhaId,npc) {
    const db=await cliente();
    const {id,nome}=npc;
    exigir(await db.from('npcs').upsert({id,campanha_id:campanhaId,nome,dados:npc},{onConflict:'id'}).select('id').single());
}
export async function apagarNpcRemoto(campanhaId,id) {
    const db=await cliente();
    exigir(await db.from('npcs').delete().eq('campanha_id',campanhaId).eq('id',id));
}
export async function listarSessoesRemotas(campanhaId) {
    const db=await cliente();
    const linhas=exigir(await db.from('sessoes').select('id,nome,descricao,notas,quadro,posicao,ativa,updated_at').eq('campanha_id',campanhaId).order('posicao').order('created_at'));
    return {sessoes:linhas.map(({id,nome,descricao,notas,quadro})=>({id,nome,descricao,notas,quadro})),
        ativaId:linhas.find(l=>l.ativa)?.id||linhas[0]?.id||null,
        salvoEm:linhas.reduce((v,l)=>l.updated_at>v?l.updated_at:v,'')||null};
}
export async function salvarSessoesRemotas(campanhaId,dados,idsConhecidos) {
    const db=await cliente();
    // Evita violar o índice de uma única sessão ativa ao alterar a seleção.
    exigir(await db.from('sessoes').update({ativa:false}).eq('campanha_id',campanhaId).eq('ativa',true));
    for(const [posicao,s] of dados.sessoes.entries()) {
        exigir(await db.from('sessoes').upsert({id:s.id,campanha_id:campanhaId,nome:s.nome,descricao:s.descricao,
            notas:s.notas,quadro:s.quadro,posicao,ativa:s.id===dados.ativaId},{onConflict:'id'}).select('id').single());
    }
    const presentes=new Set(dados.sessoes.map(s=>s.id));
    for(const id of idsConhecidos) if(!presentes.has(id))
        exigir(await db.from('sessoes').delete().eq('campanha_id',campanhaId).eq('id',id));
}
