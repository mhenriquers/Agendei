# Tarefas — Agendei

Contexto, regras e especificação estão no `claude.md`.

- [ ] **T1** Ícones com a foto nova: gerar `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` a partir de `icons/icon-2.png`, com o mesmo processo da foto anterior (maskable com a foto em círculo de 80% sobre fundo sólido). Incrementar `CACHE_NAME`.
- [ ] **T2** Corrigir o ID do app: remover a linha `"id": "./"` do `manifest.webmanifest` e incrementar `CACHE_NAME`. Depois, desinstalar e instalar o app de novo no PC e no celular.
- [ ] **T3** (Opcional) Janela de instalação com capturas de tela: gerar 2 PNG em `screenshots/`, um de PC (ex.: 1280×800, `"form_factor": "wide"`) e um de celular (ex.: 390×844, sem `form_factor`). Declarar em `"screenshots"` no manifest com caminhos `./screenshots/...`, incluir na lista `ASSETS` e incrementar `CACHE_NAME`.
- [ ] **T4** Opção para o usuário trocar o ícone do app enviando uma imagem, tratada como no T1 (os três tamanhos). Antes, decidir o que fazer com o limite do PWA descrito no `claude.md`: o ícone instalado não muda depois da instalação.
- [ ] **T5** Opção para trocar o plano de fundo: cor sólida ou foto, com a opção de desfocar a foto.
