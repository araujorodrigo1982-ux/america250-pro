# America250 Pro — Claude Code Context

## O que é este projeto

Monitor profissional de memecoin Solana.
Token: America250 (USAyjsvuR5A8YPTZy1vnG59soGWJgk6AzPWmeqX2k1B)

## Como rodar

```bash
node server.js
```

Abre em: http://localhost:3000

## Estrutura

- `server.js` — servidor HTTP Node.js com proxy Solana RPC
- `public/index.html` — painel completo (HTML + CSS + JS inline)

## APIs que o servidor proxifica

- `GET /api/whales?token=XXX` → Solana RPC `getTokenLargestAccounts`
- `GET /api/price?token=XXX`  → DEXScreener API
- `GET /api/health`           → health check

## Comandos úteis

```bash
# Iniciar servidor
node server.js

# Verificar se está rodando
curl http://localhost:3000/api/health

# Testar dados de baleias
curl "http://localhost:3000/api/whales?token=USAyjsvuR5A8YPTZy1vnG59soGWJgk6AzPWmeqX2k1B"

# Testar preço
curl "http://localhost:3000/api/price?token=USAyjsvuR5A8YPTZy1vnG59soGWJgk6AzPWmeqX2k1B"
```

## Posição do usuário

- Tokens: 1438.15732 America250
- Investido: $44.39 USD
- Preço médio: ~$0.0309

## Notas importantes

- Não precisa de dependências externas (zero npm install)
- Usa apenas módulos nativos do Node.js (http, https, fs, path, url)
- Node.js 18+ recomendado
