import { PasAppModule } from '@pas/ng-app-api';
import ServiceClient from '@pas-agent-hub-pdf-chat/pdf-chat-service-client';
import { AppComponent } from './app.component';

@PasAppModule({
  axiosBasedClients: [
    {
      provide: ServiceClient,
      configKey: 'clients.service',
    },
  ],
  rootComponents: [AppComponent],
})
export class AppModule {}
