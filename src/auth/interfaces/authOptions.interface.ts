import { ClientMetadata } from 'openid-client';
import { StrategyTypes } from './strategyTypes.enum';

export interface IAuthOptions {
  strategyType: StrategyTypes;
  clientMetaData: ClientMetadata;

}
