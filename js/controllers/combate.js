const FICHA_ROLAGEM = '<div class="cartao-rolagem">\n<label for="rolagem-traco">Traço</label>\n<select class="campo-inventario" id="rolagem-traco">\n<option value="">Selecione um traço</option>\n<option value="traco-1">Sangue Quente</option>\n<option value="traco-2">Mira Afiada</option>\n<option value="traco-3">Guerreiro Ancestral</option>\n<option value="traco-4">Amigo Kaboom</option>\n<option value="traco-5">Orelha Em Pé</option>\n<option value="traco-6">Passos Na Sombra</option>\n<option value="traco-7">Poeira e Ossos</option>\n<option value="traco-8">Rédea e Sela</option>\n<option value="traco-9">Língua de Trapo</option>\n<option value="traco-10">Agourento e Carrancudo</option>\n<option value="traco-11">Cachola Cheia</option>\n<option value="traco-12">Grande Maioral</option>\n</select>\n<label for="rolagem-bonus">Bônus / penalidade</label>\n<select class="campo-inventario" id="rolagem-bonus">\n<option value="-3">-3</option>\n<option value="-2">-2</option>\n<option value="-1">-1</option>\n<option selected="" value="0">+0</option>\n<option value="1">+1</option>\n<option value="2">+2</option>\n<option value="3">+3</option>\n</select>\n<button class="botao-rolar" data-rolagem="traco" type="button">🎲 Rolar traço</button>\n<output aria-live="polite" class="resultado-rolagem" id="resultado-traco">\n</output>\n</div>';
const FICHA_ARMAS = ['<fieldset class="cartao-arma">\n<legend>\n    Arma primária\n   </legend>\n<div class="arma-linha-nome">\n<label class="arma-nome">\n<input aria-label="Nome da arma primária" class="campo-inventario" id="arma-primaria" placeholder="Nome da arma" type="text"/>\n</label>\n<div aria-label="Munição da arma primária" class="arma-municao" role="group">\n<span class="arma-municao-titulo">Munição</span>\n<div class="arma-municao-controles">\n<button aria-label="Diminuir munição da arma primária" class="municao-botao" data-direcao="-1" data-municao="primaria" type="button">−</button>\n<input aria-label="Quantidade de munição da arma primária" class="municao-valor" id="municao-primaria" max="99" min="0" step="1" type="number" value="0"/>\n<button aria-label="Aumentar munição da arma primária" class="municao-botao" data-direcao="1" data-municao="primaria" type="button">+</button>\n</div>\n</div>\n</div>\n<div class="bonus-distancias">\n<label class="bonus-distancia">\n<span>Corpo a corpo</span>\n<input aria-label="Bônus de Corpo a corpo da arma primária" class="campo-inventario" id="bonus-primaria-corpo" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Curta</span>\n<input aria-label="Bônus de Curta da arma primária" class="campo-inventario" id="bonus-primaria-curta" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Média</span>\n<input aria-label="Bônus de Média da arma primária" class="campo-inventario" id="bonus-primaria-media" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Longa</span>\n<input aria-label="Bônus de Longa da arma primária" class="campo-inventario" id="bonus-primaria-longa" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n</div>\n</fieldset>', '<fieldset class="cartao-arma">\n<legend>\n    Arma secundária\n   </legend>\n<div class="arma-linha-nome">\n<label class="arma-nome">\n<input aria-label="Nome da arma secundária" class="campo-inventario" id="arma-secundaria" placeholder="Nome da arma" type="text"/>\n</label>\n<div aria-label="Munição da arma secundária" class="arma-municao" role="group">\n<span class="arma-municao-titulo">Munição</span>\n<div class="arma-municao-controles">\n<button aria-label="Diminuir munição da arma secundária" class="municao-botao" data-direcao="-1" data-municao="secundaria" type="button">−</button>\n<input aria-label="Quantidade de munição da arma secundária" class="municao-valor" id="municao-secundaria" max="99" min="0" step="1" type="number" value="0"/>\n<button aria-label="Aumentar munição da arma secundária" class="municao-botao" data-direcao="1" data-municao="secundaria" type="button">+</button>\n</div>\n</div>\n</div>\n<div class="bonus-distancias">\n<label class="bonus-distancia">\n<span>Corpo a corpo</span>\n<input aria-label="Bônus de Corpo a corpo da arma secundária" class="campo-inventario" id="bonus-secundaria-corpo" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Curta</span>\n<input aria-label="Bônus de Curta da arma secundária" class="campo-inventario" id="bonus-secundaria-curta" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Média</span>\n<input aria-label="Bônus de Média da arma secundária" class="campo-inventario" id="bonus-secundaria-media" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n<label class="bonus-distancia">\n<span>Longa</span>\n<input aria-label="Bônus de Longa da arma secundária" class="campo-inventario" id="bonus-secundaria-longa" max="3" min="-3" step="1" type="number" value="0"/>\n</label>\n</div>\n</fieldset>'];
const FICHA_FERIMENTOS = '<div class="linha-check">\n<label>Ferimentos:</label>\n<div class="caveiras-box">\n<input aria-label="Ferimentos 1" class="check-caveira" data-grupo="ferimentos" type="checkbox"/>\n<input aria-label="Ferimentos 2" class="check-caveira" data-grupo="ferimentos" type="checkbox"/>\n<input aria-label="Ferimentos 3" class="check-caveira" data-grupo="ferimentos" type="checkbox"/>\n</div>\n</div>';
function criarModelo(html){const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild;}
import { porId } from '../core/dom.js';
import { criarParteFicha, PARTES_FICHA } from '../modules/visualizarFicha.js';
import { TRACOS_NPC } from '../modules/npcs.js';
import { criarSincronizadorEstadoMesa } from '../services/estadosMesa.js';
import { gravarNpcRemoto } from '../services/conteudoCampanha.js';
import { mostrarAviso } from '../core/feedback.js';

