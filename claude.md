# Agendei — PWA Checklist

App de checklist (uma única lista) feito como PWA estático e publicado no GitHub Pages em https://mhenriquers.github.io/Agendei/ (repo `github.com/mhenriquers/Agendei`, branch `main`, pasta raiz).

## Para quem é o app

- O app é feito para uma mulher (a Thaynara, que aparece na saudação "Olá Thaynara!").
- Ele precisa parecer profissional, mas tem que ser **a cara dela**: ela gosta do Bob Esponja.
- Toda decisão de visual (cores, ícones, animações, textos) deve combinar com isso: delicado, alegre e organizado, sem ficar infantil nem destoar do universo do Bob Esponja.

## Como trabalhar neste repo

- As tarefas estão em `task.md`, que contém **só tarefas**. Contexto, regras e especificação ficam aqui no `claude.md`.
- Siga a ordem das tarefas e marque `[x]` em cada uma concluída. Tarefas concluídas são removidas do `task.md` (o histórico fica no git).
- Tarefa grande é escrita no `task.md` destrinchada em passos triviais (onde colar, código completo, o que conferir, como testar), como foi feito com o aviso de nova versão (ver o histórico do git do `task.md`).
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
├── index.html             estrutura da página (lista, aviso "vence hoje", Bob, faixa de atualização, painéis Editar tarefa e Personalizar)
├── styles.css             visual (responsivo; tokens de cor em :root)
├── settings.js            painel Personalizar: foto do perfil e plano de fundo
├── app.js                 itens (estado, render, eventos, persistência), urgência e prazo, painel Editar tarefa,
│                          fogos ao concluir, exportar/importar, Bob e aviso de atualização
├── manifest.webmanifest   dados de instalação do PWA
├── sw.js                  service worker (cache offline)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── avatars/
│   ├── avatar-1.png       foto de perfil pronta (preto e branco, de logo.jpeg)
│   └── avatar-2.png       foto de perfil pronta (colorida, de icons/icon-2.png)
├── img/
│   ├── bob.webp           Bob Esponja acenando, animado e com fundo transparente (354×360, 51 quadros, 24 por segundo)
│   └── bob-parado.png     primeiro quadro, para quem pede movimento reduzido
├── screenshots/
│   ├── wide.png           captura de PC (1280×800) para a janela de instalação
│   └── narrow.png         captura de celular (540×960)
├── .nojekyll              impede o Pages de processar o site com Jekyll
└── README.md
```

Arquivos de origem (não usados pelo app nem cacheados pelo SW):
- `logo.jpeg` (foto antiga, preto e branco) e `icons/icon-2.png` (foto atual, colorida): fotos para gerar ícones e fotos de perfil. Estão no repo.
- `img/bob-2.mp4` (origem do `img/bob.webp` atual) e `icons/bob.mp4` (primeiro vídeo do Bob, trocado porque o usuário não gostou do resultado): estão no repo (o usuário os commitou), mas não são usados pelo app nem cacheados pelo SW.

## Especificação

1. **Nome do repo e do app**: `Agendei`. `start_url: "./"` e `scope: "./"`, sem `id` no manifest (ver "Notas técnicas"), então o manifest funciona com qualquer nome de repo.
2. **Funcionalidades**: adicionar item, marcar/desmarcar como feito (com fogos de artifício ao concluir), editar (texto, urgência e prazo), excluir item, limpar concluídos, contador de pendentes, estado vazio, aviso "vence hoje", boas-vindas do Bob Esponja ao abrir e ao voltar para o app. Uma única lista. Painel Personalizar (foto do perfil, plano de fundo e exportar/importar). Aviso de nova versão.
3. **Regras de negócio**:
   - Texto obrigatório após `trim()`; espaços internos repetidos viram um só.
   - Máximo de 200 caracteres (`maxlength` no input + corte no JS).
   - Itens duplicados são permitidos.
   - Adicionar é só o texto (urgência Normal, sem prazo); urgência e prazo são definidos no painel "Editar tarefa".
   - Ordem: ver "Urgência e prazo".
   - Excluir um item é direto, sem confirmação. "Limpar concluídos" pede `confirm()` porque apaga vários.
   - Na edição, texto vazio mantém o texto anterior (não exclui).
4. **Modelo do item**: `{ id: string, text: string, done: boolean, createdAt: number, doneAt: number | null, priority: "low" | "normal" | "high", dueDate: "AAAA-MM-DD" | null, dueTime: "HH:MM" | null }`. No storage, salvo como array JSON em `checklist.items.v1`. Datas e horas são do fuso do aparelho. `dueTime` só existe com `dueDate`. O `load()` valida cada item e descarta campos desconhecidos (`cleanItem` em `app.js`): itens antigos sem `priority`/`dueDate`/`dueTime`, ou com valores inválidos, ficam Normal e sem prazo. Ao acrescentar campos novos, atualize a validação e o mapeamento.
5. **Modelo das preferências**: `{ bgType: "default" | "color" | "photo", bgColor: "#rrggbb", bgPhoto: dataURL | null, bgBlur: 0–20, avatar: dataURL | "./avatars/avatar-1.png" | "./avatars/avatar-2.png" | null }`, salvo como JSON em `checklist.settings.v1`. Valor inválido ou corrompido volta para o padrão.
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
- **Aviso "vence hoje":** faixa amarela abaixo do cabeçalho com "N tarefas vencem hoje", contando só pendentes com prazo para hoje (vencidas de dias anteriores não contam). Tocar leva até a primeira delas (rola, destaca o card e foca o check); o "×" esconde até o app abrir ou voltar para a tela (`visibilitychange`). Sem número no ícone (descartado pelo usuário).
- **Relógio com o app aberto:** a cada 30 s o app compara um resumo dos estados de prazo (`clockSignature`) e só redesenha a lista se algo mudou (virada do dia, hora do prazo passando). O render devolve o foco ao mesmo controle; com o painel de edição aberto, espera.
- **Painel "Editar tarefa"** (lápis do card; `<dialog id="editor">`): texto, urgência (rádios), data, hora e botão "Sem prazo". Enter no texto salva, Esc ou "Cancelar" fecham sem salvar, e o foco volta ao lápis do card.

## Bob Esponja (boas-vindas)

- Ao abrir o app (evento `load`) e sempre que a pessoa volta para ele (`visibilitychange`), depois de 0,5 s, o Bob sobe do canto inferior esquerdo acenando, com o balão **"O que faremos hoje?"** à direita dele (a pontinha do balão aponta para o Bob, à esquerda; antes ficava do outro lado e o usuário pediu para trocar). Tocar no Bob ou no balão foca o campo "O que precisa fazer?" e ele sai. Ele também sai sozinho depois de 8 s ou quando o campo ganha foco. Não aparece se houver um painel aberto (`dialog[open]`) ou se o campo estiver com foco, e não reinicia a animação se ainda estiver na tela.
- O contêiner `#bob` tem `pointer-events: none` (só o Bob e o balão recebem toque), e com a faixa de atualização aberta (`body.has-update`) ele sobe para ficar acima dela. Com `prefers-reduced-motion`, o `<picture>` troca a animação por `img/bob-parado.png`.
- **Origem da imagem** (o mesmo processo serve para outros vídeos de fundo liso): `img/bob-2.mp4` (1280×720, 2,1 s, 24 quadros por segundo, fundo branco com faixas pretas em cima e embaixo). O primeiro vídeo (`icons/bob.mp4`) foi trocado por este a pedido do usuário. Como MP4 não tem transparência e WebM com transparência não funciona no iPhone, o vídeo virou **WebP animado com alfa** (funciona em Chrome, Edge, Android e Safari 14+), gerado por um script Node que dirige o Edge (sem ffmpeg nesta máquina), guardado fora do repo:
  - quadros: os 51 do vídeo (24 por segundo, nenhum descartado, para o aceno ficar suave), cada um pego no meio do seu tempo; o último emenda com o primeiro, então o loop não pula;
  - recorte: caixa com o Bob em todos os quadros + 8 px de margem, reduzida para 360 px de altura (140 px na tela × 3 de densidade no celular);
  - fundo: pixel quase branco e neutro (mínimo de RGB ≥ 225, diferença entre canais ≤ 24) ligado à borda vira transparente. Na faixa de 2 px entre o fundo e o Bob, o alfa sai por "cor para alfa" (o menor alfa que explica a cor como mistura com branco, com a cor descontaminada do branco e 4% de folga para o ruído de compressão), então o contorno fica suave e sem auréola branca em fundo escuro;
  - buracos (regiões brancas **fechadas**): o vão entre o braço que acena e a cabeça é reconhecido porque, em outros quadros, aqueles pixels são fundo ligado à borda (≥ 30% da região é fundo em ≥ 3 quadros); o vão entre o braço na cintura e o corpo nunca se abre (o braço não se mexe), então é marcado por um ponto fixo (776, 478). Olhos, dentes, camisa, mangas, meias e brilho do sapato nunca são fundo em quadro nenhum e ficam opacos;
  - entre os dedos: o borrão de movimento deixa pixels cinza-claro que não passam no teste de branco. Só na área por onde a mão passa (fundo em ≥ 3 outros quadros), pixel claro e sem cor (mínimo ≥ 150, diferença ≤ 50) também vira fundo; o amarelo da mão tem muita cor e não é afetado. Os triângulos cinza-escuro embaixo dos sapatos são sombra do desenho e ficam;
  - montagem: cada quadro sai do canvas como WebP (qualidade 0,85) e é empacotado num RIFF com `VP8X` (alfa + animação), `ANIM` (repetição infinita) e um `ANMF` por quadro (41–42 ms, sem mistura com o quadro anterior). Resultado: cerca de 1,2 MB. `img/bob-parado.png` é o primeiro quadro;
  - conferência: imagens de diagnóstico (fundo e buracos pintados) e o recorte ampliado sobre fundo escuro, procurando lascas e auréolas; `ImageDecoder` confirma animação, 51 quadros e repetição infinita.

