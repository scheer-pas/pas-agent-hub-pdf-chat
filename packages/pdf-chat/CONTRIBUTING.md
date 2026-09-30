# Working on PDF Chat

What the page, the configuration and the endpoint do is described in the [README](README.md).

## Run it locally

1. Add your OpenAI API key for the agent to `service/impl/src/config/local/config.json`. The file is git-ignored, so the key stays on your machine:

   ```json
   {
     "agents": {
       "pdfChat": { "model": { "apiKey": "sk-..." } }
     }
   }
   ```

2. Point the app at the local service in `app/impl/public/config/local/config.json5`. The file is git-ignored too:

   ```json5
   {
     clients: {
       service: { baseUrl: 'http://localhost:8080' },
     },
   }
   ```

3. From the workspace root, start the app and the service:

   ```bash
   npx pas start
   ```

4. Open [http://localhost:4200](http://localhost:4200), add one or more PDFs and ask a question.

The service runs on [http://localhost:8080](http://localhost:8080). Its OpenAPI document, including `POST /pdf-chat/ask`, is at [http://localhost:8080/docs](http://localhost:8080/docs).

## Try the endpoint without the app

```bash
DATA=$(base64 < my.pdf | tr -d '\n')
curl -N -X POST http://localhost:8080/pdf-chat/ask \
  -H 'Content-Type: application/json' \
  -d "{\"question\":\"Summarize the documents\",\"documents\":[{\"name\":\"my.pdf\",\"data\":\"$DATA\"}]}"
```

`-N` prints the answer while it streams in.

## Tests

```bash
npx nx test pdf-chat-app
npx nx test pdf-chat-service
npx nx test pdf-chat-service-client
npx nx test pdf-chat-service-types
```
