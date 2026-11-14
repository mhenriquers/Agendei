# Tarefas — Agendei

Contexto, regras e especificação estão no `claude.md`.

## T2 — Urgência e prazo

Decidido com o usuário:

- **Urgência por item:** 3 níveis (Baixa, Normal, Alta; padrão Normal). Visual proposto: faixa colorida na lateral do card + etiqueta; Normal sem faixa. Cores já definidas na paleta (ver `claude.md`).
- **Prazo com data e hora.** No card: se o prazo é **hoje**, mostra só a hora ("14:30"); se é **outro dia**, mostra a data ("Sex, 21/11"). Prazo vencido aparece como atrasado.
- **Aviso de vencimento:** sem servidor, aparece quando o app é aberto ou volta para a tela. Conta **só as tarefas que vencem hoje** (pendentes). Concluídas nunca contam.
- **Urgência efetiva:** no dia do prazo (ou depois de vencido), o card **vira Alta automaticamente**. A urgência escolhida pelo usuário não é apagada: se o prazo for mudado para outro dia, o card volta a ela.
- **Ordem dos pendentes:** por urgência efetiva (Alta → Normal → Baixa); dentro do mesmo nível, prazo mais próximo primeiro (atrasadas no topo), sem prazo por último; empate pelo mais novo. Concluídos continuam embaixo.
- **Sem número no ícone** (Badging API descartada pelo usuário).
- **Adicionar continua rápido** (proposta): o formulário segue só com texto; urgência e prazo ficam no editor do card (lápis) ou num "+ detalhes".

Passos:

- [ ] **T2.1** Usuário responder o que está em aberto:
  - A hora é opcional (prazo só com data)? Proposta: sim; sem hora, no dia mostra "Hoje".
  - Em outro dia, mostra só a data ou data e hora?
  - "Filtrar por urgência" é só a ordem acima ou também botões de filtro (Todas / Alta / Normal / Baixa)? Proposta: só a ordem.
- [ ] **T2.2** Destrinchar esta tarefa em passos triviais (modelo do item com os campos novos e compatibilidade com itens antigos, editor do card, etiquetas, aviso, ordem, recálculo a cada minuto para a virada de "hoje" com o app aberto, testes) antes de implementar.
- [ ] **T2.3** Implementar, testar e atualizar a especificação no `claude.md` (modelo do item, regras de negócio e ordem).

## T3 — Outras ideias (ainda não decididas)

- [ ] **T3.1** Exportar/importar a lista (arquivo ou texto), para levar os itens de um aparelho para outro sem servidor.
- [ ] **T3.2** Duas fotos de perfil prontas no painel Personalizar (a de `logo.jpeg` e a de `icons/icon-2.png`, em `avatars/` como PNG de 192 px), além do envio de foto.
- [ ] **T3.3** Desenho do Bob Esponja: o usuário vai fornecer o arquivo; posição ainda não definida (a prévia usou um espaço no canto do cabeçalho).
