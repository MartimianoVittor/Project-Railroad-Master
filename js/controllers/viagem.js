/** Viagens por campanha: backup local e sincronização opcional Supabase. */
import { criarSincronizadorEstadoMesa } from '../services/estadosMesa.js';
import { mostrarAviso } from '../core/feedback.js';
export function criarControladorViagem({estado}) {
 const $=id=>document.getElementById(id), node=(tag,txt='',cls='')=>{const n=document.createElement(tag);n.textContent=txt;n.className=cls;return n;};
 const num=v=>Math.max(0,Math.ceil(Number(v)||0)),fmt=v=>num(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
 let chave='',dados={versao:2,viagens:[],ativa:null},selecionado='',cache=new Map(),acao=null;
 let abrirEdicaoViajante=()=>{};
 const idNovo=()=>globalThis.crypto?.randomUUID?.()||`vg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const grupoNovo=nome=>({id:idNovo(),nome,percorrido:0,desde:0,ritmo:'normal',busca:'nenhuma',viajantes:[]});
 const viagem=()=>dados.viagens.find(v=>v.id===dados.ativa)||null;
 const grupo=()=>{const v=viagem();return v?.grupos.find(g=>g.id===v.ativo)||null;};
 const preservarLocal=()=>{if(!chave)return;try{localStorage.setItem(chave,JSON.stringify(dados));}catch(e){alert('Falha ao salvar viagens no navegador: '+e.message);}};
 const salvar=()=>{preservarLocal();sincronizador.agendar();};
 const sincronizador=criarSincronizadorEstadoMesa({
  estado,tipo:'viagens',
  obterDados:()=>dados,
  aplicarDados:d=>{dados=normalizar(d);selecionado='';render();},
  temConteudo:d=>Array.isArray(d?.viagens)&&d.viagens.length>0,
  preservarLocal,
  avisar:mensagem=>{console.warn(mensagem);mostrarAviso(mensagem,true);}
 });
 // A versão 2 usa outra chave e preserva intacta a cópia anterior (v1).
 // Cada viagem mantém seus próprios grupos, membros, andamento e seleções.
 function normalizar(d){
  const fonte=Array.isArray(d?.viagens)?d.viagens:(Array.isArray(d?.grupos)?[{id:idNovo(),nome:'Viagem 1',total:d.total,grupos:d.grupos,ativo:d.ativo}]:[]);
  const viagens=fonte.filter(v=>v&&typeof v==='object').map((v,i)=>{
   const grupos=(Array.isArray(v.grupos)?v.grupos:[]).filter(g=>g&&typeof g==='object').map((g,j)=>({
    ...g,id:String(g.id||idNovo()),nome:String(g.nome||`Grupo ${j+1}`),
    percorrido:num(g.percorrido),desde:num(g.desde),
    ritmo:g.ritmo||'normal',busca:g.busca==='normal'?'nenhuma':(g.busca||'nenhuma'),
    viajantes:Array.isArray(g.viajantes)?g.viajantes.map(pessoa=>({
     ...pessoa,km:num(pessoa.km),
     // Registros anteriores não traziam este limite: preservar como desconhecido.
     kmDescanso:Number(pessoa.kmDescanso)>0?num(pessoa.kmDescanso):null
    })):[]
   }));
   return {...v,id:String(v.id||idNovo()),nome:String(v.nome||`Viagem ${i+1}`),total:num(v.total),
    grupos,ativo:grupos.some(g=>g.id===v.ativo)?v.ativo:(grupos[0]?.id||null)};
  });
  return {versao:2,viagens,ativa:viagens.some(v=>v.id===d?.ativa)?d.ativa:(viagens[0]?.id||null)};
 }
 function atualizar(){
  const nova=estado.campanhaId&&estado.usuario?.id?`railroad-viagens:v2:${estado.usuario.id}:${estado.campanhaId}`:'';
  if(chave!==nova){
   chave=nova;selecionado='';cache=new Map();nomesJogadores.clear();
   try{
    const atual=chave?JSON.parse(localStorage.getItem(chave)||'null'):null;
    const anterior=chave&&!atual?JSON.parse(localStorage.getItem(chave.replace(':v2:',':v1:'))||'null'):null;
    dados=normalizar(atual||anterior);
    if(anterior&&!atual)salvar();
   }catch{dados=normalizar(null);}
  }
  render();
  void sincronizador.ativar();
 }
 // A velocidade (km/dia) e a autonomia (km até descanso) são grandezas independentes.
 const limiteDescanso=g=>{
  if(!g?.viajantes?.length||g.viajantes.some(v=>!(Number(v.kmDescanso)>0)))return null;
  return Math.min(...g.viajantes.map(v=>num(v.kmDescanso)));
 };
 const velocidade=g=>g&&g.viajantes.length?num(Math.min(...g.viajantes.map(v=>num(v.km)))*({cauteloso:.5,normal:1,acelerado:1.5}[g.ritmo]||1)*({nenhuma:1,normal:1,rapida:.75,dedicada:.5}[g.busca]||1)):0;
 function render(){
  const v=viagem(),g=grupo();
  const seletorViagem=$('vg-viagem');seletorViagem.replaceChildren();
  for(const item of dados.viagens){const op=node('option',item.nome);op.value=item.id;seletorViagem.append(op);}
  if(!dados.viagens.length)seletorViagem.append(node('option','Nenhuma viagem'));
  seletorViagem.value=v?.id||'';seletorViagem.disabled=!dados.viagens.length;
  const sel=$('vg-grupo');sel.replaceChildren();
  for(const item of v?.grupos||[]){const op=node('option',item.nome);op.value=item.id;sel.append(op);}
  if(!v?.grupos.length)sel.append(node('option','Nenhum grupo'));
  sel.value=g?.id||'';sel.disabled=!g;
  const perc=num(g?.percorrido),total=num(v?.total),resta=Math.max(0,total-perc);
  $('vg-resumo').textContent=`${fmt(perc)} km percorridos · ${fmt(resta)} km restantes · ${fmt(total)} km totais`;
  $('vg-barra').max=total||1;$('vg-barra').value=Math.min(perc,total);
  $('vg-barra').setAttribute('aria-label',g?`Progresso de ${g.nome} na viagem ${v.nome}`:'Progresso da viagem');
  $('vg-criar').disabled=!chave;
  $('vg-editar').disabled=!v;
  $('vg-adicionar-grupo').disabled=!v;
  for(const id of ['vg-excluir-grupo','vg-adicionar','vg-ritmo','vg-busca','vg-descansar'])$(id).disabled=!g;
  $('vg-excluir-grupo').disabled=!g;
  const autonomia=limiteDescanso(g);
  const ateDescanso=autonomia===null?Infinity:Math.max(0,autonomia-num(g?.desde));
  $('vg-viajar').disabled=!g||!velocidade(g)||!resta||ateDescanso<=0;
  $('vg-viajar').title=g&&autonomia!==null&&ateDescanso<=0?'O grupo precisa descansar antes de continuar.':'';
  $('vg-qtd').textContent=g?.viajantes.length||0;
  $('vg-vel').textContent=`${fmt(velocidade(g))} km/dia`;
  $('vg-max').textContent=autonomia===null?'Não informada':`${fmt(autonomia)} km`;
  $('vg-descanso').textContent=`${fmt(g?.desde||0)} km`;
  $('vg-ritmo').value=g?.ritmo||'normal';$('vg-busca').value=g?.busca==='normal'?'nenhuma':(g?.busca||'nenhuma');
  const lista=$('vg-lista');lista.replaceChildren();
  if(!g)lista.append(node('p',!chave?'Selecione uma campanha.':!v?'Crie uma viagem.':'Crie um grupo nesta viagem.'));
  else for(const integrante of g.viajantes){
   const card=node('div','','vg-item'+(selecionado===integrante.id?' ativo':'')),abrir=node('button'),remover=node('button','×');
   abrir.type=remover.type='button';
   abrir.append(node('strong',integrante.nome),node('small',integrante.responsavel),node('small',`${integrante.montaria||'Sem montaria'} · ${fmt(integrante.km)} km/dia`),node('small',integrante.kmDescanso?`${fmt(integrante.kmDescanso)} km até descanso`:'Descanso não informado'));
   abrir.onclick=()=>{selecionado=integrante.id;render();void buscarFicha(integrante);};
   card.onclick=e=>{if(e.target.closest('button'))return;abrir.click();};
   remover.title='Remover viajante';remover.onclick=()=>{
    if(!confirm(`Remover ${integrante.nome} do grupo?`))return;
    g.viajantes=g.viajantes.filter(x=>x.id!==integrante.id);
    if(selecionado===integrante.id)selecionado='';salvar();render();
   };
   const editar=node('button','✎','vg-editar-viajante');editar.type='button';
   editar.title=`Editar montaria, velocidade e descanso de ${integrante.nome}`;
   editar.setAttribute('aria-label',editar.title);
   editar.onclick=()=>abrirEdicaoViajante(integrante);
   card.append(abrir,editar,remover);lista.append(card);
  }
  detalhe();
 }
 function modal(titulo,rotulo,valor,tipo,fn,{nome=null,excluir=false}={}){
  acao=fn;
  $('vg-dialog-titulo').textContent=titulo;
  $('vg-dialog-label').textContent=rotulo;
  const campo=$('vg-campo');campo.type=tipo;campo.value=valor;
  campo.min=tipo==='number'?'1':'';campo.step=tipo==='number'?'1':'';
  campo.maxLength=tipo==='text'?80:524288;
  const linha=$('vg-nome-linha'),nomeCampo=$('vg-nome');
  linha.hidden=nome===null;nomeCampo.disabled=nome===null;
  nomeCampo.required=nome!==null;nomeCampo.value=nome??'';
  $('vg-excluir-viagem').hidden=!excluir;
  $('vg-dialog').showModal();
  (nome!==null?nomeCampo:campo).focus();
 }
 const nomesJogadores=new Map();
  function disponiveis(){const itens=[];for(const n of estado.npcs||[])itens.push({id:'npc:'+n.id,ref:n.id,tipo:'npc',nome:n.nome||'NPC',responsavel:'NPC'});
  for(const e of estado.envios||[]){if(!['aprovada','aprovado'].includes(e.estado)&&!['aprovada','aprovado'].includes(e.status))continue;const id=e.ficha_id||e.id;itens.push({id:'jogador:'+id,ref:id,tipo:'jogador',nome:e.nome_personagem||e.titulo||e.nome||'Personagem',responsavel:nomesJogadores.get(id)||e.nome_jogador||'Nome não informado'});}return itens;}
 async function buscarFicha(v){if(v.tipo!=='jogador'||cache.has(v.id)||!estado.repositorio?.obterFicha)return;const camp=estado.campanhaId;try{const ficha=await estado.repositorio.obterFicha(camp,v.ref);if(estado.campanhaId!==camp)return;cache.set(v.id,ficha);if(ficha?.dados?.nome?.trim())nomesJogadores.set(v.ref,ficha.dados.nome.trim());if(selecionado===v.id)detalhe();}catch(e){if(selecionado===v.id)$('vg-detalhe').append(node('p','Erro ao consultar ficha: '+e.message));}}
 function detalhe(){
  const area=$('vg-detalhe');if(!area)return;area.replaceChildren();
  const v=grupo()?.viajantes.find(x=>x.id===selecionado);
  if(!v){area.append(node('p','Selecione um viajante.'));return;}
  const npc=(estado.npcs||[]).find(n=>n.id===v.ref)||{};
  const ficha=cache.get(v.id)?.dados||{};
  const p=v.tipo==='npc'?npc:(ficha.personagem||{});
  const nome=v.tipo==='npc'?npc.nome:p['nome-personagem'];
  const prof=v.tipo==='npc'?(npc.papel||npc.profissao):p['profissao-personagem'];
  const imagem=v.tipo==='npc'?npc.imagem:(p['imagem-personagem']||p.foto);
  const secao=(titulo,classe)=>{const s=node('section','',`vg-ficha-cartao ${classe||''}`);if(titulo)s.append(node('h4',titulo));return s;};
  const identificacao=secao('','vg-ficha-identificacao');
  const img=node('img');img.alt=`Retrato de ${v.nome}`;
  img.src=/^(data:image\/(png|jpeg|webp);base64,|assets\/imgs\/)/.test(imagem||'')?imagem:'assets/imgs/imagemPersonagemPlaceholder.png';
  const identidade=node('div','','vg-ficha-identidade');identidade.append(node('strong',nome||v.nome),node('small',v.responsavel));
  if(prof)identidade.append(node('small',prof));
  const poster=node('div','','vg-ficha-poster');const janela=node('div','','vg-ficha-poster-foto');janela.append(img);poster.append(janela);identificacao.append(poster,identidade);area.append(identificacao);
  const painel= node('div','','vg-ficha-grade');
  const marcas=secao('Sobrevivência','vg-ficha-marcas');
  const grupoMarcas=node('div','','grupo-caveiras');
  for(const [campo,titulo] of [['ferimentos','Ferimentos'],['sede','Sede'],['fome','Fome'],['cansaco','Cansaço']]){
   const linha=node('div','','linha-check');linha.append(node('label',`${titulo}:`));
   const marcadores=node('div','','caveiras-box');
   const marcasOriginais=v.tipo==='npc'?npc.condicoes?.[campo]:(p.marcadores?.[campo]??p[campo]);
   const inicial=v.marcas?.[campo]??(Array.isArray(marcasOriginais)?marcasOriginais.filter(Boolean).length:marcasOriginais)??0;
   const valor=()=>Math.min(3,num(v.marcas?.[campo]??inicial));
   for(let i=1;i<=3;i++){
    const check=node('input','','check-caveira');check.type='checkbox';check.dataset.grupo=campo;check.checked=i<=valor();check.setAttribute('aria-label',`${titulo} ${i}`);
    check.onchange=()=>{v.marcas||={};v.marcas[campo]=check.checked?Math.max(valor(),i):Math.min(valor(),i-1);salvar();detalhe();};
    marcadores.append(check);
   }
   linha.append(marcadores);grupoMarcas.append(linha);
  }
  marcas.append(grupoMarcas);
  painel.append(marcas);
  const recursos=secao('Suprimentos','vg-ficha-suprimentos');
  for(const [campo,titulo] of [['comida','Comida'],['agua','Água']]){
   const linha=node('div','','vg-ficha-recurso'),controles=node('div','','vg-controles');
   const menos=node('button','−'),mais=node('button','+'),valor=node('input','','vg-recurso-valor');
   menos.type=mais.type='button';valor.type='number';valor.min='0';valor.step='1';
   valor.inputMode='numeric';valor.setAttribute('aria-label',`Quantidade de ${titulo.toLowerCase()}`);
   valor.value=String(Math.max(0,Math.ceil(num(v.recursos?.[campo]))));
   const atualizar=(n)=>{v.recursos||={};v.recursos[campo]=Math.max(0,Math.ceil(Number.isFinite(n)?n:0));valor.value=String(v.recursos[campo]);salvar();};
   for(const [b,d] of [[menos,-1],[mais,1]])b.onclick=()=>atualizar(Number(valor.value||0)+d);
   valor.onchange=()=>atualizar(Number(valor.value));
   controles.append(menos,valor,mais);linha.append(node('span',titulo),controles);recursos.append(linha);
  }
  painel.append(recursos);area.append(painel);
  const inventario=secao('Inventário','vg-ficha-inventario');
  const origem=v.tipo==='npc'?(npc.itens||npc.inventario?.itens||[]):(ficha.inventario?.itens||[]);
  const itens=Array.isArray(origem)?origem:[];
  const rolagem=node('div','','tabela-itens-rolagem');
  const tabela=node('table','','tabela-itens');const thead=node('thead'),cab=node('tr');
  for(const titulo of ['Local','Item','Qtd.','Tam.','Descrição'])cab.append(node('th',titulo));
  thead.append(cab);tabela.append(thead);
  const tbody=node('tbody');
  if(!itens.length){const tr=node('tr'),td=node('td',v.tipo==='jogador'&&!cache.has(v.id)?'Carregando inventário…':'Sem itens cadastrados.');td.colSpan=5;tr.append(td);tbody.append(tr);}
  for(const item of itens.slice(0,200)){
   const tr=node('tr');
   for(const valor of [(item.local==='jogador'||item.local==='personagem'?'Personagem':item.local==='montaria'?'Montaria':item.local||item.localizacao||'Não definido'),item.nome||'Item',fmt(item.quantidade??1),fmt(item.tamanho??item.tam??0),item.descricao||'—'])tr.append(node('td',String(valor)));
   tbody.append(tr);
  }
  tabela.append(tbody);rolagem.append(tabela);inventario.append(rolagem);
  area.append(inventario);
 }
 function iniciarEventos(){
  $('vg-criar').onclick=()=>modal('Criar viagem','Distância total (km)','', 'number',(valor,nome)=>{
   const titulo=nome.trim();if(!titulo)return false;
   const primeiro=grupoNovo('Grupo 1');
   const v={id:idNovo(),nome:titulo.slice(0,80),total:num(valor),grupos:[primeiro],ativo:primeiro.id};
   dados.viagens.push(v);dados.ativa=v.id;selecionado='';salvar();render();
  },{nome:`Viagem ${dados.viagens.length+1}`});
  $('vg-editar').onclick=()=>{
   const v=viagem();if(!v)return;
   modal('Modificar viagem','Distância total (km)',v.total||'','number',(valor,nome)=>{
    if(!nome.trim())return false;
    v.nome=nome.trim().slice(0,80);v.total=num(valor);salvar();render();
   },{nome:v.nome,excluir:true});
  };
  $('vg-excluir-viagem').onclick=()=>{
   const v=viagem();if(!v)return;
   if(!confirm(`Excluir a viagem "${v.nome}" e todos os seus grupos, viajantes e progressos? As demais viagens serão preservadas.`))return;
   dados.viagens=dados.viagens.filter(item=>item.id!==v.id);
   dados.ativa=dados.viagens[0]?.id||null;
   selecionado='';salvar();$('vg-dialog').close();render();
  };
  $('vg-adicionar-grupo').onclick=()=>{
   const v=viagem();if(!v)return;
   modal('Adicionar grupo','Nome do grupo',`Grupo ${v.grupos.length+1}`,'text',valor=>{
    if(!valor.trim())return false;
    const g=grupoNovo(valor.trim().slice(0,80));v.grupos.push(g);v.ativo=g.id;
    selecionado='';salvar();render();
   });
  };
  $('vg-excluir-grupo').onclick=()=>{
   const v=viagem(),g=grupo();if(!v||!g||!confirm(`Excluir ${g.nome} e seu progresso nesta viagem?`))return;
   v.grupos=v.grupos.filter(item=>item.id!==g.id);v.ativo=v.grupos[0]?.id||null;
   selecionado='';salvar();render();
  };
  $('vg-viagem').onchange=e=>{dados.ativa=e.target.value;selecionado='';salvar();render();};
  $('vg-grupo').onchange=e=>{const v=viagem();if(!v)return;v.ativo=e.target.value;selecionado='';salvar();render();};
  for(const [id,campo] of [['vg-ritmo','ritmo'],['vg-busca','busca']])$(id).onchange=e=>{
   const g=grupo();if(g){g[campo]=e.target.value;salvar();render();}
  };
  $('vg-descansar').onclick=()=>{const g=grupo();if(g){g.desde=0;salvar();render();}};
  $('vg-viajar').onclick=()=>{
   const v=viagem(),g=grupo();if(!v||!g)return;
   const limite=limiteDescanso(g);
   const restanteDescanso=limite===null?Infinity:Math.max(0,limite-num(g.desde));
   const d=Math.min(velocidade(g),Math.max(0,num(v.total)-num(g.percorrido)),restanteDescanso);
   if(!d)return;g.percorrido=num(g.percorrido)+num(d);g.desde=num(g.desde)+num(d);salvar();render();
  };
  let viajanteEscolhido='',viajanteEditando=null;
  const desenharDisponiveis=()=>{
   const lista=$('vg-disponiveis'),busca=$('vg-busca-viajante').value.trim().toLocaleLowerCase('pt-BR');
   const candidatos=disponiveis().filter(v=>!grupo()?.viajantes.some(x=>x.id===v.id));
   lista.replaceChildren();
   for(const v of candidatos.filter(v=>`${v.nome} ${v.responsavel}`.toLocaleLowerCase('pt-BR').includes(busca))){
    const b=node('button','','vg-opcao-viajante'+(viajanteEscolhido===v.id?' selecionado':''));
    b.type='button';b.setAttribute('aria-pressed',String(viajanteEscolhido===v.id));
    b.append(node('strong',v.nome),node('small',v.responsavel));
    b.onclick=()=>{viajanteEscolhido=v.id;$('vg-escolhido').textContent=`Selecionado: ${v.nome} (${v.responsavel})`;$('vg-confirmar-viajante').disabled=false;desenharDisponiveis();};
    lista.append(b);
   }
   if(!lista.children.length)lista.append(node('p',candidatos.length?'Nenhum personagem encontrado.':'Nenhum personagem ou NPC disponível.','vg-vazio'));
  };
  async function carregarNomesJogadores(){
   if(!estado.repositorio?.obterFicha||!estado.campanhaId)return;
   const campanha=estado.campanhaId;
   const pendentes=disponiveis().filter(v=>v.tipo==='jogador'&&!nomesJogadores.has(v.ref));
   await Promise.all(pendentes.map(async v=>{try{const ficha=await estado.repositorio.obterFicha(campanha,v.ref);if(estado.campanhaId===campanha){cache.set(v.id,ficha);const nome=ficha?.dados?.nome?.trim();if(nome)nomesJogadores.set(v.ref,nome);}}catch{}}));
   if(estado.campanhaId===campanha&&$('vg-dialog-viajante').open)desenharDisponiveis();
  }
  $('vg-busca-viajante').oninput=desenharDisponiveis;
  for(const id of ['vg-km','vg-km-descanso']){
   $(id).addEventListener('change',()=>{const v=Number($(id).value);if(Number.isFinite(v)&&v>0)$(id).value=String(num(v));});
  }
  const abrirModalViajante=(alvo=null)=>{
   viajanteEditando=alvo?.id||null;
   viajanteEscolhido=alvo?.id||'';
   $('vg-busca-viajante').value='';
   $('vg-viajante-titulo').textContent=alvo?'Editar viajante':'Adicionar viajante';
   $('vg-busca-viajante').closest('label').hidden=!!alvo;
   $('vg-disponiveis').hidden=!!alvo;
   $('vg-escolhido').textContent=alvo?`Editando: ${alvo.nome} (${alvo.responsavel})`:'Selecione um personagem na lista.';
   $('vg-confirmar-viajante').textContent=alvo?'Salvar alterações':'Adicionar viajante';
   $('vg-confirmar-viajante').dataset.acao=alvo?'editar':'adicionar';
   $('vg-confirmar-viajante').disabled=!alvo;
   $('vg-montaria').value=alvo?.montaria||'';
   $('vg-km').value=alvo?.km??'30';
   $('vg-km-descanso').value=alvo?.kmDescanso??'';
   if(!alvo)desenharDisponiveis();
   $('vg-dialog-viajante').showModal();
   (alvo?$('vg-km-descanso'):$('vg-busca-viajante')).focus();
   if(!alvo)void carregarNomesJogadores();
  };
  abrirEdicaoViajante=abrirModalViajante;
  $('vg-adicionar').onclick=()=>abrirModalViajante();
  $('vg-form-viajante').onsubmit=e=>{
   e.preventDefault();
   const g=grupo();if(!g)return;
   const kmRaw=Number($('vg-km').value),descansoRaw=Number($('vg-km-descanso').value);
   if(!Number.isFinite(kmRaw)||kmRaw<=0||!Number.isFinite(descansoRaw)||descansoRaw<=0)return;
   const km=num(kmRaw),kmDescanso=num(descansoRaw);
   let v;
   if(viajanteEditando){
    v=g.viajantes.find(x=>x.id===viajanteEditando);
    if(!v)return;
    Object.assign(v,{montaria:$('vg-montaria').value.trim().slice(0,100),km,kmDescanso});
   }else{
    const origem=disponiveis().find(x=>x.id===viajanteEscolhido);
    if(!origem||g.viajantes.some(x=>x.id===origem.id))return;
    v={...origem,montaria:$('vg-montaria').value.trim().slice(0,100),km,kmDescanso,marcas:{},recursos:{comida:0,agua:0}};
    g.viajantes.push(v);
   }
   selecionado=v.id;salvar();$('vg-dialog-viajante').close();render();void buscarFicha(v);
  };
  $('vg-cancelar').onclick=()=>$('vg-dialog').close();$('vg-cancelar-viajante').onclick=()=>$('vg-dialog-viajante').close();
  $('vg-form').onsubmit=e=>{e.preventDefault();const c=$('vg-campo'),nome=$('vg-nome');if(!c.reportValidity()||(c.type==='number'&&!(Number(c.value)>0)))return;if(!nome.disabled&&(!nome.reportValidity()||!nome.value.trim()))return;if(acao?.(c.value,nome.disabled?'':nome.value)!==false)$('vg-dialog').close();};
 }
 return {atualizar,iniciarEventos};
}
