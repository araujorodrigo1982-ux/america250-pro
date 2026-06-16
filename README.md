# America250 Pro — Servidor Local

Monitor profissional de memecoin Solana com dados on-chain reais.

## Por que usar o servidor local?

Quando você abre o arquivo HTML diretamente (`file://`), o browser bloqueia
todas as chamadas a APIs externas por política de segurança (CORS).

O servidor local resolve isso fazendo as chamadas no Node.js,
que não tem essa restrição.

---

## Instalação com Claude Code

### 1. Instalar Claude Code (se ainda não tiver)

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Abrir o projeto

```bash
cd ~/Downloads/america250-server
claude
```

### 3. Pedir ao Claude Code para iniciar

Dentro do Claude Code, diga:
> "Inicie o servidor do America250 Pro"

O Claude Code vai executar `node server.js` e abrir o browser automaticamente.

---

## Uso manual (sem Claude Code)

### Pré-requisitos
- Node.js 18 ou superior: https://nodejs.org

### Iniciar

```bash
cd america250-server
node server.js
```

### Acessar

```
http://localhost:3000
```

---

## O que o servidor faz

| Rota | Função |
|------|--------|
| `GET /` | Serve o painel HTML |
| `GET /api/whales?token=XXX` | Busca top 20 holders via Solana RPC real |
| `GET /api/price?token=XXX` | Busca preço via DEXScreener |
| `GET /api/health` | Verifica se o servidor está rodando |

---

## Estrutura

```
america250-server/
├── server.js          ← Servidor Node.js
├── package.json       ← Configuração
├── README.md          ← Este arquivo
└── public/
    └── index.html     ← Painel America250 Pro V6
```

---

## Token monitorado

**America250 (AMERICA250)**  
Contrato: `USAyjsvuR5A8YPTZy1vnG59soGWJgk6AzPWmeqX2k1B`  
Rede: Solana  

Para trocar o token, acesse a aba **⚙️ Config** dentro do painel.
