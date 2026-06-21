# Projeto pronto para commit no GitHub: geracard

Este pacote contém o dashboard completo em HTML + app.js, com persistência automática de dados no GitHub via Netlify Functions.

## Arquivos principais
- `index.html`
- `app.js`
- `data/records.json`
- `netlify.toml`
- `package.json`
- `netlify/functions/*`

## Fluxo
- Leitura: `/api/load-records`
- Gravação: `/api/save-records`
- Diagnóstico: `/api/health`

## Variáveis de ambiente no Netlify
Use os valores do arquivo `.env.example` e ajuste o `GITHUB_OWNER` para o usuário/organização que contém o repositório `geracard`.
