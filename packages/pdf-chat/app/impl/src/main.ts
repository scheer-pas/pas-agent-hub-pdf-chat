import { createPasModule } from '@pas/module';
import { PasAppPasModule } from '@pas/ng-app-module';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';
import defaultConfig from '../public/config/default/config.json';

(async function () {
  try {
    createPasModule({
      imports: [
        await PasAppPasModule.register({
          ...environment.pasAppOptions,
          config: {
            ...environment.pasAppOptions.config,
            defaultConfig,
          },
          appConfig,
        }),
        AppModule,
      ],
    });
  } catch (err) {
    console.error(err);
  }
})();