## Painel Personalizar (`settings.js`)

Aberto pelo botão de engrenagem no topo. As mudanças valem na hora e são salvas em `checklist.settings.v1`.

- **Foto do perfil:** duas fotos prontas para tocar e escolher (`avatars/avatar-1.png` e `avatar-2.png`, 192 px, guardadas pelo caminho e no cache do SW), ou envio de outra imagem. A imagem enviada é recortada em quadrado (puxado para cima, onde costuma estar o rosto), reduzida para 192 px e salva em JPEG. Ela aparece como avatar redondo no topo e como ícone da aba do navegador. **O ícone do app instalado não muda** (ver "Limite do PWA").
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
- **Sem avisos com o app fechado:** notificação exigiria servidor (push, fora do escopo), e as APIs de agendamento local foram abandonadas ou não são confiáveis. Todos os avisos (vence hoje, nova versão, Bob) acontecem quando o app é aberto ou volta para a tela.

## Publicação (GitHub Pages)

- Settings → Pages → Source: **Deploy from a branch**, `main`, `/ (root)`. Já esteve como "GitHub Actions" sem workflow, o que deixava o site em 404: não voltar para Actions sem criar um workflow.
- Depois do push, o build leva cerca de 1 minuto. Para confirmar: `curl -s "https://mhenriquers.github.io/Agendei/sw.js?r=$RANDOM" | grep CACHE_NAME` deve mostrar a versão nova; `gh api repos/mhenriquers/Agendei/pages/builds/latest` mostra o status.

