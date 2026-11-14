# Tarefas — Agendei

Contexto, regras e especificação estão no `claude.md`.

As tarefas T1 a T6 foram feitas (aviso de nova versão, ícones da foto nova, manifest sem `id`, capturas de tela, foto do perfil e plano de fundo). Restam só verificações manuais nos aparelhos, depois da publicação.

- [ ] **M1** Destravar os aparelhos que já têm o app (só desta vez). Eles estão com uma versão antiga do service worker, que não mostra a faixa de atualização.
  - PC: abrir o app, Ctrl+Shift+I → Aplicativo → Service workers → **Cancelar registro**, fechar o DevTools e apertar Ctrl+Shift+R. (Não apaga os itens.)
  - Celular: abrir https://mhenriquers.github.io/Agendei/ numa aba normal do navegador, recarregar duas vezes e depois fechar o app instalado por completo (tirar dos recentes).
- [ ] **M2** Reinstalar o app no PC e no celular. O manifest perdeu o `id`, então o navegador trata como outro app: desinstalar o antigo e instalar de novo. Conferir o ícone novo (foto nova) e a janela de instalação com as capturas de tela (Chrome no PC e no Android).
- [ ] **M3** No celular, testar o painel Personalizar (engrenagem no topo): escolher foto do perfil, cor sólida, foto de fundo e desfoque. Confirmar que o seletor de arquivos abre a galeria e que tudo continua igual depois de fechar e abrir o app.
- [ ] **M4** Na próxima publicação (qualquer mudança com `CACHE_NAME` incrementado), confirmar que a faixa "Nova versão disponível" aparece no PC e no celular e que **Atualizar** carrega a versão nova.
