import { Axios } from 'axios';

/**
 * Calls the PDF chat service. The address of the service comes from the
 * configuration of the app.
 */
export class PdfChatServiceClient {
  /**
   * @param axios The HTTP client, configured with the address of the service.
   */
  public constructor(protected readonly axios: Axios) {}
}