## Testar

Service worker não funciona em `file://`. Sirva por HTTP:

```
npx --yes http-server -c-1 -p 8000
```

Para simular o GitHub Pages (subpasta), rode o mesmo comando em `c:/dev` e abra `http://localhost:8000/Agendei/`. Para simular também o cache do Pages, use `-c600` no lugar de `-c-1`. O npx serve só para testar, nada entra no repo.

**Testes automatizados (fora do repo):** dá para dirigir o Edge sem janela pelo DevTools Protocol com um script Node (Node 24 tem `fetch` e `WebSocket` globais, sem instalar nada), guardado na pasta temporária (que pode ser apagada; recrie a partir daqui). Baterias que existiam, e o que cobriam:
- **geral (30):** aviso de nova versão (primeira visita sem recarregar, faixa, Atualizar, voltar para a tela, offline, 360 px, teclado) e painel Personalizar (cor, foto, desfoque, avatar enviado, dado corrompido);
- **prazo (28):** ordem, etiquetas, urgência efetiva, item antigo/inválido, aviso "vence hoje", painel Editar tarefa (Enter, Esc, texto vazio, hora sem data, Sem prazo), relógio passando e virada do dia;
- **exportar/importar (13):** download real, conteúdo do arquivo, confirmação, soma sem apagar, arquivos inválidos;
- **fotos de perfil (11):** escolher, ícone da aba, offline, remover, caminho desconhecido;
- **Bob (21):** aparece ao abrir e ao voltar, some sozinho, toque leva ao campo, não aparece com painel aberto ou campo em uso, fica acima da faixa, movimento reduzido, 360 px.

Cuidados aprendidos:
- `msedge --headless --screenshot` não renderiza larguras menores que ~500 px e fecha antes do SW verificar atualizações. Para larguras de celular e para testar o SW, use o protocolo (`Emulation.setDeviceMetricsOverride`, `Page.captureScreenshot`).
- Para testar atualização, sirva uma **cópia** do app com `-c600`, altere a cópia (a linha `CACHE_NAME = '…'`, não o comentário do topo, que também cita "checklist-v1") e recarregue.
- Relógio: congele a data com `Page.addScriptToEvaluateOnNewDocument` (uma classe `Date` com deslocamento ajustável) para testar prazos sem depender do dia real.
- Foco: sem `Emulation.setFocusEmulationEnabled`, o Edge sem janela não dispara eventos de `focus`.
- Teclado: Enter simulado precisa de `text: "\r"` no `Input.dispatchKeyEvent` para enviar o formulário.
- `DOM.setFileInputFiles` simula a escolha de arquivos; `Browser.setDownloadBehavior` deixa baixar de verdade; `Page.javascriptDialogOpening` + `Page.handleJavaScriptDialog` respondem ao `confirm()`.
- `ImageDecoder` confere se um WebP é animado e lê quadros específicos.
- Servidor iniciado em segundo plano dentro de um comando com pipe (`… | grep`) prende o pipe e o comando nunca termina: inicie com `</dev/null >/dev/null 2>&1` também no subshell, ou antes do comando.

## Ambiente de desenvolvimento

- Windows 11, com Git Bash e PowerShell 5.1. Node 24 instalado (só para testar). **Python não está instalado.** `gh` (GitHub CLI) está autenticado no repo.
- Edge em `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.
- Imagens (ícones, recortes) são geradas com PowerShell + `System.Drawing`.
- Arquivos longos com aspas e acentos: prefira escrevê-los com a ferramenta de escrita de arquivos em vez de heredoc no bash (o heredoc falhou mais de uma vez).
