# Publicacao

## Rodar localmente

No terminal:

```powershell
cd C:\Users\Fidelis\Documents\novo
npm start
```

Depois abra:

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Estrutura

- [index.html](C:/Users/Fidelis/Documents/novo/index.html): landing
- [styles.css](C:/Users/Fidelis/Documents/novo/styles.css): visual
- [script.js](C:/Users/Fidelis/Documents/novo/script.js): envio do formulario
- [server.js](C:/Users/Fidelis/Documents/novo/server.js): servidor e API
- [data/leads.json](C:/Users/Fidelis/Documents/novo/data/leads.json): leads captados

## Endpoints

- `GET /api/health`
- `GET /api/leads/count`
- `POST /api/leads`

## Publicar em Railway ou Render

### Railway

1. Suba esta pasta para um repositório Git.
2. Crie um novo projeto no Railway.
3. Conecte o repositório.
4. Defina o start command como `npm start`.
5. Publique.

### Render

1. Crie um novo Web Service.
2. Conecte o repositório.
3. Build command: deixe vazio.
4. Start command: `npm start`.
5. Publique.

## Observacao importante

Hoje os leads sao salvos em arquivo local. Para producao real, o ideal e trocar por banco ou planilha central, porque discos efemeros podem apagar dados em alguns provedores.

O caminho mais simples para a proxima etapa seria:

- Supabase
- Airtable
- Google Sheets via webhook
