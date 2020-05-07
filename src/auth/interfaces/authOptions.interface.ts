import { ClientMetadata } from 'openid-client';
import { StrategyTypes } from './strategyTypes.enum';

export interface AuthOptions {
    strategyType: StrategyTypes;
    clientMetaData: ClientMetadata;
}
