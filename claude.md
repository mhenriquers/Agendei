# Agendei — PWA Checklist

App de checklist (uma única lista) feito como PWA estático e publicado no GitHub Pages em https://mhenriquers.github.io/Agendei/ (repo `github.com/mhenriquers/Agendei`, branch `main`, pasta raiz).

## Como trabalhar neste repo

- As tarefas estão em `task.md`, que contém **só tarefas**. Contexto, regras e especificação ficam aqui no `claude.md`.
- Siga a ordem das tarefas e marque `[x]` em cada uma concluída.
- Em caso de dúvida, a seção "Especificação" abaixo vale como referência.

## Regras que não podem ser quebradas

- HTML, CSS e JS puros. Sem build, sem npm no projeto, sem framework, sem dependências externas.
- **Todos os caminhos relativos** (`./arquivo`). Nada começando com `/`: o Pages serve em `usuario.github.io/Agendei/`, e caminho absoluto dá 404. Vale para `<link>`, `<script>`, `start_url`, `scope`, registro do SW e lista de cache do SW.
- Ícones são PNG reais em `icons/`, nada de data URI.
- Persistência só em `localStorage`, chave `checklist.items.v1`.
- Fora do escopo: login, backend, notificações, múltiplas listas.
- Texto digitado pelo usuário entra na página só via `textContent`, nunca `innerHTML`.
- **Ao alterar qualquer arquivo servido, incremente `CACHE_NAME` em `sw.js`** e mantenha a lista `ASSETS` igual aos arquivos reais.

## Estrutura

```
/
├── index.html             estrutura da página
├── styles.css             visual (monocromático escuro, responsivo)
├── app.js                 estado, renderização, eventos e persistência
├── manifest.webmanifest   dados de instalação do PWA
├── sw.js                  service worker (cache offline)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── .nojekyll              impede o Pages de processar o site com Jekyll
└── README.md
```

`logo.jpeg` e `icons/icon-2.png` são fotos de origem para gerar os ícones. Elas não são usadas pelo app nem entram no cache do SW.

## Especificação

1. **Nome do repo e do app**: `Agendei`. `start_url: "./"` e `scope: "./"`, então o manifest funciona com qualquer nome de repo.
2. **Funcionalidades**: adicionar item, marcar/desmarcar como feito, editar texto, excluir item, limpar concluídos, contador de pendentes, estado vazio. Uma única lista.
3. **Regras de negócio**:
   - Texto obrigatório após `trim()`; espaços internos repetidos viram um só.
   - Máximo de 200 caracteres (`maxlength` no input + corte no JS).
   - Itens duplicados são permitidos.
   - Ordem: pendentes primeiro (mais novos no topo), concluídos depois (mais recentemente concluídos no topo).
   - Excluir um item é direto, sem confirmação. "Limpar concluídos" pede `confirm()` porque apaga vários.
   - Editar para texto vazio cancela a edição (não exclui).
4. **Modelo do item**: `{ id: string, text: string, done: boolean, createdAt: number, doneAt: number | null }`. No storage, salvo como array JSON em `checklist.items.v1`.
5. **Idioma**: português (pt-BR).
6. **Visual**: tema único, monocromático (preto e branco), sem variação claro/escuro. Fundo `#262626` (um pouco mais escuro que grafite), superfícies `#333333`, texto e botão principal `#f5f5f5`, texto secundário `#a3a3a3`, bordas `#737373`. O `theme_color` e o `background_color` do manifest e o `meta theme-color` são `#262626`.

## Ícones

São três arquivos porque cada um é usado num lugar diferente:

- `icon-192.png`: ícone pequeno (aba do navegador, `apple-touch-icon` do iPhone, atalhos).
- `icon-512.png` (`purpose: any`): ícone grande, usado na instalação e na tela de abertura.
- `icon-maskable-512.png` (`purpose: maskable`): o Android recorta esse ícone em círculo, squircle etc. Só a área central (círculo de 80%) é garantida. Por isso ele tem a foto em círculo de 80% sobre um fundo sólido (hoje `#c0c0c0`, a cor da parede da foto).

Os ícones são gerados por um script PowerShell temporário com `System.Drawing` (vem no Windows), guardado fora do repo. Só os PNG entram no repo.

**Limite do PWA:** o ícone instalado vem do manifest, que é um arquivo fixo publicado no site. O app não consegue trocar o ícone da tela inicial depois de instalado. Uma foto enviada pelo usuário só pode aparecer dentro do app.

## Notas técnicas

- **`id` do manifest:** o navegador resolve o `id` a partir da raiz do domínio, não da pasta do app. Com `"id": "./"`, o ID vira `https://mhenriquers.github.io/` e pode se confundir com outro PWA publicado no mesmo usuário. Sem `id`, o ID passa a ser o `start_url` (`https://mhenriquers.github.io/Agendei/`). Trocar o ID faz o navegador tratar o app como outro: quem já instalou precisa desinstalar e instalar de novo.
- **Atualização:** o SW serve tudo do cache. Uma mudança só chega aos usuários quando o `CACHE_NAME` muda; às vezes é preciso fechar e abrir o app de novo.
- **iPhone:** os dados do app instalado ficam separados dos dados do Safari.

## Testar

Service worker não funciona em `file://`. Sirva por HTTP:

```
npx --yes http-server -c-1 -p 8000
```

Para simular o GitHub Pages (subpasta), rode o mesmo comando em `c:/dev` e abra `http://localhost:8000/Agendei/`. O npx serve só para testar, nada entra no repo.
