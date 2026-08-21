import { Module } from '@nitrostack/core';
import { OAuthService } from '../../services/oauth.service.js';
import { NimroboClientService } from '../../services/nimrobo-client.service.js';
import { OutcomeAnalyticsTools } from './outcome-analytics.tools.js';
import { OutcomeDispatcherTools } from './outcome-dispatcher.tools.js';
import { NimroboPrompts } from './nimrobo.prompts.js';
import { NimroboResources } from './nimrobo.resources.js';

@Module({
  name: 'nimrobo',
  description: 'Nimrobo AI module for Outcome Analytics and Local Run Dispatcher',
  controllers: [
    OutcomeAnalyticsTools,
    OutcomeDispatcherTools,
    NimroboPrompts,
    NimroboResources,
  ],
  providers: [
    OAuthService,
    NimroboClientService,
  ],
  exports: [
    OAuthService,
    NimroboClientService,
  ],
})
export class NimroboModule {}
