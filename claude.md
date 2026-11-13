# Agendei — PWA Checklist

App de checklist (uma única lista) feito como PWA estático e publicado no GitHub Pages.

## Como trabalhar neste repo

- O plano está em `task.md`. Siga a ordem das tarefas e marque `[x]` em cada subtarefa concluída.
- Em caso de dúvida, as seções "Decisões travadas" e "Decisões do projeto" do `task.md` são a especificação.

## Regras que não podem ser quebradas

- HTML, CSS e JS puros. Sem build, sem npm no projeto, sem framework, sem dependências externas.
- **Todos os caminhos relativos** (`./arquivo`). Nada começando com `/`: o Pages serve em `usuario.github.io/Agendei/`, e caminho absoluto dá 404. Vale para `<link>`, `<script>`, `start_url`, `scope`, registro do SW e lista de cache do SW.
- Ícones são PNG reais em `icons/`, nada de data URI.
- Persistência só em `localStorage`, chave `checklist.items.v1`.
- Fora do escopo: login, backend, notificações, múltiplas listas.
- Texto digitado pelo usuário entra na página só via `textContent`, nunca `innerHTML`.
- **Ao alterar qualquer arquivo servido, incremente `CACHE_NAME` em `sw.js`** e mantenha a lista `ASSETS` igual aos arquivos reais.

## Testar

Service worker não funciona em `file://`. Sirva por HTTP:

```
npx --yes http-server -c-1 -p 8000
```

Para simular o GitHub Pages (subpasta), rode o mesmo comando em `c:/dev` e abra `http://localhost:8000/Agendei/`.
