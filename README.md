# Visualizador de NF-e em lote (Netlify)

App estático + 3 Netlify Functions que funcionam como proxy para a API
gratuita da [consultadanfe.com](https://consultadanfe.com/api), evitando o
bloqueio de CORS que ocorre ao chamar a API direto do navegador.

## Estrutura

```
.
├── netlify.toml
├── package.json
├── public/
│   └── index.html          ← o app (frontend)
└── netlify/
    └── functions/
        ├── consulta.js     ← proxy para POST /api/v1/consulta (por chave)
        ├── danfe.js        ← proxy para POST /api/v1/danfe (por XML)
        └── etiqueta.js     ← proxy para POST /api/v1/danfe/etiqueta-html
```

O frontend chama `/.netlify/functions/consulta`, `/.netlify/functions/danfe`
e `/.netlify/functions/etiqueta` — que rodam no servidor da Netlify e repassam
a chamada para a API real. Como é servidor-a-servidor, CORS não se aplica.

## Deploy — pelo site da Netlify (mais simples)

1. Crie uma conta em [app.netlify.com](https://app.netlify.com) (grátis).
2. Suba esta pasta inteira para um repositório no GitHub (ou GitLab/Bitbucket).
3. No painel da Netlify: **Add new site → Import an existing project** →
   conecte o repositório.
4. Configurações de build, deixe como está (o `netlify.toml` já define tudo):
   - Build command: (vazio)
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
5. Clique em **Deploy site**. Pronto — a Netlify detecta as functions
   automaticamente pela pasta `netlify/functions`.

## Deploy — pela CLI (alternativa)

```bash
npm install -g netlify-cli
cd nfe-viewer-netlify
netlify login
netlify init      # ou: netlify deploy --prod
```

## Testar localmente com as functions rodando

A CLI da Netlify simula as functions localmente:

```bash
npm install -g netlify-cli
cd nfe-viewer-netlify
netlify dev
```

Isso abre em algo como `http://localhost:8888`, já com
`/.netlify/functions/*` funcionando — **não precisa mais do Live Server**,
porque sem a CLI as functions não existem para responder.

## Por que isso resolve o "Failed to fetch"

A API `consultadanfe.com` não libera CORS para chamadas feitas diretamente
do navegador a partir de `localhost`/`127.0.0.1` (ou não é confiável o
suficiente para isso). As três functions aqui rodam no backend da Netlify e
fazem a chamada `fetch` de servidor para servidor — o navegador nunca fala
direto com `consultadanfe.com`, então a política de CORS do navegador nem
entra em jogo.
