/**
 * Carrega as páginas e os diálogos antes de iniciar os controladores.
 * Os arquivos são locais ao projeto e funcionam em Live Server e GitHub Pages.
 */
const PAGINAS = ['campanhas', 'diario', 'fichas', 'npcs', 'combate', 'viagem', 'utilitarios'];
const DIALOGOS = ['criar-sessao', 'gerenciar-sessoes'];

async function lerVista(caminho) {
    const resposta = await fetch(new URL(caminho, document.baseURI));
    if (!resposta.ok) throw new Error(`Não foi possível carregar ${caminho} (HTTP ${resposta.status}).`);
    return resposta.text();
}

function inserirVistas(idMarcador, htmls) {
    const marcador = document.getElementById(idMarcador);
    if (!marcador) throw new Error(`Ponto de montagem ausente: ${idMarcador}.`);
    const fragmento = document.createDocumentFragment();

    for (const html of htmls) {
        const modelo = document.createElement('template');
        modelo.innerHTML = html; // Arquivos HTML locais e versionados, nunca dados dos usuários.
        fragmento.append(modelo.content);
    }

    marcador.replaceWith(fragmento);
}

export async function carregarInterface() {
    const [paginas, dialogos] = await Promise.all([
        Promise.all(PAGINAS.map((pagina) => lerVista(`views/pages/${pagina}.html`))),
        Promise.all(DIALOGOS.map((dialogo) => lerVista(`views/dialogs/${dialogo}.html`))),
    ]);

    inserirVistas('marcador-paginas', paginas);
    inserirVistas('marcador-dialogos', dialogos);
}
