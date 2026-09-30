import { NestExpressApplication } from '@nestjs/platform-express';
import { AgentModule } from '@pas/agent-module';
import { createPasModule } from '@pas/module';
import { PasServiceNestjsExpressModule } from '@pas/service-nestjs-express-module';
import { PdfChatModule } from './pdf-chat';
import defaultConfig from './config/default/config.json';

/**
 * Largest JSON request body the service accepts. A PDF chat request carries
 * PDFs of up to 10 MB together, base64-encoded, which grows to about 14 MB.
 */
const JSON_BODY_LIMIT = '15mb';

/**
 * Service entry point.
 *
 * `createPasModule` bootstraps the PAS dependency-injection container and
 * starts the Express HTTP server on port 8080.
 *
 * `PasServiceNestjsExpressModule.register` wires up the shared service
 * infrastructure that every PAS service gets out of the box:
 *   - GET /health          — liveness probe consumed by Kubernetes
 *   - GET /docs        — interactive OpenAPI (Swagger) UI
 *   - GET /docs-json   — machine-readable OpenAPI document
 *   - Config loading from  src/config/ (see config/default/config.json)
 *   - Structured logging via the PAS logger
 *   - Helmet security headers (enabled by default)
 *
 * Pass options to customise the base behaviour, e.g.:
 *   openapi: { title: 'My API' }   — set a custom API title
 *   openapi: false                 — disable the OpenAPI endpoint
 *   cors: false                    — disable CORS (enabled here for local dev)
 *   compression: true              — enable response compression
 *
 * Add your own feature modules to the array alongside PdfChatModule.
 */
(async function () {
  try {
    createPasModule([
      await PasServiceNestjsExpressModule.register({
        cors: true,
        config: { defaultConfig },
        beforeListenHooks: [
          (app: NestExpressApplication): void => {
            app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
          },
        ],
      }),
      AgentModule,
      PdfChatModule,
    ]);
  } catch (err) {
    console.error(err);
  }
})();
