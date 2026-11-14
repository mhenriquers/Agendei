# Agendei

**Acesse:** https://mhenriquers.github.io/Agendei/

Checklist simples que funciona offline e pode ser instalado no celular ou no computador (PWA).

- Adicionar, marcar como feito, editar e excluir itens
- "Limpar concluídos" remove de uma vez todos os itens feitos
- Os dados ficam salvos no próprio navegador (`localStorage`, chaves `checklist.items.v1` e `checklist.settings.v1`); não há conta nem servidor
- Funciona sem internet depois do primeiro acesso
- Visual monocromático (preto e branco) com fundo escuro
- Painel **Personalizar** (engrenagem no topo): foto do perfil e plano de fundo (cor sólida ou foto com desfoque)
- Avisa quando há uma versão nova publicada

Feito com HTML, CSS e JavaScript puros, sem build e sem dependências.

## Rodar localmente

O service worker **não funciona abrindo o `index.html` com duplo clique** (`file://`). O app abre, mas não fica offline nem instalável. Sirva a pasta por HTTP com uma destas opções:

```bash
npx --yes http-server -c-1 -p 8000      # Node
python -m http.server 8000              # Python
```

Ou use a extensão **Live Server** do VS Code. Depois abra `http://localhost:8000/`.

Para simular o GitHub Pages, que serve o app numa subpasta, rode o servidor na pasta **acima** do projeto e abra `http://localhost:8000/Agendei/`.

## Publicar no GitHub Pages

1. Faça push para a branch `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Em um ou dois minutos o app fica em `https://<usuario>.github.io/Agendei/`.

Todos os caminhos do projeto são relativos (`./`), então ele funciona em qualquer nome de repositório.

## Atualizar o app depois de publicado

Quem já abriu o app recebe os arquivos do cache do service worker. Ao mudar **qualquer** arquivo (html, css, js, manifest ou ícones):

1. Abra `sw.js` e incremente `CACHE_NAME` (`checklist-v1` → `checklist-v2`).
2. Se criou ou renomeou arquivos, atualize a lista `ASSETS` no mesmo arquivo.
3. Faça commit e push.

Na próxima vez que alguém abrir o app (ou voltar para ele), aparece a faixa "Nova versão disponível". Tocando em **Atualizar**, o app recarrega na versão nova.

## Estrutura

```
index.html             estrutura da página
styles.css             visual (monocromático escuro, responsivo)
settings.js            painel Personalizar (foto do perfil e plano de fundo)
app.js                 itens, persistência e aviso de nova versão
manifest.webmanifest   dados de instalação do PWA
sw.js                  service worker (cache offline)
icons/                 ícones PNG 192, 512 e 512 maskable
screenshots/           capturas usadas na janela de instalação
.nojekyll              impede o GitHub Pages de processar o site com Jekyll
```
