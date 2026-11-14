# Agendei — PWA Checklist

App de checklist (uma única lista) feito como PWA estático e publicado no GitHub Pages em https://mhenriquers.github.io/Agendei/ (repo `github.com/mhenriquers/Agendei`, branch `main`, pasta raiz).

## Para quem é o app

- O app é feito para uma mulher (a Thaynara, que aparece na saudação "Olá Thaynara!").
- Ele precisa parecer profissional, mas tem que ser **a cara dela**: ela gosta do Bob Esponja.
- Toda decisão de visual (cores, ícones, animações, textos) deve combinar com isso: delicado, alegre e organizado, sem ficar infantil nem destoar do universo do Bob Esponja.

## Como trabalhar neste repo

- As tarefas estão em `task.md`, que contém **só tarefas**. Contexto, regras e especificação ficam aqui no `claude.md`.
- Siga a ordem das tarefas e marque `[x]` em cada uma concluída. Tarefas concluídas são removidas do `task.md` (o histórico fica no git).
- Tarefa grande é escrita no `task.md` destrinchada em passos triviais (onde colar, código completo, o que conferir, como testar), no estilo que a T1 (aviso de nova versão) teve.
- **Ao terminar cada funcionalidade importante, faça commit e push** (um commit por funcionalidade). Mensagens de commit em português.
- Quando o usuário pedir para "deixar as perguntas para depois", decida pelo mais sensato, siga em frente e registre a decisão aqui.
- Em caso de dúvida, a seção "Especificação" abaixo vale como referência.

## Regras que não podem ser quebradas

- HTML, CSS e JS puros. Sem build, sem npm no projeto, sem framework, sem dependências externas.
- **Todos os caminhos relativos** (`./arquivo`). Nada começando com `/`: o Pages serve em `usuario.github.io/Agendei/`, e caminho absoluto dá 404. Vale para `<link>`, `<script>`, `start_url`, `scope`, registro do SW e lista de cache do SW.
- Ícones do app são PNG reais em `icons/`, nada de data URI. (Imagens enviadas pelo usuário no painel Personalizar são guardadas como data URL no `localStorage`; isso não vale como ícone do app.)
- Persistência só em `localStorage`, com duas chaves: `checklist.items.v1` (itens) e `checklist.settings.v1` (preferências do painel Personalizar).
- Fora do escopo: login, backend, notificações push, múltiplas listas.
- Texto digitado pelo usuário entra na página só via `textContent`, nunca `innerHTML`.
- **Ao alterar qualquer arquivo servido, incremente `CACHE_NAME` em `sw.js`** e mantenha a lista `ASSETS` igual aos arquivos reais (se um arquivo da lista não existir, o SW não instala).

## Estrutura