const inteiro = (v, min=0, max=9999) => Math.max(min,Math.min(max,Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : min));
const escapeId = (prefixo, id) => `${prefixo}:${id}`;
const condicoes = ['Abalado','Agarrado','Atordoado','Caído','Cego','Desarmado','Exposto','Imobilizado','Inconsciente','Pesado','Sangrando','Surdo'];
const efeitos = ['Sofre penalidade em ações sob pressão','Movimento restringido','Dificuldade para agir','Precisa se levantar','Não consegue enxergar','Sem arma disponível','Vulnerável à situação','Não consegue se deslocar','Não pode agir','Movimento reduzido e -1 em testes físicos','Requer atenção e tratamento','Não consegue ouvir'];
const clonar = (v) => JSON.parse(JSON.stringify(v));
// A versão do Jogador armazena a fotografia em dados.personagem.foto.
// O campo "imagem-personagem" existe apenas como compatibilidade com fichas antigas.
const imagemPadrao = 'assets/imgs/imagemPersonagemPlaceholder.png';
function imagemValida(valor) {
 return typeof valor === 'string' && (
  /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,/i.test(valor) ||
  (/^assets\/imgs\/[a-z0-9_./-]+$/i.test(valor) && valor !== imagemPadrao)
 );
}
function imagemDaFicha(ficha) {
 const p=ficha?.dados?.personagem || {};
 return [p.foto,p['imagem-personagem']].find(imagemValida) || '';
}
function no(tag, classe='', texto='') { const e=document.createElement(tag); if(classe)e.className=classe; if(texto)e.textContent=texto;return e; }
function campo(rotulo, valor, fn, tipo='text') {const l=no('label');l.append(no('span','',rotulo));const i=no('input');i.type=tipo;i.value=valor??'';i.addEventListener('input',()=>fn(i.value));l.append(i);return l;}
function botao(rotulo,fn,classe='botao'){const b=no('button',classe,rotulo);b.type='button';b.addEventListener('click',fn);return b;}
// Adapta a ficha real do NPC ao visualizador somente leitura usado para jogadores.
// Nenhuma alteração é gravada nas fichas originais a partir desta consulta.
function registroNpcParaConsulta(npc, combatente) {
 const marcas = {};
 for(const chave of ['ferimentos','sede','fome','cansaco']) {
  const valor = chave === 'ferimentos' ? combatente.ferimentos : npc.condicoes?.[chave];
  marcas[chave] = Array.from({length:3},(_,i)=>i<inteiro(valor,0,3));
 }
 TRACOS_NPC.forEach((nome,i)=>{
  const nivel=combatente.tracos?.[nome] ?? npc.tracos?.[nome];
  marcas[`traco-${i+1}`]=Array.from({length:4},(_,j)=>j<inteiro(nivel,0,4));
 });
 const rolagens={
  'espaco-maximo-jogador':npc.capacidadePersonagem||0,
  'espaco-maximo-montaria':npc.capacidadeMontaria||0,
 };
 for(const k of ['primaria','secundaria']){
  const arma=combatente.armas?.[k] || npc.armas?.[k] || {};
  rolagens[`arma-${k}`]=arma.nome||'';
  rolagens[`municao-${k}`]=arma.municao||0;
  for(const d of ['corpo','curta','media','longa']) rolagens[`bonus-${k}-${d}`]=arma.bonus?.[d]||0;
 }
 return {
  titulo:npc.nome||combatente.nome,
  dados:{
   nome:npc.nomeJogador||'NPC',apelido:npc.apelidoJogador||'',bio:npc.bioJogador||'',fotoPerfil:npc.imagemJogador||'',
   personagem:{
    foto:npc.imagem||combatente.imagem||'',
    'nome-personagem':npc.nome||combatente.nome,
    'apelido-personagem':npc.apelido||'',
    'profissao-personagem':npc.profissao||npc.papel||'',
    'lingua-personagem':npc.linguas||'',fama:npc.fama||'',palavra:npc.palavra||'',dinheiro:npc.dinheiro||'',
    'bio-personagem':npc.descricao||'',marcadores:marcas,
   },
   inventario:{itens:(npc.itens||[]).map(item=>({
    ...item,local:item.local==='montaria'?'montaria':'jogador',
   })),rolagens},
  },
 };
}

