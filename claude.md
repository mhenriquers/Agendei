# Agendei — PWA Checklist

App de checklist (uma única lista) feito como PWA estático e publicado no GitHub Pages em https://mhenriquers.github.io/Agendei/ (repo `github.com/mhenriquers/Agendei`, branch `main`, pasta raiz).

## Como trabalhar neste repo

- As tarefas estão em `task.md`, que contém **só tarefas**. Contexto, regras e especificação ficam aqui no `claude.md`.
- Siga a ordem das tarefas e marque `[x]` em cada uma concluída. Tarefas concluídas são removidas do `task.md` (o histórico fica no git).
- Em caso de dúvida, a seção "Especificação" abaixo vale como referência.

## Regras que não podem ser quebradas

- HTML, CSS e JS puros. Sem build, sem npm no projeto, sem framework, sem dependências externas.
- **Todos os caminhos relativos** (`./arquivo`). Nada começando com `/`: o Pages serve em `usuario.github.io/Agendei/`, e caminho absoluto dá 404. Vale para `<link>`, `<script>`, `start_url`, `scope`, registro do SW e lista de cache do SW.
- Ícones do app são PNG reais em `icons/`, nada de data URI. (Imagens enviadas pelo usuário no painel Personalizar são guardadas como data URL no `localStorage`; isso não vale como ícone do app.)
- Persistência só em `localStorage`, com duas chaves: `checklist.items.v1` (itens) e `checklist.settings.v1` (preferências do painel Personalizar).
- Fora do escopo: login, backend, notificações, múltiplas listas.
- Texto digitado pelo usuário entra na página só via `textContent`, nunca `innerHTML`.
- **Ao alterar qualquer arquivo servido, incremente `CACHE_NAME` em `sw.js`** e mantenha a lista `ASSETS` igual aos arquivos reais.

## Estrutura

```
/
├── index.html             estrutura da página (lista, faixa de atualização, painel Personalizar)
├── styles.css             visual (monocromático escuro, responsivo)
├── settings.js            painel Personalizar: foto do perfil e plano de fundo
├── app.js                 itens (estado, renderização, eventos, persistência) e aviso de atualização
├── manifest.webmanifest   dados de instalação do PWA
├── sw.js                  service worker (cache offline)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── screenshots/
│   ├── wide.png           captura de PC (1280×800) para a janela de instalação
│   └── narrow.png         captura de celular (540×960)
├── .nojekyll              impede o Pages de processar o site com Jekyll
└── README.md
```

`logo.jpeg` (foto antiga) e `icons/icon-2.png` (foto atual) são fotos de origem para gerar os ícones. Elas não são usadas pelo app nem entram no cache do SW. A `icon-2.png` fica fora do git.

## Especificação

1. **Nome do repo e do app**: `Agendei`. `start_url: "./"` e `scope: "./"`, sem `id` no manifest (ver "Notas técnicas"), então o manifest funciona com qualquer nome de repo.
2. **Funcionalidades**: adicionar item, marcar/desmarcar como feito, editar texto, excluir item, limpar concluídos, contador de pendentes, estado vazio. Uma única lista. Painel Personalizar (foto do perfil e plano de fundo). Aviso de nova versão.
3. **Regras de negócio**:
   - Texto obrigatório após `trim()`; espaços internos repetidos viram um só.
   - Máximo de 200 caracteres (`maxlength` no input + corte no JS).
   - Itens duplicados são permitidos.
   - Ordem: pendentes primeiro (mais novos no topo), concluídos depois (mais recentemente concluídos no topo).
   - Excluir um item é direto, sem confirmação. "Limpar concluídos" pede `confirm()` porque apaga vários.
   - Editar para texto vazio cancela a edição (não exclui).
4. **Modelo do item**: `{ id: string, text: string, done: boolean, createdAt: number, doneAt: number | null }`. No storage, salvo como array JSON em `checklist.items.v1`.
5. **Modelo das preferências**: `{ bgType: "default" | "color" | "photo", bgColor: "#rrggbb", bgPhoto: dataURL | null, bgBlur: 0–20, avatar: dataURL | null }`, salvo como JSON em `checklist.settings.v1`. Valor inválido ou corrompido volta para o padrão.
6. **Idioma**: português (pt-BR).
7. **Visual**: tema único, monocromático (preto e branco), sem variação claro/escuro do sistema. Fundo padrão `#262626` (um pouco mais escuro que grafite), superfícies `#333333`, texto e botão principal `#f5f5f5`, texto secundário `#a3a3a3`, bordas `#737373`. O `theme_color` e o `background_color` do manifest e o `meta theme-color` são `#262626`. O contorno de foco é branco com um anel preto por dentro, para aparecer em qualquer fundo.

## Painel Personalizar (`settings.js`)