```
/
├── index.html             estrutura da página (lista, faixa de atualização, painel Personalizar)
├── styles.css             visual (responsivo; tokens de cor em :root)
├── settings.js            painel Personalizar: foto do perfil e plano de fundo
├── app.js                 itens (estado, renderização, eventos, persistência), fogos ao concluir e aviso de atualização
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

`logo.jpeg` (foto antiga, preto e branco) e `icons/icon-2.png` (foto atual, colorida) são fotos de origem para gerar os ícones. Elas estão no repo, mas não são usadas pelo app nem entram no cache do SW.

## Especificação

1. **Nome do repo e do app**: `Agendei`. `start_url: "./"` e `scope: "./"`, sem `id` no manifest (ver "Notas técnicas"), então o manifest funciona com qualquer nome de repo.
2. **Funcionalidades**: adicionar item, marcar/desmarcar como feito (com fogos de artifício ao concluir), editar (texto, urgência e prazo), excluir item, limpar concluídos, contador de pendentes, estado vazio, aviso "vence hoje". Uma única lista. Painel Personalizar (foto do perfil e plano de fundo). Aviso de nova versão.
3. **Regras de negócio**:
   - Texto obrigatório após `trim()`; espaços internos repetidos viram um só.
   - Máximo de 200 caracteres (`maxlength` no input + corte no JS).
   - Itens duplicados são permitidos.
   - Adicionar é só o texto (urgência Normal, sem prazo); urgência e prazo são definidos no painel "Editar tarefa".
   - Ordem: ver "Urgência e prazo".
   - Excluir um item é direto, sem confirmação. "Limpar concluídos" pede `confirm()` porque apaga vários.
   - Na edição, texto vazio mantém o texto anterior (não exclui).
4. **Modelo do item**: `{ id: string, text: string, done: boolean, createdAt: number, doneAt: number | null, priority: "low" | "normal" | "high", dueDate: "AAAA-MM-DD" | null, dueTime: "HH:MM" | null }`. No storage, salvo como array JSON em `checklist.items.v1`. Datas e horas são do fuso do aparelho. `dueTime` só existe com `dueDate`. O `load()` valida cada item e descarta campos desconhecidos (`cleanItem` em `app.js`): itens antigos sem `priority`/`dueDate`/`dueTime`, ou com valores inválidos, ficam Normal e sem prazo. Ao acrescentar campos novos, atualize a validação e o mapeamento.
5. **Modelo das preferências**: `{ bgType: "default" | "color" | "photo", bgColor: "#rrggbb", bgPhoto: dataURL | null, bgBlur: 0–20, avatar: dataURL | null }`, salvo como JSON em `checklist.settings.v1`. Valor inválido ou corrompido volta para o padrão.
6. **Idioma**: português (pt-BR).
7. **Visual — paleta "Areia e coral"** (escolhida pelo usuário depois de achar o preto e branco "sem graça"): tema único e claro, sem variação claro/escuro do sistema. Tokens em `:root` no `styles.css`:
   - fundo `#fbf6ee` (off-white quente), superfícies `#ffffff`, superfície suave `#f6efe4`, texto `#3d3431`, texto secundário `#6f645e`, borda de card `#e6dacb`, borda de campo `#9c8d7c`;
   - botão principal coral `#c0503b` com texto branco (o coral original `#e2725b` não tem contraste AA com texto branco e virou cor de detalhe: aro do avatar e seleção); amarelo-manteiga `#f5d565` / `#fff3c9` para destaques;
   - urgência alta `#d6564b` (etiqueta `#fbe3df`/`#a63a31`), "Atrasada" `#b23b30` com texto branco, urgência baixa `#7fb3cf` (etiqueta `#e3f0f7`/`#356a86`).
   - O `theme_color`, o `background_color` do manifest e o `meta theme-color` são `#fbf6ee`. O contorno de foco é escuro (`#3d3431`) com um anel branco por dentro, para aparecer em qualquer fundo.
8. **Concluir item**: o check marcado é verde (`--check: #2f7d57`, escuro o bastante para o navegador desenhar o ✓ branco). Ao marcar (clique ou Espaço), saem fogos de artifício pequenos do ponto onde estava o check: 3 explosões seguidas (0, 140 e 280 ms), cada uma com um clarão amarelo-manteiga e 10 faíscas coloridas (verde, mostarda, rosa, azul, coral e lilás; nada de branco, que some no fundo claro) com raio de 12–17 px (perto do tamanho da caixa de 22 px). Elas ficam em posição fixa na tela porque o item concluído desce na lista logo em seguida; lá, o check dá um "pulo" (classe `.just-done`). Desmarcar não solta fogos, e com `prefers-reduced-motion` não há fogos.

## Urgência e prazo

Decidido com o usuário (as decisões marcadas com * foram tomadas sem perguntar, a pedido dele, e podem ser revistas):