export function criarControladorCombate({estado}) {
 let combatentes=[],selecionado=null,atual=null,turno=0,carregando=false;
 let animarProximo=false;
 // Consulta temporária no cartão da própria página Combate, sem navegação e sem modal.
 let fichaEmConsulta=null, versaoDaConsulta=0;
 const imagensEmConsulta=new Set();
 const chave=()=>`railroad-combate:v1:${estado.usuario?.id}:${estado.campanhaId}`;
 const pacote=()=>({combatentes,selecionado,atual,turno});
 // Fotos de fichas não precisam ser duplicadas no banco: são recuperadas da fonte.
 const pacoteRemoto=()=>({...pacote(),combatentes:combatentes.map(({imagem,...c})=>c)});
 const preservarLocal=()=>{
  try{sessionStorage.setItem(chave(),JSON.stringify(pacote()));}catch(e){console.warn('Backup da sessão indisponível:',e);}
  try{localStorage.setItem(chave(),JSON.stringify(pacoteRemoto()));}catch(e){console.warn('Backup local do combate indisponível:',e);}
 };
 const salvar=()=>{preservarLocal();sincronizadorEstado.agendar();};
 function aplicarPacote(d){
  if(fichaEmConsulta && !d?.combatentes?.some(c=>c.id===fichaEmConsulta.id)){fichaEmConsulta=null;versaoDaConsulta++;}
  combatentes=Array.isArray(d?.combatentes)?d.combatentes:[];
  selecionado=d?.selecionado||null;atual=d?.atual||null;turno=inteiro(d?.turno);
  imagensEmConsulta.clear();renderizar();}
 const sincronizadorEstado=criarSincronizadorEstadoMesa({
  estado,tipo:'combate',obterDados:pacoteRemoto,aplicarDados:aplicarPacote,
  temConteudo:d=>Array.isArray(d?.combatentes)&&d.combatentes.length>0,
  preservarLocal,
  avisar:mensagem=>{console.warn(mensagem);mostrarAviso(mensagem,true);}
 });
 function restaurar(){try{
  const bruto=localStorage.getItem(chave())||sessionStorage.getItem(chave());
  const d=JSON.parse(bruto||'null');
  combatentes=Array.isArray(d?.combatentes)?d.combatentes:[];
  selecionado=d?.selecionado||null;atual=d?.atual||null;turno=inteiro(d?.turno);
 }catch{combatentes=[];selecionado=null;atual=null;turno=0;}}
 let escopo='';function sincronizar(){const novo=`${estado.usuario?.id}:${estado.campanhaId}`;
  if(escopo!==novo){escopo=novo;fichaEmConsulta=null;versaoDaConsulta++;combatentes=[];selecionado=null;atual=null;turno=0;
   imagensEmConsulta.clear();if(estado.campanhaId)restaurar();}
  void sincronizadorEstado.ativar();
 }
 const ordenados=()=>[...combatentes].filter(c=>inteiro(c.ferimentos,0,3)<3).sort((a,b)=>b.iniciativa-a.iniciativa||a.ordem-b.ordem);
 const encontrar=()=>combatentes.find(c=>c.id===selecionado);
 const nomesJogadores=new Map();
  const obterDisponiveis=()=>[
  ...estado.npcs.map(n=>({id:escapeId('npc',n.id),tipo:'npc',nome:n.nome||'NPC',responsavel:'NPC',papel:n.papel||n.profissao||'',origem:n})),
  ...estado.envios.filter(e=>e.status==='aprovada').map(e=>({id:escapeId('jogador',e.ficha_id),tipo:'jogador',nome:e.titulo||'Personagem',responsavel:nomesJogadores.get(e.ficha_id)||e.nome_jogador||'Nome não informado',papel:'',envio:e})),
 ];
 async function adicionar(item){if(combatentes.some(c=>c.id===item.id))return;let origem=item.origem;
  if(item.tipo==='jogador'){if(!estado.repositorio?.obterFicha){alert('Consulta de fichas indisponível neste modo.');return;}try{const reg=await estado.repositorio.obterFicha(estado.campanhaId,item.envio.ficha_id);origem=reg;item.nome=reg.dados?.personagem?.['nome-personagem']||item.nome;item.responsavel=reg.dados?.nome||item.responsavel;nomesJogadores.set(item.envio.ficha_id,item.responsavel);item.papel=reg.dados?.personagem?.['profissao-personagem']||reg.dados?.personagem?.['profissao']||'';}catch{alert('Não foi possível carregar esta ficha.');return;}}
  const rolagens=origem?.dados?.inventario?.rolagens||{};
  const armas=item.tipo==='npc'?clonar(origem.armas||{}):Object.fromEntries(['primaria','secundaria'].map(k=>[k,{nome:rolagens[`arma-${k}`]||'',municao:inteiro(rolagens[`municao-${k}`]),bonus:Object.fromEntries(['corpo','curta','media','longa'].map(d=>[d,Number(rolagens[`bonus-${k}-${d}`])||0]))}]));
  const ferimentos=item.tipo==='npc'?inteiro(origem.condicoes?.ferimentos):inteiro(origem?.dados?.personagem?.['ferimentos']);
  const tracos=item.tipo==='npc'?clonar(origem.tracos||{}):Object.fromEntries(TRACOS_NPC.map((t,i)=>[t,inteiro(origem?.dados?.personagem?.[`traco-${i+1}`],0,4)]));
  combatentes.push({id:item.id,tipo:item.tipo,ref:item.tipo==='npc'?origem.id:item.envio.ficha_id,nome:item.nome,responsavel:item.responsavel,papel:item.papel,imagem:item.tipo==='npc'?origem.imagem:imagemDaFicha(origem),iniciativa:0,ordem:combatentes.length,preparada:'',ferimentos,armas,tracos,condicoes:[],vantagem:0,desvantagem:0});selecionado=item.id;if(!atual)atual=item.id;salvar();renderizar();}
 function removerCombatente(id) {
  const combatente=combatentes.find(c=>c.id===id);
  if(!combatente || !confirm(`Retirar ${combatente.nome} do combate? Alterações temporárias desse personagem serão descartadas.`))return;
  if(fichaEmConsulta?.id===id)fecharConsultaFicha(false);
  combatentes=combatentes.filter(c=>c.id!==id);
  const ordem=ordenados();
  if(atual===id)atual=ordem[0]?.id||null;
  if(selecionado===id)selecionado=atual||ordem[0]?.id||null;
  salvar();renderizar();
 }
 function alternarPreparada(c){c.preparada=c.preparada?'':' ';selecionado=c.id;salvar();renderizar();}
 function editar(fn){const c=encontrar();if(!c)return;fn(c);salvar();renderizar(false);}
 function atualizar(){sincronizar();renderizar();}
 function renderizar(comDetalhe=true){const lista=porId('combate-lista'),trilho=porId('combate-trilho');lista.replaceChildren();trilho.replaceChildren();const ordem=ordenados();if(!ordem.some(c=>c.id===atual))atual=ordem[0]?.id||null;
  porId('combate-atual').textContent=combatentes.find(c=>c.id===atual)?.nome||'Aguardando combatentes';
  for(const c of [...combatentes].sort((a,b)=>b.iniciativa-a.iniciativa||a.ordem-b.ordem)){const fora=inteiro(c.ferimentos,0,3)>=3;const linha=no('div',`combate-linha${c.id===selecionado?' ativa':''}${fora?' combate-fora':''}`);const nome=botao(c.nome,()=>{fecharConsultaFicha(false);selecionado=c.id;salvar();renderizar();},'combate-nome');nome.append(no('small','',c.responsavel));const ini=no('input');ini.type='number';ini.setAttribute('aria-label',`Iniciativa de ${c.nome}`);ini.value=c.iniciativa;ini.addEventListener('input',()=>{c.iniciativa=inteiro(ini.value,-999,999);salvar();renderizar(false);});const estrela=botao('',()=>alternarPreparada(c),'combate-estrela');estrela.classList.toggle('preparada',Boolean(c.preparada));estrela.setAttribute('aria-label',c.preparada?'Ação preparada':'Sem ação preparada');estrela.title='Preparar ou consultar ação';const excluir=botao('×',()=>removerCombatente(c.id),'combate-excluir');excluir.title=`Remover ${c.nome} do combate`;excluir.setAttribute('aria-label',`Remover ${c.nome} do combate`);linha.append(excluir,nome,ini,estrela);lista.append(linha);
   /* Os cartões do trilho são criados abaixo, em ordem circular. */
   /* const cartao=botao('',()=>{selecionado=c.id;salvar();renderizar();},'combate-turno');cartao.append(no('strong','',c.nome),no('small','',c.responsavel),no('span',`combate-estrela ${c.preparada?'preparada':''}`));cartao.setAttribute('aria-current',String(c.id===atual));cartao.dataset.id=c.id;trilho.append(cartao); */}
  const indiceAtual=ordem.findIndex(c=>c.id===atual);
  const fila=indiceAtual<0?ordem:ordem.slice(indiceAtual+1).concat(ordem.slice(0,indiceAtual));
  for(const c of fila){
   const cartao=no('div','combate-turno');
   const abrir=botao('',()=>{fecharConsultaFicha(false);selecionado=c.id;salvar();renderizar();},'combate-turno-identificacao');abrir.append(no('strong','',c.nome),no('small','',c.responsavel));
   const estrelaCartao=botao('',()=>alternarPreparada(c),`combate-estrela ${c.preparada?'preparada':''}`);estrelaCartao.setAttribute('aria-label',c.preparada?'Desativar ação preparada':'Preparar ação');
   cartao.append(abrir,estrelaCartao);
   cartao.dataset.id=c.id;trilho.append(cartao);
  }
  trilho.classList.toggle('combate-avancando',animarProximo);
  animarProximo=false;
  atualizarTrilho();if(comDetalhe)detalhe();}
 // O cartão "Em ação" utiliza o painel #combate-detalhe à direita dos combatentes.
 // As três partes são somente leitura, mas a ficha é exibida sem trocar de aba.
 function fecharConsultaFicha(redesenhar=true){
  versaoDaConsulta++;
  fichaEmConsulta=null;
  if(redesenhar)detalhe();
 }
 function desenharConsultaFicha(c, area){
  area.classList.add('combate-consulta-ficha-ativa');
  area.setAttribute('aria-busy',fichaEmConsulta?.status==='carregando'?'true':'false');
  const cabecalho=no('header','combate-consulta-ficha-cabecalho');
  const titulos=no('div','combate-consulta-ficha-titulos');
  titulos.append(no('small','','CONSULTA DE FICHA'),no('h2','',c.nome));
  const voltar=botao('Voltar aos controles',()=>fecharConsultaFicha(),'botao botao-discreto combate-consulta-ficha-voltar');
  cabecalho.append(titulos,voltar);
  const conteudo=no('div','combate-consulta-ficha-conteudo');
  if(fichaEmConsulta.status==='pronta'){
   conteudo.classList.add('combate-consulta-ficha-grade');
   for(const parte of Object.keys(PARTES_FICHA))
    conteudo.append(criarParteFicha(fichaEmConsulta.registro,parte));
  }else{
   const mensagem=fichaEmConsulta.status==='carregando'
    ? 'Carregando a ficha do personagem…'
    : (fichaEmConsulta.mensagem || 'Não foi possível carregar a ficha.');
   conteudo.append(no('p','combate-consulta-ficha-aviso',mensagem));
  }
  area.replaceChildren(cabecalho,conteudo);
 }
 async function abrirFichaEmAcao(c){
  if(!c)return;
  const versao=++versaoDaConsulta;
  const campanhaId=estado.campanhaId;
  const versaoSessao=estado.versaoSessao;
  selecionado=c.id;
  fichaEmConsulta={id:c.id,status:'carregando'};
  salvar();
  renderizar(false); // Marca o combatente selecionado sem substituir o painel.
  detalhe();
  try{
   let registro;
   if(c.tipo==='jogador'){
    if(!campanhaId||!estado.repositorio?.obterFicha)
     throw new Error('A consulta da ficha não está disponível nesta campanha.');
    registro=await estado.repositorio.obterFicha(campanhaId,c.ref);
   }else{
    const npc=(estado.npcs||[]).find(n=>n.id===c.ref);
    if(!npc)throw new Error('A ficha deste NPC não está disponível na campanha.');
    registro=registroNpcParaConsulta(npc,c);
   }
   if(versao!==versaoDaConsulta||estado.campanhaId!==campanhaId
      ||estado.versaoSessao!==versaoSessao||!combatentes.some(item=>item.id===c.id))return;
   fichaEmConsulta={id:c.id,status:'pronta',registro};
  }catch(erro){
   if(versao!==versaoDaConsulta||estado.campanhaId!==campanhaId)return;
   fichaEmConsulta={id:c.id,status:'erro',mensagem:erro?.message || 'A ficha não pôde ser consultada.'};
  }
  if(selecionado===c.id)detalhe();
 }
 function atualizarTrilho() {
  // A fila já está ordenada circularmente: ninguém desaparece após agir.
  const trilho=porId('combate-trilho');
  trilho.style.removeProperty('--combate-deslocamento');
  const alvo=porId('combate-atual');
  const combatente=combatentes.find(c=>c.id===atual);
  alvo.replaceChildren();
  if(combatente) {
    const consultar=botao('',()=>{fecharConsultaFicha(false);selecionado=combatente.id;salvar();renderizar();},'combate-ficha-em-acao');
    consultar.append(no('strong','',combatente.nome),no('small','',combatente.responsavel));
    consultar.title=`Selecionar ${combatente.nome}`;
    consultar.setAttribute('aria-label',`Selecionar ${combatente.nome}`);
    alvo.append(consultar);
    const estrela=botao('',()=>alternarPreparada(combatente),`combate-estrela ${combatente.preparada?'preparada':''}`);
    estrela.setAttribute('aria-label',combatente.preparada?'Desativar ação preparada':'Preparar ação');
    alvo.append(estrela);
  } else alvo.textContent='Aguardando combatentes';
 }
 // Atualiza retratos de combatentes salvos antes da correção, sem remover o combatente.
 async function recuperarRetrato(c, img){
  if(c.tipo!=='jogador' || imagemValida(c.imagem) || !estado.repositorio?.obterFicha || !estado.campanhaId || !c.ref)return;
  const campanha=estado.campanhaId;
  const chaveRetrato=`${campanha}:${c.ref}`;
  if(imagensEmConsulta.has(chaveRetrato))return;
  imagensEmConsulta.add(chaveRetrato);
  try{
   const ficha=await estado.repositorio.obterFicha(campanha,c.ref);
   if(estado.campanhaId!==campanha || !combatentes.includes(c))return;
   const foto=imagemDaFicha(ficha);
   if(foto){c.imagem=foto;salvar();if(img.isConnected)img.src=foto;}
  }catch(e){console.warn('Retrato do combatente indisponível:',e);}
 }
 function secao(titulo){const s=no('section','combate-cartao');if(titulo)s.append(no('h3','',titulo));return s;}
 function detalhe(){const area=porId('combate-detalhe');area.replaceChildren();const c=encontrar();
  if(fichaEmConsulta?.id!==c?.id&&fichaEmConsulta)fecharConsultaFicha(false);
  if(c && fichaEmConsulta?.id===c.id){desenharConsultaFicha(c,area);return;}
  area.classList.remove('combate-consulta-ficha-ativa');area.removeAttribute('aria-busy');if(!c){area.append(no('p','','Selecione um combatente.'));return;}const grade=no('div','combate-colunas');const cols=[no('div','combate-coluna'),no('div','combate-coluna'),no('div','combate-coluna')];
  const topoIdentificacao=no('div','combate-identificacao-rolagem');
  const foto=secao('');foto.classList.add('combate-cartao-retrato');const img=no('img','combate-retrato');const fotoNpc=c.tipo==='npc'?(estado.npcs||[]).find(n=>n.id===c.ref)?.imagem:'';
  img.src=[c.imagem,fotoNpc].find(imagemValida)||imagemPadrao;
  img.alt=`Retrato de ${c.nome}`;
  img.addEventListener('error',()=>{if(!img.src.endsWith(imagemPadrao))img.src=imagemPadrao;});
  if(c.tipo==='jogador'&&!imagemValida(c.imagem))void recuperarRetrato(c,img);const poster=no('div','combate-poster');const janela=no('div','combate-poster-foto');janela.append(img);poster.append(janela);foto.append(poster,no('strong','',c.nome),no('p','',c.responsavel));if(c.papel)foto.append(no('p','combate-personagem-funcao',c.papel));topoIdentificacao.append(foto);cols[0].prepend(topoIdentificacao);
  const fer=secao('');fer.classList.add('combate-cartao-ferimentos');
  const marcas=criarModelo(FICHA_FERIMENTOS);
  marcas.querySelectorAll('.check-caveira').forEach((el,i)=>{
   el.checked=i<inteiro(c.ferimentos,0,3);
   el.addEventListener('change',()=>{
    const quantidade=[...marcas.querySelectorAll('.check-caveira')].filter(x=>x.checked).length;
    c.ferimentos=quantidade;salvar();renderizar(false);
   });
  });
  fer.append(marcas);topoIdentificacao.append(fer);
  const vant=secao('');vant.classList.add('combate-vantagens-alinhadas');
  const linhaMod=no('div','combate-modificadores');
  const totalMod=no('strong','combate-modificadores-total');
  const atualizarTotal=()=>{totalMod.textContent=`Total: ${inteiro(c.vantagem,-3,3)+inteiro(c.desvantagem,-3,3)}`;};
  for(const [chave,rotulo] of [['vantagem','Vantagem'],['desvantagem','Desvantagem']]){
   const label=no('label','combate-modificador');label.append(no('span','',rotulo));
   const input=no('input');input.type='number';input.min='-3';input.max='3';input.step='1';input.value=c[chave]??0;
   input.setAttribute('aria-label',rotulo);
   input.addEventListener('input',()=>{c[chave]=inteiro(input.value,-3,3);salvar();atualizarTotal();});
   const controles=no('div','combate-modificador-controles');const ajustar=passo=>{c[chave]=inteiro(Number(input.value)+passo,-3,3);input.value=c[chave];salvar();atualizarTotal();};controles.append(botao('−',()=>ajustar(-1),'municao-botao'),input,botao('+',()=>ajustar(1),'municao-botao'));label.append(controles);linhaMod.append(label);
  }
  atualizarTotal();vant.append(linhaMod,totalMod);cols[0].append(vant);
  const rolar=secao('');rolar.classList.add('combate-rolagem-compacta');const rolagem=criarModelo(FICHA_ROLAGEM);
  rolagem.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  const select=rolagem.querySelector('select'),mod=rolagem.querySelectorAll('select')[1],resultado=rolagem.querySelector('output');
  const botaoRolar=rolagem.querySelector('.botao-rolar');
  botaoRolar.addEventListener('click',()=>{
   const indice=Number(select.value.split('-')[1])-1;
   const traco=TRACOS_NPC[indice];if(!traco){resultado.textContent='Selecione um traço';return;}
   const n=inteiro(c.tracos[traco],0,4),faces=[1,4,6,8,12][n];
   let soma=n?0:1,vezes=0;if(n){let dado;do{dado=1+Math.floor(Math.random()*faces);soma+=dado;vezes++;}while(dado===faces&&vezes<100);}
   const bonus=inteiro(mod.value,-3,3);resultado.textContent=`Resultado: ${soma+bonus} (dados ${soma}, modificador ${bonus})`;
  });
  rolar.append(rolagem);cols[1].append(rolar);
  for(const [indice,k] of ['primaria','secundaria'].entries()){
   const a=c.armas[k]||(c.armas[k]={nome:'',municao:0,bonus:{}});
   const cartao=criarModelo(FICHA_ARMAS[indice]);
   cartao.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
   const legenda=cartao.querySelector('legend');if(legenda){const rotulo=cartao.querySelector('.arma-nome');if(rotulo)cartao.prepend(no('h3','combate-arma-titulo',legenda.textContent.trim()));legenda.remove();}
   const nome=cartao.querySelector('.arma-nome input');nome.value=a.nome||'';
   nome.addEventListener('input',()=>{a.nome=nome.value;salvar();});
   const municao=cartao.querySelector('.municao-valor');municao.value=inteiro(a.municao,0,99);
   const atualizar=()=>{a.municao=inteiro(municao.value,0,99);municao.value=a.municao;salvar();};
   municao.addEventListener('change',atualizar);
   cartao.querySelectorAll('.municao-botao').forEach(bot=>bot.addEventListener('click',()=>{
    municao.value=inteiro(Number(municao.value)+Number(bot.dataset.direcao),0,99);atualizar();
   }));
   for(const [d,rotulo] of [['corpo','Corpo a corpo'],['curta','Curta'],['media','Média'],['longa','Longa']]){
    const input=[...cartao.querySelectorAll('.bonus-distancia input')].find(x=>x.getAttribute('aria-label')?.includes(rotulo));
    if(!input)continue;
    input.value=inteiro(a.bonus?.[d]??0,-3,3);
    input.addEventListener('change',()=>{a.bonus??={};a.bonus[d]=inteiro(input.value,-3,3);input.value=a.bonus[d];salvar();});
   }
   cols[1].append(cartao);
  }

  const cond=secao('Condições');cond.classList.add('combate-cartao-condicoes');
  const listaCondicoes=no('div','combate-condicoes-lista');
  const condCabecalho=cond.querySelector('h3');
  const adicionarCond=botao('+ Adicionar condição',()=>abrirSeletorCondicoes(c),'botao combate-adicionar-condicao');
  const barraCond=no('div','combate-condicoes-cabecalho');
  barraCond.append(condCabecalho,adicionarCond);cond.prepend(barraCond);
  for(let i=0;i<c.condicoes.length;i++){
   const item=c.condicoes[i],linha=no('div','combate-condicao');
   const cabecalhoItem=no('div','combate-condicao-topo');
   cabecalhoItem.append(no('strong','',item.nome||'Condição personalizada'),botao('×',()=>{c.condicoes.splice(i,1);salvar();detalhe();},'botao combate-remover-condicao'));
   const descricao=no('p','combate-condicao-descricao',item.efeito||'Sem descrição definida');
   linha.append(cabecalhoItem,descricao);listaCondicoes.append(linha);
  }
  cond.append(listaCondicoes);cols[2].append(cond);
  const preparada=secao('');preparada.classList.add('combate-preparar-cartao');
  const cabecalho=no('div','combate-preparar-cabecalho');
  const titulo=no('h3','','Preparar ações');
  const estrela=botao('',()=>{
   c.preparada=c.preparada?'':' ';
   salvar();detalhe();renderizar(false);
  },`combate-estrela ${c.preparada?'preparada':''}`);
  estrela.setAttribute('aria-label',c.preparada?'Remover ação preparada':'Criar ação preparada');
  estrela.title=c.preparada?'Remover ação preparada':'Criar ação preparada';
  cabecalho.append(titulo,estrela);preparada.append(cabecalho);
  const texto=no('textarea');texto.rows=8;texto.value=(c.preparada||'').trim();
  texto.placeholder='Descreva a ação preparada';
  texto.setAttribute('aria-label','Descrição da ação preparada');
  texto.addEventListener('input',()=>{c.preparada=texto.value||' ';salvar();});
  preparada.append(texto);
  cols[2].append(preparada);
  grade.append(...cols);area.append(grade);}
 function abrirSeletorCondicoes(c){
  let dialog=document.getElementById('combate-modal-condicoes');
  if(!dialog){dialog=no('dialog','combate-modal combate-modal-condicoes');dialog.id='combate-modal-condicoes';document.body.append(dialog);}
  dialog.replaceChildren();
  const topo=no('div','combate-condicoes-cabecalho');
  topo.append(no('h3','','Adicionar condição'),botao('×',()=>dialog.close(),'botao'));
  const busca=no('input');busca.type='search';busca.placeholder='Buscar condição pelo nome ou efeito';busca.setAttribute('aria-label','Buscar condição');
  const lista=no('div','combate-condicoes-opcoes');
  const incluir=(nome,efeito)=>{c.condicoes.push({nome,efeito});salvar();dialog.close();detalhe();};
  const desenhar=()=>{
   lista.replaceChildren();
   condicoes.forEach((nome,i)=>{
    const efeito=efeitos[i],filtro=busca.value.toLocaleLowerCase('pt-BR');
    if(!`${nome} ${efeito}`.toLocaleLowerCase('pt-BR').includes(filtro))return;
    const opcao=botao('',()=>incluir(nome,efeito),'combate-condicao-opcao');
    opcao.append(no('strong','',nome),no('span','',efeito));lista.append(opcao);
   });
   if(!lista.children.length)lista.append(no('p','','Nenhuma condição encontrada.'));
  };
  busca.addEventListener('input',desenhar);desenhar();
  const personalizado=no('div','combate-condicao-personalizada');
  personalizado.append(no('h4','','Criar condição personalizada'));
  const nome=no('input');nome.placeholder='Nome da condição';nome.setAttribute('aria-label','Nome da condição personalizada');
  const descricao=no('textarea');descricao.rows=3;descricao.placeholder='Descrição completa do efeito';descricao.setAttribute('aria-label','Descrição da condição personalizada');
  const criar=botao('Criar e adicionar',()=>{if(!nome.value.trim()){nome.focus();return;}incluir(nome.value.trim(),descricao.value.trim());},'botao combate-botao-amarelo');
  personalizado.append(nome,descricao,criar);
  dialog.append(topo,busca,lista,personalizado);dialog.showModal();
 }
 async function carregarNomesJogadores(){
   if(!estado.repositorio?.obterFicha||!estado.campanhaId)return;
   const campanha=estado.campanhaId;
   const pendentes=estado.envios.filter(e=>e.status==='aprovada'&&e.ficha_id&&!nomesJogadores.has(e.ficha_id));
   await Promise.all(pendentes.map(async e=>{try{const reg=await estado.repositorio.obterFicha(campanha,e.ficha_id);if(estado.campanhaId===campanha){const nome=reg?.dados?.nome?.trim();if(nome)nomesJogadores.set(e.ficha_id,nome);}}catch{}}));
   if(estado.campanhaId===campanha&&porId('combate-modal')?.open)listarDisponiveis();
  }
  function abrirModal(){const modal=porId('combate-modal');porId('combate-busca').value='';listarDisponiveis();modal.showModal();void carregarNomesJogadores();}
 function listarDisponiveis(){const busca=porId('combate-busca').value.toLocaleLowerCase('pt-BR'),area=porId('combate-disponiveis');area.replaceChildren();for(const item of obterDisponiveis().filter(x=>`${x.nome} ${x.responsavel} ${x.papel}`.toLocaleLowerCase('pt-BR').includes(busca))){const b=botao(`${item.nome} · ${item.responsavel}${item.papel?' · '+item.papel:''}`,()=>void adicionar(item));b.disabled=combatentes.some(c=>c.id===item.id);area.append(b);}if(!area.children.length)area.append(no('p','','Nenhum personagem encontrado.'));}
 function passar(){const ordem=ordenados();if(!ordem.length)return;fecharConsultaFicha(false);const i=ordem.findIndex(c=>c.id===atual);atual=ordem[(i+1)%ordem.length].id;if(i===ordem.length-1)turno++;selecionado=atual;animarProximo=true;salvar();renderizar();}
 async function encerrar(){
  if(!confirm('Encerrar combate? Ferimentos e armas de NPCs serão salvos; o estado do combate será encerrado.'))return;
  const alterados=estado.npcs.map(n=>{const c=combatentes.find(x=>x.tipo==='npc'&&x.ref===n.id);
   return c?{...n,armas:clonar(c.armas),condicoes:{...n.condicoes,ferimentos:c.ferimentos}}:null;
  }).filter(Boolean);
  const npcs=estado.npcs.map(n=>alterados.find(a=>a.id===n.id)||n);
  try{
   // Persistir primeiro no banco: se falhar, o combate não é encerrado.
   if(!estado.modoLocal&&estado.campanhaId){
    for(const n of alterados) await gravarNpcRemoto(estado.campanhaId,n);
   }
   if(estado.campanhaId&&estado.npcsRepo)
    estado.npcs=estado.npcsRepo.salvar(estado.usuario?.id,estado.campanhaId,npcs);
  }catch(e){alert(`Não foi possível salvar os NPCs: ${e.message}. O combate foi preservado.`);return;}
  if(combatentes.some(c=>c.tipo==='jogador'))
   alert('As alterações nas fichas dos jogadores permanecem apenas neste combate. O Mestre não possui permissão para editar as fichas privadas dos jogadores.');
  combatentes=[];selecionado=null;atual=null;turno=0;salvar();renderizar();
 }
 function iniciarEventos(){
  // O cartão inteiro abre a ficha no próprio detalhe; a estrela mantém sua ação independente.
  porId('combate-atual').closest('.combate-acao').addEventListener('click',evento=>{
   if(evento.target.closest('button'))return;
   abrirFichaEmAcao(combatentes.find(c=>c.id===atual));
  });
  porId('combate-adicionar').addEventListener('click',abrirModal);porId('combate-fechar').addEventListener('click',()=>porId('combate-modal').close());porId('combate-busca').addEventListener('input',listarDisponiveis);porId('combate-passar').addEventListener('click',passar);porId('combate-encerrar').addEventListener('click',encerrar);}
 return {iniciarEventos,atualizar};
}
