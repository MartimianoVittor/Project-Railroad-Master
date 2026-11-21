import assert from 'node:assert/strict';
import { criarSincronizadorEstadoMesa } from '../js/services/estadosMesa.js';
const dormir=ms=>new Promise(r=>setTimeout(r,ms));
const store=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};};
function fabricar({remoto=null,local={viagens:[{id:'l'}]},onGravar=null,onLer=null,confirm=true}={}){
 const estado={modoLocal:false,cliente:{},usuario:{id:'usuario'},campanhaId:'campanha'};
 const st=store();let atual=structuredClone(local),gravacoes=[],aplicados=[];
 const sync=criarSincronizadorEstadoMesa({estado,tipo:'viagens',obterDados:()=>atual,
  aplicarDados:d=>{atual=d;aplicados.push(d)},temConteudo:d=>Boolean(d?.viagens?.length),
  preservarLocal:()=>{},armazenamento:()=>st,avisar:msg=>gravacoes.push({erro:msg}),
  confirmar:()=>confirm,
  ler:async()=>onLer?onLer():remoto,
  gravar:async(_c,_t,d,rev)=>{gravacoes.push({dados:d,rev});if(onGravar)return onGravar(d,rev);return {revisao:rev+1}}});
 return {estado,st,sync,gravacoes,aplicados,obter:()=>atual,alterar:d=>{atual=d;sync.agendar()}};
}
// Importa antigos locais somente quando o banco não tem estado.
{
 const s=fabricar();await s.sync.ativar();await dormir(30);
 assert.equal(s.gravacoes.length,1);assert.equal(s.gravacoes[0].rev,0);
 assert.equal(s.gravacoes[0].dados.viagens[0].id,'l');
 assert.equal(s.st.map.size,0);
}
// O remoto é prioritário; local anterior permanece em backup.
{
 const s=fabricar({remoto:{dados:{viagens:[{id:'r'}]},revisao:7}});
 await s.sync.ativar();assert.equal(s.obter().viagens[0].id,'r');
 assert(s.st.map.size>=1);
}
// Durante um carregamento remoto, mudanças locais não somem sem escolha.
{
 let liberar;const p=new Promise(r=>liberar=r);
 const s=fabricar({remoto:{dados:{viagens:[{id:'r'}]},revisao:3},onLer:()=>p,confirm:true});
 const ativacao=s.sync.ativar();s.alterar({viagens:[{id:'editada'}]});
 liberar({dados:{viagens:[{id:'r'}]},revisao:3});await ativacao;await dormir(30);
 assert.equal(s.obter().viagens[0].id,'editada');
 assert.equal(s.gravacoes[0].rev,3);
}
// Falha ou conflito retém alteração local sinalizada.
{
 const s=fabricar({onGravar:async()=>{throw Error('conflito')}});
 await s.sync.ativar();await dormir(30);
 assert(s.gravacoes.some(x=>x.erro?.includes('conflito')));
 assert(s.st.map.size>=1);
}
// Não mistura respostas assíncronas de campanhas distintas.
{
 let liberar;const p=new Promise(r=>liberar=r);
 const s=fabricar({remoto:{dados:{viagens:[{id:'r'}]},revisao:3},onLer:()=>s.estado.campanhaId==='nova'?Promise.resolve(null):p});
 const antes=s.sync.ativar();s.estado.campanhaId='nova';await s.sync.ativar();
 liberar({dados:{viagens:[{id:'antiga'}]},revisao:3});await antes;
 assert(s.obter().viagens[0].id==='l');
}
console.log('PASS: migração local, prioridade remota, edições concorrentes, conflito e troca de campanha');