- **Urgência:** 3 níveis, Baixa, Normal (padrão) e Alta. No card: faixa colorida na lateral (Alta coral-vermelho, Baixa azul; Normal sem faixa) e etiqueta "Alta"/"Baixa" quando é a urgência escolhida.
- **Prazo:** data e hora; a hora é opcional*. Sem hora, o prazo vale até o fim do dia. Hora sem data vale para hoje*.
- **Etiqueta de prazo:** se o prazo é **hoje**, mostra só a hora ("14:30", ou "Hoje" sem hora); se é **outro dia**, mostra só a data ("Sex, 21/11", com o ano quando não é o ano atual)*; vencido mostra "Atrasada · 14:30" (hoje) ou "Atrasada · Ter, 17/11" (dia anterior), em vermelho. Item concluído mostra a etiqueta neutra.
- **Urgência efetiva:** pendente com prazo hoje ou vencido vira **Alta** automaticamente (faixa e ordem). A urgência escolhida (`priority`) não muda: se o prazo for para outro dia, o card volta a ela.
- **Ordem dos pendentes:** urgência efetiva (Alta → Normal → Baixa); no mesmo nível, prazo mais próximo primeiro (atrasadas no topo), sem prazo por último; empate pelo mais novo. Concluídos embaixo, mais recentemente concluídos primeiro. "Filtrar por urgência" é só essa ordem; não há botões de filtro*.
- **Aviso "vence hoje":** faixa amarela abaixo do cabeçalho com "N tarefas vencem hoje", contando só pendentes com prazo para hoje (vencidas de dias anteriores não contam). Tocar leva até a primeira delas (rola, destaca o card e foca o check); o "×" esconde até o app abrir ou voltar para a tela (`visibilitychange`). Sem servidor, não há aviso com o app fechado; sem número no ícone (descartado pelo usuário).
- **Relógio com o app aberto:** a cada 30 s o app compara um resumo dos estados de prazo (`clockSignature`) e só redesenha a lista se algo mudou (virada do dia, hora do prazo passando). O render devolve o foco ao mesmo controle; com o painel de edição aberto, espera.
- **Painel "Editar tarefa"** (lápis do card; `<dialog id="editor">`): texto, urgência (rádios), data, hora e botão "Sem prazo". Enter no texto salva, Esc ou "Cancelar" fecham sem salvar, e o foco volta ao lápis do card.

## Painel Personalizar (`settings.js`)

Aberto pelo botão de engrenagem no topo. As mudanças valem na hora e são salvas em `checklist.settings.v1`.

- **Foto do perfil:** a imagem enviada é recortada em quadrado (puxado para cima, onde costuma estar o rosto), reduzida para 192 px e salva em JPEG. Ela aparece como avatar redondo no topo e como ícone da aba do navegador. **O ícone do app instalado não muda** (ver "Limite do PWA").
- **Plano de fundo:**
  - *Padrão:* `#fbf6ee`.
  - *Cor sólida:* 6 cores prontas da paleta (areia, rosa, amarelo-manteiga, azul-céu, menta e chocolate) ou qualquer cor pelo seletor. Se a cor for escura (luminância ≤ 0,3), o `<html>` ganha a classe `bg-dark`: o texto sobre o fundo fica claro. O `meta theme-color` acompanha a cor.
  - *Foto:* a imagem é reduzida para no máximo 1600 px e salva em JPEG. Fica numa camada fixa atrás do conteúdo (`#app-bg`), escurecida em 35%, com desfoque de 0 a 20 px. Com foto, o `<html>` também ganha `bg-dark` e o `meta theme-color` vira `#3d3431`.
- **Seus dados (exportar/importar):** é como levar a lista de um aparelho para outro sem servidor. "Exportar lista" gera `agendei-lista-AAAA-MM-DD.json` (`{ app: "agendei", version: 1, exportedAt, items }`, só os itens, sem as preferências): no celular (`pointer: coarse` + `navigator.canShare` com arquivos) abre o compartilhamento do sistema; no computador, baixa o arquivo. "Importar lista" aceita esse formato ou um array de itens, valida cada item como o `load()`, pede `confirm()` dizendo quantas tarefas são novas e quantas serão atualizadas, e **soma** à lista: mesmo `id` atualiza, `id` novo entra, nada é apagado. O resultado aparece em `#data-status`. Código em `app.js` (os botões ficam no painel Personalizar).
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
- `icon-maskable-512.png` (`purpose: maskable`): o Android recorta esse ícone em círculo, squircle etc. Só a área central (círculo de 80%) é garantida. Por isso ele tem a foto em círculo de 80% sobre um fundo sólido (hoje `#afaeb1`, a cor do fundo da foto). Só pôr margem na foto quadrada não serve: a máscara redonda mostraria um quadrado dentro do círculo.

