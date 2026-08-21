import { ResourceDecorator as Resource, ExecutionContext, Injectable } from '@nitrostack/core';
import { NimroboClientService } from '../../services/nimrobo-client.service.js';

@Injectable({ deps: [NimroboClientService] })
export class NimroboResources {
  constructor(private nimroboClient: NimroboClientService) {}

  @Resource({
    uri: 'nimrobo://outcomes/catalog',
    name: 'Nimrobo Outcomes Catalog',
    description: 'Real-time JSON catalog of all configured optimization outcomes and their metrics',
    mimeType: 'application/json',
  })
  async getOutcomesCatalog(_ctx: ExecutionContext) {
    const outcomes = await this.nimroboClient.getOutcomes();
    return {
      contents: [
        {
          uri: 'nimrobo://outcomes/catalog',
          mimeType: 'application/json',
          text: JSON.stringify(outcomes, null, 2),
        },
      ],
    };
  }

  @Resource({
    uri: 'nimrobo://user/profile',
    name: 'Authenticated Nimrobo Profile',
    description: 'Details and organization context for the authenticated Nimrobo user',
    mimeType: 'application/json',
  })
  async getUserProfileResource(_ctx: ExecutionContext) {
    const profile = await this.nimroboClient.getUserProfile();
    return {
      contents: [
        {
          uri: 'nimrobo://user/profile',
          mimeType: 'application/json',
          text: JSON.stringify(profile, null, 2),
        },
      ],
    };
  }
}
