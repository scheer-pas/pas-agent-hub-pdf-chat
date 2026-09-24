import { AgentModule } from '@pas/agent-module';
import { createPasModule } from '@pas/module';
import { PasServiceNestjsExpressModule } from '@pas/service-nestjs-express-module';
import defaultConfig from './config/default/config.json';

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
 * Add your own feature modules to the array.
 */
(async function () {
  try {
    createPasModule([
      await PasServiceNestjsExpressModule.register({
        cors: true,
        config: { defaultConfig },
      }),
      AgentModule,
    ]);
  } catch (err) {
    console.error(err);
  }
})();