Os ícones atuais vêm de `icons/icon-2.png` (foto vertical 864×1536), com um recorte quadrado de 680 px centrado no rosto (x=12, y=310). São gerados por um script PowerShell temporário com `System.Drawing` (vem no Windows), guardado fora do repo. Só os PNG entram no repo.

**Limite do PWA:** o ícone instalado vem do manifest, que é um arquivo fixo publicado no site. O app não consegue trocar o ícone da tela inicial depois de instalado, nem oferecer uma escolha de ícone antes da instalação (manifest gerado por JS não é confiável no Chrome/Safari). Uma foto escolhida pelo usuário só pode aparecer dentro do app (avatar e ícone da aba).

## Notas técnicas

- **Dados ficam só no aparelho:** cada navegador/aparelho tem a sua lista; não há sincronização entre PC e celular. Para levar a lista, use exportar/importar (painel Personalizar). Sincronizar de verdade exigiria servidor e login (fora do escopo). No iPhone, o app instalado e o Safari também têm dados separados.
- **`id` do manifest:** o navegador resolve o `id` a partir da raiz do domínio, não da pasta do app. Com `"id": "./"`, o ID virava `https://mhenriquers.github.io/` e podia se confundir com outro PWA publicado no mesmo usuário. Por isso o manifest **não tem `id`**: o ID é o `start_url` (`https://mhenriquers.github.io/Agendei/`). Trocar o ID faz o navegador tratar o app como outro: quem já instalou precisa desinstalar e instalar de novo.
- **Capturas de tela:** o manifest declara `screenshots/wide.png` (`form_factor: "wide"`) e `screenshots/narrow.png`, para o Chrome mostrar a janela de instalação com imagens. Elas também estão no `ASSETS` do SW. Se o visual mudar, regerar.
- **Notificações com o app fechado** não são viáveis sem servidor (as APIs de agendamento local foram abandonadas ou não são confiáveis). Avisos acontecem quando o app é aberto.

## Publicação (GitHub Pages)

- Settings → Pages → Source: **Deploy from a branch**, `main`, `/ (root)`. Já esteve como "GitHub Actions" sem workflow, o que deixava o site em 404: não voltar para Actions sem criar um workflow.
- Depois do push, o build leva cerca de 1 minuto. Para confirmar: `curl -s "https://mhenriquers.github.io/Agendei/sw.js?r=$RANDOM" | grep CACHE_NAME` deve mostrar a versão nova; `gh api repos/mhenriquers/Agendei/pages/builds/latest` mostra o status.

## Testar

Service worker não funciona em `file://`. Sirva por HTTP:

```
npx --yes http-server -c-1 -p 8000
```

Para simular o GitHub Pages (subpasta), rode o mesmo comando em `c:/dev` e abra `http://localhost:8000/Agendei/`. Para simular também o cache do Pages, use `-c600` no lugar de `-c-1`. O npx serve só para testar, nada entra no repo.

**Testes automatizados (fora do repo):** dá para dirigir o Edge sem janela pelo DevTools Protocol com um script Node (Node 24 tem `fetch` e `WebSocket` globais, sem instalar nada), guardado na pasta temporária. Cuidados aprendidos:
- `msedge --headless --screenshot` não renderiza larguras menores que ~500 px e fecha antes do SW verificar atualizações. Para larguras de celular e para testar o SW, use o protocolo (`Emulation.setDeviceMetricsOverride`, `Page.captureScreenshot`).
- Para testar atualização, sirva uma **cópia** do app com `-c600`, altere a cópia (`CACHE_NAME` e um texto visível) e recarregue.
- `DOM.setFileInputFiles` simula a escolha de arquivos no painel Personalizar.

## Ambiente de desenvolvimento

- Windows 11, com Git Bash e PowerShell 5.1. Node 24 instalado (só para testar). **Python não está instalado.** `gh` (GitHub CLI) está autenticado no repo.
- Edge em `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.
- Imagens (ícones, recortes) são geradas com PowerShell + `System.Drawing`.
- Arquivos longos com aspas e acentos: prefira escrevê-los com a ferramenta de escrita de arquivos em vez de heredoc no bash (o heredoc falhou mais de uma vez).