Aberto pelo botão de engrenagem no topo. As mudanças valem na hora e são salvas em `checklist.settings.v1`.

- **Foto do perfil:** a imagem enviada é recortada em quadrado (puxado para cima, onde costuma estar o rosto), reduzida para 192 px e salva em JPEG. Ela aparece como avatar redondo no topo e como ícone da aba do navegador. **O ícone do app instalado não muda** (ver "Limite do PWA").
- **Plano de fundo:**
  - *Padrão:* `#262626`.
  - *Cor sólida:* 6 cores prontas (preto a branco) ou qualquer cor pelo seletor. Se a cor for clara (luminância > 0,3), o `<html>` ganha a classe `bg-light`: o texto sobre o fundo fica escuro e o botão "Adicionar" fica preto. O `meta theme-color` acompanha a cor.
  - *Foto:* a imagem é reduzida para no máximo 1600 px e salva em JPEG. Fica numa camada fixa atrás do conteúdo (`#app-bg`), escurecida em 35%, com desfoque de 0 a 20 px.
- Se a imagem não couber no `localStorage`, o app avisa e mantém a preferência anterior.
- Cores do que fica direto sobre o fundo (título, contador, estado vazio, rodapé) usam as variáveis `--on-bg`, `--on-bg-muted` e `--on-bg-border`.

## Aviso de nova versão

- O SW novo instala em segundo plano e **espera** (não chama `skipWaiting` sozinho). O `app.js` vê o SW esperando e mostra a faixa "Nova versão disponível" com o botão **Atualizar**. O botão manda `SKIP_WAITING` ao SW; quando ele assume (`controllerchange`), a página recarrega.
- Só recarrega se o usuário tocou em Atualizar (na primeira visita o `clients.claim()` também dispara `controllerchange`).
- A faixa só aparece se já existe um SW controlando a página (senão seria a primeira instalação).
- O registro usa `updateViaCache: "none"` e o install busca os arquivos com `cache: "reload"`. O GitHub Pages manda `Cache-Control: max-age=600`, e sem isso o navegador usava cópias velhas do `sw.js` e dos arquivos (um teste com o Edge mostrou o app preso na versão antiga por causa disso).
- O app procura versão nova ao abrir e sempre que volta para a tela (`visibilitychange`). Offline, a verificação falha em silêncio.
- Sem notificação push (fora do escopo): com o app fechado não há aviso.

## Ícones

São três arquivos porque cada um é usado num lugar diferente:

- `icon-192.png`: ícone pequeno (aba do navegador, `apple-touch-icon` do iPhone, atalhos).
- `icon-512.png` (`purpose: any`): ícone grande, usado na instalação e na tela de abertura.
- `icon-maskable-512.png` (`purpose: maskable`): o Android recorta esse ícone em círculo, squircle etc. Só a área central (círculo de 80%) é garantida. Por isso ele tem a foto em círculo de 80% sobre um fundo sólido (hoje `#afaeb1`, a cor do fundo da foto).

Os ícones atuais vêm de `icons/icon-2.png` (foto vertical 864×1536), com um recorte quadrado de 680 px centrado no rosto (x=12, y=310). São gerados por um script PowerShell temporário com `System.Drawing` (vem no Windows), guardado fora do repo. Só os PNG entram no repo.

**Limite do PWA:** o ícone instalado vem do manifest, que é um arquivo fixo publicado no site. O app não consegue trocar o ícone da tela inicial depois de instalado. Uma foto enviada pelo usuário só pode aparecer dentro do app (avatar e ícone da aba).

## Notas técnicas

- **`id` do manifest:** o navegador resolve o `id` a partir da raiz do domínio, não da pasta do app. Com `"id": "./"`, o ID virava `https://mhenriquers.github.io/` e podia se confundir com outro PWA publicado no mesmo usuário. Por isso o manifest **não tem `id`**: o ID é o `start_url` (`https://mhenriquers.github.io/Agendei/`). Trocar o ID faz o navegador tratar o app como outro: quem já instalou precisa desinstalar e instalar de novo.
- **Capturas de tela:** o manifest declara `screenshots/wide.png` (`form_factor: "wide"`) e `screenshots/narrow.png`, para o Chrome mostrar a janela de instalação com imagens. Elas também estão no `ASSETS` do SW.
- **iPhone:** os dados do app instalado ficam separados dos dados do Safari.

## Testar

Service worker não funciona em `file://`. Sirva por HTTP:

```
npx --yes http-server -c-1 -p 8000
```

Para simular o GitHub Pages (subpasta), rode o mesmo comando em `c:/dev` e abra `http://localhost:8000/Agendei/`. Para simular também o cache do Pages, use `-c600` no lugar de `-c-1`. O npx serve só para testar, nada entra no repo.
